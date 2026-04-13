import { useState, useEffect, useCallback } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  RiRefreshLine, RiMapPinLine,  RiAlertLine,
} from "react-icons/ri";
import { getDeliveries, updateDeliveryStatus, confirmDelivery, getAvailableRiders } from "../../services/api";
import { useApi } from "../../hooks/useApi";

// Fix leaflet default icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const makeIcon = (color) =>
  L.divIcon({
    className: "",
    html: `<div style="width:14px;height:14px;border-radius:50%;background:${color};border:2.5px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.35);"></div>`,
    iconSize: [14, 14], iconAnchor: [7, 7], popupAnchor: [0, -10],
  });

const ICON_MAP = {
  assigned:   makeIcon("#d97706"),
  picked_up:  makeIcon("#1152d4"),
  in_transit: makeIcon("#1152d4"),
  delivered:  makeIcon("#059669"),
  failed:     makeIcon("#dc2626"),
};

function RecenterMap({ coords }) {
  const map = useMap();
  useEffect(() => { map.setView(coords, 13); }, [coords]);
  return null;
}

const NAIROBI = [-1.2921, 36.8219];

const STATUS_TABS = ["All", "Active", "Delivered"];

const statusStyle = {
  assigned:   { background: "#fffbeb", color: "#d97706" },
  picked_up:  { background: "#eff6ff", color: "#1152d4" },
  in_transit: { background: "#eff6ff", color: "#1152d4" },
  delivered:  { background: "#ecfdf5", color: "#059669" },
  failed:     { background: "#fef2f2", color: "#dc2626" },
};

const STATUS_LABELS = {
  assigned: "ASSIGNED", picked_up: "PICKED UP",
  in_transit: "IN TRANSIT", delivered: "DELIVERED", failed: "FAILED",
};

// OTP Confirm Modal
function OtpModal({ delivery, onConfirm, onClose, loading }) {
  const [otp, setOtp] = useState("");
  return (
    <div className="ab-modal-overlay" onClick={onClose}>
      <div className="ab-modal" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
        <div className="ab-modal-header">
          <h3>Confirm Delivery OTP</h3>
          <button className="ab-modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="ab-modal-body">
          <p style={{ fontSize: 13, color: "var(--ab-slate-500)", marginBottom: 16 }}>
            Enter the 6-digit OTP provided by the patient for <strong>{delivery.package_number}</strong>.
          </p>
          <label style={{ fontSize: 12, fontWeight: 600, color: "var(--ab-slate-700)", display: "block", marginBottom: 6 }}>OTP Code</label>
          <input
            type="text" maxLength={6} value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, ""))}
            placeholder="847291"
            style={{ width: "100%", padding: "10px 14px", border: "1px solid var(--ab-slate-200)", borderRadius: 8, fontSize: 18, letterSpacing: 6, textAlign: "center", fontWeight: 700 }}
          />
        </div>
        <div className="ab-modal-footer">
          <button className="ab-btn-secondary" onClick={onClose}>Cancel</button>
          <button className="ab-btn-primary" disabled={otp.length !== 6 || loading} onClick={() => onConfirm(otp)}>
            {loading ? "Confirming…" : "Confirm Delivery"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Deliveries() {
  const [activeTab,    setActiveTab]    = useState(0);
  const [deliveries,   setDeliveries]   = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(null);
  const [mapCenter,    setMapCenter]    = useState(NAIROBI);
  const [actionLoading, setActionLoading] = useState(null);
  const [otpModal,     setOtpModal]     = useState(null); // delivery object

  // Available (on-duty) riders from GET /orders/riders/available
  const { data: ridersData } = useApi(getAvailableRiders, null, [], { silent: true });
  const availableRidersCount = Array.isArray(ridersData) ? ridersData.length : ridersData?.data?.length ?? 0;

  const fetchDeliveries = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res  = await getDeliveries();
      const body = res.data?.data ?? res.data;
      setDeliveries(Array.isArray(body) ? body : body?.results ?? []);
    } catch (e) {
      setError(e.response?.data?.message || e.message || "Failed to load deliveries");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchDeliveries(); }, [fetchDeliveries]);

  const filtered = deliveries.filter(d => {
    if (activeTab === 1) return ["assigned", "picked_up", "in_transit"].includes(d.status);
    if (activeTab === 2) return d.status === "delivered";
    return true;
  });

  // KPI counts
  const activeCount    = deliveries.filter(d => ["assigned","picked_up","in_transit"].includes(d.status)).length;
  const deliveredCount = deliveries.filter(d => d.status === "delivered").length;
  const failedCount    = deliveries.filter(d => d.status === "failed").length;

  async function handleStatusUpdate(delivery, newStatus) {
    setActionLoading(delivery.id);
    try {
      await updateDeliveryStatus(delivery.id, { status: newStatus });
      await fetchDeliveries();
    } catch (e) {
      alert(e.response?.data?.message || "Status update failed");
    } finally { setActionLoading(null); }
  }

  async function handleConfirmDelivery(otp) {
    if (!otpModal) return;
    setActionLoading(otpModal.id);
    try {
      await confirmDelivery(otpModal.id, { otp_code: otp });
      setOtpModal(null);
      await fetchDeliveries();
    } catch (e) {
      alert(e.response?.data?.message || "OTP confirmation failed");
    } finally { setActionLoading(null); }
  }

  // Map markers — use NAIROBI for deliveries without GPS coords
  const markers = filtered.map(d => ({
    ...d,
    coords: d.pickup_lat && d.pickup_lng ? [d.pickup_lat, d.pickup_lng] : NAIROBI,
  }));

  return (
    <>
      {/* Header */}
      <div className="ab-page-header">
        <div className="ab-page-title">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <h1>Delivery Coordination</h1>
            <span style={{ display:"flex", alignItems:"center", gap:5, fontSize:12, fontWeight:600, color:"#059669", background:"#ecfdf5", padding:"3px 10px", borderRadius:9999 }}>
              <span style={{ width:6, height:6, borderRadius:"50%", background:"#059669", display:"inline-block" }} /> LIVE
            </span>
          </div>
          <p style={{ fontSize: 13, color: "var(--ab-slate-500)", marginTop: 2 }}>
            Track and manage all active medication deliveries in real-time.
          </p>
        </div>
        <button className="ab-btn-secondary" onClick={fetchDeliveries} disabled={loading}>
          <RiRefreshLine size={15} /> {loading ? "Loading…" : "Refresh"}
        </button>
      </div>

      {/* KPI row */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16, marginBottom:24 }}>
        {[
          { label:"Active Deliveries", value: activeCount, badge:"green" },
          { label:"Delivered Today",   value: deliveredCount, badge:"green" },
          { label:"Total Riders",      value: availableRidersCount, badge:"stable" },
          { label:"Failed / Issues",   value: failedCount,  badge: failedCount>0?"red":"green" },
        ].map((k,i)=>(
          <div key={i} className="ab-stat">
            <div className="ab-stat-top">
            </div>
            <div className="ab-stat-label">{k.label}</div>
            <div className={`ab-stat-val${k.badge==="red"?" red":""}`}>{loading?"…":k.value}</div>
          </div>
        ))}
      </div>

      {/* Main grid: list + map */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 380px", gap:20, alignItems:"start" }}>
        {/* Delivery list */}
        <div className="ab-card">
          {/* Tabs */}
          <div className="ab-tabs" style={{ borderBottom:"1px solid var(--ab-slate-100)", margin:0 }}>
            {STATUS_TABS.map((t,i)=>(
              <div key={i} className={`ab-tab ${activeTab===i?"active":""}`} onClick={()=>setActiveTab(i)}>
                {t}
                <span className="ab-tab-count">
                  {i===0?deliveries.length:i===1?activeCount:deliveredCount}
                </span>
              </div>
            ))}
          </div>

          {error && (
            <div style={{ padding:"16px 20px", background:"#fef2f2", color:"#dc2626", fontSize:13, display:"flex", alignItems:"center", gap:8 }}>
              <RiAlertLine size={15}/> {error}
            </div>
          )}

          <div style={{ padding:"0 4px" }}>
            {loading ? (
              Array.from({length:3}).map((_,i)=>(
                <div key={i} style={{ padding:"18px 20px", borderBottom:"1px solid var(--ab-slate-100)" }}>
                  <div style={{ height:14, background:"#f3f4f6", borderRadius:4, marginBottom:8, width:"60%" }} />
                  <div style={{ height:12, background:"#f3f4f6", borderRadius:4, width:"40%" }} />
                </div>
              ))
            ) : filtered.length === 0 ? (
              <div style={{ padding:40, textAlign:"center", color:"var(--ab-slate-400)" }}>
                No deliveries found.
              </div>
            ) : (
              filtered.map((d) => {
                const sStyle = statusStyle[d.status] || statusStyle.assigned;
                const sLabel = STATUS_LABELS[d.status] || d.status?.toUpperCase();
                const busy   = actionLoading === d.id;
                return (
                  <div key={d.id}
                    style={{ padding:"16px 20px", borderBottom:"1px solid var(--ab-slate-100)", cursor:"pointer" }}
                    onClick={() => d.pickup_lat && setMapCenter([d.pickup_lat, d.pickup_lng])}
                  >
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
                      <div>
                        <div style={{ fontWeight:700, fontSize:14, color:"var(--ab-slate-900)" }}>{d.package_number}</div>
                        <div style={{ fontSize:12, color:"var(--ab-slate-400)", marginTop:2 }}>
                          Order #{d.order_id?.slice(0,8).toUpperCase()}
                        </div>
                      </div>
                      <span style={{ ...sStyle, fontSize:11, fontWeight:700, padding:"3px 10px", borderRadius:9999 }}>
                        {sLabel}
                      </span>
                    </div>

                    <div style={{ display:"flex", gap:16, fontSize:12, color:"var(--ab-slate-500)", marginBottom:10 }}>
                      <span style={{ display:"flex", alignItems:"center", gap:4 }}>
                        <RiMapPinLine size={12}/> {d.pickup_location || "Pickup location TBD"}
                      </span>
                      {d.dropoff_location && (
                        <span style={{ display:"flex", alignItems:"center", gap:4 }}>
                          → {d.dropoff_location}
                        </span>
                      )}
                    </div>

                    {d.charges && (
                      <div style={{ fontSize:12, color:"var(--ab-slate-500)", marginBottom:10 }}>
                        KES {Number(d.charges).toLocaleString()} delivery fee
                      </div>
                    )}

                    {/* Action buttons */}
                    <div style={{ display:"flex", gap:8 }}>
                      {d.status === "assigned" && (
                        <button className="ab-btn-secondary" style={{ fontSize:12, padding:"5px 12px" }}
                          disabled={busy} onClick={e=>{ e.stopPropagation(); handleStatusUpdate(d,"picked_up"); }}>
                          {busy?"…":"Mark Picked Up"}
                        </button>
                      )}
                      {d.status === "picked_up" && (
                        <button className="ab-btn-secondary" style={{ fontSize:12, padding:"5px 12px" }}
                          disabled={busy} onClick={e=>{ e.stopPropagation(); handleStatusUpdate(d,"in_transit"); }}>
                          {busy?"…":"Mark In Transit"}
                        </button>
                      )}
                      {d.status === "in_transit" && (
                        <button className="ab-btn-primary" style={{ fontSize:12, padding:"5px 14px" }}
                          disabled={busy} onClick={e=>{ e.stopPropagation(); setOtpModal(d); }}>
                          {busy?"…":"Confirm OTP"}
                        </button>
                      )}
                      {d.otp_code && d.status !== "delivered" && (
                        <span style={{ fontSize:11, fontWeight:700, letterSpacing:3, color:"var(--ab-slate-400)", display:"flex", alignItems:"center", padding:"5px 0" }}>
                          OTP: {d.otp_code}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Map */}
        <div className="ab-card" style={{ overflow:"hidden", padding:0 }}>
          <div style={{ padding:"14px 16px", borderBottom:"1px solid var(--ab-slate-100)" }}>
            <div style={{ fontWeight:700, fontSize:14, color:"var(--ab-slate-800)" }}>Live Delivery Map</div>
            <div style={{ fontSize:12, color:"var(--ab-slate-400)", marginTop:2 }}>Nairobi, Kenya</div>
          </div>
          <MapContainer center={mapCenter} zoom={12} style={{ height:500, width:"100%" }} zoomControl={false}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <RecenterMap coords={mapCenter} />
            {markers.map(d => (
              <Marker key={d.id} position={d.coords} icon={ICON_MAP[d.status] || ICON_MAP.assigned}>
                <Popup>
                  <strong>{d.package_number}</strong><br/>
                  {STATUS_LABELS[d.status]}<br/>
                  {d.dropoff_location}
                </Popup>
              </Marker>
            ))}
          </MapContainer>

          {/* Legend */}
          <div style={{ padding:"12px 16px", background:"var(--ab-slate-50)", display:"flex", gap:16, flexWrap:"wrap" }}>
            {[["#d97706","Assigned"], ["#1152d4","In Transit"], ["#059669","Delivered"]].map(([c,l])=>(
              <div key={l} style={{ display:"flex", alignItems:"center", gap:6, fontSize:11, color:"var(--ab-slate-600)" }}>
                <span style={{ width:10, height:10, borderRadius:"50%", background:c, border:"2px solid #fff", boxShadow:"0 1px 4px rgba(0,0,0,.2)" }}/>
                {l}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* OTP Modal */}
      {otpModal && (
        <OtpModal
          delivery={otpModal}
          loading={actionLoading === otpModal.id}
          onConfirm={handleConfirmDelivery}
          onClose={() => setOtpModal(null)}
        />
      )}
    </>
  );
}
