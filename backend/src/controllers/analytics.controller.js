const AnalyticsService = require('../services/analytics.service');
const { QuizScore, Student } = require('../models');
const XLSX = require('xlsx');

class AnalyticsController {
  /**
   * Get student performance dashboard
   */
  async getStudentDashboard(req, res) {
    try {
      const { studentId } = req.params;

      const student = await Student.findById(studentId).catch(() => null)
        || await Student.findOne({ studentNumber: studentId }).catch(() => null);

      if (!student) {
        return res.status(404).json({
          success: false,
          error: { code: 'STUDENT_NOT_FOUND', message: 'Student not found' }
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
        if (analytics) {
          subjectAnalytics.push(analytics);
        }
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
            program: student.program
          },
          overall: overallAnalytics,
          subjects: subjectAnalytics,
          recentActivity: recentScores.map(s => ({
            subject: s.subject,
            score: s.score,
            type: s.type,
            date: s.date
          }))
        }
      });

    } catch (error) {
      console.error('Dashboard error:', error);
      return res.status(500).json({
        success: false,
        error: { code: 'DASHBOARD_ERROR', message: error.message }
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
          error: { code: 'NO_DATA', message: 'No data found for this subject' }
        });
      }

      return res.json({
        success: true,
        data: analytics
      });

    } catch (error) {
      return res.status(500).json({
        success: false,
        error: { code: 'ANALYTICS_ERROR', message: error.message }
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
          data: {
            totalStudents: 0,
            message: 'No students found'
          }
        });
      }

      const studentIds = students.map(s => s._id.toString());

      const allScores = await QuizScore.find({ studentId: { $in: studentIds } });

      // Calculate class statistics
      const scoresBySubject = {};
      allScores.forEach(score => {
        if (!scoresBySubject[score.subject]) {
          scoresBySubject[score.subject] = [];
        }
        scoresBySubject[score.subject].push(parseFloat(score.score));
      });

      const subjectAverages = {};
      Object.keys(scoresBySubject).forEach(subject => {
        const scores = scoresBySubject[subject];
        subjectAverages[subject] = {
          average: scores.reduce((a, b) => a + b, 0) / scores.length,
          count: scores.length,
          max: Math.max(...scores),
          min: Math.min(...scores)
        };
      });

      return res.json({
        success: true,
        data: {
          totalStudents: students.length,
          totalAssessments: allScores.length,
          subjectAverages,
          filters: { program, year, semester }
        }
      });

    } catch (error) {
      return res.status(500).json({
        success: false,
        error: { code: 'SUMMARY_ERROR', message: error.message }
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

      // Performance trend (mock for now, can be improved)
      const performanceTrend = [];
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      for (let i = 0; i < 12; i++) {
        const monthScores = allScores.filter(s => new Date(s.date).getMonth() === i);
        const avg = monthScores.length ? monthScores.reduce((a, b) => a + parseFloat(b.score), 0) / monthScores.length : 0;
        performanceTrend.push({
          month: months[i],
          average: parseFloat(avg.toFixed(1)),
          target: 75,
          students: students.length
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
            'A': scores.filter(s => s >= 80).length,
            'B': scores.filter(s => s >= 65 && s < 80).length,
            'C': scores.filter(s => s >= 50 && s < 65).length,
            'D': scores.filter(s => s >= 40 && s < 50).length,
            'F': scores.filter(s => s < 40).length
          }
        };
      });

      // Branch performance
      const branches = [...new Set(students.map(s => s.branch))];
      const branchPerformance = branches.map(br => {
        const branchStudents = students.filter(s => s.branch === br);
        const branchScores = allScores.filter(s => branchStudents.some(bs => bs._id.toString() === s.studentId)).map(s => parseFloat(s.score));
        const avg = branchScores.length ? branchScores.reduce((a, b) => a + b, 0) / branchScores.length : 0;
        return {
          branch: br,
          average: parseFloat(avg.toFixed(1)),
          passRate: branchScores.length ? (branchScores.filter(s => s >= 50).length / branchScores.length) * 100 : 0,
          totalStudents: branchStudents.length
        };
      });

      // Student list
      const studentList = students.map(student => {
        const sid = student._id.toString();
        const studentScores = allScores.filter(s => s.studentId === sid);
        const avg = studentScores.length ? studentScores.reduce((a, b) => a + parseFloat(b.score), 0) / studentScores.length : 0;
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
          trend: avg > 75 ? 'improving' : avg > 50 ? 'stable' : 'declining'
        };
      });

      // Grade distribution
      const allScoresValues = allScores.map(s => parseFloat(s.score));
      const gradeDistribution = [
        { name: 'A (90-100)', value: allScoresValues.filter(s => s >= 90).length, color: '#52c41a' },
        { name: 'B (80-89)', value: allScoresValues.filter(s => s >= 80 && s < 90).length, color: '#1890ff' },
        { name: 'C (70-79)', value: allScoresValues.filter(s => s >= 70 && s < 80).length, color: '#faad14' },
        { name: 'D (60-69)', value: allScoresValues.filter(s => s >= 60 && s < 70).length, color: '#fa8c16' },
        { name: 'F (0-59)', value: allScoresValues.filter(s => s < 60).length, color: '#f5222d' }
      ];

      const totalAvg = allScoresValues.length ? allScoresValues.reduce((a, b) => a + b, 0) / allScoresValues.length : 0;
      const passRate = allScoresValues.length ? (allScoresValues.filter(s => s >= 50).length / allScoresValues.length) * 100 : 0;

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
            bottomScore: allScoresValues.length ? Math.min(...allScoresValues) : 0
          },
          performanceTrend,
          subjectPerformance,
          branchPerformance,
          studentList,
          gradeDistribution
        }
      });

    } catch (error) {
      return res.status(500).json({
        success: false,
        error: { code: 'OVERVIEW_ERROR', message: error.message }
      });
    }
  }

  /**
   * Export analytics report as Excel
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
      const totalAssessments = allScores.length;
      const averageScore = allScoreValues.length ? (allScoreValues.reduce((a, b) => a + b, 0) / allScoreValues.length).toFixed(1) : 'N/A';
      const passRate = allScoreValues.length ? ((allScoreValues.filter(s => s >= 50).length / allScoreValues.length) * 100).toFixed(1) : 'N/A';

      const subjectList = [...new Set(allScores.map(s => s.subject))];
      const subjectAnalytics = subjectList.map(sub => {
        const scores = allScores.filter(s => s.subject === sub).map(s => parseFloat(s.score));
        const avg = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
        return {
          subject: sub,
          average: parseFloat(avg.toFixed(1)),
          passRate: scores.length ? ((scores.filter(s => s >= 50).length / scores.length) * 100).toFixed(1) : '0.0',
          top: scores.length ? Math.max(...scores) : 0,
          bottom: scores.length ? Math.min(...scores) : 0,
          a: scores.filter(s => s >= 80).length,
          b: scores.filter(s => s >= 65 && s < 80).length,
          c: scores.filter(s => s >= 50 && s < 65).length,
          d: scores.filter(s => s >= 40 && s < 50).length,
          f: scores.filter(s => s < 40).length,
          count: scores.length
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
        ['Total Assessments', totalAssessments],
        ['Average Score', averageScore],
        ['Pass Rate (%)', passRate],
        ['Top Score', allScoreValues.length ? Math.max(...allScoreValues) : 'N/A'],
        ['Bottom Score', allScoreValues.length ? Math.min(...allScoreValues) : 'N/A'],
        ['Best Subject', topSubject ? `${topSubject.subject} (${topSubject.average})` : 'N/A'],
        ['Weakest Subject', bottomSubject ? `${bottomSubject.subject} (${bottomSubject.average})` : 'N/A'],
        ['Suggested Focus', bottomSubject ? `Improve ${bottomSubject.subject} with targeted practice` : 'N/A']
      ];

      const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, wsSummary, 'Overview');

      const studentHeaders = ['Student ID', 'Name', 'Student Number', 'Program', 'Year', 'Semester', 'Branch', 'Avg Score', 'Assessments', 'Trend'];
      const studentRows = students.map(student => {
        const sid = student._id.toString();
        const studentScores = allScores.filter(s => s.studentId === sid).map(s => parseFloat(s.score));
        const average = studentScores.length ? (studentScores.reduce((a,b) => a+b,0)/studentScores.length).toFixed(1) : 'N/A';
        const trend = studentScores.length ? (average >= 75 ? 'Improving' : average >= 50 ? 'Stable' : 'Declining') : 'N/A';
        return [
          student._id,
          student.name,
          student.studentNumber,
          student.program,
          student.year,
          student.semester,
          student.branch,
          average,
          studentScores.length,
          trend
        ];
      });
      const wsStudents = XLSX.utils.aoa_to_sheet([studentHeaders, ...studentRows]);
      XLSX.utils.book_append_sheet(wb, wsStudents, 'Student Performance');

      const subjectHeaders = ['Rank', 'Subject', 'Average', 'Pass Rate (%)', 'Students', 'Top', 'Bottom', 'A', 'B', 'C', 'D', 'F'];
      const subjectRows = sortedSubjects.map((s, idx) => [
        idx + 1,
        s.subject,
        s.average,
        s.passRate,
        s.count,
        s.top,
        s.bottom,
        s.a,
        s.b,
        s.c,
        s.d,
        s.f
      ]);
      const wsSubjectPerf = XLSX.utils.aoa_to_sheet([subjectHeaders, ...subjectRows]);
      XLSX.utils.book_append_sheet(wb, wsSubjectPerf, 'Subject Analysis');

      const branchHeaders = ['Branch', 'Avg Score', 'Pass Rate (%)', 'Students'];
      const branchValues = [...new Set(students.map(s => s.branch))];
      const branchRows = branchValues.map(br => {
        const branchStudentIds = students.filter(s => s.branch === br).map(s => s._id.toString());
        const branchScores = allScores.filter(s => branchStudentIds.includes(s.studentId)).map(s => parseFloat(s.score));
        const avg = branchScores.length ? (branchScores.reduce((a,b) => a+b,0)/branchScores.length).toFixed(1) : 'N/A';
        const pass = branchScores.length ? ((branchScores.filter(x => x >= 50).length / branchScores.length) * 100).toFixed(1) : 'N/A';
        return [br, avg, pass, branchStudentIds.length];
      });
      const wsBranch = XLSX.utils.aoa_to_sheet([branchHeaders, ...branchRows]);
      XLSX.utils.book_append_sheet(wb, wsBranch, 'Branch Analysis');

      const individualHeaders = ['Date', 'Student', 'Student Number', 'Subject', 'Score', 'Grade', 'Status'];
      const individualRows = allScores.map(row => {
        const student = students.find(s => s._id.toString() === row.studentId);
        const score = parseFloat(row.score);
        let grade = 'F';
        if (score >= 90) grade = 'A';
        else if (score >= 80) grade = 'B';
        else if (score >= 70) grade = 'C';
        else if (score >= 60) grade = 'D';
        const status = score >= 50 ? 'Pass' : 'Fail';
        return [
          row.date ? new Date(row.date).toLocaleString() : 'N/A',
          student ? student.name : 'Unknown',
          student ? student.studentNumber : 'N/A',
          row.subject,
          score,
          grade,
          status
        ];
      });
      const wsIndividual = XLSX.utils.aoa_to_sheet([individualHeaders, ...individualRows]);
      XLSX.utils.book_append_sheet(wb, wsIndividual, 'Individual Scores');

      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
      const filename = `analytics_report_${reportDate.toISOString().split('T')[0]}.xlsx`;
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(buffer);

    } catch (error) {
      console.error('Export error:', error);
      return res.status(500).json({
        success: false,
        error: { code: 'EXPORT_ERROR', message: 'Failed to generate analytics report' }
      });
    }
  }
}

module.exports = new AnalyticsController();
