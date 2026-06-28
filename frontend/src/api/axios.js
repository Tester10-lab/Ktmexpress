import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  withCredentials: true,
  timeout: 10000,
});

const getActiveRole = () => {
  const path = window.location.pathname;
  if (path.startsWith('/admin')) return 'admin';
  if (path.startsWith('/vendor')) return 'vendor';
  if (path.startsWith('/dispatcher')) return 'dispatcher';
  if (path.startsWith('/rider')) return 'rider';
  return localStorage.getItem('last_active_role') || 'vendor';
};

api.interceptors.request.use(
  (config) => {
    const activeRole = getActiveRole();
    const token = localStorage.getItem(`${activeRole}_token`);
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle 401 globally
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const activeRole = getActiveRole();
      try {
        const { data } = await axios.post(
          `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/auth/refresh`,
          { role: activeRole },
          { withCredentials: true }
        );
        localStorage.setItem(`${activeRole}_token`, data.token);
        originalRequest.headers.Authorization = `Bearer ${data.token}`;
        return api(originalRequest);
      } catch {
        localStorage.removeItem(`${activeRole}_token`);
        localStorage.removeItem(`${activeRole}_user`);
        window.location.href = '/login';
      }
    }

    return Promise.reject({
      message: error.response?.data?.message || 'Something went wrong',
      status: error.response?.status,
      errors: error.response?.data?.errors || [],
    });
  }
);

export default api;
