/**
 * profile.controller.js
 * GPA is calculated from QuizScore records (populated by Excel/CSV upload).
 * QuizScore.score = "CA Marks" value from the uploaded file (0–100 scale).
 * GPA formula: score >= 85→4.0, 70→3.0, 55→2.0, 40→1.0, <40→0
 */
const User = require('../models/User');
const { Student, QuizScore, StudySession } = require('../models');
const path = require('path');
const fs   = require('fs');

// ── find postgres student — NO userId column ──────────────────────────────────
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
  } catch (e) {
    console.warn('findStudent (non-fatal):', e.message);
    return null;
  }
}

// ── GPA: percentage score → 4.0 scale (SLIIT grading) ───────────────────────
// A+: 85-100 → 4.0 | A: 70-84 → 3.7 | B+: 65-69 → 3.3 | B: 60-64 → 3.0
// C+: 55-59 → 2.7 | C: 50-54 → 2.3 | D: 40-49 → 2.0 | F: <40 → 0
function scoreToGradePoint(score) {
  if (score >= 85) return 4.0;
  if (score >= 75) return 3.7;
  if (score >= 70) return 3.3;
  if (score >= 65) return 3.0;
  if (score >= 60) return 2.7;
  if (score >= 55) return 2.3;
  if (score >= 50) return 2.0;
  if (score >= 40) return 1.7;
  return 0.0;
}

function calcGPA(quizScores = []) {
  if (!quizScores.length) return 0;
  const total = quizScores.reduce((s, q) => s + scoreToGradePoint(parseFloat(q.score || 0)), 0);
  return parseFloat((total / quizScores.length).toFixed(2));
}

function calcAvgScore(quizScores = []) {
  if (!quizScores.length) return 0;
  return parseFloat(
    (quizScores.reduce((s, q) => s + parseFloat(q.score || 0), 0) / quizScores.length).toFixed(1)
  );
}

function getLetterGrade(score) {
  if (score >= 85) return 'A+';
  if (score >= 75) return 'A';
  if (score >= 70) return 'B+';
  if (score >= 65) return 'B';
  if (score >= 60) return 'C+';
  if (score >= 55) return 'C';
  if (score >= 50) return 'D';
  return 'F';
}

function calcConsistency(sessions = []) {
  if (sessions.length < 2) return 0;
  const ago30 = new Date(); ago30.setDate(ago30.getDate() - 30);
  const recent = sessions.filter(s => new Date(s.date) >= ago30);
  const uniqueDays = new Set(recent.map(s => new Date(s.date).toDateString())).size;
  return Math.min(100, Math.round((uniqueDays / 30) * 100));
}

function weeklyTotal(sessions = []) {
  const ago7 = new Date(); ago7.setDate(ago7.getDate() - 7);
  return parseFloat(
    sessions.filter(s => new Date(s.date) >= ago7)
      .reduce((s, ss) => s + parseFloat(ss.hoursStudied || 0), 0).toFixed(1)
  );
}

// ── subject performance from QuizScore ────────────────────────────────────────
async function getSubjectPerf(studentId) {
  try {
    const subjects = await QuizScore.findAll({
      where: { studentId }, attributes: ['subject'], group: ['subject'],
    });
    const out = [];
    for (const { subject } of subjects) {
      const rows = await QuizScore.findAll({ where: { studentId, subject } });
      const avg  = rows.reduce((s, q) => s + parseFloat(q.score || 0), 0) / rows.length;
      // Include grade from metadata if available (uploaded Excel had Grade column)
      const latestGrade = rows[0]?.metadata?.grade || getLetterGrade(avg);
      const latestStatus= rows[0]?.metadata?.status || (avg >= 50 ? 'Pass' : 'Fail');
      out.push({
        subject,
        score:    parseFloat(avg.toFixed(1)),
        grade:    latestGrade,
        gpa:      scoreToGradePoint(avg),
        attempts: rows.length,
        status:   latestStatus,
        highest:  Math.max(...rows.map(r => parseFloat(r.score || 0))),
        lowest:   Math.min(...rows.map(r => parseFloat(r.score || 0))),
      });
    }
    return out.sort((a, b) => b.score - a.score);
  } catch (e) {
    console.warn('getSubjectPerf:', e.message);
    return [];
  }
}

// ── performance trend by month ─────────────────────────────────────────────────
async function getPerfTrend(studentId) {
  try {
    const rows = await QuizScore.findAll({
      where: { studentId }, order: [['date','ASC']], limit: 24,
    });
    if (!rows.length) return [];
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
  } catch { return []; }
}

// ── grade distribution ─────────────────────────────────────────────────────────
function gradeDistribution(quizScores = []) {
  const dist = { A: 0, B: 0, C: 0, D: 0, F: 0 };
  for (const r of quizScores) {
    const g = getLetterGrade(parseFloat(r.score || 0));
    const key = g.replace('+','');
    dist[key] = (dist[key] || 0) + 1;
  }
  return dist;
}

// ═════════════════════════════════════════════════════════════════════════════
class ProfileController {

  // ── GET /api/profile ────────────────────────────────────────────────────────
  async getProfile(req, res) {
    try {
      const mongoUser = await User.findById(req.user.id).select('-password');
      if (!mongoUser) return res.status(404).json({ success:false, message:'User not found' });

      const student = await findStudent(mongoUser);
      const meta    = student?.metadata || {};

      let quizScores = [], studySessions = [], subjectPerf = [], perfTrend = [];
      try {
        if (student) {
          [quizScores, studySessions] = await Promise.all([
            QuizScore.findAll({ where:{ studentId: student.id }, order:[['date','DESC']] }),
            StudySession.findAll({ where:{ userId: req.user.id }, order:[['date','DESC']] }).catch(()=>[]),
          ]);
          [subjectPerf, perfTrend] = await Promise.all([
            getSubjectPerf(student.id),
            getPerfTrend(student.id),
          ]);
        }
      } catch (e) { console.warn('analytics (non-fatal):', e.message); }

      const gpa      = calcGPA(quizScores);
      const avgScore = calcAvgScore(quizScores);
      const totalH   = studySessions.reduce((s,ss)=>s+parseFloat(ss.hoursStudied||0),0);

      return res.json({
        success: true,
        data: {
          personalInfo: {
            name:             mongoUser.name,
            email:            mongoUser.email,
            studentNumber:    student?.studentNumber || mongoUser.studentId || '',
            phone:            meta.phone            || '',
            dateOfBirth:      meta.dateOfBirth      || '',
            gender:           meta.gender           || '',
            nationality:      meta.nationality      || '',
            nic:              meta.nic              || '',
            address:          meta.address          || '',
            emergencyContact: meta.emergencyContact || '',
            bloodGroup:       meta.bloodGroup       || '',
            avatarUrl:        meta.avatarUrl || mongoUser.profilePicture || '',
          },
          academicInfo: {
            program:            meta.program            || '',
            batch:              meta.batch              || '',
            semester:           meta.semester           || 1,
            academicYear:       meta.year               || '',
            branch:             meta.branch             || '',
            supervisor:         meta.supervisor         || '',
            enrolledDate:       meta.enrolledDate       || '',
            expectedGraduation: meta.expectedGraduation || '',
            currentGPA:         gpa,
            averageScore:       avgScore,
            totalAssessments:   quizScores.length,
            totalCredits:       meta.totalCredits     || 0,
            completedCredits:   meta.completedCredits || 0,
            academicStanding:   gpa >= 2.0 ? 'Good Standing' : gpa > 0 ? 'At Risk' : 'No Data',
          },
          performance: {
            overallAverage:     avgScore,
            currentGPA:         gpa,
            totalAssessments:   quizScores.length,
            subjectPerformance: subjectPerf,
            performanceTrend:   perfTrend,
            gradeDistribution:  gradeDistribution(quizScores),
            highestScore:       quizScores.length ? Math.max(...quizScores.map(q=>parseFloat(q.score||0))) : 0,
            lowestScore:        quizScores.length ? Math.min(...quizScores.map(q=>parseFloat(q.score||0))) : 0,
          },
          studyHabits: {
            dailyAverage:  studySessions.length ? parseFloat((totalH/studySessions.length).toFixed(1)) : 0,
            weeklyTotal:   weeklyTotal(studySessions),
            consistency:   calcConsistency(studySessions),
            preferredTime: meta.preferredTime || '',
          },
          enrolledSubjects: subjectPerf.map(s => ({
            code: s.subject.split(' - ')[0] || s.subject,
            name: s.subject.split(' - ').slice(1).join(' - ') || s.subject,
            credits: 3, // default
            schedule: '',
            room: ''
          })),
          attendance:       meta.attendance       || { overall:0, bySubject:[] },
          recentActivities: [],
          achievements:     [],
        },
      });
    } catch (err) {
      console.error('getProfile:', err);
      return res.status(500).json({ success:false, message:'Failed to load profile' });
    }
  }

  // ── PUT /api/profile ────────────────────────────────────────────────────────
  async updateProfile(req, res) {
    try {
      const {
        name, email,
        phone, dateOfBirth, gender, nationality, nic, bloodGroup, address, emergencyContact,
        program, batch, semester, academicYear, branch, supervisor,
        enrolledDate, expectedGraduation, totalCredits, completedCredits,
      } = req.body;

      const mongoFields = {};
      if (name  !== undefined) mongoFields.name  = name;
      if (email !== undefined) mongoFields.email = email;
      if (Object.keys(mongoFields).length) {
        await User.findByIdAndUpdate(req.user.id, mongoFields);
      }

      try {
        const mongoUser = await User.findById(req.user.id).select('email studentId');
        const student   = await findStudent(mongoUser);
        if (student) {
          const pgFields = {};
          if (name  !== undefined) pgFields.name  = name;
          if (email !== undefined) pgFields.email = email;

          const extras = {
            phone, dateOfBirth, gender, nationality, nic, bloodGroup,
            address, emergencyContact, program, batch, semester,
            year: academicYear, branch, supervisor,
            enrolledDate, expectedGraduation, totalCredits, completedCredits,
          };
          const metaMerge = {};
          for (const [k,v] of Object.entries(extras)) {
            if (v !== undefined) metaMerge[k] = v;
          }
          pgFields.metadata = { ...student.metadata, ...metaMerge };
          await Student.update(pgFields, { where: { id: student.id } });
        }
      } catch (pgErr) {
        console.warn('PG update (non-fatal):', pgErr.message);
      }

      return res.json({ success:true, message:'Profile updated successfully' });
    } catch (err) {
      console.error('updateProfile:', err);
      return res.status(500).json({ success:false, message:'Failed to update profile' });
    }
  }

  // ── POST /api/profile/avatar ────────────────────────────────────────────────
  async updateAvatar(req, res) {
    try {
      if (!req.file) return res.status(400).json({ success:false, message:'No file uploaded' });

      const avatarPath = `/uploads/avatars/${req.file.filename}`;
      const mongoUser = await User.findById(req.user.id).select('profilePicture studentId email');

      // Prefer Student metadata, fallback to Mongo user profilePicture
      let updated = false;
      try {
        const student = await findStudent(mongoUser);
        if (student) {
          const oldAvatar = student.metadata?.avatarUrl;
          if (oldAvatar) {
            const cleanPath = oldAvatar.replace(/^\/+/, '');
            const old = path.join(__dirname, '..', cleanPath);
            if (fs.existsSync(old)) fs.unlinkSync(old);
          }
          await Student.update({ metadata: { ...student.metadata, avatarUrl: avatarPath } }, { where: { id: student.id } });
          updated = true;
        }
      } catch (err) {
        console.warn('student avatar update failed (non-fatal):', err.message);
      }

      if (!updated && mongoUser) {
        const oldAvatar = mongoUser.profilePicture;
        if (oldAvatar) {
          const cleanPath = oldAvatar.replace(/^\/+/, '');
          const old = path.join(__dirname, '..', cleanPath);
          if (fs.existsSync(old)) fs.unlinkSync(old);
        }
        await User.findByIdAndUpdate(req.user.id, { profilePicture: avatarPath });
        updated = true;
      }

      if (!updated) {
        return res.status(404).json({ success:false, message:'User profile record not found' });
      }

      return res.json({ success:true, data:{ avatarUrl: avatarPath }, message:'Avatar updated' });
    } catch (err) {
      console.error('updateAvatar:', err);
      return res.status(500).json({ success:false, message:'Failed to update avatar' });
    }
  }

  // ── POST /api/profile/change-password ──────────────────────────────────────
  async changePassword(req, res) {
    try {
      const { currentPassword, newPassword } = req.body;
      if (!currentPassword || !newPassword)
        return res.status(400).json({ success:false, message:'Both passwords required' });
      const user  = await User.findById(req.user.id);
      const valid = await user.comparePassword(currentPassword);
      if (!valid) return res.status(401).json({ success:false, message:'Current password incorrect' });
      user.password = newPassword;
      await user.save();
      return res.json({ success:true, message:'Password updated' });
    } catch (err) {
      console.error('changePassword:', err);
      return res.status(500).json({ success:false, message:'Failed to change password' });
    }
  }

  // ── GET /api/profile/activity ────────────────────────────────────────────────
  async getRecentActivity(req, res) {
    try {
      const mongoUser = await User.findById(req.user.id).select('studentId email');
      const student   = await findStudent(mongoUser);
      if (!student) return res.json({ success:true, data:[] });
      const [quizzes, sessions] = await Promise.all([
        QuizScore.findAll({ where:{ studentId: student.id }, order:[['date','DESC']], limit:10 }),
        StudySession.findAll({ where:{ userId: req.user.id }, order:[['date','DESC']], limit:10 }).catch(()=>[]),
      ]);
      const activities = [
        ...quizzes.map(q=>({ id:`q${q.id}`, type:'quiz', action:`Completed ${q.subject}`, score:parseFloat(q.score), date:q.date })),
        ...sessions.map(s=>({ id:`s${s.id}`, type:'study', action:`Studied ${s.subject||'session'}`, hours:parseFloat(s.hoursStudied||0), date:s.date })),
      ].sort((a,b)=>new Date(b.date)-new Date(a.date)).slice(0,15);
      return res.json({ success:true, data:activities });
    } catch (err) {
      return res.json({ success:true, data:[] });
    }
  }

  // ── GET /api/profile/achievements ───────────────────────────────────────────
  async getAchievements(req, res) {
    try {
      const mongoUser = await User.findById(req.user.id).select('studentId email createdAt');
      const student   = await findStudent(mongoUser);
      const ach = [{ id:1, name:'Profile Created', icon:'✅', date: mongoUser.createdAt?.toISOString().split('T')[0]||'', color:'#059669' }];
      if (student) {
        const scores = await QuizScore.findAll({ where:{ studentId: student.id } });
        if (scores.length>=1)  ach.push({ id:2, name:'First Upload',    icon:'📁', date:'', color:'#2563eb' });
        if (scores.length>=10) ach.push({ id:3, name:'Quiz Veteran',    icon:'🎯', date:'', color:'#7c3aed' });
        const avg = scores.length ? scores.reduce((s,q)=>s+parseFloat(q.score||0),0)/scores.length : 0;
        if (avg>=80) ach.push({ id:4, name:'High Achiever',    icon:'🏆', date:'', color:'#d97706' });
        if (avg>=90) ach.push({ id:5, name:'Excellence Award', icon:'⭐', date:'', color:'#dc2626' });
      }
      return res.json({ success:true, data:ach });
    } catch { return res.json({ success:true, data:[] }); }
  }

  // ── GET /api/profile/study-stats ─────────────────────────────────────────────
  async getStudyStats(req, res) {
    try {
      const sessions = await StudySession.findAll({ where:{ userId:req.user.id }, order:[['date','DESC']] }).catch(()=>[]);
      const total = sessions.reduce((s,ss)=>s+parseFloat(ss.hoursStudied||0),0);
      return res.json({ success:true, data:{
        dailyAverage: sessions.length ? parseFloat((total/sessions.length).toFixed(1)) : 0,
        weeklyTotal:  weeklyTotal(sessions),
        consistency:  calcConsistency(sessions),
      }});
    } catch (err) {
      return res.status(500).json({ success:false, message:'Failed to load study stats' });
    }
  }

  // ── PUT /api/profile/notifications ──────────────────────────────────────────
  async updateNotificationSettings(req, res) {
    try {
      const u = await User.findById(req.user.id).select('studentId email');
      const s = await findStudent(u);
      if (s) await Student.update({ metadata:{ ...s.metadata, notificationSettings:req.body } }, { where:{ id:s.id } });
      return res.json({ success:true, message:'Settings saved' });
    } catch { return res.status(500).json({ success:false, message:'Failed' }); }
  }

  // ── PUT /api/profile/privacy ─────────────────────────────────────────────────
  async updatePrivacySettings(req, res) {
    try {
      const u = await User.findById(req.user.id).select('studentId email');
      const s = await findStudent(u);
      if (s) await Student.update({ metadata:{ ...s.metadata, privacySettings:req.body } }, { where:{ id:s.id } });
      return res.json({ success:true, message:'Settings saved' });
    } catch { return res.status(500).json({ success:false, message:'Failed' }); }
  }

  // ── POST/DELETE /api/profile/link/:provider ──────────────────────────────────
  async linkSocialAccount(req, res) {
    try {
      const { provider } = req.params;
      const u = await User.findById(req.user.id).select('studentId email');
      const s = await findStudent(u);
      if (s) {
        const linked = s.metadata?.linkedAccounts || {};
        linked[provider] = { connected:true, connectedAt:new Date().toISOString(), ...req.body };
        await Student.update({ metadata:{ ...s.metadata, linkedAccounts:linked } }, { where:{ id:s.id } });
      }
      return res.json({ success:true, message:`${provider} linked` });
    } catch { return res.status(500).json({ success:false, message:'Failed' }); }
  }

  async unlinkSocialAccount(req, res) {
    try {
      const { provider } = req.params;
      const u = await User.findById(req.user.id).select('studentId email');
      const s = await findStudent(u);
      if (s) {
        const linked = s.metadata?.linkedAccounts || {};
        delete linked[provider];
        await Student.update({ metadata:{ ...s.metadata, linkedAccounts:linked } }, { where:{ id:s.id } });
      }
      return res.json({ success:true, message:`${provider} unlinked` });
    } catch { return res.status(500).json({ success:false, message:'Failed' }); }
  }

  // ── GET /api/profile/export ──────────────────────────────────────────────────
  async exportProfile(req, res) {
    try {
      const mongoUser = await User.findById(req.user.id).select('-password');
      const student   = await findStudent(mongoUser);
      const data = { exportedAt:new Date().toISOString(), name:mongoUser.name, email:mongoUser.email, studentNumber:student?.studentNumber||'', metadata:student?.metadata||{} };
      res.setHeader('Content-Type','application/json');
      res.setHeader('Content-Disposition',`attachment; filename="profile_${Date.now()}.json"`);
      return res.send(JSON.stringify(data, null, 2));
    } catch { return res.status(500).json({ success:false, message:'Export failed' }); }
  }

  // ── DELETE /api/profile/account ──────────────────────────────────────────────
  async deleteAccount(req, res) {
    try {
      const { password } = req.body;
      const user  = await User.findById(req.user.id);
      const valid = await user.comparePassword(password);
      if (!valid) return res.status(401).json({ success:false, message:'Incorrect password' });
      await User.findByIdAndUpdate(req.user.id, { active:false, deletedAt:new Date() });
      return res.json({ success:true, message:'Account deleted' });
    } catch { return res.status(500).json({ success:false, message:'Failed' }); }
  }
}

module.exports = new ProfileController();