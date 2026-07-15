import React from 'react';

const hexMap = {
  primary: '#3b82f6', // blue
  success: '#10b981', // emerald
  warning: '#f59e0b', // amber
  danger:  '#ef4444', // red
  info:    '#06b6d4', // cyan
  purple:  '#8b5cf6', // purple
};

const MetricCard = ({ title, value, icon, color = 'primary' }) => {
  const hex = hexMap[color] || hexMap.primary;

  return (
    <div className="cursor-default hover:shadow-md transition-shadow h-full flex flex-col justify-between" style={{ background: '#fff', borderRadius: 12, border: `1px solid ${hex}25`, padding: '18px 20px', boxShadow: `0 2px 8px ${hex}10` }}>
      <div style={{ fontSize: 28, marginBottom: 8, color: hex }} className="[&>svg]:w-7 [&>svg]:h-7 [&>svg]:text-current [&>svg]:opacity-80">
        {icon}
      </div>
      <div style={{ fontSize: 28, fontWeight: 800, color: hex, lineHeight: 1 }} className="truncate" title={String(value)}>
        {value}
      </div>
      <div style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }} className="truncate" title={title}>
        {title}
      </div>
    </div>
  );
};

export default MetricCard;
