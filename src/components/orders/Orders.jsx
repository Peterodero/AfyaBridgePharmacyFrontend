import { useState, useEffect, useCallback } from "react";
import {
  RiRefreshLine, RiSearchLine, RiCheckLine, RiCloseLine,
  RiTruckLine, RiAlertLine, RiEyeLine, RiUserStarLine,
} from "react-icons/ri";
import {
  getAvailableOrders, updateOrderStatus, cancelOrder,
  dispenseOrder, assignRiderToOrder, getAvailableRiders, serveOrder,
} from "../../services/api";
import OrderDetailsModal from "./OrderDetailsModal";

const PAGE_SIZE = 8;

const STATUS_TABS = ["pending", "ready", "cancelled"];
const TAB_LABELS  = { pending: "Pending", ready: "Ready", cancelled: "Cancelled" };
const STATUS_CLS  = { pending: "pending", ready: "approved", delivered: "completed", cancelled: "rejected" };

// ── All modals and ActionCell outside Orders to prevent remount on re-render ──

function ServeModal({ order, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const items = order.prescription?.items ?? order.items ?? [];

  async function handleServe() {
    setLoading(true);
    try {
      const res = await serveOrder(order.id);
      onSuccess(res.data?.data ?? res.data);
    } catch (e) {
      alert(e.response?.data?.message || "Failed to serve order");
    } finally { setLoading(false); }
  }

  return (
    <div className="ab-modal-overlay" onClick={onClose}>
      <div className="ab-modal" style={{ maxWidth: 440 }} onClick={e => e.stopPropagation()}>
        <div className="ab-modal-header">
          <h3>Serve Patient — {order.order_number}</h3>
          <button className="ab-modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="ab-modal-body">
          <p style={{ fontSize: 13, color: "var(--ab-slate-600)", marginBottom: 16 }}>
            Confirm that patient <strong>{order.patient_name}</strong> has been served.
            This will mark the order as <strong>delivered</strong> and update inventory.
          </p>
          <div style={{ background: "var(--ab-slate-50)", borderRadius: 8, padding: "10px 14px", marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ab-slate-700)", marginBottom: 8 }}>Order Summary:</div>
            {items.length > 0 ? items.map((it, i) => (
              <div key={i} style={{ fontSize: 13, color: "var(--ab-slate-700)", marginBottom: 4 }}>
                • {it.name || it.drug_name} — {it.dosage}, qty {it.quantity || "N/A"}
              </div>
            )) : (
              <div style={{ fontSize: 13, color: "var(--ab-slate-400)" }}>No items listed.</div>
            )}
          </div>
          <div className="ab-form-group">
            <label>Action</label>
            <div style={{ fontSize: 13, color: "#059669", fontWeight: 500 }}>
              This will complete the order and deduct stock from inventory.
            </div>
          </div>
        </div>
        <div className="ab-modal-footer">
          <button className="ab-btn-secondary" onClick={onClose}>Cancel</button>
          <button className="ab-btn-primary" disabled={loading} onClick={handleServe} style={{ background: "#059669" }}>
            <RiUserStarLine size={14} /> {loading ? "Processing…" : "Confirm Serve"}
          </button>
        </div>
      </div>
    </div>
  );
}

function AssignRiderModal({ order, onClose, onSuccess }) {
  const [riders,   setRiders]   = useState([]);
  const [riderId,  setRiderId]  = useState("");
  const [notes,    setNotes]    = useState("");
  const [charges,  setCharges]  = useState("");
  const [etaText,  setEtaText]  = useState("");
  const [loading,  setLoading]  = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    getAvailableRiders()
      .then(r => setRiders(r.data?.data ?? r.data ?? []))
      .catch(() => setRiders([]))
      .finally(() => setFetching(false));
  }, []);

  async function handleAssign() {
    if (!riderId) return;
    setLoading(true);
    try {
      const res = await assignRiderToOrder(order.id, {
        rider_id: riderId,
        delivery_notes: notes || undefined,
        charges: charges ? Number(charges) : undefined,
        estimated_delivery_time: etaText || undefined,
      });
      onSuccess(res.data?.data ?? res.data);
    } catch (e) {
      alert(e.response?.data?.message || "Failed to assign rider");
    } finally { setLoading(false); }
  }

  return (
    <div className="ab-modal-overlay" onClick={onClose}>
      <div className="ab-modal" style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>
        <div className="ab-modal-header">
          <h3>Assign Rider — {order.order_number}</h3>
          <button className="ab-modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="ab-modal-body">
          <div className="ab-form-group" style={{ marginBottom: 16 }}>
            <label>Select Rider *</label>
            {fetching ? (
              <div style={{ fontSize: 13, color: "var(--ab-slate-400)" }}>Loading riders…</div>
            ) : riders.length === 0 ? (
              <div style={{ fontSize: 13, color: "#dc2626" }}>No riders currently on duty.</div>
            ) : (
              <select className="ab-select" value={riderId} onChange={e => setRiderId(e.target.value)} style={{ width: "100%" }}>
                <option value="">— Choose a rider —</option>
                {riders.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.full_name} · {r.vehicle_type} ({r.plate_number})
                  </option>
                ))}
              </select>
            )}
          </div>
          <div className="ab-form-row">
            <div className="ab-form-group">
              <label>Delivery Fee (KES)</label>
              <input type="number" min="0" value={charges} onChange={e => setCharges(e.target.value)} placeholder="e.g. 250" />
            </div>
            <div className="ab-form-group">
              <label>ETA</label>
              <input type="text" value={etaText} onChange={e => setEtaText(e.target.value)} placeholder="e.g. 45 minutes" />
            </div>
          </div>
          <div className="ab-form-group">
            <label>Delivery Notes</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Special instructions for the rider…" />
          </div>
        </div>
        <div className="ab-modal-footer">
          <button className="ab-btn-secondary" onClick={onClose}>Cancel</button>
          <button className="ab-btn-primary" disabled={!riderId || loading || fetching} onClick={handleAssign}>
            <RiTruckLine size={14} /> {loading ? "Assigning…" : "Assign Rider"}
          </button>
        </div>
      </div>
    </div>
  );
}

function DispenseModal({ order, onClose, onSuccess }) {
  const [instructions, setInstructions] = useState("");
  const [loading,      setLoading]      = useState(false);
  const items = order.prescription?.items ?? [];

  async function handleDispense() {
    setLoading(true);
    try {
      const res = await dispenseOrder(order.id, instructions ? { instructions } : {});
      onSuccess(res.data?.data ?? res.data);
    } catch (e) {
      const err         = e.response?.data;
      const stockErrors = err?.errors?.stock_errors;
      alert(stockErrors ? stockErrors.join("\n") : err?.message || "Dispense failed");
    } finally { setLoading(false); }
  }

  return (
    <div className="ab-modal-overlay" onClick={onClose}>
      <div className="ab-modal" style={{ maxWidth: 440 }} onClick={e => e.stopPropagation()}>
        <div className="ab-modal-header">
          <h3>Dispense to Patient — {order.order_number}</h3>
          <button className="ab-modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="ab-modal-body">
          <p style={{ fontSize: 13, color: "var(--ab-slate-600)", marginBottom: 16 }}>
            Patient <strong>{order.patient_name}</strong> is here for pickup.
            This will deduct stock and mark the order as <strong>delivered</strong>.
          </p>
          <div style={{ background: "var(--ab-slate-50)", borderRadius: 8, padding: "10px 14px", marginBottom: 16 }}>
            {items.length > 0 ? items.map((it, i) => (
              <div key={i} style={{ fontSize: 13, color: "var(--ab-slate-700)", marginBottom: 4 }}>
                • {it.name} — {it.dosage}, qty {it.quantity || "N/A"}
              </div>
            )) : (
              <div style={{ fontSize: 13, color: "var(--ab-slate-400)" }}>No items listed.</div>
            )}
          </div>
          <div className="ab-form-group">
            <label>Dispensing Instructions (optional)</label>
            <textarea rows={2} value={instructions} onChange={e => setInstructions(e.target.value)} placeholder="e.g. Take with food…" />
          </div>
        </div>
        <div className="ab-modal-footer">
          <button className="ab-btn-secondary" onClick={onClose}>Cancel</button>
          <button className="ab-btn-primary" disabled={loading} onClick={handleDispense} style={{ background: "#059669" }}>
            <RiCheckLine size={14} /> {loading ? "Dispensing…" : "Confirm Dispense"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ActionCell({ order, actionLoading, onView, onServe, onCancel, onStatusUpdate, onDispense, onAssignRider }) {
  const busy = actionLoading === order.id;
  const s    = order.status;
  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
      <button className="ab-btn-view" style={{ fontSize: 12, padding: "5px 10px" }} onClick={() => onView(order)}>
        <RiEyeLine size={12} /> View
      </button>
      {s === "pending" && (
        <button className="ab-btn-primary" style={{ fontSize: 12, padding: "5px 12px", background: "#059669" }}
          disabled={busy} onClick={() => onServe(order)}>
          <RiUserStarLine size={12} /> Serve
        </button>
      )}
      {s === "pending" && (
        <button style={{ fontSize: 12, padding: "5px 10px", background: "#fee2e2", color: "#991b1b", border: "none", borderRadius: 6, cursor: "pointer" }}
          disabled={busy} onClick={() => onCancel(order)}>
          <RiCloseLine size={12} /> Cancel
        </button>
      )}
      {s === "ready" && (
        <button className="ab-btn-primary" style={{ fontSize: 12, padding: "5px 12px" }}
          disabled={busy} onClick={() => onStatusUpdate(order, "delivered")}>
          <RiCheckLine size={12} /> Mark Delivered
        </button>
      )}
      {s === "ready" && order.delivery_type === "pickup" && (
        <button className="ab-btn-primary" style={{ fontSize: 12, padding: "5px 12px", background: "#059669" }}
          disabled={busy} onClick={() => onDispense(order)}>
          <RiCheckLine size={12} /> Dispense
        </button>
      )}
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function renderMedicationColumn(order) {
  const items = order.prescription?.items ?? [];
  if (items.length > 0) {
    const first = items[0];
    return (
      <>
        <div style={{ fontWeight: 600, fontSize: 13 }}>{first.name || "—"}</div>
        <div style={{ fontSize: 11, color: "var(--ab-slate-400)" }}>
          {first.dosage || ""}
          {first.frequency && ` · ${first.frequency}`}
          {first.duration  && ` · ${first.duration}`}
          {items.length > 1 && <span style={{ color: "#9ca3af" }}> +{items.length - 1} more</span>}
        </div>
      </>
    );
  }
  return <span style={{ color: "#9ca3af", fontSize: 13 }}>—</span>;
}

function getDeliveryTypeDisplay(order) {
  if (order.delivery_type === "home_delivery") return "Delivery";
  if (order.delivery_type === "pickup")        return "Pickup";
  return order.delivery_type || "—";
}

function getDeliveryTypeStyles(order) {
  const isPickup = order.delivery_type === "pickup";
  return { background: isPickup ? "#eff6ff" : "#f5f3ff", color: isPickup ? "#1152d4" : "#7c3aed" };
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function Orders() {
  const [activeTab,    setActiveTab]    = useState("pending");
  const [page,         setPage]         = useState(1);
  const [search,       setSearch]       = useState("");
  const [searchInput,  setSearchInput]  = useState("");
  const [priority,     setPriority]     = useState("");
  const [allOrders,    setAllOrders]    = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(null);
  const [dispenseTarget, setDispenseTarget] = useState(null);
  const [riderTarget,    setRiderTarget]    = useState(null);
  const [serveTarget,    setServeTarget]    = useState(null);
  const [viewOrder,      setViewOrder]      = useState(null);
  const [actionLoading,  setActionLoading]  = useState(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res  = await getAvailableOrders();
      const body = res.data?.data ?? res.data;
      const list = Array.isArray(body) ? body : (body?.results ?? []);
      setAllOrders(list);
    } catch (e) {
      setError(e.response?.data?.message || e.message || "Failed to load orders");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);
  useEffect(() => { setPage(1); }, [activeTab, search, priority]);

  const filtered = allOrders.filter(o => {
    if (o.status !== activeTab) return false;
    if (priority && o.priority !== priority) return false;
    if (search && !o.patient_name?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  // Counts from allOrders — always accurate, no extra API calls
  const counts = STATUS_TABS.reduce((acc, s) => {
    acc[s] = allOrders.filter(o => o.status === s).length;
    return acc;
  }, {});

  const total      = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const pageOrders = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  async function handleStatusUpdate(order, newStatus) {
    setActionLoading(order.id);
    try {
      await updateOrderStatus(order.id, { status: newStatus });
      await fetchOrders();
    } catch (e) {
      alert(e.response?.data?.message || "Update failed");
    } finally { setActionLoading(null); }
  }

  async function handleCancel(order) {
    const reason = prompt("Reason for cancellation (optional):");
    if (reason === null) return;
    setActionLoading(order.id);
    try {
      await cancelOrder(order.id, reason ? { reason } : {});
      await fetchOrders();
    } catch (e) {
      alert(e.response?.data?.message || "Cancel failed");
    } finally { setActionLoading(null); }
  }

  return (
    <>
      <div className="ab-page-header">
        <div className="ab-page-title">
          <h1>Order Management</h1>
          <p>Fulfill prescription orders — dispense pickups or assign delivery riders.</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="ab-btn-secondary" onClick={fetchOrders}>
            <RiRefreshLine size={15} /> Refresh
          </button>
        </div>
      </div>

      <div className="ab-tabs">
        {STATUS_TABS.map(s => (
          <div key={s} className={`ab-tab ${activeTab === s ? "active" : ""}`} onClick={() => setActiveTab(s)}>
            {TAB_LABELS[s]} <span className="ab-tab-count">{counts[s] ?? 0}</span>
          </div>
        ))}
      </div>

      <div className="ab-card">
        <div className="ab-action-bar">
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", border: "1px solid #e5e7eb", borderRadius: 8, padding: "6px 10px", gap: 6, background: "#fff" }}>
              <RiSearchLine size={14} color="#9ca3af" />
              <input
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && setSearch(searchInput)}
                placeholder="Search patient name…"
                style={{ border: "none", outline: "none", fontSize: 13, width: 180 }}
              />
              {searchInput && (
                <button onClick={() => { setSearchInput(""); setSearch(""); }}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af" }}>✕</button>
              )}
            </div>
            <select className="ab-select" value={priority} onChange={e => setPriority(e.target.value)}>
              <option value="">All Priorities</option>
              <option value="normal">Normal</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
          <span style={{ fontSize: 13, color: "var(--ab-slate-400)" }}>
            {loading ? "Loading…" : `${total} ${TAB_LABELS[activeTab]} orders`}
          </span>
        </div>

        {error && (
          <div style={{ padding: "12px 20px", background: "#fef2f2", color: "#dc2626", fontSize: 13, display: "flex", gap: 8, alignItems: "center" }}>
            <RiAlertLine size={15} /> {error}
          </div>
        )}

        <table className="ab-table">
          <thead>
            <tr>
              <th>Order #</th><th>Patient</th><th>Medication</th><th>Amount</th>
              <th>Priority</th><th>Delivery</th><th>Status</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: PAGE_SIZE }).map((_, i) => (
                <tr key={i}>{Array.from({ length: 8 }).map((_, j) => (
                  <td key={j}><div style={{ height: 14, background: "#f3f4f6", borderRadius: 4 }} /></td>
                ))}</tr>
              ))
            ) : pageOrders.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: "center", padding: 40, color: "#9ca3af" }}>
                  No {TAB_LABELS[activeTab].toLowerCase()} orders.
                </td>
              </tr>
            ) : (
              pageOrders.map(order => {
                const deliveryStyles  = getDeliveryTypeStyles(order);
                const deliveryDisplay = getDeliveryTypeDisplay(order);
                return (
                  <tr key={order.id}>
                    <td>
                      <div style={{ fontWeight: 700, fontSize: 13 }}>{order.order_number}</div>
                      <div style={{ fontSize: 11, color: "var(--ab-slate-400)" }}>
                        {new Date(order.created_at).toLocaleDateString("en-KE")}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{order.patient_name}</div>
                      <div style={{ fontSize: 11, color: "var(--ab-slate-400)" }}>{order.patient_phone}</div>
                    </td>
                    <td>{renderMedicationColumn(order)}</td>
                    <td>
                      <div style={{ fontWeight: 700, fontSize: 13 }}>
                        KES {Number(order.total_amount || 0).toLocaleString("en-KE")}
                      </div>
                      <div style={{ fontSize: 11, color: order.payment_status === "paid" ? "#059669" : "#d97706" }}>
                        {order.payment_status || "unpaid"}
                      </div>
                    </td>
                    <td>
                      <span className={`ab-priority ${order.priority || "normal"}`}>{order.priority || "normal"}</span>
                    </td>
                    <td>
                      <span style={{ fontSize: 12, fontWeight: 600, padding: "3px 8px", borderRadius: 6, background: deliveryStyles.background, color: deliveryStyles.color }}>
                        {deliveryDisplay}
                      </span>
                    </td>
                    <td>
                      <span className={`ab-status ${STATUS_CLS[order.status] || "pending"}`}>
                        {TAB_LABELS[order.status] || order.status}
                      </span>
                    </td>
                    <td>
                      <ActionCell
                        order={order}
                        actionLoading={actionLoading}
                        onView={setViewOrder}
                        onServe={setServeTarget}
                        onCancel={handleCancel}
                        onStatusUpdate={handleStatusUpdate}
                        onDispense={setDispenseTarget}
                        onAssignRider={setRiderTarget}
                      />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {!loading && total > PAGE_SIZE && (
          <div className="ab-pagination">
            <div className="ab-page-info">
              Showing <strong>{(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)}</strong> of {total}
            </div>
            <div className="ab-page-btns">
              <button className="ab-page-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .slice(Math.max(0, page - 2), Math.min(totalPages, page + 1))
                .map(n => (
                  <button key={n} className={`ab-page-btn ${page === n ? "active" : ""}`} onClick={() => setPage(n)}>{n}</button>
                ))}
              <button className="ab-page-btn" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next</button>
            </div>
          </div>
        )}
      </div>

      {viewOrder && <OrderDetailsModal order={viewOrder} onClose={() => setViewOrder(null)} TAB_LABELS={TAB_LABELS} />}
      {serveTarget && <ServeModal order={serveTarget} onClose={() => setServeTarget(null)} onSuccess={() => { setServeTarget(null); fetchOrders(); }} />}
      {dispenseTarget && <DispenseModal order={dispenseTarget} onClose={() => setDispenseTarget(null)} onSuccess={() => { setDispenseTarget(null); fetchOrders(); }} />}
      {riderTarget && (
        <AssignRiderModal order={riderTarget} onClose={() => setRiderTarget(null)}
          onSuccess={data => { alert(`Rider assigned! OTP: ${data.otp_code} · Package: ${data.package_number}`); setRiderTarget(null); fetchOrders(); }} />
      )}
    </>
  );
}