import { createLazyFileRoute } from "@tanstack/react-router";
import Deliveries from "../../components/deliveries/Deliveries";
export const Route = createLazyFileRoute("/dashboard/deliveries")({ component: Deliveries });
