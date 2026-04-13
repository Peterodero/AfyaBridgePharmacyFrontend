// Dashboard.jsx
import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useSelector } from "react-redux";
import { useApi } from "../../hooks/useApi";
import { getDashboardReport, getOrders, getTodayOrders, getReadyOrders } from "../../services/api";
import OrderRowSkeleton from "../skeletons/OrderRowSkeleton";
import DashboardStats from "../dashboard/DashboardStats";
import PendingOrdersTable from "../dashboard/PendingOrdersTable";
import WelcomeCard from "../dashboard/WelcomeCard";
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

  const { data: ordersData, loading: ordersLoading } = useApi(
    getOrders,
    { status: "pending", page_size: 5 },
    [refreshKey],
    { silent: true }
  );

  const { data: todayData, loading: todayLoading } = useApi(
    getTodayOrders, null, [refreshKey], { silent: true }
  );

  const { data: readyData, loading: readyLoading } = useApi(
    getReadyOrders, null, [refreshKey], { silent: true }
  );

  const stats = statsData ?? {};
  const orders = Array.isArray(ordersData) ? ordersData : ordersData?.results ?? [];
  
  const todayOrders = (() => {
    const d = todayData;
    if (!d) return [];
    return Array.isArray(d) ? d : d?.results ?? [];
  })();

  const readyOrders = (() => {
    const d = readyData;
    if (!d) return [];
    return Array.isArray(d) ? d : d?.results ?? [];
  })();

  const pharmacyLinked = Boolean(user?.pharmacy_id);
  const userName = user?.full_name || "Pharmacy User";
  const pharmacyId = user?.pharmacy_id;
  const accountStatus = user?.account_status || "active";

  const pendingCount = stats.pending_orders ?? 0;
  const lowStockCount = stats.low_stock_alerts ?? 0;
  const readyCount = stats.ready_for_pickup ?? 0;
  const deliveriesCount = stats.active_deliveries ?? 0;
  const revenueAmount = stats.today_revenue ?? 0;

  const statsDataForCards = {
    pendingCount,
    lowStockCount,
    readyCount,
    deliveriesCount,
    revenueAmount,
    statsLoading
  };

  return (
    <div>
      <PharmacyNotLinkedBanner pharmacyLinked={pharmacyLinked} user={user} />
      
      <DashboardStats stats={statsDataForCards} />
      
      <div className=" w-full">
        <PendingOrdersTable 
          orders={orders}
          ordersLoading={ordersLoading}
          pharmacyLinked={pharmacyLinked}
          onRefresh={refresh}
          onViewOrder={() => navigate({ to: "/dashboard/orders" })}
        />
{/*         
        <WelcomeCard 
          userName={userName}
          pharmacyLinked={pharmacyLinked}
          pharmacyId={pharmacyId}
          accountStatus={accountStatus}
        /> */}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginTop: 20 }}>
        <TodayOrdersTable 
          orders={todayOrders}
          loading={todayLoading}
          pharmacyLinked={pharmacyLinked}
        />
        
        <ReadyOrdersTable 
          orders={readyOrders}
          loading={readyLoading}
          pharmacyLinked={pharmacyLinked}
          onNavigate={() => navigate({ to: "/dashboard/orders" })}
        />
      </div>
    </div>
  );
}