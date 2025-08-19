// config.js
require('dotenv').config();

const isProd = process.env.NODE_ENV === 'production';

// Use the public/uploads folder you created
const path = require('path');
const TMP_DIR = path.join(__dirname, 'public', 'uploads');

module.exports = {
  PORT: process.env.PORT || 4000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
  MAX_FILE_SIZE_BYTES: 25 * 1024 * 1024, // 25MB cap
  ALLOWED_MIME: new Set([
    'audio/webm',
    'audio/wav',
    'audio/ogg',
    'audio/mpeg', 
    'audio/mp3', 
    'audio/mp4',
    'audio/m4a',
  ]),
  TMP_DIR,
  isProd,
};
