
const DEFAULT_TARGET_SCORE = 75;

class PredictionService {
  /**
   * Aggregate study sessions for a user and subject
   */
  static aggregateStudySessions(sessions) {
    const totalHours = sessions.reduce((sum, s) => sum + (s.hoursStudied || 0), 0);
    const sessionCount = sessions.length;
    const latestSessionDate = sessionCount > 0 ? new Date(Math.max(...sessions.map(s => new Date(s.date)))) : null;
    return { totalHours, sessionCount, latestSessionDate };
  }

  /**
   * Aggregate quiz scores for a user and subject
   */
  static aggregateQuizScores(quizzes) {
    const quizCount = quizzes.length;
    const quizAverage = quizCount > 0 ? quizzes.reduce((sum, q) => sum + (q.score || 0), 0) / quizCount : null;
    const latestQuizDate = quizCount > 0 ? new Date(Math.max(...quizzes.map(q => new Date(q.date)))) : null;
    return { quizAverage, quizCount, latestQuizDate };
  }

  /**
   * Validate minimum data requirements
   */
  static validateMinimumData(sessionCount, quizCount) {
    if (sessionCount < 3 || quizCount < 2) {
      return {
        success: false,
        error: {
          code: "INSUFFICIENT_DATA",
          message: "Minimum 3 sessions and 2 quizzes required."
        }
      };
    }
    return { success: true };
  }

  /**
   * Improved prediction logic (no ML)
   */
  static calculatePrediction({ quizAverage, totalHours }) {
    // Weighted formula
    let studyImpact = Math.min((totalHours || 0) * 3, 100);
    let predictedScore = (quizAverage || 0) * 0.6 + studyImpact * 0.4;
    predictedScore = Math.max(0, Math.min(100, predictedScore));
    predictedScore = Math.round(predictedScore * 10) / 10;
    return predictedScore;
  }

  /**
   * Calculate recommended study hours
   */
  static calculateRecommendedHours(predictedScore, targetScore = DEFAULT_TARGET_SCORE) {
    const hoursNeeded = Math.max(0, Math.ceil((targetScore - predictedScore) / 3));
    return {
      recommendedHours: hoursNeeded,
      explanation: hoursNeeded > 0
        ? `Study ${hoursNeeded} more hours to reach ${targetScore}%`
        : `Great! You're on track to reach ${targetScore}%`
    };
  }

  /**
   * Calculate confidence level
   */
  static calculateConfidence(sessionCount, quizCount, latestSessionDate, latestQuizDate) {
    let confidence = "Low";
    if (sessionCount > 10) confidence = "High";
    else if (sessionCount >= 5) confidence = "Medium";
    // Optionally, recent activity can boost confidence
    // ...
    return {
      confidenceLevel: confidence,
      dataPointsUsed: sessionCount + quizCount
    };
  }
}

module.exports = PredictionService;
module.exports = PredictionService;