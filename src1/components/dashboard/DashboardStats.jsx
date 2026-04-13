export default function DashboardStats({ stats }) {
  const {
    pendingCount,
    lowStockCount,
    readyCount,
    deliveriesCount,
    revenueAmount,
    statsLoading
  } = stats;

  const revenueLabel = `KES ${Number(revenueAmount).toLocaleString("en-KE", {
    minimumFractionDigits: 2,
  })}`;

  const statItems = [
    { label: "Pending Orders", value: pendingCount, badge: "green", badgeLabel: "Live" },
    { label: "Low Stock Alerts", value: lowStockCount, badge: lowStockCount > 0 ? "red" : "green", badgeLabel: lowStockCount > 0 ? "Critical" : "OK" },
    { label: "Ready for Pickup", value: readyCount, badge: "stable", badgeLabel: "Stable" },
    { label: "Active Deliveries", value: deliveriesCount, badge: "green", badgeLabel: "Live" },
    { label: "Today's Revenue", value: revenueLabel, badge: "white", badgeLabel: "KES", revenue: true }
  ];

  return (
    <div className="ab-stat-grid">
      {statItems.map((item, index) => (
        <div key={index} className={`ab-stat${item.revenue ? " revenue" : ""}${item.value > 0 && item.label === "Low Stock Alerts" ? " danger-card" : ""}`}>
          <div className="ab-stat-top">
            <span className={`ab-badge ${item.badge}`}>{item.badgeLabel}</span>
          </div>
          <div className={`ab-stat-label${item.revenue ? " white" : ""}`}>{item.label}</div>
          <div className={`ab-stat-val${item.revenue ? " white" : ""}${item.label === "Low Stock Alerts" && item.value > 0 ? " red" : ""}`}>
            {statsLoading ? "…" : item.value}
          </div>
        </div>
      ))}
    </div>
  );
}