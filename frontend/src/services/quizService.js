import axios from 'axios';

const API_URL = 'http://localhost:5000/api/quizzes';

const generateQuiz = (data) => {
  return axios.post(`${API_URL}/generate`, data);
};

const getQuizzesForSubject = (subjectId) => {
  return axios.get(`${API_URL}/subject/${subjectId}`);
};

const submitAttempt = (data) => {
  return axios.post(`${API_URL}/submit`, data);
};

const getHistory = () => {
  return axios.get(`${API_URL}/history`);
};

export default {
  generateQuiz,
  getQuizzesForSubject,
  submitAttempt,
  getHistory
};
