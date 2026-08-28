import React from 'react';

export function StatusBadge({ status, className = '' }) {
  const base = "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium border";
  
  // Desaturated, calm colors matching Stripe/Linear style
  const styles = {
    'Delivered': 'bg-emerald-50 text-emerald-700 border-emerald-200',
    'Cancelled': 'bg-red-50 text-red-700 border-red-200',
    'Returned to Vendor': 'bg-slate-100 text-slate-700 border-slate-300',
    'Returned': 'bg-slate-100 text-slate-700 border-slate-300',
    'Pending': 'bg-amber-50 text-amber-700 border-amber-200',
    'Pick Up Requested': 'bg-amber-50 text-amber-700 border-amber-200',
    'Picked Up': 'bg-amber-50 text-amber-700 border-amber-200',
    'Arrived': 'bg-purple-50 text-purple-700 border-purple-200',
    'In Warehouse': 'bg-slate-100 text-slate-800 border-slate-300',
    'Warehouse': 'bg-slate-100 text-slate-800 border-slate-300',
    'Dispatched': 'bg-sky-50 text-sky-700 border-sky-200',
    'Out for Delivery': 'bg-blue-50 text-blue-700 border-blue-200',
    'Postponed': 'bg-orange-50 text-orange-700 border-orange-200',
    'Exchanged': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  };

  return (
    <span className={`${base} ${styles[status] || 'bg-slate-50 text-slate-700 border-slate-200'} ${className}`}>
      {status === 'Delivered' && '✓ '}
      {status === 'Cancelled' && '✕ '}
      {status}
    </span>
  );
}
