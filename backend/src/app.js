const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const seedSubjects = require('./utils/seedSubjects');
const seedAdmin = require('./utils/seedAdmin');
const { migratePageCounts } = require('./controllers/subjectController');

const app = express();

app.use(cors());
app.use(express.json());

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

app.use('/uploads', express.static(uploadsDir));

// Routes
app.use('/api/quiz-scores', require('./routes/quizscore.routes'));
app.use('/api/study-session', require('./routes/studySessionRoutes'));
app.use('/api/subjects', require('./routes/subject.routes'));
app.use('/api/quizzes', require('./routes/quiz.routes'));
app.use('/api/auth', require('./routes/auth.routes'));

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    console.log("✅ Connected to MongoDB");
    
    // Seed Subjects & Admin
    await seedSubjects();
    await seedAdmin();
    // Backfill page counts for any PDFs uploaded before this feature
    migratePageCounts();

    app.listen(process.env.PORT || 5000, () => {
      console.log(`✅ Server running on port ${process.env.PORT || 5000}`);
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB Connection Error:", err);
  });
