const mongoose = require('mongoose');
require('dotenv').config();

const connectMongoDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/studysmart';
  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000
    });
    console.log('✅ MongoDB connected');
    return uri;
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message);
    console.warn('⚠️ MongoDB unavailable — continuing without it');
    return null;
  }
};

const disconnectMongoDB = async () => {
  try {
    await mongoose.disconnect();
    console.log('✅ MongoDB disconnected.');
  } catch (err) {
    console.error('❌ Error disconnecting MongoDB:', err.message);
  }
};

module.exports = { connectMongoDB, disconnectMongoDB };
