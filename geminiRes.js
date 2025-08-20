// const fetch = require('node-fetch');
// const { GEMINI_API_KEY } = require('./config');

// geminiRes.js
const { GoogleGenerativeAI } = require( "@google/generative-ai");
const dotenv = require("dotenv");

dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  throw new Error("Missing GEMINI_API_KEY in environment variables");
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// Free/fast model: gemini-1.5-flash (use gemini-1.5-pro for more quality, slower)
const MODEL_NAME = "gemini-1.5-flash";
const MAX_TOKENS = 512;
const TEMPERATURE = 0.2;

function buildPrompt(transcript) {
  return `
You are an English speaking coach. Analyze the user's speech transcript and respond concisely with:
1) Key mistakes (grammar, word choice, sentence structure; mention examples)
2) Corrected sentences (succinct)
3) Improvement tips (short, actionable)

Rules:
- Plain text only
- Keep it concise (120-160 words)
- No markdown, no bullet symbols like "-", just short paragraphs
- If the transcript is unclear, note that briefly then give general tips

Transcript:
"${transcript}"
  `.trim();
}

async function getGeminiFeedback(transcript) {
  try {
    const prompt = buildPrompt(transcript);

    const model = genAI.getGenerativeModel({ model: MODEL_NAME });

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: TEMPERATURE,
        maxOutputTokens: MAX_TOKENS,
      },
    });

    const responseText = result.response.text();
    return responseText || "I could not generate feedback right now. Please try again.";
  } catch (err) {
    console.error("Gemini API error:", err);
    return "Something went wrong while generating feedback.";
  }
}

module.exports = { getGeminiFeedback };
