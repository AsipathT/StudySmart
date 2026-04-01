const { QuizScore, Student } = require('../models/postgres');
const { Op } = require('sequelize');

class AnalyticsService {
  /**
   * Calculate student performance analytics
   * @param {string} studentId - Student ID
   * @param {string} subject - Subject (optional)
   * @returns {Object} Performance analytics
   */
  async calculatePerformanceAnalytics(studentId, subject = null) {
    const whereClause = { studentId };
    if (subject) whereClause.subject = subject;
    
    const scores = await QuizScore.findAll({
      where: whereClause,
      order: [['date', 'ASC']]
    });
    
    if (scores.length === 0) {
      return null;
    }
    
    // Basic statistics
    const scoreValues = scores.map(s => parseFloat(s.score));
    const total = scoreValues.reduce((a, b) => a + b, 0);
    const average = total / scores.length;
    const max = Math.max(...scoreValues);
    const min = Math.min(...scoreValues);
    
    // Group by assessment type
    const byType = {};
    scores.forEach(score => {
      if (!byType[score.type]) byType[score.type] = [];
      byType[score.type].push(parseFloat(score.score));
    });
    
    const typeAverages = {};
    Object.keys(byType).forEach(type => {
      const typeScores = byType[type];
      typeAverages[type] = typeScores.reduce((a, b) => a + b, 0) / typeScores.length;
    });
    
    // Calculate trend
    let trend = 'stable';
    if (scores.length >= 3) {
      const firstHalf = scores.slice(0, Math.floor(scores.length / 2));
      const secondHalf = scores.slice(Math.floor(scores.length / 2));
      
      const firstAvg = firstHalf.reduce((a, b) => a + parseFloat(b.score), 0) / firstHalf.length;
      const secondAvg = secondHalf.reduce((a, b) => a + parseFloat(b.score), 0) / secondHalf.length;
      
      if (secondAvg > firstAvg + 5) trend = 'improving';
      else if (secondAvg < firstAvg - 5) trend = 'declining';
    }
    
    return {
      studentId,
      subject,
      statistics: {
        count: scores.length,
        average: Math.round(average * 100) / 100,
        max,
        min,
        median: this.calculateMedian(scoreValues),
        standardDeviation: this.calculateStandardDeviation(scoreValues)
      },
      byType: typeAverages,
      trend,
      recentScores: scores.slice(-5).map(s => ({
        score: s.score,
        type: s.type,
        date: s.date,
        subject: s.subject
      }))
    };
  }

  /**
   * Calculate subject performance across all students
   * @param {string} subject - Subject name
   * @returns {Object} Subject analytics
   */
  async calculateSubjectAnalytics(subject) {
    const scores = await QuizScore.findAll({
      where: { subject },
      include: [{ model: Student, attributes: ['id', 'studentNumber', 'program'] }]
    });
    
    if (scores.length === 0) {
      return null;
    }
    
    const scoreValues = scores.map(s => parseFloat(s.score));
    
    // Calculate grade distribution
    const distribution = {
      'A (90-100)': 0,
      'B (80-89)': 0,
      'C (70-79)': 0,
      'D (60-69)': 0,
      'F (0-59)': 0
    };
    
    scores.forEach(score => {
      const val = parseFloat(score.score);
      if (val >= 90) distribution['A (90-100)']++;
      else if (val >= 80) distribution['B (80-89)']++;
      else if (val >= 70) distribution['C (70-79)']++;
      else if (val >= 60) distribution['D (60-69)']++;
      else distribution['F (0-59)']++;
    });
    
    return {
      subject,
      totalStudents: scores.length,
      average: Math.round((scoreValues.reduce((a, b) => a + b, 0) / scores.length) * 100) / 100,
      distribution,
      passingRate: ((distribution['A (90-100)'] + distribution['B (80-89)'] + 
                     distribution['C (70-79)'] + distribution['D (60-69)']) / scores.length * 100).toFixed(2)
    };
  }

  /**
   * Calculate median of array
   * @param {Array} values - Numeric values
   * @returns {number} Median
   */
  calculateMedian(values) {
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    
    if (sorted.length % 2 === 0) {
      return (sorted[mid - 1] + sorted[mid]) / 2;
    }
    return sorted[mid];
  }

  /**
   * Calculate standard deviation
   * @param {Array} values - Numeric values
   * @returns {number} Standard deviation
   */
  calculateStandardDeviation(values) {
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const squareDiffs = values.map(value => Math.pow(value - avg, 2));
    const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / squareDiffs.length;
    return Math.sqrt(avgSquareDiff);
  }
}

module.exports = new AnalyticsService();
