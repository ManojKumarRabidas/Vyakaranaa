// chatAnalysis.js
const { transcribeToText } = require('./sttAdapter');
const { getGeminiFeedback } = require('./geminiRes');

function sanitizeTranscript(text) {
  if (!text) return '';
  // Trim and collapse excessive whitespace
  return text.trim().replace(/\s{2,}/g, ' ').slice(0, 4000); // cap length
}

async function analyzeAudio({ filePath, mime }) {
  // 1) STT: audio -> text (English for v1)
  const rawTranscript = await transcribeToText({ filePath, mime, language: 'en' });

  const transcript = sanitizeTranscript(rawTranscript);
  if (!transcript) {
    throw new Error('Empty transcript');
  }

  // 2) Send to Gemini for grammar/mistake feedback
  const feedbackText = await getGeminiFeedback(transcript);

  return { feedbackText, transcript };

  // return { feedbackText: "Under working 1", transcript: "Under working 2" };
}

module.exports = { analyzeAudio };
