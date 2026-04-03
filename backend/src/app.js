const express = require('express');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config();
require('dns').setServers(['8.8.8.8', '1.1.1.1']);

const app = express();

// ── CORS — must be FIRST, before any routes ───────────────────────────────────
// Allow all localhost origins (React dev server on any port)
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    // Allow any localhost or 127.0.0.1 origin
    if (
      origin.startsWith('http://localhost') ||
      origin.startsWith('http://127.0.0.1') ||
      origin.startsWith('https://localhost')
    ) {
      return callback(null, true);
    }
    // In production, add your deployed frontend URL here:
    // if (origin === 'https://your-app.com') return callback(null, true);
    callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  optionsSuccessStatus: 200, // IE11 compatibility
};

app.use(cors(corsOptions));

// Handle preflight OPTIONS for ALL routes
app.options('*', cors(corsOptions));

// ── Body parsing ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Static uploads ────────────────────────────────────────────────────────────
app.use("/api/study-groups", require("./routes/studygroup.routes"));
const staticUploadsPath = path.join(__dirname, 'uploads');
console.log('📁 Serving static uploads from', staticUploadsPath);
app.use('/uploads', express.static(staticUploadsPath));

// ── Routes ────────────────────────────────────────────────────────────────────
try {
  app.use('/api/auth', require('../src/routes/auth.routes'));
  console.log('✅ auth routes');
} catch (e) {
  console.warn('⚠️ auth.routes:', e.message);
}

try {
  app.use('/api/upload', require('../src/routes/upload.routes'));
  console.log('✅ upload routes');
} catch (e) {
  console.warn('⚠️ upload.routes:', e.message);
}

try {
  app.use('/api/analytics', require('../src/routes/analytics.routes'));
  console.log('✅ analytics routes loaded');
} catch (e) {
  console.warn('⚠️ analytics.routes:', e.message);
  console.error(e.stack);
}

try {
  app.use('/api/predictions', require('../src/routes/prediction.routes'));
  console.log('✅ prediction routes');
} catch (e) {
  console.warn('⚠️ prediction.routes:', e.message);
}

try {
  app.use('/api/profile', require('../src/routes/profile.routes'));
  console.log('✅ profile routes');
} catch (e) {
  console.warn('⚠️ profile.routes:', e.message);
}

try {
  app.use('/api/chatbot', require('../src/routes/chatbot.routes'));
  console.log('✅ chatbot routes');
} catch (e) {
  console.warn('⚠️ chatbot.routes:', e.message);
}

try {
  app.use('/api/quiz-scores', require('../src/routes/quizscore.routes'));
  console.log('✅ quiz-scores routes');
} catch (e) {
  console.warn('⚠️ quizscore.routes:', e.message);
}

try {
  app.use('/api/study-session', require('../src/routes/sessionTracker.routes'));
  console.log('✅ study-session (session tracker) routes');
} catch (e) {
  console.warn('⚠️ sessionTracker.routes:', e.message);
}

try {
  app.use('/api/subjects', require('../src/routes/subject.routes'));
  console.log('✅ subjects routes');
} catch (e) {
  console.warn('⚠️ subject.routes:', e.message);
}

try {
  app.use('/api/quizzes', require('../src/routes/quiz.routes'));
  console.log('✅ quizzes routes');
} catch (e) {
  console.warn('⚠️ quiz.routes:', e.message);
}

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  });
});

// ── Global error handler ──────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.stack || err.message);
  res.status(err.status || 500).json({
    success: false,
    error: {
      code: err.code || 'SERVER_ERROR',
      message: err.message || 'Internal server error',
    },
  });
});

module.exports = app;