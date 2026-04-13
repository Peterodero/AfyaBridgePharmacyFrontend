// import client from '../../services/api';
// import { useApi, useApiAction } from '../../hooks/useApi';


import { useState, useEffect, useCallback } from "react";
import {
  RiCalendarLine, RiAddLine, RiFilterLine,
  RiCheckLine, RiAlertLine, RiCloseCircleLine, RiUserLine,
  RiSearchLine, RiRefreshLine,
} from "react-icons/ri";
import client from "../../services/api";

// ── helpers ───────────────────────────────────────────────────────────────────
const PAGE_SIZE = 4;

const STATUS_MAP = {
  pending:   { label: "Pending",   cls: "pending"   },
  validated: { label: "Approved",  cls: "approved"  },
  rejected:  { label: "Rejected",  cls: "rejected"  },
  dispensed: { label: "Completed", cls: "completed" },
  delivered: { label: "Completed", cls: "completed" },
  draft:     { label: "Draft",     cls: "pending"   },
};

const TABS = ["pending", "validated", "rejected", "dispensed"];
const TAB_LABELS = { pending: "Pending", validated: "Approved", rejected: "Rejected", dispensed: "Completed" };

function InvBadge({ items }) {
  // Derive inventory status from items array
  if (!items || items.length === 0) return <span className="ab-inv-badge in-stock"><RiCheckLine size={13}/> In Stock</span>;
  const hasOut = items.some(i => i.stock_status === "CRITICAL" || i.quantity_in_stock === 0);
  const hasLow = items.some(i => i.stock_status === "LOW");
  if (hasOut) return <span className="ab-inv-badge out-stock"><RiCloseCircleLine size={13}/> Out of Stock</span>;
  if (hasLow) return <span className="ab-inv-badge low-stock"><RiAlertLine size={13}/> Low Stock</span>;
  return <span className="ab-inv-badge in-stock"><RiCheckLine size={13}/> In Stock</span>;
}

// ── main component ────────────────────────────────────────────────────────────
export default function Prescriptions() {
  const [activeTab,  setActiveTab]  = useState("pending");
  const [page,       setPage]       = useState(1);
  const [search,     setSearch]     = useState("");
  const [searchInput, setSearchInput] = useState("");

  // Data state
  const [prescriptions, setPrescriptions] = useState([]);
  const [counts,        setCounts]        = useState({ pending: 0, validated: 0, rejected: 0, dispensed: 0 });
  const [total,         setTotal]         = useState(0);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState(null);
  const [actionLoading, setActionLoading] = useState(null); // rx_id being actioned

  // Fetch prescriptions for current tab + page
  const fetchRx = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        status: activeTab,
        page,
        page_size: PAGE_SIZE,
      });
      if (search) params.set("q", search);

      const res  = await client.get(`/prescriptions/?${params}`);
      const body = res.data?.data ?? res.data;

      // Handle paginated response: { count, results } or flat array
      if (body?.results) {
        setPrescriptions(body.results);
        setTotal(body.count ?? body.results.length);
      } else {
        setPrescriptions(Array.isArray(body) ? body : []);
        setTotal(Array.isArray(body) ? body.length : 0);
      }
    } catch (e) {
      setError(e.response?.data?.message || e.message || "Failed to load prescriptions");
    } finally {
      setLoading(false);
    }
  }, [activeTab, page, search]);

  // Fetch counts for all tabs
  const fetchCounts = useCallback(async () => {
    try {
      const results = await Promise.allSettled(
        TABS.map(s => client.get(`/prescriptions/?status=${s}&page_size=1`))
      );
      const newCounts = {};
      TABS.forEach((s, i) => {
        if (results[i].status === "fulfilled") {
          const body = results[i].value.data?.data ?? results[i].value.data;
          newCounts[s] = body?.count ?? (Array.isArray(body) ? body.length : 0);
        } else {
          newCounts[s] = counts[s]; // keep old value on error
        }
      });
      setCounts(newCounts);
    } catch (_) {}
  }, []);

  useEffect(() => { fetchRx(); },     [fetchRx]);
  useEffect(() => { fetchCounts(); }, [fetchCounts]);

  // Reset to page 1 when tab or search changes
  useEffect(() => { setPage(1); }, [activeTab, search]);

  // ── actions ──────────────────────────────────────────────────────────────
  async function handleValidate(rx) {
    setActionLoading(rx.id);
    try {
      await client.post(`/prescriptions/${rx.id}/validate/`, {});
      await Promise.all([fetchRx(), fetchCounts()]);
    } catch (e) {
      alert(e.response?.data?.message || "Validation failed");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleDispense(rx) {
    setActionLoading(rx.id);
    try {
      const response = await client.post(`/prescriptions/${rx.id}/dispense/`, {});
      const data = response.data?.data || response.data;
      
      // Show success message with order details
      const orderInfo = data.order_id ? 
        ` (Order: ${data.order_number || data.order_id})` : '';
      const deliveryInfo = data.delivery_type === 'home_delivery' ? 
        ' - Delivery scheduled' : ' - Ready for pickup';
      
      alert(`Prescription dispensed successfully!${orderInfo}${deliveryInfo}`);
      
      await Promise.all([fetchRx(), fetchCounts()]);
    } catch (e) {
      const errorMsg = e.response?.data?.message || e.response?.data?.error || e.message;
      alert(`Dispensing failed: ${errorMsg}`);
    } finally {
      setActionLoading(null);
    }
  }

  async function handleReject(rx) {
    const reason = prompt("Enter rejection reason:");
    if (!reason) return;
    setActionLoading(rx.id);
    try {
      await client.post(`/prescriptions/${rx.id}/reject/`, { reason });
      await Promise.all([fetchRx(), fetchCounts()]);
    } catch (e) {
      alert(e.response?.data?.message || "Rejection failed");
    } finally {
      setActionLoading(null);
    }
  }

  // ── pagination ────────────────────────────────────────────────────────────
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1).slice(
    Math.max(0, page - 2), Math.min(totalPages, page + 1)
  );

  // ── action button per status ──────────────────────────────────────────────
  function ActionCell({ rx }) {
    const busy = actionLoading === rx.id;
    if (rx.status === "pending") return (
      <div style={{ display: "flex", gap: 6 }}>
        <button className="ab-btn-primary" style={{ padding: "5px 12px", fontSize: 12 }}
          disabled={busy} onClick={() => handleValidate(rx)}>
          {busy ? "…" : "Approve"}
        </button>
        <button style={{ padding: "5px 12px", fontSize: 12, background: "#FEE2E2", color: "#991B1B", border: "none", borderRadius: 6, cursor: "pointer" }}
          disabled={busy} onClick={() => handleReject(rx)}>
          Reject
        </button>
      </div>
    );
    if (rx.status === "validated") return (
      <button className="ab-btn-primary" style={{ padding: "5px 14px", fontSize: 12, background: "#059669" }}
        disabled={busy} onClick={() => handleDispense(rx)}>
        {busy ? "…" : "Dispense"}
      </button>
    );
    if (rx.status === "rejected") return (
      <span style={{ fontSize: 12, color: "#EF4444" }}>✕ Rejected</span>
    );
    return <span style={{ fontSize: 12, color: "#10B981" }}>✓ Done</span>;
  }

  return (
    <>
      {/* ── Header ── */}
      <div className="ab-page-header">
        <div className="ab-page-title">
          <h1>Prescription Management</h1>
          <p>Process incoming e-prescriptions from verified healthcare providers.</p>
        </div>
        <div className="d-flex gap-2 align-items-center">
          <button className="ab-btn-secondary" onClick={() => { fetchRx(); fetchCounts(); }}>
            <RiRefreshLine size={15} /> Refresh
          </button>
          <button className="ab-btn-secondary">
            <RiCalendarLine size={15} /> Today
          </button>
          <button className="ab-btn-primary">
            <RiAddLine size={14} /> New Prescription
          </button>
        </div>
      </div>

      {/* ── Tabs with live counts ── */}
      <div className="ab-tabs">
        {TABS.map(s => (
          <div
            key={s}
            className={`ab-tab ${activeTab === s ? "active" : ""}`}
            onClick={() => setActiveTab(s)}
          >
            {TAB_LABELS[s]}
            <span className="ab-tab-count">{counts[s] ?? "…"}</span>
          </div>
        ))}
      </div>

      <div className="ab-card">
        {/* ── Action bar with search ── */}
        <div className="ab-action-bar">
          <div className="d-flex align-items-center gap-2">
            <button className="ab-filter-btn">
              <RiFilterLine size={15} /> Filter Results
            </button>
            {/* Search */}
            <div style={{ display: "flex", alignItems: "center", border: "1px solid #E5E7EB", borderRadius: 8, padding: "5px 10px", gap: 6, background: "#fff" }}>
              <RiSearchLine size={14} color="#9CA3AF" />
              <input
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && setSearch(searchInput)}
                placeholder="Search patient name…"
                style={{ border: "none", outline: "none", fontSize: 13, width: 180, color: "#111827" }}
              />
              {searchInput && (
                <button onClick={() => { setSearchInput(""); setSearch(""); }}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "#9CA3AF", fontSize: 14, padding: 0 }}>✕</button>
              )}
            </div>
          </div>
          <span style={{ fontSize: 13, color: "var(--ab-slate-400)" }}>
            {loading ? "Loading…" : `Showing ${total} ${TAB_LABELS[activeTab].toLowerCase()} prescriptions`}
          </span>
        </div>

        {/* ── Table ── */}
        {error ? (
          <div style={{ padding: 32, textAlign: "center", color: "#EF4444" }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>⚠</div>
            <div>{error}</div>
          </div>
        ) : (
          <table className="ab-table">
            <thead>
              <tr>
                <th>Patient Details</th>
                <th>Prescribing Doctor</th>
                <th>Medication &amp; Dosage</th>
                <th>Inventory</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                // Skeleton rows
                Array.from({ length: PAGE_SIZE }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j}>
                        <div style={{ height: 16, background: "#F3F4F6", borderRadius: 4, animation: "pulse 1.5s infinite" }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : prescriptions.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: 40, color: "#9CA3AF" }}>
                    No {TAB_LABELS[activeTab].toLowerCase()} prescriptions found.
                  </td>
                </tr>
              ) : (
                prescriptions.map((rx, i) => {
                  const st = STATUS_MAP[rx.status] || { label: rx.status, cls: "pending" };
                  // First item in items array for medication display
                  const firstItem = rx.items?.[0];
                  return (
                    <tr key={rx.id || i}>
                      <td>
                        <div className="ab-med-name">{rx.patient_name}</div>
                        <div className="ab-med-sub">
                          #{rx.prescription_number || rx.id?.slice(0, 8).toUpperCase()}
                        </div>
                      </td>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <div className="ab-update-icon blue" style={{ width: 28, height: 28 }}>
                            <RiUserLine size={12} />
                          </div>
                          {rx.doctor_name}
                        </div>
                      </td>
                      <td>
                        {firstItem ? (
                          <>
                            <div style={{ fontWeight: 600, color: "var(--ab-slate-800)" }}>
                              {firstItem.drug_name}
                              {rx.items.length > 1 && (
                                <span style={{ fontSize: 11, color: "#9CA3AF", marginLeft: 6 }}>+{rx.items.length - 1} more</span>
                              )}
                            </div>
                            <div style={{ fontSize: 12, color: "var(--ab-slate-400)" }}>
                              {firstItem.dosage} • Qty: {firstItem.quantity} • {firstItem.frequency}
                            </div>
                          </>
                        ) : (
                          <span style={{ color: "#9CA3AF", fontSize: 13 }}>No items</span>
                        )}
                      </td>
                      <td><InvBadge items={rx.items} /></td>
                      <td>
                        <span className={`ab-status ${st.cls}`}>{st.label}</span>
                      </td>
                      <td><ActionCell rx={rx} /></td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        )}

        {/* ── Pagination ── */}
        {!loading && total > PAGE_SIZE && (
          <div className="ab-pagination">
            <div className="ab-page-info">
              Showing <strong>{(page - 1) * PAGE_SIZE + 1} to {Math.min(page * PAGE_SIZE, total)}</strong> of {total} prescriptions
            </div>
            <div className="ab-page-btns">
              <button className="ab-page-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                Previous
              </button>
              {pageNumbers.map(n => (
                <button key={n} className={`ab-page-btn ${page === n ? "active" : ""}`} onClick={() => setPage(n)}>
                  {n}
                </button>
              ))}
              <button className="ab-page-btn" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
      `}</style>
    </>
  );
}
