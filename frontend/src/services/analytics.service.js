import api from './api';

class AnalyticsService {
  /**
   * Get student dashboard
   */
  async getStudentDashboard(studentId) {
    const response = await api.get(`/analytics/student/${studentId}`);
    return response.data;
  }

  /**
   * Get subject analytics
   */
  async getSubjectAnalytics(subject) {
    const response = await api.get(`/analytics/subject/${subject}`);
    return response.data;
  }

  /**
   * Get class summary
   */
  async getClassSummary(filters = {}) {
    const params = new URLSearchParams(filters).toString();
    const response = await api.get(`/analytics/class/summary?${params}`);
    return response.data;
  }

  /**
   * Get overall analytics data
   */
  async getAnalyticsData(filters = {}) {
    const params = new URLSearchParams(filters).toString();
    const response = await api.get(`/analytics/overview?${params}`);
    return response.data;
  }

  /**
   * Export analytics report as Excel
   */
  async exportAnalyticsReport(filters = {}) {
    const params = new URLSearchParams(filters).toString();
    const response = await api.get(`/analytics/export?${params}`, {
      responseType: 'blob'
    });
    return response.data;
  }

  /**
   * Download PDF analytics report
   */
  async downloadPdfReport() {
    const response = await api.get('/report/pdf', {
      responseType: 'blob'
    });
    return response.data;
  }
}

export default new AnalyticsService();