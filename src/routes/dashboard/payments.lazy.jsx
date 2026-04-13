import { createLazyFileRoute } from "@tanstack/react-router";
import Payments from "../../components/payments/Payments";
export const Route = createLazyFileRoute("/dashboard/payments")({ component: Payments });
