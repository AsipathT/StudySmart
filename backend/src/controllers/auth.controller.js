const User = require('../models/User');
const Student = require('../models/Student');
const jwt = require('jsonwebtoken');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'fallback_secret', {
    expiresIn: '30d'
  });
};

exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = await User.create({
      name,
      email,
      password,
      role: role || 'student'
    });

    if (user) {
      res.status(201).json({
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        },
        token: generateToken(user._id)
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    console.log(`🔍 Login attempt for: ${email} | User found: ${!!user}`);

    if (user && (await user.comparePassword(password))) {
      console.log(`✅ Login successful for: ${email}`);
      user.lastLogin = Date.now();
      await user.save();

      let studentId = null;
      if (user.role === 'student') {
        try {
          const student = await Student.findOne({ where: { email: user.email } });
          studentId = student?.id;
        } catch (dbError) {
          console.error('PostgreSQL lookup failed during login:', dbError.message);
          // Proceed with null studentId so login doesn't fail
        }
      }

      res.json({
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          studentId: studentId
        },
        token: generateToken(user._id)
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getMe = async (req, res) => {
  try {
    let studentId = null;
    if (req.user.role === 'student') {
      try {
        const student = await Student.findOne({ where: { email: req.user.email } });
        studentId = student?.id;
      } catch (dbError) {
        console.error('PostgreSQL lookup failed during getMe:', dbError.message);
      }
    }

    res.json({ 
      user: {
        ...req.user.toObject(),
        id: req.user._id,
        studentId: studentId
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find({ role: { $ne: 'admin' } }).select('-password');
    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
