require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');
const { connectMongoDB } = require('./config/database');

const seedDatabase = async () => {
  try {
    await connectMongoDB();
    console.log('✅ Connected to MongoDB');

    // Delete existing demo user if exists
    await User.deleteOne({ email: 'demo@studysmart.com' });

    // Create demo user with plain password (will be hashed by pre-save hook)
    const demoUser = new User({
      name: 'Demo Student',
      email: 'demo@studysmart.com',
      password: 'demo123', // Plain password - will be hashed by pre-save hook
      role: 'student',
      studentNumber: 'DEMO001'
    });

    await demoUser.save();
    console.log('✅ Demo user created successfully');
    console.log('   Email: demo@studysmart.com');
    console.log('   Password: demo123');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
};

seedDatabase();
