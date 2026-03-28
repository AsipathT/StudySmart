const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import User model
const User = require('../models/User');

const createTestUser = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Check if user already exists
    const existingUser = await User.findOne({ email: 'demo@studysmart.com' });
    if (existingUser) {
      console.log('Test user already exists');
      process.exit(0);
    }

    // Create test user
    const testUser = new User({
      name: 'Demo User',
      email: 'demo@studysmart.com',
      password: 'demo123',
      role: 'student'
    });

    await testUser.save();
    console.log('✅ Test user created successfully!');
    console.log('Email: demo@studysmart.com');
    console.log('Password: demo123');

  } catch (error) {
    console.error('Error creating test user:', error);
  } finally {
    mongoose.disconnect();
    process.exit();
  }
};

createTestUser();