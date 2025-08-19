// geminiRes.js
const fetch = require('node-fetch');
const { GEMINI_API_KEY } = require('./config');

/*
  This uses a generic fetch to the Gemini API endpoint.
  Replace MODEL_NAME and endpoint path if needed per your Gemini SDK/version.
  Keep temperature low for consistent, concise feedback.
*/

const MODEL_NAME = 'gemini-1.5-flash'; // or the free model you plan to use
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
  if (!GEMINI_API_KEY) {
    throw new Error('Missing GEMINI_API_KEY');
  }

  const prompt = buildPrompt(transcript);

  // Example REST call structure – adjust to your Gemini endpoint format
  const resp = await fetch('https://generativelanguage.googleapis.com/v1beta/models/' + encodeURIComponent(MODEL_NAME) + ':generateContent?key=' + encodeURIComponent(GEMINI_API_KEY), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [
        { parts: [{ text: prompt }] }
      ],
      generationConfig: {
        temperature: TEMPERATURE,
        maxOutputTokens: MAX_TOKENS,
      }
    }),
    // timeout can be handled via AbortController if desired
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    throw new Error('Gemini API error: ' + resp.status + ' ' + text);
  }

  const data = await resp.json();

  // Extract plain text safely based on typical Gemini response structure
  // Adjust path if SDK/endpoint differs
  const candidates = data.candidates || [];
  const first = candidates[0];
  let output = '';

  if (first && first.content && Array.isArray(first.content.parts)) {
    output = first.content.parts.map(p => p.text || '').join(' ').trim();
  }

  if (!output) {
    output = 'I could not generate feedback right now. Please try again.';
  }

  return output;
}

module.exports = { getGeminiFeedback };
