import express from "express";
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import {
  getDailyDSA,
  executeDSACode,
  getDSAHint,
  getDailyArticle,
  markArticleRead,
  getWeeklyProjectDetails,
  submitWeeklyProject,
  updateCourseModuleProgress,
  getUserChallengeStats,
} from "../controllers/challenges.controller.js";

const router = express.Router();

/**
 * Optional Auth Middleware: Attaches req.user if valid token present without blocking unauthenticated previews
 */
const optionalAuth = async (req, res, next) => {
  try {
    const token =
      req.cookies?.jwt ||
      req.cookies?.accessToken ||
      (req.headers.authorization && req.headers.authorization.startsWith("Bearer ")
        ? req.headers.authorization.split(" ")[1]
        : null);

    if (token && process.env.JWT_SECRET) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (decoded?.userId) {
        const user = await User.findById(decoded.userId).select("-password");
        if (user) req.user = user;
      }
    }
  } catch (err) {
    // Session token invalid or expired, continue as guest
  }
  next();
};

// Section 1: Daily Challenges
router.get("/daily/dsa", optionalAuth, getDailyDSA);
router.post("/daily/dsa/execute", optionalAuth, executeDSACode);
router.post("/daily/dsa/hint", optionalAuth, getDSAHint);
router.get("/daily/article", optionalAuth, getDailyArticle);
router.post("/daily/article/read", optionalAuth, markArticleRead);

// Section 2: Weekly Challenges
router.get("/weekly/project", optionalAuth, getWeeklyProjectDetails);
router.post("/weekly/project/submit", optionalAuth, submitWeeklyProject);
router.post("/weekly/course/progress", optionalAuth, updateCourseModuleProgress);

// User Progress & Streaks
router.get("/stats", optionalAuth, getUserChallengeStats);

export default router;
