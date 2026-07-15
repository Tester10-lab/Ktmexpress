import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import api from '../../../api/axios';
import MetricCard from '../../../components/MetricCard';
import { useToast } from '../../../store/ToastContext';
import ScanStation from '../../../components/ScanStation';
import Pagination from '../../../components/Pagination';
import TrackingLink from '../../../components/TrackingLink';
import { useTrackingDrawer } from '../../../store/TrackingDrawerContext';
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

const AdminDispatcher = () => {
  const { openTracking, openShopTracking } = useTrackingDrawer();
  const [stats, setStats] = useState({});
  const [pickups, setPickups] = useState([]);
  const [warehousePackages, setWarehousePackages] = useState([]);
  const [returnPackages, setReturnPackages] = useState([]);
  const [riders, setRiders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assignMap, setAssignMap] = useState({});
  const [deliveryRiderMap, setDeliveryRiderMap] = useState({});
  const [actionLoading, setActionLoading] = useState({});
  const [activeTab, setActiveTab] = useState('overview');
  const { showToast } = useToast();

  const [selectedRider, setSelectedRider] = useState(null);
  const [riderHistory, setRiderHistory] = useState(null);
  const [riderHistoryLoading, setRiderHistoryLoading] = useState(false);
  const [historyFilters, setHistoryFilters] = useState({
    status: 'all',
    vendorId: 'all',
    valley: 'all',
    startDate: '',
    endDate: '',
  });
  const [expandedTimelines, setExpandedTimelines] = useState(new Set());

  const fetchRiderHistory = useCallback(async (riderId, filters = {}) => {
    setRiderHistoryLoading(true);
    try {
      let query = '';
      const params = [];
      if (filters.status && filters.status !== 'all') params.push(`status=${filters.status}`);
      if (filters.vendorId && filters.vendorId !== 'all') params.push(`vendorId=${filters.vendorId}`);
      if (filters.valley && filters.valley !== 'all') params.push(`valley=${filters.valley}`);
      if (filters.startDate) params.push(`startDate=${filters.startDate}`);
      if (filters.endDate) params.push(`endDate=${filters.endDate}`);
      
      if (params.length > 0) {
        query = '?' + params.join('&');
      }
      const res = await api.get(`/dispatcher/riders/${riderId}/history${query}`);
      setRiderHistory(res.data.data);
    } catch (err) {
      showToast('Failed to load rider history', 'error');
    } finally {
      setRiderHistoryLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    if (selectedRider) {
      fetchRiderHistory(selectedRider._id, historyFilters);
    }
  }, [selectedRider, historyFilters, fetchRiderHistory]);

  const handleRiderClick = (rider) => {
    setHistoryFilters({
      status: 'all',
      vendorId: 'all',
      valley: 'all',
      startDate: '',
      endDate: '',
    });
    setExpandedTimelines(new Set());
    setSelectedRider(rider);
  };

  const toggleTimeline = (pkgId) => {
    const newSet = new Set(expandedTimelines);
    if (newSet.has(pkgId)) newSet.delete(pkgId);
    else newSet.add(pkgId);
    setExpandedTimelines(newSet);
  };

  const fetchAll = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [sRes, pRes, wRes, retRes, rRes] = await Promise.all([
        api.get('/dispatcher/dashboard'),
        api.get('/dispatcher/pickups'),
        api.get('/dispatcher/packages?status=In Warehouse'),
        api.get('/dispatcher/packages?status=Returned,Returned to Vendor'),
        api.get('/dispatcher/riders'),
      ]);
      setStats(sRes.data.data || {});
      setPickups(pRes.data.data || []);
      setWarehousePackages(wRes.data.data || []);
      setReturnPackages(retRes.data.data || []);
      setRiders(rRes.data.data || []);
    } catch { showToast('Failed to load dispatcher data', 'error'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const assignPickup = async (pickupId) => {
    const riderId = assignMap[pickupId];
    if (!riderId) return showToast('Select a rider first', 'warning');
    setActionLoading(s => ({ ...s, [`p_${pickupId}`]: true }));
    try {
      await api.put('/dispatcher/assign-pickup', { pickupId, riderId });
      showToast('Rider assigned for pickup!', 'success');
      fetchAll(true);
    } catch (e) { showToast(e.message || 'Failed', 'error'); }
    finally { setActionLoading(s => ({ ...s, [`p_${pickupId}`]: false })); }
  };

  const assignShopPickups = async (shopId, pickupIds) => {
    const riderId = assignMap[shopId];
    if (!riderId) return showToast('Select a rider first', 'warning');
    setActionLoading(s => ({ ...s, [`p_${shopId}`]: true }));
    try {
      await Promise.all(pickupIds.map(pickupId => api.put('/dispatcher/assign-pickup', { pickupId, riderId })));
      showToast('Rider assigned for all pickups!', 'success');
      fetchAll(true);
    } catch (e) { showToast(e.message || 'Failed', 'error'); }
    finally { setActionLoading(s => ({ ...s, [`p_${shopId}`]: false })); }
  };

  const confirmWarehouse = async (packageId) => {
    setActionLoading(s => ({ ...s, [`w_${packageId}`]: true }));
    try {
      await api.put('/dispatcher/confirm-warehouse', { packageId });
      showToast('Package confirmed at warehouse!', 'success');
      fetchAll(true);
    } catch (e) { showToast(e.message || 'Failed', 'error'); }
    finally { setActionLoading(s => ({ ...s, [`w_${packageId}`]: false })); }
  };

  const assignDelivery = async (packageId) => {
    const riderId = deliveryRiderMap[packageId];
    if (!riderId) return showToast('Select a rider first', 'warning');
    setActionLoading(s => ({ ...s, [`d_${packageId}`]: true }));
    try {
      await api.put('/dispatcher/assign-delivery', { packageId, riderId });
      showToast('Rider assigned for delivery!', 'success');
      fetchAll(true);
    } catch (e) { showToast(e.message || 'Failed', 'error'); }
    finally { setActionLoading(s => ({ ...s, [`d_${packageId}`]: false })); }
  };

  const confirmReturn = async (packageId, type) => {
    setActionLoading(s => ({ ...s, [`r_${packageId}_${type}`]: true }));
    try {
      await api.put('/dispatcher/confirm-return', { packageId, type });
      showToast(`Return ${type} confirmed!`, 'success');
      fetchAll(true);
    } catch (e) { showToast(e.message || 'Failed', 'error'); }
    finally { setActionLoading(s => ({ ...s, [`r_${packageId}_${type}`]: false })); }
  };

  const pendingPickups = pickups.filter(p => p.status === 'pending');
  const pendingGroups = Object.values(pendingPickups.reduce((acc, p) => {
    const shopId = p.vendorId?._id || 'unknown';
    if (!acc[shopId]) acc[shopId] = { shopId, shopName: p.vendorId?.vendorMeta?.shopName || p.vendorId?.name || '—', packages: [], oldestDate: p.requestedAt, pickupIds: [] };
    acc[shopId].packages.push(p);
    acc[shopId].pickupIds.push(p._id);
    if (new Date(p.requestedAt) < new Date(acc[shopId].oldestDate)) acc[shopId].oldestDate = p.requestedAt;
    return acc;
  }, {}));

  const assignedPickups = pickups.filter(p => p.status === 'assigned');

  const tabs = [
    { id: 'overview', label: 'Overview', count: null },
    { id: 'pickups', label: 'Pickups', count: pendingPickups.length + assignedPickups.length },
    { id: 'warehouse', label: 'Warehouse', count: warehousePackages.length },
    { id: 'returns', label: 'Returns', count: returnPackages.length },
    { id: 'riders', label: 'Riders', count: riders.length },
  ];

  if (loading) return <div className="p-8 text-center text-slate-500 font-medium">Loading dispatcher panel...</div>;

  return (
    <div className="animate-fadeIn">
      {/* Tab Navigation */}
      <div className="flex overflow-x-auto hide-scrollbar border-b-2 border-slate-200 mb-6 gap-2">
        {tabs.map(t => (
          <button 
            key={t.id} 
            onClick={() => setActiveTab(t.id)} 
            className={`px-5 py-3 text-sm font-bold tracking-wide rounded-t-xl transition-colors whitespace-nowrap flex items-center gap-2 ${
              activeTab === t.id 
                ? 'bg-brand-600 text-white shadow-sm' 
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            {t.label} 
            {t.count !== null && (
              <span className={`px-2 py-0.5 rounded-full text-xs ${activeTab === t.id ? 'bg-white/25 text-white' : 'bg-slate-200 text-slate-600'}`}>
                {t.count}
              </span>
            )}
          </button>
        ))}
        <div className="flex-1" />
        <button className="btn-secondary btn-sm mb-1 self-end mr-1 flex items-center gap-1.5" onClick={fetchAll}>
          <RefreshCw className="w-4 h-4" /> <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-scaleIn">
          <MetricCard title="Pending Pickups" value={stats.pickupsPending ?? 0} color="warning" icon={<span className="text-2xl">🚚</span>} />
          <MetricCard title="In Warehouse" value={stats.inWarehouse ?? 0} color="purple" icon={<span className="text-2xl">🏭</span>} />
          <MetricCard title="Unassigned" value={stats.unassigned ?? 0} color="danger" icon={<span className="text-2xl">⚠️</span>} />
          <MetricCard title="Out for Delivery" value={stats.outForDelivery ?? 0} color="info" icon={<span className="text-2xl">📦</span>} />
          <MetricCard title="Returns Pending" value={stats.returnedPending ?? 0} color="warning" icon={<span className="text-2xl">↩️</span>} />
          <MetricCard title="Active Riders" value={stats.activeRiders ?? 0} color="success" icon={<span className="text-2xl">🏍️</span>} />
        </div>
      )}

      {/* Pickups Tab */}
      {activeTab === 'pickups' && (
        <div className="space-y-6 animate-fadeInUp">
          <div className="card-premium overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center flex-wrap gap-4">
              <div>
                <h3 className="font-bold text-slate-800 text-lg">Pending Pickup Requests</h3>
                <p className="text-sm text-slate-500">{pendingPickups.length} request(s) awaiting rider assignment</p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-xs border-y border-slate-100">
                  <tr>
                    {['Shop Name', 'Total Pending', 'Oldest Requested At', 'Assign Rider', 'Action'].map(h => <th key={h} className="px-6 py-4">{h}</th>)}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {pendingGroups.length === 0 ? <tr><td colSpan="5" className="px-6 py-12 text-center text-slate-500">No pending pickups.</td></tr>
                  : pendingGroups.map(g => (
                    <tr key={g.shopId} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-900">
                          <button 
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); openShopTracking(g.shopName, g.packages); }} 
                            style={{ color: '#2563eb', textDecoration: 'none', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                            onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                            onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
                            title="View Packages"
                          >
                            {g.shopName} ({g.packages.length})
                          </button>
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-900">{g.packages.length} Packages</td>
                      <td className="px-6 py-4 text-slate-500">{g.oldestDate ? new Date(g.oldestDate).toLocaleString('en-NP', { dateStyle: 'short', timeStyle: 'short' }) : '—'}</td>
                      <td className="px-6 py-4">
                        <select className="input-field py-1.5 text-xs w-40" value={assignMap[g.shopId] || ''} onChange={e => setAssignMap(m => ({ ...m, [g.shopId]: e.target.value }))}>
                          <option value="">Select Rider</option>
                          {riders.map(r => <option key={r._id} value={r._id}>{r.name}</option>)}
                        </select>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="btn-primary btn-sm px-4" onClick={() => assignShopPickups(g.shopId, g.pickupIds)} disabled={actionLoading[`p_${g.shopId}`]}>
                          {actionLoading[`p_${g.shopId}`] ? '...' : 'Assign'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {assignedPickups.length > 0 && (
            <div className="card-premium overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                <h3 className="font-bold text-slate-800 text-lg">Assigned — Awaiting Warehouse Arrival</h3>
                <p className="text-sm text-slate-500">{assignedPickups.length} pickup(s) assigned</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-xs">
                    <tr>
                      <th className="px-6 py-3">Tracking</th>
                      <th className="px-6 py-3">Vendor</th>
                      <th className="px-6 py-3">Rider</th>
                      <th className="px-6 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {assignedPickups.map(p => (
                      <tr key={p._id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4"><TrackingLink code={p.packageId?.trackingCode} /></td>
                        <td className="px-6 py-4 font-bold text-slate-900">
                          <button 
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); openTracking(p.packageId?.trackingCode || p.trackingCode); }} 
                            style={{ color: '#2563eb', textDecoration: 'none', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                            onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                            onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
                            title="View Package Details"
                          >
                            {p.vendorId?.vendorMeta?.shopName || '—'}
                          </button>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {p.assignedRiderId?.name || 'Assigned'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button className="btn-sm px-4 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 font-bold flex items-center justify-end gap-1.5 ml-auto" onClick={() => confirmWarehouse(p.packageId?._id)} disabled={actionLoading[`w_${p.packageId?._id}`]}>
                            {actionLoading[`w_${p.packageId?._id}`] ? '...' : <><CheckCircle2 className="w-4 h-4" /> Confirm Arrival</>}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Warehouse Tab */}
      {activeTab === 'warehouse' && (
        <div className="card-premium overflow-hidden animate-fadeInUp">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
            <h3 className="font-bold text-slate-800 text-lg">Warehouse Packages</h3>
            <p className="text-sm text-slate-500">{warehousePackages.length} package(s) ready for delivery assignment</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-xs">
                <tr>
                  <th className="px-6 py-3">Tracking</th>
                  <th className="px-6 py-3">Vendor</th>
                  <th className="px-6 py-3">Customer</th>
                  <th className="px-6 py-3">Destination</th>
                  <th className="px-6 py-3">COD</th>
                  <th className="px-6 py-3">Assign Rider</th>
                  <th className="px-6 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {warehousePackages.length === 0 ? <tr><td colSpan="7" className="px-6 py-12 text-center text-slate-500">No packages in warehouse.</td></tr>
                  : warehousePackages.map(p => (
                  <tr key={p._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4"><TrackingLink code={p.trackingCode} /></td>
                    <td className="px-6 py-4 font-bold text-slate-900">
                          <button 
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); openTracking(p.packageId?.trackingCode || p.trackingCode); }} 
                            style={{ color: '#2563eb', textDecoration: 'none', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                            onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                            onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
                            title="View Package Details"
                          >
                            {p.vendorId?.vendorMeta?.shopName || '—'}
                          </button>
                        </td>
                    <td className="px-6 py-4 font-medium text-slate-800">{p.customerName}</td>
                    <td className="px-6 py-4 text-slate-500">{p.city || p.address || '—'}</td>
                    <td className="px-6 py-4 font-bold text-slate-900">Rs. {p.amount?.toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <select className="input-field py-1.5 text-xs w-40" value={deliveryRiderMap[p._id] || ''} onChange={e => setDeliveryRiderMap(m => ({ ...m, [p._id]: e.target.value }))}>
                        <option value="">Select Rider</option>
                        {riders.map(r => <option key={r._id} value={r._id}>{r.name}</option>)}
                      </select>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="btn-primary btn-sm px-4 flex items-center justify-end gap-1.5 ml-auto" onClick={() => assignDelivery(p._id)} disabled={actionLoading[`d_${p._id}`]}>
                        {actionLoading[`d_${p._id}`] ? '...' : <><Truck className="w-4 h-4" /> Send</>}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Returns Tab */}
      {activeTab === 'returns' && (
        <div className="card-premium overflow-hidden animate-fadeInUp">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
            <h3 className="font-bold text-slate-800 text-lg">Reverse Logistics (Returns)</h3>
            <p className="text-sm text-slate-500">Confirm rider returns and vendor handovers</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-xs">
                <tr>
                  <th className="px-6 py-3">Tracking</th>
                  <th className="px-6 py-3">Vendor</th>
                  <th className="px-6 py-3">Customer</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-center">Rider Returned</th>
                  <th className="px-6 py-3 text-center">Vendor Received</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {returnPackages.length === 0 ? <tr><td colSpan="7" className="px-6 py-12 text-center text-slate-500">No return packages.</td></tr>
                  : returnPackages.map(p => (
                  <tr key={p._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4"><TrackingLink code={p.trackingCode} /></td>
                    <td className="px-6 py-4 font-bold text-slate-900">
                          <button 
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); openTracking(p.packageId?.trackingCode || p.trackingCode); }} 
                            style={{ color: '#2563eb', textDecoration: 'none', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                            onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                            onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
                            title="View Package Details"
                          >
                            {p.vendorId?.vendorMeta?.shopName || '—'}
                          </button>
                        </td>
                    <td className="px-6 py-4 font-medium text-slate-800">{p.customerName}</td>
                    <td className="px-6 py-4">{statusBadge(p.status)}</td>
                    <td className="px-6 py-4 text-center">
                      {p.rtvSignoff?.riderReturned ? <span className="inline-flex items-center gap-1 text-emerald-600 font-bold text-xs"><CheckCircle2 className="w-4 h-4" /> Yes</span> : <span className="text-amber-500 font-bold text-xs">No</span>}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {p.rtvSignoff?.vendorReceived ? <span className="inline-flex items-center gap-1 text-emerald-600 font-bold text-xs"><CheckCircle2 className="w-4 h-4" /> Yes</span> : <span className="text-amber-500 font-bold text-xs">No</span>}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        {!p.rtvSignoff?.riderReturned && (
                          <button className="btn-sm px-3 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 font-bold whitespace-nowrap" onClick={() => confirmReturn(p._id, 'rider')} disabled={actionLoading[`r_${p._id}_rider`]}>
                            {actionLoading[`r_${p._id}_rider`] ? '...' : 'Rider Return'}
                          </button>
                        )}
                        {p.rtvSignoff?.riderReturned && !p.rtvSignoff?.vendorReceived && (
                          <button className="btn-sm px-3 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 font-bold whitespace-nowrap" onClick={() => confirmReturn(p._id, 'vendor')} disabled={actionLoading[`r_${p._id}_vendor`]}>
                            {actionLoading[`r_${p._id}_vendor`] ? '...' : 'Vendor Handover'}
                          </button>
                        )}
                        {p.rtvSignoff?.vendorReceived && <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200"><CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Complete</span>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Riders Tab */}
      {activeTab === 'riders' && (
        <div className="card-premium overflow-hidden animate-fadeInUp">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
            <h3 className="font-bold text-slate-800 text-lg">Active Riders</h3>
            <p className="text-sm text-slate-500">{riders.length} rider(s) available for assignment</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-xs">
                <tr>
                  <th className="px-6 py-3">Name</th>
                  <th className="px-6 py-3">Email</th>
                  <th className="px-6 py-3">Contact</th>
                  <th className="px-6 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {riders.length === 0 ? <tr><td colSpan="4" className="px-6 py-12 text-center text-slate-500">No active riders.</td></tr>
                  : riders.map(r => (
                  <tr 
                    key={r._id} 
                    onClick={() => handleRiderClick(r)}
                    className="hover:bg-slate-100 cursor-pointer transition-all hover:shadow-sm"
                  >
                    <td className="px-6 py-4 font-bold text-slate-900">{r.name}</td>
                    <td className="px-6 py-4 text-slate-500" onClick={(e) => e.stopPropagation()}>{r.email}</td>
                    <td className="px-6 py-4 font-medium text-slate-700" onClick={(e) => e.stopPropagation()}>{r.contact || '—'}</td>
                    <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border bg-emerald-50 text-emerald-700 border-emerald-200">Active</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Rider History Drawer */}
      {selectedRider && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex justify-end">
          <div className="w-full max-w-4xl bg-white shadow-2xl h-full flex flex-col animate-slideOver">
            
            {/* Drawer Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                  <span className="text-xl">🏍️</span> Rider Activity History: {selectedRider.name}
                </h3>
                <div className="flex gap-4 text-xs text-slate-500 mt-1">
                  <span>📧 {selectedRider.email}</span>
                  <span>📞 {selectedRider.contact || 'No contact'}</span>
                </div>
              </div>
              <button 
                onClick={() => setSelectedRider(null)} 
                className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {riderHistoryLoading ? (
                <div className="py-20 text-center text-slate-400">Loading rider activity history...</div>
              ) : !riderHistory ? (
                <div className="py-20 text-center text-slate-400">Failed to load statistics.</div>
              ) : (
                <>
                  {/* KPIs */}
                  <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                    {[
                      { title: 'Handled', value: riderHistory.stats.totalHandled, color: 'bg-slate-50 border-slate-200 text-slate-700' },
                      { title: 'Picked Up', value: riderHistory.stats.totalPickedUp, color: 'bg-blue-50 border-blue-100 text-blue-700' },
                      { title: 'Delivered', value: riderHistory.stats.totalDelivered, color: 'bg-emerald-50 border-emerald-100 text-emerald-700' },
                      { title: 'Failed/Returned', value: riderHistory.stats.totalFailedReturned, color: 'bg-rose-50 border-rose-100 text-rose-700' },
                      { title: 'COD Collected', value: `Rs. ${riderHistory.stats.totalCODCollected.toLocaleString()}`, color: 'bg-amber-50 border-amber-100 text-amber-700' },
                      { title: 'Assigned Now', value: riderHistory.stats.currentAssigned, color: 'bg-purple-50 border-purple-100 text-purple-700' }
                    ].map((c, i) => (
                      <div key={i} className={`p-3 rounded-lg border ${c.color} flex flex-col justify-between h-20 shadow-sm`}>
                        <div className="text-[9px] uppercase font-bold tracking-wider opacity-75">{c.title}</div>
                        <div className="text-sm font-extrabold">{c.value}</div>
                      </div>
                    ))}
                  </div>

                  {/* Filters */}
                  <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-3">
                    <div className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1">
                      <Sliders className="w-3.5 h-3.5" /> Filter History
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1">Status</label>
                        <select 
                          className="input-field py-1 w-full text-xs"
                          value={historyFilters.status}
                          onChange={(e) => setHistoryFilters({ ...historyFilters, status: e.target.value })}
                        >
                          <option value="all">All Statuses</option>
                          <option value="In Warehouse">In Warehouse</option>
                          <option value="Picked Up">Picked Up</option>
                          <option value="Out for Delivery">Out for Delivery</option>
                          <option value="Delivered">Delivered</option>
                          <option value="Postponed">Postponed</option>
                          <option value="Hold">Hold</option>
                          <option value="Cancelled">Cancelled</option>
                          <option value="Returned">Returned</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1">Vendor/Shop</label>
                        <select 
                          className="input-field py-1 w-full text-xs"
                          value={historyFilters.vendorId}
                          onChange={(e) => setHistoryFilters({ ...historyFilters, vendorId: e.target.value })}
                        >
                          <option value="all">All Vendors</option>
                          {(() => {
                            const uniqueVendors = [];
                            const seen = new Set();
                            (riderHistory.packages || []).forEach(p => {
                              const v = p.vendorId;
                              if (v && !seen.has(v._id)) {
                                seen.add(v._id);
                                uniqueVendors.push(v);
                              }
                            });
                            return uniqueVendors.map(v => (
                              <option key={v._id} value={v._id}>
                                {v.vendorMeta?.shopName || v.name}
                              </option>
                            ));
                          })()}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1">Region</label>
                        <select 
                          className="input-field py-1 w-full text-xs"
                          value={historyFilters.valley}
                          onChange={(e) => setHistoryFilters({ ...historyFilters, valley: e.target.value })}
                        >
                          <option value="all">All Regions</option>
                          <option value="inside">Inside Valley</option>
                          <option value="outside">Outside Valley</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1">Start Date</label>
                        <input 
                          type="date"
                          className="input-field py-1 w-full text-xs"
                          value={historyFilters.startDate}
                          onChange={(e) => setHistoryFilters({ ...historyFilters, startDate: e.target.value })}
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1">End Date</label>
                        <input 
                          type="date"
                          className="input-field py-1 w-full text-xs"
                          value={historyFilters.endDate}
                          onChange={(e) => setHistoryFilters({ ...historyFilters, endDate: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Packages Table */}
                  <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-white">
                    <div className="overflow-x-auto max-h-[450px]">
                      <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider sticky top-0">
                          <tr>
                            <th className="px-4 py-3">Tracking Code</th>
                            <th className="px-4 py-3">Vendor / Region</th>
                            <th className="px-4 py-3">Customer</th>
                            <th className="px-4 py-3">COD / Dates</th>
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-xs">
                          {riderHistory.packages.length === 0 ? (
                            <tr>
                              <td colSpan="6" className="px-4 py-12 text-center text-slate-400">
                                No historical records match these filters.
                              </td>
                            </tr>
                          ) : (
                            riderHistory.packages.map(p => {
                              const isTimelineExpanded = expandedTimelines.has(p._id);
                              return (
                                <React.Fragment key={p._id}>
                                  <tr className="hover:bg-slate-50/50">
                                    <td className="px-4 py-3 font-semibold">
                                      <TrackingLink code={p.trackingCode} />
                                    </td>
                                    <td className="px-4 py-3">
                                      <div className="font-bold text-slate-700">{p.vendorId?.vendorMeta?.shopName || (p.vendorId?.vendorMeta?.shopName || p.vendorId?.name) || 'Unknown'}</div>
                                      <div className="text-[10px] text-slate-400 font-medium">
                                        {p.outOfValley ? '🏔️ Outside Valley' : '🏡 Inside Valley'}
                                      </div>
                                    </td>
                                    <td className="px-4 py-3">
                                      <div className="font-bold text-slate-800">{p.customerName}</div>
                                      <div className="text-slate-500">{p.customerPhone}</div>
                                    </td>
                                    <td className="px-4 py-3">
                                      <div className="font-black text-slate-900">Rs. {p.amount}</div>
                                      <div className="text-[9px] text-slate-400 mt-0.5">
                                        Created: {new Date(p.createdAt).toLocaleDateString()}
                                      </div>
                                    </td>
                                    <td className="px-4 py-3">{statusBadge(p.status)}</td>
                                    <td className="px-4 py-3 text-right">
                                      <button 
                                        onClick={() => toggleTimeline(p._id)}
                                        className="text-xs font-bold text-brand-600 hover:text-brand-800 transition-colors"
                                      >
                                        {isTimelineExpanded ? 'Hide Timeline' : 'View Timeline'}
                                      </button>
                                    </td>
                                  </tr>
                                  
                                  {isTimelineExpanded && (
                                    <tr>
                                      <td colSpan="6" className="px-4 py-3 bg-slate-50/50">
                                        <div className="pl-4 border-l-2 border-brand-500 space-y-2">
                                          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Package Timeline Log</div>
                                          <div className="space-y-1.5 max-h-40 overflow-y-auto">
                                            {p.timeline.map((t, idx) => (
                                              <div key={idx} className="text-[11px] text-slate-600 flex justify-between gap-4">
                                                <div>
                                                  <span className="font-bold text-slate-800">[{t.status}]</span> {t.message}
                                                  {t.user && <span className="text-[10px] text-slate-400"> (by {t.user})</span>}
                                                </div>
                                                <div className="text-[9px] text-slate-400 whitespace-nowrap">{t.time}</div>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      </td>
                                    </tr>
                                  )}
                                </React.Fragment>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Drawer Footer */}
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button 
                onClick={() => setSelectedRider(null)} 
                className="btn-secondary py-2 px-4 text-xs font-bold"
              >
                Close History
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};


export default AdminDispatcher;
