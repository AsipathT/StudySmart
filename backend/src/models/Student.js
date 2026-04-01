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
    allowNull: false,
    unique: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
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
  userId: {
    type: DataTypes.STRING,
    comment: 'Reference to MongoDB User ID'
  },
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {}
  }
}, {
  timestamps: true,
  underscored: true
});

module.exports = Student;