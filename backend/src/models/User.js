const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// SLIIT email format validator
const validateSLIITEmail = (email) => {
  if (email === 'admin@nidu.sliit.lk' || email === 'demo@studysmart.com') {
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
    enum: ['student', 'admin'],
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