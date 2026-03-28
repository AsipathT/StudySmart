/**
 * setup-db.js — run once to create all PostgreSQL tables
 * Usage: node setup-db.js
 */
require('dotenv').config();
const { Sequelize, DataTypes } = require('sequelize');
const pg = require('pg');

const sequelize = new Sequelize(
  process.env.PG_DATABASE || 'studysmart',
  process.env.PG_USER     || 'postgres',
  process.env.PG_PASSWORD || 'postgres',
  {
    host:          process.env.PG_HOST || 'localhost',
    port:          process.env.PG_PORT || 5432,
    dialect:       'postgres',
    dialectModule: pg,
    logging:       false,
  }
);

const Student = sequelize.define('Student', {
  id:            { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  studentNumber: { type: DataTypes.STRING, unique: true, allowNull: false },
  name:          { type: DataTypes.STRING, allowNull: false },
  email:         { type: DataTypes.STRING },
  metadata:      { type: DataTypes.JSONB, defaultValue: {} },
}, { timestamps: true, tableName: 'students', underscored: true });

const QuizScore = sequelize.define('QuizScore', {
  id:            { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  studentId:     { type: DataTypes.UUID, allowNull: false },
  subject:       { type: DataTypes.STRING, allowNull: false },
  score:         { type: DataTypes.DECIMAL(5,2), allowNull: false },
  type:          { type: DataTypes.STRING, defaultValue: 'quiz' },
  date:          { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  sourceFile:    { type: DataTypes.STRING },
  grade:         { type: DataTypes.STRING },
  status:        { type: DataTypes.STRING },
  extractedData: { type: DataTypes.JSONB, defaultValue: {} },
  metadata:      { type: DataTypes.JSONB, defaultValue: {} },
}, { timestamps: true, tableName: 'quiz_scores', underscored: true });

const ExtractedData = sequelize.define('ExtractedData', {
  id:                { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  fileName:          { type: DataTypes.STRING, allowNull: false },
  fileType:          { type: DataTypes.STRING },
  filePath:          { type: DataTypes.STRING },
  status:            { type: DataTypes.STRING, defaultValue: 'pending' },
  recordCount:       { type: DataTypes.INTEGER, defaultValue: 0 },
  extractedRecords:  { type: DataTypes.JSONB, defaultValue: {} },
  normalizedRecords: { type: DataTypes.JSONB, defaultValue: [] },
  validationErrors:  { type: DataTypes.JSONB, defaultValue: [] },
  processedAt:       { type: DataTypes.DATE },
  metadata:          { type: DataTypes.JSONB, defaultValue: {} },
  uploadedBy:        { type: DataTypes.STRING },
}, { timestamps: true, tableName: 'extracted_data', underscored: true });

const StudySession = sequelize.define('StudySession', {
  id:           { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  userId:       { type: DataTypes.STRING },
  subject:      { type: DataTypes.STRING },
  hoursStudied: { type: DataTypes.FLOAT, defaultValue: 0 },
  date:         { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  notes:        { type: DataTypes.TEXT },
  metadata:     { type: DataTypes.JSONB, defaultValue: {} },
}, { timestamps: true, tableName: 'study_sessions', underscored: true });

Student.hasMany(QuizScore,  { foreignKey: 'student_id' });
QuizScore.belongsTo(Student, { foreignKey: 'student_id' });

const setup = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Connected to PostgreSQL\n');
    await sequelize.sync({ force: false, alter: true });
    const tables = await sequelize.getQueryInterface().showAllTables();
    console.log('✅ Tables ready:');
    tables.forEach(t => console.log(`   📋 ${t}`));
    console.log('\n🎉 Database setup complete! Run: npm start\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
};

setup();