import api from './api';

const predictionAPI = {
  /**
   * Generate performance prediction
   * @param {string} subject - Subject name
   * @param {array} marksData - Optional marks data array with score/date fields
   * @returns {Promise} Prediction result
   */
  async generatePrediction(subject, marksData = []) {
    try {
      const payload = { subject };
      
      // Include marks data if available for offline/robust prediction
      if (marksData && marksData.length > 0) {
        const scores = marksData.map(m => parseFloat(m.score || 0)).filter(s => s > 0);
        if (scores.length > 0) {
          payload.marksData = marksData;
          payload.scores = scores;
        }
      }

      const response = await api.post('/predictions/generate', payload);
      return response.data;
    } catch (error) {
      console.error('Prediction generation error:', error);
      throw error.response?.data || { message: 'Failed to generate prediction' };
    }
  },

  /**
   * Get prediction history
   * @returns {Promise} Prediction history
   */
  async getPredictionHistory() {
    try {
      const response = await api.get('/predictions/history');
      return response.data;
    } catch (error) {
      console.error('Get history error:', error);
      throw error.response?.data || { message: 'Failed to fetch history' };
    }
  },

  /**
   * Get prediction for specific subject
   * @param {string} subject - Subject name
   * @returns {Promise} Prediction data
   */
  async getPredictionBySubject(subject) {
    try {
      const response = await api.get(`/predictions/${subject}`);
      return response.data;
    } catch (error) {
      console.error('Get prediction error:', error);
      throw error.response?.data || { message: 'Failed to fetch prediction' };
    }
  }
};

export default predictionAPI;