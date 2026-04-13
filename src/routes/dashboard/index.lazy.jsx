import { createLazyFileRoute } from "@tanstack/react-router";
import DashboardHome from "../../components/dashboard/DashboardHome";

export const Route = createLazyFileRoute("/dashboard/")({
  component: DashboardHome,
});
