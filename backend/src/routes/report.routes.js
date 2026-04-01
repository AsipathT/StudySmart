/**
 * report.routes.js
 * GET /api/report/pdf  →  generates and streams a professional PDF analytics report
 *
 * Requires:
 *   1. generate_report.py  →  copy to  backend/src/scripts/generate_report.py
 *   2. pip install reportlab  (run once on the server)
 */
const express  = require('express');
const router   = express.Router();
const { spawn }= require('child_process');
const path     = require('path');
const { protect } = require('../middleware/auth');

const User    = require('../models/User');
const { Student, QuizScore, StudySession } = require('../models');

// Locate the Python script relative to this file
// this file: backend/src/routes/report.routes.js
// script:    backend/src/scripts/generate_report.py
const SCRIPT = path.resolve(__dirname, '..', 'scripts', 'generate_report.py');

// ── Helper: find postgres student ────────────────────────────────────────────
async function findStudent(mongoUser) {
  if (!mongoUser) return null;
  try {
    let s = null;
    if (mongoUser.studentId) {
      s = await Student.findOne({ where: { studentNumber: mongoUser.studentId } });
    }
    if (!s && mongoUser.email) {
      s = await Student.findOne({ where: { email: mongoUser.email } });
    }
    return s;
  } catch { return null; }
}

// ── GPA helper ────────────────────────────────────────────────────────────────
function scoreToGPA(score) {
  const s = parseFloat(score || 0);
  if (s >= 85) return 4.0; if (s >= 75) return 3.7;
  if (s >= 70) return 3.3; if (s >= 65) return 3.0;
  if (s >= 60) return 2.7; if (s >= 55) return 2.3;
  if (s >= 50) return 2.0; if (s >= 40) return 1.7;
  return 0.0;
}

function getGrade(score) {
  const s = parseFloat(score || 0);
  if (s >= 85) return 'A+'; if (s >= 75) return 'A';
  if (s >= 70) return 'B+'; if (s >= 65) return 'B';
  if (s >= 60) return 'C+'; if (s >= 55) return 'C';
  if (s >= 50) return 'D';  return 'F';
}

// ── GET /api/report/health (debug endpoint) ────────────────────────────────────
router.get('/health', (req, res) => {
  res.json({ success: true, message: 'Report service is running', timestamp: new Date() });
});

// ── GET /api/report/pdf ───────────────────────────────────────────────────────
router.get('/pdf', protect, async (req, res) => {
  try {
    // 1. Fetch user data
    const mongoUser = await User.findById(req.user.id).select('-password');
    if (!mongoUser) return res.status(404).json({ success: false, message: 'User not found' });

    const student = await findStudent(mongoUser);
    const meta    = student?.metadata || {};

    // 2. Fetch quiz scores
    let quizScores = [], studySessions = [], subjectPerf = [], perfTrend = [];
    if (student) {
      try {
        [quizScores, studySessions] = await Promise.all([
          QuizScore.findAll({ where: { studentId: student.id }, order: [['date', 'ASC']] }),
          StudySession.findAll({ where: { userId: req.user.id } }).catch(() => []),
        ]);

        // Group by subject
        const bySubject = {};
        quizScores.forEach(q => {
          if (!bySubject[q.subject]) bySubject[q.subject] = [];
          bySubject[q.subject].push(parseFloat(q.score || 0));
        });
        subjectPerf = Object.entries(bySubject).map(([subject, vals]) => {
          const avg = vals.reduce((a,b)=>a+b,0)/vals.length;
          const firstQuizForSubject = quizScores.find(q => q.subject === subject);
          return {
            subject, score: parseFloat(avg.toFixed(1)),
            grade: firstQuizForSubject?.metadata?.grade || getGrade(avg),
            gpa:   scoreToGPA(avg),
            status: avg >= 50 ? 'Pass' : 'Fail',
            attempts: vals.length,
          };
        }).sort((a,b)=>b.score-a.score);

        // Trend by month
        const byMonth = {};
        quizScores.forEach(q => {
          const key = new Date(q.date).toLocaleDateString('en-US', { month:'short', year:'numeric' });
          if (!byMonth[key]) byMonth[key] = [];
          byMonth[key].push(parseFloat(q.score || 0));
        });
        perfTrend = Object.entries(byMonth).map(([month, vals]) => ({
          month,
          average: parseFloat((vals.reduce((a,b)=>a+b,0)/vals.length).toFixed(1)),
          target: 75,
          students: vals.length,
        }));
      } catch (e) {
        console.warn('[report] analytics query failed (non-fatal):', e.message);
      }
    }

    const avgScore = quizScores.length
      ? quizScores.reduce((s,q)=>s+parseFloat(q.score||0),0)/quizScores.length : 0;
    const gpa = scoreToGPA(avgScore);
    const totalH = studySessions.reduce((s,ss)=>s+parseFloat(ss.hoursStudied||0),0);

    // 3. Build payload for Python
    const payload = {
      personalInfo: {
        name:             mongoUser.name,
        email:            mongoUser.email,
        studentNumber:    student?.studentNumber || mongoUser.studentId || '',
        phone:            meta.phone     || '',
        branch:           meta.branch    || '',
        avatarUrl:        mongoUser.profilePicture || '',
      },
      academicInfo: {
        program:            meta.program            || '',
        batch:              meta.batch              || '',
        semester:           meta.semester           || '',
        academicYear:       meta.year               || '',
        branch:             meta.branch             || '',
        currentGPA:         parseFloat(gpa.toFixed(2)),
        totalCredits:       meta.totalCredits       || 0,
        completedCredits:   meta.completedCredits   || 0,
        academicStanding:   gpa >= 2.0 ? 'Good Standing' : 'At Risk',
      },
      performance: {
        overallAverage:     parseFloat(avgScore.toFixed(1)),
        totalAssessments:   quizScores.length,
        subjectPerformance: subjectPerf,
        performanceTrend:   perfTrend,
        summary: {
          totalStudents:    1,
          totalAssessments: quizScores.length,
          averageScore:     parseFloat(avgScore.toFixed(1)),
          passRate:         quizScores.length
            ? parseFloat(((quizScores.filter(q=>parseFloat(q.score||0)>=50).length/quizScores.length)*100).toFixed(1))
            : 0,
          topScore:    quizScores.length ? Math.max(...quizScores.map(q=>parseFloat(q.score||0))) : 0,
          bottomScore: quizScores.length ? Math.min(...quizScores.map(q=>parseFloat(q.score||0))) : 0,
        },
      },
      studyHabits: {
        dailyAverage: studySessions.length ? parseFloat((totalH/studySessions.length).toFixed(1)) : 0,
        weeklyTotal:  parseFloat(totalH.toFixed(1)),
        consistency:  meta.consistency || 0,
      },
    };

    // 4. Call Python script
    const python = process.platform === 'win32' ? 'python' : 'python3';
    const proc   = spawn(python, [SCRIPT], { timeout: 30000 });

    const chunks = [];
    const errChunks = [];

    proc.stdout.on('data', chunk => chunks.push(chunk));
    proc.stderr.on('data', chunk => errChunks.push(chunk));

    proc.stdin.write(JSON.stringify(payload));
    proc.stdin.end();

    proc.on('close', code => {
      if (code !== 0 || chunks.length === 0) {
        const errMsg = Buffer.concat(errChunks).toString();
        console.error('[report] Python script failed:', errMsg);
        return res.status(500).json({
          success: false,
          message: 'Failed to generate PDF report',
          detail:  errMsg.slice(0, 300),
        });
      }

      const pdf      = Buffer.concat(chunks);
      const safeName = (mongoUser.name || 'student').replace(/[^a-zA-Z0-9]/g, '_');
      const filename = `studysmart_report_${safeName}_${new Date().toISOString().split('T')[0]}.pdf`;

      res.setHeader('Content-Type',        'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length',      pdf.length);
      res.send(pdf);
    });

    proc.on('error', err => {
      console.error('[report] Could not spawn Python:', err.message);
      return res.status(500).json({
        success: false,
        message: 'Python3 not available on this server. Install reportlab: pip install reportlab',
      });
    });

  } catch (err) {
    console.error('[report] error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;