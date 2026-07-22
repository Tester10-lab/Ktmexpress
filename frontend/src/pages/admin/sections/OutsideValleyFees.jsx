import React, { useState, useEffect, useCallback } from 'react';
import api from '../../../api/axios';
import { useToast } from '../../../store/ToastContext';
import Pagination from '../../../components/Pagination';
import { Search, Plus, Trash2, Edit2, CheckCircle2, XCircle, AlertTriangle, X, FileSpreadsheet } from 'lucide-react';

const debounce = (func, wait) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

const SkeletonTable = ({ rows = 3 }) => (
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

const OutsideValleyFees = ({ onUpdate }) => {
  const { showToast } = useToast();
  
  const [ovFees, setOvFees] = useState([]);
  const [ovPagination, setOvPagination] = useState({ page: 1, total: 0, pages: 1 });
  const [ovSearch, setOvSearch] = useState('');
  const [loadingOv, setLoadingOv] = useState(true);
  
  const [ovModalOpen, setOvModalOpen] = useState(false);
  const [ovForm, setOvForm] = useState({ id: null, city: '', fee: 200, isActive: true });
  const [confirmModal, setConfirmModal] = useState({ open: false, title: '', message: '', onConfirm: null });

  const fetchOvFees = async (page = 1, search = ovSearch, silent = false) => {
    if (!silent) setLoadingOv(true);
    try {
      const res = await api.get(`/admin/pricing-engine/outside-valley?page=${page}&search=${search}`);
      setOvFees(res.data.data);
      setOvPagination(res.data.pagination);
    } catch (err) {
      showToast('Failed to load city fees', 'error');
    } finally {
      if (!silent) setLoadingOv(false);
    }
  };

  useEffect(() => {
    fetchOvFees();
  }, []);

  const debouncedFetchOv = useCallback(debounce((query) => fetchOvFees(1, query), 400), []);
  const handleOvSearchChange = (e) => {
    setOvSearch(e.target.value);
    debouncedFetchOv(e.target.value);
  };

  const openOvModal = (feeObj = null) => {
    if (feeObj) {
      setOvForm({ id: feeObj._id, city: feeObj.city, fee: feeObj.fee, isActive: feeObj.isActive });
    } else {
      setOvForm({ id: null, city: '', fee: 200, isActive: true });
    }
    setOvModalOpen(true);
  };

  const handleSaveOvFee = async (e) => {
    e.preventDefault();
    try {
      if (ovForm.id) {
        await api.put(`/admin/pricing-engine/outside-valley/${ovForm.id}`, ovForm);
        showToast('City fee updated', 'success');
      } else {
        await api.post('/admin/pricing-engine/outside-valley', ovForm);
        showToast('City fee added', 'success');
      }
      setOvModalOpen(false);
      fetchOvFees(ovPagination.page, ovSearch, true);
      if (onUpdate) onUpdate();
    } catch (err) {
      showToast(err.message || 'Failed to save city fee', 'error');
    }
  };

  const handleDeleteOvFee = (feeObj) => {
    setConfirmModal({
      open: true,
      title: 'Delete City Fee',
      message: `Are you sure you want to delete the delivery fee configuration for ${feeObj.city}?`,
      onConfirm: async () => {
        try {
          await api.delete(`/admin/pricing-engine/outside-valley/${feeObj._id}`);
          showToast('City fee deleted', 'success');
          fetchOvFees(ovPagination.page, ovSearch, true);
          if (onUpdate) onUpdate();
        } catch (err) {
          showToast(err.message || 'Failed to delete fee', 'error');
        }
        setConfirmModal({ open: false });
      }
    });
  };

  const handleToggleOvFeeStatus = async (feeObj) => {
    try {
      await api.put(`/admin/pricing-engine/outside-valley/${feeObj._id}`, { isActive: !feeObj.isActive });
      showToast(`City fee ${!feeObj.isActive ? 'activated' : 'deactivated'}`, 'success');
      fetchOvFees(ovPagination.page, ovSearch, true);
    } catch (err) {
      showToast('Failed to update status', 'error');
    }
  };

  const [importing, setImporting] = useState(false);

  const handleImportExcelRates = async () => {
    if (!window.confirm('Import/sync all 95 Outside Valley rates from KDM Express master sheet and set KTM Base Rate to 100?')) return;
    setImporting(true);
    try {
      const res = await api.post('/admin/pricing-engine/import-excel');
      showToast(res.data.message || 'Successfully imported all 95 rates!', 'success');
      fetchOvFees(1, '', true);
      if (typeof onUpdate === 'function') onUpdate();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to import rates', 'error');
    } finally {
      setImporting(false);
    }
  };

  return (
    <>
      <div className="card-premium overflow-hidden flex flex-col h-full">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-slate-800 text-lg">Outside Valley Delivery Fees</h3>
            <p className="text-sm text-slate-500">Rates for specific cities outside Kathmandu</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input type="text" className="input-field py-2 pl-9 w-full sm:w-48 text-sm" placeholder="Search city..." 
                value={ovSearch} onChange={handleOvSearchChange} />
            </div>
            <button 
              className="btn-outline py-2 px-3 flex items-center gap-1.5 whitespace-nowrap text-sm font-semibold text-brand-600 border-brand-200 hover:bg-brand-50" 
              onClick={handleImportExcelRates} 
              disabled={importing}
              title="Import all 95 Outside Valley rates and set KTM rate to 100"
            >
              <FileSpreadsheet className="w-4 h-4" /> {importing ? 'Importing...' : 'Import KDM Rates (95 Cities)'}
            </button>
            <button className="btn-primary py-2 flex items-center gap-1.5 whitespace-nowrap" onClick={() => openOvModal()}>
              <Plus className="w-4 h-4" /> Add City
            </button>
          </div>
        </div>
        
        {loadingOv ? <SkeletonTable /> : (
          <>
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-xs sticky top-0">
                  <tr>
                    <th className="px-6 py-3">City Name</th>
                    <th className="px-6 py-3">Delivery Fee</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {ovFees.length === 0 ? (
                    <tr><td colSpan="4" className="px-6 py-12 text-center text-slate-500">No cities configured.</td></tr>
                  ) : (
                    ovFees.map(fee => (
                      <tr key={fee._id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 font-bold text-slate-900">{fee.city}</td>
                        <td className="px-6 py-4 font-bold text-brand-600">Rs. {fee.fee}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${fee.isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                            {fee.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex gap-2 justify-end">
                            <button className={`btn-sm p-2 rounded-lg font-bold border ${fee.isActive ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100' : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'}`} onClick={() => handleToggleOvFeeStatus(fee)} title={fee.isActive ? 'Deactivate' : 'Activate'}>
                              {fee.isActive ? <XCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                            </button>
                            <button className="btn-secondary btn-sm p-2" onClick={() => openOvModal(fee)} title="Edit">
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button className="btn-sm p-2 rounded-lg bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 font-bold" onClick={() => handleDeleteOvFee(fee)} title="Delete">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <Pagination pagination={ovPagination} onPageChange={(page) => fetchOvFees(page)} />
          </>
        )}
      </div>

      {ovModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn" onClick={() => setOvModalOpen(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-scaleIn" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-bold text-slate-900 text-lg">{ovForm.id ? 'Edit City Fee' : 'Add City Fee'}</h3>
              <button onClick={() => setOvModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <form onSubmit={handleSaveOvFee} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">City Name <span className="text-red-500">*</span></label>
                  <input type="text" required className="input-field" placeholder="e.g. Pokhara"
                    value={ovForm.city} onChange={e => setOvForm({...ovForm, city: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Delivery Fee (Rs.) <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-medium text-sm">Rs.</span>
                    <input type="number" required min="0" className="input-field pl-9" 
                      value={ovForm.fee} onChange={e => setOvForm({...ovForm, fee: Number(e.target.value)})} />
                  </div>
                </div>
                <div className="flex items-center gap-3 pt-2">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={ovForm.isActive} onChange={e => setOvForm({...ovForm, isActive: e.target.checked})} />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                  </label>
                  <span className="text-sm font-bold text-slate-700">Active</span>
                </div>
                <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 mt-6">
                  <button type="button" className="btn-secondary" onClick={() => setOvModalOpen(false)}>Cancel</button>
                  <button type="submit" className="btn-primary">Save Fee</button>
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

export default OutsideValleyFees;
