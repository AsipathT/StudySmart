#!/usr/bin/env node
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const User = require('./src/models/User');

async function startMongoDB() {
  try {
    // Start MongoDB in-memory instance
    const mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    
    console.log('📦 Starting in-memory MongoDB...');
    console.log('URI:', mongoUri);
    
    // Connect mongoose
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('✅ MongoDB connected');
    
    // Create demo user
    const demoUser = new User({
      name: 'Demo Student',
      email: 'demo@studysmart.com',
      password: 'demo123',
      role: 'student',
      studentNumber: 'IT23145870'
    });
    
    await demoUser.save();
    console.log('✅ Demo user created - Email: demo@studysmart.com, Password: demo123');
    
    // Start the backend server
    require('./src/app');
    
    // Keep the process alive
    process.on('SIGINT', async () => {
      console.log('\n🛑 Shutting down...');
      await mongoose.disconnect();
      await mongoServer.stop();
      process.exit(0);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

startMongoDB();
