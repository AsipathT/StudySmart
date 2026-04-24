const jwt  = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// ── Graceful model import — won't crash if MongoDB/Sequelize is down ──────────
let User = null;
try {
  // Try Mongoose model first (MongoDB)
  User = require('../models/User');
} catch (e) {
  console.warn('⚠️  User model not loaded:', e.message);
}

// ── SLIIT Email Validation ────────────────────────────────────────────────────
const validateSLIITEmail = (email) => {
  if (email === 'admin@nidu.sliit.lk') {
    return true;
  }
  const sliitRegex = /^IT\d{8}@my\.sliit\.lk$/i;
  return sliitRegex.test(email);
};

// ── In-memory fallback user store (used when DB is unavailable) ───────────────
// Seeded with the demo account from LOGIN_GUIDE.md
const memoryUsers = [
  {
    id:       'demo-001',
    name:     'Demo Student',
    email:    'demo@studysmart.com',
    // bcrypt hash for "demo123" (generated during troubleshooting)
    password: '$2b$10$VZJOxblStoRLm3XwAO1bZ.lX.6D19/hSn0nWjQADG5Ph5H8tX6moe',
    role:     'student',
    studentId: 'IT23145870',
  },
];

// debug helper - log in-memory users on load
console.log('[AUTH CTRL] Memory users:', memoryUsers.map(u => u.email));

const JWT_SECRET = process.env.JWT_SECRET || 'studysmart_dev_secret_key_2024';
const JWT_EXPIRES = process.env.JWT_EXPIRES_IN || '7d';

// ── Helper: sign a JWT ────────────────────────────────────────────────────────
const signToken = (user) =>
  jwt.sign(
    { id: user.id || user._id, email: user.email, role: user.role || 'student' },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES }
  );

// ── Helper: safe DB check ─────────────────────────────────────────────────────
const isDbAvailable = () => {
  try {
    const mongoose = require('mongoose');
    return mongoose.connection.readyState === 1;
  } catch {
    return false;
  }
};

class AuthController {

  // ── LOGIN ──────────────────────────────────────────────────────────────────
  async login(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          error: { code: 'MISSING_FIELDS', message: 'Email and password are required' },
        });
      }

      // ── ADMIN HARDCODE CHECK ──────────────────────────────────────────────
      if (email === 'admin@nidu.sliit.lk' && password === 'nidu@123') {
        const adminUser = {
          id:       'admin-hardcoded',
          name:     'Admin',
          email:    'admin@nidu.sliit.lk',
          role:     'admin',
          studentId: null
        };
        const token = signToken(adminUser);
        console.log('[AUTH] ✅ Admin login successful');
        return res.json({
          success: true,
          token,
          user: adminUser,
        });
      }

      let foundUser = null;

      // 1. Try MongoDB
      if (isDbAvailable() && User) {
        try {
          const dbUser = await User.findOne({ email: email.toLowerCase() });
          if (dbUser) {
            const match = await bcrypt.compare(password, dbUser.password);
            if (!match) {
              return res.status(401).json({
                success: false,
                error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' },
              });
            }
            foundUser = {
              id:        dbUser._id,
              name:      dbUser.name,
              email:     dbUser.email,
              role:      dbUser.role || 'student',
              studentId: dbUser.studentId || null,
            };
          }
        } catch (dbErr) {
          console.warn('⚠️  MongoDB login query failed, falling back:', dbErr.message);
        }
      }

      // 2. Fallback to in-memory store
      if (!foundUser) {
        const mem = memoryUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
        if (!mem) {
          return res.status(401).json({
            success: false,
            error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' },
          });
        }
        const match = await bcrypt.compare(password, mem.password);
        if (!match) {
          return res.status(401).json({
            success: false,
            error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' },
          });
        }
        foundUser = {
          id:        mem.id,
          name:      mem.name,
          email:     mem.email,
          role:      mem.role,
          studentId: mem.studentId,
        };
      }

      const token = signToken(foundUser);

      return res.json({
        success: true,
        token,
        user: foundUser,
      });

    } catch (err) {
      console.error('Login error:', err);
      return res.status(500).json({
        success: false,
        error: { code: 'LOGIN_ERROR', message: err.message || 'Login failed' },
      });
    }
  }

  // ── REGISTER ───────────────────────────────────────────────────────────────
  async register(req, res) {
    try {
      const { name, email, password } = req.body;

      if (!name || !email || !password) {
        return res.status(400).json({
          success: false,
          error: { code: 'MISSING_FIELDS', message: 'Name, email and password are required' },
        });
      }

      // ── VALIDATE SLIIT EMAIL FORMAT ───────────────────────────────────────
      if (!validateSLIITEmail(email)) {
        return res.status(400).json({
          success: false,
          error: { 
            code: 'INVALID_EMAIL', 
            message: 'Email must be in SLIIT format: IT12345678@my.sliit.lk' 
          },
        });
      }

      // ── PREVENT ADMIN REGISTRATION ────────────────────────────────────────
      if (email === 'admin@nidu.sliit.lk') {
        return res.status(403).json({
          success: false,
          error: { 
            code: 'FORBIDDEN', 
            message: 'Admin registration is not allowed' 
          },
        });
      }

      // ── VALIDATE PASSWORD LENGTH ──────────────────────────────────────────
      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          error: { 
            code: 'WEAK_PASSWORD', 
            message: 'Password must be at least 6 characters' 
          },
        });
      }

      const hashed = await bcrypt.hash(password, 10);
      const newUser = {
        id:        'user-' + Date.now(),
        name,
        email:     email.toLowerCase(),
        password:  hashed,
        role:      'student', // Always register as student
        studentId: null,
      };

      // Try to save to MongoDB
      if (isDbAvailable() && User) {
        try {
          const exists = await User.findOne({ email: newUser.email });
          if (exists) {
            return res.status(409).json({
              success: false,
              error: { code: 'EMAIL_EXISTS', message: 'Email already registered' },
            });
          }
          const saved = await User.create({
            name:      newUser.name,
            email:     newUser.email,
            password:  newUser.password,
            role:      newUser.role,
            studentId: newUser.studentId,
          });
          newUser.id = saved._id;
        } catch (dbErr) {
          console.warn('⚠️  MongoDB register failed, using memory store:', dbErr.message);
          // Fall through to memory store
        }
      }

      // Save to memory store as fallback
      const alreadyExists = memoryUsers.find(u => u.email === newUser.email);
      if (alreadyExists) {
        return res.status(409).json({
          success: false,
          error: { code: 'EMAIL_EXISTS', message: 'Email already registered' },
        });
      }
      memoryUsers.push(newUser);

      const token = signToken(newUser);

      return res.status(201).json({
        success: true,
        token,
        user: {
          id:        newUser.id,
          name:      newUser.name,
          email:     newUser.email,
          role:      newUser.role,
          studentId: newUser.studentId,
        },
      });

    } catch (err) {
      console.error('Register error:', err);
      return res.status(500).json({
        success: false,
        error: { code: 'REGISTER_ERROR', message: err.message || 'Registration failed' },
      });
    }
  }

  // ── GET CURRENT USER ───────────────────────────────────────────────────────
  async getMe(req, res) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Not authenticated' },
        });
      }

      // Try DB first
      if (isDbAvailable() && User) {
        try {
          const dbUser = await User.findById(userId).select('-password');
          if (dbUser) {
            return res.json({ success: true, user: dbUser });
          }
        } catch (e) { /* fall through */ }
      }

      // Fallback to memory
      const mem = memoryUsers.find(u => u.id === userId);
      if (mem) {
        const { password: _, ...safeUser } = mem;
        return res.json({ success: true, user: safeUser });
      }

      // Return minimal user from JWT payload
      return res.json({ success: true, user: req.user });

    } catch (err) {
      return res.status(500).json({
        success: false,
        error: { code: 'GETME_ERROR', message: err.message },
      });
    }
  }

  // ── LOGOUT ─────────────────────────────────────────────────────────────────
  async logout(req, res) {
    // JWT is stateless — client just discards the token
    return res.json({ success: true, message: 'Logged out successfully' });
  }
}

module.exports = new AuthController();