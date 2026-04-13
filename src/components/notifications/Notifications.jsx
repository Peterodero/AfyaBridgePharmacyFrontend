import { useState, useCallback } from "react";
import {
  RiBellLine, RiCheckDoubleLine, RiRefreshLine,
  RiNotification2Line, RiTimeLine, RiAlertLine,
  RiShoppingCartLine, RiTruckLine, RiBankCardLine,
  RiMedicineBottleLine, RiInformationLine,
} from "react-icons/ri";
import { useApi, useApiAction } from "../../hooks/useApi";
import { getNotifications, markNotificationRead } from "../../services/api";

const TYPE_CONFIG = {
  order:        { icon: RiShoppingCartLine, bg: "#eff6ff", color: "#1152d4", label: "Order" },
  delivery:     { icon: RiTruckLine,        bg: "#f0fdf4", color: "#059669", label: "Delivery" },
  payment:      { icon: RiBankCardLine,     bg: "#fefce8", color: "#ca8a04", label: "Payment" },
  prescription: { icon: RiMedicineBottleLine,     bg: "#fdf4ff", color: "#9333ea", label: "Prescription" },
  low_stock:    { icon: RiAlertLine,        bg: "#fff7ed", color: "#ea580c", label: "Low Stock" },
  expiry_alert: { icon: RiAlertLine,        bg: "#fef2f2", color: "#dc2626", label: "Expiry Alert" },
  system:       { icon: RiInformationLine,  bg: "#f8fafc", color: "#64748b", label: "System" },
  broadcast:    { icon: RiBellLine,         bg: "#f8fafc", color: "#64748b", label: "Broadcast" },
};

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function NotificationCard({ notif, onMarkRead, marking }) {
  const cfg = TYPE_CONFIG[notif.notification_type] || TYPE_CONFIG.system;
  const Icon = cfg.icon;
  const isRead = notif.is_read;

  return (
    <div
      style={{
        display: "flex",
        gap: 14,
        padding: "16px 20px",
        borderBottom: "1px solid var(--ab-slate-100)",
        background: isRead ? "transparent" : "rgba(17,82,212,0.03)",
        transition: "background 0.2s",
        cursor: "default",
      }}
    >
      {/* Icon */}
      <div
        style={{
          width: 40, height: 40, borderRadius: 10,
          background: cfg.bg, color: cfg.color,
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Icon size={18} />
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
          <div>
            <span
              style={{
                fontSize: 11, fontWeight: 600, color: cfg.color,
                background: cfg.bg, padding: "2px 8px", borderRadius: 20,
                textTransform: "uppercase", letterSpacing: "0.5px",
              }}
            >
              {cfg.label}
            </span>
            {!isRead && (
              <span
                style={{
                  display: "inline-block", width: 7, height: 7,
                  borderRadius: "50%", background: "#1152d4",
                  marginLeft: 8, verticalAlign: "middle",
                }}
              />
            )}
          </div>
          <span style={{ fontSize: 11, color: "var(--ab-slate-400)", whiteSpace: "nowrap", flexShrink: 0 }}>
            <RiTimeLine size={11} style={{ marginRight: 3, verticalAlign: "middle" }} />
            {timeAgo(notif.created_at)}
          </span>
        </div>

        <p style={{ margin: "6px 0 4px", fontWeight: isRead ? 400 : 600, fontSize: 14, color: "var(--ab-slate-800)" }}>
          {notif.title}
        </p>
        <p style={{ margin: 0, fontSize: 13, color: "var(--ab-slate-500)", lineHeight: 1.5 }}>
          {notif.message}
        </p>
      </div>

      {/* Mark read */}
      {!isRead && (
        <button
          onClick={() => onMarkRead(notif.id)}
          disabled={marking === notif.id}
          title="Mark as read"
          style={{
            border: "none", background: "none", cursor: "pointer",
            color: "var(--ab-slate-300)", padding: 4, flexShrink: 0,
            borderRadius: 6, transition: "color 0.15s",
          }}
          onMouseEnter={e => e.currentTarget.style.color = "#1152d4"}
          onMouseLeave={e => e.currentTarget.style.color = "var(--ab-slate-300)"}
        >
          <RiCheckDoubleLine size={18} />
        </button>
      )}
    </div>
  );
}

const FILTER_TABS = [
  { key: "all",      label: "All" },
  { key: "unread",   label: "Unread" },
  { key: "order",    label: "Orders" },
  { key: "low_stock",label: "Stock Alerts" },
  { key: "delivery", label: "Deliveries" },
];

export default function Notifications() {
  const [filter, setFilter] = useState("all");
  const [marking, setMarking] = useState(null);

  const { data, loading, refetch } = useApi(getNotifications, null, []);
  const { execute: markRead } = useApiAction(markNotificationRead);

  const notifications = Array.isArray(data) ? data : data?.results ?? data?.data ?? [];

  const filtered = notifications.filter(n => {
    if (filter === "unread") return !n.is_read;
    if (filter === "all") return true;
    return n.notification_type === filter;
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const handleMarkRead = useCallback(async (id) => {
    setMarking(id);
    try {
      await markRead(id);
      refetch();
    } catch {
      // silent
    } finally {
      setMarking(null);
    }
  }, [markRead, refetch]);

  const handleMarkAllRead = useCallback(async () => {
    const unread = notifications.filter(n => !n.is_read);
    for (const n of unread) {
      try { await markNotificationRead(n.id); } catch { /* continue */ }
    }
    refetch();
  }, [notifications, refetch]);

  return (
    <div>
      {/* Page header */}
      <div className="ab-page-header">
        <div className="ab-page-title">
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <h1>Notifications</h1>
            {unreadCount > 0 && (
              <span
                style={{
                  background: "#1152d4", color: "#fff", fontSize: 11,
                  fontWeight: 700, padding: "2px 9px", borderRadius: 20,
                }}
              >
                {unreadCount} new
              </span>
            )}
          </div>
          <p style={{ fontSize: 13, color: "var(--ab-slate-500)", marginTop: 4 }}>
            Stay updated on orders, deliveries, and stock alerts
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          {unreadCount > 0 && (
            <button className="ab-btn-secondary" onClick={handleMarkAllRead}>
              <RiCheckDoubleLine size={15} /> Mark all read
            </button>
          )}
          <button className="ab-btn-secondary" onClick={refetch}>
            <RiRefreshLine size={15} /> Refresh
          </button>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="ab-card" style={{ padding: 0, overflow: "hidden" }}>
        {/* Tab bar */}
        <div
          style={{
            display: "flex", gap: 0, borderBottom: "1px solid var(--ab-slate-100)",
            padding: "0 20px", overflowX: "auto",
          }}
        >
          {FILTER_TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              style={{
                border: "none", background: "none", cursor: "pointer",
                padding: "14px 16px", fontSize: 13, fontWeight: 500,
                color: filter === tab.key ? "#1152d4" : "var(--ab-slate-500)",
                borderBottom: filter === tab.key ? "2px solid #1152d4" : "2px solid transparent",
                whiteSpace: "nowrap", transition: "color 0.15s",
              }}
            >
              {tab.label}
              {tab.key === "unread" && unreadCount > 0 && (
                <span
                  style={{
                    marginLeft: 6, background: "#fef3c7", color: "#d97706",
                    fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 10,
                  }}
                >
                  {unreadCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* List */}
        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: "var(--ab-slate-400)" }}>
            <RiNotification2Line size={32} style={{ marginBottom: 12, opacity: 0.4 }} />
            <p style={{ fontSize: 14 }}>Loading notifications…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 60, textAlign: "center" }}>
            <RiBellLine size={40} style={{ color: "var(--ab-slate-200)", marginBottom: 16 }} />
            <p style={{ fontSize: 15, fontWeight: 600, color: "var(--ab-slate-600)" }}>No notifications</p>
            <p style={{ fontSize: 13, color: "var(--ab-slate-400)", marginTop: 4 }}>
              {filter === "unread" ? "You're all caught up!" : "Nothing here yet."}
            </p>
          </div>
        ) : (
          filtered.map(n => (
            <NotificationCard
              key={n.id}
              notif={n}
              onMarkRead={handleMarkRead}
              marking={marking}
            />
          ))
        )}
      </div>
    </div>
  );
}
