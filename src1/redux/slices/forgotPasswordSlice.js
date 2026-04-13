import { createSlice } from '@reduxjs/toolkit';

const forgotPasswordSlice = createSlice({
  name: 'forgotPassword',
  initialState: {
    lastAttemptIdentifier: null,
    isSuccess: false,
  },
  reducers: {
    setAttempt: (state, action) => {
      state.lastAttemptIdentifier = action.payload;
      state.isSuccess = true;
    },
    resetFlow: (state) => {
      state.lastAttemptIdentifier = null;
      state.isSuccess = false;
    },
  },
});

export const { setAttempt, resetFlow } = forgotPasswordSlice.actions;
export default forgotPasswordSlice.reducer;