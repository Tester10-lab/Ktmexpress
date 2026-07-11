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
    <div className="card-premium p-4 sm:p-6 flex items-center justify-between group cursor-default min-w-0">
      <div className="min-w-0 flex-1">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 truncate" title={title}>{title}</h3>
        <p className="text-2xl sm:text-3xl font-bold text-slate-700 tracking-tight truncate" title={String(value)}>{value}</p>
      </div>
      <div className={`w-12 h-12 sm:w-16 sm:h-16 neumorphic-circle flex-shrink-0 ml-3 ${c}`}>
        <span className="[&>svg]:w-6 [&>svg]:h-6 sm:[&>svg]:w-8 sm:[&>svg]:h-8">{icon}</span>
      </div>
    </div>
  );
};

export default MetricCard;
