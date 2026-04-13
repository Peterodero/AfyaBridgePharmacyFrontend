import { createLazyFileRoute } from "@tanstack/react-router";
import Notifications from "../../components/notifications/Notifications";

export const Route = createLazyFileRoute("/dashboard/notifications")({
  component: Notifications,
});
