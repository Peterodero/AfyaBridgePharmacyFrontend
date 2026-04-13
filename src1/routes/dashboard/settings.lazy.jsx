import { createLazyFileRoute } from "@tanstack/react-router";
import Settings from "../../components/settings/Settings";
export const Route = createLazyFileRoute("/dashboard/settings")({ component: Settings });
