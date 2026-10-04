import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { connectDB, isDBConnected } from "./lib/db.js";
import authRoute from "./routes/auth.route.js";
import aiRoute from "./routes/ai.route.js";

dotenv.config();

if (process.env.RENDER) {
  process.env.NODE_ENV = "production";
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  "https://kaushalai.onrender.com",
  "https://kaushalai-sigma.vercel.app",
  "https://kaushalai-81ixgpyuf-ds6-f1e1.vercel.app",
];

if (process.env.CLIENT_ORIGIN) {
  process.env.CLIENT_ORIGIN.split(",").forEach((origin) => {
    const trimmed = origin.trim();
    if (trimmed && !allowedOrigins.includes(trimmed)) {
      allowedOrigins.push(trimmed);
    }
  });
}

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (such as curl, mobile apps, or server-to-server)
      if (!origin) {
        return callback(null, true);
      }

      // Allow explicitly configured origins (local development and CLIENT_ORIGIN)
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      // Automatically support Vercel preview and production subdomains
      if (/^https:\/\/[a-zA-Z0-9_.-]+\.vercel\.app$/.test(origin)) {
        return callback(null, true);
      }

      // Strictly reject all other origins
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const PORT = process.env.PORT || 8000;

// Database connection readiness check middleware for auth routes
app.use("/api/v1/auth", async (req, res, next) => {
  try {
    if (!isDBConnected()) {
      await connectDB();
    }
    next();
  } catch (dbErr) {
    console.error("Database connection failure on auth route:", dbErr.message);
    return res.status(503).json({
      error: "Database service unavailable. Please check MONGODB_URI and MongoDB Atlas network access.",
    });
  }
});

// API routes
app.use("/api/v1/auth", authRoute);
app.use("/api/v1/ai", aiRoute);
app.use("/", aiRoute); // Root aliases for /generate-questions, /evaluate-answer, /chat, /generate-resume

// Health check endpoint
app.get("/health", (req, res) => {
  const dbConnected = isDBConnected();
  res.status(dbConnected ? 200 : 503).json({
    status: dbConnected ? "healthy" : "degraded",
    database: dbConnected ? "connected" : "disconnected",
    service: "KaushalAI API",
    timestamp: new Date().toISOString(),
  });
});

// Serve production static assets if frontend dist build is present
const distPath = path.resolve(__dirname, "../frontend/dist");
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get("*", (req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
} else {
  app.get("/", (req, res) => {
    res.status(200).json({ status: "healthy", service: "KaushalAI API", timestamp: new Date().toISOString() });
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  if (err.message && (err.message === "Not allowed by CORS" || err.message.startsWith("CORS"))) {
    return res.status(403).json({ success: false, message: err.message });
  }
  console.error("Unhandled server error:", err);
  res.status(500).json({ success: false, message: "Internal server error" });
});

const startServer = async () => {
  try {
    await connectDB();
  } catch (error) {
    console.error("Initial MongoDB connection attempt failed:", error.message);
  }

  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
};

startServer();
