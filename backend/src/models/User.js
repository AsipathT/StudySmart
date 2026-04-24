const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Resource Library demo accounts (seeded in auth.routes)
const RESOURCE_LIBRARY_DEMO_EMAILS = new Set([
  'resourceadmin@gmail.com',
  'kasun@gmail.com',
  'nadeesha@gmail.com',
  'dulani@gmail.com',
  'chamod@gmail.com',
  'ishani@gmail.com',
]);

// SLIIT email format validator
const validateSLIITEmail = (email) => {
  const e = String(email || '').toLowerCase();
  if (RESOURCE_LIBRARY_DEMO_EMAILS.has(e)) return true;
  if (
    e === 'admin@nidu.sliit.lk' ||
    e === 'demo@studysmart.com' ||
    e === 'resourceadmin@studysmart.com'
  ) {
    return true;
  }
  const sliitRegex = /^IT\d{8}@my\.sliit\.lk$/i;
  return sliitRegex.test(email);
};

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    validate: {
      validator: validateSLIITEmail,
      message: 'Email must be in SLIIT format (IT12345678@my.sliit.lk) or admin email'
    }
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: ['student', 'admin', 'resource_admin'],
    default: 'student'
  },
  studentId: {
    type: String,
    sparse: true
  },
  profilePicture: String,
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: Date,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    this.updatedAt = Date.now();
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);