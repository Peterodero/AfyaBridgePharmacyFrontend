import { useState, useCallback, useEffect } from "react";
import {
  RiFileTextLine, RiRefreshLine, RiCalendarLine,
  RiCheckboxCircleFill, RiTimeFill, RiCloseCircleFill,
  RiSearchLine, RiWalletLine, RiArrowUpLine, RiArrowDownLine,
  RiSmartphoneLine, RiExchangeLine, RiAlertLine,
} from "react-icons/ri";
import { useApi } from "../../hooks/useApi";
import { getOrders, getDashboardReport } from "../../services/api";
import { getWallet, depositMpesa, withdrawToMpesa, decodeWalletField } from "../../services/walletApi";
import { useSelector } from "react-redux";

const statusConfig = {
  paid:    { icon: <RiCheckboxCircleFill size={13}/>, label:"Paid",    bg:"#ecfdf5", color:"#059669" },
  unpaid:  { icon: <RiTimeFill size={13}/>,           label:"Unpaid",  bg:"#fffbeb", color:"#d97706" },
  pending: { icon: <RiTimeFill size={13}/>,           label:"Pending", bg:"#fffbeb", color:"#d97706" },
  failed:  { icon: <RiCloseCircleFill size={13}/>,    label:"Failed",  bg:"#fef2f2", color:"#dc2626" },
};

const INITIALS_COLORS = ["#3b82f6","#a855f7","#f97316","#22c55e","#ef4444","#8b5cf6","#0891b2","#65a30d"];
function initials(name="") { return name.split(" ").map(n=>n[0]||"").join("").toUpperCase().slice(0,2)||"?"; }
function colorForName(name="") { let h=0; for(let c of name) h=(h*31+c.charCodeAt(0))%INITIALS_COLORS.length; return INITIALS_COLORS[h]; }

const PERIOD_TABS = ["Daily","Weekly","Monthly"];

function matchesPeriod(order, period) {
  if (!order.created_at) return true;
  const now  = new Date();
  const date = new Date(order.created_at);
  if (period === 0) {
    return date.getFullYear()===now.getFullYear() && date.getMonth()===now.getMonth() && date.getDate()===now.getDate();
  }
  if (period === 1) { const d=new Date(now); d.setDate(now.getDate()-7); return date>=d; }
  const d=new Date(now); d.setDate(now.getDate()-30); return date>=d;
}

// ── Wallet Modals ─────────────────────────────────────────────────────────────

function DepositModal({ userId, onClose, onSuccess }) {
  const [amount,  setAmount]  = useState("");
  const [phone,   setPhone]   = useState("");
  const [email,   setEmail]   = useState("");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  async function handleDeposit() {
    if (!amount || !phone || !email) { setError("All fields are required."); return; }
    setLoading(true); setError("");
    try {
      await depositMpesa({ email, user_id: userId, amount: Number(amount), phone });
      onSuccess("M-Pesa STK push sent. Check your phone to complete payment.");
    } catch(e) {
      setError(e.response?.data?.message || e.message || "Deposit failed.");
    } finally { setLoading(false); }
  }

  return (
    <div className="ab-modal-overlay" onClick={onClose}>
      <div className="ab-modal" style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
        <div className="ab-modal-header">
          <h3>Deposit via M-Pesa</h3>
          <button className="ab-modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="ab-modal-body">
          {error && (
            <div style={{ background:"#fef2f2", color:"#dc2626", fontSize:13, padding:"10px 12px", borderRadius:8, marginBottom:14, display:"flex", gap:8, alignItems:"center" }}>
              <RiAlertLine size={14}/> {error}
            </div>
          )}
          <div className="ab-form-group">
            <label>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" />
          </div>
          <div className="ab-form-group">
            <label>M-Pesa Phone</label>
            <input type="text" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+254700000000" />
          </div>
          <div className="ab-form-group">
            <label>Amount (KES)</label>
            <input type="number" min="1" value={amount} onChange={e => setAmount(e.target.value)} placeholder="e.g. 500" />
          </div>
        </div>
        <div className="ab-modal-footer">
          <button className="ab-btn-secondary" onClick={onClose}>Cancel</button>
          <button className="ab-btn-primary" disabled={loading} onClick={handleDeposit} style={{ background:"#059669" }}>
            <RiSmartphoneLine size={14}/> {loading ? "Sending STK…" : "Send STK Push"}
          </button>
        </div>
      </div>
    </div>
  );
}

function WithdrawModal({ userId, balance, onClose, onSuccess }) {
  const [amount,  setAmount]  = useState("");
  const [phone,   setPhone]   = useState("");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  async function handleWithdraw() {
    if (!amount || !phone) { setError("All fields are required."); return; }
    if (Number(amount) > Number(balance)) { setError("Insufficient balance."); return; }
    setLoading(true); setError("");
    try {
      await withdrawToMpesa({ user_id: userId, amount: Number(amount), phone });
      onSuccess("Withdrawal initiated successfully.");
    } catch(e) {
      setError(e.response?.data?.message || e.message || "Withdrawal failed.");
    } finally { setLoading(false); }
  }

  return (
    <div className="ab-modal-overlay" onClick={onClose}>
      <div className="ab-modal" style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
        <div className="ab-modal-header">
          <h3>Withdraw to M-Pesa</h3>
          <button className="ab-modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="ab-modal-body">
          <div style={{ background:"var(--ab-slate-50)", borderRadius:8, padding:"10px 14px", marginBottom:14, fontSize:13, color:"var(--ab-slate-600)" }}>
            Available balance: <strong>KES {Number(balance||0).toLocaleString("en-KE")}</strong>
          </div>
          {error && (
            <div style={{ background:"#fef2f2", color:"#dc2626", fontSize:13, padding:"10px 12px", borderRadius:8, marginBottom:14, display:"flex", gap:8, alignItems:"center" }}>
              <RiAlertLine size={14}/> {error}
            </div>
          )}
          <div className="ab-form-group">
            <label>M-Pesa Phone</label>
            <input type="text" value={phone} onChange={e => setPhone(e.target.value)} placeholder="0700000000" />
          </div>
          <div className="ab-form-group">
            <label>Amount (KES)</label>
            <input type="number" min="1" max={balance} value={amount} onChange={e => setAmount(e.target.value)} placeholder="e.g. 200" />
          </div>
        </div>
        <div className="ab-modal-footer">
          <button className="ab-btn-secondary" onClick={onClose}>Cancel</button>
          <button className="ab-btn-primary" disabled={loading} onClick={handleWithdraw} style={{ background:"#1152d4" }}>
            <RiArrowUpLine size={14}/> {loading ? "Processing…" : "Withdraw"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Wallet Section ────────────────────────────────────────────────────────────

function WalletSection({ userId }) {
  const [wallet,       setWallet]       = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState("");
  const [showDeposit,  setShowDeposit]  = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [toast,        setToast]        = useState("");

  const fetchWallet = useCallback(async () => {
    if (!userId) return;
    setLoading(true); setError("");
    try {
      const res = await getWallet(userId);
      setWallet(res.data);
    } catch(e) {
      setError(e.response?.data?.message || "Failed to load wallet.");
    } finally { setLoading(false); }
  }, [userId]);

  useEffect(() => { fetchWallet(); }, [fetchWallet]);

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(""), 4000);
  }

  function handleSuccess(msg) {
    setShowDeposit(false);
    setShowWithdraw(false);
    showToast(msg);
    fetchWallet();
  }

  const txHistory  = decodeWalletField(wallet?.transaction_history);
  const recentPays = decodeWalletField(wallet?.recent_payouts);

  const typeStyle = {
    credit:               { color:"#059669", label:"Credit",   icon:<RiArrowDownLine size={12}/> },
    debit:                { color:"#dc2626", label:"Debit",    icon:<RiArrowUpLine size={12}/> },
    deposit:              { color:"#059669", label:"Deposit",  icon:<RiArrowDownLine size={12}/> },
    withdrawal:           { color:"#dc2626", label:"Withdraw", icon:<RiArrowUpLine size={12}/> },
    payment_sent:         { color:"#dc2626", label:"Sent",     icon:<RiArrowUpLine size={12}/> },
    payment_to_provider:  { color:"#dc2626", label:"Paid Out", icon:<RiArrowUpLine size={12}/> },
  };

  return (
    <>
      {toast && (
        <div style={{ position:"fixed", top:20, right:20, background:"#059669", color:"#fff", padding:"12px 18px", borderRadius:10, fontSize:13, fontWeight:600, zIndex:9999, boxShadow:"0 4px 20px rgba(0,0,0,.15)" }}>
          ✓ {toast}
        </div>
      )}

      <div className="ab-card" style={{ marginBottom:24 }}>
        {/* Header */}
        <div className="ab-card-header">
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:36, height:36, background:"#eff6ff", borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center" }}>
              <RiWalletLine size={18} color="#1152d4"/>
            </div>
            <div>
              <div className="ab-card-title">Pharmacy Wallet</div>
              <div style={{ fontSize:12, color:"var(--ab-slate-400)" }}>
                Ref: {wallet?.Reference || "—"}
              </div>
            </div>
          </div>
          <div style={{ display:"flex", gap:8 }}>
            <button className="ab-btn-secondary" onClick={fetchWallet} disabled={loading}>
              <RiRefreshLine size={14}/>
            </button>
            <button className="ab-btn-secondary" onClick={() => setShowDeposit(true)}>
              <RiArrowDownLine size={14}/> Deposit
            </button>
            <button className="ab-btn-primary" onClick={() => setShowWithdraw(true)} style={{ background:"#1152d4" }}>
              <RiArrowUpLine size={14}/> Withdraw
            </button>
          </div>
        </div>

        {error && (
          <div style={{ padding:"12px 20px", background:"#fef2f2", color:"#dc2626", fontSize:13, display:"flex", gap:8, alignItems:"center" }}>
            <RiAlertLine size={14}/> {error}
          </div>
        )}

        {/* Balance + stats */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:16, padding:"20px 20px 0" }}>
          <div style={{ background:"linear-gradient(135deg,#1152d4,#3b82f6)", borderRadius:12, padding:"20px 24px", color:"#fff" }}>
            <div style={{ fontSize:11, fontWeight:600, opacity:0.8, marginBottom:8, textTransform:"uppercase", letterSpacing:"1px" }}>Current Balance</div>
            <div style={{ fontSize:32, fontWeight:800, marginBottom:4 }}>
              {loading ? "…" : `KES ${Number(wallet?.balance||0).toLocaleString("en-KE")}`}
            </div>
            <div style={{ fontSize:12, opacity:0.7 }}>{wallet?.currency || "KES"} · {wallet?.is_active ? "Active" : "Inactive"}</div>
          </div>

          <div className="ab-card" style={{ padding:20, boxShadow:"none", border:"1px solid var(--ab-slate-100)" }}>
            <div style={{ fontSize:11, fontWeight:700, color:"var(--ab-slate-500)", textTransform:"uppercase", letterSpacing:"1px", marginBottom:8 }}>Total Credits</div>
            <div style={{ fontSize:22, fontWeight:800, color:"#059669" }}>
              {loading ? "…" : `KES ${txHistory.filter(t=>Number(t.amount)>0).reduce((s,t)=>s+Math.abs(Number(t.amount)),0).toLocaleString("en-KE")}`}
            </div>
            <div style={{ fontSize:12, color:"var(--ab-slate-400)", marginTop:4 }}>{txHistory.filter(t=>Number(t.amount)>0).length} transactions</div>
          </div>

          <div className="ab-card" style={{ padding:20, boxShadow:"none", border:"1px solid var(--ab-slate-100)" }}>
            <div style={{ fontSize:11, fontWeight:700, color:"var(--ab-slate-500)", textTransform:"uppercase", letterSpacing:"1px", marginBottom:8 }}>Total Debits</div>
            <div style={{ fontSize:22, fontWeight:800, color:"#dc2626" }}>
              {loading ? "…" : `KES ${txHistory.filter(t=>Number(t.amount)<0).reduce((s,t)=>s+Math.abs(Number(t.amount)),0).toLocaleString("en-KE")}`}
            </div>
            <div style={{ fontSize:12, color:"var(--ab-slate-400)", marginTop:4 }}>{txHistory.filter(t=>Number(t.amount)<0).length} transactions</div>
          </div>
        </div>

        {/* Transaction history table */}
        <div style={{ padding:"20px 0 0" }}>
          <div style={{ padding:"0 20px 12px", fontSize:14, fontWeight:700, color:"var(--ab-slate-800)", display:"flex", alignItems:"center", gap:8 }}>
            <RiExchangeLine size={16} color="#1152d4"/> Transaction History
            <span style={{ fontSize:11, color:"var(--ab-slate-400)", fontWeight:400 }}>({txHistory.length} entries)</span>
          </div>
          {loading ? (
            <div style={{ padding:"20px", textAlign:"center", color:"var(--ab-slate-400)", fontSize:13 }}>Loading wallet…</div>
          ) : txHistory.length === 0 ? (
            <div style={{ padding:"30px", textAlign:"center", color:"var(--ab-slate-400)", fontSize:13 }}>No transactions yet.</div>
          ) : (
            <table className="ab-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Reference</th>
                  <th style={{ textAlign:"right" }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {txHistory.slice().reverse().map((tx, i) => {
                  const ts   = typeStyle[tx.type?.toLowerCase()] || typeStyle[tx.transType?.toLowerCase()] || { color:"var(--ab-slate-500)", label: tx.type||tx.transType||"—", icon:null };
                  const amt  = Number(tx.amount);
                  const isPos = amt > 0;
                  const date  = tx.date || tx.created_at;
                  return (
                    <tr key={i}>
                      <td style={{ fontSize:12, color:"var(--ab-slate-500)" }}>
                        {date ? new Date(date).toLocaleString("en-KE", { day:"2-digit", month:"short", hour:"2-digit", minute:"2-digit" }) : "—"}
                      </td>
                      <td>
                        <span style={{ display:"inline-flex", alignItems:"center", gap:5, fontSize:11, fontWeight:700, padding:"2px 8px", borderRadius:9999, background: isPos?"#ecfdf5":"#fef2f2", color: isPos?"#059669":"#dc2626" }}>
                          {isPos ? <RiArrowDownLine size={11}/> : <RiArrowUpLine size={11}/>}
                          {ts.label}
                        </span>
                      </td>
                      <td style={{ fontSize:12, color:"var(--ab-slate-500)" }}>
                        {tx.reference || tx.ref || tx.related_user?.slice(0,8) || "—"}
                      </td>
                      <td style={{ textAlign:"right", fontWeight:700, fontSize:13, color: isPos?"#059669":"#dc2626" }}>
                        {isPos ? "+" : ""}KES {Math.abs(amt).toLocaleString("en-KE")}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Recent payouts */}
        {recentPays.length > 0 && (
          <div style={{ padding:"16px 20px", borderTop:"1px solid var(--ab-slate-100)" }}>
            <div style={{ fontSize:13, fontWeight:700, color:"var(--ab-slate-700)", marginBottom:12 }}>Recent Payouts</div>
            <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
              {recentPays.map((p,i) => (
                <div key={i} style={{ background:"var(--ab-slate-50)", borderRadius:8, padding:"10px 14px", fontSize:12 }}>
                  <div style={{ fontWeight:700, color:"var(--ab-slate-800)" }}>KES {Number(p.amount).toLocaleString("en-KE")}</div>
                  <div style={{ color:"var(--ab-slate-400)", marginTop:2 }}>{p.method} · {p.status}</div>
                  <div style={{ color:"var(--ab-slate-300)", marginTop:2 }}>
                    {p.created_at ? new Date(p.created_at).toLocaleDateString("en-KE") : ""}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {showDeposit  && <DepositModal  userId={userId} onClose={()=>setShowDeposit(false)}  onSuccess={handleSuccess} />}
      {showWithdraw && <WithdrawModal userId={userId} balance={wallet?.balance} onClose={()=>setShowWithdraw(false)} onSuccess={handleSuccess} />}
    </>
  );
}

// ── Main Payments component ───────────────────────────────────────────────────

export default function Payments() {
  const [period,       setPeriod]       = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [methodFilter, setMethodFilter] = useState("");
  const [search,       setSearch]       = useState("");
  const [searchInput,  setSearchInput]  = useState("");

  const user = useSelector(state => state.auth.user);
  const userId = user?.id;

  const { data: deliveredData, loading, refetch } = useApi(
    getOrders, { status:"delivered", page_size:200 }, [], { silent: true }
  );
  const { data: dashStats, loading: dashLoading } = useApi(
    getDashboardReport, null, [], { silent: true }
  );

  const rawOrders = (() => {
    const d = deliveredData;
    if (!d) return [];
    return Array.isArray(d) ? d : d?.results ?? [];
  })();

  const periodOrders = rawOrders.filter(o => matchesPeriod(o, period));

  const filtered = periodOrders.filter(o => {
    const ps = o.payment_status || "unpaid";
    const pm = o.payment_method || "cash";
    if (statusFilter && ps !== statusFilter) return false;
    if (methodFilter && pm !== methodFilter) return false;
    if (search && !o.patient_name?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const totalRevenue  = periodOrders.reduce((s,o)=>s+Number(o.total_amount||0),0);
  const mpesaRevenue  = periodOrders.filter(o=>o.payment_method==="mpesa"||o.payment_method==="m-pesa").reduce((s,o)=>s+Number(o.total_amount||0),0);
  const pendingAmount = rawOrders.filter(o=>o.payment_status==="unpaid"||o.payment_status==="pending").reduce((s,o)=>s+Number(o.total_amount||0),0);
  const pendingCount  = rawOrders.filter(o=>o.payment_status==="unpaid"||o.payment_status==="pending").length;
  const todayRevenue  = Number(dashStats?.today_revenue || 0);

  return (
    <>
      {/* Header */}
      <div className="ab-page-header">
        <div className="ab-page-title">
          <h1>Financial Overview</h1>
          <div style={{ display:"flex", alignItems:"center", gap:6, marginTop:4 }}>
            <RiRefreshLine size={14} color="#059669"/>
            <span style={{ fontSize:13, color:"var(--ab-slate-500)" }}>
              {loading ? "Syncing…" : "Live from delivered orders"}
            </span>
          </div>
        </div>
        <div style={{ display:"flex", gap:10 }}>
          <button className="ab-btn-secondary" onClick={refetch}><RiRefreshLine size={15}/> Refresh</button>
        </div>
      </div>

      {/* Stat Cards */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:20, marginBottom:28 }}>
        <div className="ab-card" style={{ padding:24 }}>
          <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:12 }}>
            <div style={{ fontSize:11, fontWeight:700, color:"var(--ab-slate-500)", textTransform:"uppercase", letterSpacing:"1.2px" }}>Today's Revenue</div>
            <span style={{ fontSize:10, fontWeight:800, color:"#059669", background:"#ecfdf5", padding:"2px 8px", borderRadius:4 }}>TODAY</span>
          </div>
          <div style={{ fontSize:28, fontWeight:800, color:"var(--ab-slate-900)", marginBottom:6 }}>
            {dashLoading ? "…" : `KES ${todayRevenue.toLocaleString("en-KE",{minimumFractionDigits:0})}`}
          </div>
          <div style={{ fontSize:13, color:"var(--ab-green)", fontWeight:500 }}>From /reporting/dashboard</div>
        </div>

        <div className="ab-card" style={{ padding:24 }}>
          <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:12 }}>
            <div style={{ fontSize:11, fontWeight:700, color:"var(--ab-slate-500)", textTransform:"uppercase", letterSpacing:"1.2px" }}>{PERIOD_TABS[period]} Revenue</div>
            <div style={{ width:36, height:36, background:"var(--ab-slate-100)", borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center" }}>
              <RiFileTextLine size={18} color="var(--ab-slate-400)"/>
            </div>
          </div>
          <div style={{ fontSize:28, fontWeight:800, color:"var(--ab-slate-900)", marginBottom:6 }}>
            {loading ? "…" : `KES ${totalRevenue.toLocaleString("en-KE",{minimumFractionDigits:0})}`}
          </div>
          <div style={{ fontSize:13, color:"var(--ab-green)", fontWeight:600 }}>{periodOrders.length} completed orders</div>
        </div>

        <div className="ab-card" style={{ padding:24 }}>
          <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:12 }}>
            <div style={{ fontSize:11, fontWeight:700, color:"var(--ab-slate-500)", textTransform:"uppercase", letterSpacing:"1.2px" }}>M-Pesa Collections</div>
            <span style={{ fontSize:11, fontWeight:800, color:"#059669", background:"#ecfdf5", padding:"2px 8px", borderRadius:4 }}>M-PESA</span>
          </div>
          <div style={{ fontSize:28, fontWeight:800, color:"var(--ab-slate-900)", marginBottom:6 }}>
            {loading ? "…" : `KES ${mpesaRevenue.toLocaleString("en-KE",{minimumFractionDigits:0})}`}
          </div>
          <div style={{ fontSize:13, color:"var(--ab-green)", fontWeight:500 }}>
            {totalRevenue>0 ? `${Math.round((mpesaRevenue/totalRevenue)*100)}% of period volume` : "—"}
          </div>
        </div>

        <div className="ab-card" style={{ padding:24 }}>
          <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:12 }}>
            <div style={{ fontSize:11, fontWeight:700, color:"var(--ab-slate-500)", textTransform:"uppercase", letterSpacing:"1.2px" }}>Pending / Claims</div>
            <div style={{ width:36, height:36, background:"#fffbeb", borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center" }}>
              <RiCalendarLine size={18} color="var(--ab-amber)"/>
            </div>
          </div>
          <div style={{ fontSize:28, fontWeight:800, color:"var(--ab-slate-900)", marginBottom:6 }}>
            {loading ? "…" : `KES ${pendingAmount.toLocaleString("en-KE",{minimumFractionDigits:0})}`}
          </div>
          <div style={{ fontSize:13, color:"var(--ab-amber)", fontWeight:500 }}>
            ⚠ {pendingCount} {pendingCount===1?"order":"orders"} awaiting payment
          </div>
        </div>
      </div>

      {/* Wallet Section */}
      {userId && <WalletSection userId={userId} />}

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

        <table className="ab-table">
          <thead>
            <tr>
              <th>Date &amp; Order</th><th>Patient</th><th>Items</th>
              <th>Amount</th><th>Method</th><th>Status</th>
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
                    <div style={{ fontSize:11, color:"var(--ab-slate-400)", textTransform:"capitalize" }}>via {o.payment_method||"cash"}</div>
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