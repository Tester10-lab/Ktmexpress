import React from 'react';

const colorMap = {
  primary: 'text-brand-600',
  success: 'text-emerald-500',
  warning: 'text-amber-500',
  danger:  'text-red-500',
  info:    'text-sky-500',
  purple:  'text-purple-500',
};

const MetricCard = ({ title, value, icon, color = 'primary' }) => {
  const c = colorMap[color] || colorMap.primary;
  return (
    <div className="card-premium p-6 flex items-center justify-between group cursor-default">
      <div>
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{title}</h3>
        <p className="text-4xl font-bold text-slate-700 tracking-tight">{value}</p>
      </div>
      <div className={`w-16 h-16 neumorphic-circle flex-shrink-0 ${c}`}>
        <span className="[&>svg]:w-8 [&>svg]:h-8">{icon}</span>
      </div>
    </div>
  );
};

export default MetricCard;
