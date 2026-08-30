import React from 'react';

export const ALLOWED_STATUSES = [
  'Out of Delivery',
  'Arrive',
  'Warehouse',
  'Delivered',
  'Pending',
  'Picked Up',
  'Postponed',
  'Returned',
  'Exchange'
];

export const STATUS_CONFIG = {
  'Out of Delivery': { label: 'Out of Delivery', style: 'bg-blue-50 text-blue-700 border-blue-300' },
  'Out for Delivery': { label: 'Out of Delivery', style: 'bg-blue-50 text-blue-700 border-blue-300' },
  'Arrive': { label: 'Arrive', style: 'bg-purple-50 text-purple-700 border-purple-300' },
  'Arrived': { label: 'Arrive', style: 'bg-purple-50 text-purple-700 border-purple-300' },
  'Warehouse': { label: 'Warehouse', style: 'bg-slate-100 text-slate-800 border-slate-300' },
  'In Warehouse': { label: 'Warehouse', style: 'bg-slate-100 text-slate-800 border-slate-300' },
  'Delivered': { label: 'Delivered', style: 'bg-emerald-50 text-emerald-800 border-emerald-300' },
  'Pending': { label: 'Pending', style: 'bg-amber-50 text-amber-800 border-amber-300' },
  'Pick Up Requested': { label: 'Pending', style: 'bg-amber-50 text-amber-800 border-amber-300' },
  'Picked Up': { label: 'Picked Up', style: 'bg-teal-50 text-teal-800 border-teal-300' },
  'Postponed': { label: 'Postponed', style: 'bg-orange-50 text-orange-800 border-orange-300' },
  'Returned': { label: 'Returned', style: 'bg-rose-50 text-rose-800 border-rose-300' },
  'Returned to Vendor': { label: 'Returned', style: 'bg-rose-50 text-rose-800 border-rose-300' },
  'Exchange': { label: 'Exchange', style: 'bg-indigo-50 text-indigo-800 border-indigo-300' },
  'Exchanged': { label: 'Exchange', style: 'bg-indigo-50 text-indigo-800 border-indigo-300' },
  'Dispatch': { label: 'Out of Delivery', style: 'bg-blue-50 text-blue-700 border-blue-300' },
  'Dispatched': { label: 'Out of Delivery', style: 'bg-blue-50 text-blue-700 border-blue-300' },
  'Cancelled': { label: 'Cancelled', style: 'bg-red-50 text-red-700 border-red-300' },
};

export function getStatusBadgeData(status) {
  return STATUS_CONFIG[status] || {
    label: status || 'Pending',
    style: 'bg-slate-100 text-slate-700 border-slate-300'
  };
}

export function StatusBadge({ status, className = '' }) {
  const config = getStatusBadgeData(status);
  const base = "inline-flex items-center justify-center px-2.5 py-0.5 rounded-md text-[11px] font-bold tracking-wide uppercase border select-none transition-all shadow-xs";
  
  return (
    <span className={`${base} ${config.style} ${className}`}>
      {config.label}
    </span>
  );
}

export default StatusBadge;
