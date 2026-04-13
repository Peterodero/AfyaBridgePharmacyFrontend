export default function PharmacyNotLinkedBanner({ pharmacyLinked, user }) {
  if (pharmacyLinked || !user) return null;
  
  return (
    <div style={{
      background: "#fffbeb",
      border: "1px solid #fcd34d",
      borderRadius: 10,
      padding: "14px 20px",
      marginBottom: 24,
      display: "flex",
      alignItems: "center",
      gap: 12
    }}>
      <span style={{ fontSize: 20 }}>⚠️</span>
      <div>
        <div style={{ fontWeight: 700, fontSize: 14, color: "#92400e" }}>
          Pharmacy not linked
        </div>
        <div style={{ fontSize: 13, color: "#b45309", marginTop: 2 }}>
          Your account is active but not yet linked to a pharmacy.
          Contact your administrator or wait for approval.
        </div>
      </div>
    </div>
  );
}