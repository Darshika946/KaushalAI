import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

/**
 * Global connection cache to prevent multiple connections in development/serverless
 */
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

/**
 * Establishes a cached connection to MongoDB using Mongoose.
 * @returns {Promise<typeof mongoose>} Mongoose instance
 */
export const connectDB = async () => {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;

  if (!uri) {
    throw new Error("MONGODB_URI environment variable is not defined in .env");
  }

  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: true,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };

    // Attach lifecycle listeners
    if (mongoose.connection.listenerCount("connected") === 0) {
      mongoose.connection.on("connected", () => {
        console.log(`[MongoDB] Connected to database: ${mongoose.connection.name}`);
      });

      mongoose.connection.on("error", (err) => {
        console.error(`[MongoDB] Connection error: ${err.message}`);
      });

      mongoose.connection.on("disconnected", () => {
        console.warn("[MongoDB] Connection disconnected");
      });
    }

    cached.promise = mongoose.connect(uri, opts).then((mongooseInstance) => {
      return mongooseInstance;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    cached.conn = null;
    throw e;
  }

  return cached.conn;
};

/**
 * Checks whether MongoDB connection is currently active
 * @returns {boolean} true if connected (readyState === 1)
 */
export const isDBConnected = () => {
  return mongoose.connection.readyState === 1;
};

/**
 * Disconnects from MongoDB (useful for test teardown or graceful shutdown)
 */
export const disconnectDB = async () => {
  if (cached.conn) {
    await mongoose.connection.close();
    cached.conn = null;
    cached.promise = null;
    console.log("[MongoDB] Connection closed successfully");
  }
};

export default connectDB;
