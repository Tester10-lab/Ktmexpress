import React from 'react';
import { Sliders, X } from 'lucide-react';
import { VerificationSummary } from './VerificationSummary';
import { VerificationAudit } from './VerificationAudit';

export const VerificationModal = ({ currentPkg, form, setForm, setVerificationModal, handleSaveDraft, handleVerify }) => {
  if (!currentPkg) return null;

  const predefinedReasons = [
    'Customer unavailable',
    'Wrong amount entered',
    'Wrong delivery status',
    'Returned partial order',
    'Duplicate submission',
    'System correction',
    'Other'
  ];

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full shadow-xl border border-slate-200 flex flex-col max-h-[90vh] animate-scaleUp">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 rounded-t-xl">
          <div>
            <h3 className="font-bold text-slate-800 text-lg flex items-center gap-1.5">
              <Sliders className="w-5 h-5 text-brand-600" /> Edit & Verify Shipment
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Package Code: {currentPkg.trackingCode}</p>
          </div>
          <button onClick={() => setVerificationModal(false)} className="text-slate-400 hover:text-slate-700 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          
          <VerificationSummary pkg={currentPkg} />

          {/* Form Fields Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">Delivery Status</label>
              <select 
                className="input-field w-full text-xs"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                <option value="Delivered">Delivered</option>
                <option value="Postponed">Postponed</option>
                <option value="Hold">Hold</option>
                <option value="Rejected">Rejected</option>
                <option value="Cancelled">Cancelled</option>
                <option value="Returned">Returned</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">Verified COD Amount (Rs.)</label>
              <input 
                type="number"
                className="input-field w-full text-xs"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">Delivery Charge (Rs.)</label>
              <input 
                type="number"
                className="input-field w-full text-xs"
                value={form.deliveryCharge}
                onChange={(e) => setForm({ ...form, deliveryCharge: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">Payment Method</label>
              <select 
                className="input-field w-full text-xs"
                value={form.paymentMethod}
                onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
              >
                <option value="Cash">Cash</option>
                <option value="Online">Online</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Wallet">Wallet</option>
                <option value="COD">COD</option>
                <option value="Mixed">Mixed</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">Receiver Name</label>
              <input 
                type="text"
                className="input-field w-full text-xs"
                value={form.receiverName}
                onChange={(e) => setForm({ ...form, receiverName: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">Receiver Phone</label>
              <input 
                type="text"
                className="input-field w-full text-xs"
                value={form.receiverPhone}
                onChange={(e) => setForm({ ...form, receiverPhone: e.target.value })}
              />
            </div>

            {form.status === 'Postponed' && (
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Postponed New Date</label>
                <input 
                  type="date"
                  className="input-field w-full text-xs"
                  value={form.deliveryDate}
                  onChange={(e) => setForm({ ...form, deliveryDate: e.target.value })}
                />
              </div>
            )}

            {form.status === 'Hold' && (
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Hold Reason</label>
                <input 
                  type="text"
                  className="input-field w-full text-xs"
                  value={form.holdReason}
                  onChange={(e) => setForm({ ...form, holdReason: e.target.value })}
                />
              </div>
            )}

            {(form.status === 'Rejected' || form.status === 'Cancelled') && (
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Reject / Cancel Reason</label>
                <input 
                  type="text"
                  className="input-field w-full text-xs"
                  value={form.rejectReason}
                  onChange={(e) => setForm({ ...form, rejectReason: e.target.value })}
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">Verification Reason (Required for verification)</label>
              <select 
                className="input-field w-full text-xs font-semibold text-slate-700"
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
              >
                {predefinedReasons.map((r, i) => (
                  <option key={i} value={r}>{r}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">Custom Remarks</label>
            <textarea 
              className="input-field w-full text-xs min-h-[60px]"
              placeholder="Type any additional remarks..."
              value={form.customRemarks}
              onChange={(e) => setForm({ ...form, customRemarks: e.target.value })}
            />
          </div>

          <VerificationAudit auditLogs={currentPkg.verificationAudit} isModal={true} />

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 rounded-b-xl flex justify-end gap-3">
          <button className="btn-secondary py-2" onClick={() => setVerificationModal(false)}>Cancel</button>
          <button className="btn-outline py-2 border-brand-200 text-brand-700 bg-brand-50" onClick={handleSaveDraft}>Save as Draft</button>
          <button className="btn-primary py-2" onClick={handleVerify}>Verify Package</button>
        </div>
      </div>
    </div>
  );
};
