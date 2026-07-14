import React from 'react';
import { FileText } from 'lucide-react';

export const VerificationAudit = ({ auditLogs, isModal = false }) => {
  if (!auditLogs || auditLogs.length === 0) return null;

  return (
    <div className={`space-y-4 ${isModal ? 'mt-4 border-t border-slate-100 pt-4' : ''}`}>
      <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
        <FileText className="w-3.5 h-3.5 text-brand-600" /> Verification Audit Logs ({auditLogs.length})
      </h4>
      
      <div className="space-y-3">
        {auditLogs.map((audit, idx) => (
          <div key={audit._id || idx} className="p-3 bg-white rounded-lg border border-slate-200 shadow-sm text-xs grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <div className="text-[10px] text-slate-400 font-bold uppercase">Action & Operator</div>
              <div className="font-bold text-slate-800 mt-1">
                {audit.action === 'Reopen' ? '🔄 Reopened' : audit.action === 'Edit & Verify' ? '📝 Edited & Verified' : '✅ Verified'}
              </div>
              <div className="text-slate-500 mt-0.5">By {audit.approvedByName || 'System'}</div>
              <div className="text-[10px] text-slate-400 mt-1">{new Date(audit.verificationTime || audit.editTime).toLocaleString()}</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400 font-bold uppercase">Status Migration</div>
              <div className="mt-1 flex items-center gap-1.5">
                <span className="text-slate-400">{audit.previousStatus || 'N/A'}</span>
                <span className="text-slate-400">→</span>
                <span className="font-bold text-slate-700">{audit.updatedStatus}</span>
              </div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400 font-bold uppercase">Financial Adjustment</div>
              <div className="mt-1">
                <span className="text-slate-500">Rs. {audit.previousAmount}</span>
                <span className="text-slate-400 mx-1">→</span>
                <span className="font-bold text-slate-850">Rs. {audit.updatedAmount}</span>
                {audit.difference !== 0 && (
                  <div className={`mt-0.5 font-bold ${audit.difference > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {audit.difference > 0 ? `+ Rs. ${audit.difference}` : `- Rs. ${Math.abs(audit.difference)}`}
                  </div>
                )}
              </div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400 font-bold uppercase">Audit Scope / Metadata</div>
              <div className="text-slate-600 mt-1">Reason: <span className="font-semibold text-slate-800">{audit.reason || 'None'}</span></div>
              {audit.customRemarks && <div className="text-slate-500 italic mt-0.5">"{audit.customRemarks}"</div>}
              <div className="text-[10px] text-slate-400 mt-1">IP: {audit.ipAddress || 'Unknown'} | Device: {audit.device || 'Desktop'} ({audit.browser})</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
