import axios from 'axios';

const API_URL = 'http://localhost:5000/api/study-session';

const startTimer = () => {
  return axios.post(`${API_URL}/start`);
};

const pauseTimer = () => {
  return axios.post(`${API_URL}/pause`);
};

const resumeTimer = () => {
  return axios.post(`${API_URL}/resume`);
};

const stopTimer = () => {
  return axios.post(`${API_URL}/stop`);
};

const saveSession = (sessionData) => {
  return axios.post(`${API_URL}/save`, sessionData);
};

const getHistory = (userId, params = {}) => {
  return axios.get(`${API_URL}/history/${userId}`, { params });
};

const getAllHistory = (params = {}) => {
  return axios.get(`${API_URL}/admin/history`, { params });
};

const getStats = (userId) => {
  return axios.get(`${API_URL}/stats/${userId}`);
};

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
