import React, { useState, useEffect } from 'react';
import api from '../../../api/axios';
import { useToast } from '../../../store/ToastContext';
import { Map, Plus, Trash2, Edit2, CheckCircle2, XCircle, AlertTriangle, X } from 'lucide-react';

const SkeletonTable = ({ rows = 4 }) => (
  <div className="overflow-x-auto">
    <table className="w-full text-sm text-left">
      <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-xs">
        <tr><th className="px-6 py-3">Loading...</th></tr>
      </thead>
      <tbody className="divide-y divide-slate-100 bg-white">
        {Array.from({ length: rows }).map((_, i) => (
          <tr key={i}>
            <td className="px-6 py-4">
              <div className="h-4 bg-slate-200 rounded animate-pulse w-full"></div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const DeliveryChargeRules = () => {
  const { showToast } = useToast();
  
  const [dcRules, setDcRules] = useState([]);
  const [loadingDc, setLoadingDc] = useState(true);
  const [dcModalOpen, setDcModalOpen] = useState(false);
  const [dcSaving, setDcSaving] = useState(false);
  
  const BRANCH_OPTIONS = ['HEAD OFFICE', 'Kathmandu Branch', 'Pokhara Branch', 'Chitwan Branch', 'Lalitpur Branch', 'Bhaktapur Branch', 'Dharan Branch', 'Biratnagar Branch'];
  const EMPTY_DC_FORM = { id: null, fromBranch: '', toBranch: '', baseCharge: 0, perKgCharge: 0, weightLimit: 0, isActive: true };
  const [dcForm, setDcForm] = useState(EMPTY_DC_FORM);
  const [confirmModal, setConfirmModal] = useState({ open: false, title: '', message: '', onConfirm: null });

  const fetchDcRules = async (silent = false) => {
    if (!silent) setLoadingDc(true);
    try {
      const res = await api.get('/admin/delivery-charges');
      setDcRules(res.data.data || []);
    } catch (err) {
      showToast('Failed to load delivery charge rules', 'error');
    } finally {
      if (!silent) setLoadingDc(false);
    }
  };

  useEffect(() => {
    fetchDcRules();
  }, []);

  const openDcModal = (rule = null) => {
    if (rule) {
      setDcForm({ id: rule._id, fromBranch: rule.fromBranch, toBranch: rule.toBranch,
        baseCharge: rule.baseCharge, perKgCharge: rule.perKgCharge || 0,
        weightLimit: rule.weightLimit || 0, isActive: rule.isActive });
    } else {
      setDcForm(EMPTY_DC_FORM);
    }
    setDcModalOpen(true);
  };

  const handleSaveDcRule = async (e) => {
    e.preventDefault();
    if (!dcForm.fromBranch || !dcForm.toBranch) return showToast('Please select both branches', 'error');
    if (dcForm.fromBranch === dcForm.toBranch) return showToast('From and To cannot be the same branch', 'error');
    setDcSaving(true);
    try {
      if (dcForm.id) {
        await api.put(`/admin/delivery-charges/${dcForm.id}`, dcForm);
        showToast('Rule updated', 'success');
      } else {
        await api.post('/admin/delivery-charges', dcForm);
        showToast('Rule created', 'success');
      }
      setDcModalOpen(false);
      fetchDcRules(true);
    } catch (err) {
      showToast(err.message || 'Failed to save rule', 'error');
    } finally {
      setDcSaving(false);
    }
  };

  const handleToggleDcRule = async (rule) => {
    try {
      await api.patch(`/admin/delivery-charges/${rule._id}/toggle`);
      showToast(`Rule ${rule.isActive ? 'deactivated' : 'activated'}`, 'success');
      fetchDcRules(true);
    } catch (err) {
      showToast('Failed to toggle rule', 'error');
    }
  };

  const handleDeleteDcRule = (rule) => {
    setConfirmModal({
      open: true,
      title: 'Delete Delivery Charge Rule',
      message: `Delete rule for ${rule.fromBranch} → ${rule.toBranch}?`,
      onConfirm: async () => {
        try {
          await api.delete(`/admin/delivery-charges/${rule._id}`);
          showToast('Rule deleted', 'success');
          fetchDcRules(true);
        } catch (err) {
          showToast('Failed to delete rule', 'error');
        }
        setConfirmModal({ open: false });
      },
    });
  };

  return (
    <>
      <div className="card-premium overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
              <Map className="w-5 h-5 text-emerald-600" /> Branch-to-Branch Delivery Charge Rules
            </h3>
            <p className="text-sm text-slate-500 mt-1">Auto-applied in the New Order modal based on route + weight.</p>
          </div>
          <button className="btn-primary py-2 flex items-center gap-1.5 whitespace-nowrap" onClick={() => openDcModal()}>
            <Plus className="w-4 h-4" /> Add Rule
          </button>
        </div>

        {loadingDc ? <SkeletonTable rows={4} /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-xs">
                <tr>
                  <th className="px-6 py-3">From Branch</th>
                  <th className="px-6 py-3">To Branch</th>
                  <th className="px-6 py-3">Base Charge</th>
                  <th className="px-6 py-3">Free Weight</th>
                  <th className="px-6 py-3">Per kg above</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {dcRules.length === 0 ? (
                  <tr><td colSpan="7" className="px-6 py-12 text-center text-slate-500">No rules yet. Click <strong>+ Add Rule</strong> to create one.</td></tr>
                ) : dcRules.map(rule => (
                  <tr key={rule._id} className={`hover:bg-slate-50 transition-colors ${!rule.isActive ? 'opacity-60 bg-slate-50/50' : ''}`}>
                    <td className="px-6 py-4 font-bold text-slate-900">{rule.fromBranch}</td>
                    <td className="px-6 py-4 font-bold text-slate-900">{rule.toBranch}</td>
                    <td className="px-6 py-4 font-bold text-brand-600">Rs. {rule.baseCharge}</td>
                    <td className="px-6 py-4 text-slate-600 font-medium">{rule.weightLimit || 0} kg</td>
                    <td className="px-6 py-4 text-slate-600 font-medium">{rule.perKgCharge > 0 ? `Rs. ${rule.perKgCharge}` : '—'}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${rule.isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                        {rule.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex gap-2 justify-end">
                        <button className={`btn-sm p-2 rounded-lg font-bold border ${rule.isActive ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100' : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'}`} onClick={() => handleToggleDcRule(rule)} title={rule.isActive ? 'Deactivate' : 'Activate'}>
                          {rule.isActive ? <XCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                        </button>
                        <button className="btn-secondary btn-sm p-2" onClick={() => openDcModal(rule)} title="Edit">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button className="btn-sm p-2 rounded-lg bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 font-bold" onClick={() => handleDeleteDcRule(rule)} title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {dcModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn" onClick={() => setDcModalOpen(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl overflow-hidden animate-scaleIn" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                <Map className="w-5 h-5 text-emerald-600" /> {dcForm.id ? 'Edit Delivery Rule' : 'Add Delivery Rule'}
              </h3>
              <button onClick={() => setDcModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <form onSubmit={handleSaveDcRule} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">From Branch <span className="text-red-500">*</span></label>
                    <select required className="input-field" value={dcForm.fromBranch} onChange={e => setDcForm({...dcForm, fromBranch: e.target.value})}>
                      <option value="">Select branch...</option>
                      {BRANCH_OPTIONS.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">To Branch <span className="text-red-500">*</span></label>
                    <select required className="input-field" value={dcForm.toBranch} onChange={e => setDcForm({...dcForm, toBranch: e.target.value})}>
                      <option value="">Select branch...</option>
                      {BRANCH_OPTIONS.filter(b => b !== dcForm.fromBranch).map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Base Charge (Rs.) <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-medium text-sm">Rs.</span>
                      <input type="number" required min="0" className="input-field pl-9"
                        value={dcForm.baseCharge} onChange={e => setDcForm({...dcForm, baseCharge: Number(e.target.value)})} />
                    </div>
                    <p className="text-xs text-slate-500 mt-1">Fixed charge for this route.</p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Free Weight Limit (kg)</label>
                    <div className="relative">
                      <input type="number" min="0" step="0.1" className="input-field pr-8"
                        value={dcForm.weightLimit} onChange={e => setDcForm({...dcForm, weightLimit: Number(e.target.value)})} />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 font-medium text-sm">kg</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">Included in base charge (0 = none).</p>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Per kg Charge above weight limit (Rs.)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-medium text-sm">Rs.</span>
                      <input type="number" min="0" step="0.5" className="input-field pl-9"
                        value={dcForm.perKgCharge} onChange={e => setDcForm({...dcForm, perKgCharge: Number(e.target.value)})} />
                    </div>
                    <p className="text-xs text-slate-500 mt-1">0 = weight-based surcharge disabled.</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 pt-2">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={dcForm.isActive} onChange={e => setDcForm({...dcForm, isActive: e.target.checked})} />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                  </label>
                  <span className="text-sm font-bold text-slate-700">Active Rule</span>
                </div>
                
                {dcForm.fromBranch && dcForm.toBranch && (
                  <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-4 mt-4">
                    <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-2">Rule Preview</p>
                    <p className="text-sm text-emerald-900 font-medium">
                      {dcForm.fromBranch} → {dcForm.toBranch} <br/>
                      Base: Rs.{dcForm.baseCharge}
                      {dcForm.perKgCharge > 0 && ` + Rs.${dcForm.perKgCharge}/kg above ${dcForm.weightLimit}kg`}
                      {dcForm.weightLimit === 0 && dcForm.perKgCharge === 0 && ' (Fixed charge regardless of weight)'}
                    </p>
                  </div>
                )}
                
                <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 mt-6">
                  <button type="button" className="btn-secondary" onClick={() => setDcModalOpen(false)}>Cancel</button>
                  <button type="submit" className="btn-primary" disabled={dcSaving}>{dcSaving ? 'Saving...' : 'Save Rule'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {confirmModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center animate-scaleIn">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-red-100">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h3 className="font-bold text-slate-900 text-xl mb-2">{confirmModal.title}</h3>
            <p className="text-slate-500 text-sm mb-6 leading-relaxed">{confirmModal.message}</p>
            <div className="flex gap-3 justify-center">
              <button className="btn-secondary flex-1" onClick={() => setConfirmModal({ open: false })}>Cancel</button>
              <button className="btn-primary bg-red-600 hover:bg-red-700 text-white flex-1 border-0" onClick={confirmModal.onConfirm}>Yes, Delete</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DeliveryChargeRules;
