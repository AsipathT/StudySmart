const { Sequelize } = require('sequelize');
const mongoose = require('mongoose');
const pg = require('pg');
require('dotenv').config();

// PostgreSQL (optional)
const sequelize = new Sequelize(
  process.env.PG_DATABASE || 'studysmart',
  process.env.PG_USER || 'postgres',
  process.env.PG_PASSWORD || 'postgres',
  {
    host: process.env.PG_HOST || 'localhost',
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

// MongoDB
const DEFAULT_MONGODB_URI =
  process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/studysmart';

const connectMongoDB = async () => {
  const uri = process.env.MONGODB_URI || DEFAULT_MONGODB_URI;

  if (!process.env.MONGODB_URI) {
    console.warn('⚠️ MONGODB_URI not set; using local MongoDB fallback.');
  }

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

const connectPostgreSQL = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ PostgreSQL connected successfully');

    const models = require('../src/models');
    await sequelize.sync({ alter: true });
    console.log('✅ PostgreSQL tables synced successfully');

    return { sequelize, ...models };
  } catch (error) {
    console.error('❌ PostgreSQL Connection Error:', error.message);
    console.log('⚠️ Continuing without PostgreSQL — upload history will not persist.');
    return null;
  }
};

module.exports = {
  connectMongoDB,
  connectPostgreSQL,
  disconnectMongoDB,
  sequelize
};