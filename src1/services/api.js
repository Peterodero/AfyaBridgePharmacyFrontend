import axios from 'axios';

const BASE = import.meta.env.VITE_API_URL;

const client = axios.create({ baseURL: BASE });

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const msg = error.response?.data?.message || '';
      const isAuthFailure =
        msg.toLowerCase().includes('token') ||
        msg.toLowerCase().includes('credentials') ||
        msg.toLowerCase().includes('authentication') ||
        msg === '';
      if (isAuthFailure) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/auth/login';
      }
    }
    return Promise.reject(error);
  }
);

// AUTH
// export async function loginUser(email, password) {
//   const res = await client.post('/auth/login/', { email, password });
//   const token = res.data?.data?.access_token;
//   const refresh = res.data?.data?.refresh_token;
//   if (!token) throw new Error('No access token returned from server');
//   localStorage.setItem('access_token', token);
//   localStorage.setItem('refresh_token', refresh);
//   return res.data?.data;
// }
// export async function logoutUser() {
//   const refresh = localStorage.getItem('refresh_token');
//   try { await client.post('/auth/logout/', { refresh_token: refresh }); }
//   finally { localStorage.removeItem('access_token'); localStorage.removeItem('refresh_token'); }
// }
// export const getProfile     = ()     => client.get('/auth/profile/');
// export const updateProfile  = (data) => client.put('/auth/profile/', data);
// export const changePassword = (data) => client.put('/auth/change-password/', data);
// export const uploadPhoto    = (form) => client.patch('/auth/profile/photo/', form);
// export const removePhoto    = ()     => client.delete('/auth/profile/photo/');
// export const forgotPassword = (data) => client.post('/auth/forgot-password/', data);
// export const resetPassword  = (data) => client.post('/auth/reset-password/', data);
// export const sendOtp        = (data) => client.post('/auth/otp/send/', data);
// export const verifyOtp      = (data) => client.post('/auth/otp/verify/', data);

// // REGISTRATION
// export const registerStep1         = (data)      => client.post('/auth/register/step1/', data);
// export const registerStep2         = (id, data)  => client.put(`/auth/register/${id}/step2/`, data);
// export const registerStep3         = (id, data)  => client.put(`/auth/register/${id}/step3/`, data);
// export const registerStep4         = (id, data)  => client.put(`/auth/register/${id}/step4/`, data);
// export const getRegistrationStatus = (id)        => client.get(`/auth/register/${id}/status/`);

// // ORDERS
// export const getOrders          = (params)    => client.get('/orders/', { params });
// export const getTodayOrders     = ()          => client.get('/orders/today/');
// export const getReadyOrders     = ()          => client.get('/orders/ready/');
// export const getAvailableRiders = ()          => client.get('/orders/riders/available/');
// export const getOrder           = (id)        => client.get(`/orders/${id}/`);
// export const updateOrderStatus  = (id, data)  => client.patch(`/orders/${id}/status/`, data);
// export const cancelOrder        = (id, data)  => client.post(`/orders/${id}/cancel/`, data);
// export const dispenseOrder      = (id, data)  => client.post(`/orders/${id}/dispense/`, data || {});
// export const assignRiderToOrder = (id, data)  => client.post(`/orders/${id}/assign-rider/`, data);
// export const getPatientHistory  = (patientId) => client.get(`/orders/patient/${patientId}/history/`);

// // INVENTORY
// export const getDrugs        = (params)    => client.get('/inventory/', { params });
// export const getDrug         = (id)        => client.get(`/inventory/${id}/`);
// export const createDrug      = (data)      => client.post('/inventory/', data);
// export const updateDrug      = (id, data)  => client.put(`/inventory/${id}/`, data);
// export const deleteDrug      = (id)        => client.delete(`/inventory/${id}/`);
// export const getLowStock     = ()          => client.get('/inventory/low-stock/');
// export const getExpiring     = (days = 30) => client.get(`/inventory/expiring/?days=${days}`);
// export const getInvDashboard = ()          => client.get('/inventory/dashboard/');
// export const restockDrug     = (id, data)  => client.post(`/inventory/${id}/restock/`, data);

// // DELIVERIES
// export const getDeliveries        = (params)   => client.get('/deliveries/', { params });
// export const updateDeliveryStatus = (id, data) => client.patch(`/deliveries/${id}/status/`, data);
// export const confirmDelivery      = (id, data) => client.post(`/deliveries/${id}/confirm/`, data);

// // PRESCRIPTIONS
// export const getPrescriptions     = (params)     => client.get('/prescriptions/', { params });
// export const getPrescription      = (id)         => client.get(`/prescriptions/${id}/`);
// export const validatePrescription = (id)         => client.post(`/prescriptions/${id}/validate/`, {});
// export const dispensePrescription = (id)         => client.post(`/prescriptions/${id}/dispense/`, {});
// export const rejectPrescription   = (id, reason) => client.post(`/prescriptions/${id}/reject/`, { reason });

// // REPORTING
// export const getDashboardReport = () => client.get('/reporting/dashboard/');

// // SETTINGS
// export const getPharmacySettings    = ()     => client.get('/settings/pharmacy/');
// export const updatePharmacySettings = (data) => client.put('/settings/pharmacy/', data);

// export default client;


// All API calls use the single client from src/api/client.js
// Paths match the Go/Fiber backend exactly — NO trailing slashes except where
// the backend explicitly has them (inventory/ and orders/ list endpoints).

// ── AUTH ──────────────────────────────────────────────────────────────────────
export const loginUser      = (data) => client.post('/auth/login/', data);
export const logoutUser     = (data) => client.post('/auth/logout/', data);
export const forgotPassword = (data) => client.post('/auth/forgot-password', data);
export const resetPassword  = (data) => client.post('/auth/reset-password', data);
export const sendOtp        = (data) => client.post('/auth/otp/send', data);
export const verifyOtp      = (data) => client.post('/auth/otp/verify', data);

// Backend confirmed: GET /api/profile  PUT /api/profile
export const getProfile     = ()     => client.get('/profile');
export const updateProfile  = (data) => client.put('/profile', data);
export const changePassword = (data) => client.put('/change-password', data);
export const uploadPhoto    = (data) => client.patch('/profile/photo', data);
export const removePhoto    = ()     => client.delete('/profile/photo');

// ── REGISTRATION ──────────────────────────────────────────────────────────────
export const registerPharmacy = (formData) =>
  client.post('/auth/register/complete/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

// ── ORDERS ────────────────────────────────────────────────────────────────────
// Backend routes: no trailing slashes on sub-routes (Fiber doesn't redirect)
export const getOrders          = (params)    => client.get('/orders/', { params });
export const getTodayOrders     = ()          => client.get('/orders/today');
export const getReadyOrders     = ()          => client.get('/orders/ready');
export const getAvailableRiders = ()          => client.get('/orders/riders/available');
export const getOrder           = (id)        => client.get(`/orders/${id}`);
export const updateOrderStatus  = (id, data)  => client.patch(`/orders/${id}/status`, data);
export const cancelOrder        = (id, data)  => client.post(`/orders/${id}/cancel`, data);
export const dispenseOrder      = (id, data)  => client.post(`/orders/${id}/dispense`, data ?? {});
export const assignRiderToOrder = (id, data)  => client.post(`/orders/${id}/assign-rider`, data);
export const getPatientHistory  = (patientId) => client.get(`/orders/patient/${patientId}/history`);
export const serveOrder         = (orderId) => client.post(`/orders/${orderId}/serve`);

// ── INVENTORY ─────────────────────────────────────────────────────────────────
// Backend confirmed: list uses trailing slash, all others do not
export const getDrugs        = (params)    => client.get('/inventory/', { params });
export const getDrug         = (id)        => client.get(`/inventory/${id}`);
export const createDrug      = (data)      => client.post('/inventory/', data);
export const updateDrug      = (id, data)  => client.put(`/inventory/${id}`, data);
export const deleteDrug      = (id)        => client.delete(`/inventory/${id}`);
export const getLowStock     = ()          => client.get('/inventory/low-stock');
export const getExpiring     = (days = 30) => client.get(`/inventory/expiring?days=${days}`);
export const getInvDashboard = ()          => client.get('/inventory/dashboard');
export const restockDrug     = (id, data)  => client.post(`/inventory/${id}/restock`, data);

// ── DELIVERIES ────────────────────────────────────────────────────────────────
export const getDeliveries        = (params)   => client.get('/deliveries/', { params });
export const updateDeliveryStatus = (id, data) => client.patch(`/deliveries/${id}/status`, data);
export const confirmDelivery      = (id, data) => client.post(`/deliveries/${id}/confirm`, data);

// ── REPORTING ─────────────────────────────────────────────────────────────────
// Backend confirmed: GET /api/reporting/dashboard (no trailing slash)
export const getDashboardReport = () => client.get('/reporting/dashboard');

// ── SETTINGS ──────────────────────────────────────────────────────────────────
// Backend confirmed paths from the doc
export const getPharmacySettings    = ()     => client.get('/settings/pharmacy');
export const updatePharmacySettings = (data) => client.put('/settings/pharmacy', data);
// Logo: backend accepts JSON { logo_url: "..." } not multipart
export const updatePharmacyLogo     = (data) => client.patch('/settings/pharmacy/logo', data);
export const getPharmacyHours       = ()     => client.get('/settings/pharmacy/hours');
export const updatePharmacyHours    = (data) => client.put('/settings/pharmacy/hours', data);

export default client;