import api from './api';

class AuthService {
  async login(email, password) {
    try {
      const response = await api.post('/auth/login', { email, password });
      return response.data;
    } catch (error) {
      console.error('Login error:', error);
      
      // Handle different error scenarios
      if (error.code === 'ERR_NETWORK') {
        return {
          success: false,
          message: 'Cannot connect to server. Please check if backend is running.'
        };
      }
      
      if (error.response) {
        // The request was made and the server responded with a status code
        return {
          success: false,
          message: error.response.data?.message || 'Login failed'
        };
      }
      
      return {
        success: false,
        message: error.message || 'Login failed'
      };
    }
  }

  async register(userData) {
    try {
      const response = await api.post('/auth/register', userData);
      return response.data;
    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Registration failed'
      };
    }
  }

  async getCurrentUser() {
    try {
      const response = await api.get('/auth/me');
      return response.data;
    } catch (error) {
      console.error('Get user error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to get user'
      };
    }
  }
}

export default new AuthService();