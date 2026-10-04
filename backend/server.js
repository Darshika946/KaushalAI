import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import { connectDB } from "./lib/db.js";
import authRoute from "./routes/auth.route.js";
import aiRoute from "./routes/ai.route.js";

dotenv.config();

const app = express();

app.use(
  cors({
    origin: ["http://localhost:3000", "https://kaushalai.onrender.com", "http://localhost:5173"],
    credentials: true,
  })
);

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const PORT = process.env.PORT || 8000;

// API routes
app.use("/api/v1/auth", authRoute);
app.use("/api/v1/ai", aiRoute);
app.use("/", aiRoute); // Compatibility alias for root endpoints (/generate-questions, /evaluate-answer, /chat)


app.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT}`);
  try {
    await connectDB();
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error.message);
  }
});

