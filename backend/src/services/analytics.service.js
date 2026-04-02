/**
 * profile-analytics.service.js  —  Backend
 *
 * Reusable calculation methods called by profile.controller.js
 * Handles missing data and edge cases gracefully.
 */
const { QuizScore, StudySession, Student } = require('../models');

// ── GPA conversion (percentage → 4.0 scale) ───────────────────────────────────
function calcGPA(scores = []) {
  if (!scores.length) return 0;
  const avg = scores.reduce((s, q) => s + parseFloat(q.score || 0), 0) / scores.length;
  // Simple linear mapping: 100% → 4.0, 40% → 0
  const gpa = Math.max(0, ((avg - 40) / 60) * 4.0);
  return parseFloat(gpa.toFixed(2));
}

function getGrade(score) {
  if (score >= 90) return 'A+';
  if (score >= 80) return 'A';
  if (score >= 70) return 'B+';
  if (score >= 65) return 'B';
  if (score >= 60) return 'C+';
  if (score >= 55) return 'C';
  if (score >= 50) return 'D';
  return 'F';
}

// ── Study session helpers ─────────────────────────────────────────────────────
function calcDailyAverage(sessions = []) {
  if (!sessions.length) return 0;
  const total = sessions.reduce((s, ss) => s + parseFloat(ss.hoursStudied || 0), 0);
  return parseFloat((total / sessions.length).toFixed(1));
}

function calcWeeklyTotal(sessions = []) {
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const thisWeek = sessions.filter(s => new Date(s.date) >= oneWeekAgo);
  return parseFloat(thisWeek.reduce((s, ss) => s + parseFloat(ss.hoursStudied || 0), 0).toFixed(1));
}

function calcConsistency(sessions = []) {
  if (sessions.length < 2) return 0;
  // What % of the last 30 days had at least one study session?
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recent = sessions.filter(s => new Date(s.date) >= thirtyDaysAgo);
  const uniqueDays = new Set(recent.map(s => new Date(s.date).toDateString())).size;
  return Math.min(100, Math.round((uniqueDays / 30) * 100));
}

function getProductiveDays(sessions = []) {
  const dayTotals = {};
  const dayNames  = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  for (const s of sessions) {
    const day = dayNames[new Date(s.date).getDay()];
    dayTotals[day] = (dayTotals[day] || 0) + parseFloat(s.hoursStudied || 0);
  }
  const sorted = Object.entries(dayTotals).sort((a, b) => b[1] - a[1]);
  const productive = sorted.slice(0, 3).map(([d]) => d);
  const weak       = sorted.slice(-2).map(([d]) => d);
  return { productiveDays: productive, weakDays: weak };
}

// ── Subject performance ───────────────────────────────────────────────────────
async function getSubjectPerformance(studentId) {
  try {
    const distinctSubjects = await QuizScore.distinct('subject', { studentId });

    const results = [];
    for (const subject of distinctSubjects) {
      const rows = await QuizScore.find({ studentId, subject });
      if (!rows.length) continue;
      const avg = rows.reduce((s, q) => s + parseFloat(q.score || 0), 0) / rows.length;
      results.push({
        subject,
        score:    parseFloat(avg.toFixed(1)),
        grade:    getGrade(avg),
        attempts: rows.length,
        status:   avg >= 50 ? 'Pass' : 'Fail',
        trend:    rows.slice(-3).map(r => parseFloat(r.score)),   // last 3 scores
      });
    }

    // Sort by score descending
    return results.sort((a, b) => b.score - a.score);
  } catch (err) {
    console.warn('getSubjectPerformance failed:', err.message);
    return [];
  }
}

// ── Grade distribution ────────────────────────────────────────────────────────
async function getGradeDistribution(studentId) {
  try {
    const rows = await QuizScore.find({ studentId });
    const dist = { 'A+':0, A:0, 'B+':0, B:0, 'C+':0, C:0, D:0, F:0 };
    for (const r of rows) {
      const g = getGrade(parseFloat(r.score || 0));
      dist[g] = (dist[g] || 0) + 1;
    }
    // Collapse A+/A → A, B+/B → B etc. for the pie chart
    return {
      A: (dist['A+'] || 0) + (dist['A'] || 0),
      B: (dist['B+'] || 0) + (dist['B'] || 0),
      C: (dist['C+'] || 0) + (dist['C'] || 0),
      D: dist['D'] || 0,
      F: dist['F'] || 0,
    };
  } catch { return { A:0, B:0, C:0, D:0, F:0 }; }
}

// ── Performance trend (last 12 quiz scores, grouped by month) ────────────────
async function getPerformanceTrend(studentId) {
  try {
    const rows = await QuizScore.find({ studentId })
      .sort({ date: 1 })
      .limit(24);
    if (!rows.length) return [];

    // Group by calendar month
    const byMonth = {};
    for (const r of rows) {
      const key = new Date(r.date).toLocaleDateString('en-US', { year:'numeric', month:'short' });
      if (!byMonth[key]) byMonth[key] = [];
      byMonth[key].push(parseFloat(r.score || 0));
    }

    return Object.entries(byMonth).map(([month, scores]) => ({
      month,
      score:  parseFloat((scores.reduce((a,b)=>a+b,0)/scores.length).toFixed(1)),
      target: 75,
    }));
  } catch (err) {
    console.warn('getPerformanceTrend failed:', err.message);
    return [];
  }
}

// ── Semester GPA trend (for dashboard) ────────────────────────────────────────
async function getSemesterGpaTrend(studentId) {
  try {
    const rows = await QuizScore.find({ studentId }).sort({ date: 1 });
    if (!rows.length) return [];

    // Group scores into chunks of ~10 as "semesters"
    const semSize  = Math.max(5, Math.ceil(rows.length / 5));
    const semesters= [];
    for (let i = 0; i < rows.length; i += semSize) {
      const chunk = rows.slice(i, i + semSize);
      const semNum= semesters.length + 1;
      semesters.push({
        sem: `S${semNum > 2 ? (semNum%2||2) : semNum} Y${Math.ceil(semNum/2)}`,
        gpa: parseFloat(calcGPA(chunk).toFixed(2)),
      });
    }
    return semesters.slice(0, 5);  // max 5 on the chart
  } catch { return []; }
}

// ── Overall student analytics (called by dashboard) ───────────────────────────
async function calculatePerformanceAnalytics(studentId, subject = null) {
  try {
    const where = subject ? { studentId, subject } : { studentId };
    const rows  = await QuizScore.find(where);
    if (!rows.length) return null;

    const scores = rows.map(r => parseFloat(r.score || 0));
    return {
      subject:    subject || 'Overall',
      statistics: {
        count:   scores.length,
        average: parseFloat((scores.reduce((a,b)=>a+b,0)/scores.length).toFixed(1)),
        max:     Math.max(...scores),
        min:     Math.min(...scores),
        median:  median(scores),
      },
    };
  } catch { return null; }
}

// ── Subject-level analytics (called by analytics routes) ─────────────────────
async function calculateSubjectAnalytics(subject) {
  try {
    const rows = await QuizScore.find({ subject });
    if (!rows.length) return null;
    const scores = rows.map(r => parseFloat(r.score || 0));
    return {
      subject,
      totalStudents: new Set(rows.map(r => r.studentId)).size,
      statistics:    {
        count:   scores.length,
        average: parseFloat((scores.reduce((a,b)=>a+b,0)/scores.length).toFixed(1)),
        max:     Math.max(...scores),
        min:     Math.min(...scores),
        median:  median(scores),
      },
    };
  } catch { return null; }
}

function median(arr) {
  if (!arr.length) return 0;
  const sorted = [...arr].sort((a,b)=>a-b);
  const mid    = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? parseFloat(((sorted[mid-1]+sorted[mid])/2).toFixed(1))
    : parseFloat(sorted[mid].toFixed(1));
}

// ── Full profile analytics bundle ─────────────────────────────────────────────
// Called once by profile.controller.getProfile to avoid N+1 queries
async function buildProfileAnalytics(studentId, userId) {
  const [
    quizScores,
    studySessions,
    subjectPerformance,
    performanceTrend,
    gradeDistribution,
    semesterGpaTrend,
  ] = await Promise.allSettled([
    QuizScore.find({ studentId }).sort({ date: -1 }).catch(()=>[]),
    StudySession.find({ userId }).sort({ date: -1 }).catch(()=>[]),
    getSubjectPerformance(studentId),
    getPerformanceTrend(studentId),
    getGradeDistribution(studentId),
    getSemesterGpaTrend(studentId),
  ]);

  const scores   = quizScores.value    || [];
  const sessions = studySessions.value || [];
  const { productiveDays, weakDays } = getProductiveDays(sessions);

  const overallAvg = scores.length
    ? parseFloat((scores.reduce((s,q)=>s+parseFloat(q.score||0),0)/scores.length).toFixed(1))
    : 0;

  return {
    quizScores:   scores,
    studySessions:sessions,
    performance: {
      overallAverage:     overallAvg,
      subjectPerformance: subjectPerformance.value || [],
      performanceTrend:   performanceTrend.value   || [],
      gradeDistribution:  gradeDistribution.value  || { A:0,B:0,C:0,D:0,F:0 },
      semesterGpaTrend:   semesterGpaTrend.value   || [],
    },
    studyHabits: {
      dailyAverage:  calcDailyAverage(sessions),
      weeklyTotal:   calcWeeklyTotal(sessions),
      consistency:   calcConsistency(sessions),
      productiveDays,
      weakDays,
    },
    currentGPA: calcGPA(scores),
  };
}

module.exports = {
  calcGPA,
  getGrade,
  calcDailyAverage,
  calcWeeklyTotal,
  calcConsistency,
  getProductiveDays,
  getSubjectPerformance,
  getGradeDistribution,
  getPerformanceTrend,
  getSemesterGpaTrend,
  calculatePerformanceAnalytics,
  calculateSubjectAnalytics,
  buildProfileAnalytics,
};
