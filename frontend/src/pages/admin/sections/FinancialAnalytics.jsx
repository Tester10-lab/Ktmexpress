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

const AdminReports = () => {
  const [analytics, setAnalytics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchReports = () => {
    setLoading(true);
    const q = new URLSearchParams();
    if (startDate) q.append('startDate', startDate);
    if (endDate) q.append('endDate', endDate);

    api.get(`/admin/analytics?${q.toString()}`)
      .then(r => setAnalytics(r.data.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchReports(); }, [startDate, endDate]);

  return (
    <div className="card-premium animate-fadeIn overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-50/50">
        <div>
          <h3 className="font-bold text-slate-800 text-lg">Vendor P&L Analytics</h3>
          <p className="text-sm text-slate-500">Revenue, delivery costs, and payouts by vendor</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">From</label>
            <input type="date" className="input-field py-2 px-3 text-sm" value={startDate} onChange={e => setStartDate(e.target.value)} />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">To</label>
            <input type="date" className="input-field py-2 px-3 text-sm" value={endDate} onChange={e => setEndDate(e.target.value)} />
          </div>
          {(startDate || endDate) && (
            <button onClick={() => { setStartDate(''); setEndDate(''); }} className="btn-secondary btn-sm px-4">Clear</button>
          )}
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-xs">
            <tr>
              <th className="px-6 py-3">Vendor</th>
              <th className="px-6 py-3 text-center">Deliveries</th>
              <th className="px-6 py-3 text-right">Gross Revenue (COD)</th>
              <th className="px-6 py-3 text-right">Delivery Costs</th>
              <th className="px-6 py-3 text-right">Net Payout</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {loading ? <tr><td colSpan="5" className="px-6 py-12 text-center text-slate-500">Loading...</td></tr>
              : analytics.length === 0 ? <tr><td colSpan="5" className="px-6 py-12 text-center text-slate-500">No analytics data yet.</td></tr>
                : analytics.map((a, i) => (
                  <tr key={i} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-900">{a.vendorInfo?.[0]?.name || 'Unknown'}</td>
                    <td className="px-6 py-4 text-center font-medium text-slate-700">{a.count}</td>
                    <td className="px-6 py-4 text-right font-bold text-emerald-600">Rs. {a.grossRevenue?.toLocaleString()}</td>
                    <td className="px-6 py-4 text-right font-bold text-red-500">Rs. {a.deliveryCosts?.toLocaleString()}</td>
                    <td className="px-6 py-4 text-right font-black text-brand-600">Rs. {((a.grossRevenue || 0) - (a.deliveryCosts || 0)).toLocaleString()}</td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};


export default AdminReports;
