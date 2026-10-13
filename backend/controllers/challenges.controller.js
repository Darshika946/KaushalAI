import {
  getDailyDSAProblem,
  executeCodeEngine,
  getGeminiDSAFeedback,
  getDailyTechArticle,
  markArticleAsRead,
  getWeeklyProject,
  evaluateGitHubRepository,
  updateCourseChecklist,
  ensureChallengesSeeded,
} from "../services/challenges.service.js";
import { DSAProblem, UserChallengeProgress } from "../models/challenge.model.js";
import User from "../models/user.model.js";

// Ensure seed data is ready on controller import
ensureChallengesSeeded().catch(() => {});

export const getDailyDSA = async (req, res) => {
  try {
    const { date } = req.query;
    const problem = await getDailyDSAProblem(date);
    return res.status(200).json({ success: true, problem });
  } catch (err) {
    console.error("Error in getDailyDSA:", err.message);
    return res.status(500).json({ success: false, error: "Failed to fetch daily DSA problem" });
  }
};

export const executeDSACode = async (req, res) => {
  try {
    const { language, code, problemSlug } = req.body;
    if (!language || !code) {
      return res.status(400).json({ success: false, error: "Language and code are required." });
    }

    // Retrieve original test cases including hidden ones for authoritative evaluation
    let problem = await DSAProblem.findOne({ slug: problemSlug });
    if (!problem) {
      problem = await getDailyDSAProblem();
    }

    const testCases = problem?.testCases || [
      { input: "[2, 7, 11, 15]\n9", expectedOutput: "[0, 1]", isHidden: false },
    ];

    const result = await executeCodeEngine({ language, code, testCases });

    // If user is authenticated and all tests passed, award points
    if (result.allPassed && req.user?._id) {
      try {
        let progress = await UserChallengeProgress.findOne({ userId: req.user._id });
        if (!progress) {
          progress = new UserChallengeProgress({ userId: req.user._id });
        }
        const alreadyDone = progress.completedDSA.some((p) => p.problemSlug === problemSlug);
        if (!alreadyDone) {
          progress.completedDSA.push({
            problemSlug: problemSlug || "daily-dsa",
            language,
            code,
            passedTests: result.passedCount,
            totalTests: result.totalCount,
          });
          progress.totalPoints += 25;
          progress.dailyStreak = (progress.dailyStreak || 0) + 1;
          progress.lastDailyCompletedAt = new Date();
          await progress.save();

          await User.findByIdAndUpdate(req.user._id, {
            $inc: { totalPoints: 25, dailyStreak: 1 },
            lastDailyChallenge: new Date(),
          });
        }
      } catch (saveErr) {
        console.warn("Could not record DSA progress:", saveErr.message);
      }
    }

    return res.status(200).json({ success: true, ...result });
  } catch (err) {
    console.error("Error in executeDSACode:", err.message);
    return res.status(500).json({ success: false, error: err.message || "Execution error" });
  }
};

export const getDSAHint = async (req, res) => {
  try {
    const { problemTitle, problemStatement, code, language, errorOutput, requestType } = req.body;
    const feedback = await getGeminiDSAFeedback({
      problemTitle,
      problemStatement,
      code,
      language,
      errorOutput,
      requestType,
    });
    return res.status(200).json({ success: true, feedback });
  } catch (err) {
    console.error("Error in getDSAHint:", err.message);
    return res.status(500).json({ success: false, error: "Failed to generate AI feedback" });
  }
};

export const getDailyArticle = async (req, res) => {
  try {
    const { date } = req.query;
    const article = await getDailyTechArticle(date);
    return res.status(200).json({ success: true, article });
  } catch (err) {
    console.error("Error in getDailyArticle:", err.message);
    return res.status(500).json({ success: false, error: "Failed to fetch tech article" });
  }
};

export const markArticleRead = async (req, res) => {
  try {
    const { articleSlug } = req.body;
    const userId = req.user?._id;
    const result = await markArticleAsRead({ userId, articleSlug });
    return res.status(200).json(result);
  } catch (err) {
    console.error("Error in markArticleRead:", err.message);
    return res.status(500).json({ success: false, error: "Failed to update article status" });
  }
};

export const getWeeklyProjectDetails = async (req, res) => {
  try {
    const { week } = req.query;
    const project = await getWeeklyProject(parseInt(week, 10) || 1);
    return res.status(200).json({ success: true, project });
  } catch (err) {
    console.error("Error in getWeeklyProjectDetails:", err.message);
    return res.status(500).json({ success: false, error: "Failed to fetch weekly project" });
  }
};

export const submitWeeklyProject = async (req, res) => {
  try {
    const { repoUrl, projectSlug, weekNumber } = req.body;
    if (!repoUrl) {
      return res.status(400).json({ success: false, error: "GitHub repository URL is required." });
    }

    const projectSpec = await getWeeklyProject(weekNumber || 1);
    const evaluationResult = await evaluateGitHubRepository({ repoUrl, projectSpec });

    // If user is authenticated, record submission
    if (req.user?._id) {
      try {
        let progress = await UserChallengeProgress.findOne({ userId: req.user._id });
        if (!progress) {
          progress = new UserChallengeProgress({ userId: req.user._id });
        }

        const scores = evaluationResult.evaluation;
        progress.projectSubmissions.push({
          projectSlug: projectSlug || projectSpec.slug,
          repoUrl,
          scores: {
            architecture: scores.architectureScore,
            cleanliness: scores.cleanlinessScore,
            errorHandling: scores.errorHandlingScore,
            totalScore: scores.totalScore,
          },
          feedback: scores.constructiveFeedback,
          recommendations: scores.recommendations,
        });

        // Award points proportional to score (e.g. 50 bonus points if totalScore >= 20)
        const pointsEarned = scores.totalScore >= 20 ? 50 : 25;
        progress.totalPoints += pointsEarned;
        progress.weeklyStreak = (progress.weeklyStreak || 0) + 1;
        progress.lastWeeklyCompletedAt = new Date();
        await progress.save();

        await User.findByIdAndUpdate(req.user._id, {
          $inc: { totalPoints: pointsEarned, weeklyStreak: 1 },
          lastWeeklyChallenge: new Date(),
        });
      } catch (saveErr) {
        console.warn("Could not persist project submission:", saveErr.message);
      }
    }

    return res.status(200).json({ success: true, ...evaluationResult });
  } catch (err) {
    console.error("Error in submitWeeklyProject:", err.message);
    return res.status(400).json({ success: false, error: err.message || "Evaluation failed" });
  }
};

export const updateCourseModuleProgress = async (req, res) => {
  try {
    const { projectSlug, moduleId, completed } = req.body;
    const userId = req.user?._id;
    const result = await updateCourseChecklist({ userId, projectSlug, moduleId, completed });
    return res.status(200).json(result);
  } catch (err) {
    console.error("Error in updateCourseModuleProgress:", err.message);
    return res.status(500).json({ success: false, error: "Failed to update course progress" });
  }
};

export const getUserChallengeStats = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(200).json({
        success: true,
        stats: { totalPoints: 0, dailyStreak: 0, weeklyStreak: 0, completedDSA: [], readArticles: [] },
      });
    }

    const progress = await UserChallengeProgress.findOne({ userId }).lean();
    return res.status(200).json({
      success: true,
      stats: progress || {
        totalPoints: 0,
        dailyStreak: 0,
        weeklyStreak: 0,
        completedDSA: [],
        readArticles: [],
      },
    });
  } catch (err) {
    console.error("Error in getUserChallengeStats:", err.message);
    return res.status(500).json({ success: false, error: "Failed to fetch user stats" });
  }
};
