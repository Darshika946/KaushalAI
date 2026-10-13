import mongoose from "mongoose";

const exampleSchema = new mongoose.Schema({
  input: { type: String, required: true },
  output: { type: String, required: true },
  explanation: { type: String, default: "" },
});

const testCaseSchema = new mongoose.Schema({
  input: { type: String, required: true },
  expectedOutput: { type: String, required: true },
  isHidden: { type: Boolean, default: false },
});

const dsaProblemSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    difficulty: { type: String, enum: ["Easy", "Medium", "Hard"], default: "Medium" },
    category: { type: String, required: true },
    problemStatement: { type: String, required: true },
    constraints: [{ type: String }],
    examples: [exampleSchema],
    starterCode: {
      python: { type: String, required: true },
      javascript: { type: String, required: true },
      cpp: { type: String, required: true },
      java: { type: String, required: true },
    },
    testCases: [testCaseSchema],
    hints: [{ type: String }],
    dateKey: { type: String, index: true },
  },
  { timestamps: true }
);

const techArticleSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    category: { type: String, required: true },
    author: { type: String, default: "KaushalAI Engineering" },
    readTimeMinutes: { type: Number, default: 5 },
    sourceUrl: { type: String, default: "" },
    summary3Min: { type: String, required: true },
    keyTakeaways: [{ type: String }],
    fullText: { type: String, required: true },
    dateKey: { type: String, index: true },
  },
  { timestamps: true }
);

const apiEndpointSchema = new mongoose.Schema({
  method: { type: String, required: true },
  path: { type: String, required: true },
  description: { type: String, required: true },
});

const rubricItemSchema = new mongoose.Schema({
  criteria: { type: String, required: true },
  maxScore: { type: Number, required: true },
  description: { type: String, required: true },
});

const moduleItemSchema = new mongoose.Schema({
  id: { type: String, required: true },
  title: { type: String, required: true },
  duration: { type: String, default: "" },
  videoUrl: { type: String, default: "" },
});

const weeklyProjectSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true },
    weekNumber: { type: Number, required: true, unique: true },
    title: { type: String, required: true },
    domain: { type: String, required: true },
    overview: { type: String, required: true },
    architectureRequirements: [{ type: String }],
    acceptedTechStacks: [{ type: String }],
    apiEndpoints: [apiEndpointSchema],
    gradingRubric: [rubricItemSchema],
    learningTrack: {
      playlistTitle: { type: String, required: true },
      playlistUrl: { type: String, required: true },
      embedUrl: { type: String, default: "" },
      modules: [moduleItemSchema],
    },
  },
  { timestamps: true }
);

const userChallengeProgressSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    completedDSA: [
      {
        problemSlug: { type: String, required: true },
        language: { type: String, required: true },
        code: { type: String },
        completedAt: { type: Date, default: Date.now },
        passedTests: { type: Number, default: 0 },
        totalTests: { type: Number, default: 0 },
      },
    ],
    readArticles: [
      {
        articleSlug: { type: String, required: true },
        readAt: { type: Date, default: Date.now },
      },
    ],
    projectSubmissions: [
      {
        projectSlug: { type: String, required: true },
        repoUrl: { type: String, required: true },
        submittedAt: { type: Date, default: Date.now },
        scores: {
          architecture: { type: Number, default: 0 },
          cleanliness: { type: Number, default: 0 },
          errorHandling: { type: Number, default: 0 },
          totalScore: { type: Number, default: 0 },
        },
        feedback: { type: String, default: "" },
        recommendations: [{ type: String }],
      },
    ],
    courseProgress: [
      {
        projectSlug: { type: String, required: true },
        completedModuleIds: [{ type: String }],
        lastUpdated: { type: Date, default: Date.now },
      },
    ],
    totalPoints: { type: Number, default: 0 },
    dailyStreak: { type: Number, default: 0 },
    weeklyStreak: { type: Number, default: 0 },
    lastDailyCompletedAt: { type: Date },
    lastWeeklyCompletedAt: { type: Date },
  },
  { timestamps: true }
);

export const DSAProblem = mongoose.model("DSAProblem", dsaProblemSchema);
export const TechArticle = mongoose.model("TechArticle", techArticleSchema);
export const WeeklyProject = mongoose.model("WeeklyProject", weeklyProjectSchema);
export const UserChallengeProgress = mongoose.model(
  "UserChallengeProgress",
  userChallengeProgressSchema
);
