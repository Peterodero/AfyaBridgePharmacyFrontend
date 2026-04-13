export default function WelcomeCard({ userName, pharmacyLinked, pharmacyId, accountStatus }) {
  return (
    <div className="ab-card">
      <div className="ab-card-header">
        <div className="ab-card-title">Welcome, {userName.split(" ")[0]}</div>
      </div>
      <div style={{ padding: "0 20px 16px", fontSize: 13, color: "var(--ab-slate-500)" }}>
        {pharmacyLinked ? `ID: ${pharmacyId?.slice(0, 8).toUpperCase()} · ${accountStatus}` : "Awaiting pharmacy linkage"}
      </div>
      <div>
        <div className="ab-updates-item">
          <div className="ab-update-icon blue">🛒</div>
          <div>
            <div className="ab-update-text"><strong>New order received</strong></div>
            <div className="ab-update-time">2 mins ago</div>
          </div>
        </div>
        <div className="ab-updates-item">
          <div className="ab-update-icon green">💰</div>
          <div>
            <div className="ab-update-text"><strong>Payment received</strong></div>
            <div className="ab-update-time">45 mins ago</div>
          </div>
        </div>
        <div className="ab-updates-item">
          <div className="ab-update-icon purple">🚚</div>
          <div>
            <div className="ab-update-text"><strong>Delivery completed</strong></div>
            <div className="ab-update-time">2 hours ago</div>
          </div>
        </div>
      </div>
    </div>
  );
}