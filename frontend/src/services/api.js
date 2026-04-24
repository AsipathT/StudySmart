import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

/** Same base URL and auth as `api`, but no default Content-Type — use for multipart FormData so the browser sets the boundary. */
const apiForm = axios.create({
  baseURL: API_BASE_URL,
});

function attachInterceptors(client, { stripJsonForFormData } = { stripJsonForFormData: false }) {
  client.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      if (
        stripJsonForFormData &&
        typeof FormData !== 'undefined' &&
        config.data instanceof FormData &&
        config.headers
      ) {
        if (typeof config.headers.delete === 'function') {
          config.headers.delete('Content-Type');
        } else {
          delete config.headers['Content-Type'];
        }
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  client.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }
  );
}

attachInterceptors(api, { stripJsonForFormData: true });
attachInterceptors(apiForm, { stripJsonForFormData: false });

export default api;
export { apiForm };
