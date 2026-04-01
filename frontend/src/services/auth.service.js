import api from './api';

class AuthService {
  /**
   * Login user
   */
  async login(email, password) {
    const response = await api.post('/auth/login', { email, password });
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  }

  /**
   * Register new user
   */
  async register(userData) {
    const response = await api.post('/auth/register', userData);
    return response.data;
  }

  /**
   * Get current user
   */
  async getCurrentUser() {
    const response = await api.get('/auth/me');
    return response.data;
  }

  /**
   * Logout user
   */
  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  /**
   * Get auth token
   */
  getToken() {
    return localStorage.getItem('token');
  }
}

export default new AuthService();