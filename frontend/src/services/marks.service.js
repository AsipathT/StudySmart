import api from './api';

class MarksService {
  /**
   * Get all marks for a specific student by ID
   */
  async getStudentMarks(studentId) {
    try {
      const response = await api.get(`/analytics/student/${studentId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch student marks:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get marks for student by student number/ID string
   */
  async getMarksByStudentId(studentId) {
    try {
      const response = await api.get(`/upload/student-marks/${studentId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch marks by student ID:', error);
      // Fallback: return empty marks list instead of error
      return { 
        success: true, 
        data: { 
          studentId, 
          marks: [] 
        } 
      };
    }
  }
}

export default new MarksService();
