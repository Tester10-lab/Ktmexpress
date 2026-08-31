import React from 'react';

export const ALLOWED_STATUSES = [
  'Out for Delivery',
  'Arrived',
  'Warehouse',
  'Dispatched',
  'Delivered',
  'Pending',
  'Picked Up',
  'Postponed',
  'Returned',
  'Exchange',
  'Pick Up Requested'
];

export const STATUS_CONFIG = {
  'Out for Delivery': { label: 'Out for Delivery', style: 'bg-blue-50 text-blue-700 border-blue-300' },
  'Out of Delivery': { label: 'Out for Delivery', style: 'bg-blue-50 text-blue-700 border-blue-300' },
  'Arrived': { label: 'Arrived', style: 'bg-purple-50 text-purple-700 border-purple-300' },
  'Arrive': { label: 'Arrived', style: 'bg-purple-50 text-purple-700 border-purple-300' },
  'Warehouse': { label: 'Warehouse', style: 'bg-slate-100 text-slate-800 border-slate-300' },
  'In Warehouse': { label: 'Warehouse', style: 'bg-slate-100 text-slate-800 border-slate-300' },
  'Dispatched': { label: 'Dispatched', style: 'bg-sky-50 text-sky-800 border-sky-300' },
  'Dispatch': { label: 'Dispatched', style: 'bg-sky-50 text-sky-800 border-sky-300' },
  'Delivered': { label: 'Delivered', style: 'bg-emerald-50 text-emerald-800 border-emerald-300' },
  'Pending': { label: 'Pending', style: 'bg-amber-50 text-amber-800 border-amber-300' },
  'Pick Up Requested': { label: 'Pick Up Requested', style: 'bg-amber-100 text-amber-900 border-amber-400 font-bold' },
  'Picked Up': { label: 'Picked Up', style: 'bg-teal-50 text-teal-800 border-teal-300' },
  'Postponed': { label: 'Postponed', style: 'bg-orange-50 text-orange-800 border-orange-300' },
  'Returned': { label: 'Returned', style: 'bg-rose-50 text-rose-800 border-rose-300' },
  'Returned to Vendor': { label: 'Returned', style: 'bg-rose-50 text-rose-800 border-rose-300' },
  'Exchange': { label: 'Exchange', style: 'bg-indigo-50 text-indigo-800 border-indigo-300' },
  'Exchanged': { label: 'Exchange', style: 'bg-indigo-50 text-indigo-800 border-indigo-300' },
  'Cancelled': { label: 'Returned', style: 'bg-rose-50 text-rose-800 border-rose-300' },
  'Sorted': { label: 'Warehouse', style: 'bg-slate-100 text-slate-800 border-slate-300' },
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
