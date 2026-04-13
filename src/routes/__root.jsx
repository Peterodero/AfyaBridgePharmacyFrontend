import { createRootRoute, Outlet, redirect } from "@tanstack/react-router";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export const Route = createRootRoute({
  beforeLoad: ({ location }) => {
    const token = localStorage.getItem("access_token");
    const isAuthRoute = location.pathname.startsWith("/auth");
    const isRoot = location.pathname === "/";

    // If no token and trying to access dashboard, redirect to login
    if (!token && !isAuthRoute && !isRoot) {
      throw redirect({ to: "/auth/login" });
    }

    // If has token and on an auth page, redirect to dashboard
    if (token && isAuthRoute) {
      throw redirect({ to: "/dashboard" });
    }
  },
  component: () => (
    <>
      <Outlet />
      <ToastContainer position="top-right" autoClose={4000} />
    </>
  ),
});