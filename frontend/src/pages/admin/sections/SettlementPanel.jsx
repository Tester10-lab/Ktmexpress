import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import api from '../../../api/axios';
import MetricCard from '../../../components/MetricCard';
import { useToast } from '../../../store/ToastContext';
import ScanStation from '../../../components/ScanStation';
import Pagination from '../../../components/Pagination';
import { 
  LayoutDashboard, Wallet, Receipt, Users, Settings2, Activity, 
  Package, LayoutGrid, BarChart3, Truck, Factory, AlertTriangle, 
  MapPin, CheckCircle2, XCircle, Search, RefreshCw, Plus, FileSpreadsheet,
  Edit2, Trash2, Check, X, Bell
} from 'lucide-react';

// ─── Status Badge ───────────────────────────────────────────────────────────
function statusBadge(status) {
  const styles = {
    'Delivered': 'bg-emerald-100 text-emerald-700 border-emerald-200',
    'Cancelled': 'bg-red-100 text-red-700 border-red-200',
    'Returned': 'bg-sky-100 text-sky-700 border-sky-200',
    'Returned to Vendor': 'bg-sky-100 text-sky-700 border-sky-200',
    'Pending': 'bg-amber-100 text-amber-700 border-amber-200',
    'Pick Up Requested': 'bg-amber-100 text-amber-700 border-amber-200',
    'Picked Up': 'bg-brand-100 text-brand-700 border-brand-200',
    'In Warehouse': 'bg-brand-100 text-brand-700 border-brand-200',
    'Out for Delivery': 'bg-brand-100 text-brand-700 border-brand-200',
    'Postponed': 'bg-orange-100 text-orange-700 border-orange-200',
  };
  const style = styles[status] || 'bg-slate-100 text-slate-700 border-slate-200';
  return <span className={'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ' + style}>{status}</span>;
}

const AdminSettlements = () => {
  const [settlements, setSettlements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [pagination, setPagination] = useState(null);
  const { showToast } = useToast();

  const fetchSettlements = () => {
    setLoading(true);
    api.get(`/admin/settlements?page=${page}&limit=${limit}`)
      .then(r => {
        setSettlements(r.data.data || []);
        setPagination(r.data.pagination);
      })
      .catch(() => showToast('Failed to load settlements', 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchSettlements(); }, [page, limit]);

  const handleAction = async (id, status) => {
    try {
      await api.put(`/admin/settlements/${id}`, { status });
      showToast(`Settlement marked as ${status}`, 'success');
      fetchSettlements();
    } catch { showToast('Failed to update settlement', 'error'); }
  };

  return (
    <div className="card-premium animate-fadeIn overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
        <h3 className="font-bold text-slate-800 text-lg">Vendor Settlement Requests</h3>
        <p className="text-sm text-slate-500">Approve and reconcile vendor payments</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-xs">
            <tr>
              <th className="px-6 py-3">Date Requested</th>
              <th className="px-6 py-3">Vendor</th>
              <th className="px-6 py-3">Requested Amount</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {loading ? <tr><td colSpan="5" className="px-6 py-12 text-center text-slate-500">Loading...</td></tr>
              : settlements.length === 0 ? <tr><td colSpan="5" className="px-6 py-12 text-center text-slate-500">No settlement requests found.</td></tr>
                : settlements.map(s => (
                  <tr key={s._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-slate-500 font-medium whitespace-nowrap">{new Date(s.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900">{s.vendorId?.name || 'Unknown'}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{s.vendorId?.vendorMeta?.shopName}</div>
                    </td>
                    <td className="px-6 py-4 font-bold text-brand-600 text-base">Rs. {s.requestedAmount?.toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                        s.status === 'Approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                        : s.status === 'Rejected' ? 'bg-red-50 text-red-700 border-red-200' 
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {s.status === 'Pending' ? (
                        <div className="flex gap-2">
                          <button className="btn-sm p-2 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 font-bold flex items-center gap-1.5" onClick={() => handleAction(s._id, 'Approved')} title="Approve">
                            <Check className="w-4 h-4" /> <span className="hidden sm:inline">Approve</span>
                          </button>
                          <button className="btn-sm p-2 rounded-lg bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 font-bold flex items-center gap-1.5" onClick={() => handleAction(s._id, 'Rejected')} title="Reject">
                            <X className="w-4 h-4" /> <span className="hidden sm:inline">Reject</span>
                          </button>
                        </div>
                      ) : <span className="text-slate-400 font-medium text-xs uppercase tracking-wider">Processed</span>}
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
