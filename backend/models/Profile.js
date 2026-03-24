const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  profileImage: {
    type: String,
    default: ''
  },
  degree: {
    type: String,
    enum: ['', 'Software Engineering', 'Information Technology', 'Business Management', 'Cyber Security', 'Data Science'],
    default: ''
  },
  year: {
    type: String,
    enum: ['', 'Year 1', 'Year 2', 'Year 3', 'Year 4'],
    default: ''
  },
  semester: {
    type: String,
    enum: ['', 'Semester 1', 'Semester 2'],
    default: ''
  },
  subjects: [{
    type: String
  }],
  availableTime: [{
    type: String,
    enum: ['Morning', 'Evening', 'Weekend']
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Profile', profileSchema);
