const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');

const Student = sequelize.define('Student', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  studentNumber: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING
  },
  program: {
    type: DataTypes.STRING
  },
  year: {
    type: DataTypes.INTEGER
  },
  semester: {
    type: DataTypes.INTEGER
  },
  branch: {
    type: DataTypes.STRING
  },
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {}
  }
}, {
  timestamps: true,
  tableName: 'students',
  underscored: true  // ✅ maps studentNumber → student_number etc.
});

module.exports = Student;