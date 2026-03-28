const { Sequelize } = require('sequelize');
const mongoose = require('mongoose');
const pg = require('pg');
require('dotenv').config();

// ── PostgreSQL (Sequelize) ────────────────────────────────────────────────────
const sequelize = new Sequelize(
  process.env.PG_DATABASE || 'studysmart',
  process.env.PG_USER     || 'postgres',
  process.env.PG_PASSWORD || 'postgres',
  {
    host:          process.env.PG_HOST || 'localhost',
    port:          process.env.PG_PORT || 5432,
    dialect:       'postgres',
    dialectModule: pg,
    logging:       process.env.NODE_ENV === 'development' ? false : false,
    pool: { max: 10, min: 0, acquire: 30000, idle: 10000 }
  }
);

// ── MongoDB ───────────────────────────────────────────────────────────────────
const { MongoMemoryServer } = require('mongodb-memory-server');
const DEFAULT_MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/studysmart';
let mongoServer = null;

const connectMongoDB = async () => {
  let uri = process.env.MONGODB_URI || DEFAULT_MONGODB_URI;

  // Prefer explicit URI for production usage
  if (!process.env.MONGODB_URI) {
    console.warn('⚠️  MONGODB_URI not set; trying local Mongo or in-memory fallback.');
  }

  const connect = async (targetUri) => {
    await mongoose.connect(targetUri, {
      useNewUrlParser:    true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
    });
    console.log('✅ MongoDB connected:', targetUri);
    return targetUri;
  };

  try {
    await connect(uri);
    return uri;
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message);
    console.warn('⚠️  Attempting mongodb-memory-server fallback (dev only).');

    // Development/emulation fallback
    try {
      if (!mongoServer) {
        mongoServer = await MongoMemoryServer.create({ binary: { version: '6.0.8' } });
      }
      uri = mongoServer.getUri();
      await connect(uri);
      console.log('✅ MongoDB in-memory fallback connected:', uri);
      return uri;
    } catch (memoryErr) {
      console.error('❌ In-memory MongoDB fallback failed:', memoryErr.message);
      console.error('❌ Attempted URI:', uri);
    }
  }

  console.warn('⚠️  MongoDB is unavailable; app will continue in degraded mode.');
  return null;
};

const disconnectMongoDB = async () => {
  try {
    await mongoose.disconnect();
    if (mongoServer) {
      await mongoServer.stop();
      mongoServer = null;
    }
    console.log('✅ MongoDB disconnected.');
  } catch (err) {
    console.error('❌ Error disconnecting MongoDB:', err.message);
  }
};

// ── PostgreSQL connect + sync tables ─────────────────────────────────────────
const connectPostgreSQL = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ PostgreSQL Connected successfully');

    // ✅ FIXED: Import models from correct path (src/models/index.js)
    const models = require('../src/models');

    // Sync all models — creates tables if they don't exist
    await sequelize.sync({ alter: true });
    console.log('✅ PostgreSQL Tables synced successfully');

    return { sequelize, ...models };
  } catch (error) {
    console.error('❌ PostgreSQL Connection Error:', error.message);
    console.log('⚠️  Continuing without PostgreSQL — upload history will not persist.');
  }
};

module.exports = { connectMongoDB, connectPostgreSQL, sequelize };