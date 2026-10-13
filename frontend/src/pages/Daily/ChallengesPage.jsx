import React, { useState, useEffect } from "react";
import Editor from "@monaco-editor/react";
import toast from "react-hot-toast";
import {
  FaPlay,
  FaLightbulb,
  FaChartLine,
  FaCheckCircle,
  FaBookOpen,
  FaGithub,
  FaYoutube,
  FaTrophy,
  FaFire,
  FaBolt,
  FaClock,
  FaCheck,
  FaChevronDown,
  FaChevronUp,
  FaUndo,
  FaExternalLinkAlt,
} from "react-icons/fa";
import { API_BASE_URL } from "../../config/api";

const ChallengesPage = () => {
  const [activeTab, setActiveTab] = useState("daily"); // 'daily' | 'weekly'
  const [stats, setStats] = useState({
    totalPoints: 0,
    dailyStreak: 0,
    weeklyStreak: 0,
  });

  // Section 1: Daily Challenges State
  const [dsaProblem, setDsaProblem] = useState(null);
  const [selectedLanguage, setSelectedLanguage] = useState("python");
  const [code, setCode] = useState("");
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState(null);
  const [selectedTestCaseIndex, setSelectedTestCaseIndex] = useState(0);

  // Gemini AI Feedback Drawer State
  const [aiFeedback, setAiFeedback] = useState(null);
  const [isLoadingAi, setIsLoadingAi] = useState(false);

  // Daily Article State
  const [article, setArticle] = useState(null);
  const [isArticleRead, setIsArticleRead] = useState(false);
  const [showFullArticle, setShowFullArticle] = useState(false);

  // Section 2: Weekly Challenges State
  const [weeklyProject, setWeeklyProject] = useState(null);
  const [githubUrl, setGithubUrl] = useState("");
  const [isEvaluatingRepo, setIsEvaluatingRepo] = useState(false);
  const [repoEvaluation, setRepoEvaluation] = useState(null);
  const [completedModules, setCompletedModules] = useState([]);

  // Fetch initial data
  useEffect(() => {
    fetchStats();
    fetchDailyDSA();
    fetchDailyArticle();
    fetchWeeklyProject();
  }, []);

  // Update starter code when language changes
  useEffect(() => {
    if (dsaProblem?.starterCode && dsaProblem.starterCode[selectedLanguage]) {
      setCode(dsaProblem.starterCode[selectedLanguage]);
    }
  }, [selectedLanguage, dsaProblem]);

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/challenges/stats`, {
        credentials: "include",
      });
      const data = await res.json();
      if (data.success && data.stats) {
        setStats({
          totalPoints: data.stats.totalPoints || 0,
          dailyStreak: data.stats.dailyStreak || 0,
          weeklyStreak: data.stats.weeklyStreak || 0,
        });
        if (data.stats.readArticles?.length > 0) {
          setIsArticleRead(true);
        }
      }
    } catch (e) {
      console.warn("Could not fetch user stats:", e);
    }
  };

  const fetchDailyDSA = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/challenges/daily/dsa`, {
        credentials: "include",
      });
      const data = await res.json();
      if (data.success && data.problem) {
        setDsaProblem(data.problem);
        setCode(data.problem.starterCode.python || "");
      }
    } catch (e) {
      toast.error("Failed to load daily DSA problem");
    }
  };

  const fetchDailyArticle = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/challenges/daily/article`, {
        credentials: "include",
      });
      const data = await res.json();
      if (data.success && data.article) {
        setArticle(data.article);
      }
    } catch (e) {
      console.warn("Failed to load article:", e);
    }
  };

  const fetchWeeklyProject = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/challenges/weekly/project?week=1`, {
        credentials: "include",
      });
      const data = await res.json();
      if (data.success && data.project) {
        setWeeklyProject(data.project);
      }
    } catch (e) {
      console.warn("Failed to load weekly project:", e);
    }
  };

  // Run Code
  const handleRunCode = async () => {
    if (!code.trim()) {
      toast.error("Please write code before running.");
      return;
    }

    setIsExecuting(true);
    setExecutionResult(null);

    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/challenges/daily/dsa/execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          language: selectedLanguage,
          code,
          problemSlug: dsaProblem?.slug,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setExecutionResult(data);
        if (data.allPassed) {
          toast.success("All test cases passed! +25 Points");
          setStats((prev) => ({
            ...prev,
            totalPoints: prev.totalPoints + 25,
            dailyStreak: prev.dailyStreak + 1,
          }));
        } else {
          toast.error(`${data.passedCount} of ${data.totalCount} test cases passed.`);
        }
      } else {
        toast.error(data.error || "Execution failed");
      }
    } catch (err) {
      toast.error("Execution network error.");
    } finally {
      setIsExecuting(false);
    }
  };

  // Request Gemini Feedback (Hint or Complexity Analysis)
  const handleRequestAiFeedback = async (requestType) => {
    setIsLoadingAi(true);
    setAiFeedback(null);

    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/challenges/daily/dsa/hint`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          problemTitle: dsaProblem?.title,
          problemStatement: dsaProblem?.problemStatement,
          code,
          language: selectedLanguage,
          errorOutput: executionResult?.results?.find((r) => !r.passed)?.stderr || "",
          requestType,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setAiFeedback({ type: requestType, text: data.feedback });
      } else {
        toast.error("Failed to generate AI feedback.");
      }
    } catch (err) {
      toast.error("Network error while communicating with Gemini API.");
    } finally {
      setIsLoadingAi(false);
    }
  };

  // Mark Article as Read
  const handleMarkArticleRead = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/challenges/daily/article/read`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ articleSlug: article?.slug }),
      });
      const data = await res.json();
      if (data.success) {
        setIsArticleRead(true);
        if (data.pointsAwarded > 0) {
          toast.success("+15 Points for completing the Daily Tech Read!");
          setStats((prev) => ({
            ...prev,
            totalPoints: prev.totalPoints + 15,
            dailyStreak: data.dailyStreak || prev.dailyStreak + 1,
          }));
        }
      }
    } catch (err) {
      toast.error("Failed to mark article as read.");
    }
  };

  // Submit GitHub Repository
  const handleSubmitGitHubRepo = async (e) => {
    e.preventDefault();
    if (!githubUrl.trim()) {
      toast.error("Please enter a valid GitHub repository URL.");
      return;
    }

    setIsEvaluatingRepo(true);
    setRepoEvaluation(null);

    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/challenges/weekly/project/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          repoUrl: githubUrl.trim(),
          projectSlug: weeklyProject?.slug,
          weekNumber: weeklyProject?.weekNumber || 1,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setRepoEvaluation(data);
        const total = data.evaluation?.totalScore || 0;
        toast.success(`Evaluated successfully! Score: ${total}/30`);
        setStats((prev) => ({
          ...prev,
          totalPoints: prev.totalPoints + (total >= 20 ? 50 : 25),
          weeklyStreak: prev.weeklyStreak + 1,
        }));
      } else {
        toast.error(data.error || "GitHub repository evaluation failed.");
      }
    } catch (err) {
      toast.error("Error inspecting GitHub repository.");
    } finally {
      setIsEvaluatingRepo(false);
    }
  };

  // Toggle Course Module Checklist
  const handleToggleModule = async (moduleId) => {
    const isCompleted = completedModules.includes(moduleId);
    const updated = isCompleted
      ? completedModules.filter((id) => id !== moduleId)
      : [...completedModules, moduleId];

    setCompletedModules(updated);

    try {
      await fetch(`${API_BASE_URL}/api/v1/challenges/weekly/course/progress`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          projectSlug: weeklyProject?.slug || "auth-rate-limiting-microservice",
          moduleId,
          completed: !isCompleted,
        }),
      });
      if (!isCompleted) {
        toast.success("Module completed! +10 Points");
        setStats((prev) => ({ ...prev, totalPoints: prev.totalPoints + 10 }));
      }
    } catch (e) {
      console.warn("Could not save module progress:", e);
    }
  };

  const getDifficultyBadge = (difficulty) => {
    switch (difficulty?.toLowerCase()) {
      case "easy":
        return "bg-green-100 text-green-800 border-green-300";
      case "medium":
        return "bg-amber-100 text-amber-800 border-amber-300";
      case "hard":
        return "bg-red-100 text-red-800 border-red-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 pb-16 font-sans">
      {/* Top Banner & Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-gray-900 flex items-center gap-2">
              <span className="bg-blue-600 text-white p-1.5 rounded-lg text-lg">
                <FaTrophy />
              </span>
              KaushalAI Challenges Hub
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Daily algorithmic drills, executive tech briefs & weekly microservice project tracks
            </p>
          </div>

          {/* Gamified Stats Badges */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 px-3.5 py-1.5 rounded-xl shadow-xs">
              <FaTrophy className="text-amber-500 text-base" />
              <div>
                <p className="text-[10px] uppercase font-bold text-amber-700 tracking-wider">
                  Total Points
                </p>
                <p className="text-sm font-extrabold text-amber-900">{stats.totalPoints} pts</p>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-orange-50 border border-orange-200 px-3.5 py-1.5 rounded-xl shadow-xs">
              <FaFire className="text-orange-500 text-base" />
              <div>
                <p className="text-[10px] uppercase font-bold text-orange-700 tracking-wider">
                  Daily Streak
                </p>
                <p className="text-sm font-extrabold text-orange-900">{stats.dailyStreak} days</p>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-purple-50 border border-purple-200 px-3.5 py-1.5 rounded-xl shadow-xs">
              <FaBolt className="text-purple-500 text-base" />
              <div>
                <p className="text-[10px] uppercase font-bold text-purple-700 tracking-wider">
                  Weekly Streak
                </p>
                <p className="text-sm font-extrabold text-purple-900">{stats.weeklyStreak} wks</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex gap-2 border-t border-gray-100 pt-2">
          <button
            onClick={() => setActiveTab("daily")}
            className={`py-2 px-5 font-bold text-sm rounded-lg transition-all flex items-center gap-2 ${
              activeTab === "daily"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            }`}
          >
            <FaClock />
            Section 1: Daily Challenges
          </button>
          <button
            onClick={() => setActiveTab("weekly")}
            className={`py-2 px-5 font-bold text-sm rounded-lg transition-all flex items-center gap-2 ${
              activeTab === "weekly"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            }`}
          >
            <FaGithub />
            Section 2: Weekly Challenges
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        {/* ========================================================= */}
        {/* SECTION 1: DAILY CHALLENGES (DSA & TECH ARTICLE)          */}
        {/* ========================================================= */}
        {activeTab === "daily" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left 8 Cols: DSA Problem & Monaco Online Compiler */}
            <div className="lg:col-span-8 flex flex-col gap-6">
              {/* DSA Problem Card */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`text-xs px-2.5 py-1 rounded-full font-bold border ${getDifficultyBadge(
                        dsaProblem?.difficulty
                      )}`}
                    >
                      {dsaProblem?.difficulty || "Medium"}
                    </span>
                    <span className="text-xs bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full font-medium border border-gray-200">
                      {dsaProblem?.category || "Algorithms"}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500 font-medium">Rotated Daily DSA</span>
                </div>

                <h2 className="text-2xl font-black text-gray-900 mb-3 tracking-tight">
                  {dsaProblem?.title || "Daily Coding Problem"}
                </h2>

                <p className="text-gray-700 text-sm leading-relaxed mb-4 whitespace-pre-line">
                  {dsaProblem?.problemStatement}
                </p>

                {/* Example I/O Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                  {dsaProblem?.examples?.map((ex, idx) => (
                    <div
                      key={idx}
                      className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs"
                    >
                      <p className="font-bold text-gray-800 mb-1">Example {idx + 1}:</p>
                      <p className="font-mono text-gray-600 truncate">
                        <span className="font-semibold text-gray-500">Input:</span> {ex.input}
                      </p>
                      <p className="font-mono text-green-700 font-semibold truncate">
                        <span className="font-semibold text-gray-500">Output:</span> {ex.output}
                      </p>
                      {ex.explanation && (
                        <p className="text-gray-500 mt-1 italic">{ex.explanation}</p>
                      )}
                    </div>
                  ))}
                </div>

                {/* Constraints */}
                {dsaProblem?.constraints?.length > 0 && (
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs">
                    <p className="font-bold text-gray-700 mb-1">Constraints:</p>
                    <ul className="list-disc list-inside space-y-0.5 text-gray-600 font-mono">
                      {dsaProblem.constraints.map((c, i) => (
                        <li key={i}>{c}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Online Compiler & Monaco Editor Card */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
                {/* Editor Top Bar */}
                <div className="bg-gray-900 text-white px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs uppercase font-extrabold tracking-wider text-gray-400">
                      Language:
                    </span>
                    {["python", "javascript", "cpp", "java"].map((lang) => (
                      <button
                        key={lang}
                        onClick={() => setSelectedLanguage(lang)}
                        className={`text-xs px-2.5 py-1 rounded-md font-bold transition-all uppercase ${
                          selectedLanguage === lang
                            ? "bg-blue-600 text-white shadow-xs"
                            : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                        }`}
                      >
                        {lang === "cpp" ? "C++" : lang}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        if (dsaProblem?.starterCode) {
                          setCode(dsaProblem.starterCode[selectedLanguage] || "");
                          toast.success("Code reset to starter boilerplate");
                        }
                      }}
                      className="text-xs text-gray-400 hover:text-white px-2 py-1 rounded-md transition-colors flex items-center gap-1"
                      title="Reset code"
                    >
                      <FaUndo /> Reset
                    </button>
                  </div>
                </div>

                {/* Monaco Code Editor */}
                <div className="h-96 w-full bg-[#1e1e1e]">
                  <Editor
                    height="100%"
                    language={selectedLanguage === "cpp" ? "cpp" : selectedLanguage}
                    theme="vs-dark"
                    value={code}
                    onChange={(val) => setCode(val || "")}
                    options={{
                      fontSize: 14,
                      minimap: { enabled: false },
                      scrollBeyondLastLine: false,
                      automaticLayout: true,
                      tabSize: 2,
                    }}
                  />
                </div>

                {/* Editor Action Buttons Bar */}
                <div className="p-4 bg-gray-50 border-t border-gray-200 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleRequestAiFeedback("hint")}
                      disabled={isLoadingAi}
                      className="bg-amber-50 border border-amber-300 hover:bg-amber-100 text-amber-800 text-xs font-bold px-3 py-2 rounded-lg transition-all flex items-center gap-1.5 shadow-2xs"
                    >
                      <FaLightbulb className="text-amber-600" />
                      Get AI Hint
                    </button>

                    <button
                      onClick={() => handleRequestAiFeedback("complexity")}
                      disabled={isLoadingAi}
                      className="bg-purple-50 border border-purple-300 hover:bg-purple-100 text-purple-800 text-xs font-bold px-3 py-2 rounded-lg transition-all flex items-center gap-1.5 shadow-2xs"
                    >
                      <FaChartLine className="text-purple-600" />
                      Analyze Complexity
                    </button>
                  </div>

                  <button
                    onClick={handleRunCode}
                    disabled={isExecuting}
                    className="bg-green-600 hover:bg-green-700 text-white font-extrabold text-sm px-6 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
                  >
                    <FaPlay className="text-xs" />
                    {isExecuting ? "Executing Code..." : "Run Test Cases"}
                  </button>
                </div>

                {/* Execution Results Console */}
                {executionResult && (
                  <div className="p-4 border-t border-gray-200 bg-gray-900 text-white font-mono text-xs">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded font-bold uppercase text-[11px] ${
                            executionResult.allPassed
                              ? "bg-green-500/20 text-green-400 border border-green-500/40"
                              : "bg-red-500/20 text-red-400 border border-red-500/40"
                          }`}
                        >
                          {executionResult.allPassed ? "All Passed" : "Tests Failed"}
                        </span>
                        <span className="text-gray-400">
                          {executionResult.passedCount} / {executionResult.totalCount} test cases
                          passed
                        </span>
                      </div>
                    </div>

                    {/* Test Case Tab Selectors */}
                    <div className="flex gap-2 mb-3">
                      {executionResult.results.map((res, idx) => (
                        <button
                          key={idx}
                          onClick={() => setSelectedTestCaseIndex(idx)}
                          className={`px-3 py-1 rounded text-xs font-bold transition-all ${
                            selectedTestCaseIndex === idx
                              ? "bg-gray-700 text-white ring-1 ring-blue-400"
                              : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                          } ${res.passed ? "border-b-2 border-green-400" : "border-b-2 border-red-400"}`}
                        >
                          Case {idx + 1} {res.isHidden ? "(Hidden)" : ""}
                        </button>
                      ))}
                    </div>

                    {/* Active Test Case Detail */}
                    {executionResult.results[selectedTestCaseIndex] && (
                      <div className="bg-gray-950 p-3 rounded-lg border border-gray-800 space-y-2">
                        <div>
                          <span className="text-gray-500">Input:</span>
                          <p className="text-gray-200 whitespace-pre-wrap">
                            {executionResult.results[selectedTestCaseIndex].input}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-500">Expected Output:</span>
                          <p className="text-green-400">
                            {executionResult.results[selectedTestCaseIndex].expectedOutput}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-500">Actual Output:</span>
                          <p
                            className={
                              executionResult.results[selectedTestCaseIndex].passed
                                ? "text-green-400"
                                : "text-red-400"
                            }
                          >
                            {executionResult.results[selectedTestCaseIndex].actualOutput}
                          </p>
                        </div>
                        {executionResult.results[selectedTestCaseIndex].stderr && (
                          <div>
                            <span className="text-red-400">Error:</span>
                            <p className="text-red-300 whitespace-pre-wrap">
                              {executionResult.results[selectedTestCaseIndex].stderr}
                            </p>
                          </div>
                        )}
                        <p className="text-gray-500 text-[10px] pt-1">
                          Execution time:{" "}
                          {executionResult.results[selectedTestCaseIndex].executionTimeMs} ms
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Gemini AI Feedback Output Panel */}
                {aiFeedback && (
                  <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-t border-blue-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
                        <FaLightbulb className="text-blue-600" />
                        Gemini AI Assistant Guidance ({aiFeedback.type})
                      </span>
                      <button
                        onClick={() => setAiFeedback(null)}
                        className="text-xs text-blue-600 hover:text-blue-800 font-bold"
                      >
                        Dismiss
                      </button>
                    </div>
                    <div className="text-xs text-gray-800 leading-relaxed whitespace-pre-wrap bg-white p-3.5 rounded-xl border border-blue-100 shadow-xs">
                      {aiFeedback.text}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right 4 Cols: Tech Article of the Day */}
            <div className="lg:col-span-4 flex flex-col gap-6">
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sticky top-28">
                <div className="flex items-center justify-between mb-3">
                  <span className="bg-indigo-100 text-indigo-800 text-xs px-2.5 py-1 rounded-full font-bold border border-indigo-200">
                    {article?.category || "System Design"}
                  </span>
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    <FaClock className="text-gray-400" />
                    {article?.readTimeMinutes || 3} min read
                  </span>
                </div>

                <h3 className="text-xl font-black text-gray-900 mb-2 leading-tight">
                  {article?.title || "Daily High-Signal Tech Read"}
                </h3>

                <p className="text-xs text-gray-500 mb-4">By {article?.author || "Engineering Team"}</p>

                {/* 3-Minute Executive Summary */}
                <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-3.5 mb-4 text-xs text-gray-800 leading-relaxed">
                  <p className="font-extrabold text-blue-950 uppercase text-[10px] tracking-wider mb-1">
                    3-Minute Executive Summary
                  </p>
                  <p>{article?.summary3Min}</p>
                </div>

                {/* Key Takeaways */}
                <div className="mb-4">
                  <p className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                    Key Takeaways:
                  </p>
                  <ul className="space-y-2 text-xs text-gray-700">
                    {article?.keyTakeaways?.map((takeaway, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <FaCheck className="text-blue-600 text-xs mt-0.5 shrink-0" />
                        <span>{takeaway}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Full Article Accordion */}
                {article?.fullText && (
                  <div className="mb-4 border-t border-gray-100 pt-3">
                    <button
                      onClick={() => setShowFullArticle(!showFullArticle)}
                      className="text-xs text-blue-600 hover:text-blue-800 font-bold flex items-center justify-between w-full"
                    >
                      <span>{showFullArticle ? "Hide Full Text" : "Read Full Deep Dive"}</span>
                      {showFullArticle ? <FaChevronUp /> : <FaChevronDown />}
                    </button>

                    {showFullArticle && (
                      <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700 leading-relaxed whitespace-pre-wrap max-h-60 overflow-y-auto">
                        {article.fullText}
                      </div>
                    )}
                  </div>
                )}

                {/* Mark As Read Button */}
                <button
                  onClick={handleMarkArticleRead}
                  disabled={isArticleRead}
                  className={`w-full py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-sm ${
                    isArticleRead
                      ? "bg-green-100 text-green-800 border border-green-300 cursor-default"
                      : "bg-blue-600 hover:bg-blue-700 text-white"
                  }`}
                >
                  <FaCheckCircle />
                  {isArticleRead ? "Completed (+15 pts awarded)" : "Mark as Read (+15 pts)"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* SECTION 2: WEEKLY CHALLENGES (MINI-PROJECT & COURSE TRACK)*/}
        {/* ========================================================= */}
        {activeTab === "weekly" && (
          <div className="flex flex-col gap-8">
            {/* Project Overview Card */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2">
                  <span className="bg-purple-600 text-white text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider">
                    Week {weeklyProject?.weekNumber || 1} Mini-Project
                  </span>
                  <span className="bg-purple-100 text-purple-800 text-xs font-bold px-3 py-1 rounded-full border border-purple-200">
                    {weeklyProject?.domain}
                  </span>
                </div>
                <span className="text-xs text-gray-500 font-medium">30-Point Grading Rubric</span>
              </div>

              <h2 className="text-3xl font-black text-gray-900 mb-3 tracking-tight">
                {weeklyProject?.title}
              </h2>

              <p className="text-gray-700 text-sm leading-relaxed mb-6">
                {weeklyProject?.overview}
              </p>

              {/* Architecture Requirements */}
              <div className="mb-6">
                <h4 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider mb-2">
                  Architecture & Implementation Requirements:
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {weeklyProject?.architectureRequirements?.map((req, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-2 bg-gray-50 border border-gray-200 p-3 rounded-xl text-xs text-gray-800"
                    >
                      <span className="bg-purple-600 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <span>{req}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Accepted Tech Stacks */}
              <div className="mb-6">
                <h4 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider mb-2">
                  Accepted Tech Stacks:
                </h4>
                <div className="flex flex-wrap gap-2">
                  {weeklyProject?.acceptedTechStacks?.map((stack, idx) => (
                    <span
                      key={idx}
                      className="bg-gray-100 text-gray-800 text-xs px-3 py-1 rounded-lg font-semibold border border-gray-200"
                    >
                      {stack}
                    </span>
                  ))}
                </div>
              </div>

              {/* Required API Endpoints */}
              <div className="mb-6">
                <h4 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider mb-2">
                  Required API Endpoints:
                </h4>
                <div className="overflow-x-auto border border-gray-200 rounded-xl">
                  <table className="min-w-full divide-y divide-gray-200 text-xs text-left">
                    <thead className="bg-gray-50 font-bold text-gray-700">
                      <tr>
                        <th className="px-4 py-2.5">Method</th>
                        <th className="px-4 py-2.5">Endpoint Path</th>
                        <th className="px-4 py-2.5">Description</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 font-mono text-gray-800 bg-white">
                      {weeklyProject?.apiEndpoints?.map((ep, idx) => (
                        <tr key={idx}>
                          <td className="px-4 py-2.5 font-bold text-blue-700">{ep.method}</td>
                          <td className="px-4 py-2.5 font-bold text-gray-900">{ep.path}</td>
                          <td className="px-4 py-2.5 font-sans text-gray-600">{ep.description}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Grading Rubric */}
              <div>
                <h4 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider mb-2">
                  Gemini Automated Evaluation Rubric:
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {weeklyProject?.gradingRubric?.map((rubric, idx) => (
                    <div
                      key={idx}
                      className="bg-purple-50/50 border border-purple-200 rounded-xl p-3.5 text-xs"
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-extrabold text-purple-900">{rubric.criteria}</span>
                        <span className="font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded">
                          {rubric.maxScore} pts
                        </span>
                      </div>
                      <p className="text-gray-600 leading-relaxed">{rubric.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* GitHub Submission Portal & Gemini Assessment */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8">
              <h3 className="text-2xl font-black text-gray-900 mb-2 flex items-center gap-2">
                <FaGithub className="text-gray-800 text-2xl" />
                Submit Public GitHub Repository
              </h3>
              <p className="text-xs text-gray-600 mb-5">
                Our backend pulls your repository README, directory hierarchy, and core logic files via
                the GitHub REST API. The Gemini API analyzes code cleanliness, architecture, and edge
                case coverage.
              </p>

              <form onSubmit={handleSubmitGitHubRepo} className="flex flex-col sm:flex-row gap-3 mb-6">
                <input
                  type="url"
                  placeholder="https://github.com/your-username/your-repo"
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  required
                  className="flex-1 p-3.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 font-mono text-sm"
                />
                <button
                  type="submit"
                  disabled={isEvaluatingRepo}
                  className="bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-sm px-8 py-3.5 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <FaGithub />
                  {isEvaluatingRepo ? "Inspecting & Evaluating..." : "Evaluate with Gemini"}
                </button>
              </form>

              {/* Evaluation Results Card */}
              {repoEvaluation && (
                <div className="bg-gradient-to-br from-purple-50/60 to-indigo-50/60 border border-purple-200 rounded-2xl p-6">
                  {/* Repo Metadata Header */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-purple-200/60 pb-4 mb-4">
                    <div>
                      <h4 className="text-lg font-black text-gray-900 font-mono">
                        {repoEvaluation.repoInfo?.owner} / {repoEvaluation.repoInfo?.repo}
                      </h4>
                      <p className="text-xs text-gray-500">
                        Language: {repoEvaluation.repoInfo?.language || "Unknown"} | Inspected{" "}
                        {repoEvaluation.repoInfo?.fileCount} files on{" "}
                        {repoEvaluation.repoInfo?.defaultBranch} branch
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-xs uppercase font-bold text-gray-500">Total Score</p>
                      <p className="text-3xl font-black text-purple-900">
                        {repoEvaluation.evaluation?.totalScore} / 30
                      </p>
                    </div>
                  </div>

                  {/* 3 Rubric Score Badges */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
                    <div className="bg-white border border-purple-100 rounded-xl p-3.5 text-center shadow-2xs">
                      <p className="text-xs text-gray-500 font-bold uppercase mb-0.5">
                        Architecture
                      </p>
                      <p className="text-2xl font-black text-purple-700">
                        {repoEvaluation.evaluation?.architectureScore} / 10
                      </p>
                    </div>

                    <div className="bg-white border border-purple-100 rounded-xl p-3.5 text-center shadow-2xs">
                      <p className="text-xs text-gray-500 font-bold uppercase mb-0.5">
                        Cleanliness & Patterns
                      </p>
                      <p className="text-2xl font-black text-purple-700">
                        {repoEvaluation.evaluation?.cleanlinessScore} / 10
                      </p>
                    </div>

                    <div className="bg-white border border-purple-100 rounded-xl p-3.5 text-center shadow-2xs">
                      <p className="text-xs text-gray-500 font-bold uppercase mb-0.5">
                        Error Handling
                      </p>
                      <p className="text-2xl font-black text-purple-700">
                        {repoEvaluation.evaluation?.errorHandlingScore} / 10
                      </p>
                    </div>
                  </div>

                  {/* Constructive Narrative Feedback */}
                  <div className="bg-white border border-purple-100 rounded-xl p-4 mb-4 text-xs text-gray-800 leading-relaxed shadow-2xs">
                    <p className="font-extrabold text-purple-950 uppercase text-[11px] mb-1">
                      Architectural Feedback:
                    </p>
                    <p className="whitespace-pre-line">
                      {repoEvaluation.evaluation?.constructiveFeedback}
                    </p>
                  </div>

                  {/* Actionable Recommendations */}
                  <div className="bg-white border border-purple-100 rounded-xl p-4 text-xs text-gray-800 shadow-2xs">
                    <p className="font-extrabold text-purple-950 uppercase text-[11px] mb-2">
                      Actionable Improvement Recommendations:
                    </p>
                    <ul className="space-y-1.5 list-disc list-inside text-gray-700">
                      {repoEvaluation.evaluation?.recommendations?.map((rec, i) => (
                        <li key={i}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>

            {/* Complete Course Module (Weekly Learning Track) */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div>
                  <h3 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                    <FaYoutube className="text-red-600 text-2xl" />
                    Complete Course Module: Weekly Learning Track
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Curated curriculum aligned with this week's mini-project architecture
                  </p>
                </div>

                <a
                  href={weeklyProject?.learningTrack?.playlistUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-all"
                >
                  Open YouTube Playlist <FaExternalLinkAlt className="text-[10px]" />
                </a>
              </div>

              {/* Progress Bar */}
              <div className="mb-6 bg-gray-50 border border-gray-200 rounded-xl p-4">
                <div className="flex justify-between items-center text-xs font-bold text-gray-700 mb-1.5">
                  <span>Track Progression:</span>
                  <span>
                    {completedModules.length} of{" "}
                    {weeklyProject?.learningTrack?.modules?.length || 4} Completed (
                    {Math.round(
                      (completedModules.length /
                        (weeklyProject?.learningTrack?.modules?.length || 4)) *
                        100
                    )}
                    %)
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-green-500 h-2.5 rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.round(
                        (completedModules.length /
                          (weeklyProject?.learningTrack?.modules?.length || 4)) *
                          100
                      )}%`,
                    }}
                  />
                </div>
              </div>

              {/* Modules Checklist */}
              <div className="space-y-3">
                {weeklyProject?.learningTrack?.modules?.map((mod) => {
                  const isChecked = completedModules.includes(mod.id);
                  return (
                    <div
                      key={mod.id}
                      onClick={() => handleToggleModule(mod.id)}
                      className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all ${
                        isChecked
                          ? "bg-green-50/70 border-green-300 text-green-900"
                          : "bg-white border-gray-200 hover:border-gray-300 text-gray-800"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="w-4 h-4 text-green-600 rounded focus:ring-green-400"
                        />
                        <div>
                          <p className={`text-sm font-bold ${isChecked ? "line-through text-gray-500" : ""}`}>
                            {mod.title}
                          </p>
                          <span className="text-xs text-gray-400">{mod.duration}</span>
                        </div>
                      </div>

                      <a
                        href={mod.videoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-xs text-blue-600 hover:underline flex items-center gap-1 font-semibold"
                      >
                        Watch Video <FaExternalLinkAlt className="text-[10px]" />
                      </a>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChallengesPage;
