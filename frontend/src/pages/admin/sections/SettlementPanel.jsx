import React, { useState, useEffect, useCallback } from 'react';
import api from '../../../api/axios';
import MetricCard from '../../../components/MetricCard';
import { useToast } from '../../../store/ToastContext';
import Pagination from '../../../components/Pagination';
import TrackingLink from '../../../components/TrackingLink';
import { 
  Wallet, CheckCircle2, XCircle, Clock, FileSpreadsheet, Check, Download, AlertTriangle
} from 'lucide-react';

const AdminSettlements = () => {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [pagination, setPagination] = useState(null);
  const [statusFilter, setStatusFilter] = useState('unpaid');
  const [selectedPackages, setSelectedPackages] = useState(new Set());
  const [processing, setProcessing] = useState(false);
  const { showToast } = useToast();

  const fetchPackages = useCallback((silent = false) => {
    if (!silent) setLoading(true);
    // Get delivered packages that are either unpaid or all
    const q = new URLSearchParams({
      page, limit, status: 'history'
    });
    
    api.get(`/admin/packages?${q.toString()}`)
      .then(r => {
        let pkgData = r.data.data || [];
        if (statusFilter === 'unpaid') {
          pkgData = pkgData.filter(p => p.status === 'Delivered' && !p.vendorPaid);
        } else if (statusFilter === 'paid') {
          pkgData = pkgData.filter(p => p.status === 'Delivered' && p.vendorPaid);
        }
        setPackages(pkgData);
        setPagination(r.data.pagination);
        setSelectedPackages(new Set());
      })
      .catch(() => showToast('Failed to load packages', 'error'))
      .finally(() => setLoading(false));
  }, [page, limit, statusFilter, showToast]);

  useEffect(() => { fetchPackages(); }, [fetchPackages]);

  const toggleSelect = (id) => {
    const newSet = new Set(selectedPackages);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedPackages(newSet);
  };

  const selectAll = () => {
    if (selectedPackages.size === packages.length) {
      setSelectedPackages(new Set());
    } else {
      setSelectedPackages(new Set(packages.filter(p => !p.vendorPaid).map(p => p._id)));
    }
  };

  const handleVerifyCOD = async (id) => {
    // Optimistic Update
    setPackages(prev => prev.map(p => p._id === id ? { ...p, codVerified: true } : p));
    try {
      await api.post(`/admin/settlements/verify-cod/${id}`);
      showToast('COD marked as verified', 'success');
      fetchPackages(true);
    } catch (err) {
      showToast(err.message || 'Failed to verify COD', 'error');
      fetchPackages(true);
    }
  };

  const handleMarkPaid = async () => {
    if (selectedPackages.size === 0) return;
    if (!window.confirm(`Mark ${selectedPackages.size} packages as paid to vendor?`)) return;

    setProcessing(true);
    
    // Optimistic Update
    if (statusFilter === 'unpaid') {
       setPackages(prev => prev.filter(p => !selectedPackages.has(p._id)));
    } else {
       setPackages(prev => prev.map(p => selectedPackages.has(p._id) ? { ...p, vendorPaid: true } : p));
    }

    try {
      await api.post('/admin/settlements/mark-paid', {
        packageIds: Array.from(selectedPackages),
        paymentMethod: 'Bank Transfer'
      });
      showToast('Packages marked as paid', 'success');
      fetchPackages(true);
    } catch (err) {
      showToast(err.message || 'Failed to mark paid', 'error');
      fetchPackages(true);
    } finally {
      setProcessing(false);
    }
  };

  const exportCSV = async () => {
    try {
      const q = new URLSearchParams({ status: statusFilter });
      const res = await api.get(`/admin/settlements/export?${q.toString()}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `settlements_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      showToast('Failed to export CSV', 'error');
    }
  };

  const totalSelectedAmount = packages
    .filter(p => selectedPackages.has(p._id))
    .reduce((sum, p) => sum + (p.vendorReceivable || 0), 0);

  return (
    <div className="card-premium animate-fadeIn overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
            <Wallet className="w-5 h-5 text-brand-600" />
            Vendor Settlements
          </h3>
          <p className="text-sm text-slate-500 mt-1">Manage COD verification and vendor payouts</p>
        </div>
        <div className="flex items-center gap-3">
          <select 
            className="input-field py-2 text-sm w-40" 
            value={statusFilter} 
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          >
            <option value="unpaid">Pending Payment</option>
            <option value="paid">Already Paid</option>
            <option value="all">All Delivered</option>
          </select>
          <button onClick={exportCSV} className="btn-secondary btn-sm flex items-center gap-2" title="Export CSV">
            <Download className="w-4 h-4" /> Export
          </button>
        </div>
      </div>

      {/* Bulk Action Bar */}
      {selectedPackages.size > 0 && (
        <div className="bg-brand-50 border-b border-brand-100 px-6 py-3 flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-4">
            <span className="font-bold text-brand-900">{selectedPackages.size} packages selected</span>
            <span className="text-sm text-brand-700">
              Total Payout: <span className="font-bold">Rs. {totalSelectedAmount.toLocaleString()}</span>
            </span>
          </div>
          <button 
            onClick={handleMarkPaid} 
            disabled={processing}
            className="btn-primary btn-sm flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            {processing ? 'Processing...' : 'Mark Vendor Paid'}
          </button>
        </div>
      )}

      <div className="overflow-x-auto min-h-[400px]">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-xs">
            <tr>
              <th className="px-6 py-3 w-10">
                <input 
                  type="checkbox" 
                  className="rounded border-slate-300 text-brand-600 focus:ring-brand-600"
                  checked={packages.length > 0 && packages.filter(p => !p.vendorPaid).length > 0 && selectedPackages.size === packages.filter(p => !p.vendorPaid).length}
                  onChange={selectAll}
                />
              </th>
              <th className="px-6 py-3">Tracking / Date</th>
              <th className="px-6 py-3">Vendor</th>
              <th className="px-6 py-3 text-right">COD Amount</th>
              <th className="px-6 py-3 text-right">Delivery Charge</th>
              <th className="px-6 py-3 text-right">Vendor Payable</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {loading ? <tr><td colSpan="8" className="px-6 py-12 text-center text-slate-500">Loading...</td></tr>
              : packages.length === 0 ? <tr><td colSpan="8" className="px-6 py-12 text-center text-slate-500">No packages found for the selected filter.</td></tr>
                : packages.map(p => (
                  <tr key={p._id} className={`hover:bg-slate-50 transition-colors ${selectedPackages.has(p._id) ? 'bg-brand-50/30' : ''}`}>
                    <td className="px-6 py-4">
                      <input 
                        type="checkbox" 
                        disabled={p.vendorPaid}
                        className="rounded border-slate-300 text-brand-600 focus:ring-brand-600 disabled:opacity-50"
                        checked={selectedPackages.has(p._id)}
                        onChange={() => toggleSelect(p._id)}
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div><TrackingLink code={p.trackingCode} /></div>
                      <div className="text-xs text-slate-500 mt-0.5">{new Date(p.createdAt).toLocaleDateString()}</div>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-700">{(p.vendorId?.vendorMeta?.shopName || p.vendorId?.name) || 'Unknown'}</td>
                    <td className="px-6 py-4 text-right font-medium">Rs. {p.amount}</td>
                    <td className="px-6 py-4 text-right font-medium text-red-500">Rs. {p.deliveryCharge}</td>
                    <td className="px-6 py-4 text-right font-bold text-brand-600">Rs. {p.vendorReceivable}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        {!p.codVerified ? (
                           <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 border border-amber-200 w-max">
                             COD Unverified
                           </span>
                        ) : (
                           <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200 w-max">
                             COD Verified
                           </span>
                        )}
                        {p.vendorPaid ? (
                           <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200 w-max">
                             Paid: {new Date(p.paidAt).toLocaleDateString()}
                           </span>
                        ) : (
                           <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700 border border-red-200 w-max">
                             Unpaid
                           </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        {!p.codVerified && !p.vendorPaid && (
                          <button 
                            onClick={() => handleVerifyCOD(p._id)}
                            className="btn-sm px-2 py-1 bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 font-bold rounded flex items-center gap-1"
                            title="Verify COD Collected"
                          >
                            <Check className="w-3 h-3" /> Verify COD
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>
      <Pagination pagination={pagination} onPageChange={setPage} limit={limit} onLimitChange={setLimit} />
    </div>
  );
};

export default AdminSettlements;
