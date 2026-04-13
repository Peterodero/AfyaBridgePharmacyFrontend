import { useState } from "react";

// Order Details Modal - Using your CSS classes
export default function OrderDetailsModal({ order, onClose, TAB_LABELS }) {
  const [activeTab, setActiveTab] = useState("items");
  
  if (!order) return null;

  const items = order.prescription?.items || [];
  const prescription = order.prescription || {};
  
  const formatDate = (dateString) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleString("en-KE", {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusClass = (status) => {
    const classes = {
      pending: "ab-badge-pending",
      processing: "ab-badge-processing",
      ready: "ab-badge-ready",
      dispatched: "ab-badge-dispatched",
      delivered: "ab-badge-delivered",
      cancelled: "ab-badge-cancelled"
    };
    return classes[status] || "ab-badge-pending";
  };

  return (
    <div className="ab-modal-overlay" onClick={onClose}>
      <div className="ab-modal" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="ab-modal-header">
          <div>
            <h3>Order Details</h3>
            <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '4px' }}>
              {order.order_number}
            </p>
          </div>
          <button className="ab-modal-close" onClick={onClose}>✕</button>
        </div>

        {/* Tabs */}
        <div className="ab-modal-tabs">
          {[
            { id: "items", label: "Medications" },
            { id: "patient", label: "Patient Info" },
            { id: "payment", label: "Payment" },
            { id: "delivery", label: "Delivery" },
          ].map(tab => (
            <div
              key={tab.id}
              className={`ab-modal-tab ${activeTab === tab.id ? "active" : ""}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </div>
          ))}
        </div>

        {/* Content */}
        <div className="ab-modal-body">
          {/* Medications Tab */}
          {activeTab === "items" && (
            <div>
              <div className="ab-modal-section">
                <div className="ab-modal-section-title">
                  <span style={{ marginLeft: 'auto', fontSize: '0.7rem', color: '#94a3b8' }}>
                    {items.length} item(s)
                  </span>
                </div>
                
                {items.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                    No medications found
                  </div>
                ) : (
                  <div>
                    {items.map((item, idx) => (
                      <div key={idx} className="ab-medication-item">
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                          <strong style={{ color: '#1e293b' }}>{item.name}</strong>
                          <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Item {idx + 1}</span>
                        </div>
                        <div className="ab-info-grid">
                          <div>
                            <span className="ab-info-label">Dosage</span>
                            <span className="ab-info-value">{item.dosage || "—"}</span>
                          </div>
                          <div>
                            <span className="ab-info-label">Frequency</span>
                            <span className="ab-info-value">{item.frequency || "—"}</span>
                          </div>
                          <div>
                            <span className="ab-info-label">Duration</span>
                            <span className="ab-info-value">{item.duration || "—"}</span>
                          </div>
                          <div>
                            <span className="ab-info-label">Quantity</span>
                            <span className="ab-info-value">{item.quantity || "N/A"}</span>
                          </div>
                        </div>
                        {item.instructions && (
                          <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid #e5e7eb' }}>
                            <span className="ab-info-label">Instructions</span>
                            <p style={{ fontSize: '0.8rem', color: '#475569', marginTop: '0.25rem' }}>{item.instructions}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Prescription Info */}
              {prescription && (
                <div className="ab-info-card" style={{ background: 'linear-gradient(135deg, #eff6ff 0%, #ffffff 100%)' }}>
                  <div className="ab-modal-section-title" style={{ color: '#2563eb' }}>
                    Prescription Information
                  </div>
                  <div className="ab-info-grid">
                    <div>
                      <span className="ab-info-label">Prescription #</span>
                      <span className="ab-info-value">{prescription.prescription_number || "—"}</span>
                    </div>
                    <div>
                      <span className="ab-info-label">Doctor</span>
                      <span className="ab-info-value">{prescription.doctor_name || "—"}</span>
                    </div>
                    <div>
                      <span className="ab-info-label">Issue Date</span>
                      <span className="ab-info-value">{formatDate(prescription.issue_date)}</span>
                    </div>
                    <div>
                      <span className="ab-info-label">Status</span>
                      <span className={`ab-badge ${getStatusClass(prescription.status)}`}>
                        {prescription.status || "—"}
                      </span>
                    </div>
                  </div>
                  {prescription.diagnosis && (
                    <div style={{ marginTop: '0.75rem' }}>
                      <span className="ab-info-label">Diagnosis</span>
                      <p style={{ fontSize: '0.8rem', color: '#1e293b', marginTop: '0.25rem' }}>{prescription.diagnosis}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Patient Info Tab */}
          {activeTab === "patient" && (
            <div>
              <div className="ab-info-card">
                <div className="ab-modal-section-title">👤 Patient Information</div>
                <div className="ab-info-grid">
                  <div className="ab-info-label">Full Name</div>
                  <div className="ab-info-value">{order.patient_name || "—"}</div>
                  <div className="ab-info-label">Phone Number</div>
                  <div className="ab-info-value">{order.patient_phone || "—"}</div>
                  <div className="ab-info-label">Address</div>
                  <div className="ab-info-value">{order.patient_address || "—"}</div>
                </div>
              </div>

              <div className="ab-info-card">
                <div className="ab-modal-section-title">📦 Order Summary</div>
                <div className="ab-info-grid">
                  <div>
                    <span className="ab-info-label">Order Date</span>
                    <span className="ab-info-value">{formatDate(order.created_at)}</span>
                  </div>
                  <div>
                    <span className="ab-info-label">Last Updated</span>
                    <span className="ab-info-value">{formatDate(order.updated_at)}</span>
                  </div>
                  <div>
                    <span className="ab-info-label">Status</span>
                    <span className={`ab-badge ${getStatusClass(order.status)}`}>
                      {TAB_LABELS[order.status] || order.status}
                    </span>
                  </div>
                  <div>
                    <span className="ab-info-label">Priority</span>
                    <span className="ab-info-value" style={{ textTransform: 'capitalize' }}>
                      {order.priority || "normal"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Payment Tab */}
          {activeTab === "payment" && (
            <div className="ab-info-card">
              <div className="ab-modal-section-title"> Payment Details</div>
              <div className="ab-info-grid">
                <div className="ab-info-label">Total Amount</div>
                <div className="ab-info-value" style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>
                  KES {Number(order.total_amount || 0).toLocaleString("en-KE")}
                </div>
                <div className="ab-info-label">Payment Status</div>
                <div className="ab-info-value" style={{ color: order.payment_status === "paid" ? "#059669" : "#d97706" }}>
                  {order.payment_status === "paid" ? "✓ Paid" : (order.payment_status || "Unpaid")}
                </div>
                <div className="ab-info-label">Payment Method</div>
                <div className="ab-info-value" style={{ textTransform: 'capitalize' }}>
                  {order.payment_method || "—"}
                </div>
                <div className="ab-info-label">M-Pesa Reference</div>
                <div className="ab-info-value" style={{ fontFamily: 'monospace' }}>
                  {order.mpesa_ref || "—"}
                </div>
              </div>
            </div>
          )}

          {/* Delivery Tab */}
          {activeTab === "delivery" && (
            <div>
              <div className="ab-info-card">
                <div className="ab-modal-section-title">Delivery Information</div>
                <div className="ab-info-grid">
                  <div>
                    <span className="ab-info-label">Delivery Type</span>
                    <span className="ab-info-value" style={{ textTransform: 'capitalize' }}>
                      {order.delivery_type === "home_delivery" ? "Home Delivery" : (order.delivery_type === "pickup" ? "Pickup" : (order.delivery_type || "—"))}
                    </span>
                  </div>
                  <div>
                    <span className="ab-info-label">Delivery Address</span>
                    <span className="ab-info-value">{order.patient_address || "—"}</span>
                  </div>
                </div>
              </div>

              {/* Rider Information */}
              {order.rider && (
                <div className="ab-info-card" style={{ background: 'linear-gradient(135deg, #faf5ff 0%, #ffffff 100%)' }}>
                  <div className="ab-modal-section-title" style={{ color: '#7c3aed' }}>🛵 Rider Information</div>
                  <div className="ab-info-grid">
                    <div>
                      <span className="ab-info-label">Rider Name</span>
                      <span className="ab-info-value">{order.rider.name || "—"}</span>
                    </div>
                    <div>
                      <span className="ab-info-label">Phone</span>
                      <span className="ab-info-value">{order.rider.phone || "—"}</span>
                    </div>
                    <div>
                      <span className="ab-info-label">Vehicle</span>
                      <span className="ab-info-value" style={{ textTransform: 'capitalize' }}>{order.rider.vehicle_type || "—"}</span>
                    </div>
                    <div>
                      <span className="ab-info-label">Plate Number</span>
                      <span className="ab-info-value" style={{ textTransform: 'uppercase' }}>{order.rider.plate_number || "—"}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Tracking Information */}
              {order.tracking && (
                <div className="ab-info-card" style={{ background: 'linear-gradient(135deg, #ecfdf5 0%, #ffffff 100%)' }}>
                  <div className="ab-modal-section-title" style={{ color: '#059669' }}>📍 Tracking Information</div>
                  <div className="ab-info-grid">
                    <div>
                      <span className="ab-info-label">Tracking Number</span>
                      <span className="ab-info-value" style={{ fontFamily: 'monospace' }}>{order.tracking.number || "—"}</span>
                    </div>
                    <div>
                      <span className="ab-info-label">Estimated Delivery</span>
                      <span className="ab-info-value">{order.tracking.eta || "—"}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="ab-modal-footer">
          <button className="ab-btn-secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}