const express  = require('express');
const cors     = require('cors');
const path     = require('path');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── Routes ────────────────────────────────────────────────────────────────────
// Each route is loaded inside its own try/catch so one bad import never
// prevents the other routes — or the server — from starting.

try { app.use('/api/auth',       require('./routes/auth.routes'));       console.log('✅ auth routes'); }
catch (e) { console.warn('⚠️  auth.routes:', e.message); }

try { app.use('/api/upload',     require('./routes/upload.routes'));     console.log('✅ upload routes'); }
catch (e) { console.warn('⚠️  upload.routes:', e.message); }

try { app.use('/api/analytics',  require('./routes/analytics.routes'));  console.log('✅ analytics routes'); }
catch (e) { console.warn('⚠️  analytics.routes:', e.message); }

try { app.use('/api/predictions',require('./routes/prediction.routes')); console.log('✅ prediction routes'); }
catch (e) { console.warn('⚠️  prediction.routes:', e.message); }

try { app.use('/api/profile', require('./routes/profile.routes')); console.log('✅ profile routes'); }
catch (e) { console.warn('⚠️  profile.routes:', e.message); }

try { app.use('/api/chatbot',    require('./routes/chatbot.routes'));    console.log('✅ chatbot routes'); }
catch (e) { console.warn('⚠️  chatbot.routes:', e.message); }

try { app.use('/api/quiz-scores',require('./routes/quizscore.routes'));  console.log('✅ quiz-scores routes'); }
catch (e) { console.warn('⚠️  quizscore.routes:', e.message); }

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status:    'OK',
    timestamp: new Date().toISOString(),
    mongodb:   mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  });
});

// ── Global error handler ──────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.stack || err.message);
  res.status(err.status || 500).json({
    success: false,
    error: { code: err.code || 'SERVER_ERROR', message: err.message || 'Internal server error' },
  });
});

// ── Start server ──────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  // MongoDB — optional, warn and continue if unavailable
  try {
    const { connectMongoDB } = require('./config/database');
    await connectMongoDB();
    console.log('✅ MongoDB connected');
  } catch (e) {
    console.warn('⚠️  MongoDB unavailable — auth falls back to memory store:', e.message);
  }

  // PostgreSQL — optional, warn and continue if unavailable
  try {
    const { connectPostgreSQL } = require('./config/database');
    await connectPostgreSQL();
    console.log('✅ PostgreSQL connected');
  } catch (e) {
    console.warn('⚠️  PostgreSQL unavailable — upload/analytics use memory mode:', e.message);
  }

  // Always start listening regardless of DB status
  app.listen(PORT, () => {
    console.log(`\n✅ Server running on port ${PORT}`);
    console.log(`   Health: http://localhost:${PORT}/health`);
    console.log(`   Login:  POST http://localhost:${PORT}/api/auth/login`);
    console.log(`   Demo:   demo@studysmart.com / demo123\n`);
  });
};

startServer();