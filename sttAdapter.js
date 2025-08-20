// sttAdapter.js
const { execFile } = require('child_process');
require('dotenv').config();
const path = require('path');
const os = require('os');
const fs = require('fs');

// Choose one implementation below:

// ========== A) Local Whisper CLI (example) ==========
// Requirements: ffmpeg, whisper (openai-whisper) or whisper.cpp binaries accessible
// This example shows openai-whisper CLI: `whisper <file> --model small --language en --fp16 False --task transcribe --output_format txt --output_dir <dir>`
async function transcribeToText_LocalWhisper({ filePath, mime, language = 'en' }) {
  // Ensure WAV is not required by your chosen whisper tool; some accept multiple formats.
  // If conversion is needed, add an ffmpeg step here.

  const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'whisper_out_'));
  const args = [
    filePath,
    '--model', 'small',
    '--language', language,
    '--fp16', 'False',
    '--task', 'transcribe',
    '--output_format', 'txt',
    '--output_dir', outDir,
  ];

  // const cmd = process.platform === 'win32' ? 'whisper.exe' : 'whisper';
  const WHISPER_BIN =
  process.env.WHISPER_BIN ||
  (process.platform === 'win32' ? 'whisper.exe' : 'whisper');
  const cmd = WHISPER_BIN;

  const transcriptPath = () => {
    const base = path.basename(filePath);
    const stem = base.replace(path.extname(base), '');
    return path.join(outDir, `${stem}.txt`);
  };

  const runWhisper = () => new Promise((resolve, reject) => {
    execFile(cmd, args, { timeout: 12000000 }, (err, stdout, stderr) => {
      if (err) return reject(err);
      resolve({ stdout, stderr });
    });
  });

  await runWhisper();

  const outFile = transcriptPath();
  const text = await fs.promises.readFile(outFile, 'utf8').catch(() => '');
  // Cleanup
  fs.promises.rm(outDir, { recursive: true, force: true }).catch(() => {});
  return text;
}

// ========== B) Hosted STT Placeholder (implement your provider here) ==========
// Example skeleton: send file to provider and parse transcript text.
async function transcribeToText_Hosted({ filePath, mime, language = 'en' }) {
  // Implement: read file, call provider via fetch with FormData, return transcript string.
  // Leaving a simple error to force implementation if selected.
  throw new Error('Hosted STT not implemented. Choose Local Whisper or integrate your STT provider.');
}

// Select implementation:
async function transcribeToText(params) {
  // return transcribeToText_Hosted(params);
  return transcribeToText_LocalWhisper(params);
}

module.exports = { transcribeToText };
