export default function ReadyOrdersTable({ orders, loading, pharmacyLinked, onNavigate }) {
  return (
    <div className="ab-card">
      <div className="ab-card-header">
        <div>
          <div className="ab-card-title">Ready for Pickup / Dispatch</div>
          <p className="subtitle">Orders awaiting patient or rider</p>
        </div>
        <span style={{
          fontSize: 12,
          fontWeight: 700,
          color: "#059669",
          background: "#ecfdf5",
          padding: "3px 10px",
          borderRadius: 9999
        }}>
          {loading ? "…" : orders.length} ready
        </span>
      </div>
      <div className="ab-table-wrap">
        <table className="ab-table">
          <thead>
            <tr>
              <th>Order #</th>
              <th>Patient</th>
              <th>Phone</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="4" style={{ textAlign: "center", color: "#9ca3af", padding: 20 }}>Loading…</td>
              </tr>
            ) : orders.length > 0 ? (
              orders.map((order, index) => (
                <tr key={index}>
                  <td style={{ fontWeight: 600, fontSize: 13 }}>
                    {order.order_number || order.id?.slice(0, 8).toUpperCase()}
                  </td>
                  <td style={{ fontSize: 13 }}>{order.patient_name}</td>
                  <td style={{ fontSize: 12, color: "var(--ab-slate-500)" }}>{order.patient_phone}</td>
                  <td>
                    <button className="ab-btn-view" onClick={onNavigate}>
                      {order.delivery_type === "pickup" ? "Dispense" : "Assign Rider"}
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" style={{ textAlign: "center", color: "#9ca3af", padding: 20 }}>
                  No orders ready yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}