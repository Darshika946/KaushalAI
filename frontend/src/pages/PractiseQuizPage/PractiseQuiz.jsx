import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import Editor from '@monaco-editor/react';
import { AI_MOCK_URL } from '../../config/api';

const isCodeRequiredQuestion = (question) => {
  if (!question || typeof question !== 'string') return false;
  const q = question.trim().toLowerCase();

  // If question purely asks for explanation, description, or comparison without code directives
  const isTheoreticalExplanation =
    /^(?:explain|describe|what is|what are|how does|why would|compare|difference between|discuss)\b/.test(q) &&
    !/\b(?:write|code|implement)\s+(?:a\s+)?(?:code|function|program|script|query|algorithm|class|solution)\b/.test(q);

  if (isTheoreticalExplanation) return false;

  // Explicit directives demanding written code or program implementation
  const codeDirectives = [
    /\bwrite\s+(?:a\s+)?(?:function|program|code|script|algorithm|method|query|solution|class|regex)\b/,
    /\bimplement\s+(?:a\s+)?(?:function|algorithm|solution|method|class|data structure|queue|stack|linked list|tree)\b/,
    /\bcode\s+(?:a\s+)?(?:solution|function|algorithm|program)\b/,
    /\bcreate\s+(?:a\s+)?(?:function|program|script|query)\b/,
    /\bwrite\s+(?:the\s+)?(?:sql\s+query|python\s+code|javascript\s+code|c\+\+\s+code|java\s+code)\b/,
    /\bgiven\s+.*\b(?:write|implement|find)\b.*\b(?:function|program|code|algorithm)\b/,
    /\bwrite\s+code\b/,
  ];

  return codeDirectives.some((regex) => regex.test(q));
};

const MockInterviewPage = () => {
  const [params, setParams] = useState({
    domain: '',
    language: '',
    interview_type: '',
    difficulty: '',
    num: '5',
  });

  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [customLanguage, setCustomLanguage] = useState('');

  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [consoleOutputs, setConsoleOutputs] = useState({});
  const [runningIndex, setRunningIndex] = useState(null);
  const [evaluations, setEvaluations] = useState([]);
  const [step, setStep] = useState(0);

  // Speech Recognition States
  const [listeningIndex, setListeningIndex] = useState(null);
  const [speechError, setSpeechError] = useState(null);
  const recognitionRef = useRef(null);
  const baseAnswerRef = useRef('');

  const isSpeechSupported = typeof window !== 'undefined' &&
    !!(window.SpeechRecognition || window.webkitSpeechRecognition);

  // Stop any active speech recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const handleChange = (e) => {
    setParams({ ...params, [e.target.name]: e.target.value });
  };

  const handleLanguageSelect = (e) => {
    const value = e.target.value;
    setSelectedLanguage(value);
    if (value === 'Other') {
      setParams((prev) => ({ ...prev, language: customLanguage.trim() }));
    } else {
      setParams((prev) => ({ ...prev, language: value }));
    }
  };

  const handleCustomLanguageChange = (e) => {
    const val = e.target.value;
    setCustomLanguage(val);
    setParams((prev) => ({ ...prev, language: val.trim() }));
  };

  const getEffectiveLanguage = () => {
    if (selectedLanguage === 'Other') {
      return customLanguage.trim() || 'General';
    }
    return params.language || 'JavaScript';
  };

  const getMonacoLanguage = (lang) => {
    if (!lang) return 'javascript';
    const l = lang.toLowerCase();
    if (l.includes('type')) return 'typescript';
    if (l.includes('py')) return 'python';
    if (l.includes('java') && !l.includes('script')) return 'java';
    if (l.includes('c++')) return 'cpp';
    if (l.includes('c#')) return 'csharp';
    if (l.includes('go')) return 'go';
    if (l.includes('rust')) return 'rust';
    if (l.includes('php')) return 'php';
    if (l.includes('sql')) return 'sql';
    return 'javascript';
  };

  const getJudge0LanguageId = (lang) => {
    if (!lang) return 63; // JavaScript
    const l = lang.toLowerCase();
    if (l.includes('type')) return 74; // TypeScript
    if (l.includes('py')) return 71; // Python
    if (l.includes('java') && !l.includes('script')) return 62; // Java
    if (l.includes('c++')) return 54; // C++
    if (l.includes('c#')) return 51; // C#
    if (l.includes('go')) return 60; // Go
    if (l.includes('rust')) return 73; // Rust
    if (l.includes('php')) return 68; // PHP
    if (l.includes('sql')) return 82; // SQLite
    return 63; // Default JS
  };

  const getStarterTemplate = (monacoLang) => {
    switch (monacoLang) {
      case 'python':
        return `# Write your solution below
def solution():
    # Implement algorithm
    return 'Result'

print(solution())`;
      case 'typescript':
        return `// Write your TypeScript solution below
function solution(): string {
  // Implement algorithm
  return 'Result';
}

console.log(solution());`;
      case 'java':
        return `public class Main {
    public static void main(String[] args) {
        // Implement algorithm
        System.out.println("Result");
    }
}`;
      case 'cpp':
        return `#include <iostream>
using namespace std;

int main() {
    // Implement algorithm
    cout << "Result" << endl;
    return 0;
}`;
      case 'csharp':
        return `using System;

public class Program {
    public static void Main() {
        // Implement algorithm
        Console.WriteLine("Result");
    }
}`;
      case 'go':
        return `package main
import "fmt"

func main() {
    // Implement algorithm
    fmt.Println("Result")
}`;
      case 'rust':
        return `fn main() {
    // Implement algorithm
    println!("Result");
}`;
      case 'php':
        return `<?php
// Implement algorithm
function solution() {
    return "Result";
}

echo solution();
?>`;
      case 'sql':
        return `-- Write your SQL query below
SELECT 1 AS output;`;
      default:
        return `// Write your JavaScript solution below
function solution() {
  // Implement algorithm
  return 'Result';
}

console.log(solution());`;
    }
  };

  const getSpeechLang = (lang) => {
    if (!lang) return 'en-US';
    const l = lang.toLowerCase();
    if (l.includes('hindi')) return 'hi-IN';
    if (l.includes('spanish')) return 'es-ES';
    if (l.includes('french')) return 'fr-FR';
    if (l.includes('german')) return 'de-DE';
    return 'en-US';
  };

  const toggleSpeechRecognition = (index) => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechError('Speech recognition is not supported in this browser. Please use Google Chrome or Microsoft Edge.');
      return;
    }

    if (listeningIndex === index) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setListeningIndex(null);
      return;
    }

    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }

    setSpeechError(null);
    baseAnswerRef.current = answers[index] || '';

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = getSpeechLang(getEffectiveLanguage());

      recognition.onstart = () => {
        setListeningIndex(index);
        setSpeechError(null);
      };

      recognition.onresult = (event) => {
        let fullTranscript = '';
        for (let j = 0; j < event.results.length; j++) {
          fullTranscript += event.results[j][0].transcript;
        }

        const base = baseAnswerRef.current;
        const separator = base && !base.endsWith(' ') ? ' ' : '';
        const updated = base + separator + fullTranscript.trim();

        setAnswers((prev) => ({
          ...prev,
          [index]: updated,
        }));
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          setSpeechError('Microphone permission was denied. Please allow microphone access in your browser settings.');
        } else if (event.error === 'no-speech') {
          // Non-fatal event, continue listening
        } else {
          setSpeechError(`Speech recognition error: ${event.error}`);
        }
        setListeningIndex(null);
      };

      recognition.onend = () => {
        setListeningIndex(null);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error('Failed to start speech recognition:', err);
      setSpeechError('Failed to initialize speech recognition. Please check your microphone.');
      setListeningIndex(null);
    }
  };

  const executeCode = async (index) => {
    const effectiveLang = getEffectiveLanguage();
    const monacoLang = getMonacoLanguage(effectiveLang);
    const starter = getStarterTemplate(monacoLang);
    const currentCode = answers[index] !== undefined && answers[index] !== '' ? answers[index] : starter;
    const judge0Id = getJudge0LanguageId(effectiveLang);

    setRunningIndex(index);
    setConsoleOutputs((prev) => ({
      ...prev,
      [index]: { status: 'Compiling and executing...', stdout: '', stderr: '', time: '', memory: '' },
    }));

    try {
      const res = await axios.post(
        'https://ce.judge0.com/submissions?wait=true',
        {
          source_code: currentCode,
          language_id: judge0Id,
        },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 15000,
        }
      );

      const { stdout, stderr, compile_output, message, time, memory, status } = res.data;
      const outputText = stdout || '';
      const errorText = stderr || compile_output || message || '';

      setConsoleOutputs((prev) => ({
        ...prev,
        [index]: {
          status: status?.description || 'Finished',
          stdout: outputText,
          stderr: errorText,
          time: time ? `${time}s` : '',
          memory: memory ? `${(memory / 1024).toFixed(1)} MB` : '',
        },
      }));
    } catch (err) {
      console.error('Judge0 execution error:', err);
      // Client-side fallback for JavaScript
      if (monacoLang === 'javascript') {
        try {
          const logs = [];
          const customConsole = {
            log: (...args) => logs.push(args.map((a) => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ')),
            error: (...args) => logs.push('Error: ' + args.join(' ')),
          };
          const runFn = new Function('console', currentCode);
          runFn(customConsole);

          setConsoleOutputs((prev) => ({
            ...prev,
            [index]: {
              status: 'Executed (Browser Runtime)',
              stdout: logs.join('\n') || 'Program executed with no output.',
              stderr: '',
              time: '< 0.01s',
              memory: 'N/A',
            },
          }));
          return;
        } catch (clientErr) {
          setConsoleOutputs((prev) => ({
            ...prev,
            [index]: {
              status: 'Runtime Error (Browser)',
              stdout: '',
              stderr: String(clientErr.message),
              time: '< 0.01s',
              memory: 'N/A',
            },
          }));
          return;
        }
      }

      setConsoleOutputs((prev) => ({
        ...prev,
        [index]: {
          status: 'Execution Failed',
          stdout: '',
          stderr: err.response?.data?.message || err.message || 'Execution service unreachable. Check network connectivity.',
          time: '',
          memory: '',
        },
      }));
    } finally {
      setRunningIndex(null);
    }
  };

  const generateQuestions = async () => {
    const effectiveLang = getEffectiveLanguage();
    const payload = {
      ...params,
      language: effectiveLang,
    };

    try {
      const res = await axios.post(`${AI_MOCK_URL}/generate-questions`, payload);
      const fetchedQuestions = res.data.questions || [];
      setQuestions(fetchedQuestions);

      // Prepopulate starter template ONLY for questions that require writing code
      const initialAnswers = {};
      const monacoLang = getMonacoLanguage(effectiveLang);

      fetchedQuestions.forEach((qText, idx) => {
        if (isCodeRequiredQuestion(qText)) {
          initialAnswers[idx] = getStarterTemplate(monacoLang);
        } else {
          initialAnswers[idx] = '';
        }
      });

      setAnswers(initialAnswers);
      setConsoleOutputs({});
      setStep(2);
    } catch (err) {
      console.error('Error generating questions:', err);
      // Fallback questions for local demo if AI service is starting
      const fallbackQuestions = [
        'Explain how prototypal inheritance works in JavaScript.',
        'Write a function to reverse a singly linked list and return the new head.',
        'What are closures in JavaScript and what is their practical use?',
        'Implement an algorithm to find the maximum sub-array sum using Kadane algorithm.'
      ];
      setQuestions(fallbackQuestions);

      const initialAnswers = {};
      const monacoLang = getMonacoLanguage(effectiveLang);
      fallbackQuestions.forEach((qText, idx) => {
        if (isCodeRequiredQuestion(qText)) {
          initialAnswers[idx] = getStarterTemplate(monacoLang);
        } else {
          initialAnswers[idx] = '';
        }
      });

      setAnswers(initialAnswers);
      setConsoleOutputs({});
      setStep(2);
    }
  };

  const handleAnswerChange = (index, value) => {
    setAnswers((prev) => ({ ...prev, [index]: value }));
  };

  const submitAnswers = async () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setListeningIndex(null);
    }

    const effectiveLang = getEffectiveLanguage();
    const monacoLang = getMonacoLanguage(effectiveLang);
    const evals = [];

    for (let i = 0; i < questions.length; i++) {
      const isCoding = isCodeRequiredQuestion(questions[i]);
      let candidateAnswer = answers[i] || '';

      if (isCoding) {
        const executionInfo = consoleOutputs[i];
        let execSummary = 'None (Code was not run before submission)';
        if (executionInfo) {
          execSummary = `Status: ${executionInfo.status}\nStdout: ${executionInfo.stdout || 'None'}\nStderr: ${executionInfo.stderr || 'None'}`;
        }
        candidateAnswer = `Candidate Code (${effectiveLang}):\n\`\`\`${monacoLang}\n${answers[i] || ''}\n\`\`\`\n\nTerminal Run Results:\n${execSummary}`;
      }

      try {
        const res = await axios.post(`${AI_MOCK_URL}/evaluate-answer`, {
          question: questions[i],
          answer: candidateAnswer,
          language: effectiveLang,
        });
        evals.push(res.data.evaluation);
      } catch (err) {
        evals.push({
          is_correct: false,
          where_you_are_wrong: 'No meaningful answer provided or evaluation error occurred.',
          ideal_correct_answer: 'Ensure your response thoroughly covers key concepts, principles, and accurate technical terminology.',
          score: 0,
          feedback_summary: 'Non-responsive or invalid submission.',
        });
      }
    }
    setEvaluations(evals);
    setStep(3);
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-[#1A2A44] to-[#2C3E50] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-4xl bg-white rounded-lg shadow-2xl p-8 space-y-6">
        <h2 className="text-3xl font-bold text-center text-blue-700 mb-6">AI Mock Interview</h2>

        {/* Step 0: Instructions */}
        {step === 0 && (
          <div className="space-y-4 text-gray-800">
            <h3 className="text-xl font-semibold text-center mb-2">Instructions</h3>
            <ul className="list-disc pl-5 space-y-2">
              <li>Select your domain, programming language, interview type, and difficulty from the dropdown menus.</li>
              <li>When a question asks you to write or implement code, an embedded editor and compiler will be provided.</li>
              <li>You can run and test your code in the integrated terminal before submitting.</li>
              <li>For conceptual and theoretical questions, a standard text area with voice input is provided.</li>
              <li>Your responses will be evaluated instantly against factual technical ground truth.</li>
            </ul>
            <div className="text-center mt-6">
              <button
                onClick={() => setStep(1)}
                className="bg-blue-700 hover:bg-blue-800 text-white px-6 py-3 rounded-md font-semibold transition"
              >
                Start Interview Setup
              </button>
            </div>
          </div>
        )}

        {/* Step 1: Input Form with Dropdown Select Menus */}
        {step === 1 && (
          <div className="grid gap-4">
            {/* Domain Dropdown */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Domain
              </label>
              <select
                name="domain"
                value={params.domain}
                onChange={handleChange}
                className="w-full p-3 rounded-md border border-gray-300 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="" disabled>Select Domain</option>
                <option value="Full Stack Web Development">Full Stack Web Development</option>
                <option value="Frontend Development">Frontend Development</option>
                <option value="Backend Development">Backend Development</option>
                <option value="AI / Machine Learning">AI / Machine Learning</option>
                <option value="Data Science">Data Science</option>
                <option value="Cloud / DevOps">Cloud / DevOps</option>
                <option value="Mobile App Development">Mobile App Development</option>
              </select>
            </div>

            {/* Programming Language Dropdown with Other Option */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Programming Language
              </label>
              <select
                name="language"
                value={selectedLanguage}
                onChange={handleLanguageSelect}
                className="w-full p-3 rounded-md border border-gray-300 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="" disabled>Select Programming Language</option>
                <option value="JavaScript">JavaScript</option>
                <option value="TypeScript">TypeScript</option>
                <option value="Python">Python</option>
                <option value="Java">Java</option>
                <option value="C++">C++</option>
                <option value="C#">C#</option>
                <option value="Go">Go</option>
                <option value="Rust">Rust</option>
                <option value="PHP">PHP</option>
                <option value="SQL">SQL</option>
                <option value="Other">Other</option>
              </select>

              {/* Custom Language Input when Other is selected */}
              {selectedLanguage === 'Other' && (
                <div className="mt-2">
                  <input
                    type="text"
                    value={customLanguage}
                    onChange={handleCustomLanguageChange}
                    placeholder="Enter your programming language (e.g. Kotlin, Swift, Ruby, Scala)..."
                    className="w-full p-3 rounded-md border border-gray-300 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
              )}
            </div>

            {/* Interview Type Dropdown */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Interview Type
              </label>
              <select
                name="interview_type"
                value={params.interview_type}
                onChange={handleChange}
                className="w-full p-3 rounded-md border border-gray-300 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="" disabled>Select Interview Type</option>
                <option value="Technical / Coding">Technical / Coding</option>
                <option value="Conceptual / Theory">Conceptual / Theory</option>
                <option value="Behavioral / HR">Behavioral / HR</option>
                <option value="System Design">System Design</option>
              </select>
            </div>

            {/* Difficulty Dropdown */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Difficulty
              </label>
              <select
                name="difficulty"
                value={params.difficulty}
                onChange={handleChange}
                className="w-full p-3 rounded-md border border-gray-300 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="" disabled>Select Difficulty</option>
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>

            <button
              onClick={generateQuestions}
              disabled={!params.domain || (selectedLanguage === 'Other' && !customLanguage.trim())}
              className={`w-full py-3 rounded-md font-semibold transition mt-2 ${
                !params.domain || (selectedLanguage === 'Other' && !customLanguage.trim())
                  ? 'bg-gray-400 text-white cursor-not-allowed'
                  : 'bg-blue-700 hover:bg-blue-800 text-white'
              }`}
            >
              Generate Questions
            </button>
          </div>
        )}

        {/* Step 2: Answering */}
        {step === 2 && (
          <div className="space-y-8">
            {!isSpeechSupported && (
              <div className="p-3 bg-yellow-50 border border-yellow-300 text-yellow-800 rounded-md text-sm">
                Speech recognition is not supported in this browser. Please use Google Chrome or Microsoft Edge for voice input.
              </div>
            )}

            {questions.map((q, i) => {
              const effectiveLang = getEffectiveLanguage();
              const monacoLang = getMonacoLanguage(effectiveLang);
              const isCodingQuestion = isCodeRequiredQuestion(q);

              return (
                <div key={i} className="p-5 bg-gray-50 rounded-lg border border-gray-200 space-y-4">
                  <div className="border-b pb-2">
                    <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                      Question {i + 1}
                    </span>
                    <p className="font-semibold text-gray-900 mt-1">{q}</p>
                  </div>

                  {/* Compiler ONLY rendered when the question specifically asks to write code */}
                  {isCodingQuestion ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Language: {effectiveLang} ({monacoLang})
                        </span>
                        <button
                          type="button"
                          disabled={runningIndex === i}
                          onClick={() => executeCode(i)}
                          className={`px-4 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider transition ${
                            runningIndex === i
                              ? 'bg-gray-600 text-white cursor-not-allowed'
                              : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
                          }`}
                        >
                          {runningIndex === i ? 'Running...' : 'Run Code'}
                        </button>
                      </div>

                      {/* Embedded Monaco Code Editor */}
                      <div className="border border-gray-300 rounded-md overflow-hidden shadow-inner">
                        <Editor
                          height="260px"
                          language={monacoLang}
                          theme="vs-dark"
                          value={answers[i] !== undefined && answers[i] !== '' ? answers[i] : getStarterTemplate(monacoLang)}
                          onChange={(val) => handleAnswerChange(i, val || '')}
                          options={{
                            minimap: { enabled: false },
                            fontSize: 13,
                            scrollBeyondLastLine: false,
                            lineNumbers: 'on',
                            automaticLayout: true,
                            tabSize: 2,
                          }}
                        />
                      </div>

                      {/* Terminal Console Output Box */}
                      <div className="bg-gray-900 rounded-md border border-gray-800 overflow-hidden font-mono text-xs">
                        <div className="bg-gray-800 px-4 py-2 flex items-center justify-between text-gray-300 border-b border-gray-700">
                          <span className="font-semibold uppercase tracking-wider text-[11px]">
                            Terminal Output
                          </span>
                          {consoleOutputs[i] && (
                            <span className="text-[11px] text-gray-400">
                              Status: {consoleOutputs[i].status}
                              {consoleOutputs[i].time ? ` | Time: ${consoleOutputs[i].time}` : ''}
                              {consoleOutputs[i].memory ? ` | Mem: ${consoleOutputs[i].memory}` : ''}
                            </span>
                          )}
                        </div>
                        <div className="p-3 min-h-[60px] max-h-[140px] overflow-y-auto space-y-1">
                          {consoleOutputs[i] ? (
                            <>
                              {consoleOutputs[i].stdout && (
                                <pre className="text-emerald-400 whitespace-pre-wrap font-mono">
                                  {consoleOutputs[i].stdout}
                                </pre>
                              )}
                              {consoleOutputs[i].stderr && (
                                <pre className="text-red-400 whitespace-pre-wrap font-mono">
                                  {consoleOutputs[i].stderr}
                                </pre>
                              )}
                              {!consoleOutputs[i].stdout && !consoleOutputs[i].stderr && (
                                <p className="text-gray-500 italic">Program finished with no output.</p>
                              )}
                            </>
                          ) : (
                            <p className="text-gray-500 italic">
                              Click 'Run Code' to compile and inspect output.
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <textarea
                        value={answers[i] || ''}
                        onChange={(e) => handleAnswerChange(i, e.target.value)}
                        placeholder="Type your explanation here or click Start Speaking below..."
                        className="w-full p-3 rounded-md border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        rows={4}
                      />

                      {/* Voice Input Controls */}
                      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => toggleSpeechRecognition(i)}
                            className={`px-4 py-2 rounded-md text-sm font-semibold transition ${
                              listeningIndex === i
                                ? 'bg-red-600 hover:bg-red-700 text-white'
                                : 'bg-blue-600 hover:bg-blue-700 text-white'
                            }`}
                          >
                            {listeningIndex === i ? 'Stop Speaking' : 'Start Speaking'}
                          </button>
                          {listeningIndex === i && (
                            <span className="text-xs font-semibold text-red-600 uppercase tracking-wide">
                              Listening... Speak now
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Speech Error Message */}
                      {speechError && listeningIndex === i && (
                        <p className="text-xs text-red-600 mt-1">{speechError}</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            <button
              onClick={submitAnswers}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-md font-semibold transition"
            >
              Submit Answers
            </button>
          </div>
        )}

        {/* Step 3: Evaluation */}
        {step === 3 && (
          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-center text-gray-800">
              Technical Evaluation Results
            </h3>
            {evaluations.map((evalData, i) => {
              const isObj = typeof evalData === 'object' && evalData !== null;
              const score = isObj ? evalData.score : null;

              const getBadgeColor = (s) => {
                if (s >= 7) return 'bg-green-100 text-green-800 border-green-300';
                if (s >= 4) return 'bg-yellow-100 text-yellow-800 border-yellow-300';
                return 'bg-red-100 text-red-800 border-red-300';
              };

              return (
                <div
                  key={i}
                  className="bg-white p-5 rounded-lg shadow border border-gray-200 space-y-3"
                >
                  <div className="flex justify-between items-start gap-4 border-b pb-3">
                    <div>
                      <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                        Question {i + 1}
                      </span>
                      <p className="font-semibold text-gray-900 mt-0.5">{questions[i]}</p>
                    </div>
                    {isObj && (
                      <span
                        className={`px-3 py-1 text-sm font-bold rounded-full border shrink-0 ${getBadgeColor(
                          score
                        )}`}
                      >
                        Score: {score}/10
                      </span>
                    )}
                  </div>

                  {isObj ? (
                    <div className="space-y-3 text-sm">
                      {/* Where You Are Wrong */}
                      {evalData.where_you_are_wrong && (
                        <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded text-red-900">
                          <p className="font-bold text-xs uppercase tracking-wider text-red-700 mb-1">
                            Corrections and Identified Technical Gaps:
                          </p>
                          <p className="whitespace-pre-line">{evalData.where_you_are_wrong}</p>
                        </div>
                      )}

                      {/* Ideal Correct Answer */}
                      {evalData.ideal_correct_answer && (
                        <div className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded text-blue-900">
                          <p className="font-bold text-xs uppercase tracking-wider text-blue-700 mb-1">
                            Ideal Technical Ground Truth:
                          </p>
                          <p className="whitespace-pre-line">{evalData.ideal_correct_answer}</p>
                        </div>
                      )}

                      {/* Feedback Summary */}
                      {evalData.feedback_summary && (
                        <div className="bg-gray-50 p-3 rounded text-gray-700">
                          <p className="font-semibold mb-1">Evaluation Summary:</p>
                          <p className="whitespace-pre-line">{evalData.feedback_summary}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-700 whitespace-pre-line text-sm">{evalData}</p>
                  )}
                </div>
              );
            })}

            <div className="text-center pt-4">
              <button
                onClick={() => {
                  setStep(1);
                  setAnswers({});
                  setConsoleOutputs({});
                  setEvaluations([]);
                }}
                className="bg-blue-700 hover:bg-blue-800 text-white px-6 py-2.5 rounded-md font-semibold transition"
              >
                Practice Another Topic
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default MockInterviewPage;
