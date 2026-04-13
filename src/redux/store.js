import { configureStore } from "@reduxjs/toolkit";
import authSlice from "./slices/authSlice";
import forgotPasswordSlice from "./slices/forgotPasswordSlice";
import registrationSlice from "./slices/registrationSlice";

export const store = configureStore({
    reducer: {
        auth: authSlice,
        forgotPassword: forgotPasswordSlice,
        registration: registrationSlice,
    },
});