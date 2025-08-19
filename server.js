// server.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const { PORT, MAX_FILE_SIZE_BYTES, ALLOWED_MIME, TMP_DIR, isProd } = require('./config');
const { analyzeAudio } = require('./chatAnalysis');

if (!fs.existsSync(TMP_DIR)) {
  fs.mkdirSync(TMP_DIR, { recursive: true });
}

const app = express();

app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname,"./public")));

// Security & basics
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
  origin: isProd ? ['https://your-frontend-domain.com'] : '*',
  methods: ['POST', 'GET', 'OPTIONS'],
}));
app.use(express.json({ limit: '100kb' }));

const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 60, // 60 requests / 10min per IP
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Multer setup for audio uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, TMP_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || '') || '.bin';
    const base = path.basename(file.originalname || 'audio', ext).replace(/\s+/g, '_');
    cb(null, `${Date.now()}_${base}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE_BYTES, files: 1 },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_MIME.has(file.mimetype)) {
      return cb(new Error('Unsupported audio type'));
    }
    cb(null, true);
  },
});

app.post('/save-audio', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No audio file uploaded' });

    const filePath = req.file.path;
    const mime = req.file.mimetype;

    try {
      const { feedbackText, transcript } = await analyzeAudio({ filePath, mime });

      // delete file after processing
      fs.promises.unlink(filePath).catch(() => {});

      return res.status(200).json({
        message: 'File processed successfully',
        feedbackText,
        transcript, // optional to include; remove in prod if not needed
      });
    } catch (e) {
      console.error('Analysis error:', e);
      fs.promises.unlink(filePath).catch(() => {});
      return res.status(500).json({ error: 'Processing failed' });
    }
  } catch (err) {
    console.error('Upload error:', err);
    if (err.message === 'Unsupported audio type') {
      return res.status(415).json({ error: 'Unsupported audio type' });
    }
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ error: 'File too large' });
    }
    return res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/analyze', upload.single('file'), async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file provided' });
    }

    const filePath = req.file.path;
    const mime = req.file.mimetype;

    try {
      const { feedbackText, transcript } = await analyzeAudio({ filePath, mime });
      // For production, you may omit transcript or include behind a debug flag
      return res.status(200).json({ feedbackText, transcript });
    } catch (err) {
      console.error('Analysis error:', err);
      return res.status(500).json({ error: 'Processing failed' });
    } finally {
      // Remove temp file from public/uploads
      fs.promises.unlink(filePath).catch(() => {});
    }
  }
);

app.get('/health', (req, res) => res.json({ ok: true }));

app.get('/', (req, res) => {
  res.render('index');
});

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  if (err.message === 'Unsupported audio type') {
    return res.status(415).json({ error: 'Unsupported audio type' });
  }
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: 'File too large' });
  }
  return res.status(500).json({ error: 'Server error' });
});

app.listen(PORT, () => {
  const url = `http://localhost:${PORT}`; // Construct the URL
  console.log(`Server running on ${url}`);
});
