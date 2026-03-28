const AnalyticsService = require('../services/analytics.service');
const { QuizScore, Student } = require('../models');

// helper to verify pg connection is alive (copied from upload.controller)
async function isPostgresUp() {
  try {
    const { sequelize } = require('../../config/database');
    await sequelize.authenticate();
    return true;
  } catch (e) {
    console.warn('PostgreSQL not available for analytics:', e.message);
    return false;
  }
}

class AnalyticsController {
  /**
   * Get student performance dashboard
   */
  async getStudentDashboard(req, res) {
    try {
      const { studentId } = req.params;
      
      // if PG is down, return empty dashboard rather than error
      if (!(await isPostgresUp())) {
        return res.json({
          success: true,
          data: {
            student: null,
            overall: null,
            subjects: [],
            recentActivity: []
          }
        });
      }
      
      const student = await Student.findByPk(studentId);
      if (!student) {
        return res.status(404).json({
          success: false,
          error: { code: 'STUDENT_NOT_FOUND', message: 'Student not found' }
        });
      }

      // Get overall analytics
      const overallAnalytics = await AnalyticsService.calculatePerformanceAnalytics(studentId);
      
      // Get subject-wise analytics
      const subjects = await QuizScore.findAll({
        where: { studentId },
        attributes: ['subject'],
        group: ['subject']
      });

      const subjectAnalytics = [];
      for (const { subject } of subjects) {
        const analytics = await AnalyticsService.calculatePerformanceAnalytics(studentId, subject);
        if (analytics) {
          subjectAnalytics.push(analytics);
        }
      }

      // Get trend data
      const recentScores = await QuizScore.findAll({
        where: { studentId },
        order: [['date', 'DESC']],
        limit: 10
      });

      return res.json({
        success: true,
        data: {
          student: {
            id: student.id,
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
      
      const whereClause = {};
      if (program) whereClause.program = program;
      if (year) whereClause.year = year;
      if (semester) whereClause.semester = semester;

      const students = await Student.findAll({ where: whereClause });
      
      if (students.length === 0) {
        return res.json({
          success: true,
          data: {
            totalStudents: 0,
            message: 'No students found'
          }
        });
      }

      const studentIds = students.map(s => s.id);
      
      const allScores = await QuizScore.findAll({
        where: { studentId: studentIds }
      });

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

      const students = await Student.findAll({ where: studentWhere });

      const scoreWhere = {};
      if (subject) scoreWhere.subject = subject;
      if (students.length > 0) {
        scoreWhere.studentId = students.map(s => s.id);
      }
      const allScores = await QuizScore.findAll({ where: scoreWhere });

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
      const subjects = [...new Set(allScores.map(s => s.subject))];
      const subjectPerformance = subjects.map(subject => {
        const scores = allScores.filter(s => s.subject === subject).map(s => parseFloat(s.score));
        const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
        return {
          subject,
          average: parseFloat(avg.toFixed(1)),
          passRate: (scores.filter(s => s >= 50).length / scores.length) * 100,
          totalStudents: new Set(allScores.filter(s => s.subject === subject).map(s => s.studentId)).size,
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
      const branchPerformance = branches.map(branch => {
        const branchStudents = students.filter(s => s.branch === branch);
        const branchScores = allScores.filter(s => branchStudents.some(bs => bs.id === s.studentId)).map(s => parseFloat(s.score));
        const avg = branchScores.length ? branchScores.reduce((a, b) => a + b, 0) / branchScores.length : 0;
        return {
          branch,
          average: parseFloat(avg.toFixed(1)),
          passRate: branchScores.length ? (branchScores.filter(s => s >= 50).length / branchScores.length) * 100 : 0,
          totalStudents: branchStudents.length
        };
      });

      // Student list
      const studentList = students.map(student => {
        const studentScores = allScores.filter(s => s.studentId === student.id);
        const avg = studentScores.length ? studentScores.reduce((a, b) => a + parseFloat(b.score), 0) / studentScores.length : 0;
        return {
          id: student.id,
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
            activeStudents: students.length, // assuming all are active
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
}

module.exports = new AnalyticsController();