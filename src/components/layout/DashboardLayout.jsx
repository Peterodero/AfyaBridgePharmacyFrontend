import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useSelector } from "react-redux";
import { useState, useEffect } from "react";
import pharmacyLogo from "../../assets/logo.jpeg";
import {
  RiDashboardLine,
  RiArchiveLine,
  RiTruckLine,
  RiBankCardLine,
  RiBarChartLine,
  RiSettings3Line,
  RiLogoutBoxLine,
  RiSearchLine,
  RiQuestionLine,
  RiShieldLine,
  RiMenuLine,
  RiShoppingCartLine,
  RiNotification2Line,
} from "react-icons/ri";
import "../../styles/dashboard.css";

const NAV_ITEMS = [
  { icon: RiDashboardLine, label: "Dashboard", to: "/dashboard" },
  { icon: RiShoppingCartLine, label: "Orders", to: "/dashboard/orders" },
  { icon: RiArchiveLine, label: "Inventory", to: "/dashboard/inventory" },
  { icon: RiTruckLine, label: "Deliveries", to: "/dashboard/deliveries" },
  { icon: RiBankCardLine, label: "Payments", to: "/dashboard/payments" },
  { icon: RiBarChartLine, label: "Analytics", to: "/dashboard/analytics" },
  {
    icon: RiNotification2Line,
    label: "Notifications",
    to: "/dashboard/notifications",
  },
  { icon: RiQuestionLine, label: "Help", to: "/dashboard/help" },
];

const TOPBAR_META = {
  "/dashboard": {
    crumbs: [{ label: "Dashboard", active: true }],
    search: "Search medications, patients, or orders...",
    showStatus: true,
  },
  "/dashboard/orders": {
    crumbs: [
      { label: "Orders", active: false },
      { label: "Order Management", active: true },
    ],
    search: "Search orders...",
    showStatus: false,
  },
  "/dashboard/inventory": {
    crumbs: [
      { label: "Inventory", active: false },
      { label: "Medicine List", active: true },
    ],
    search: "Global search...",
    showStatus: true,
  },
  "/dashboard/deliveries": {
    crumbs: [
      { label: "Deliveries", active: false },
      { label: "Coordination", active: true },
    ],
    search: "Track order ID or facility...",
    showStatus: true,
  },
  "/dashboard/payments": {
    crumbs: [
      { label: "Payments", active: false },
      { label: "Financial Overview", active: true },
    ],
    search: "Search transactions...",
    showStatus: false,
  },
  "/dashboard/analytics": {
    crumbs: [
      { label: "Analytics", active: false },
      { label: "Overview", active: true },
    ],
    search: "Search analytics...",
    showStatus: false,
  },
  "/dashboard/settings": {
    crumbs: [
      { label: "Settings", active: false },
      { label: "Pharmacy Portal", active: true },
    ],
    search: "Search settings...",
    showStatus: false,
  },
  "/dashboard/notifications": {
    crumbs: [
      { label: "Notifications", active: false },
      { label: "Inbox", active: true },
    ],
    search: "Search notifications...",
    showStatus: false,
  },
  "/dashboard/help": {
    crumbs: [
      { label: "Help", active: false },
      { label: "Support Center", active: true },
    ],
    search: "Search help articles...",
    showStatus: false,
  },
};

export default function DashboardLayout({ children }) {
  const { location } = useRouterState();
  const navigate = useNavigate();
  const path = location.pathname;
  const { user } = useSelector((state) => state.auth);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    setSidebarOpen(false);
  }, [path]);

  const pharmacyName = user?.full_name || "AfyaBridge Pharmacy";
  const pharmacyImage = user?.profile_image || null;
  const userName = user?.full_name || "User";
  const userRole = user?.role?.replace("_", " ") || "Pharmacy Staff";
  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  const meta = TOPBAR_META[path] || TOPBAR_META["/dashboard"];

  function handleLogout() {
    // const token = localStorage.getItem("access_token");
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user_data");
    navigate({ to: "/auth/login" });
    // window.location.href = "/auth/login";
  }

  return (
    <div className="ab-wrapper">
      <div
        className={`ab-sidebar-overlay ${sidebarOpen ? "open" : ""}`}
        onClick={() => setSidebarOpen(false)}
      />

      <aside className={`ab-sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="ab-brand">
          {pharmacyLogo ? (
            <img
              src={pharmacyLogo}
              alt="logo"
              style={{
                width: 44,
                height: 44,
                borderRadius: 8,
                objectFit: "cover",
              }}
            />
          ) : (
            <div className="ab-brand-icon">
              <RiShieldLine size={20} color="white" />
            </div>
          )}
          <div>
            <div className="ab-brand-name">{pharmacyName}</div>
            <div className="ab-brand-sub">Pharmacy Portal</div>
          </div>
        </div>

        <nav className="ab-nav">
          {NAV_ITEMS.map(({ icon: Icon, label, to }) => {
            const active = path === to || path === to + "/";
            return (
              <Link
                key={to}
                to={to}
                className={`ab-nav-item ${active ? "active" : ""}`}
                activeProps={{}}
                activeOptions={{ exact: true }}
              >
                <Icon size={18} />
                <span>{label}</span>
              </Link>
            );
          })}

          <div className="ab-nav-section">System</div>

          <Link
            to="/dashboard/settings"
            className={`ab-nav-item ${path === "/dashboard/settings" ? "active" : ""}`}
            activeProps={{}}
            activeOptions={{ exact: true }}
          >
            <RiSettings3Line size={18} />
            <span>Settings</span>
          </Link>
          <button onClick={handleLogout} className="ab-nav-item logout">
            <RiLogoutBoxLine size={18} />
            <span>Logout</span>
          </button>
        </nav>

        <div className="ab-sidebar-footer">
          <div className="ab-user-avatar">{initials}</div>
          <div>
            <div className="ab-user-name">{userName}</div>
            <div className="ab-user-role">{userRole}</div>
          </div>
        </div>
      </aside>

      <div className="ab-main">
        <header className="ab-topbar">
          <div style={{ display: "flex", alignItems: "center" }}>
            <button
              className="ab-menu-toggle"
              onClick={() => setSidebarOpen((o) => !o)}
              aria-label="Toggle menu"
            >
              <RiMenuLine size={22} />
            </button>
            <div className="ab-breadcrumb">
              {meta.crumbs.map((crumb, i) => (
                <span
                  key={i}
                  style={{ display: "flex", alignItems: "center", gap: 6 }}
                >
                  {i > 0 && <span className="ab-sep">/</span>}
                  <span
                    className={
                      crumb.active ? "ab-crumb-active" : "ab-crumb-parent"
                    }
                  >
                    {crumb.label}
                  </span>
                </span>
              ))}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {/* Search */}
            <div className="ab-search-wrap">
              <RiSearchLine className="ab-search-icon" size={14} />
              <input
                className="ab-search"
                placeholder={meta.search || "Search..."}
              />
            </div>

            {/* Notification Bell */}
            <button
              className="relative bg-transparent border-none cursor-pointer p-2 rounded-lg hover:bg-gray-100 transition-colors"
              onClick={() => navigate({ to: "/dashboard/notifications" })}
            >
              <RiNotification2Line size={20} className="text-gray-600" />
            </button>

            {/* Help/Question */}
            <button
              className="bg-transparent border-none cursor-pointer p-2 rounded-lg hover:bg-gray-100 transition-colors"
              onClick={() => navigate({ to: "/dashboard/help" })}
            >
              <RiQuestionLine size={20} className="text-gray-400" />
            </button>

            {/* Pharmacy Logo/Name */}
            {meta.showStatus && (
              <div className="ab-online-badge">
                <span className="ab-online-dot" />
                {pharmacyName}
              </div>
            )}

            {/* Pharmacy Logo Image - ADD THIS */}
            {pharmacyLogo && (
              <div className="ab-pharmacy-logo">
                <img
                  src={pharmacyImage}
                  alt="Pharmacy Logo"
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    objectFit: "cover",
                  }}
                />
              </div>
            )}
          </div>
        </header>
        <div className="ab-content">{children}</div>
      </div>
    </div>
  );
}
