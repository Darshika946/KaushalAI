import express from "express";
import {
  generateQuestionsController,
  evaluateAnswerController,
  chatController,
  generateResumeController,
} from "../controllers/ai.controller.js";

const router = express.Router();

// Generate domain-specific mock interview questions
router.post("/generate-questions", generateQuestionsController);

// Evaluate candidate's interview answer
router.post("/evaluate-answer", evaluateAnswerController);

// Chat with AI tutor / career mentor
router.post("/chat", chatController);

// Generate structured resume data adhering to universal schema
router.post("/generate-resume", generateResumeController);

export default router;

