import React from 'react';

export function StatusBadge({ status, className = '' }) {
  const base = "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium border";
  
  // Desaturated, calm colors matching Stripe/Linear style
  const styles = {
    'Delivered': 'bg-emerald-50 text-emerald-700 border-emerald-200',
    'Cancelled': 'bg-slate-50 text-slate-700 border-slate-200',
    'Returned to Vendor': 'bg-slate-100 text-slate-700 border-slate-300',
    'Returned': 'bg-slate-100 text-slate-700 border-slate-300',
    'Pending': 'bg-amber-50 text-amber-700 border-amber-200',
    'Pick Up Requested': 'bg-indigo-50 text-indigo-700 border-indigo-200',
    'Picked Up': 'bg-indigo-50 text-indigo-700 border-indigo-200',
    'In Warehouse': 'bg-slate-50 text-slate-700 border-slate-200',
    'Out for Delivery': 'bg-indigo-50 text-indigo-700 border-indigo-200',
    'Postponed': 'bg-amber-50 text-amber-700 border-amber-200',
    'Exchanged': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  };

  return (
    <span className={`${base} ${styles[status] || 'bg-slate-50 text-slate-700 border-slate-200'} ${className}`}>
      {status}
    </span>
  );
}
