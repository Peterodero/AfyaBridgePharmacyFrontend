import { createSlice } from '@reduxjs/toolkit';

const registrationSlice = createSlice({
  name: 'registration',
  initialState: {
    currentStep: 1,
    registrationId: null,
    formData: {},
  },
  reducers: {
    updateFormData: (state, action) => {
      state.formData = { ...state.formData, ...action.payload };
    },
    setRegistrationId: (state, action) => {
      state.registrationId = action.payload;
    },
    nextStep: (state) => {
      state.currentStep += 1;
    },
    prevStep: (state) => {
      state.currentStep -= 1;
    },
    resetRegistration: (state) => {
      state.currentStep = 1;
      state.registrationId = null;
      state.formData = {};
    },
  },
});

export const { updateFormData, setRegistrationId, nextStep, prevStep, resetRegistration } = registrationSlice.actions;
export default registrationSlice.reducer;