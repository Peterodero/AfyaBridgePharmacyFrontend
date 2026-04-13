export default function TodayOrdersTable({ orders, loading, pharmacyLinked }) {
  return (
    <div className="ab-card">
      <div className="ab-card-header">
        <div>
          <div className="ab-card-title">Today's Orders</div>
          <p className="subtitle">All orders received today</p>
        </div>
        <span style={{
          fontSize: 12, fontWeight: 700, color: "var(--ab-blue)",
          background: "#eff6ff", padding: "3px 10px", borderRadius: 9999,
        }}>
          {loading ? "…" : orders.length} orders
        </span>
      </div>

      <div className="ab-table-wrap">
        <table className="ab-table">
          <thead>
            <tr>
              <th>Order #</th>
              <th>Patient</th>
              <th>Medication</th>
              <th>Type</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="5" style={{ textAlign:"center", color:"#9ca3af", padding:20 }}>Loading…</td>
              </tr>
            ) : orders.length > 0 ? (
              orders.map((order, index) => {
                const items = order.prescription?.items ?? [];
                const first = items[0];
                return (
                  <tr key={order.id ?? index}>
                    <td style={{ fontWeight:600, fontSize:13 }}>
                      {order.order_number || order.id?.slice(0,8).toUpperCase()}
                    </td>
                    <td style={{ fontSize:13 }}>{order.patient_name}</td>
                    <td>
                      {first ? (
                        <>
                          <div style={{ fontWeight:600, fontSize:13 }}>{first.name}</div>
                          <div style={{ fontSize:11, color:"var(--ab-slate-400)" }}>
                            {first.dosage}{first.frequency ? ` · ${first.frequency}` : ""}
                            {items.length > 1 && (
                              <span style={{ color:"#9ca3af" }}> +{items.length - 1} more</span>
                            )}
                          </div>
                        </>
                      ) : (
                        <span style={{ color:"#9ca3af", fontSize:13 }}>—</span>
                      )}
                    </td>
                    <td>
                      <span style={{
                        fontSize:11, fontWeight:600, padding:"2px 8px", borderRadius:6,
                        background: order.delivery_type === "pickup" ? "#eff6ff" : "#f5f3ff",
                        color:      order.delivery_type === "pickup" ? "#1152d4" : "#7c3aed",
                      }}>
                        {order.delivery_type === "pickup" ? "Pickup" : "Delivery"}
                      </span>
                    </td>
                    <td>
                      <span className={`ab-status ${order.status}`}>{order.status}</span>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="5" style={{ textAlign:"center", color:"#9ca3af", padding:20 }}>
                  No orders today yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}