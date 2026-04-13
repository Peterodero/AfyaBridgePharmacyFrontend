import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useSelector } from "react-redux";
import { useApi } from "../../hooks/useApi";
import { getDashboardReport, getAvailableOrders } from "../../services/api";
import DashboardStats from "../dashboard/DashboardStats";
import PendingOrdersTable from "../dashboard/PendingOrdersTable";
import TodayOrdersTable from "../dashboard/TodayOrdersTable";
import ReadyOrdersTable from "../dashboard/ReadyOrdersTable";
import PharmacyNotLinkedBanner from "../dashboard/PharmacyNotLinkedBanner";

export default function Dashboard() {
  const navigate = useNavigate();
  const [refreshKey, setRefreshKey] = useState(0);
  const refresh = () => setRefreshKey(prev => prev + 1);

  const user = useSelector(state => state.auth.user);

  const { data: statsData, loading: statsLoading } = useApi(
    getDashboardReport, null, [refreshKey], { silent: true }
  );

  // Single source of truth — same endpoint as Orders page
  const { data: availableData, loading: ordersLoading } = useApi(
    getAvailableOrders, null, [refreshKey], { silent: true }
  );

  const stats = statsData ?? {};

  const allOrders = (() => {
    if (!availableData) return [];
    return Array.isArray(availableData) ? availableData : availableData?.results ?? [];
  })();

  // Client-side derived lists — always accurate, always in sync with Orders page
  const pendingOrders = allOrders.filter(o => o.status === "pending").slice(0, 5);
  const readyOrders   = allOrders.filter(o => o.status === "ready");
  const todayOrders   = allOrders.filter(o => {
    if (!o.created_at) return false;
    const d   = new Date(o.created_at);
    const now = new Date();
    return (
      d.getFullYear() === now.getFullYear() &&
      d.getMonth()    === now.getMonth()    &&
      d.getDate()     === now.getDate()
    );
  });

  // Always use local count for pending and ready — never trust dashboard report for these
  // since they come from getAvailableOrders which is the actual source
  const pendingCount    = allOrders.filter(o => o.status === "pending").length;
  const readyCount      = readyOrders.length;
  // These have no local equivalent so use dashboard report
  const lowStockCount   = stats.low_stock_alerts  ?? 0;
  const deliveriesCount = stats.active_deliveries ?? 0;
  const revenueAmount   = stats.today_revenue      ?? 0;

  const pharmacyLinked = Boolean(user?.pharmacy_id);

  const statsDataForCards = {
    pendingCount,
    lowStockCount,
    readyCount,
    deliveriesCount,
    revenueAmount,
    statsLoading,
  };

  return (
    <div>
      <PharmacyNotLinkedBanner pharmacyLinked={pharmacyLinked} user={user} />
      <DashboardStats stats={statsDataForCards} />

      <div className="w-full">
        <PendingOrdersTable
          orders={pendingOrders}
          ordersLoading={ordersLoading}
          pharmacyLinked={pharmacyLinked}
          onRefresh={refresh}
          onViewOrder={() => navigate({ to: "/dashboard/orders" })}
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginTop: 20 }}>
        <TodayOrdersTable
          orders={todayOrders}
          loading={ordersLoading}
          pharmacyLinked={pharmacyLinked}
        />
        <ReadyOrdersTable
          orders={readyOrders}
          loading={ordersLoading}
          pharmacyLinked={pharmacyLinked}
          onNavigate={() => navigate({ to: "/dashboard/orders" })}
        />
      </div>
    </div>
  );
}