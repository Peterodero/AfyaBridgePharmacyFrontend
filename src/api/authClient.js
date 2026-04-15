import axios from 'axios';

// Auth API client (different backend for forgot password)
const authApi = axios.create({
  baseURL: 'https://afya-bridge.onrender.com/api',
  timeout: 70000,
  headers: { 'Content-Type': 'application/json' },
});

// These endpoints don't need auth
const PUBLIC_ENDPOINTS = [
  '/admin/auth/send-otp',
  '/admin/auth/verify-otp', 
  '/admin/auth/reset-password',
];

const isPublic = (url = '') =>
  PUBLIC_ENDPOINTS.some((e) => url.includes(e));

authApi.interceptors.request.use((config) => {
  if (!isPublic(config.url)) {
    const token = localStorage.getItem('access_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

authApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user_data');
      window.location.href = '/auth/login';
    }
    return Promise.reject(error);
  }
);

export default authApi;