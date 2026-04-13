import { createLazyFileRoute } from "@tanstack/react-router";
import Help from "../../components/help/Help";

export const Route = createLazyFileRoute("/dashboard/help")({
  component: Help,
});
