import React from 'react';

const colorMap = {
  primary: { bg: 'bg-brand-50 text-brand-600 border-brand-100', icon: 'text-brand-600' },
  success: { bg: 'bg-emerald-50 text-emerald-600 border-emerald-100', icon: 'text-emerald-600' },
  warning: { bg: 'bg-amber-50 text-amber-600 border-amber-100', icon: 'text-amber-600' },
  danger:  { bg: 'bg-red-50 text-red-600 border-red-100', icon: 'text-red-600' },
  info:    { bg: 'bg-sky-50 text-sky-600 border-sky-100', icon: 'text-sky-600' },
  purple:  { bg: 'bg-purple-50 text-purple-600 border-purple-100', icon: 'text-purple-600' },
};

const MetricCard = ({ title, value, icon, color = 'primary' }) => {
  const c = colorMap[color] || colorMap.primary;
  return (
    <div className="card-premium p-5 flex items-center gap-4 group hover:shadow-md transition-shadow">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 border ${c.bg}`}>
        <span className={`[&>svg]:w-6 [&>svg]:h-6 ${c.icon}`}>{icon}</span>
      </div>
      <div>
        <h3 className="text-sm font-medium text-slate-500 mb-0.5">{title}</h3>
        <p className="text-2xl font-bold text-slate-900 tracking-tight">{value}</p>
      </div>
    </div>
  );
};

export default MetricCard;
