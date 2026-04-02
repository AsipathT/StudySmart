/**
 * middleware/auth.js  —  FIXED
 * 
 * THE BUG: old code called User.findById("demo-001") which crashes Mongoose
 * because "demo-001" is not a valid MongoDB ObjectId.
 *
 * THE FIX: mongoose.isValidObjectId() check before EVERY findById call.
 */
const jwt      = require('jsonwebtoken');
const mongoose = require('mongoose');

const JWT_SECRET = process.env.JWT_SECRET || 'studysmart_dev_secret_key_2024';

let User = null;
try {
  User = require('../models/User');
} catch (e) {
  console.warn('Auth middleware: User model not loaded:', e.message);
}

const isMongoUp = () => mongoose.connection.readyState === 1;

async function protect(req, res, next) {
  try {
    // ── 1. Extract token ──────────────────────────────────────────────────────
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: { code: 'NO_TOKEN', message: 'Not authorized, token missing' },
      });
    }
    const token = authHeader.split(' ')[1];

    // ── 2. Verify JWT signature ───────────────────────────────────────────────
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (jwtErr) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: jwtErr.name === 'TokenExpiredError'
            ? 'Session expired. Please log in again.'
            : 'Invalid token. Please log in again.',
        },
      });
    }

    // ── 3. Look up user in MongoDB ────────────────────────────────────────────
    // CRITICAL: ONLY call findById when id is a valid 24-hex ObjectId.
    // "demo-001", "mem-123456" etc. must NEVER reach findById — that's the crash.
    if (isMongoUp() && User && mongoose.isValidObjectId(decoded.id)) {
      try {
        const user = await User.findById(decoded.id).select('-password');
        if (user) {
          req.user = {
            id:        user._id.toString(),
            email:     user.email,
            role:      user.role      || 'student',
            name:      user.name      || '',
            studentId: user.studentId || '',
          };
          return next();
        }
        // Valid ObjectId but user deleted — force re-login
        return res.status(401).json({
          success: false,
          error: { code: 'INVALID_TOKEN', message: 'Account not found. Please log in again.' },
        });
      } catch (dbErr) {
        console.error('Auth middleware DB error:', dbErr.message);
        // DB error — fall through to JWT payload fallback
      }
    }

    // ── 4. Fallback: use JWT payload directly ─────────────────────────────────
    // Covers: MongoDB down, or non-ObjectId ids in old tokens
    if (decoded.id && decoded.email) {
      req.user = {
        id:        decoded.id,
        email:     decoded.email,
        role:      decoded.role      || 'student',
        name:      decoded.name      || '',
        studentId: decoded.studentId || '',
      };
      return next();
    }

    return res.status(401).json({
      success: false,
      error: { code: 'INVALID_TOKEN', message: 'Invalid token payload' },
    });

  } catch (err) {
    console.error('Auth middleware unexpected error:', err.message);
    return res.status(401).json({
      success: false,
      error: { code: 'INVALID_TOKEN', message: 'Authentication failed' },
    });
  }
}

function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: { message: 'Not authenticated' },
      });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: { message: `Forbidden: requires role ${roles.join(' or ')}` },
      });
    }
    next();
  };
}

// Optional protection middleware — allows unauthenticated requests, but populates req.user when valid token present
async function optionalProtect(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      req.user = null;
      return next();
    }
    const token = authHeader.split(' ')[1];

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (jwtErr) {
      console.warn('Optional auth: invalid token', jwtErr.message);
      req.user = null;
      return next();
    }

    if (isMongoUp() && User && mongoose.isValidObjectId(decoded.id)) {
      try {
        const user = await User.findById(decoded.id).select('-password');
        if (user) {
          req.user = {
            id:        user._id.toString(),
            email:     user.email,
            role:      user.role || 'student',
            name:      user.name || '',
            studentId: user.studentId || ''
          };
          return next();
        }
      } catch (dbErr) {
        console.error('Optional auth DB error:', dbErr.message);
      }
    }

    if (decoded?.id && decoded?.email) {
      req.user = {
        id:        decoded.id,
        email:     decoded.email,
        role:      decoded.role || 'student',
        name:      decoded.name || '',
        studentId: decoded.studentId || ''
      };
      return next();
    }

    req.user = null;
    next();
  } catch (err) {
    console.error('Optional auth unexpected error:', err.message);
    req.user = null;
    next();
  }
}

module.exports = { protect, authorize, optionalProtect };