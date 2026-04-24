const { Sequelize } = require('sequelize');
const mongoose = require('mongoose');
const pg = require('pg');
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

const sequelize = new Sequelize(
  process.env.PG_DATABASE || 'studysmart',
  process.env.PG_USER || 'postgres',
  process.env.PG_PASSWORD || '',
  {
    host: process.env.PG_HOST || '127.0.0.1',
    port: process.env.PG_PORT || 5432,
    dialect: 'postgres',
    dialectModule: pg,
    logging: false,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

const connectPostgreSQL = async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ alter: true });
    console.log('✅ PostgreSQL connected');
    return true;
  } catch (error) {
    console.warn('⚠️ PostgreSQL unavailable — continuing without it:', error.message);
    return false;
  }
};

module.exports = { connectMongoDB, disconnectMongoDB, connectPostgreSQL, sequelize };
