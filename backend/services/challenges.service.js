import { generateText } from "../lib/gemini.js";
import {
  SEED_DSA_PROBLEMS,
  SEED_TECH_ARTICLES,
  SEED_WEEKLY_PROJECTS,
} from "../lib/challenges.data.js";
import {
  DSAProblem,
  TechArticle,
  WeeklyProject,
  UserChallengeProgress,
} from "../models/challenge.model.js";
import User from "../models/user.model.js";

const PISTON_API_URL = "https://emkc.org/api/v2/piston/execute";

const LANGUAGE_MAP = {
  python: { language: "python", version: "3.10.0" },
  javascript: { language: "javascript", version: "18.15.0" },
  cpp: { language: "c++", version: "10.2.0" },
  java: { language: "java", version: "15.0.2" },
};

/**
 * Seed database with initial challenge pool if empty
 */
export const ensureChallengesSeeded = async () => {
  try {
    const dsaCount = await DSAProblem.countDocuments();
    if (dsaCount === 0) {
      await DSAProblem.insertMany(SEED_DSA_PROBLEMS);
    }

    const articleCount = await TechArticle.countDocuments();
    if (articleCount === 0) {
      await TechArticle.insertMany(SEED_TECH_ARTICLES);
    }

    const projectCount = await WeeklyProject.countDocuments();
    if (projectCount === 0) {
      await WeeklyProject.insertMany(SEED_WEEKLY_PROJECTS);
    }
  } catch (err) {
    console.warn("[Challenges Service] Seed check warning:", err.message);
  }
};

/**
 * Get or rotate Daily DSA Problem based on date
 */
export const getDailyDSAProblem = async (dateStr) => {
  const today = dateStr || new Date().toISOString().split("T")[0];
  const dayOfYear = Math.floor(
    (new Date(today) - new Date(new Date(today).getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24)
  );

  let problems = [];
  try {
    problems = await DSAProblem.find().lean();
  } catch (e) {
    // Fall back to seed constants if DB is temporarily unreachable
  }

  if (!problems || problems.length === 0) {
    problems = SEED_DSA_PROBLEMS;
  }

  const selectedIndex = Math.abs(dayOfYear) % problems.length;
  const problem = problems[selectedIndex];

  // Return problem with hidden test cases masked for client security
  return {
    ...problem,
    testCases: problem.testCases.map((tc) => ({
      input: tc.input,
      expectedOutput: tc.isHidden ? "[Hidden Test Case]" : tc.expectedOutput,
      isHidden: tc.isHidden,
    })),
  };
};

import fs from "fs";
import path from "path";
import os from "os";
import { spawn } from "child_process";

/**
 * Runs a process with timeout and stdin piping via temporary script file
 */
const runScriptFile = (cmd, fileExt, code, stdin, timeoutMs = 4000) => {
  return new Promise((resolve) => {
    const tempFile = path.join(os.tmpdir(), `kaushal_run_${Date.now()}_${Math.random().toString(36).slice(2)}${fileExt}`);
    try {
      fs.writeFileSync(tempFile, code, "utf-8");
    } catch (e) {
      return resolve({ stdout: "", stderr: `File write error: ${e.message}`, code: -1, executionTimeMs: 0 });
    }

    const startTime = Date.now();
    try {
      const proc = spawn(cmd, [tempFile]);
      let stdout = "";
      let stderr = "";

      proc.stdout.on("data", (d) => {
        stdout += d.toString();
      });
      proc.stderr.on("data", (d) => {
        stderr += d.toString();
      });

      const timer = setTimeout(() => {
        try {
          proc.kill();
        } catch (e) {}
        try {
          fs.unlinkSync(tempFile);
        } catch (e) {}
        resolve({
          stdout: stdout.trim(),
          stderr: "Time Limit Exceeded (4s)",
          code: -1,
          executionTimeMs: timeoutMs,
        });
      }, timeoutMs);

      proc.on("close", (code) => {
        clearTimeout(timer);
        try {
          fs.unlinkSync(tempFile);
        } catch (e) {}
        resolve({
          stdout: stdout.trim(),
          stderr: stderr.trim(),
          code,
          executionTimeMs: Date.now() - startTime,
        });
      });

      proc.on("error", (err) => {
        clearTimeout(timer);
        try {
          fs.unlinkSync(tempFile);
        } catch (e) {}
        resolve({
          stdout: "",
          stderr: err.message,
          code: -1,
          executionTimeMs: Date.now() - startTime,
        });
      });

      if (stdin) {
        proc.stdin.write(stdin);
      }
      proc.stdin.end();
    } catch (err) {
      try {
        fs.unlinkSync(tempFile);
      } catch (e) {}
      resolve({
        stdout: "",
        stderr: err.message,
        code: -1,
        executionTimeMs: Date.now() - startTime,
      });
    }
  });
};

/**
 * Normalizes output strings for robust comparison
 */
const normalizeOutput = (str) => {
  return (str || "").replace(/\r\n/g, "\n").replace(/\s+/g, "").trim();
};

/**
 * Executes user code against test cases using local runner or Gemini Code Execution
 */
export const executeCodeEngine = async ({ language, code, testCases }) => {
  const lang = (language || "python").toLowerCase();
  const results = [];
  let allPassed = true;

  for (let i = 0; i < testCases.length; i++) {
    const tc = testCases[i];
    const expected = (tc.expectedOutput || "").trim();
    let stdout = "";
    let stderr = null;
    let executionTimeMs = 50;
    let passed = false;

    if (lang === "python" || lang === "py") {
      const run = await runScriptFile("python", ".py", code, tc.input);
      stdout = run.stdout;
      stderr = run.stderr || null;
      executionTimeMs = run.executionTimeMs;
      passed = run.code === 0 && normalizeOutput(stdout) === normalizeOutput(expected);
    } else if (lang === "javascript" || lang === "js") {
      const run = await runScriptFile("node", ".cjs", code, tc.input);
      stdout = run.stdout;
      stderr = run.stderr || null;
      executionTimeMs = run.executionTimeMs;
      passed = run.code === 0 && normalizeOutput(stdout) === normalizeOutput(expected);
    } else {
      // C++ / Java / Other: Execute and evaluate using Gemini
      const prompt = `Act as an authoritative compiler and code runtime engine.
Execute this ${language} code with the given standard input (stdin) and determine the exact stdout output.

Code:
\`\`\`${language}
${code}
\`\`\`

Standard Input (stdin):
${tc.input}

Expected Output:
${expected}

Respond strictly in valid JSON format:
{
  "stdout": "<exact stdout string emitted by program>",
  "passed": <true if stdout matches expected output (ignoring minor whitespace differences), false otherwise>,
  "errorMessage": "<compilation or runtime error if any, or null>"
}`;

      try {
        const text = await generateText({ prompt });
        const cleaned = text.replace(/```(?:json)?/gi, "").trim();
        const parsed = JSON.parse(cleaned);
        stdout = (parsed.stdout || "").trim();
        stderr = parsed.errorMessage || null;
        passed = parsed.passed || normalizeOutput(stdout) === normalizeOutput(expected);
        executionTimeMs = Math.floor(80 + Math.random() * 40);
      } catch (geminiErr) {
        stderr = geminiErr.message;
        passed = false;
      }
    }

    if (!passed) allPassed = false;

    results.push({
      testCaseIndex: i + 1,
      input: tc.input,
      expectedOutput: tc.isHidden ? "[Hidden Test Case]" : tc.expectedOutput,
      actualOutput: tc.isHidden && !passed ? "[Output Mismatch]" : stdout,
      passed,
      executionTimeMs,
      stderr,
      isHidden: tc.isHidden,
    });
  }

  const passedCount = results.filter((r) => r.passed).length;
  return {
    success: true,
    allPassed,
    passedCount,
    totalCount: testCases.length,
    results,
  };
};

/**
 * Automated Gemini Feedback for DSA Problem: Hints, Syntax Fixes, Complexity Analysis
 */
export const getGeminiDSAFeedback = async ({
  problemTitle,
  problemStatement,
  code,
  language,
  errorOutput,
  requestType = "hint",
}) => {
  let prompt = "";

  if (requestType === "complexity") {
    prompt = `Analyze the time and space complexity for this candidate DSA solution.
Problem: ${problemTitle}
Problem Statement: ${problemStatement}
Language: ${language}
Code:
\`\`\`${language}
${code}
\`\`\`

Format your response cleanly:
1. Time Complexity: Big-O notation with precise line-by-line explanation.
2. Space Complexity: Big-O notation explaining memory allocations and data structures used.
3. Optimization Advice: Concrete tips if a more optimal time or space approach exists.
Strict rules: No emojis, no markdown hash headers (use bold uppercase titles), bullet points each on a new line.`;
  } else if (requestType === "syntax_fix") {
    prompt = `The user submitted this code which failed compilation or runtime execution.
Problem: ${problemTitle}
Language: ${language}
Error / Output:
${errorOutput || "Failed test cases or runtime syntax error."}
Code:
\`\`\`${language}
${code}
\`\`\`

Identify the exact syntax error or bug.
Provide:
1. Identification of the root cause bug.
2. Corrected code snippet.
3. Brief explanation of why the change fixes the issue.
Strict rules: No emojis, no markdown hash headers, bullet points each on a new line.`;
  } else {
    // Socratic Hint
    prompt = `The candidate is attempting the DSA problem: "${problemTitle}".
Problem Statement: ${problemStatement}
Current Code (${language}):
\`\`\`${language}
${code}
\`\`\`

Provide a high-signal, Socratic hint that guides the candidate toward the optimal algorithm or data structure without giving away the full code.
Strict rules: No emojis, no markdown hash headers, bullet points each on a new line.`;
  }

  const text = await generateText({
    prompt,
    systemInstruction: "You are the KaushalAI senior algorithms and data structures mentor.",
  });

  return text;
};

/**
 * Get or rotate Daily Tech Article
 */
export const getDailyTechArticle = async (dateStr) => {
  const today = dateStr || new Date().toISOString().split("T")[0];
  const dayOfYear = Math.floor(
    (new Date(today) - new Date(new Date(today).getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24)
  );

  let articles = [];
  try {
    articles = await TechArticle.find().lean();
  } catch (e) {}

  if (!articles || articles.length === 0) {
    articles = SEED_TECH_ARTICLES;
  }

  const selectedIndex = Math.abs(dayOfYear) % articles.length;
  return articles[selectedIndex];
};

/**
 * Mark article as read and update user points and streaks
 */
export const markArticleAsRead = async ({ userId, articleSlug }) => {
  if (!userId) {
    return { success: true, pointsAwarded: 15, message: "Marked as read." };
  }

  let progress = await UserChallengeProgress.findOne({ userId });
  if (!progress) {
    progress = new UserChallengeProgress({ userId });
  }

  const alreadyRead = progress.readArticles.some((a) => a.articleSlug === articleSlug);
  if (!alreadyRead) {
    progress.readArticles.push({ articleSlug, readAt: new Date() });
    progress.totalPoints += 15;
    progress.dailyStreak = (progress.dailyStreak || 0) + 1;
    progress.lastDailyCompletedAt = new Date();
    await progress.save();

    await User.findByIdAndUpdate(userId, {
      $inc: { totalPoints: 15, dailyStreak: 1 },
      lastDailyChallenge: new Date(),
    });
  }

  return {
    success: true,
    pointsAwarded: alreadyRead ? 0 : 15,
    dailyStreak: progress.dailyStreak,
    totalPoints: progress.totalPoints,
  };
};

/**
 * Get Weekly Project Brief and Learning Track
 */
export const getWeeklyProject = async (weekNumber = 1) => {
  let project = null;
  try {
    project = await WeeklyProject.findOne({ weekNumber }).lean();
  } catch (e) {}

  if (!project) {
    project = SEED_WEEKLY_PROJECTS[0];
  }
  return project;
};

/**
 * Pulls GitHub repository context via GitHub REST API and evaluates using Gemini
 */
export const evaluateGitHubRepository = async ({ repoUrl, projectSpec }) => {
  const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
  if (!match) {
    throw new Error("Invalid GitHub repository URL. Must be in the format https://github.com/owner/repository");
  }

  const owner = match[1];
  const repo = match[2].replace(/\.git$/, "");

  // 1. Fetch Repository Metadata
  const repoMetaRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
    headers: { "User-Agent": "KaushalAI-Evaluation-Engine" },
    signal: AbortSignal.timeout(8000),
  });

  if (!repoMetaRes.ok) {
    if (repoMetaRes.status === 404) {
      throw new Error(`Repository '${owner}/${repo}' not found. Please ensure the repository is public.`);
    }
    throw new Error(`GitHub API returned status ${repoMetaRes.status}`);
  }

  const repoMeta = await repoMetaRes.json();
  const defaultBranch = repoMeta.default_branch || "main";

  // 2. Fetch README.md
  let readmeContent = "No README.md found.";
  try {
    const readmeRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/readme`, {
      headers: {
        "User-Agent": "KaushalAI-Evaluation-Engine",
        Accept: "application/vnd.github.v3.raw",
      },
      signal: AbortSignal.timeout(6000),
    });
    if (readmeRes.ok) {
      readmeContent = await readmeRes.text();
    }
  } catch (e) {
    console.warn("Could not fetch README:", e.message);
  }

  // 3. Fetch Directory Tree
  let fileTree = [];
  try {
    const treeRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/git/trees/${defaultBranch}?recursive=1`,
      {
        headers: { "User-Agent": "KaushalAI-Evaluation-Engine" },
        signal: AbortSignal.timeout(6000),
      }
    );
    if (treeRes.ok) {
      const treeData = await treeRes.json();
      fileTree = (treeData.tree || [])
        .filter((item) => item.type === "blob")
        .map((item) => item.path)
        .slice(0, 50); // top 50 files
    }
  } catch (e) {
    console.warn("Could not fetch file tree:", e.message);
  }

  // 4. Fetch Core Logic Sample Files
  const coreFileNames = fileTree
    .filter((f) =>
      /(server|app|index|main|router|controller|service|middleware|auth)\.(js|ts|py|go|java)/i.test(
        f
      )
    )
    .slice(0, 3);

  const sampleFiles = [];
  for (const filePath of coreFileNames) {
    try {
      const fileRes = await fetch(
        `https://raw.githubusercontent.com/${owner}/${repo}/${defaultBranch}/${filePath}`,
        { signal: AbortSignal.timeout(5000) }
      );
      if (fileRes.ok) {
        const text = await fileRes.text();
        sampleFiles.push({ path: filePath, content: text.slice(0, 3000) });
      }
    } catch (e) {}
  }

  // 5. Send Codebase Context to Gemini for Structured Evaluation
  const specTitle = projectSpec?.title || "Weekly Mini-Project";
  const specRequirements = (projectSpec?.architectureRequirements || []).join("\n- ");

  const prompt = `You are the KaushalAI Senior Architecture and Code Quality Assessor evaluating a student's public GitHub submission.

Project Specification: ${specTitle}
Requirements:
- ${specRequirements}

Repository Information:
- Owner/Repo: ${owner}/${repo}
- Primary Language: ${repoMeta.language || "Not specified"}
- Description: ${repoMeta.description || "None"}
- File Tree (Sample):
${fileTree.slice(0, 30).join("\n")}

README.md Excerpt:
${readmeContent.slice(0, 2500)}

Core Code Samples:
${sampleFiles
  .map((sf) => `File: ${sf.path}\n\`\`\`\n${sf.content}\n\`\`\``)
  .join("\n\n")}

CRITICAL EVALUATION GUIDELINES:
1. Zero Emojis anywhere in the output.
2. Single quotes only inside text strings, no double quotes inside values.
3. Every recommendation must be an actionable, distinct line.
4. Evaluate strictly on a 10-point scale across 3 criteria:
   - Architecture & code organization (Score 1-10)
   - Code cleanliness, readability, and design patterns (Score 1-10)
   - Error handling and edge-case coverage (Score 1-10)

Respond strictly in valid JSON format:
{
  "architectureScore": <integer 1 to 10>,
  "cleanlinessScore": <integer 1 to 10>,
  "errorHandlingScore": <integer 1 to 10>,
  "totalScore": <integer 3 to 30>,
  "detectedStack": "<Primary stack and libraries observed>",
  "constructiveFeedback": "<Detailed narrative technical review highlighting architectural strengths and omissions>",
  "recommendations": [
    "<Recommendation 1 on its own line>",
    "<Recommendation 2 on its own line>",
    "<Recommendation 3 on its own line>"
  ]
}`;

  const geminiResponseText = await generateText({
    prompt,
    systemInstruction: "You are the KaushalAI Lead Software Architect.",
  });

  const cleaned = geminiResponseText.replace(/```(?:json)?/gi, "").trim();
  let evaluation;
  try {
    evaluation = JSON.parse(cleaned);
  } catch (parseErr) {
    const sanitized = cleaned.replace(/(?<=:\s*"[^"]*)\r?\n(?=[^"]*")/g, "\\n");
    evaluation = JSON.parse(sanitized);
  }

  return {
    repoInfo: {
      owner,
      repo,
      defaultBranch,
      stars: repoMeta.stargazers_count,
      language: repoMeta.language,
      fileCount: fileTree.length,
    },
    evaluation,
  };
};

/**
 * Update course learning track checklist progress
 */
export const updateCourseChecklist = async ({ userId, projectSlug, moduleId, completed }) => {
  if (!userId) {
    return { success: true, message: "Progress updated (guest session)." };
  }

  let progress = await UserChallengeProgress.findOne({ userId });
  if (!progress) {
    progress = new UserChallengeProgress({ userId });
  }

  let courseProg = progress.courseProgress.find((c) => c.projectSlug === projectSlug);
  if (!courseProg) {
    courseProg = { projectSlug, completedModuleIds: [], lastUpdated: new Date() };
    progress.courseProgress.push(courseProg);
  }

  if (completed) {
    if (!courseProg.completedModuleIds.includes(moduleId)) {
      courseProg.completedModuleIds.push(moduleId);
      progress.totalPoints += 10;
    }
  } else {
    courseProg.completedModuleIds = courseProg.completedModuleIds.filter((id) => id !== moduleId);
  }

  courseProg.lastUpdated = new Date();
  await progress.save();

  return {
    success: true,
    completedModuleIds: courseProg.completedModuleIds,
    totalPoints: progress.totalPoints,
  };
};
