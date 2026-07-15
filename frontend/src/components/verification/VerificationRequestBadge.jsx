import React from 'react';
import { AlertTriangle } from 'lucide-react';

export const VerificationStatusBadge = ({ status }) => {
  const styles = {
    'Verified': 'bg-emerald-100 text-emerald-800 border-emerald-200',
    'Pending': 'bg-amber-100 text-amber-800 border-amber-200',
    'Reopened': 'bg-indigo-100 text-indigo-800 border-indigo-200',
    'Rejected': 'bg-rose-100 text-rose-800 border-rose-200'
  };
  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${styles[status] || 'bg-slate-100 text-slate-850'}`}>
      {status === 'Pending' ? 'VERIFICATION REQUESTED' : (status || 'Pending')}
    </span>
  );
};

export const VerificationPriorityBadge = ({ priority }) => {
  if (!priority) return null;
  const styles = {
    'High': 'bg-rose-100 text-rose-700 border-rose-200',
    'Medium': 'bg-amber-100 text-amber-700 border-amber-200',
    'Low': 'bg-slate-100 text-slate-600 border-slate-200'
  };
  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${styles[priority] || styles['Low']}`}>
      {priority} Priority
    </span>
  );
};
