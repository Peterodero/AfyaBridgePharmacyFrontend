import { createLazyFileRoute } from '@tanstack/react-router';
import Orders from '../../components/orders/Orders';
export const Route = createLazyFileRoute('/dashboard/orders')({ component: Orders });
