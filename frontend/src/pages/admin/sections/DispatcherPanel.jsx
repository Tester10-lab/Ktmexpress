import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import api from '../../../api/axios';
import MetricCard from '../../../components/MetricCard';
import { useToast } from '../../../store/ToastContext';
import ScanStation from '../../../components/ScanStation';
import Pagination from '../../../components/Pagination';
import { useTrackingDrawer } from '../../../store/TrackingDrawerContext';
import { useRiderHistory } from '../../../store/RiderHistoryContext';
import TrackingLink from '../../../components/TrackingLink';
import { getVendorDisplayName } from '../../../utils/vendor';
import OutsideValleyActionMenu from '../../../components/OutsideValleyActionMenu';
import { 
  LayoutDashboard, Wallet, Receipt, Users, Settings2, Activity, 
  Package, LayoutGrid, BarChart3, Truck, Factory, AlertTriangle, 
  MapPin, CheckCircle, XCircle, Search, RefreshCw, Plus, FileSpreadsheet,
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
    'Picked Up': 'bg-blue-100 text-blue-700 border-blue-200',
    'In Warehouse': 'bg-brand-100 text-brand-700 border-brand-200',
    'Out for Delivery': 'bg-indigo-100 text-indigo-700 border-indigo-200',
    'Dispatched': 'bg-blue-100 text-blue-700 border-blue-200',
    'Arrived': 'bg-indigo-100 text-indigo-700 border-indigo-200',
    'Sent for Delivery': 'bg-orange-100 text-orange-700 border-orange-200',
    'Postponed': 'bg-orange-100 text-orange-700 border-orange-200',
  };
  return <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${styles[status] || 'bg-slate-100 text-slate-700 border-slate-200'}`}>{status}</span>;
}

export default function DispatcherPanel() {
  const { openTracking, openShopPickups } = useTrackingDrawer();
  const { openRiderHistory } = useRiderHistory();
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

  const fetchAll = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [sRes, pRes, wRes, retRes, rRes] = await Promise.all([
        api.get('/dispatcher/dashboard'),
        api.get('/dispatcher/pickups'),
        api.get('/dispatcher/packages?status=Picked Up,In Warehouse,Dispatched,Arrived,Sent for Delivery'),
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

  const handleOutsideValleyAction = async (trackingCode, status) => {
    const pkg = warehousePackages.find(p => p.trackingCode === trackingCode);
    if (!pkg) return;
    setActionLoading(s => ({ ...s, [`o_${pkg._id}`]: true }));
    try {
      await api.put(`/packages/${trackingCode}/outside-valley-status`, { status });
      showToast(`Package marked as ${status}`, 'success');
      fetchAll(true);
    } catch (e) {
      showToast(e.response?.data?.message || 'Failed to update status', 'error');
    } finally {
      setActionLoading(s => ({ ...s, [`o_${pkg._id}`]: false }));
    }
  };

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

  const assignGroupPickup = async (vendorIdStr, packages) => {
    const riderId = assignMap[vendorIdStr];
    if (!riderId) return showToast('Select a rider first', 'warning');
    setActionLoading(s => ({ ...s, [`pg_${vendorIdStr}`]: true }));
    let successCount = 0;
    try {
      await Promise.all(packages.map(async (p) => {
        try {
          await api.put('/dispatcher/assign-pickup', { pickupId: p._id, riderId });
          successCount++;
        } catch (e) {}
      }));
      showToast(`✓ ${successCount} pickup(s) assigned for shop!`, 'success');
      fetchAll(true);
    } catch (e) { showToast('Failed to assign group', 'error'); }
    finally { setActionLoading(s => ({ ...s, [`pg_${vendorIdStr}`]: false })); }
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
  const assignedPickups = pickups.filter(p => p.status === 'assigned');

  // Group pending pickups by vendorId
  const pendingGrouped = Object.values(pendingPickups.reduce((acc, p) => {
    const vendorIdStr = p.vendorId?._id || p.vendorId || 'unknown';
    if (!acc[vendorIdStr]) {
      acc[vendorIdStr] = {
        _id: vendorIdStr,
        vendorId: p.vendorId,
        packages: [],
        oldestRequestedAt: p.requestedAt,
      };
    }
    acc[vendorIdStr].packages.push(p);
    if (new Date(p.requestedAt) < new Date(acc[vendorIdStr].oldestRequestedAt)) {
      acc[vendorIdStr].oldestRequestedAt = p.requestedAt;
    }
    return acc;
  }, {}));

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
                <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-xs">
                  <tr>
                    <th className="px-6 py-3">Shop Name</th>
                    <th className="px-6 py-3">Total Packages</th>
                    <th className="px-6 py-3">Oldest Requested At</th>
                    <th className="px-6 py-3">Assign Rider</th>
                    <th className="px-6 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {pendingGrouped.length === 0 ? <tr><td colSpan="5" className="px-6 py-12 text-center text-slate-500">No pending pickups.</td></tr>
                    : pendingGrouped.map(g => {
                      const shopName = getVendorDisplayName(g.vendorId, 'Unknown Vendor');
                      return (
                        <tr key={g._id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4">
                            <button
                              onClick={e => { e.stopPropagation(); openShopPickups(shopName, g.packages); }}
                              className="font-bold text-slate-900 hover:text-brand-600 hover:underline transition-colors text-left flex items-center gap-2"
                              title="View packages"
                            >
                              {shopName} <span className="bg-brand-100 text-brand-700 px-2 py-0.5 rounded-full text-xs">{g.packages.length}</span>
                            </button>
                          </td>
                          <td className="px-6 py-4 text-slate-700 font-medium">{g.packages.length}</td>
                          <td className="px-6 py-4 text-slate-500 max-w-[160px] truncate">{g.oldestRequestedAt ? new Date(g.oldestRequestedAt).toLocaleString('en-NP', { dateStyle: 'short', timeStyle: 'short' }) : '—'}</td>
                          <td className="px-6 py-4">
                            <select className="input-field py-1.5 text-xs w-40" value={assignMap[g._id] || ''} onChange={e => setAssignMap(m => ({ ...m, [g._id]: e.target.value }))}>
                              <option value="">Select Rider</option>
                              {riders.map(r => <option key={r._id} value={r._id}>{r.name}</option>)}
                            </select>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button className="btn-primary btn-sm px-4" onClick={() => assignGroupPickup(g._id, g.packages)} disabled={actionLoading[`pg_${g._id}`]}>
                              {actionLoading[`pg_${g._id}`] ? '...' : 'Assign'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
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
                      <th className="px-6 py-3">Shop Name</th>
                      <th className="px-6 py-3">Rider</th>
                      <th className="px-6 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {assignedPickups.map(p => (
                      <tr key={p._id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4"><TrackingLink code={p.packageId?.trackingCode} /></td>
                        <td className="px-6 py-4">
                          {p.packageId?.trackingCode ? (
                            <button
                              onClick={e => { e.stopPropagation(); openTracking(p.packageId.trackingCode); }}
                              className="font-bold text-slate-900 hover:text-brand-600 hover:underline transition-colors text-left"
                              title="View package details"
                            >
                              <span className="text-xs text-slate-500 block mb-0.5">
                                {getVendorDisplayName(p.vendorId, '—')}
                              </span>
                            </button>
                          ) : (
                            <span className="font-bold text-slate-900">{getVendorDisplayName(p.vendorId, '—')}</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {p.assignedRiderId?.name || 'Assigned'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button className="btn-sm px-4 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 font-bold flex items-center justify-end gap-1.5 ml-auto" onClick={() => confirmWarehouse(p.packageId?._id)} disabled={actionLoading[`w_${p.packageId?._id}`]}>
                            {actionLoading[`w_${p.packageId?._id}`] ? '...' : <><CheckCircle className="w-4 h-4" /> Confirm Arrival</>}
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
                    <td className="px-6 py-4 font-bold text-slate-900">{getVendorDisplayName(p.vendorId, '—')}</td>
                    <td className="px-6 py-4 font-medium text-slate-800">{p.customerName}</td>
                    <td className="px-6 py-4 text-slate-500">{p.city || p.address || '—'}</td>
                    <td className="px-6 py-4 font-bold text-slate-900">Rs. {p.amount?.toLocaleString()}</td>
                    <td className="px-6 py-4">
                      {p.outOfValley ? (
                        <span className="text-slate-400 text-xs italic">Outside Valley</span>
                      ) : p.status === 'Picked Up' ? (
                        <span className="text-amber-500 text-xs italic font-medium">Pending Arrival</span>
                      ) : (
                        <select className="input-field py-1.5 text-xs w-40" value={deliveryRiderMap[p._id] || ''} onChange={e => setDeliveryRiderMap(m => ({ ...m, [p._id]: e.target.value }))}>
                          <option value="">Select Rider</option>
                          {riders.map(r => <option key={r._id} value={r._id}>{r.name}</option>)}
                        </select>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {p.outOfValley ? (
                        <OutsideValleyActionMenu 
                          package={p} 
                          onAction={handleOutsideValleyAction} 
                          disabled={actionLoading[`o_${p._id}`]} 
                        />
                      ) : p.status === 'Picked Up' ? (
                        <button className="btn-primary btn-sm px-4 flex items-center justify-end gap-1.5 ml-auto" onClick={() => confirmWarehouse(p._id)} disabled={actionLoading[`w_${p._id}`]}>
                          {actionLoading[`w_${p._id}`] ? '...' : <><CheckCircle className="w-4 h-4" /> Confirm</>}
                        </button>
                      ) : (
                        <button className="btn-primary btn-sm px-4 flex items-center justify-end gap-1.5 ml-auto" onClick={() => assignDelivery(p._id)} disabled={actionLoading[`d_${p._id}`]}>
                          {actionLoading[`d_${p._id}`] ? '...' : <><Truck className="w-4 h-4" /> Send</>}
                        </button>
                      )}
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
                    <td className="px-6 py-4 font-bold text-slate-900">{getVendorDisplayName(p.vendorId, '—')}</td>
                    <td className="px-6 py-4 font-medium text-slate-800">{p.customerName}</td>
                    <td className="px-6 py-4">{statusBadge(p.status)}</td>
                    <td className="px-6 py-4 text-center">
                      {p.rtvSignoff?.riderReturned ? <span className="inline-flex items-center gap-1 text-emerald-600 font-bold text-xs"><CheckCircle className="w-4 h-4" /> Yes</span> : <span className="text-amber-500 font-bold text-xs">No</span>}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {p.rtvSignoff?.vendorReceived ? <span className="inline-flex items-center gap-1 text-emerald-600 font-bold text-xs"><CheckCircle className="w-4 h-4" /> Yes</span> : <span className="text-amber-500 font-bold text-xs">No</span>}
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
                        {p.rtvSignoff?.vendorReceived && <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200"><CheckCircle className="w-3.5 h-3.5 mr-1" /> Complete</span>}
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
                  <tr key={r._id} className="hover:bg-slate-50 transition-colors">
                    <td 
                      className="px-6 py-4 font-bold text-brand-600 hover:underline cursor-pointer"
                      onClick={() => openRiderHistory(r._id)}
                    >
                      {r.name}
                    </td>
                    <td className="px-6 py-4 text-slate-500">{r.email}</td>
                    <td className="px-6 py-4 font-medium text-slate-700">{r.contact || '—'}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border bg-emerald-50 text-emerald-700 border-emerald-200">Active</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
