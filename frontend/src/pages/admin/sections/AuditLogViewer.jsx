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

const AdminScanHistory = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ role: '', trackingCode: '' });
  const { showToast } = useToast();

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams();
      if (filter.role) q.append('role', filter.role);
      if (filter.trackingCode) q.append('trackingCode', filter.trackingCode);
      const r = await api.get(`/scan/all?${q.toString()}`);
      setHistory(r.data.data || []);
    } catch { showToast('Failed to load global scan history', 'error'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchHistory(); }, [filter.role]);

  return (
    <div className="card-premium animate-fadeIn overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-50/50">
        <div>
          <h3 className="font-bold text-slate-800 text-lg">Global Scan History</h3>
          <p className="text-sm text-slate-500">Audit log of all package scans and status changes</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full sm:w-auto">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              className="input-field pl-9 w-full sm:w-64" 
              placeholder="Tracking Code..." 
              value={filter.trackingCode} 
              onChange={e => setFilter({ ...filter, trackingCode: e.target.value })} 
              onKeyDown={e => e.key === 'Enter' && fetchHistory()} 
            />
          </div>
          <select className="input-field w-full sm:w-auto" value={filter.role} onChange={e => setFilter({ ...filter, role: e.target.value })}>
            <option value="">All Roles</option>
            <option value="dispatcher">Warehouse Staff</option>
            <option value="rider">Rider</option>
            <option value="admin">Admin Override</option>
          </select>
          <button className="btn-secondary w-full sm:w-auto flex justify-center items-center gap-2" onClick={fetchHistory}>
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-xs">
            <tr>
              <th className="px-6 py-3">Time</th>
              <th className="px-6 py-3">User / Role</th>
              <th className="px-6 py-3">Tracking Code</th>
              <th className="px-6 py-3">Action</th>
              <th className="px-6 py-3">Location / Notes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {loading ? <tr><td colSpan="5" className="px-6 py-12 text-center text-slate-500">Loading...</td></tr>
              : history.length === 0 ? <tr><td colSpan="5" className="px-6 py-12 text-center text-slate-500">No scan records found.</td></tr>
                : history.map(ev => (
                  <tr key={ev._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-slate-500 font-medium whitespace-nowrap">{new Date(ev.createdAt).toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900">{ev.scannerName}</div>
                      <div className="text-xs text-slate-500 font-medium mt-0.5">
                        {ev.scannerRole === 'dispatcher' ? 'Warehouse Staff' : ev.scannerRole}
                        {ev.isAdminOverride && <span className="text-amber-600 ml-1">(Override)</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-brand-600">{ev.trackingCode}</td>
                    <td className="px-6 py-4">{statusBadge(ev.toStatus)}</td>
                    <td className="px-6 py-4">
                      {ev.location && <div className="text-xs text-slate-500 flex items-center gap-1 mb-1"><MapPin className="w-3 h-3 text-slate-400" /> {ev.location}</div>}
                      {ev.notes && <div className="text-sm text-slate-700 italic border-l-2 border-slate-200 pl-2 mt-1">{ev.notes}</div>}
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};


export default AdminScanHistory;
