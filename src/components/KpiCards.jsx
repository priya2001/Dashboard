export default function KpiCards({ metrics }) {
  return (
    <div className="kpi-row">
      <div className="kpi-card">
        <div className="kpi-icon">🛢</div>
        <div className="kpi-label">Total Wells</div>
        <div className="kpi-value">{metrics.totalText}</div>
        <div className="kpi-sub" id="kpiTotalSub">
          filtered records
        </div>
      </div>
      <div className="kpi-card">
        <div className="kpi-icon">✅</div>
        <div className="kpi-label">Active Wells</div>
        <div className="kpi-value">{metrics.activeText}</div>
        <div className="kpi-sub">{metrics.activePctText}</div>
      </div>
      <div className="kpi-card">
        <div className="kpi-icon">🏢</div>
        <div className="kpi-label">Unique Operators</div>
        <div className="kpi-value">{metrics.operatorsText}</div>
        <div className="kpi-sub">distinct companies</div>
      </div>
      <div className="kpi-card">
        <div className="kpi-icon">📍</div>
        <div className="kpi-label">Counties Covered</div>
        <div className="kpi-value">{metrics.countiesText}</div>
        <div className="kpi-sub">geographic spread</div>
      </div>
      <div className="kpi-card">
        <div className="kpi-icon">⚠️</div>
        <div className="kpi-label">Inactive / Plugged</div>
        <div className="kpi-value">{metrics.inactiveText}</div>
        <div className="kpi-sub">{metrics.inactivePctText}</div>
      </div>
    </div>
  );
}

