const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const staticUploadsPath = path.join(__dirname, 'uploads');
console.log('📁 Serving static uploads from', staticUploadsPath);
app.use('/uploads', express.static(staticUploadsPath));

// ── Routes ────────────────────────────────────────────────────────────────────
const uploadRoutes    = require('./routes/upload.routes');
const analyticsRoutes = require('./routes/analytics.routes');
const predictionRoutes= require('./routes/prediction.routes');
const chatbotRoutes   = require('./routes/chatbot.routes');
const quizScoreRoutes = require('./routes/quizscore.routes');
const profileRoutes   = require('./routes/profile.routes');
const reportRoutes    = require('./routes/report.routes');

app.use('/api/upload',      uploadRoutes);
app.use('/api/analytics',   analyticsRoutes);
app.use('/api/predictions', predictionRoutes);
app.use('/api/chatbot',     chatbotRoutes);
app.use('/api/quiz-scores', quizScoreRoutes);
app.use('/api/profile',     profileRoutes);
app.use('/api/report',      reportRoutes);

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    message: 'Server is running'
  });
});

// ── Global error handler ──────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    error: { code: 'SERVER_ERROR', message: err.message || 'Internal server error' }
  });
});

// ── Start server ──────────────────────────────────────────────────────────────
const startServer = async () => {
  // 1. MongoDB (optional — continue if it fails)
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      connectTimeoutMS: 5000,
      serverSelectionTimeoutMS: 5000
    });
    console.log('✅ Connected to MongoDB');
  } catch {
    console.log('⚠️  MongoDB unavailable — continuing without it');
  }

  // 2. Auth routes — try real auth first, fall back to a simple stub
  try {
    const authRoutes = require('./routes/auth.routes');
    app.use('/api/auth', authRoutes);
    console.log('✅ Auth routes loaded');
  } catch {
    // Minimal stub so /api/auth/login always responds
    const router = express.Router();
    router.post('/login', (req, res) => {
      res.json({
        success: true,
        token: 'dev-token-' + Date.now(),
        user: { id: 'dev-user', name: 'Dev User', email: req.body?.email || 'dev@example.com' }
      });
    });
    router.post('/register', (req, res) => {
      res.json({ success: true, message: 'Registered (dev mode)' });
    });
    app.use('/api/auth', router);
    console.log('⚠️  Using dev auth stub');
  }

  // 3. PostgreSQL (optional — continue if it fails)
  try {
    const { connectPostgreSQL } = require('../config/database');
    await connectPostgreSQL();
  } catch (e) {
    console.log('⚠️  PostgreSQL unavailable:', e.message);
  }

  // 4. Start listening
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`\n✅ Server running on port ${PORT}`);
    console.log(`   Health:  http://localhost:${PORT}/health`);
    console.log(`   Upload:  POST http://localhost:${PORT}/api/upload/upload`);
    console.log(`   Login:   POST http://localhost:${PORT}/api/auth/login\n`);
  });
};

startServer();