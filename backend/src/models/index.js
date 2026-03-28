const { sequelize } = require('../../config/database');
const Student = require('./Student');
const QuizScore = require('./QuizScore');
const ExtractedData = require('./ExtractedData');

// Define associations
Student.hasMany(QuizScore, { foreignKey: 'studentId' });
QuizScore.belongsTo(Student, { foreignKey: 'studentId' });

// Export models and sequelize
module.exports = {
  sequelize,
  Student,
  QuizScore,
  ExtractedData
};