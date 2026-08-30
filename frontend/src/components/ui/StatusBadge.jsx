import React from 'react';

export const STATUS_CONFIG = {
  'Dispatch': { label: 'Dispatch', emoji: '🚀', style: 'bg-sky-50 text-sky-600 border-sky-200' },
  'Dispatched': { label: 'Dispatch', emoji: '🚀', style: 'bg-sky-50 text-sky-600 border-sky-200' },
  'Out of Delivery': { label: 'Out of Delivery', emoji: '🚚', style: 'bg-blue-50 text-blue-700 border-blue-200' },
  'Out for Delivery': { label: 'Out of Delivery', emoji: '🚚', style: 'bg-blue-50 text-blue-700 border-blue-200' },
  'Arrive': { label: 'Arrive', emoji: '🏢', style: 'bg-purple-50 text-purple-700 border-purple-200' },
  'Arrived': { label: 'Arrive', emoji: '🏢', style: 'bg-purple-50 text-purple-700 border-purple-200' },
  'Warehouse': { label: 'Warehouse', emoji: '🏭', style: 'bg-slate-100 text-slate-800 border-slate-300' },
  'In Warehouse': { label: 'Warehouse', emoji: '🏭', style: 'bg-slate-100 text-slate-800 border-slate-300' },
  'Delivered': { label: 'Delivered', emoji: '✅', style: 'bg-emerald-50 text-emerald-700 border-emerald-300' },
  'Pending': { label: 'Pending', emoji: '⏳', style: 'bg-amber-50 text-amber-800 border-amber-200' },
  'Pick Up Requested': { label: 'Pickup Requested', emoji: '📦', style: 'bg-amber-50 text-amber-800 border-amber-200' },
  'Picked Up': { label: 'Picked Up', emoji: '📦', style: 'bg-teal-50 text-teal-800 border-teal-200' },
  'Cancelled': { label: 'Cancelled', emoji: '❌', style: 'bg-red-50 text-red-700 border-red-200' },
  'Returned': { label: 'Returned', emoji: '🔄', style: 'bg-rose-50 text-rose-700 border-rose-200' },
  'Returned to Vendor': { label: 'Returned to Vendor', emoji: '🔄', style: 'bg-rose-50 text-rose-700 border-rose-200' },
  'Postponed': { label: 'Postponed', emoji: '⏸️', style: 'bg-orange-50 text-orange-700 border-orange-200' },
  'Exchanged': { label: 'Exchanged', emoji: '🔀', style: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
};

export function getStatusBadgeData(status) {
  return STATUS_CONFIG[status] || {
    label: status || 'Unknown',
    emoji: '📦',
    style: 'bg-slate-100 text-slate-700 border-slate-200'
  };
}

export function StatusBadge({ status, className = '' }) {
  const config = getStatusBadgeData(status);
  const base = "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-bold border shadow-2xs transition-all";
  
  return (
    <span className={`${base} ${config.style} ${className}`}>
      <span className="text-xs leading-none">{config.emoji}</span>
      <span>{config.label}</span>
    </span>
  );
}

export default StatusBadge;
