import axios from 'axios';

/**
 * Pre-configured Axios instance.
 * - baseURL: VITE_API_URL when set (the deployed backend's URL); otherwise
 *   '/api', proxied to the local Express server by Vite (see vite.config.js)
 * - attaches the JWT from localStorage on every request
 * - on a 401 response, clears the session and redirects to /login
 */
const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || '/api' });

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
