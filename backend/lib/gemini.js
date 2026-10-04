import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

if (!apiKey) {
  console.warn("[WARNING] Neither GEMINI_API_KEY nor GOOGLE_API_KEY is defined in environment variables. Gemini calls will fail until an API key is provided.");
}

// Initialize the official Google Gen AI SDK client
export const ai = new GoogleGenAI({
  apiKey: apiKey || "",
});

// Default recommended model (can be overridden via GEMINI_MODEL env var)
export const DEFAULT_MODEL = process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";
const FALLBACK_MODEL = "gemini-3.5-flash-lite";

/**
 * Helper to generate text content using Gemini with automatic demand-spike fallback
 * @param {Object} options
 * @param {string} options.prompt - The user input or prompt
 * @param {string} [options.model] - Specific model name
 * @param {string} [options.systemInstruction] - Optional system instruction
 * @returns {Promise<string>} Generated text
 */
export const generateText = async ({ prompt, model = DEFAULT_MODEL, systemInstruction }) => {
  const currentKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!currentKey) {
    throw new Error("GEMINI_API_KEY is not configured in .env");
  }

  const config = {};
  if (systemInstruction) {
    config.systemInstruction = systemInstruction;
  }

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: Object.keys(config).length > 0 ? config : undefined,
    });

    if (!response || !response.text) {
      throw new Error("No text response received from Gemini API");
    }

    return response.text;
  } catch (error) {
    // If current model experiences a temporary demand spike (503), quota rate-limit (429), or is deprecated (404), fall back
    if ((error.status === 503 || error.status === 429 || error.status === 404 || error.message?.includes("503") || error.message?.includes("429") || error.message?.includes("404")) && model !== FALLBACK_MODEL) {
      console.warn(`[Gemini] Model ${model} returned ${error.status || 'error'}. Seamlessly switching to fallback: ${FALLBACK_MODEL}`);
      const fallbackResponse = await ai.models.generateContent({
        model: FALLBACK_MODEL,
        contents: prompt,
        config: Object.keys(config).length > 0 ? config : undefined,
      });
      if (fallbackResponse?.text) {
        return fallbackResponse.text;
      }
    }
    throw error;
  }
};


/**
 * Generate structured interview questions
 * @param {Object} params
 * @param {string} params.domain - Field / subject domain
 * @param {string} params.language - Output language
 * @param {string} params.interview_type - Type (e.g. Technical, Behavioral)
 * @param {string} params.difficulty - Difficulty (e.g. Easy, Medium, Hard)
 * @param {number} [params.num_questions=5] - Number of questions to generate
 * @returns {Promise<string[]>} Array of question strings
 */
export const generateInterviewQuestions = async ({
  domain,
  language = "English",
  interview_type = "Technical",
  difficulty = "Medium",
  num_questions = 5,
}) => {
  const prompt = `Generate ${num_questions} ${difficulty} level ${interview_type} interview questions in ${language} for a candidate in the "${domain}" domain.
Number each question clearly from 1 to ${num_questions}. Keep each question concise and relevant. Do not include markdown preamble or notes, just the numbered questions.`;

  const text = await generateText({
    prompt,
    systemInstruction: "You are the KaushalAI expert technical and HR interviewer.",
  });

  const questions = text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => /^\d+[\.\)]\s*/.test(line))
    .map((line) => line.replace(/^\d+[\.\)]\s*/, "").trim())
    .filter(Boolean);

  // If numbering parser captured fewer than expected, fallback to splitting non-empty lines
  if (questions.length === 0) {
    return text.split("\n").map((l) => l.trim()).filter(Boolean).slice(0, num_questions);
  }

  return questions.slice(0, num_questions);
};

/**
 * Uncompromising technical evaluation of candidate's interview answer
 * Evaluates against ground truth with zero tolerance for gibberish or factual errors.
 * @param {Object} params
 * @param {string} params.question - The question asked
 * @param {string} params.answer - The candidate's response
 * @param {string} [params.language="English"] - Language of answer
 * @returns {Promise<Object>} Structured evaluation object
 */
export const evaluateInterviewAnswer = async ({
  question,
  answer,
  language = "English",
}) => {
  const trimmed = (answer || "").trim();
  const isGibberishOrEmpty =
    !trimmed ||
    trimmed.length < 3 ||
    /^(abc|asdf|qwerty|xyz|test|test1|idk|no idea|dunno|none|na|n\/a|\.|\?|\.\.\.)$/i.test(trimmed) ||
    /^([a-zA-Z0-9])\1{2,}$/i.test(trimmed);

  if (isGibberishOrEmpty) {
    return {
      is_correct: false,
      where_you_are_wrong: 'No meaningful answer provided. The candidate submitted empty, gibberish, or irrelevant test input.',
      ideal_correct_answer: 'Provide a comprehensive, technically accurate explanation addressing the specific concepts in the question.',
      score: 0,
      feedback_summary: 'Non-responsive or gibberish answer detected. Score is 0/10.',
    };
  }

  const prompt = `You are the KaushalAI uncompromising technical interviewer evaluating candidate answers.

MANDATORY OUTPUT AND FORMATTING RULES:
1. Zero Emojis: Do not use any emojis, icons, or Unicode symbols anywhere in the output.
2. No Double Quotes Inside Strings: Never use double quotes (") inside text values or descriptions. Use single quotes (') exclusively to prevent JSON syntax or parsing issues.
3. Clean Line Breaks: Whenever an explanation contains multiple points, every single point must begin on a new line separated by \\n. Never group points into one paragraph.
4. Structured Response: Keep feedback direct, technical, and strictly free of polite conversational pleasantries, flattery, or filler.

CRITICAL RULES FOR GIBBERISH, NONSENSE, OR IRRELEVANT INPUT:
- If the candidate types random letters, single filler words, jokes, or nonsensical input (e.g., 'abc', 'asdf', 'idk', 'test', 'no idea'):
  1. Set is_correct to false.
  2. Set score to 0.
  3. Set where_you_are_wrong to: 'No meaningful answer provided. The response is gibberish or irrelevant filler.'
  4. Provide the complete factual answer under ideal_correct_answer.
  5. DO NOT offer polite compliments like 'Good attempt' or 'Demonstrated understanding'.

Scoring Rubric:
- 0/10: Gibberish, random keystrokes, completely off-topic, or empty.
- 1–3/10: Factual errors, major misconceptions, or fundamentally wrong reasoning.
- 4–6/10: Partial answer, correct high-level idea but missing essential technical substance.
- 7–8/10: Mostly correct with minor omissions.
- 9–10/10: Completely correct, thorough, and technically precise.

Input Data
Question: ${question}
Candidate Response: ${trimmed}
Language: ${language}

Output Format (Strict JSON)
Respond strictly in valid JSON format:
{
  "is_correct": <true or false>,
  "where_you_are_wrong": "<Explicitly describe errors or state that input was gibberish. Use single quotes for quoted terms, each point on a new line separated by \\n>",
  "ideal_correct_answer": "<The complete, factual ground truth answer with points on separate lines separated by \\n, using single quotes for terms>",
  "score": <integer from 0 to 10>,
  "feedback_summary": "<Direct technical evaluation without polite flattery, using single quotes for terms>"
}`;

  const text = await generateText({ prompt });

  try {
    const cleaned = text.replace(/```(?:json)?/gi, "").trim();
    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      const sanitized = cleaned.replace(/(?<=:\s*"[^"]*)\r?\n(?=[^"]*")/g, "\\n");
      parsed = JSON.parse(sanitized);
    }

    // Defensive clamping against inflated scores for incorrect/gibberish answers
    if (!parsed.is_correct && parsed.score > 3) {
      parsed.score = Math.min(parsed.score, 3);
    }
    if (/gibberish|irrelevant|no meaningful|nonsense/i.test(parsed.where_you_are_wrong)) {
      parsed.score = 0;
      parsed.is_correct = false;
    }

    return parsed;
  } catch (err) {
    console.error("Failed to parse strict JSON from Gemini evaluation:", err);
    return {
      is_correct: false,
      where_you_are_wrong: text.replace(/"/g, "'"),
      ideal_correct_answer: 'Refer to documentation for the ideal technical explanation.',
      score: 0,
      feedback_summary: 'Evaluation received without strict JSON encoding.'
    };
  }
};


/**
 * AI Tutor / Career Counselor Chat
 * @param {Object} params
 * @param {string} params.message - The incoming message
 * @returns {Promise<string>} AI response
 */
export const chatWithAITutor = async ({ message }) => {
  const prompt = `User question: ${message}

Provide a direct, complete, and technically precise answer without using any fixed template headers or boilerplate categories.`;

  const systemInstruction = `You are KaushalAI, a direct, concise, and uncompromising technical mentor.

CORE RULES:
1. Zero Emojis or Icons: Never include emojis, unicode symbols, or smiley faces anywhere in your response.
2. Direct Tone: Be direct, concise, and professional. Omit conversational filler, cheerleading, and pleasantries (such as 'Hello!', 'Hope this helps!', 'Good question!').
3. No Forced Pattern: Do not force rigid response templates, boilerplate categories, or fixed headers (such as 'Core Definition' or 'Career Relevance'). Answer the user's specific question naturally and directly.
4. No Markdown Hashes: Never use markdown hash symbols (###, ##, #) anywhere in the output. Use clean text formatting.
5. Strict Line Breaks for Lists:
   - When presenting lists, every bullet point or item must be on its own separate line.
   - Insert an empty line before and after lists to keep sections distinct.
6. No Double Quotes Inside Prose:
   - Do not wrap terms, words, or code descriptions in double quotes (" ").
   - Use single quotes (' ') or inline markdown code formatting (\` \`) instead.
7. Code Delivery:
   - Provide concrete code blocks or implementation details immediately when relevant.`;

  const text = await generateText({
    prompt,
    systemInstruction,
  });

  // Strip any markdown hash symbols (#) from the response
  const sanitized = text
    .replace(/^#{1,6}\s*/gm, '')
    .replace(/#{2,}/g, '')
    .trim();

  return sanitized;
};

/**
 * Generate structured resume data adhering to the universal schema
 * @param {Object} params
 * @param {string} [params.prompt] - Optional prompt or user career background
 * @param {Object} [params.currentData] - Existing partial resume data to enhance or complete
 * @returns {Promise<Object>} Strictly typed resume JSON
 */
export const generateResumeData = async ({ prompt = '', currentData = null } = {}) => {
  const systemInstruction = `You are KaushalAI, a professional executive resume writer and career architect.
CRITICAL FORMATTING INSTRUCTIONS:
1. Zero Emojis or Icons: Never include any emojis, icons, or Unicode symbols anywhere in the output.
2. No Double Quotes Inside Strings: Never use double quotes (") inside text values or descriptions. Use single quotes (') exclusively to prevent JSON syntax or parsing issues.
3. Clean Line Breaks: When writing bullet points, every single point must begin on a new line. Never group multiple accomplishments into one bullet point.
4. Strict JSON Output: Output only valid JSON without markdown code blocks, preamble, commentary, or postscript.
5. Defensive Values: Never output empty strings, null values, or stray punctuation marks like lone commas or dashes.`;

  const inputContext = currentData
    ? `User provided existing details: ${JSON.stringify(currentData)}. Enhance, organize, and fill any missing professional sections.`
    : `Generate a standout professional resume for the following profile or role: ${prompt || 'Full Stack Software Engineer'}.`;

  const userPrompt = `${inputContext}

Respond with a strictly valid JSON object matching this EXACT schema:
{
  "personal_info": {
    "full_name": "string",
    "job_title": "string",
    "email": "string",
    "phone": "string",
    "location": "string",
    "linkedin": "string",
    "website": "string"
  },
  "summary": "string",
  "skills": {
    "technical": ["string"],
    "soft": ["string"],
    "languages": ["string"]
  },
  "experience": [
    {
      "company": "string",
      "role": "string",
      "duration": "string",
      "location": "string",
      "bullet_points": ["string"]
    }
  ],
  "education": [
    {
      "institution": "string",
      "degree": "string",
      "year": "string",
      "grade": "string"
    }
  ],
  "projects": [
    {
      "title": "string",
      "technologies": ["string"],
      "description": "string"
    }
  ]
}`;

  const text = await generateText({
    prompt: userPrompt,
    systemInstruction,
  });

  try {
    const cleaned = text.replace(/```(?:json)?/gi, '').trim();
    try {
      return JSON.parse(cleaned);
    } catch {
      const sanitized = cleaned.replace(/(?<=:\s*"[^"]*)\r?\n(?=[^"]*")/g, '\\n');
      return JSON.parse(sanitized);
    }
  } catch (err) {
    console.error('Failed to parse strict JSON from Gemini resume generator:', err);
    // Return a safe fallback schema matching the required shape
    return {
      personal_info: {
        full_name: 'Alex Mercer',
        job_title: 'Full Stack Engineer',
        email: 'alex.mercer@example.com',
        phone: '+1 (555) 234-5678',
        location: 'San Francisco, CA',
        linkedin: 'linkedin.com/in/alexmercer',
        website: 'alexmercer.dev',
      },
      summary: 'Experienced Full Stack Engineer with expertise in building scalable cloud architectures, high-performance web applications, and resilient distributed microservices.',
      skills: {
        technical: ['JavaScript', 'TypeScript', 'React', 'Node.js', 'PostgreSQL', 'Docker', 'GraphQL', 'AWS'],
        soft: ['Technical Leadership', 'Cross-Functional Collaboration', 'Agile Architecture', 'System Optimization'],
        languages: ['English', 'German'],
      },
      experience: [
        {
          company: 'Nexus Software Systems',
          role: 'Senior Full Stack Engineer',
          duration: '2022 - Present',
          location: 'San Francisco, CA',
          bullet_points: [
            'Architected microservices processing over 5M daily transactions with 99.99% uptime',
            'Reduced API latency by 42% through distributed Redis caching and query indexing',
            'Mentored eight junior and mid-level engineers in clean code and test-driven development',
          ],
        },
        {
          company: 'HyperScale Cloud Labs',
          role: 'Software Engineer',
          duration: '2020 - 2022',
          location: 'Austin, TX',
          bullet_points: [
            'Built responsive client web applications in React and TypeScript for 120,000 active enterprise users',
            'Implemented automated CI/CD deployment pipelines cutting release cycle times by 65%',
          ],
        },
      ],
      education: [
        {
          institution: 'University of California, Berkeley',
          degree: 'Bachelor of Science in Computer Science',
          year: '2016 - 2020',
          grade: '3.85 GPA',
        },
      ],
      projects: [
        {
          title: 'Distributed Event Streaming Engine',
          technologies: ['Node.js', 'Kafka', 'Docker', 'Go'],
          description: 'High-throughput event bus handling asynchronous telemetry data with persistent message delivery guarantees.',
        },
        {
          title: 'Cloud Cost Optimization Dashboard',
          technologies: ['React', 'TypeScript', 'TailwindCSS', 'AWS SDK'],
          description: 'Interactive analytics dashboard surfacing real-time cloud resource utilization and savings opportunities.',
        },
      ],
    };
  }
};

export default {
  ai,
  generateText,
  generateInterviewQuestions,
  evaluateInterviewAnswer,
  chatWithAITutor,
  generateResumeData,
};

