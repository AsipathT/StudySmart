const AnalyticsService = require('../services/analytics.service');
const { QuizScore, Student, StudySession } = require('../models');
const XLSX = require('xlsx');

// csv-writer is required at the top level so missing package errors are caught at startup
let createObjectCsvStringifier;
try {
  ({ createObjectCsvStringifier } = require('csv-writer'));
} catch (e) {
  console.warn('⚠️  csv-writer not installed. Run: npm install csv-writer');
  // Fallback: simple CSV builder
  createObjectCsvStringifier = ({ header }) => ({
    getHeaderString: () => header.map(h => `"${h.title}"`).join(',') + '\n',
    stringifyRecords: (records) =>
      records.map(r =>
        header.map(h => {
          const val = r[h.id] ?? '';
          return `"${String(val).replace(/"/g, '""')}"`;
        }).join(',')
      ).join('\n') + '\n',
  });
}

class AnalyticsController {
  /**
   * Get student performance dashboard
   */
  async getStudentDashboard(req, res) {
    try {
      const { studentId } = req.params;

      const student =
        (await Student.findById(studentId).catch(() => null)) ||
        (await Student.findOne({ studentNumber: studentId }).catch(() => null));

      if (!student) {
        return res.status(404).json({
          success: false,
          error: { code: 'STUDENT_NOT_FOUND', message: 'Student not found' },
        });
      }

      const sid = student._id.toString();

      // Get overall analytics
      const overallAnalytics = await AnalyticsService.calculatePerformanceAnalytics(sid);

      // Get subject-wise analytics
      const distinctSubjects = await QuizScore.distinct('subject', { studentId: sid });

      const subjectAnalytics = [];
      for (const subject of distinctSubjects) {
        const analytics = await AnalyticsService.calculatePerformanceAnalytics(sid, subject);
        if (analytics) subjectAnalytics.push(analytics);
      }

      // Get trend data
      const recentScores = await QuizScore.find({ studentId: sid })
        .sort({ date: -1 })
        .limit(10);

      return res.json({
        success: true,
        data: {
          student: {
            id: student._id,
            name: student.name,
            studentNumber: student.studentNumber,
            program: student.program,
          },
          overall: overallAnalytics,
          subjects: subjectAnalytics,
          recentActivity: recentScores.map(s => ({
            subject: s.subject,
            score: s.score,
            type: s.type,
            date: s.date,
          })),
        },
      });
    } catch (error) {
      console.error('Dashboard error:', error);
      return res.status(500).json({
        success: false,
        error: { code: 'DASHBOARD_ERROR', message: error.message },
      });
    }
  }

  /**
   * Get subject analytics (for teachers/admins)
   */
  async getSubjectAnalytics(req, res) {
    try {
      const { subject } = req.params;
      const analytics = await AnalyticsService.calculateSubjectAnalytics(subject);

      if (!analytics) {
        return res.status(404).json({
          success: false,
          error: { code: 'NO_DATA', message: 'No data found for this subject' },
        });
      }

      return res.json({ success: true, data: analytics });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: { code: 'ANALYTICS_ERROR', message: error.message },
      });
    }
  }

  /**
   * Get class performance summary
   */
  async getClassSummary(req, res) {
    try {
      const { program, year, semester } = req.query;

      const studentWhere = {};
      if (program) studentWhere.program = program;
      if (year) studentWhere.year = year;
      if (semester) studentWhere.semester = semester;

      const students = await Student.find(studentWhere);

      if (students.length === 0) {
        return res.json({
          success: true,
          data: { totalStudents: 0, message: 'No students found' },
        });
      }

      const studentIds = students.map(s => s._id.toString());
      const allScores = await QuizScore.find({ studentId: { $in: studentIds } });

      // Calculate class statistics
      const scoresBySubject = {};
      allScores.forEach(score => {
        if (!scoresBySubject[score.subject]) scoresBySubject[score.subject] = [];
        scoresBySubject[score.subject].push(parseFloat(score.score));
      });

      const subjectAverages = {};
      Object.keys(scoresBySubject).forEach(subject => {
        const scores = scoresBySubject[subject];
        subjectAverages[subject] = {
          average: scores.reduce((a, b) => a + b, 0) / scores.length,
          count: scores.length,
          max: Math.max(...scores),
          min: Math.min(...scores),
        };
      });

      return res.json({
        success: true,
        data: {
          totalStudents: students.length,
          totalAssessments: allScores.length,
          subjectAverages,
          filters: { program, year, semester },
        },
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: { code: 'SUMMARY_ERROR', message: error.message },
      });
    }
  }

  /**
   * Get analytics overview
   */
  async getAnalyticsOverview(req, res) {
    try {
      const { program, year, semester, branch, subject } = req.query;
      const studentWhere = {};
      if (program) studentWhere.program = program;
      if (year) studentWhere.year = year;
      if (semester) studentWhere.semester = semester;
      if (branch) studentWhere.branch = branch;

      const students = await Student.find(studentWhere);

      const scoreWhere = {};
      if (subject) scoreWhere.subject = subject;
      if (students.length > 0) {
        scoreWhere.studentId = { $in: students.map(s => s._id.toString()) };
      }
      const allScores = await QuizScore.find(scoreWhere);

      // Performance trend
      const performanceTrend = [];
      const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      for (let i = 0; i < 12; i++) {
        const monthScores = allScores.filter(s => new Date(s.date).getMonth() === i);
        const avg = monthScores.length
          ? monthScores.reduce((a, b) => a + parseFloat(b.score), 0) / monthScores.length
          : 0;
        performanceTrend.push({
          month: months[i],
          average: parseFloat(avg.toFixed(1)),
          target: 75,
          students: students.length,
        });
      }

      // Subject performance
      const subjectSet = [...new Set(allScores.map(s => s.subject))];
      const subjectPerformance = subjectSet.map(subj => {
        const scores = allScores.filter(s => s.subject === subj).map(s => parseFloat(s.score));
        const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
        return {
          subject: subj,
          average: parseFloat(avg.toFixed(1)),
          passRate: (scores.filter(s => s >= 50).length / scores.length) * 100,
          totalStudents: new Set(allScores.filter(s => s.subject === subj).map(s => s.studentId)).size,
          topScore: Math.max(...scores),
          bottomScore: Math.min(...scores),
          distribution: {
            A: scores.filter(s => s >= 80).length,
            B: scores.filter(s => s >= 65 && s < 80).length,
            C: scores.filter(s => s >= 50 && s < 65).length,
            D: scores.filter(s => s >= 40 && s < 50).length,
            F: scores.filter(s => s < 40).length,
          },
        };
      });

      // Branch performance
      const branches = [...new Set(students.map(s => s.branch))];
      const branchPerformance = branches.map(br => {
        const branchStudents = students.filter(s => s.branch === br);
        const branchScores = allScores
          .filter(s => branchStudents.some(bs => bs._id.toString() === s.studentId))
          .map(s => parseFloat(s.score));
        const avg = branchScores.length
          ? branchScores.reduce((a, b) => a + b, 0) / branchScores.length
          : 0;
        return {
          branch: br,
          average: parseFloat(avg.toFixed(1)),
          passRate: branchScores.length
            ? (branchScores.filter(s => s >= 50).length / branchScores.length) * 100
            : 0,
          totalStudents: branchStudents.length,
        };
      });

      // Student list
      const studentList = students.map(student => {
        const sid = student._id.toString();
        const studentScores = allScores.filter(s => s.studentId === sid);
        const avg = studentScores.length
          ? studentScores.reduce((a, b) => a + parseFloat(b.score), 0) / studentScores.length
          : 0;
        return {
          id: student._id,
          name: student.name,
          studentNumber: student.studentNumber,
          program: student.program,
          year: student.year,
          semester: student.semester,
          branch: student.branch,
          averageScore: parseFloat(avg.toFixed(1)),
          totalAssessments: studentScores.length,
          trend: avg > 75 ? 'improving' : avg > 50 ? 'stable' : 'declining',
        };
      });

      // Grade distribution
      const allScoresValues = allScores.map(s => parseFloat(s.score));
      const gradeDistribution = [
        { name: 'A (90-100)', value: allScoresValues.filter(s => s >= 90).length, color: '#52c41a' },
        { name: 'B (80-89)', value: allScoresValues.filter(s => s >= 80 && s < 90).length, color: '#1890ff' },
        { name: 'C (70-79)', value: allScoresValues.filter(s => s >= 70 && s < 80).length, color: '#faad14' },
        { name: 'D (60-69)', value: allScoresValues.filter(s => s >= 60 && s < 70).length, color: '#fa8c16' },
        { name: 'F (0-59)', value: allScoresValues.filter(s => s < 60).length, color: '#f5222d' },
      ];

      const totalAvg = allScoresValues.length
        ? allScoresValues.reduce((a, b) => a + b, 0) / allScoresValues.length
        : 0;
      const passRate = allScoresValues.length
        ? (allScoresValues.filter(s => s >= 50).length / allScoresValues.length) * 100
        : 0;

      return res.json({
        success: true,
        data: {
          summary: {
            totalStudents: students.length,
            activeStudents: students.length,
            totalAssessments: allScores.length,
            averageScore: parseFloat(totalAvg.toFixed(1)),
            passRate: parseFloat(passRate.toFixed(1)),
            topScore: allScoresValues.length ? Math.max(...allScoresValues) : 0,
            bottomScore: allScoresValues.length ? Math.min(...allScoresValues) : 0,
          },
          performanceTrend,
          subjectPerformance,
          branchPerformance,
          studentList,
          gradeDistribution,
        },
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: { code: 'OVERVIEW_ERROR', message: error.message },
      });
    }
  }

  /**
   * Export analytics report as Excel (teacher/admin)
   */
  async exportAnalyticsReport(req, res) {
    try {
      const { program, year, semester, branch, subject } = req.query;
      const studentWhere = {};
      if (program) studentWhere.program = program;
      if (year) studentWhere.year = year;
      if (semester) studentWhere.semester = semester;
      if (branch) studentWhere.branch = branch;

      const students = await Student.find(studentWhere);
      const scoreWhere = {};
      if (subject) scoreWhere.subject = subject;
      if (students.length > 0) {
        scoreWhere.studentId = { $in: students.map(s => s._id.toString()) };
      }
      const allScores = await QuizScore.find(scoreWhere);

      const wb = XLSX.utils.book_new();
      const reportDate = new Date();

      const allScoreValues = allScores.map(s => parseFloat(s.score));
      const averageScore = allScoreValues.length
        ? (allScoreValues.reduce((a, b) => a + b, 0) / allScoreValues.length).toFixed(1)
        : 'N/A';
      const passRate = allScoreValues.length
        ? ((allScoreValues.filter(s => s >= 50).length / allScoreValues.length) * 100).toFixed(1)
        : 'N/A';

      const subjectList = [...new Set(allScores.map(s => s.subject))];
      const subjectAnalytics = subjectList.map(sub => {
        const scores = allScores.filter(s => s.subject === sub).map(s => parseFloat(s.score));
        const avg = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
        return {
          subject: sub,
          average: parseFloat(avg.toFixed(1)),
          passRate: scores.length
            ? ((scores.filter(s => s >= 50).length / scores.length) * 100).toFixed(1)
            : '0.0',
          top: scores.length ? Math.max(...scores) : 0,
          bottom: scores.length ? Math.min(...scores) : 0,
          a: scores.filter(s => s >= 80).length,
          b: scores.filter(s => s >= 65 && s < 80).length,
          c: scores.filter(s => s >= 50 && s < 65).length,
          d: scores.filter(s => s >= 40 && s < 50).length,
          f: scores.filter(s => s < 40).length,
          count: scores.length,
        };
      });

      const sortedSubjects = subjectAnalytics.sort((a, b) => b.average - a.average);
      const topSubject = sortedSubjects[0] || null;
      const bottomSubject = sortedSubjects[sortedSubjects.length - 1] || null;

      const summaryData = [
        ['StudySmart Analytics Export'],
        ['Generated on', reportDate.toLocaleString()],
        ['Program', program || 'All'],
        ['Year', year || 'All'],
        ['Semester', semester || 'All'],
        ['Branch', branch || 'All'],
        ['Subject Filter', subject || 'All'],
        [''],
        ['Summary'],
        ['Total Students', students.length],
        ['Total Assessments', allScores.length],
        ['Average Score', averageScore],
        ['Pass Rate (%)', passRate],
        ['Top Score', allScoreValues.length ? Math.max(...allScoreValues) : 'N/A'],
        ['Bottom Score', allScoreValues.length ? Math.min(...allScoreValues) : 'N/A'],
        ['Best Subject', topSubject ? `${topSubject.subject} (${topSubject.average})` : 'N/A'],
        ['Weakest Subject', bottomSubject ? `${bottomSubject.subject} (${bottomSubject.average})` : 'N/A'],
        ['Suggested Focus', bottomSubject ? `Improve ${bottomSubject.subject} with targeted practice` : 'N/A'],
      ];

      const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, wsSummary, 'Overview');

      const studentHeaders = ['Student ID','Name','Student Number','Program','Year','Semester','Branch','Avg Score','Assessments','Trend'];
      const studentRows = students.map(student => {
        const sid = student._id.toString();
        const studentScores = allScores.filter(s => s.studentId === sid).map(s => parseFloat(s.score));
        const average = studentScores.length
          ? (studentScores.reduce((a, b) => a + b, 0) / studentScores.length).toFixed(1)
          : 'N/A';
        const trend = studentScores.length
          ? (average >= 75 ? 'Improving' : average >= 50 ? 'Stable' : 'Declining')
          : 'N/A';
        return [student._id, student.name, student.studentNumber, student.program, student.year, student.semester, student.branch, average, studentScores.length, trend];
      });

      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([studentHeaders, ...studentRows]), 'Student Performance');

      const subjectHeaders = ['Rank','Subject','Average','Pass Rate (%)','Students','Top','Bottom','A','B','C','D','F'];
      const subjectRows = sortedSubjects.map((s, idx) => [idx + 1, s.subject, s.average, s.passRate, s.count, s.top, s.bottom, s.a, s.b, s.c, s.d, s.f]);
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([subjectHeaders, ...subjectRows]), 'Subject Analysis');

      const branchHeaders = ['Branch','Avg Score','Pass Rate (%)','Students'];
      const branchValues = [...new Set(students.map(s => s.branch))];
      const branchRows = branchValues.map(br => {
        const branchStudentIds = students.filter(s => s.branch === br).map(s => s._id.toString());
        const branchScores = allScores.filter(s => branchStudentIds.includes(s.studentId)).map(s => parseFloat(s.score));
        const avg = branchScores.length ? (branchScores.reduce((a, b) => a + b, 0) / branchScores.length).toFixed(1) : 'N/A';
        const pass = branchScores.length ? ((branchScores.filter(x => x >= 50).length / branchScores.length) * 100).toFixed(1) : 'N/A';
        return [br, avg, pass, branchStudentIds.length];
      });
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([branchHeaders, ...branchRows]), 'Branch Analysis');

      const individualHeaders = ['Date','Student','Student Number','Subject','Score','Grade','Status'];
      const individualRows = allScores.map(row => {
        const student = students.find(s => s._id.toString() === row.studentId);
        const score = parseFloat(row.score);
        let grade = 'F';
        if (score >= 90) grade = 'A';
        else if (score >= 80) grade = 'B';
        else if (score >= 70) grade = 'C';
        else if (score >= 60) grade = 'D';
        return [
          row.date ? new Date(row.date).toLocaleString() : 'N/A',
          student ? student.name : 'Unknown',
          student ? student.studentNumber : 'N/A',
          row.subject,
          score,
          grade,
          score >= 50 ? 'Pass' : 'Fail',
        ];
      });
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([individualHeaders, ...individualRows]), 'Individual Scores');

      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
      const filename = `analytics_report_${reportDate.toISOString().split('T')[0]}.xlsx`;
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');
      res.send(buffer);
    } catch (error) {
      console.error('Export error:', error);
      return res.status(500).json({
        success: false,
        error: { code: 'EXPORT_ERROR', message: 'Failed to generate analytics report' },
      });
    }
  }

  /**
   * Get user analytics (authenticated user only)
   * NOTE: isPostgresUp was removed — this app uses MongoDB only.
   */
  async getUserAnalytics(req, res) {
    try {
      const userId = req.user?.id || req.user?._id?.toString();
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'User not authenticated' },
        });
      }

      // Get all quiz scores for this user from MongoDB
      const quizScores = await QuizScore.find({ studentId: userId })
        .sort({ date: -1 })
        .catch(() => []);

      if (!quizScores || quizScores.length === 0) {
        return res.json({
          success: true,
          data: {
            userId,
            overallAverage: 0,
            gpa: 0,
            subjects: [],
            recentActivity: [],
          },
        });
      }

      // Calculate overall statistics
      const allScores = quizScores.map(q => parseFloat(q.score || 0));
      const overallAvg = allScores.reduce((a, b) => a + b, 0) / allScores.length;
      const gpa = this.calculateGPA(allScores);

      // Group by subject
      const subjectMap = {};
      for (const score of quizScores) {
        if (!subjectMap[score.subject]) subjectMap[score.subject] = [];
        subjectMap[score.subject].push(parseFloat(score.score || 0));
      }

      const subjectAnalytics = Object.entries(subjectMap).map(([subject, scores]) => {
        const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
        return {
          subject,
          average: parseFloat(avg.toFixed(2)),
          count: scores.length,
          max: Math.max(...scores),
          min: Math.min(...scores),
          grade: this.getGradeForScore(avg),
          trend: scores.slice(-3),
        };
      }).sort((a, b) => b.average - a.average);

      return res.json({
        success: true,
        data: {
          userId,
          overallAverage: parseFloat(overallAvg.toFixed(2)),
          gpa: parseFloat(gpa.toFixed(2)),
          totalMarks: quizScores.length,
          subjects: subjectAnalytics,
          recentActivity: quizScores.slice(0, 10).map(s => ({
            subject: s.subject,
            score: s.score,
            type: s.type,
            date: s.date,
          })),
        },
      });
    } catch (error) {
      console.error('User analytics error:', error);
      return res.status(500).json({
        success: false,
        error: { code: 'ANALYTICS_ERROR', message: error.message },
      });
    }
  }

  // ── Helpers ──────────────────────────────────────────────────────────────────

  getGradeForScore(score) {
    if (score >= 90) return 'A+';
    if (score >= 80) return 'A';
    if (score >= 70) return 'B+';
    if (score >= 65) return 'B';
    if (score >= 60) return 'C+';
    if (score >= 55) return 'C';
    if (score >= 50) return 'D';
    return 'F';
  }

  calculateGPA(scores = []) {
    if (!scores.length) return 0;
    const avg = scores.reduce((s, q) => s + parseFloat(q || 0), 0) / scores.length;
    return parseFloat(Math.max(0, ((avg - 40) / 60) * 4.0).toFixed(2));
  }

  scoreToGPA(score) {
    return Math.max(0, Math.min(4.0, ((score - 40) / 60) * 4.0));
  }

  /**
   * Export CSV analytics report
   */
  async exportCsv(req, res) {
    try {
      const user = req.user;
      const targetStudentId = user.id || user._id;

      const targetStudent =
        (await Student.findOne({ userId: targetStudentId }).catch(() => null)) ||
        (await Student.findOne({ studentNumber: user.studentId }).catch(() => null));

      // Try multiple student ID lookups to find quiz scores
      const quizScores = await QuizScore.find({ studentId: targetStudentId })
        .sort({ date: 1 })
        .catch(() => []);

      if (!quizScores || quizScores.length === 0) {
        return res.status(404).json({
          success: false,
          error: { code: 'NO_DATA', message: 'No assessment data found for export' },
        });
      }

      // Calculate subject aggregates
      const subjectMap = {};
      quizScores.forEach(score => {
        const subject = score.subject || 'Unknown';
        if (!subjectMap[subject]) subjectMap[subject] = { scores: [], total: 0, count: 0 };
        const numScore = parseFloat(score.score || 0);
        subjectMap[subject].scores.push(numScore);
        subjectMap[subject].total += numScore;
        subjectMap[subject].count += 1;
      });

      const csvData = [];
      const studentName = targetStudent?.name || user.name || 'Unknown';
      const studentIdValue = targetStudent?.studentNumber || user.studentId || 'Unknown';

      // Subject summary rows
      Object.entries(subjectMap).forEach(([subject, data]) => {
        const average = data.total / data.count;
        const gpa = this.scoreToGPA(average);
        const trend = data.scores.length > 1
          ? (data.scores[data.scores.length - 1] > data.scores[0] ? 'Improving' : 'Declining')
          : 'Stable';

        csvData.push({
          'Student Name': studentName,
          'Student ID': studentIdValue,
          'Subject Code': subject.split(' - ')[0] || subject,
          'Subject Name': subject,
          'Assessment Type': 'Overall',
          'Score': average.toFixed(1),
          'Average': average.toFixed(1),
          'GPA': gpa.toFixed(2),
          'Trend': trend,
        });
      });

      // Individual score rows
      quizScores.forEach(score => {
        const subject = score.subject || 'Unknown';
        const subjectData = subjectMap[subject];
        const average = subjectData ? subjectData.total / subjectData.count : 0;
        const gpa = this.scoreToGPA(average);

        csvData.push({
          'Student Name': studentName,
          'Student ID': studentIdValue,
          'Subject Code': subject.split(' - ')[0] || subject,
          'Subject Name': subject,
          'Assessment Type': score.type || 'Quiz',
          'Score': parseFloat(score.score || 0).toFixed(1),
          'Average': average.toFixed(1),
          'GPA': gpa.toFixed(2),
          'Trend': 'N/A',
        });
      });

      const csvStringifier = createObjectCsvStringifier({
        header: [
          { id: 'Student Name',    title: 'Student Name' },
          { id: 'Student ID',      title: 'Student ID' },
          { id: 'Subject Code',    title: 'Subject Code' },
          { id: 'Subject Name',    title: 'Subject Name' },
          { id: 'Assessment Type', title: 'Assessment Type' },
          { id: 'Score',           title: 'Score' },
          { id: 'Average',         title: 'Average' },
          { id: 'GPA',             title: 'GPA' },
          { id: 'Trend',           title: 'Trend' },
        ],
      });

      const csvContent = csvStringifier.getHeaderString() + csvStringifier.stringifyRecords(csvData);
      const filename = `analytics_${studentName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');
      res.send(csvContent);
    } catch (error) {
      console.error('CSV Export error:', error);
      return res.status(500).json({
        success: false,
        error: { code: 'EXPORT_ERROR', message: 'Failed to generate CSV report' },
      });
    }
  }

  /**
   * Export PDF analytics report
   */
  async exportPdf(req, res) {
    try {
      const { studentId } = req.query;
      const user = req.user;

      let targetStudentId = user.id || user._id;
      let targetStudent = null;

      if (studentId && (user.role === 'admin' || user.role === 'teacher')) {
        targetStudent =
          (await Student.findById(studentId).catch(() => null)) ||
          (await Student.findOne({ studentNumber: studentId }).catch(() => null));

        if (!targetStudent) {
          return res.status(404).json({
            success: false,
            error: { code: 'STUDENT_NOT_FOUND', message: 'Target student not found' },
          });
        }
        targetStudentId = targetStudent._id.toString();
      } else {
        targetStudent =
          (await Student.findOne({ userId: targetStudentId }).catch(() => null)) ||
          (await Student.findOne({ studentNumber: user.studentId }).catch(() => null));
      }

      const quizScores = await QuizScore.find({ studentId: targetStudentId }).sort({ date: 1 });
      const studySessions = await StudySession.find({ userId: targetStudentId }).catch(() => []);

      if (!quizScores || quizScores.length === 0) {
        return res.status(404).json({
          success: false,
          error: { code: 'NO_DATA', message: 'No assessment data found for export' },
        });
      }

      // Calculate aggregates
      const subjectMap = {};
      quizScores.forEach(score => {
        const subject = score.subject || 'Unknown';
        if (!subjectMap[subject]) subjectMap[subject] = [];
        subjectMap[subject].push(parseFloat(score.score || 0));
      });

      const subjectPerformance = Object.entries(subjectMap).map(([subject, scores]) => {
        const average = scores.reduce((a, b) => a + b, 0) / scores.length;
        return {
          subject,
          average: parseFloat(average.toFixed(1)),
          gpa: this.scoreToGPA(average),
          status: average >= 50 ? 'Pass' : 'Fail',
          assessments: scores.length,
        };
      }).sort((a, b) => b.average - a.average);

      const overallAverage = quizScores.reduce((sum, s) => sum + parseFloat(s.score || 0), 0) / quizScores.length;
      const passRate = (quizScores.filter(s => parseFloat(s.score || 0) >= 50).length / quizScores.length) * 100;

      // Generate PDF
      let PDFDocument;
      try {
        PDFDocument = require('pdfkit');
      } catch (e) {
        return res.status(500).json({
          success: false,
          error: { code: 'MISSING_DEPENDENCY', message: 'pdfkit is not installed. Run: npm install pdfkit' },
        });
      }

      const doc = new PDFDocument({ margin: 50 });
      const chunks = [];
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(chunks);
        const filename = `analytics_${(targetStudent?.name || user.name || 'student').replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');
        res.send(pdfBuffer);
      });

      // ── PDF Content ────────────────────────────────────────────────────────
      doc.fontSize(20).text('StudySmart Analytics Report', { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text(`Generated on: ${new Date().toLocaleString()}`, { align: 'center' });
      doc.moveDown(2);

      doc.fontSize(14).text('Student Information', { underline: true });
      doc.moveDown();
      doc.fontSize(10)
        .text(`Name: ${targetStudent?.name || user.name || 'Unknown'}`)
        .text(`Student ID: ${targetStudent?.studentNumber || user.studentId || 'Unknown'}`)
        .text(`Email: ${user.email || 'N/A'}`);
      doc.moveDown();

      doc.fontSize(14).text('Overall Performance Summary', { underline: true });
      doc.moveDown();
      doc.fontSize(10)
        .text(`Total Assessments: ${quizScores.length}`)
        .text(`Average Score: ${overallAverage.toFixed(1)}%`)
        .text(`Pass Rate: ${passRate.toFixed(1)}%`)
        .text(`GPA: ${this.scoreToGPA(overallAverage).toFixed(2)}`);
      doc.moveDown();

      doc.fontSize(14).text('Subject Performance', { underline: true });
      doc.moveDown();

      const tableTop = doc.y;
      const colWidths = [200, 60, 60, 60, 60];
      const headers = ['Subject', 'Average', 'GPA', 'Status', 'Assessments'];

      doc.fontSize(10);
      headers.forEach((header, i) => {
        const x = 50 + colWidths.slice(0, i).reduce((a, b) => a + b, 0);
        doc.text(header, x, tableTop, { width: colWidths[i], align: 'left' });
      });

      doc.moveTo(50, doc.y + 5).lineTo(50 + colWidths.reduce((a, b) => a + b, 0), doc.y + 5).stroke();
      doc.y += 10;

      subjectPerformance.forEach(subject => {
        if (doc.y > 700) doc.addPage();
        const rowY = doc.y;
        [subject.subject, `${subject.average}%`, subject.gpa.toFixed(2), subject.status, subject.assessments.toString()]
          .forEach((value, i) => {
            const x = 50 + colWidths.slice(0, i).reduce((a, b) => a + b, 0);
            doc.text(value, x, rowY, { width: colWidths[i], align: 'left' });
          });
        doc.y += 15;
      });

      doc.moveDown();
      doc.fontSize(14).text('Detailed Assessment Scores', { underline: true });
      doc.moveDown();

      quizScores.forEach((score, index) => {
        if (doc.y > 700) doc.addPage();
        doc.fontSize(10)
          .text(`${index + 1}. ${score.subject} - ${parseFloat(score.score || 0).toFixed(1)}% (${new Date(score.date).toLocaleDateString()})`);
      });

      doc.moveDown();
      doc.fontSize(14).text('AI Insights & Recommendations', { underline: true });
      doc.moveDown();
      doc.fontSize(10);

      const topSubject = subjectPerformance[0];
      const bottomSubject = subjectPerformance[subjectPerformance.length - 1];

      if (topSubject) {
        doc.text(`Best performing subject: ${topSubject.subject} (${topSubject.average}%)`);
      }
      if (bottomSubject && bottomSubject !== topSubject) {
        doc.text(`Needs improvement: ${bottomSubject.subject} (${bottomSubject.average}%)`);
        doc.text('   Consider additional study sessions and practice assessments.');
      }
      doc.text(`Overall standing: ${overallAverage >= 75 ? 'Excellent' : overallAverage >= 50 ? 'Good' : 'Needs attention'}`);

      doc.fontSize(8).text('Generated by StudySmart Analytics System', 50, doc.page.height - 50, {
        align: 'center',
        width: doc.page.width - 100,
      });

      doc.end();
    } catch (error) {
      console.error('PDF Export error:', error);
      return res.status(500).json({
        success: false,
        error: { code: 'EXPORT_ERROR', message: 'Failed to generate PDF report' },
      });
    }
  }
}

module.exports = new AnalyticsController();