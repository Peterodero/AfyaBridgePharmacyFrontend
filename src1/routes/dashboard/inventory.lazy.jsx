import { createLazyFileRoute } from "@tanstack/react-router";
import Inventory from "../../components/inventory/Inventory";

export const Route = createLazyFileRoute("/dashboard/inventory")({
  component: Inventory,
});
