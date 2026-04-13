import { createSlice } from '@reduxjs/toolkit';

const storedUser = localStorage.getItem('user_data');
const initialUser = storedUser ? JSON.parse(storedUser) : null;

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: initialUser,
    token: localStorage.getItem('access_token') || null,
    refreshToken: localStorage.getItem('refresh_token') || null,
    isAuthenticated: !!localStorage.getItem('access_token'),
  },
  reducers: {
    setCredentials: (state, action) => {
      const { user, token, refreshToken } = action.payload;
      state.user = user ?? state.user;
      state.token = token ?? state.token;
      state.refreshToken = refreshToken ?? state.refreshToken;
      state.isAuthenticated = true;

      if (token) {
        localStorage.setItem('access_token', token);
      }
      if (refreshToken) {
        localStorage.setItem('refresh_token', refreshToken);
      }
      if (user) {
        localStorage.setItem('user_data', JSON.stringify(user));
      }
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user_data');
    },
  },
});

export const { setCredentials, logout } = authSlice.actions;
export default authSlice.reducer;