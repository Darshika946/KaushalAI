import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

/**
 * Singleton state tracking for MongoDB connection
 */
let isConnecting = false;
let connectionPromise = null;
let listenersInitialized = false;

/**
 * Register connection event listeners once
 */
const initEventListeners = () => {
  if (listenersInitialized) return;

  mongoose.connection.on("connected", () => {
    console.log(`[MongoDB] Connected successfully to host: ${mongoose.connection.host} (DB: ${mongoose.connection.name})`);
  });

  mongoose.connection.on("error", (err) => {
    console.error(`[MongoDB] Runtime connection error: ${err.message}`);
  });

  mongoose.connection.on("disconnected", () => {
    console.warn("[MongoDB] Connection disconnected.");
  });

  mongoose.connection.on("reconnected", () => {
    console.log("[MongoDB] Connection re-established.");
  });

  // Graceful shutdown on process termination
  const handleGracefulShutdown = async (signal) => {
    try {
      if (mongoose.connection.readyState !== 0) {
        await mongoose.connection.close();
        console.log(`[MongoDB] Connection closed through ${signal} event.`);
      }
      process.exit(0);
    } catch (err) {
      console.error(`[MongoDB] Error during ${signal} shutdown:`, err);
      process.exit(1);
    }
  };

  process.on("SIGINT", () => handleGracefulShutdown("SIGINT"));
  process.on("SIGTERM", () => handleGracefulShutdown("SIGTERM"));

  listenersInitialized = true;
};

/**
 * Singleton MongoDB connection handler
 * Ensures only one connection instance is created and shared across the application.
 *
 * @returns {Promise<typeof mongoose>} Active Mongoose connection instance
 */
export const connectMongoDB = async () => {
  // If already connected, reuse existing connection (readyState 1 = connected)
  if (mongoose.connection.readyState === 1) {
    return mongoose;
  }

  // If currently in the process of connecting, reuse the pending promise (readyState 2 = connecting)
  if (isConnecting && connectionPromise) {
    return connectionPromise;
  }

  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;

  if (!uri) {
    const errorMsg = "MongoDB Connection Error: Neither MONGODB_URI nor MONGO_URI is defined in your .env file.";
    console.error(`[MongoDB] Error: ${errorMsg}`);
    throw new Error(errorMsg);
  }

  initEventListeners();

  isConnecting = true;

  const options = {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    maxPoolSize: 10,
    autoIndex: true,
  };

  connectionPromise = (async () => {
    try {
      await mongoose.connect(uri, options);
      isConnecting = false;
      return mongoose;
    } catch (error) {
      isConnecting = false;
      connectionPromise = null;
      console.error(`[MongoDB] Connection failed: ${error.message}`);
      throw error;
    }
  })();

  return connectionPromise;
};

/**
 * Utility to close the connection manually (useful in tests or server restarts)
 */
export const disconnectMongoDB = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
    console.log("[MongoDB] Connection manually closed.");
  }
};

/**
 * Utility to check current connection health/state
 */
export const getConnectionStatus = () => {
  const states = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting",
  };
  return states[mongoose.connection.readyState] || "unknown";
};

export default connectMongoDB;