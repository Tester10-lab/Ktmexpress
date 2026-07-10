import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import AppShell from '../../layouts/AppShell';
import MetricCard from '../../components/MetricCard';
import ScanStation from '../../components/ScanStation';
import QrScanner from '../../components/QrScanner';
import api from '../../api/axios';
import { useToast } from '../../store/ToastContext';
import useNotificationSound from '../../hooks/useNotificationSound';
import { useTrackingDrawer } from '../../store/TrackingDrawerContext';
import { useRiderHistory } from '../../store/RiderHistoryContext';
import { getVendorDisplayName } from '../../utils/vendor';
import OutsideValleyActionMenu from '../../components/OutsideValleyActionMenu';

// ─── Nav + Title Map ──────────────────────────────────────────────────────
const navLinks = [
  { name: 'Dashboard', path: '/dispatcher', exact: true, icon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg> },
  { name: 'Tasks (Pickup & Delivery)', path: '/dispatcher/tasks', icon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg> },
  { name: 'Reverse Logistics', path: '/dispatcher/reverse-logistics', icon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.5"/></svg> },
  { name: 'Active Riders', path: '/dispatcher/riders', icon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5.5 18a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z"/><path d="M18.5 18a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z"/><path d="M15 15.5l-2.5-3.5H9L6.5 15.5"/><circle cx="12" cy="7" r="2"/></svg> },
  { name: 'COD Handovers', path: '/dispatcher/handovers', icon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 1v22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg> },
];

const titleMap = {
  '/dispatcher/tasks':           'Tasks (Pickup & Delivery)',
  '/dispatcher/scan-station':    '📷 Scan Station — Warehouse Staff',
  '/dispatcher/inbound-scan':    'Inbound Scan — Warehouse',
  '/dispatcher/reverse-logistics': 'Reverse Logistics (RTV)',
  '/dispatcher/riders':          'Active Riders',
  '/dispatcher/handovers':       'COD Handovers Verification',
  '/dispatcher':                 'Warehouse Staff Dashboard',
};

// ─── Shared Helpers ───────────────────────────────────────────────────────
const STATUS_COLORS = {
  'Pending': '#f59e0b', 'Pick Up Requested': '#f59e0b', 'Picked Up': '#3b82f6',
  'In Warehouse': '#8b5cf6', 'Out for Delivery': '#06b6d4', 'Delivered': '#10b981',
  'Dispatched': '#2563eb', 'Arrived': '#4f46e5', 'Sent for Delivery': '#d97706',
  'Postponed': '#f97316', 'Cancelled': '#ef4444', 'Returned': '#ef4444',
  'Returned to Vendor': '#6b7280',
};

function StatusBadge({ status }) {
  const color = STATUS_COLORS[status] || '#6b7280';
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: color + '18', color, border: `1px solid ${color}40` }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: color }}></span>
      {status}
    </span>
  );
}

function Spinner() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 60 }}>
      <svg className="animate-spin" style={{ width: 28, height: 28, color: '#3b82f6' }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
    </div>
  );
}

function EmptyState({ message, icon }) {
  return (
    <div style={{ textAlign: 'center', padding: '60px 20px', color: '#9ca3af' }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>{icon || '📭'}</div>
      <p style={{ margin: 0, fontSize: 14 }}>{message}</p>
    </div>
  );
}

const tableStyle = { width: '100%', borderCollapse: 'collapse', fontSize: 13 };
const thStyle = { padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid #e5e7eb', background: '#f9fafb' };
const tdStyle = { padding: '11px 14px', borderBottom: '1px solid #f3f4f6', verticalAlign: 'middle' };
const cardStyle = { background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', overflow: 'hidden', marginBottom: 20 };
const cardHeaderStyle = { padding: '16px 20px', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fff' };

function ActionBtn({ onClick, children, variant = 'primary', disabled = false, size = 'sm', icon }) {
  const colors = {
    primary: { bg: '#2563eb', hover: '#1d4ed8', text: '#fff' },
    success: { bg: '#059669', hover: '#047857', text: '#fff' },
    warning: { bg: '#d97706', hover: '#b45309', text: '#fff' },
    danger: { bg: '#dc2626', hover: '#b91c1c', text: '#fff' },
    ghost: { bg: 'transparent', hover: '#f3f4f6', text: '#374151', border: '1px solid #e5e7eb' },
  };
  const c = colors[variant] || colors.primary;
  const pad = size === 'sm' ? '5px 12px' : '8px 18px';
  const [hov, setHov] = useState(false);
  return (
    <button
      className={icon ? 'btn-mobile-icon' : ''}
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{ padding: pad, fontSize: 12, fontWeight: 600, color: c.text, background: hov && !disabled ? c.hover : c.bg, border: c.border || 'none', borderRadius: 7, cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1, transition: 'background 0.15s', display: 'inline-flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap' }}
      title={typeof children === 'string' ? children : undefined}
    >
      {icon}
      <span className={icon ? 'btn-text' : ''}>{children}</span>
    </button>
  );
}

// ─── 1. Dashboard Home ────────────────────────────────────────────────────
const DispatcherHome = () => {
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scannerOpen, setScannerOpen] = useState(false);
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleScanSuccess = async (trackingCode) => {
    try {
      const res = await api.patch(`/packages/${trackingCode}/warehouse-arrival`);
      showToast(res.data.message || 'Arrival confirmed!', 'success');
      // Intentionally not closing scannerOpen to allow rapid scanning
      fetchAll();
    } catch (e) {
      showToast(e.message || 'Failed to confirm arrival', 'error');
    }
  };

  const fetchAll = useCallback(async () => {
    try {
      const [sRes, pRes] = await Promise.all([
        api.get('/dispatcher/dashboard'),
        api.get('/dispatcher/packages?status=all'),
      ]);
      setStats(sRes.data.data || {});
      setRecent((pRes.data.data || []).slice(0, 20));
    } catch { showToast('Failed to load dashboard', 'error'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 30000);
    return () => clearInterval(interval);
  }, [fetchAll]);

  if (loading) return <Spinner />;

  const s = stats || {};

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#111827', margin: 0 }}>Overview</h2>
        <ActionBtn onClick={() => setScannerOpen(true)} variant="primary" icon={<span style={{fontSize:16}}>📷</span>}>
          Scan Arrival
        </ActionBtn>
      </div>

      {scannerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md h-[90vh] sm:h-auto max-h-[800px]" onClick={e => e.stopPropagation()}>
            <QrScanner onScanSuccess={handleScanSuccess} onClose={() => setScannerOpen(false)} />
          </div>
        </div>
      )}

      {/* Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Pickups', value: s.pickupsPending || 0, color: '#f59e0b', icon: '🚚', path: '/dispatcher/tasks' },
          { label: 'In Warehouse', value: s.inWarehouse || 0, color: '#8b5cf6', icon: '🏭', path: '/dispatcher/inbound-scan' },
          { label: 'Unassigned', value: s.unassigned || 0, color: '#ef4444', icon: '⚠️', path: '/dispatcher/tasks' },
          { label: 'Out for Delivery', value: s.outForDelivery || 0, color: '#06b6d4', icon: '📦', path: '/dispatcher/tasks' },
          { label: 'Returns Pending', value: s.returnedPending || 0, color: '#6b7280', icon: '↩️', path: '/dispatcher/reverse-logistics' },
          { label: 'Active Riders', value: s.activeRiders || 0, color: '#10b981', icon: '🏍️', path: '/dispatcher/riders' },
        ].map(item => (
          <div key={item.label} onClick={() => navigate(item.path)} className="cursor-pointer hover:shadow-md transition-shadow" style={{ background: '#fff', borderRadius: 12, border: `1px solid ${item.color}25`, padding: '18px 20px', boxShadow: `0 2px 8px ${item.color}10` }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>{item.icon}</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: item.color, lineHeight: 1 }}>{item.value}</div>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{item.label}</div>
          </div>
        ))}
      </div>

      {/* Live Progress Table */}
      <div style={cardStyle}>
        <div style={cardHeaderStyle}>
          <div>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>Live Delivery Progress</h3>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: '#6b7280' }}>Last 20 packages — auto-refreshes every 30s</p>
          </div>
          <ActionBtn onClick={fetchAll} variant="ghost">↻ Refresh</ActionBtn>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={tableStyle}>
            <thead>
              <tr>
                {['Tracking Code', 'Vendor', 'Customer', 'Destination', 'Rider', 'Status', 'COD'].map(h => (
                  <th key={h} style={thStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recent.length === 0 ? (
                <tr><td colSpan="7"><EmptyState message="No packages yet." /></td></tr>
              ) : recent.map(p => (
                <tr key={p._id} style={{ transition: 'background 0.1s' }} onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'} onMouseLeave={e => e.currentTarget.style.background = ''}>
                  <td style={tdStyle}><TrackingLink code={p.trackingCode} /></td>
                  <td style={tdStyle}>{getVendorDisplayName(p.vendorId, '—')}</td>
                  <td style={tdStyle}>{p.customerName}</td>
                  <td style={{ ...tdStyle, maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#6b7280' }}>{p.city || p.address || '—'}</td>
                  <td style={tdStyle}>{p.riderId?.name || <span style={{ color: '#d1d5db', fontStyle: 'italic' }}>Unassigned</span>}</td>
                  <td style={tdStyle}><StatusBadge status={p.status} /></td>
                  <td style={{ ...tdStyle, fontWeight: 600 }}>Rs. {p.amount?.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ─── 2. Pickup Requests ───────────────────────────────────────────────────
const PickupRequests = () => {
  const { openTracking } = useTrackingDrawer();
  const [pickups, setPickups] = useState([]);
  const [riders, setRiders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [vendorSearch, setVendorSearch] = useState('');
  const [assignMap, setAssignMap] = useState({});
  const [actionLoading, setActionLoading] = useState({});
  const [selected, setSelected] = useState([]);
  const [selectedAssigned, setSelectedAssigned] = useState([]);
  const [bulkRiderId, setBulkRiderId] = useState('');
  const [bulkAssigning, setBulkAssigning] = useState(false);
  const [bulkConfirming, setBulkConfirming] = useState(false);
  const { showToast } = useToast();

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const q = new URLSearchParams();
      if (vendorSearch) q.append('vendorSearch', vendorSearch);
      
      const [pRes, rRes] = await Promise.all([
        api.get(`/dispatcher/pickups?${q.toString()}`),
        api.get('/dispatcher/riders'),
      ]);
      setPickups(pRes.data.data || []);
      setRiders(rRes.data.data || []);
    } catch { showToast('Failed to load pickup requests', 'error'); }
    finally { setLoading(false); }
  }, [vendorSearch, showToast]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData();
    }, 300);
    return () => clearTimeout(timer);
  }, [vendorSearch, fetchData]);

  const assignPickup = async (pickupId) => {
    const riderId = assignMap[pickupId];
    if (!riderId) return showToast('Please select a rider first', 'warning');
    setActionLoading(s => ({ ...s, [pickupId]: 'assigning' }));
    try {
      await api.put('/dispatcher/assign-pickup', { pickupId, riderId });
      showToast('Rider assigned for pickup!', 'success');
      fetchData(true);
    } catch (e) { showToast(e.message || 'Failed to assign', 'error'); }
    finally { setActionLoading(s => ({ ...s, [pickupId]: null })); }
  };

  const confirmWarehouse = async (packageId, pickupId) => {
    setActionLoading(s => ({ ...s, [pickupId]: 'confirming' }));
    try {
      await api.put('/dispatcher/confirm-warehouse', { packageId });
      showToast('✓ Package confirmed at warehouse!', 'success');
      fetchData(true);
    } catch (e) { showToast(e.message || 'Failed', 'error'); }
    finally { setActionLoading(s => ({ ...s, [pickupId]: null })); }
  };

  const handleSelectAll = (e, items, setter) => setter(e.target.checked ? items.map(p => p._id) : []);
  const handleSelect = (id, setter) => setter(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);

  const bulkAssign = async () => {
    if (!selected.length || !bulkRiderId) return showToast('Select pickups and a rider first', 'warning');
    setBulkAssigning(true);
    let successCount = 0;
    try {
      await Promise.all(selected.map(async (pickupId) => {
        try {
          await api.put('/dispatcher/assign-pickup', { pickupId, riderId: bulkRiderId });
          successCount++;
        } catch (e) {}
      }));
      showToast(`✓ ${successCount} pickup(s) assigned!`, 'success');
      setSelected([]);
      setBulkRiderId('');
      fetchData(true);
    } catch (e) { showToast('Bulk assign failed', 'error'); }
    finally { setBulkAssigning(false); }
  };

  const bulkConfirmWarehouse = async () => {
    if (!selectedAssigned.length) return showToast('Select pickups first', 'warning');
    setBulkConfirming(true);
    let successCount = 0;
    try {
      await Promise.all(selectedAssigned.map(async (pickupId) => {
        const p = assigned.find(x => x._id === pickupId);
        if (p?.packageId?._id) {
          try {
            await api.put('/dispatcher/confirm-warehouse', { packageId: p.packageId._id });
            successCount++;
          } catch (e) {}
        }
      }));
      showToast(`✓ ${successCount} package(s) confirmed at warehouse!`, 'success');
      setSelectedAssigned([]);
      fetchData(true);
    } catch (e) { showToast('Bulk confirm failed', 'error'); }
    finally { setBulkConfirming(false); }
  };

  const pending = pickups.filter(p => p.status === 'pending');
  const assigned = pickups.filter(p => p.status === 'assigned');

  // Group pending pickups by vendorId
  const groupPickupsByVendor = (pickups) => {
    const grouped = {};
    pickups.forEach(p => {
      const vendorIdStr = p.vendorId?._id || p.vendorId || 'unknown';
      if (!grouped[vendorIdStr]) {
        grouped[vendorIdStr] = {
          _id: vendorIdStr,
          vendorId: p.vendorId,
          packages: [],
          oldestRequestedAt: p.requestedAt,
        };
      }
      grouped[vendorIdStr].packages.push(p);
      if (new Date(p.requestedAt) < new Date(grouped[vendorIdStr].oldestRequestedAt)) {
        grouped[vendorIdStr].oldestRequestedAt = p.requestedAt;
      }
    });
    return Object.values(grouped);
  };

  const pendingGrouped = groupPickupsByVendor(pending);

  const assignGroupPickup = async (vendorIdStr) => {
    const riderId = assignMap[vendorIdStr];
    if (!riderId) return showToast('Please select a rider first', 'warning');
    const group = pendingGrouped.find(g => g._id === vendorIdStr);
    if (!group) return;
    
    setActionLoading(s => ({ ...s, [vendorIdStr]: 'assigning' }));
    let successCount = 0;
    try {
      await Promise.all(group.packages.map(async (p) => {
        try {
          await api.put('/dispatcher/assign-pickup', { pickupId: p._id, riderId });
          successCount++;
        } catch (e) {}
      }));
      showToast(`✓ ${successCount} pickup(s) assigned for shop!`, 'success');
      fetchData(true);
    } catch (e) {
      showToast('Failed to assign group', 'error');
    } finally {
      setActionLoading(s => ({ ...s, [vendorIdStr]: null }));
    }
  };

  const { openShopPickups } = useTrackingDrawer();

  const GroupedPendingTable = ({ items, title, color, showCheckboxes = false, selectedIds = [], onSelectAll, onSelect }) => (
    <div style={cardStyle}>
      <div style={cardHeaderStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: color, boxShadow: `0 0 8px ${color}` }}></span>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>{title}</h3>
          <span style={{ background: color + '20', color, borderRadius: 20, padding: '2px 10px', fontSize: 12, fontWeight: 700 }}>{items.length} Shops</span>
        </div>
        <ActionBtn onClick={() => fetchData()} variant="ghost">↻ Refresh</ActionBtn>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={tableStyle}>
          <thead>
            <tr>
              {showCheckboxes && (
                <th style={{ ...thStyle, width: 44 }}>
                  <input type="checkbox" onChange={e => onSelectAll(e, items.flatMap(g => g.packages))} checked={items.length > 0 && items.flatMap(g => g.packages).every(p => selectedIds.includes(p._id))} />
                </th>
              )}
              {['Shop Name', 'Total Packages', 'Oldest Requested At', 'Assign Rider', 'Action'].map(h => <th key={h} style={thStyle}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan="6"><Spinner /></td></tr>
              : items.length === 0 ? <tr><td colSpan="6"><EmptyState message={vendorSearch ? "No shops found matching your search." : `No ${title.toLowerCase()}.`} /></td></tr>
              : items.map(g => {
                const aLoading = actionLoading[g._id];
                const allSelected = g.packages.every(p => selectedIds.includes(p._id));
                const shopName = getVendorDisplayName(g.vendorId, 'Unknown Vendor');
                return (
                  <tr 
                    key={g._id} 
                    style={{ cursor: showCheckboxes ? 'pointer' : 'default', background: allSelected ? '#eff6ff' : '' }} 
                    onClick={() => showCheckboxes && g.packages.forEach(p => onSelect(p._id))} 
                    onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'} 
                    onMouseLeave={e => e.currentTarget.style.background = allSelected ? '#eff6ff' : ''}
                  >
                    {showCheckboxes && (
                      <td style={tdStyle} onClick={e => e.stopPropagation()}>
                        <input type="checkbox" checked={allSelected} onChange={() => g.packages.forEach(p => onSelect(p._id))} />
                      </td>
                    )}
                    <td style={tdStyle}>
                      <button
                        onClick={e => { e.stopPropagation(); openShopPickups(shopName, g.packages); }}
                        style={{
                          background: 'none',
                          border: 'none',
                          padding: 0,
                          cursor: 'pointer',
                          fontWeight: 600,
                          color: '#1e3a8a',
                          textAlign: 'left',
                          textDecoration: 'underline',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6
                        }}
                        title="View packages"
                      >
                        {shopName} <span style={{ background: '#dbeafe', color: '#1e40af', padding: '2px 6px', borderRadius: 10, fontSize: 11 }}>{g.packages.length}</span>
                      </button>
                    </td>
                    <td style={tdStyle}>{g.packages.length}</td>
                    <td style={{ ...tdStyle, color: '#6b7280', fontSize: 12 }}>{g.oldestRequestedAt ? new Date(g.oldestRequestedAt).toLocaleString('en-NP', { dateStyle: 'short', timeStyle: 'short' }) : '—'}</td>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <select
                          value={assignMap[g._id] || ''}
                          onChange={e => setAssignMap(m => ({ ...m, [g._id]: e.target.value }))}
                          style={{ fontSize: 12, border: '1px solid #e5e7eb', borderRadius: 6, padding: '4px 8px', minWidth: 130 }}
                          onClick={e => e.stopPropagation()}
                        >
                          <option value="">Select Rider</option>
                          {riders.map(r => <option key={r._id} value={r._id}>{r.name}</option>)}
                        </select>
                        <ActionBtn 
                          onClick={(e) => { e.stopPropagation(); assignGroupPickup(g._id); }} 
                          disabled={aLoading === 'assigning'} 
                          variant="primary"
                          icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5.5"/><polyline points="8 11 3 16 8 21"/><circle cx="16.5" cy="7.5" r="3.5"/></svg>}
                        >
                          {aLoading === 'assigning' ? '...' : 'Assign'}
                        </ActionBtn>
                      </div>
                    </td>
                    <td style={tdStyle}>
                      —
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    </div>
  );

  const PickupTable = ({ items, title, color, showCheckboxes = false, selectedIds = [], onSelectAll, onSelect }) => (
    <div style={cardStyle}>
      <div style={cardHeaderStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: color, boxShadow: `0 0 8px ${color}` }}></span>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>{title}</h3>
          <span style={{ background: color + '20', color, borderRadius: 20, padding: '2px 10px', fontSize: 12, fontWeight: 700 }}>{items.length}</span>
        </div>
        <ActionBtn onClick={() => fetchData()} variant="ghost">↻ Refresh</ActionBtn>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={tableStyle}>
          <thead>
            <tr>
              {showCheckboxes && (
                <th style={{ ...thStyle, width: 44 }}>
                  <input type="checkbox" onChange={e => onSelectAll(e, items)} checked={items.length > 0 && items.every(i => selectedIds.includes(i._id))} />
                </th>
              )}
              {['Tracking', 'Shop Name', 'Customer', 'Address', 'Requested', 'Assigned Rider', 'Action'].map(h => <th key={h} style={thStyle}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan="7"><Spinner /></td></tr>
              : items.length === 0 ? <tr><td colSpan="7"><EmptyState message={vendorSearch ? "No packages found." : `No ${title.toLowerCase()}.`} /></td></tr>
              : items.map(p => {
                const isAssigned = p.status === 'assigned';
                const aLoading = actionLoading[p._id];
                return (
                  <tr 
                    key={p._id} 
                    style={{ cursor: showCheckboxes ? 'pointer' : 'default', background: selectedIds.includes(p._id) ? '#eff6ff' : '' }} 
                    onClick={() => showCheckboxes && onSelect(p._id)} 
                    onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'} 
                    onMouseLeave={e => e.currentTarget.style.background = selectedIds.includes(p._id) ? '#eff6ff' : ''}
                  >
                    {showCheckboxes && (
                      <td style={tdStyle} onClick={e => e.stopPropagation()}>
                        <input type="checkbox" checked={selectedIds.includes(p._id)} onChange={() => onSelect(p._id)} />
                      </td>
                    )}
                    <td style={tdStyle}><TrackingLink code={p.packageId?.trackingCode} /></td>
                    <td style={tdStyle}>
                      {p.packageId?.trackingCode ? (
                        <button
                          onClick={e => { e.stopPropagation(); openTracking(p.packageId.trackingCode); }}
                          style={{
                            background: 'none',
                            border: 'none',
                            padding: 0,
                            cursor: 'pointer',
                            fontWeight: 600,
                            color: '#1e3a8a',
                            textAlign: 'left',
                            textDecoration: 'underline'
                          }}
                          title="View package details"
                        >
                          {getVendorDisplayName(p.vendorId, '—')}
                        </button>
                      ) : (
                        <div style={{ fontWeight: 600 }}>{getVendorDisplayName(p.vendorId, '—')}</div>
                      )}
                    </td>
                    <td style={tdStyle}>{p.packageId?.customerName || '—'}</td>
                    <td style={{ ...tdStyle, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#6b7280', fontSize: 12 }}>{p.packageId?.address || '—'}</td>
                    <td style={{ ...tdStyle, color: '#6b7280', fontSize: 12 }}>{p.requestedAt ? new Date(p.requestedAt).toLocaleString('en-NP', { dateStyle: 'short', timeStyle: 'short' }) : '—'}</td>
                    <td style={tdStyle}>
                      {isAssigned ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#059669', fontWeight: 600, fontSize: 12 }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                          {p.assignedRiderId?.name || 'Assigned'}
                        </span>
                      ) : (
                        <div style={{ display: 'flex', gap: 6 }}>
                          <select
                            value={assignMap[p._id] || ''}
                            onChange={e => setAssignMap(m => ({ ...m, [p._id]: e.target.value }))}
                            style={{ fontSize: 12, border: '1px solid #e5e7eb', borderRadius: 6, padding: '4px 8px', minWidth: 130 }}
                          >
                            <option value="">Select Rider</option>
                            {riders.map(r => <option key={r._id} value={r._id}>{r.name}</option>)}
                          </select>
                          <ActionBtn 
                            onClick={() => assignPickup(p._id)} 
                            disabled={aLoading === 'assigning'} 
                            variant="primary"
                            icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5.5"/><polyline points="8 11 3 16 8 21"/><circle cx="16.5" cy="7.5" r="3.5"/></svg>}
                          >
                            {aLoading === 'assigning' ? '...' : 'Assign'}
                          </ActionBtn>
                        </div>
                      )}
                    </td>
                    <td style={tdStyle}>
                      {isAssigned && (
                        <ActionBtn onClick={() => confirmWarehouse(p.packageId?._id, p._id)} disabled={aLoading === 'confirming'} variant="success">
                          {aLoading === 'confirming' ? '...' : '✓ Arrived at Warehouse'}
                        </ActionBtn>
                      )}
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    </div>
  );

  const selectedRider = riders.find(r => r._id === bulkRiderId);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#111827', margin: 0 }}>Pickup Requests</h2>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6b7280' }}>Assign riders to pickup from vendors</p>
        </div>
        <div style={{ position: 'relative', display: 'flex', gap: '8px' }}>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              placeholder="Search by Shop Name, Vendor Name, or Email..."
              value={vendorSearch}
              onChange={e => setVendorSearch(e.target.value)}
              style={{ width: '300px', border: '1px solid #e5e7eb', borderRadius: 8, padding: '8px 30px 8px 14px', fontSize: 13, outline: 'none' }}
            />
            {vendorSearch && (
              <button 
                onClick={() => setVendorSearch('')}
                style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontWeight: 'bold' }}
              >×</button>
            )}
          </div>
          <ActionBtn onClick={() => fetchData()} variant="ghost">↻ Refresh</ActionBtn>
        </div>
      </div>

      {/* Bulk Assign Toolbar for Pending Requests */}
      <div style={{ ...cardStyle, padding: '16px 20px', display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', marginBottom: 20 }}>
        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, flex: 1 }}>Bulk Assign Pickups</h3>
        <select
          value={bulkRiderId}
          onChange={e => setBulkRiderId(e.target.value)}
          style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: '8px 14px', fontSize: 13, outline: 'none', minWidth: 180 }}
        >
          <option value="">— Select Rider —</option>
          {riders.map(r => <option key={r._id} value={r._id}>{r.name}{r.contact ? ` (${r.contact})` : ''}</option>)}
        </select>
        <ActionBtn
          onClick={bulkAssign}
          disabled={!selected.length || !bulkRiderId || bulkAssigning}
          variant="primary"
          size="md"
        >
          {bulkAssigning ? 'Assigning...' : `🚀 Assign ${selected.length > 0 ? `${selected.length} ` : ''}Selected`}
        </ActionBtn>
      </div>

      {selected.length > 0 && (
        <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 10, padding: '10px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#1d4ed8' }}>
            {selected.length} pickup(s) selected
            {selectedRider ? ` → Assigning to ${selectedRider.name}` : ' — pick a rider'}
          </span>
          <button onClick={() => setSelected([])} style={{ fontSize: 12, color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer' }}>Clear</button>
        </div>
      )}

      {selectedAssigned.length > 0 && (
        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '10px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#059669' }}>
            {selectedAssigned.length} assigned pickup(s) selected
          </span>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <ActionBtn onClick={bulkConfirmWarehouse} disabled={bulkConfirming} variant="success">
              {bulkConfirming ? 'Confirming...' : '✓ Confirm Arrival at Warehouse'}
            </ActionBtn>
            <button onClick={() => setSelectedAssigned([])} style={{ fontSize: 12, color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer' }}>Clear</button>
          </div>
        </div>
      )}
      <div style={{ display: 'grid', gap: 30 }}>
        <GroupedPendingTable
          title="Pending Pickup Requests"
          color="#f59e0b"
          items={pendingGrouped}
          showCheckboxes
          selectedIds={selected}
          onSelectAll={handleSelectAll}
          onSelect={(id) => handleSelect(id, setSelected)}
        />
        
        <PickupTable
          items={assigned}
          title="Assigned — Awaiting Warehouse Confirmation" 
          color="#3b82f6" 
          showCheckboxes={true} 
          selectedIds={selectedAssigned} 
          onSelectAll={(e, items) => handleSelectAll(e, items, setSelectedAssigned)} 
          onSelect={(id) => handleSelect(id, setSelectedAssigned)} 
        />
      </div>
    </div>
  );
};

// ─── 3. Inbound Scan / Warehouse (Grouped by Vendor) ─────────────────────
const InboundScan = () => {
  const [packages, setPackages] = useState([]);
  const [riders, setRiders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState({});
  const [actionLoading, setActionLoading] = useState({});
  const [search, setSearch] = useState('');
  const [vendorSearch, setVendorSearch] = useState('');
  const [selected, setSelected] = useState([]);
  const [bulkConfirming, setBulkConfirming] = useState(false);
  const [bulkAssigning, setBulkAssigning] = useState(false);
  const [riderId, setRiderId] = useState('');
  const { showToast } = useToast();

  const handleOutsideValleyAction = async (trackingCode, status) => {
    const pkg = packages.find(p => p.trackingCode === trackingCode);
    if (!pkg) return;
    setActionLoading(s => ({ ...s, [pkg._id]: true }));
    try {
      await api.put(`/packages/${trackingCode}/outside-valley-status`, { status });
      showToast(`Package marked as ${status}`, 'success');
      fetchData(true);
    } catch (e) {
      showToast(e.response?.data?.message || 'Failed to update status', 'error');
    } finally {
      setActionLoading(s => ({ ...s, [pkg._id]: false }));
    }
  };

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const q = new URLSearchParams({ status: 'Pick Up Requested,Picked Up,In Warehouse,Dispatched,Arrived,Sent for Delivery' });
      if (vendorSearch) q.append('vendorSearch', vendorSearch);
      
      const [pRes, rRes] = await Promise.all([
        api.get(`/dispatcher/packages?${q.toString()}`),
        api.get('/dispatcher/riders')
      ]);
      setPackages(pRes.data.data || []);
      setRiders(rRes.data.data || []);
    } catch { showToast('Failed to load packages', 'error'); }
    finally { setLoading(false); }
  }, [vendorSearch, showToast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData();
    }, 300);
    return () => clearTimeout(timer);
  }, [vendorSearch, fetchData]);

  const confirmArrival = async (packageId) => {
    setActionLoading(s => ({ ...s, [packageId]: true }));
    try {
      await api.put('/dispatcher/confirm-warehouse', { packageId });
      showToast('✓ Package confirmed at warehouse!', 'success');
      fetchData(true);
    } catch (e) { showToast(e.message || 'Failed', 'error'); }
    finally { setActionLoading(s => ({ ...s, [packageId]: false })); }
  };

  // Filter and group by vendor
  const filtered = packages.filter(p =>
    !search || p.trackingCode.toLowerCase().includes(search.toLowerCase()) || p.customerName.toLowerCase().includes(search.toLowerCase())
  );

  const grouped = filtered.reduce((acc, pkg) => {
    const vid = pkg.vendorId?._id || 'unknown';
    if (!acc[vid]) acc[vid] = { vendor: pkg.vendorId, packages: [] };
    acc[vid].packages.push(pkg);
    return acc;
  }, {});

  const toggleGroup = (vid) => setCollapsed(s => ({ ...s, [vid]: !s[vid] }));

  const handleSelectAll = (e) => setSelected(e.target.checked ? filtered.map(p => p._id) : []);
  const handleSelect = (id) => setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);

  const bulkConfirmArrival = async () => {
    const toConfirm = selected.filter(id => packages.find(p => p._id === id)?.status !== 'In Warehouse');
    if (!toConfirm.length) return showToast('No packages to confirm', 'warning');
    setBulkConfirming(true);
    let count = 0;
    try {
      await Promise.all(toConfirm.map(async (packageId) => {
        try {
          await api.put('/dispatcher/confirm-warehouse', { packageId });
          count++;
        } catch(e) {}
      }));
      showToast(`✓ ${count} package(s) confirmed!`, 'success');
      setSelected([]);
      fetchData(true);
    } catch { showToast('Bulk confirm failed', 'error'); }
    finally { setBulkConfirming(false); }
  };

  const bulkSendForDelivery = async () => {
    const toSend = selected.filter(id => packages.find(p => p._id === id)?.status === 'In Warehouse');
    if (!toSend.length) return showToast('No warehouse packages selected', 'warning');
    if (!riderId) return showToast('Select a rider first', 'warning');
    setBulkAssigning(true);
    try {
      const res = await api.put('/dispatcher/bulk-assign', { packageIds: toSend, riderId });
      showToast(`✓ ${res.data.data?.count || toSend.length} package(s) sent for delivery!`, 'success');
      setSelected([]);
      setRiderId('');
      fetchData(true);
    } catch { showToast('Bulk send failed', 'error'); }
    finally { setBulkAssigning(false); }
  };

  const selectedPackages = filtered.filter(p => selected.includes(p._id));
  const hasUnconfirmed = selectedPackages.some(p => p.status !== 'In Warehouse');
  const hasInWarehouse = selectedPackages.some(p => p.status === 'In Warehouse');

  return (
    <div>
      {/* Search + Stats Bar */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 20, flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Search tracking or customer..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ flex: '1 1 240px', border: '1px solid #e5e7eb', borderRadius: 8, padding: '8px 14px', fontSize: 13, outline: 'none' }}
        />
        <div style={{ position: 'relative', flex: '1 1 240px' }}>
          <input
            type="text"
            placeholder="Search by Shop Name, Vendor Name, or Email..."
            value={vendorSearch}
            onChange={e => setVendorSearch(e.target.value)}
            style={{ width: '100%', border: '1px solid #e5e7eb', borderRadius: 8, padding: '8px 30px 8px 14px', fontSize: 13, outline: 'none' }}
          />
          {vendorSearch && (
            <button 
              onClick={() => setVendorSearch('')}
              style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontWeight: 'bold' }}
            >×</button>
          )}
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {[
            { label: 'Pick Up Requested', color: '#f59e0b', count: packages.filter(p => p.status === 'Pick Up Requested').length },
            { label: 'Picked Up', color: '#3b82f6', count: packages.filter(p => p.status === 'Picked Up').length },
            { label: 'In Warehouse', color: '#8b5cf6', count: packages.filter(p => ['In Warehouse', 'Dispatched', 'Arrived', 'Sent for Delivery'].includes(p.status)).length },
          ].map(s => (
            <span key={s.label} style={{ padding: '5px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: s.color + '18', color: s.color, border: `1px solid ${s.color}30` }}>
              {s.label}: {s.count}
            </span>
          ))}
        </div>
        <ActionBtn onClick={fetchData} variant="ghost">↻ Refresh</ActionBtn>
      </div>

      {selected.length > 0 && (
        <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 10, padding: '10px 16px', marginBottom: 16, display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#1d4ed8' }}>
            {selected.length} package(s) selected
          </span>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            {hasUnconfirmed && (
              <ActionBtn onClick={bulkConfirmArrival} disabled={bulkConfirming} variant="success" size="sm">
                {bulkConfirming ? '...' : '✓ Confirm Arrival at Warehouse'}
              </ActionBtn>
            )}
            {hasInWarehouse && (
              <>
                <select
                  value={riderId}
                  onChange={e => setRiderId(e.target.value)}
                  style={{ border: '1px solid #bfdbfe', borderRadius: 6, padding: '6px 10px', fontSize: 12, outline: 'none' }}
                >
                  <option value="">— Select Rider —</option>
                  {riders.map(r => <option key={r._id} value={r._id}>{r.name}</option>)}
                </select>
                <ActionBtn onClick={bulkSendForDelivery} disabled={bulkAssigning || !riderId} variant="primary" size="sm">
                  {bulkAssigning ? '...' : '🚀 Send for Delivery'}
                </ActionBtn>
              </>
            )}
            <button onClick={() => setSelected([])} style={{ fontSize: 12, color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer' }}>Clear</button>
          </div>
        </div>
      )}

      {loading ? <Spinner /> : filtered.length === 0 ? (
        <EmptyState message="No incoming packages found." icon="🏭" />
      ) : (
        <div style={cardStyle}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>Inbound Packages ({filtered.length})</h3>
            <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700, background: '#eff6ff', color: '#1d4ed8' }}>
              {filtered.length} total
            </span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={{ ...thStyle, width: 44 }}>
                    <input type="checkbox" onChange={handleSelectAll} checked={filtered.length > 0 && selected.length === filtered.length} />
                  </th>
                  {['Tracking', 'Vendor', 'Customer', 'Address', 'Weight', 'COD', 'Status', 'Action'].map(h => <th key={h} style={thStyle}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => (
                  <tr key={p._id} style={{ cursor: 'pointer', background: selected.includes(p._id) ? '#eff6ff' : '' }} onClick={() => handleSelect(p._id)} onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'} onMouseLeave={e => e.currentTarget.style.background = selected.includes(p._id) ? '#eff6ff' : ''}>
                    <td style={tdStyle} onClick={e => e.stopPropagation()}>
                      <input type="checkbox" checked={selected.includes(p._id)} onChange={() => handleSelect(p._id)} />
                    </td>
                    <td style={tdStyle}><TrackingLink code={p.trackingCode} /></td>
                    <td style={{ ...tdStyle, fontWeight: 600 }}>{getVendorDisplayName(p.vendorId, 'Unknown')}</td>
                    <td style={tdStyle}>{p.customerName}</td>
                    <td style={{ ...tdStyle, maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#6b7280', fontSize: 12 }}>{p.city ? `${p.city}, ` : ''}{p.address}</td>
                    <td style={tdStyle}>{p.weight} kg</td>
                    <td style={{ ...tdStyle, fontWeight: 600 }}>Rs. {p.amount?.toLocaleString()}</td>
                    <td style={tdStyle}><StatusBadge status={p.status} /></td>
                    <td style={tdStyle} onClick={e => e.stopPropagation()}>
                      {p.outOfValley ? (
                        <OutsideValleyActionMenu 
                          package={p} 
                          onAction={handleOutsideValleyAction} 
                          disabled={actionLoading[p._id]} 
                        />
                      ) : p.status !== 'In Warehouse' ? (
                        <ActionBtn onClick={() => confirmArrival(p._id)} disabled={actionLoading[p._id]} variant="primary" size="sm">
                          {actionLoading[p._id] ? '...' : '✓ Confirm Arrival'}
                        </ActionBtn>
                      ) : (
                        <span style={{ color: '#10b981', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                          In Warehouse
                        </span>
                      )}
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
};

// ─── 4. Routing & Bulk Assign ─────────────────────────────────────────────
const Routing = () => {
  const [packages, setPackages] = useState([]);
  const [riders, setRiders] = useState([]);
  const [selected, setSelected] = useState([]);
  const [riderId, setRiderId] = useState('');
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [search, setSearch] = useState('');
  const [vendorSearch, setVendorSearch] = useState('');
  const { showToast } = useToast();

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const q = new URLSearchParams({ status: 'In Warehouse,Out for Delivery,Postponed' });
      if (vendorSearch) q.append('vendorSearch', vendorSearch);
      
      const [pRes, rRes] = await Promise.all([
        api.get(`/dispatcher/packages?${q.toString()}`),
        api.get('/dispatcher/riders'),
      ]);
      setPackages(pRes.data.data || []);
      setRiders(rRes.data.data || []);
    } catch { showToast('Failed to load', 'error'); }
    finally { setLoading(false); }
  }, [vendorSearch, showToast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData();
    }, 300);
    return () => clearTimeout(timer);
  }, [vendorSearch, fetchData]);

  const filtered = packages.filter(p =>
    !search || p.trackingCode.toLowerCase().includes(search.toLowerCase()) || p.customerName.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelectAll = e => setSelected(e.target.checked ? filtered.map(p => p._id) : []);
  const handleSelect = id => setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);

  const bulkAssign = async () => {
    if (!selected.length || !riderId) return showToast('Select packages and a rider first', 'warning');
    setAssigning(true);
    try {
      const res = await api.put('/dispatcher/bulk-assign', { packageIds: selected, riderId });
      const count = res.data.data?.count || selected.length;
      showToast(`✓ ${count} package(s) assigned for delivery!`, 'success');
      setSelected([]);
      setRiderId('');
      fetchData(true);
    } catch (e) { showToast(e.message || 'Failed', 'error'); }
    finally { setAssigning(false); }
  };

  const selectedRider = riders.find(r => r._id === riderId);

  return (
    <div>
      {/* Toolbar */}
      <div style={{ ...cardStyle, padding: '16px 20px', display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', marginBottom: 20 }}>
        <input
          type="text"
          placeholder="Search tracking or customer..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ flex: '1 1 200px', border: '1px solid #e5e7eb', borderRadius: 8, padding: '8px 14px', fontSize: 13, outline: 'none' }}
        />
        <div style={{ position: 'relative', flex: '1 1 240px' }}>
          <input
            type="text"
            placeholder="Search by Shop Name, Vendor Name, or Email..."
            value={vendorSearch}
            onChange={e => setVendorSearch(e.target.value)}
            style={{ width: '100%', border: '1px solid #e5e7eb', borderRadius: 8, padding: '8px 30px 8px 14px', fontSize: 13, outline: 'none' }}
          />
          {vendorSearch && (
            <button 
              onClick={() => setVendorSearch('')}
              style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontWeight: 'bold' }}
            >×</button>
          )}
        </div>
        <select
          value={riderId}
          onChange={e => setRiderId(e.target.value)}
          style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: '8px 14px', fontSize: 13, outline: 'none', minWidth: 180 }}
        >
          <option value="">— Select Rider —</option>
          {riders.map(r => <option key={r._id} value={r._id}>{r.name}{r.contact ? ` (${r.contact})` : ''}</option>)}
        </select>
        <ActionBtn
          onClick={bulkAssign}
          disabled={!selected.length || !riderId || assigning}
          variant="primary"
          size="md"
        >
          {assigning ? 'Assigning...' : `🚀 Assign ${selected.length > 0 ? `${selected.length} ` : ''}Selected`}
        </ActionBtn>
        <ActionBtn onClick={fetchData} variant="ghost">↻ Refresh</ActionBtn>
      </div>

      {/* Selection Info */}
      {selected.length > 0 && (
        <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 10, padding: '10px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#1d4ed8' }}>
            {selected.length} package(s) selected
            {selectedRider ? ` → Assigning to ${selectedRider.name}` : ' — pick a rider'}
          </span>
          <button onClick={() => setSelected([])} style={{ fontSize: 12, color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer' }}>Clear</button>
        </div>
      )}

      <div style={cardStyle}>
        <div style={{ overflowX: 'auto' }}>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={{ ...thStyle, width: 44 }}>
                  <input type="checkbox" onChange={handleSelectAll} checked={filtered.length > 0 && selected.length === filtered.length} />
                </th>
                {['Tracking', 'Vendor', 'Customer', 'Destination', 'Weight', 'COD (Rs.)', 'Status', 'Current Rider'].map(h => <th key={h} style={thStyle}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan="8"><Spinner /></td></tr>
                : filtered.length === 0 ? <tr><td colSpan="8"><EmptyState message={vendorSearch ? "No packages found for this vendor." : "No packages ready for routing."} /></td></tr>
                : filtered.map(p => (
                  <tr key={p._id} style={{ cursor: 'pointer' }} onClick={() => handleSelect(p._id)} onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'} onMouseLeave={e => e.currentTarget.style.background = selected.includes(p._id) ? '#eff6ff' : ''}>
                    <td style={tdStyle} onClick={e => e.stopPropagation()}>
                      <input type="checkbox" checked={selected.includes(p._id)} onChange={() => handleSelect(p._id)} />
                    </td>
                    <td style={tdStyle}><TrackingLink code={p.trackingCode} /></td>
                    <td style={{ ...tdStyle, fontWeight: 600 }}>{getVendorDisplayName(p.vendorId, '—')}</td>
                    <td style={tdStyle}>{p.customerName}</td>
                    <td style={{ ...tdStyle, maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#6b7280', fontSize: 12 }}>{p.city || p.address || '—'}</td>
                    <td style={tdStyle}>{p.weight} kg</td>
                    <td style={{ ...tdStyle, fontWeight: 600 }}>{p.amount?.toLocaleString()}</td>
                    <td style={tdStyle}><StatusBadge status={p.status} /></td>
                    <td style={tdStyle}>{p.riderId?.name || <span style={{ color: '#d1d5db', fontStyle: 'italic', fontSize: 12 }}>None</span>}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ─── 5. Reverse Logistics (RTV) ───────────────────────────────────────────
const ReverseLogistics = () => {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [vendorSearch, setVendorSearch] = useState('');
  const { showToast } = useToast();

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const q = new URLSearchParams({ status: 'Returned,Returned to Vendor' });
      if (vendorSearch) q.append('vendorSearch', vendorSearch);
      
      const r = await api.get(`/dispatcher/packages?${q.toString()}`);
      setPackages(r.data.data || []);
    } catch { showToast('Failed to load returns', 'error'); }
    finally { setLoading(false); }
  }, [vendorSearch, showToast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData();
    }, 300);
    return () => clearTimeout(timer);
  }, [vendorSearch, fetchData]);

  const confirmStep = async (packageId, type) => {
    setActionLoading(s => ({ ...s, [packageId]: type }));
    try {
      await api.put('/dispatcher/confirm-return', { packageId, type });
      showToast(`✓ ${type === 'rider' ? 'Rider return' : 'Vendor receipt'} confirmed!`, 'success');
      fetchData(true);
    } catch (e) { showToast(e.message || 'Failed', 'error'); }
    finally { setActionLoading(s => ({ ...s, [packageId]: null })); }
  };

  const filtered = packages.filter(p => {
    if (filter === 'pending_rider' && p.rtvSignoff?.riderReturned) return false;
    if (filter === 'pending_vendor' && (!p.rtvSignoff?.riderReturned || p.rtvSignoff?.vendorReceived)) return false;
    if (filter === 'complete' && (!p.rtvSignoff?.riderReturned || !p.rtvSignoff?.vendorReceived)) return false;
    
    if (search && !p.trackingCode.toLowerCase().includes(search.toLowerCase()) && !p.customerName.toLowerCase().includes(search.toLowerCase())) return false;
    
    return true;
  });

  const stats = {
    pendingRider: packages.filter(p => !p.rtvSignoff?.riderReturned).length,
    pendingVendor: packages.filter(p => p.rtvSignoff?.riderReturned && !p.rtvSignoff?.vendorReceived).length,
    complete: packages.filter(p => p.rtvSignoff?.riderReturned && p.rtvSignoff?.vendorReceived).length,
  };

  return (
    <div>
      {/* Search Bar */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12, flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Search tracking or customer..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ flex: '1 1 240px', border: '1px solid #e5e7eb', borderRadius: 8, padding: '8px 14px', fontSize: 13, outline: 'none' }}
        />
        <div style={{ position: 'relative', flex: '1 1 240px' }}>
          <input
            type="text"
            placeholder="Search by Shop Name, Vendor Name, or Email..."
            value={vendorSearch}
            onChange={e => setVendorSearch(e.target.value)}
            style={{ width: '100%', border: '1px solid #e5e7eb', borderRadius: 8, padding: '8px 30px 8px 14px', fontSize: 13, outline: 'none' }}
          />
          {vendorSearch && (
            <button 
              onClick={() => setVendorSearch('')}
              style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontWeight: 'bold' }}
            >×</button>
          )}
        </div>
      </div>
      {/* Stats + Filter Bar */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        {[
          { key: 'all', label: 'All Returns', count: packages.length, color: '#6b7280' },
          { key: 'pending_rider', label: 'Rider Pending', count: stats.pendingRider, color: '#f59e0b' },
          { key: 'pending_vendor', label: 'Vendor Pending', count: stats.pendingVendor, color: '#3b82f6' },
          { key: 'complete', label: 'Complete', count: stats.complete, color: '#10b981' },
        ].map(s => (
          <button key={s.key} onClick={() => setFilter(s.key)} style={{ padding: '7px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s', background: filter === s.key ? s.color : 'white', color: filter === s.key ? 'white' : s.color, border: `2px solid ${s.color}`, display: 'flex', alignItems: 'center', gap: 6 }}>
            {s.label} <span style={{ background: filter === s.key ? 'rgba(255,255,255,0.3)' : s.color + '20', padding: '1px 7px', borderRadius: 10 }}>{s.count}</span>
          </button>
        ))}
        <div style={{ marginLeft: 'auto' }}>
          <ActionBtn onClick={() => fetchData()} variant="ghost">↻ Refresh</ActionBtn>
        </div>
      </div>

      <div style={cardStyle}>
        {/* Two-step signoff guide */}
        <div style={{ padding: '12px 20px', background: '#fef3c7', borderBottom: '1px solid #fde68a', display: 'flex', alignItems: 'center', gap: 10, fontSize: 12, color: '#92400e' }}>
          <span>⚡</span>
          <span><strong>Two-Step Signoff:</strong> Step 1 — Confirm physical return from rider. Step 2 — Confirm vendor has received the package. Both steps required to complete RTV.</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={tableStyle}>
            <thead>
              <tr>
                {['Tracking', 'Vendor', 'Customer', 'Rider', 'Return Status', 'RTV Signoff', 'Actions'].map(h => <th key={h} style={thStyle}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan="7"><Spinner /></td></tr>
                : filtered.length === 0 ? <tr><td colSpan="7"><EmptyState message={vendorSearch ? "No packages found for this vendor." : "No returns found in this category."} icon="↩️" /></td></tr>
                : filtered.map(p => {
                  const riderDone = !!p.rtvSignoff?.riderReturned;
                  const vendorDone = !!p.rtvSignoff?.vendorReceived;
                  const fullDone = riderDone && vendorDone;
                  const aLoading = actionLoading[p._id];
                  return (
                    <tr key={p._id} style={{ opacity: fullDone ? 0.6 : 1 }} onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'} onMouseLeave={e => e.currentTarget.style.background = ''}>
                      <td style={tdStyle}><TrackingLink code={p.trackingCode} /></td>
                      <td style={{ ...tdStyle, fontWeight: 600 }}>{getVendorDisplayName(p.vendorId, '—')}</td>
                      <td style={tdStyle}>{p.customerName}</td>
                      <td style={tdStyle}>{p.riderId?.name || <span style={{ color: '#d1d5db' }}>—</span>}</td>
                      <td style={tdStyle}><StatusBadge status={p.status} /></td>
                      <td style={tdStyle}>
                        <div style={{ display: 'flex', gap: 8 }}>
                          {/* Rider Pill */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: riderDone ? '#f0fdf4' : '#fef9c3', color: riderDone ? '#059669' : '#854d0e', border: `1px solid ${riderDone ? '#bbf7d0' : '#fef08a'}` }}>
                            {riderDone ? '✓' : '○'} Rider
                          </div>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="2" style={{ alignSelf: 'center' }}><path d="m9 18 6-6-6-6"/></svg>
                          {/* Vendor Pill */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: vendorDone ? '#f0fdf4' : '#f3f4f6', color: vendorDone ? '#059669' : '#6b7280', border: `1px solid ${vendorDone ? '#bbf7d0' : '#e5e7eb'}` }}>
                            {vendorDone ? '✓' : '○'} Vendor
                          </div>
                        </div>
                      </td>
                      <td style={tdStyle}>
                        {fullDone ? (
                          <span style={{ color: '#059669', fontWeight: 600, fontSize: 12 }}>✓ RTV Complete</span>
                        ) : (
                          <div style={{ display: 'flex', gap: 6 }}>
                            {!riderDone && (
                              <ActionBtn onClick={() => confirmStep(p._id, 'rider')} disabled={aLoading === 'rider'} variant="warning" size="sm">
                                {aLoading === 'rider' ? '...' : '✓ Rider Returned'}
                              </ActionBtn>
                            )}
                            {riderDone && !vendorDone && (
                              <ActionBtn onClick={() => confirmStep(p._id, 'vendor')} disabled={aLoading === 'vendor'} variant="success" size="sm">
                                {aLoading === 'vendor' ? '...' : '✓ Vendor Received'}
                              </ActionBtn>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ─── 6. Active Riders ───────────────────────────────────────────────────────
const ActiveRiders = () => {
  const [riders, setRiders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();
  const { openRiderHistory } = useRiderHistory();

  const fetchRiders = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await api.get('/dispatcher/riders');
      setRiders(res.data.data || []);
    } catch { showToast('Failed to load riders', 'error'); }
    finally { setLoading(false); }
  }, [showToast]);

  useEffect(() => { fetchRiders(); }, [fetchRiders]);

  if (loading) return <Spinner />;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Active Riders</h2>
        <ActionBtn onClick={fetchRiders} variant="ghost">↻ Refresh</ActionBtn>
      </div>
      
      {riders.length === 0 ? (
        <EmptyState message="No active riders found." icon="🏍️" />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {riders.map(rider => (
            <div 
              key={rider._id} 
              style={{ ...cardStyle, padding: 20, marginBottom: 0, display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer', transition: 'transform 0.1s' }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'none'}
              onClick={() => openRiderHistory(rider._id)}
            >
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700 }}>
                {rider.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 700 }}>{rider.name}</h3>
                <div style={{ fontSize: 13, color: '#6b7280' }}>📧 {rider.email}</div>
                <div style={{ fontSize: 13, color: '#6b7280' }}>📞 {rider.contact || 'No contact info'}</div>
                <div style={{ fontSize: 13, color: '#059669', fontWeight: 600, marginTop: 4 }}>💵 COD Collected: Rs. {(rider.totalCOD || 0).toLocaleString()}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Combined Tasks (Pickups & Deliveries) ───────────────────────────────
const CombinedTasks = () => {
  const [activeFilter, setActiveFilter] = useState('all');

  return (
    <div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        {[
          { key: 'all', label: 'All Tasks', color: '#6b7280' },
          { key: 'pickups', label: 'Pickups', color: '#f59e0b' },
          { key: 'deliveries', label: 'Deliveries', color: '#3b82f6' },
        ].map(s => (
          <button 
            key={s.key} 
            onClick={() => setActiveFilter(s.key)} 
            style={{ 
              padding: '7px 14px', borderRadius: 20, fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s', 
              background: activeFilter === s.key ? s.color : 'white', 
              color: activeFilter === s.key ? 'white' : s.color, 
              border: `2px solid ${s.color}`
            }}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {(activeFilter === 'all' || activeFilter === 'pickups') && (
          <div>
            {activeFilter === 'all' && <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Pickup Tasks</h2>}
            <PickupRequests />
          </div>
        )}

        {(activeFilter === 'all' || activeFilter === 'deliveries') && (
          <div>
            {activeFilter === 'all' && <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, marginTop: activeFilter === 'all' ? 16 : 0 }}>Delivery Tasks</h2>}
            <Routing />
          </div>
        )}
      </div>
    </div>
  );
};

// ─── COD Handovers ────────────────────────────────────────────────────────
const CodHandovers = () => {
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

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">COD Handovers</h2>
          <p className="text-sm text-slate-500">Verify cash deposited by riders at the hub.</p>
        </div>
      </div>

      <div style={cardStyle}>
        <div style={cardHeaderStyle}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#111827' }}>Pending & Completed Handovers</h3>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Date</th>
                <th style={thStyle}>Rider</th>
                <th style={thStyle}>Amount</th>
                <th style={thStyle}>Packages</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Action</th>
              </tr>
            </thead>
            <tbody>
              {handovers.length === 0 ? (
                <tr><td colSpan="6"><EmptyState message="No COD handovers found." /></td></tr>
              ) : (
                handovers.map(h => (
                  <tr key={h._id}>
                    <td style={tdStyle}>
                      <div style={{ fontWeight: 600, color: '#111827' }}>{new Date(h.createdAt).toLocaleDateString()}</div>
                      <div style={{ fontSize: 11, color: '#6b7280' }}>{new Date(h.createdAt).toLocaleTimeString()}</div>
                    </td>
                    <td style={tdStyle}>
                      <div style={{ fontWeight: 600 }}>{h.riderId?.name}</div>
                      <div style={{ fontSize: 11, color: '#6b7280' }}>{h.riderId?.contact || '-'}</div>
                    </td>
                    <td style={tdStyle}><span style={{ fontWeight: 800, color: '#111827' }}>Rs. {h.amount}</span></td>
                    <td style={tdStyle}><span style={{ background: '#f3f4f6', padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600 }}>{h.packageIds?.length || 0}</span></td>
                    <td style={tdStyle}>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${h.status === 'Verified' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : h.status === 'Rejected' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                        {h.status}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      {h.status === 'Pending Verification' ? (
                        <div style={{ display: 'flex', gap: 8 }}>
                          <ActionBtn onClick={() => handleVerify(h._id, 'Verified')} variant="success" disabled={verifying === h._id}>Verify</ActionBtn>
                          <ActionBtn onClick={() => handleVerify(h._id, 'Rejected')} variant="danger" disabled={verifying === h._id}>Reject</ActionBtn>
                        </div>
                      ) : (
                        <span style={{ fontSize: 11, color: '#9ca3af', fontStyle: 'italic' }}>
                          By {h.verifiedBy?.name || 'Admin'}
                        </span>
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

// ─── Dispatcher Dashboard Shell ───────────────────────────────────────────
const DispatcherDashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [pendingPickups, setPendingPickups] = useState([]);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await api.get('/dispatcher/pickups');
        const pickups = res.data.data || [];
        const pending = pickups.filter(p => p.status === 'pending');
        setPendingPickups(pending);
        
      } catch (e) {
        console.error('Failed to fetch notifications:', e.message || e.message);
      }
    };
    
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const notifications = pendingPickups.map(p => ({
    id: p._id,
    title: 'New Pickup Request',
    message: `${getVendorDisplayName(p.vendorId, 'A vendor')} requested a pickup for ${p.packageId?.trackingCode || 'a package'}.`,
    time: p.requestedAt ? new Date(p.requestedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
    read: false,
    icon: '🚚',
    path: '/dispatcher/tasks'
  }));

  const handleNotificationClick = (n) => {
    if (n.path) navigate(n.path);
  };

  const title = Object.entries(titleMap)
    .sort((a, b) => b[0].length - a[0].length)
    .find(([p]) => location.pathname.startsWith(p))?.[1] || 'Warehouse Staff';

  return (
    <AppShell 
      navLinks={navLinks} 
      currentTitle={title} 
      roleBadge="Warehouse Staff"
      notifications={notifications}
      onNotificationClick={handleNotificationClick}
    >
      <Routes>
        <Route path="/" element={<DispatcherHome />} />
        <Route path="/tasks" element={<CombinedTasks />} />
        <Route path="/scan-station" element={<ScanStation role="dispatcher" />} />
        <Route path="/inbound-scan" element={<InboundScan />} />
        <Route path="/reverse-logistics" element={<ReverseLogistics />} />
        <Route path="/riders" element={<ActiveRiders />} />
        <Route path="/handovers" element={<CodHandovers />} />
      </Routes>
    </AppShell>
  );
};

export default DispatcherDashboard;
