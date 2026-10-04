import {
  generateInterviewQuestions,
  evaluateInterviewAnswer,
  chatWithAITutor,
  generateResumeData,
} from "../lib/gemini.js";

/**
 * Controller: Generate Interview Questions
 * POST /api/v1/ai/generate-questions
 */
export const generateQuestionsController = async (req, res) => {
  try {
    const { domain, language, interview_type, difficulty, num, num_questions } = req.body;

    if (!domain) {
      return res.status(400).json({ error: "Field 'domain' is required" });
    }

    const questionCount = parseInt(num_questions || num || 5, 10);

    const questions = await generateInterviewQuestions({
      domain,
      language: language || "English",
      interview_type: interview_type || "Technical",
      difficulty: difficulty || "Medium",
      num_questions: questionCount,
    });

    return res.status(200).json({ questions });
  } catch (error) {
    console.error("Error in generateQuestionsController:", error);

    // Check for quota or rate limit issues
    if (error.message?.includes("RESOURCE_EXHAUSTED") || error.status === 429) {
      return res.status(429).json({
        error: "Gemini API quota exceeded. Please check your plan or try again later.",
      });
    }

    return res.status(500).json({
      error: `Failed to generate questions: ${error.message}`,
    });
  }
};

/**
 * Controller: Evaluate Interview Answer
 * POST /api/v1/ai/evaluate-answer
 */
export const evaluateAnswerController = async (req, res) => {
  try {
    const { question, answer, language } = req.body;

    if (!question || answer === undefined) {
      return res.status(400).json({ error: "Fields 'question' and 'answer' are required" });
    }

    const evaluation = await evaluateInterviewAnswer({
      question,
      answer,
      language: language || "English",
    });

    return res.status(200).json({ evaluation });
  } catch (error) {
    console.error("Error in evaluateAnswerController:", error);

    if (error.message?.includes("RESOURCE_EXHAUSTED") || error.status === 429) {
      return res.status(429).json({
        error: "Gemini API quota exceeded. Please check your plan or try again later.",
      });
    }

    return res.status(500).json({
      error: `Failed to evaluate answer: ${error.message}`,
    });
  }
};

/**
 * Controller: AI Chatbot / Career Tutor
 * POST /api/v1/ai/chat
 */
export const chatController = async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ error: "Field 'message' cannot be empty" });
    }

    const responseText = await chatWithAITutor({ message });

    return res.status(200).json({ response: responseText });
  } catch (error) {
    console.error("Error in chatController:", error);

    if (error.message?.includes("RESOURCE_EXHAUSTED") || error.status === 429) {
      return res.status(429).json({
        error: "Gemini API quota exceeded. Please check your plan or try again later.",
      });
    }

    return res.status(500).json({
      error: `Failed to process chat message: ${error.message}`,
    });
  }
};

/**
 * Controller: Generate Structured Resume
 * POST /api/v1/ai/generate-resume
 */
export const generateResumeController = async (req, res) => {
  try {
    const { prompt, currentData } = req.body;

    const resumeData = await generateResumeData({
      prompt: prompt || 'Senior Software Engineer',
      currentData,
    });

    return res.status(200).json({ resumeData });
  } catch (error) {
    console.error('Error in generateResumeController:', error);

    if (error.message?.includes('RESOURCE_EXHAUSTED') || error.status === 429) {
      return res.status(429).json({
        error: 'Gemini API quota exceeded. Please check your plan or try again later.',
      });
    }

    return res.status(500).json({
      error: `Failed to generate resume data: ${error.message}`,
    });
  }
};

