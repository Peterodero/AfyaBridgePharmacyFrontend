import { createRootRoute, Outlet } from "@tanstack/react-router";
import { ToastContainer } from 'react-toastify';
import { TanStackDevtools } from '@tanstack/react-devtools'
import 'react-toastify/dist/ReactToastify.css';

export const Route = createRootRoute({
  component: () => {
    return (
      <>
        <Outlet />
        <ToastContainer position="top-right" autoClose={4000} />
        <TanStackDevtools />
      </>
    );
  },
});
