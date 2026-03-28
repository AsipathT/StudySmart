/**
 * routes/auth.routes.js  —  FIXED
 *
 * KEY FIXES vs old version:
 * 1. Login ONLY uses MongoDB — no memory store fallback when DB is up.
 * 2. JWT always contains real MongoDB _id (24-hex) — never "demo-001".
 * 3. Demo user is auto-created in MongoDB 2s after startup.
 * 4. Password mismatch returns 401 immediately.
 */
const express  = require('express');
const router   = express.Router();
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const mongoose = require('mongoose');

const JWT_SECRET = process.env.JWT_SECRET || 'studysmart_dev_secret_key_2024';

// ── User model ────────────────────────────────────────────────────────────────
let User = null;
try {
  User = require('../models/User');
} catch (e) {
  console.warn('⚠️  User model not loaded:', e.message);
}

const isMongoUp = () => mongoose.connection.readyState === 1;

// ── Auto-seed demo user into MongoDB on startup ───────────────────────────────
async function seedDemoUser() {
  if (!isMongoUp() || !User) {
    console.warn('[AUTH] Seed skipped — MongoDB not ready');
    return;
  }
  try {
    const existing = await User.findOne({ email: 'demo@studysmart.com' });
    if (!existing) {
      const hash = await bcrypt.hash('demo123', 10);
      const u = await User.create({
        name:      'Demo Student',
        email:     'demo@studysmart.com',
        password:  hash,
        role:      'student',
        studentId: 'IT23145870',
      });
      console.log('[AUTH] ✅ Demo user seeded  _id:', u._id.toString());
    } else {
      console.log('[AUTH] ✅ Demo user exists  _id:', existing._id.toString());
    }
  } catch (e) {
    console.warn('[AUTH] Seed error (non-fatal):', e.message);
  }
}
setTimeout(seedDemoUser, 2000);

// ── Helpers ───────────────────────────────────────────────────────────────────
function makeToken(user) {
  return jwt.sign(
    { id: user._id.toString(), email: user.email, role: user.role || 'student' },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

function safeUser(user) {
  return {
    id:        user._id.toString(),
    name:      user.name      || '',
    email:     user.email,
    role:      user.role      || 'student',
    studentId: user.studentId || '',
  };
}

// ── POST /api/auth/register ───────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, studentId } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email and password are required' });
    }
    if (!isMongoUp() || !User) {
      return res.status(503).json({ success: false, message: 'Database unavailable. Please try again.' });
    }

    const normalEmail = email.toLowerCase().trim();
    const existing    = await User.findOne({ email: normalEmail });
    if (existing) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists' });
    }

    const user = new User({ name, email: normalEmail, password, role: role || 'student', studentId: studentId || '' });
    await user.save();

    const token = makeToken(user);
    console.log('[AUTH] ✅ Registered:', user.email, '| _id:', user._id.toString());

    return res.status(201).json({
      success: true,
      data:    { user: safeUser(user), token },
      message: 'Account created successfully',
    });
  } catch (err) {
    console.error('[AUTH] register error:', err.message);
    return res.status(500).json({ success: false, message: err.message || 'Registration failed' });
  }
});

// ── POST /api/auth/login ──────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }
    if (!isMongoUp() || !User) {
      return res.status(503).json({ success: false, message: 'Database unavailable. Please try again.' });
    }

    const normalEmail = email.toLowerCase().trim();
    console.log('[AUTH] Login attempt:', normalEmail);

    const user = await User.findOne({ email: normalEmail });
    if (!user) {
      console.log('[AUTH] ❌ Not found:', normalEmail);
      return res.status(401).json({ success: false, message: 'No account found with this email' });
    }

    // Verify password
    let valid = false;
    try {
      valid = await user.comparePassword(password);
    } catch {
      valid = await bcrypt.compare(password, user.password);
    }

    if (!valid) {
      console.log('[AUTH] ❌ Wrong password for:', normalEmail);
      return res.status(401).json({ success: false, message: 'Incorrect password' });
    }

    const token = makeToken(user);
    console.log('[AUTH] ✅ Login OK:', user.email, '| _id:', user._id.toString());

    return res.json({
      success: true,
      data:    { user: safeUser(user), token },
      message: 'Login successful',
    });
  } catch (err) {
    console.error('[AUTH] login error:', err.message);
    return res.status(500).json({ success: false, message: err.message || 'Login failed' });
  }
});

// ── GET /api/auth/me ──────────────────────────────────────────────────────────
router.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ success: false, message: 'No token provided' });

    const decoded = jwt.verify(token, JWT_SECRET);

    if (isMongoUp() && User && mongoose.isValidObjectId(decoded.id)) {
      const user = await User.findById(decoded.id).select('-password');
      if (user) return res.json({ success: true, data: { user: safeUser(user) } });
    }

    return res.json({
      success: true,
      data: { user: { id: decoded.id, email: decoded.email, role: decoded.role || 'student', name: '' } },
    });
  } catch {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
});

// ── POST /api/auth/logout ─────────────────────────────────────────────────────
router.post('/logout', (_req, res) => {
  res.json({ success: true, message: 'Logged out successfully' });
});

module.exports = router;