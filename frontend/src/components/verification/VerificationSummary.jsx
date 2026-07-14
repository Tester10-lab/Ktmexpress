import React from 'react';

export const VerificationSummary = ({ pkg }) => {
  if (!pkg) return null;

  const renderStatusBadge = (status) => {
    const styles = {
      'Delivered': 'bg-emerald-100 text-emerald-800 border-emerald-200',
      'Postponed': 'bg-amber-100 text-amber-800 border-amber-200',
      'Hold': 'bg-purple-100 text-purple-800 border-purple-200',
      'Rejected': 'bg-red-100 text-red-800 border-red-200',
      'Cancelled': 'bg-red-100 text-red-800 border-red-200',
      'Returned': 'bg-blue-100 text-blue-800 border-blue-200',
    };
    return (
      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${styles[status] || 'bg-slate-100 text-slate-800 border-slate-200'}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="bg-slate-50 border border-slate-200 p-4 rounded-lg grid grid-cols-2 gap-4 text-xs">
      <div>
        <div className="font-bold text-slate-400 uppercase tracking-wide">Rider Submission</div>
        {pkg.riderSubmission ? (
          <div className="mt-2 space-y-1.5">
            <div className="flex items-center gap-1.5">
              {renderStatusBadge(pkg.riderSubmission.status)}
              <span className="font-bold text-slate-800">Rs. {pkg.riderSubmission.amount}</span>
            </div>
            <div className="text-slate-500">Remarks: "{pkg.riderSubmission.comments || 'No comment'}"</div>
          </div>
        ) : (
          <div className="text-slate-400 italic mt-2">None</div>
        )}
      </div>
      <div>
        <div className="font-bold text-slate-400 uppercase tracking-wide">Original Package Details</div>
        <div className="mt-2 space-y-1">
          <div>Original Status: <span className="font-bold text-slate-700">{pkg.status}</span></div>
          
          <div className="flex items-center gap-2">Original COD: 
            {pkg.originalValues?.amount !== undefined && (
              <span className="line-through text-slate-400 font-normal">Rs. {pkg.originalValues.amount}</span>
            )}
            <span className="font-bold text-slate-700">Rs. {pkg.amount}</span>
          </div>

          <div className="flex items-center gap-2">Delivery Charge: 
            {pkg.originalValues?.deliveryCharge !== undefined && (
              <span className="line-through text-slate-400 font-normal">Rs. {pkg.originalValues.deliveryCharge}</span>
            )}
            <span className="font-bold text-slate-700">Rs. {pkg.deliveryCharge}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
