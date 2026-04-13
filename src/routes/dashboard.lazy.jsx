import { createLazyFileRoute, Outlet } from "@tanstack/react-router";
import DashboardLayout from "../components/layout/DashboardLayout";

export const Route = createLazyFileRoute("/dashboard")({
  component: DashboardRoot,
});

function DashboardRoot() {
  return (
    <DashboardLayout>
      <Outlet />
    </DashboardLayout>
  );
}