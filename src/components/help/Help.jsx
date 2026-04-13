import { useState } from "react";
import {
  RiQuestionLine, RiSearchLine, RiArrowDownSLine, RiArrowUpSLine,
  RiPhoneLine, RiMailLine, RiBookOpenLine, RiVideoLine,
  RiShieldLine, RiFileListLine, RiShoppingCartLine, RiTruckLine,
  RiArchiveLine, RiBankCardLine, RiUserLine, RiExternalLinkLine,
} from "react-icons/ri";

const FAQ_DATA = [
  {
    category: "Getting Started",
    icon: RiBookOpenLine,
    color: "#1152d4",
    bg: "#eff6ff",
    items: [
      {
        q: "How do I link my pharmacy to my account?",
        a: "Your pharmacy is automatically linked when you complete registration. If your account shows 'Not Linked', it means your application is pending admin approval. Contact support if it has been more than 48 hours."
      },
      {
        q: "How do I update my pharmacy information?",
        a: "Go to Settings → Pharmacy Settings to update your pharmacy name, contact info, operating hours, and delivery zones. Profile information like your name and phone can be updated under Settings → Profile."
      },
      {
        q: "How do I change my password?",
        a: "Navigate to Settings → Security & Legal, then scroll to the Change Password section. You'll need to provide your current password and a new password (minimum 8 characters with uppercase, number, and symbol)."
      },
    ],
  },
  {
    category: "Orders & Prescriptions",
    icon: RiShoppingCartLine,
    color: "#059669",
    bg: "#f0fdf4",
    items: [
      {
        q: "What is the order lifecycle?",
        a: "Orders follow this path: Pending → Processing → Ready → Delivered (for walk-in/pickup) or Dispatched (for home delivery). You can update each order's status from the Orders page. Cancelled orders can only be done before dispatch."
      },
      {
        q: "How do I dispense an order to a walk-in patient?",
        a: "Set the order status to 'Ready', then click 'Dispense'. The order must have delivery type 'Pickup' and you must have sufficient stock. The system will automatically deduct inventory and mark the order as delivered."
      },
      {
        q: "How do I assign a rider for home delivery?",
        a: "Once an order is in 'Ready' status with delivery type 'Home Delivery', click 'Assign Rider'. Select an on-duty rider from the list. The system will generate an OTP for delivery confirmation and change the order to 'Dispatched'."
      },
      {
        q: "Can I cancel an order?",
        a: "Yes, you can cancel any order that hasn't been dispatched or delivered. Go to the order details and click 'Cancel Order'. You can optionally provide a reason for cancellation."
      },
    ],
  },
  {
    category: "Inventory Management",
    icon: RiArchiveLine,
    color: "#9333ea",
    bg: "#fdf4ff",
    items: [
      {
        q: "How do I add a new drug to inventory?",
        a: "Go to Inventory and click 'Add Drug'. Fill in the drug name, category, quantity, reorder level, dosage form, and unit price. The drug will be immediately visible in your inventory."
      },
      {
        q: "What does 'Low Stock' mean?",
        a: "A drug is flagged as low stock when its quantity in stock falls at or below its reorder level. You'll see a Low Stock alert in your dashboard and can view all low-stock items from Inventory → Low Stock tab."
      },
      {
        q: "How do I restock a drug?",
        a: "Click the restock icon on any drug in the inventory table, then enter the quantity to add, batch number, and expiry date. This creates a batch record and increases the stock level automatically."
      },
      {
        q: "How does expiry tracking work?",
        a: "The system tracks expiry dates per batch. The dashboard shows drugs expiring within 30 days. You can view expiring items in the Inventory page under the Expiring tab. Always restock before expiry dates approach."
      },
    ],
  },
  {
    category: "Deliveries",
    icon: RiTruckLine,
    color: "#d97706",
    bg: "#fffbeb",
    items: [
      {
        q: "How do I track a delivery?",
        a: "Go to the Deliveries page to see all active and completed deliveries. Each delivery shows its status (Assigned, Picked Up, In Transit, Delivered, Failed) and the rider's location if GPS is available."
      },
      {
        q: "What is the OTP delivery confirmation?",
        a: "When a rider is assigned, an OTP is generated. The patient provides this OTP to the rider upon receiving the package. You can also confirm delivery from the pharmacy side by entering the OTP in the delivery details."
      },
      {
        q: "What happens if a delivery fails?",
        a: "A failed delivery can be re-attempted by updating the delivery status and re-assigning a rider. Contact the patient to confirm their address and availability before re-dispatching."
      },
    ],
  },
  {
    category: "Payments & Financials",
    icon: RiBankCardLine,
    color: "#0891b2",
    bg: "#ecfeff",
    items: [
      {
        q: "How is revenue tracked?",
        a: "Revenue is tracked from delivered orders. The Payments page shows a breakdown by payment method (M-Pesa, Cash, Insurance) and payment status. Today's revenue is shown on the dashboard."
      },
      {
        q: "What payment methods are supported?",
        a: "AfyaBridge supports M-Pesa (Paybill/Till), Cash, and Insurance payments. Payment method and status are recorded with each order."
      },
    ],
  },
];

function FaqItem({ item }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      style={{
        borderBottom: "1px solid var(--ab-slate-100)",
        overflow: "hidden",
      }}
    >
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: "100%", display: "flex", alignItems: "center",
          justifyContent: "space-between", gap: 12,
          padding: "16px 20px", border: "none", background: "none",
          cursor: "pointer", textAlign: "left",
        }}
      >
        <span style={{ fontSize: 14, fontWeight: 500, color: "var(--ab-slate-800)", lineHeight: 1.4 }}>
          {item.q}
        </span>
        {open
          ? <RiArrowUpSLine size={18} color="#1152d4" style={{ flexShrink: 0 }} />
          : <RiArrowDownSLine size={18} color="var(--ab-slate-400)" style={{ flexShrink: 0 }} />
        }
      </button>
      {open && (
        <div style={{ padding: "0 20px 16px", fontSize: 13, color: "var(--ab-slate-600)", lineHeight: 1.6 }}>
          {item.a}
        </div>
      )}
    </div>
  );
}

export default function Help() {
  const [search, setSearch] = useState("");

  const filtered = FAQ_DATA.map(cat => ({
    ...cat,
    items: cat.items.filter(
      item =>
        !search ||
        item.q.toLowerCase().includes(search.toLowerCase()) ||
        item.a.toLowerCase().includes(search.toLowerCase())
    ),
  })).filter(cat => cat.items.length > 0);

  return (
    <div>
      {/* Header */}
      <div className="ab-page-header">
        <div className="ab-page-title">
          <h1>Help & Support</h1>
          <p style={{ fontSize: 13, color: "var(--ab-slate-500)", marginTop: 4 }}>
            Find answers to common questions or reach out to our team
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="ab-card" style={{ marginBottom: 20, padding: "20px" }}>
        <div style={{ position: "relative", maxWidth: 520 }}>
          <RiSearchLine
            size={16}
            style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--ab-slate-400)" }}
          />
          <input
            type="text"
            placeholder="Search help articles…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: "100%", padding: "10px 14px 10px 36px",
              border: "1px solid var(--ab-slate-200)", borderRadius: 8,
              fontSize: 14, outline: "none", background: "var(--ab-slate-50)",
            }}
          />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 20, alignItems: "start" }}>
        {/* FAQ */}
        <div>
          {filtered.length === 0 ? (
            <div className="ab-card" style={{ padding: 40, textAlign: "center" }}>
              <RiQuestionLine size={36} style={{ color: "var(--ab-slate-200)", marginBottom: 12 }} />
              <p style={{ fontSize: 15, fontWeight: 600, color: "var(--ab-slate-600)" }}>No results found</p>
              <p style={{ fontSize: 13, color: "var(--ab-slate-400)", marginTop: 4 }}>
                Try a different search term or browse the categories below
              </p>
            </div>
          ) : (
            filtered.map(cat => {
              const Icon = cat.icon;
              return (
                <div key={cat.category} className="ab-card" style={{ marginBottom: 16, padding: 0, overflow: "hidden" }}>
                  <div
                    style={{
                      display: "flex", alignItems: "center", gap: 10,
                      padding: "16px 20px", borderBottom: "1px solid var(--ab-slate-100)",
                      background: "var(--ab-slate-50)",
                    }}
                  >
                    <div
                      style={{
                        width: 32, height: 32, borderRadius: 8,
                        background: cat.bg, color: cat.color,
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}
                    >
                      <Icon size={16} />
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 600, color: "var(--ab-slate-800)" }}>
                      {cat.category}
                    </span>
                    <span
                      style={{
                        marginLeft: "auto", fontSize: 11, color: "var(--ab-slate-400)",
                        background: "var(--ab-slate-100)", padding: "2px 8px", borderRadius: 10,
                      }}
                    >
                      {cat.items.length} articles
                    </span>
                  </div>
                  {cat.items.map((item, i) => <FaqItem key={i} item={item} />)}
                </div>
              );
            })
          )}
        </div>

        {/* Sidebar */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Contact support */}
          <div className="ab-card" style={{ padding: 20 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: "var(--ab-slate-800)", marginBottom: 16 }}>
              Contact Support
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <a
                href="tel:+254700000000"
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "12px 14px", borderRadius: 8, border: "1px solid var(--ab-slate-200)",
                  textDecoration: "none", color: "var(--ab-slate-700)", fontSize: 13,
                  transition: "border-color 0.15s",
                }}
              >
                <RiPhoneLine size={16} color="#059669" />
                <div>
                  <div style={{ fontWeight: 600 }}>Call Support</div>
                  <div style={{ fontSize: 11, color: "var(--ab-slate-400)" }}>Mon–Fri, 8am–6pm</div>
                </div>
              </a>
              <a
                href="mailto:support@afyabridge.com"
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "12px 14px", borderRadius: 8, border: "1px solid var(--ab-slate-200)",
                  textDecoration: "none", color: "var(--ab-slate-700)", fontSize: 13,
                }}
              >
                <RiMailLine size={16} color="#1152d4" />
                <div>
                  <div style={{ fontWeight: 600 }}>Email Support</div>
                  <div style={{ fontSize: 11, color: "var(--ab-slate-400)" }}>support@afyabridge.com</div>
                </div>
              </a>
            </div>
          </div>

          {/* Quick links */}
          <div className="ab-card" style={{ padding: 20 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: "var(--ab-slate-800)", marginBottom: 16 }}>
              Quick Links
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                { icon: RiFileListLine,   label: "API Documentation", color: "#9333ea" },
                { icon: RiVideoLine, label: "Video Tutorials",   color: "#d97706" },
                { icon: RiShieldLine,     label: "Privacy Policy",     color: "#059669" },
                { icon: RiUserLine,       label: "Account Settings",   color: "#1152d4", href: "/dashboard/settings" },
              ].map((link, i) => {
                const Icon = link.icon;
                return (
                  <a
                    key={i}
                    href={link.href || "#"}
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "10px 12px", borderRadius: 8, border: "1px solid var(--ab-slate-100)",
                      textDecoration: "none", color: "var(--ab-slate-700)", fontSize: 13,
                      background: "var(--ab-slate-50)",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <Icon size={15} color={link.color} />
                      {link.label}
                    </div>
                    <RiExternalLinkLine size={12} color="var(--ab-slate-300)" />
                  </a>
                );
              })}
            </div>
          </div>

          {/* System status */}
          <div className="ab-card" style={{ padding: 20 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: "var(--ab-slate-800)", marginBottom: 12 }}>
              System Status
            </h3>
            {[
              { label: "API Services",      status: "Operational" },
              { label: "Order Processing",  status: "Operational" },
              { label: "Payment Gateway",   status: "Operational" },
              { label: "Delivery Tracking", status: "Operational" },
            ].map((s, i) => (
              <div
                key={i}
                style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "8px 0", borderBottom: i < 3 ? "1px solid var(--ab-slate-100)" : "none",
                  fontSize: 13,
                }}
              >
                <span style={{ color: "var(--ab-slate-600)" }}>{s.label}</span>
                <span
                  style={{
                    display: "flex", alignItems: "center", gap: 5,
                    color: "#059669", fontWeight: 500, fontSize: 12,
                  }}
                >
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#059669" }} />
                  {s.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
