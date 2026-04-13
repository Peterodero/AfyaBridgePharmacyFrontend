import { useState, useCallback } from "react";
import {
  RiDownloadLine, RiFileTextLine, RiRefreshLine,
  RiCalendarLine, RiCheckboxCircleFill, RiTimeFill,
  RiCloseCircleFill, RiSearchLine,
} from "react-icons/ri";
import { useApi } from "../../hooks/useApi";
import { getOrders, getDashboardReport } from "../../services/api";

const statusConfig = {
  paid:    { icon: <RiCheckboxCircleFill size={13}/>, label:"Paid",    bg:"#ecfdf5", color:"#059669" },
  unpaid:  { icon: <RiTimeFill size={13}/>,           label:"Unpaid",  bg:"#fffbeb", color:"#d97706" },
  pending: { icon: <RiTimeFill size={13}/>,           label:"Pending", bg:"#fffbeb", color:"#d97706" },
  failed:  { icon: <RiCloseCircleFill size={13}/>,    label:"Failed",  bg:"#fef2f2", color:"#dc2626" },
};

const INITIALS_COLORS = ["#3b82f6","#a855f7","#f97316","#22c55e","#ef4444","#8b5cf6","#0891b2","#65a30d"];
function initials(name="") {
  return name.split(" ").map(n=>n[0]||"").join("").toUpperCase().slice(0,2)||"?";
}
function colorForName(name="") {
  let h=0; for(let c of name) h=(h*31+c.charCodeAt(0))%INITIALS_COLORS.length;
  return INITIALS_COLORS[h];
}

const PERIOD_TABS = ["Daily","Weekly","Monthly"];

// Returns true if the order's created_at falls within the chosen period
function matchesPeriod(order, period) {
  if (!order.created_at) return true;
  const now  = new Date();
  const date = new Date(order.created_at);
  if (period === 0) {
    // Daily — same calendar day
    return (
      date.getFullYear() === now.getFullYear() &&
      date.getMonth()    === now.getMonth()    &&
      date.getDate()     === now.getDate()
    );
  }
  if (period === 1) {
    // Weekly — last 7 days
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 7);
    return date >= sevenDaysAgo;
  }
  // Monthly — last 30 days
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(now.getDate() - 30);
  return date >= thirtyDaysAgo;
}

export default function Payments() {
  const [period,       setPeriod]       = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [methodFilter, setMethodFilter] = useState("");
  const [search,       setSearch]       = useState("");
  const [searchInput,  setSearchInput]  = useState("");

  // All delivered orders for transaction history (large page_size to cover period)
  const { data: deliveredData, loading, refetch } = useApi(
    getOrders, { status:"delivered", page_size:200 }, [], { silent: true }
  );

  // Dashboard report for today_revenue stat
  const { data: dashStats, loading: dashLoading } = useApi(
    getDashboardReport, null, [], { silent: true }
  );

  const rawOrders = (() => {
    const d = deliveredData;
    if (!d) return [];
    return Array.isArray(d) ? d : d?.results ?? [];
  })();

  // Period-filtered base
  const periodOrders = rawOrders.filter(o => matchesPeriod(o, period));

  // Apply search + column filters on top of period
  const filtered = periodOrders.filter(o => {
    const ps = o.payment_status || "unpaid";
    const pm = o.payment_method || "cash";
    if (statusFilter && ps !== statusFilter) return false;
    if (methodFilter && pm !== methodFilter) return false;
    if (search && !o.patient_name?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  // Summary stats — computed from period-filtered orders
  const totalRevenue  = periodOrders.reduce((s,o)=>s+Number(o.total_amount||0),0);
  const mpesaRevenue  = periodOrders.filter(o=>o.payment_method==="mpesa"||o.payment_method==="m-pesa").reduce((s,o)=>s+Number(o.total_amount||0),0);
  const pendingAmount = rawOrders.filter(o=>o.payment_status==="unpaid"||o.payment_status==="pending").reduce((s,o)=>s+Number(o.total_amount||0),0);
  const pendingCount  = rawOrders.filter(o=>o.payment_status==="unpaid"||o.payment_status==="pending").length;

  // Today's revenue from the dashboard report endpoint
  const todayRevenue = Number(dashStats?.today_revenue || 0);

  return (
    <>
      {/* Header */}
      <div className="ab-page-header">
        <div className="ab-page-title">
          <h1>Financial Overview</h1>
          <div style={{ display:"flex", alignItems:"center", gap:6, marginTop:4 }}>
            <RiRefreshLine size={14} color="#059669"/>
            <span style={{ fontSize:13, color:"var(--ab-slate-500)" }}>
              {loading?"Syncing…":"Live from delivered orders"}
            </span>
          </div>
        </div>
        <div style={{ display:"flex", gap:10 }}>
          <button className="ab-btn-secondary" onClick={refetch}><RiRefreshLine size={15}/> Refresh</button>
        </div>
      </div>

      {/* Stat Cards — 4 cards */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:20, marginBottom:28 }}>
        {/* Today's Revenue — from /reporting/dashboard */}
        <div className="ab-card" style={{ padding:24 }}>
          <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:12 }}>
            <div style={{ fontSize:11, fontWeight:700, color:"var(--ab-slate-500)", textTransform:"uppercase", letterSpacing:"1.2px" }}>
              Today's Revenue
            </div>
            <span style={{ fontSize:10, fontWeight:800, color:"#059669", background:"#ecfdf5", padding:"2px 8px", borderRadius:4 }}>TODAY</span>
          </div>
          <div style={{ fontSize:28, fontWeight:800, color:"var(--ab-slate-900)", marginBottom:6 }}>
            {dashLoading?"…":`KES ${todayRevenue.toLocaleString("en-KE",{minimumFractionDigits:0})}`}
          </div>
          <div style={{ fontSize:13, color:"var(--ab-green)", fontWeight:500 }}>
            From /reporting/dashboard
          </div>
        </div>

        {/* Period Revenue */}
        <div className="ab-card" style={{ padding:24 }}>
          <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:12 }}>
            <div style={{ fontSize:11, fontWeight:700, color:"var(--ab-slate-500)", textTransform:"uppercase", letterSpacing:"1.2px" }}>
              {PERIOD_TABS[period]} Revenue
            </div>
            <div style={{ width:36, height:36, background:"var(--ab-slate-100)", borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center" }}>
              <RiFileTextLine size={18} color="var(--ab-slate-400)"/>
            </div>
          </div>
          <div style={{ fontSize:28, fontWeight:800, color:"var(--ab-slate-900)", marginBottom:6 }}>
            {loading?"…":`KES ${totalRevenue.toLocaleString("en-KE",{minimumFractionDigits:0})}`}
          </div>
          <div style={{ fontSize:13, color:"var(--ab-green)", fontWeight:600 }}>
            {periodOrders.length} completed orders
          </div>
        </div>

        {/* M-Pesa */}
        <div className="ab-card" style={{ padding:24 }}>
          <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:12 }}>
            <div style={{ fontSize:11, fontWeight:700, color:"var(--ab-slate-500)", textTransform:"uppercase", letterSpacing:"1.2px" }}>
              M-Pesa Collections
            </div>
            <span style={{ fontSize:11, fontWeight:800, color:"#059669", background:"#ecfdf5", padding:"2px 8px", borderRadius:4 }}>M-PESA</span>
          </div>
          <div style={{ fontSize:28, fontWeight:800, color:"var(--ab-slate-900)", marginBottom:6 }}>
            {loading?"…":`KES ${mpesaRevenue.toLocaleString("en-KE",{minimumFractionDigits:0})}`}
          </div>
          <div style={{ fontSize:13, color:"var(--ab-green)", fontWeight:500 }}>
            {totalRevenue>0 ? `${Math.round((mpesaRevenue/totalRevenue)*100)}% of period volume` : "—"}
          </div>
        </div>

        {/* Pending */}
        <div className="ab-card" style={{ padding:24 }}>
          <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:12 }}>
            <div style={{ fontSize:11, fontWeight:700, color:"var(--ab-slate-500)", textTransform:"uppercase", letterSpacing:"1.2px" }}>
              Pending / Claims
            </div>
            <div style={{ width:36, height:36, background:"#fffbeb", borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center" }}>
              <RiCalendarLine size={18} color="var(--ab-amber)"/>
            </div>
          </div>
          <div style={{ fontSize:28, fontWeight:800, color:"var(--ab-slate-900)", marginBottom:6 }}>
            {loading?"…":`KES ${pendingAmount.toLocaleString("en-KE",{minimumFractionDigits:0})}`}
          </div>
          <div style={{ fontSize:13, color:"var(--ab-amber)", fontWeight:500 }}>
            ⚠ {pendingCount} {pendingCount===1?"order":"orders"} awaiting payment
          </div>
        </div>
      </div>

      {/* Transaction History */}
      <div className="ab-card">
        <div className="ab-card-header">
          <span className="ab-card-title">Transaction History</span>
          <div style={{ display:"flex", gap:4 }}>
            {PERIOD_TABS.map((t,i)=>(
              <button key={i} onClick={()=>setPeriod(i)} style={{
                padding:"6px 14px", borderRadius:8, border:"1px solid",
                borderColor: period===i?"var(--ab-blue)":"var(--ab-slate-200)",
                background: period===i?"var(--ab-blue)":"#fff",
                color: period===i?"#fff":"var(--ab-slate-600)",
                fontSize:13, fontWeight: period===i?600:400, cursor:"pointer",
                fontFamily:"Inter,sans-serif", display:"flex", alignItems:"center", gap:6,
              }}>
                {i===0&&<RiCalendarLine size={13}/>}{t}
              </button>
            ))}
          </div>
        </div>

        {/* Filters */}
        <div style={{ padding:"16px 20px", borderBottom:"1px solid var(--ab-slate-100)", display:"flex", gap:12, alignItems:"flex-end", flexWrap:"wrap" }}>
          <div style={{ flex:2, minWidth:200 }}>
            <div style={{ fontSize:11, fontWeight:600, color:"var(--ab-slate-500)", textTransform:"uppercase", letterSpacing:"1px", marginBottom:6 }}>Search Patient</div>
            <div style={{ display:"flex", alignItems:"center", border:"1px solid var(--ab-slate-200)", borderRadius:8, padding:"8px 12px", gap:6, background:"#fff" }}>
              <RiSearchLine size={14} color="#9ca3af"/>
              <input value={searchInput} onChange={e=>setSearchInput(e.target.value)}
                onKeyDown={e=>e.key==="Enter"&&setSearch(searchInput)}
                placeholder="Search patient name…"
                style={{ border:"none", outline:"none", fontSize:13, flex:1 }}
              />
              {searchInput&&<button onClick={()=>{setSearchInput("");setSearch("");}} style={{background:"none",border:"none",cursor:"pointer",color:"#9ca3af"}}>✕</button>}
            </div>
          </div>
          <div style={{ flex:1, minWidth:180 }}>
            <div style={{ fontSize:11, fontWeight:600, color:"var(--ab-slate-500)", textTransform:"uppercase", letterSpacing:"1px", marginBottom:6 }}>Payment Status</div>
            <select className="ab-select" value={statusFilter} onChange={e=>setStatusFilter(e.target.value)} style={{width:"100%"}}>
              <option value="">All Statuses</option>
              <option value="paid">Paid</option>
              <option value="unpaid">Unpaid</option>
              <option value="pending">Pending</option>
            </select>
          </div>
          <div style={{ flex:1, minWidth:180 }}>
            <div style={{ fontSize:11, fontWeight:600, color:"var(--ab-slate-500)", textTransform:"uppercase", letterSpacing:"1px", marginBottom:6 }}>Payment Method</div>
            <select className="ab-select" value={methodFilter} onChange={e=>setMethodFilter(e.target.value)} style={{width:"100%"}}>
              <option value="">All Methods</option>
              <option value="mpesa">M-Pesa</option>
              <option value="cash">Cash</option>
              <option value="insurance">Insurance</option>
            </select>
          </div>
          <button className="ab-btn-secondary" style={{marginBottom:1}} onClick={()=>{setStatusFilter("");setMethodFilter("");setSearchInput("");setSearch("");}}>
            Clear
          </button>
        </div>

        {/* Table */}
        <table className="ab-table">
          <thead>
            <tr>
              <th>Date &amp; Order</th>
              <th>Patient</th>
              <th>Items</th>
              <th>Amount</th>
              <th>Method</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? Array.from({length:5}).map((_,i)=>(
              <tr key={i}>{Array.from({length:6}).map((_,j)=>(<td key={j}><div style={{height:14,background:"#f3f4f6",borderRadius:4}}/></td>))}</tr>
            )) : filtered.length===0 ? (
              <tr><td colSpan={6} style={{textAlign:"center",padding:40,color:"#9ca3af"}}>No transactions found for this period.</td></tr>
            ) : filtered.map((o,i)=>{
              const ps = o.payment_status||"unpaid";
              const sc = statusConfig[ps]||statusConfig.unpaid;
              const ini = initials(o.patient_name);
              const col = colorForName(o.patient_name);
              return (
                <tr key={o.id||i}>
                  <td>
                    <div style={{ fontWeight:500, color:"var(--ab-slate-800)", fontSize:13 }}>
                      {o.created_at?new Date(o.created_at).toLocaleDateString("en-KE",{day:"2-digit",month:"short",year:"numeric"}):"—"}
                    </div>
                    <div style={{ fontSize:11, color:"var(--ab-slate-400)" }}>{o.order_number}</div>
                  </td>
                  <td>
                    <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                      <div style={{ width:32, height:32, borderRadius:"50%", background:col, color:"#fff", fontSize:11, fontWeight:700, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>{ini}</div>
                      <span style={{ fontWeight:500, color:"var(--ab-slate-800)" }}>{o.patient_name}</span>
                    </div>
                  </td>
                  <td>
                    <span style={{ background:"var(--ab-slate-100)", color:"var(--ab-slate-600)", fontSize:12, fontWeight:600, padding:"3px 10px", borderRadius:6 }}>
                      {o.items?.[0]?.drug_name||"Order"}
                      {(o.items?.length??0)>1&&<span style={{color:"#9ca3af"}}> +{o.items.length-1}</span>}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontWeight:700, color:"var(--ab-slate-900)", fontSize:14 }}>
                      KES {Number(o.total_amount||0).toLocaleString("en-KE",{minimumFractionDigits:2})}
                    </div>
                    <div style={{ fontSize:11, color:"var(--ab-slate-400)", textTransform:"capitalize" }}>
                      via {o.payment_method||"cash"}
                    </div>
                  </td>
                  <td>
                    <span style={{ fontSize:12, fontWeight:600, padding:"3px 10px", borderRadius:6,
                      background: o.delivery_type==="pickup"?"#eff6ff":"#f5f3ff",
                      color: o.delivery_type==="pickup"?"#1152d4":"#7c3aed" }}>
                      {o.delivery_type==="pickup"?"Pickup":"Delivery"}
                    </span>
                  </td>
                  <td>
                    <span style={{ display:"inline-flex", alignItems:"center", gap:5, background:sc.bg, color:sc.color, fontSize:12, fontWeight:600, padding:"4px 10px", borderRadius:9999 }}>
                      {sc.icon} {sc.label}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div className="ab-pagination">
          <div className="ab-page-info">
            Showing <strong>{filtered.length}</strong> of <strong>{periodOrders.length}</strong> {PERIOD_TABS[period].toLowerCase()} transactions
          </div>
        </div>
      </div>
    </>
  );
}
