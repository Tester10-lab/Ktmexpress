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

const AdminExpenses = () => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [pagination, setPagination] = useState(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const { showToast } = useToast();

  const fetchExpenses = (silent = false) => {
    if (!silent) setLoading(true);
    const q = new URLSearchParams({ page, limit });
    if (filterStatus) q.append('status', filterStatus);
    if (filterCategory) q.append('category', filterCategory);

    api.get(`/admin/expenses?${q.toString()}`)
      .then(r => {
        setExpenses(r.data.data || []);
        setPagination(r.data.pagination);
      })
      .finally(() => { if (!silent) setLoading(false); });
  };

  useEffect(() => { fetchExpenses(); }, [page, limit, filterStatus, filterCategory]);

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      await api.put(`/admin/expenses/${id}/status`, { status: newStatus });
      showToast(`Expense marked as ${newStatus}`, 'success');
      fetchExpenses(true);
    } catch (err) {
      showToast('Failed to update expense status', 'error');
    }
  };

  return (
    <div className="card-premium animate-fadeIn overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-50/50">
        <div>
          <h3 className="font-bold text-slate-800 text-lg">Rider Expenses Log</h3>
          <p className="text-sm text-slate-500">Global view of all submitted rider expenses</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <select className="input-field py-2" value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
            <option value="">All Categories</option>
            <option value="fuel">Fuel</option>
            <option value="food">Food</option>
            <option value="misc">Misc</option>
          </select>
          <select className="input-field py-2" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-xs">
            <tr>
              <th className="px-6 py-3">Date</th>
              <th className="px-6 py-3">Rider</th>
              <th className="px-6 py-3">Category</th>
              <th className="px-6 py-3 text-right">Amount</th>
              <th className="px-6 py-3">Description</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {loading ? <tr><td colSpan="7" className="px-6 py-12 text-center text-slate-500">Loading...</td></tr>
              : expenses.length === 0 ? <tr><td colSpan="7" className="px-6 py-12 text-center text-slate-500">No expenses logged.</td></tr>
                : expenses.map(e => (
                  <tr key={e._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-slate-500 font-medium whitespace-nowrap">{new Date(e.date).toLocaleDateString()}</td>
                    <td className="px-6 py-4 font-bold text-slate-900">{e.riderId?.name || 'Unknown'}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-slate-100 text-slate-700 capitalize tracking-wider">
                        {e.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-red-500 text-right">Rs. {e.amount?.toLocaleString()}</td>
                    <td className="px-6 py-4 text-slate-600">{e.description}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                        e.status === 'Approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                        : e.status === 'Rejected' ? 'bg-red-50 text-red-700 border-red-200' 
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {e.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {e.status === 'Pending' ? (
                        <div className="flex gap-2">
                          <button className="btn-sm p-2 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 font-bold flex items-center gap-1.5" onClick={() => handleStatusUpdate(e._id, 'Approved')} title="Approve">
                            <Check className="w-4 h-4" /> <span className="hidden sm:inline">Approve</span>
                          </button>
                          <button className="btn-sm p-2 rounded-lg bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 font-bold flex items-center gap-1.5" onClick={() => handleStatusUpdate(e._id, 'Rejected')} title="Reject">
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


export default AdminExpenses;
