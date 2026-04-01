const { Sequelize } = require('sequelize');
const mongoose = require('mongoose');
const pg = require('pg');
require('dotenv').config();

// MongoDB Connection
const connectMongoDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB Connected successfully');
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error);
    process.exit(1);
  }
};

// PostgreSQL Connection
const sequelize = new Sequelize(
  process.env.PG_DATABASE,
  process.env.PG_USER,
  process.env.PG_PASSWORD,
  {
    host: process.env.PG_HOST,
    port: process.env.PG_PORT,
    dialect: 'postgres',
    dialectModule: pg,
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
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
    console.log('✅ PostgreSQL Connected successfully');
    
    // Sync all models
    await sequelize.sync({ alter: true });
    console.log('✅ PostgreSQL Models synced');
  } catch (error) {
    console.error('⚠️ PostgreSQL Connection Failed (Continuing without it):', error.message);
    // Do not exit, allows MongoDB features to work
  }
};

module.exports = {
  connectMongoDB,
  connectPostgreSQL,
  sequelize
};
