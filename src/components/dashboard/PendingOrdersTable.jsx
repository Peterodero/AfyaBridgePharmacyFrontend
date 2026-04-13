import OrderRowSkeleton from "../skeletons/OrderRowSkeleton";

export default function PendingOrdersTable({ orders, ordersLoading, pharmacyLinked, onRefresh, onViewOrder }) {
  return (
    <div className="ab-card">
      <div className="ab-card-header">
        <div>
          <div className="ab-card-title">Pending Orders</div>
          <p className="subtitle">Latest orders waiting to be processed</p>
        </div>
        <button className="ab-btn-secondary" onClick={onRefresh}>
          Refresh
        </button>
      </div>

      <div className="ab-table-wrap">
        <table className="ab-table">
          <thead>
            <tr>
              <th>Order #</th>
              <th>Patient</th>
              <th>Medication</th>
              <th>Amount</th>
              <th>Priority</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {ordersLoading ? (
              <OrderRowSkeleton rows={5} />
            ) : orders.length > 0 ? (
              orders.map((order, index) => {
                const items = order.prescription?.items ?? [];
                const first = items[0];
                return (
                  <tr key={order.id ?? index}>
                    <td style={{ fontWeight:600, fontSize:13 }}>
                      {order.order_number || order.id?.slice(0,8).toUpperCase()}
                    </td>
                    <td>
                      <div style={{ fontWeight:500, fontSize:13 }}>{order.patient_name || "—"}</div>
                      <div style={{ fontSize:11, color:"var(--ab-slate-400)" }}>{order.patient_phone || "—"}</div>
                    </td>
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
                        <span style={{ fontSize:13, color:"#9ca3af" }}>—</span>
                      )}
                    </td>
                    <td style={{ fontWeight:600, fontSize:13 }}>
                      KES {Number(order.total_amount || 0).toLocaleString("en-KE")}
                    </td>
                    <td>
                      <span className={`ab-priority ${order.priority || "normal"}`}>
                        {order.priority || "normal"}
                      </span>
                    </td>
                    <td>
                      <button className="ab-btn-view" onClick={onViewOrder}>
                        View
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="6" style={{ textAlign:"center", color:"#9ca3af", padding:48 }}>
                  {pharmacyLinked
                    ? "No pending orders at the moment"
                    : "Orders will appear once your pharmacy is approved and linked"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}