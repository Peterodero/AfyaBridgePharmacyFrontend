import { RiRefreshLine, RiCheckboxCircleLine } from "react-icons/ri";
import { useApi } from "../../hooks/useApi";
import { getDashboardReport, getInvDashboard, getLowStock, getOrders, getDeliveries, getAvailableRiders } from "../../services/api";

// Simple bar chart from real data
function BarChart({ data = [], color = "#1152d4", height = 120 }) {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div style={{ display:"flex", alignItems:"flex-end", gap:6, height, paddingTop:8 }}>
      {data.map((d,i) => (
        <div key={i} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
          <div style={{ width:"100%", background:color, borderRadius:"4px 4px 0 0", height: `${Math.max((d.value/max)*100,4)}%`, opacity: 0.8+i*0.03 }} />
          <span style={{ fontSize:9, color:"var(--ab-slate-400)", whiteSpace:"nowrap" }}>{d.label}</span>
        </div>
      ))}
    </div>
  );
}

// Donut chart
function DonutChart({ segments = [] }) {
  let cumulative = 0;
  const r = 52, cx = 70, cy = 70, stroke = 18;
  function polar(angle) {
    const rad = (angle * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  }
  const total = segments.reduce((s,d)=>s+d.rawValue,0);
  return (
    <div style={{ display:"flex", alignItems:"center", gap:24 }}>
      <svg width={140} height={140} viewBox="0 0 140 140" style={{ flexShrink:0 }}>
        {segments.map((s,i) => {
          const startAngle = cumulative * 360 - 90;
          const endAngle   = (cumulative + s.pct) * 360 - 90;
          cumulative += s.pct;
          const start = polar(endAngle);
          const end   = polar(startAngle);
          const large = s.pct > 0.5 ? 1 : 0;
          return (
            <path key={i}
              d={`M ${start.x} ${start.y} A ${r} ${r} 0 ${large} 0 ${end.x} ${end.y}`}
              fill="none" stroke={s.color} strokeWidth={stroke}
            />
          );
        })}
        <text x={cx} y={cy-6} textAnchor="middle" fontSize="18" fontWeight="800" fill="#0f172a">
          {total}
        </text>
        <text x={cx} y={cy+10} textAnchor="middle" fontSize="9" fill="#94a3b8" fontWeight="600" letterSpacing="0.5">ORDERS</text>
      </svg>
      <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
        {segments.map((s,i) => (
          <div key={i} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:24 }}>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <span style={{ width:10, height:10, borderRadius:"50%", background:s.color, flexShrink:0 }} />
              <span style={{ fontSize:13, color:"var(--ab-slate-700)" }}>{s.label}</span>
            </div>
            <span style={{ fontSize:13, fontWeight:600, color:"var(--ab-slate-800)" }}>{s.rawValue}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Analytics() {
  const { data: dashStats, loading: dashLoading, refetch } = useApi(getDashboardReport, null, [], { silent: true });
  const { data: invStats,  loading: invLoading  } = useApi(getInvDashboard,  null, [], { silent: true });
  const { data: lowStockData } = useApi(getLowStock, null, [], { silent: true });
  const { data: ordersData }   = useApi(getOrders, { page_size:200 }, [], { silent: true });
  const { data: delivData  }   = useApi(getDeliveries, null, [], { silent: true });
  const { data: ridersData }   = useApi(getAvailableRiders, null, [], { silent: true });

  const stats   = dashStats || {};
  const inv     = invStats  || {};
  const orders  = (() => { const d=ordersData; if(!d) return []; return Array.isArray(d)?d:d?.results??[]; })();
  const deliveries = (() => { const d=delivData; if(!d) return []; return Array.isArray(d)?d:d?.results??[]; })();
  const lowStock = Array.isArray(lowStockData) ? lowStockData : lowStockData?.results ?? [];
  const availableRiders = Array.isArray(ridersData) ? ridersData : ridersData?.data ?? [];

  // Order status breakdown
  const pendingOrders    = orders.filter(o=>o.status==="pending").length;
  const processingOrders = orders.filter(o=>o.status==="processing").length;
  const readyOrders      = orders.filter(o=>o.status==="ready").length;
  const deliveredOrders  = orders.filter(o=>o.status==="delivered").length;
  const dispatchedOrders = orders.filter(o=>o.status==="dispatched").length;

  // Delivery counts
  const activeDeliveries = deliveries.filter(d=>["assigned","picked_up","in_transit"].includes(d.status)).length;
  const doneDeliveries   = deliveries.filter(d=>d.status==="delivered").length;

  // Prefer the authoritative dashboard numbers where available; fall back to local counts
  const pendingCount     = stats.pending_orders     ?? pendingOrders;
  const lowStockCount    = stats.low_stock_alerts   ?? inv.low_stock_count ?? lowStock.length;
  const activeDelivCount = stats.active_deliveries  ?? activeDeliveries;
  const todayRevenue     = Number(stats.today_revenue || 0);

  const donutSegments = [
    { label:"Pending",    pct: orders.length?pendingOrders/orders.length:0,    color:"#f97316", rawValue:pendingOrders },
    { label:"Processing", pct: orders.length?processingOrders/orders.length:0, color:"#1152d4", rawValue:processingOrders },
    { label:"Delivered",  pct: orders.length?deliveredOrders/orders.length:0,  color:"#059669", rawValue:deliveredOrders },
    { label:"Dispatched", pct: orders.length?dispatchedOrders/orders.length:0, color:"#8b5cf6", rawValue:dispatchedOrders },
  ].filter(s=>s.rawValue>0);

  // 4 KPI cards — all sourced from real endpoints
  const kpiCards = [
    {
      label: "Pending Orders",
      value: dashLoading ? "…" : String(pendingCount),
      badge: pendingCount > 10 ? "HIGH" : "OK",
      badgeColor: pendingCount > 10 ? "var(--ab-red)" : "var(--ab-green)",
      source: "/reporting/dashboard",
    },
    {
      label: "Low Stock Alerts",
      value: invLoading ? "…" : String(lowStockCount),
      badge: lowStockCount > 0 ? "ACTION" : "OK",
      badgeColor: lowStockCount > 0 ? "var(--ab-red)" : "var(--ab-green)",
      source: "/inventory/dashboard",
    },
    {
      label: "Active Deliveries",
      value: String(activeDelivCount),
      badge: "LIVE", badgeColor: "var(--ab-green)", live: true,
      source: "/reporting/dashboard",
    },
    {
      label: "Today's Revenue",
      value: dashLoading ? "…" : `KES ${todayRevenue.toLocaleString("en-KE",{minimumFractionDigits:0})}`,
      badge: "+", badgeColor: "var(--ab-green)",
      source: "/reporting/dashboard",
    },
  ];

  const orderBarData = [
    { label:"Pending",    value: pendingOrders },
    { label:"Processing", value: processingOrders },
    { label:"Ready",      value: readyOrders },
    { label:"Dispatched", value: dispatchedOrders },
    { label:"Delivered",  value: deliveredOrders },
  ];

  return (
    <>
      {/* Header */}
      <div className="ab-page-header">
        <div className="ab-page-title">
          <h1>Analytics Overview</h1>
          <p>Real-time supply chain &amp; logistics performance</p>
        </div>
        <div style={{ display:"flex", gap:8, alignItems:"center" }}>
          <button className="ab-btn-secondary" onClick={refetch}><RiRefreshLine size={14}/> Refresh</button>
        </div>
      </div>

      {/* 4 KPI cards */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16, marginBottom:24 }}>
        {kpiCards.map((k,i) => (
          <div key={i} className="ab-card" style={{ padding:"20px 24px" }}>
            <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:12 }}>
              <span style={{ fontSize:11, fontWeight:700, color:k.badgeColor,
                background: k.live?"var(--ab-green-bg)":"transparent",
                padding: k.live?"2px 8px":0, borderRadius:9999,
                display:"flex", alignItems:"center", gap:4 }}>
                {k.live&&<span style={{ width:6, height:6, borderRadius:"50%", background:"var(--ab-green)", display:"inline-block" }}/>}
                {k.badge}
              </span>
            </div>
            <div style={{ fontSize:22, fontWeight:800, color:"var(--ab-slate-900)", marginBottom:4 }}>{k.value}</div>
            <div style={{ fontSize:12, color:"var(--ab-slate-500)", marginBottom:2 }}>{k.label}</div>
            <div style={{ fontSize:10, color:"var(--ab-slate-300)" }}>{k.source}</div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr minmax(280px,360px)", gap:20, marginBottom:20 }}>
        {/* Order Status Bar Chart */}
        <div className="ab-card" style={{ padding:24 }}>
          <div style={{ marginBottom:16 }}>
            <div style={{ fontSize:16, fontWeight:700, color:"var(--ab-slate-800)" }}>Order Status Breakdown</div>
            <div style={{ fontSize:12, color:"var(--ab-slate-400)", marginTop:2 }}>Current distribution across all {orders.length} orders</div>
          </div>
          <BarChart data={orderBarData} color="#1152d4" height={140}/>
        </div>

        {/* Donut */}
        <div className="ab-card" style={{ padding:24 }}>
          <div style={{ fontSize:16, fontWeight:700, color:"var(--ab-slate-800)", marginBottom:20 }}>Order Distribution</div>
          {donutSegments.length > 0
            ? <DonutChart segments={donutSegments}/>
            : <div style={{padding:40,textAlign:"center",color:"var(--ab-slate-400)",fontSize:13}}>No order data yet.</div>
          }
        </div>
      </div>

      {/* Bottom row */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>
        {/* Delivery performance — from GET /deliveries/ and GET /orders/riders/available */}
        <div className="ab-card" style={{ padding:24 }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20 }}>
            <div style={{ fontSize:16, fontWeight:700, color:"var(--ab-slate-800)" }}>Delivery Performance</div>
            <span style={{ display:"flex", alignItems:"center", gap:5, fontSize:12, fontWeight:600, color:"var(--ab-green)", background:"var(--ab-green-bg)", padding:"3px 10px", borderRadius:9999 }}>
              <RiCheckboxCircleLine size={13}/> LIVE
            </span>
          </div>
          {[
            {
              label: "Active Deliveries",
              value: activeDelivCount,
              target: `${availableRiders.length} rider${availableRiders.length!==1?"s":""} on duty`,
              pct: deliveries.length ? Math.min((activeDelivCount / Math.max(deliveries.length,1))*100,100) : 0,
              color: "var(--ab-blue)",
            },
            {
              label: "Completed Deliveries",
              value: doneDeliveries,
              target: `${deliveries.length ? Math.round((doneDeliveries/deliveries.length)*100) : 0}% success rate`,
              pct: deliveries.length ? Math.round((doneDeliveries/deliveries.length)*100) : 0,
              color: "var(--ab-green)",
            },
          ].map((item,i) => (
            <div key={i} style={{ marginBottom: i===0?20:0 }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:6 }}>
                <span style={{ fontSize:14, fontWeight:500, color:"var(--ab-slate-700)" }}>{item.label}</span>
                <span style={{ fontSize:14, fontWeight:700, color:"var(--ab-blue)" }}>{item.value}</span>
              </div>
              <div style={{ height:6, background:"var(--ab-slate-100)", borderRadius:3, overflow:"hidden", marginBottom:4 }}>
                <div style={{ width:`${item.pct}%`, height:"100%", background:item.color, borderRadius:3 }}/>
              </div>
              <div style={{ fontSize:11, color:"var(--ab-slate-400)" }}>{item.target}</div>
            </div>
          ))}
        </div>

        {/* Low stock drugs — from GET /inventory/low-stock */}
        <div className="ab-card" style={{ padding:24 }}>
          <div style={{ fontSize:16, fontWeight:700, color:"var(--ab-slate-800)", marginBottom:20 }}>Low Stock Alerts</div>
          {lowStock.length === 0 ? (
            <div style={{ padding:24, textAlign:"center", color:"var(--ab-slate-400)", fontSize:13 }}>
              All stock levels are healthy.
            </div>
          ) : (
            <table className="ab-table">
              <thead><tr><th>Medication</th><th>In Stock</th><th>Reorder At</th><th>Status</th></tr></thead>
              <tbody>
                {lowStock.slice(0,5).map((d,i) => (
                  <tr key={i}>
                    <td style={{ fontWeight:600, color:"var(--ab-slate-800)", fontSize:13 }}>{d.drug_name}</td>
                    <td style={{ fontSize:13, fontWeight:700, color: d.quantity_in_stock<=5?"#dc2626":"#d97706" }}>
                      {d.quantity_in_stock}
                    </td>
                    <td style={{ fontSize:13, color:"var(--ab-slate-500)" }}>{d.reorder_level}</td>
                    <td>
                      <span style={{ fontSize:11, fontWeight:700, padding:"2px 8px", borderRadius:9999,
                        background: d.quantity_in_stock===0?"#fef2f2":"#fffbeb",
                        color: d.quantity_in_stock===0?"#dc2626":"#d97706" }}>
                        {d.quantity_in_stock===0?"OUT":"LOW"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Inventory summary — from GET /inventory/dashboard */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16, marginTop:20 }}>
        {[
          { label:"Total SKUs",     value: inv.total_skus??0,       color:"var(--ab-blue)" },
          { label:"Low Stock",      value: inv.low_stock_count??0,  color:"#d97706" },
          { label:"Critical Stock", value: inv.critical_count??0,   color:"#dc2626" },
          { label:"Expiring (30d)", value: inv.expiring_count??0,   color:"#7c3aed" },
        ].map((s,i)=>(
          <div key={i} className="ab-card" style={{ padding:"16px 20px" }}>
            <div style={{ fontSize:22, fontWeight:800, color:s.color, marginBottom:4 }}>
              {invLoading?"…":s.value}
            </div>
            <div style={{ fontSize:12, color:"var(--ab-slate-500)" }}>{s.label}</div>
            <div style={{ fontSize:10, color:"var(--ab-slate-300)", marginTop:2 }}>/inventory/dashboard</div>
          </div>
        ))}
      </div>
    </>
  );
}
