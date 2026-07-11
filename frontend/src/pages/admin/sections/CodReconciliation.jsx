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

const AdminCodHandovers = () => {
  const [handovers, setHandovers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(null);
  const { showToast } = useToast();

  const fetchHandovers = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await api.get('/dispatcher/cod-handovers');
      setHandovers(res.data.data || []);
    } catch (e) {
      showToast('Failed to load handovers', 'error');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchHandovers();
  }, []);

  const handleVerify = async (id, status) => {
    if (!window.confirm(`Are you sure you want to mark this handover as ${status}?`)) return;
    setVerifying(id);
    try {
      await api.put(`/dispatcher/cod-handovers/${id}/verify`, { status });
      showToast(`Handover marked as ${status}`, 'success');
      fetchHandovers(true);
    } catch (e) {
      showToast(e.message || 'Failed to verify handover', 'error');
    } finally {
      setVerifying(null);
    }
  };

  if (loading) return <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div></div>;

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">COD Handovers</h2>
          <p className="text-sm text-slate-500">Verify cash deposited by riders at the hub.</p>
        </div>
      </div>

      <div className="card-premium overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-xs">
              <tr>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Rider</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Packages</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {handovers.length === 0 ? (
                <tr><td colSpan="6" className="text-center py-12 text-slate-500">No COD handovers found.</td></tr>
              ) : (
                handovers.map(h => (
                  <tr key={h._id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900">{new Date(h.createdAt).toLocaleDateString()}</div>
                      <div className="text-xs text-slate-500">{new Date(h.createdAt).toLocaleTimeString()}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold">{h.riderId?.name}</div>
                      <div className="text-xs text-slate-500">{h.riderId?.contact || '-'}</div>
                    </td>
                    <td className="px-6 py-4 font-black text-slate-900">Rs. {h.amount}</td>
                    <td className="px-6 py-4">
                      <span className="bg-slate-100 px-2 py-1 rounded-lg text-xs font-bold">{h.packageIds?.length || 0}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${h.status === 'Verified' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : h.status === 'Rejected' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                        {h.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {h.status === 'Pending Verification' ? (
                        <div className="flex gap-2">
                          <button onClick={() => handleVerify(h._id, 'Verified')} disabled={verifying === h._id} className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700">Verify</button>
                          <button onClick={() => handleVerify(h._id, 'Rejected')} disabled={verifying === h._id} className="px-3 py-1.5 bg-red-600 text-white text-xs font-bold rounded-lg hover:bg-red-700">Reject</button>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-500 italic">By {h.verifiedBy?.name || 'Admin'}</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};


export default AdminCodHandovers;
