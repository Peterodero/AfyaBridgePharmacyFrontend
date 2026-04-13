import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { setCredentials, logout } from "./redux/slices/authSlice";
import api from "./api/client";
import { routeTree } from "./routeTree.gen";
import "./App.css";

const router = createRouter({ routeTree });

const App = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    const token       = localStorage.getItem('access_token');
    const refreshToken= localStorage.getItem('refresh_token');
    const storedUser  = localStorage.getItem('user_data');

    // No token — nothing to restore
    if (!token) return;

    // Immediately restore from localStorage so the UI is never empty on reload
    if (storedUser) {
      try {
        dispatch(setCredentials({
          user: JSON.parse(storedUser),
          token,
          refreshToken,
        }));
      } catch {
        localStorage.removeItem('user_data');
      }
    }

    // Silently refresh profile in the background to pick up any server-side changes
    api.get('/profile')
      .then((res) => {
        const user = res.data?.data ?? res.data;
        if (user?.id) {
          dispatch(setCredentials({ user, token, refreshToken }));
        }
      })
      .catch((err) => {
        const status = err?.response?.status;
        // Only log out on a real auth failure (401 with token error)
        // NOT on 500, timeout, or network errors — those are server issues
        if (status === 401) {
          const msg = err.response?.data?.message || '';
          const isRealAuthFailure =
            msg.toLowerCase().includes('token') ||
            msg.toLowerCase().includes('expired') ||
            msg.toLowerCase().includes('invalid') ||
            msg === '';
          if (isRealAuthFailure) {
            dispatch(logout());
          }
        }
        // For 500, timeout, offline — keep the stored session alive
        // The user is still logged in, the server just had a hiccup
      });
  }, [dispatch]);

  return <RouterProvider router={router} />;
};

export default App;