const AnalyticsService = require('../services/analytics.service');
const { QuizScore, Student } = require('../models/postgres');

class AnalyticsController {
  /**
   * Get student performance dashboard
   */
  async getStudentDashboard(req, res) {
    try {
      const { studentId } = req.params;
      
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
}

module.exports = new AnalyticsController();