import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const predictionAPI = {
  /**
   * Generate performance prediction
   * @param {string} subject - Subject name
   * @returns {Promise} Prediction result
   */
  async generatePrediction(subject) {
    try {
      const response = await axios.post(`${API_BASE_URL}/predictions/generate`, {
        subject
      });
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
      const response = await axios.get(`${API_BASE_URL}/predictions/history`);
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
      const response = await axios.get(`${API_BASE_URL}/predictions/${subject}`);
      return response.data;
    } catch (error) {
      console.error('Get prediction error:', error);
      throw error.response?.data || { message: 'Failed to fetch prediction' };
    }
  }
};

export default predictionAPI;