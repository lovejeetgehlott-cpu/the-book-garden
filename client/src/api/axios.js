import axios from 'axios';

/**
 * Pre-configured Axios instance.
 * - baseURL /api is proxied to the Express server by Vite (see vite.config.js)
 * - attaches the JWT from localStorage on every request
 * - on a 401 response, clears the session and redirects to /login
 */
const api = axios.create({ baseURL: '/api' });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && window.location.pathname !== '/login') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
