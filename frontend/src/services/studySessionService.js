import api from './api';

const API_URL = '/study-session';

const startTimer = () => api.post(`${API_URL}/start`);

const pauseTimer = () => api.post(`${API_URL}/pause`);

const resumeTimer = () => api.post(`${API_URL}/resume`);

const stopTimer = () => api.post(`${API_URL}/stop`);

const saveSession = (sessionData) => api.post(`${API_URL}/save`, sessionData);

const getHistory = (userId, params = {}) =>
  api.get(`${API_URL}/history/${userId}`, { params });

const getAllHistory = (params = {}) =>
  api.get(`${API_URL}/admin/history`, { params });

const getStats = (userId) => api.get(`${API_URL}/stats/${userId}`);

export default {
  startTimer,
  pauseTimer,
  resumeTimer,
  stopTimer,
  saveSession,
  getHistory,
  getAllHistory,
  getStats,
};
