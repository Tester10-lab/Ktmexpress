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

const AdminHome = () => {
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/admin/dashboard').then(r => setStats(r.data.data || {})).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-center text-slate-500 font-medium">Loading dashboard...</div>;

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Today's Activity */}
      <div>
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
          <span className="text-lg">📅</span> Today's Activity
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <MetricCard title="New Packages Today" value={stats.todayPackages ?? 0} color="primary" icon={<Package className="w-5 h-5 text-brand-600" />} />
          <MetricCard title="Deliveries Today" value={stats.todayDeliveries ?? 0} color="success" icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />} />
          <MetricCard title="Pending Expenses" value={stats.todayExpenses ?? 0} color="warning" icon={<AlertTriangle className="w-5 h-5 text-amber-600" />} />
        </div>
      </div>

      {/* All-Time Stats */}
      <div>
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">All-Time Statistics</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div onClick={() => navigate('/admin/scan-history')} className="cursor-pointer transition-transform hover:-translate-y-1">
            <MetricCard title="Total Packages" value={stats.totalPackages ?? 0} color="primary" icon={<Package className="w-5 h-5 text-brand-600" />} />
          </div>
          <div onClick={() => navigate('/admin/scan-history')} className="cursor-pointer transition-transform hover:-translate-y-1">
            <MetricCard title="Delivered" value={stats.delivered ?? 0} color="success" icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />} />
          </div>
          <div onClick={() => navigate('/admin/scan-history')} className="cursor-pointer transition-transform hover:-translate-y-1">
            <MetricCard title="Pending" value={stats.pending ?? 0} color="warning" icon={<AlertTriangle className="w-5 h-5 text-amber-600" />} />
          </div>
          <div onClick={() => navigate('/admin/scan-history')} className="cursor-pointer transition-transform hover:-translate-y-1">
            <MetricCard title="Cancelled" value={stats.cancelled ?? 0} color="danger" icon={<XCircle className="w-5 h-5 text-red-600" />} />
          </div>
          <div onClick={() => navigate('/admin/scan-history')} className="cursor-pointer transition-transform hover:-translate-y-1">
            <MetricCard title="Returned" value={stats.returned ?? 0} color="info" icon={<RefreshCw className="w-5 h-5 text-sky-600" />} />
          </div>
          <div onClick={() => navigate('/admin/users')} className="cursor-pointer transition-transform hover:-translate-y-1">
            <MetricCard title="Active Vendors" value={stats.activeVendors ?? 0} color="purple" icon={<Users className="w-5 h-5 text-purple-600" />} />
          </div>
          <div onClick={() => navigate('/admin/users')} className="cursor-pointer transition-transform hover:-translate-y-1">
            <MetricCard title="Active Riders" value={stats.activeRiders ?? 0} color="success" icon={<Truck className="w-5 h-5 text-emerald-600" />} />
          </div>
          <div onClick={() => navigate('/admin/reports')} className="cursor-pointer transition-transform hover:-translate-y-1">
            <MetricCard title="Total Revenue" value={`Rs. ${stats.totalRevenue ?? 0}`} color="primary" icon={<Wallet className="w-5 h-5 text-brand-600" />} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card-premium lg:col-span-2 cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/admin/reports')}>
          <div className="px-6 py-4 border-b border-slate-100">
            <h3 className="font-bold text-slate-800">Platform Summary</h3>
            <p className="text-xs text-slate-500">Delivery fees collected by the platform</p>
          </div>
          <div className="flex flex-col items-center justify-center p-12 bg-slate-50/50">
            <p className="text-sm font-semibold text-slate-500 mb-2 uppercase tracking-wider">Platform Profit (Delivery Fees)</p>
            <p className="text-4xl font-black text-emerald-600">Rs. {stats.profit ?? 0}</p>
          </div>
        </div>
        <div className="card-premium cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/admin/reports')}>
          <div className="px-6 py-4 border-b border-slate-100">
            <h3 className="font-bold text-slate-800">Delivery Charges Collected</h3>
          </div>
          <div className="flex flex-col items-center justify-center p-12 bg-slate-50/50 h-full">
            <p className="text-sm font-semibold text-slate-500 mb-2 uppercase tracking-wider">Total Delivery Fees</p>
            <p className="text-3xl font-black text-brand-600">Rs. {stats.totalDeliveryCharges ?? 0}</p>
          </div>
        </div>
      </div>
    </div>
  );
};


export default AdminHome;
