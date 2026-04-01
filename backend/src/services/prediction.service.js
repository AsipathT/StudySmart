const DEFAULT_TARGET_SCORE = 75;

class PredictionService {
  static hasEnoughData(totalStudyHours, quizScoreValues) {
    return totalStudyHours > 0 || quizScoreValues.length > 0;
  }

  static generatePrediction(totalStudyHours, quizScoreValues) {
    const quizAverage = quizScoreValues.length > 0
      ? quizScoreValues.reduce((sum, s) => sum + s, 0) / quizScoreValues.length
      : 50;
    const studyImpact = Math.min(totalStudyHours * 2.5, 80);
    let predictedScore = (quizAverage * 0.7) + (studyImpact * 0.3);
    if (quizScoreValues.length >= 2) {
      const trend = this.calculateTrend(quizScoreValues);
      predictedScore += trend * 5;
    }
    predictedScore = Math.max(0, Math.min(100, Math.round(predictedScore * 10) / 10));
    return {
      predictedScore,
      confidence:       this.calculateConfidenceLevel(totalStudyHours, quizScoreValues.length),
      recommendedHours: this.calculateRecommendedHours(predictedScore),
      dataPointsUsed:   totalStudyHours + quizScoreValues.length,
      factors: {
        quizAverage:  Math.round(quizAverage * 10) / 10,
        studyImpact:  Math.round(studyImpact * 10) / 10,
        trend:        quizScoreValues.length >= 2 ? this.calculateTrend(quizScoreValues) : 0,
      },
    };
  }

  static calculateTrend(scores) {
    if (scores.length < 2) return 0;
    const recent   = scores.slice(-3);
    const avgRecent = recent.reduce((s, v) => s + v, 0) / recent.length;
    const avgAll    = scores.reduce((s, v) => s + v, 0) / scores.length;
    return (avgRecent - avgAll) / 10;
  }

  static calculateConfidenceLevel(studyHours, quizCount) {
    let score = 0;
    if (studyHours > 0)   score++;
    if (quizCount >= 1)   score++;
    if (quizCount >= 3)   score++;
    if (studyHours >= 10) score++;
    if (score >= 4) return 'High';
    if (score >= 2) return 'Medium';
    return 'Low';
  }

  static calculateRecommendedHours(predictedScore, target = DEFAULT_TARGET_SCORE) {
    if (predictedScore >= target) return 0;
    return Math.ceil((target - predictedScore) / 2.5);
  }
}

module.exports = PredictionService;