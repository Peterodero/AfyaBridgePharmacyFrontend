import { createLazyFileRoute } from "@tanstack/react-router";
import Analytics from "../../components/analytics/Analytics";
export const Route = createLazyFileRoute("/dashboard/analytics")({ component: Analytics });
