import React from 'react';

const colorMap = {
  primary: { bg: 'bg-primary-soft', text: 'text-primary-color' },
  success: { bg: 'bg-success-soft', text: 'text-success' },
  warning: { bg: 'bg-warning-soft', text: 'text-warning' },
  danger:  { bg: 'bg-danger-soft',  text: 'text-danger' },
  info:    { bg: 'bg-info-soft',    text: 'text-info' },
  purple:  { bg: 'bg-purple-soft',  text: 'text-primary-color' },
};

const MetricCard = ({ title, value, icon, color = 'primary' }) => {
  const c = colorMap[color] || colorMap.primary;
  return (
    <div className="metric-card">
      <div className={`metric-icon ${c.bg}`}>
        <span className={c.text}>{icon}</span>
      </div>
      <div className="metric-data">
        <h3>{title}</h3>
        <p className="metric-value">{value}</p>
      </div>
    </div>
  );
};

export default MetricCard;
