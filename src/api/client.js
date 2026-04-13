import axios from 'axios';

// Dynamic baseURL configuration
const getBaseURL = () => {
  // Check if we're in production (Vercel)
  if (import.meta.env.PROD) {
    // Use environment variable if set, otherwise fallback to Render URL
    return import.meta.env.VITE_API_URL || 'https://afyabridge-pharmacybackend-0c6f.onrender.com/api';
  }
  // Development - use localhosta
  return import.meta.env.VITE_API_URL || 'https://afyabridge-pharmacybackend-0c6f.onrender.com/api';
};

const api = axios.create({
  baseURL: getBaseURL(),
  timeout: 80000, // Increased timeout for production
  headers: { 'Content-Type': 'application/json' },
});

// Log the baseURL in development to debug
if (import.meta.env.DEV) {
  console.log('API Base URL:', getBaseURL());
}

// These endpoints must NOT carry an Authorization header
const PUBLIC_ENDPOINTS = [
  '/auth/login',
  '/auth/register',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/otp/send',
  '/auth/otp/verify',
];

const isPublic = (url = '') =>
  PUBLIC_ENDPOINTS.some((e) => url.includes(e));

api.interceptors.request.use((config) => {
  if (!isPublic(config.url)) {
    const token = localStorage.getItem('access_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const msg = error.response?.data?.message || '';
      const isRealAuthFailure =
        msg.toLowerCase().includes('token') ||
        msg.toLowerCase().includes('credentials') ||
        msg.toLowerCase().includes('authentication') ||
        msg === '';
      if (isRealAuthFailure) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user_data');
        window.location.href = '/auth/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;