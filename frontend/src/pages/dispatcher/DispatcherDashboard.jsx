import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import AppShell from '../../components/AppShell';
import MetricCard from '../../components/MetricCard';
import ScanStation from '../../components/ScanStation';
import api from '../../api/axios';
import { useToast } from '../../context/ToastContext';

// ─── Nav + Title Map ──────────────────────────────────────────────────────
const navLinks = [
  { name: 'Dashboard', path: '/dispatcher', exact: true, icon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg> },
  { name: 'Pickup Requests', path: '/dispatcher/pickup-requests', icon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg> },
  { name: '📷 Scan Station', path: '/dispatcher/scan-station', icon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9V6a3 3 0 0 1 3-3h3"/><path d="M15 3h3a3 3 0 0 1 3 3v3"/><path d="M3 15v3a3 3 0 0 0 3 3h3"/><path d="M15 21h3a3 3 0 0 0 3-3v-3"/><line x1="8" y1="12" x2="16" y2="12"/></svg> },
  { name: 'Inbound Scan', path: '/dispatcher/inbound-scan', icon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 20h20"/><path d="M3 20V7l9-5 9 5v13"/><path d="M9 20v-6h6v6"/></svg> },
  { name: 'Routing & Assign', path: '/dispatcher/routing-assign', icon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.94 11A8 8 0 1 0 12 20"/><path d="M12 12l6-6"/></svg> },
  { name: 'Reverse Logistics', path: '/dispatcher/reverse-logistics', icon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.5"/></svg> },
];

const titleMap = {
  '/dispatcher/pickup-requests': 'Pickup Requests',
  '/dispatcher/scan-station':    '📷 Scan Station — Warehouse Staff',
  '/dispatcher/inbound-scan':    'Inbound Scan — Warehouse',
  '/dispatcher/routing-assign':  'Routing & Bulk Assignment',
  '/dispatcher/reverse-logistics': 'Reverse Logistics (RTV)',
  '/dispatcher/riders':          'Active Riders',
  '/dispatcher':                 'Warehouse Staff Dashboard',
};

// ─── Shared Helpers ───────────────────────────────────────────────────────
const STATUS_COLORS = {
  'Pending': '#f59e0b', 'Pick Up Requested': '#f59e0b', 'Picked Up': '#3b82f6',
  'In Warehouse': '#8b5cf6', 'Out for Delivery': '#06b6d4', 'Delivered': '#10b981',
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

function ActionBtn({ onClick, children, variant = 'primary', disabled = false, size = 'sm' }) {
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
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{ padding: pad, fontSize: 12, fontWeight: 600, color: c.text, background: hov && !disabled ? c.hover : c.bg, border: c.border || 'none', borderRadius: 7, cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1, transition: 'background 0.15s', display: 'inline-flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap' }}
    >
      {children}
    </button>
  );
}

// ─── 1. Dashboard Home ────────────────────────────────────────────────────
const DispatcherHome = () => {
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();
  const navigate = useNavigate();

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
      {/* Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Pickup Requests', value: s.pickupsPending || 0, color: '#f59e0b', icon: '🚚', path: '/dispatcher/pickup-requests' },
          { label: 'In Warehouse', value: s.inWarehouse || 0, color: '#8b5cf6', icon: '🏭', path: '/dispatcher/inbound-scan' },
          { label: 'Unassigned', value: s.unassigned || 0, color: '#ef4444', icon: '⚠️', path: '/dispatcher/routing-assign' },
          { label: 'Out for Delivery', value: s.outForDelivery || 0, color: '#06b6d4', icon: '📦', path: '/dispatcher/routing-assign' },
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
                  <td style={{ ...tdStyle, fontFamily: 'monospace', fontWeight: 700, color: '#1d4ed8' }}>{p.trackingCode}</td>
                  <td style={tdStyle}>{p.vendorId?.name || '—'}</td>
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
  const [pickups, setPickups] = useState([]);
  const [riders, setRiders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assignMap, setAssignMap] = useState({});
  const [actionLoading, setActionLoading] = useState({});
  const { showToast } = useToast();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [pRes, rRes] = await Promise.all([
        api.get('/dispatcher/pickups'),
        api.get('/dispatcher/riders'),
      ]);
      setPickups(pRes.data.data || []);
      setRiders(rRes.data.data || []);
    } catch { showToast('Failed to load pickup requests', 'error'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const assignPickup = async (pickupId) => {
    const riderId = assignMap[pickupId];
    if (!riderId) return showToast('Please select a rider first', 'warning');
    setActionLoading(s => ({ ...s, [pickupId]: 'assigning' }));
    try {
      await api.put('/dispatcher/assign-pickup', { pickupId, riderId });
      showToast('Rider assigned for pickup!', 'success');
      fetchData();
    } catch (e) { showToast(e.response?.data?.message || 'Failed to assign', 'error'); }
    finally { setActionLoading(s => ({ ...s, [pickupId]: null })); }
  };

  const confirmWarehouse = async (packageId, pickupId) => {
    setActionLoading(s => ({ ...s, [pickupId]: 'confirming' }));
    try {
      await api.put('/dispatcher/confirm-warehouse', { packageId });
      showToast('✓ Package confirmed at warehouse!', 'success');
      fetchData();
    } catch (e) { showToast(e.response?.data?.message || 'Failed', 'error'); }
    finally { setActionLoading(s => ({ ...s, [pickupId]: null })); }
  };

  const pending = pickups.filter(p => p.status === 'pending');
  const assigned = pickups.filter(p => p.status === 'assigned');

  const PickupTable = ({ items, title, color }) => (
    <div style={cardStyle}>
      <div style={cardHeaderStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: color, boxShadow: `0 0 8px ${color}` }}></span>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>{title}</h3>
          <span style={{ background: color + '20', color, borderRadius: 20, padding: '2px 10px', fontSize: 12, fontWeight: 700 }}>{items.length}</span>
        </div>
        <ActionBtn onClick={fetchData} variant="ghost">↻ Refresh</ActionBtn>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={tableStyle}>
          <thead>
            <tr>
              {['Tracking', 'Vendor', 'Customer', 'Address', 'Requested', 'Assigned Rider', 'Action'].map(h => <th key={h} style={thStyle}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan="7"><Spinner /></td></tr>
              : items.length === 0 ? <tr><td colSpan="7"><EmptyState message={`No ${title.toLowerCase()}.`} /></td></tr>
              : items.map(p => {
                const isAssigned = p.status === 'assigned';
                const aLoading = actionLoading[p._id];
                return (
                  <tr key={p._id} onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'} onMouseLeave={e => e.currentTarget.style.background = ''}>
                    <td style={{ ...tdStyle, fontFamily: 'monospace', fontWeight: 700, color: '#1d4ed8' }}>{p.packageId?.trackingCode || '—'}</td>
                    <td style={tdStyle}><div style={{ fontWeight: 600 }}>{p.vendorId?.name || '—'}</div></td>
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
                          <ActionBtn onClick={() => assignPickup(p._id)} disabled={aLoading === 'assigning'} variant="primary">
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

  return (
    <div>
      <PickupTable items={pending} title="Pending Pickup Requests" color="#f59e0b" />
      <PickupTable items={assigned} title="Assigned — Awaiting Warehouse Confirmation" color="#3b82f6" />
    </div>
  );
};

// ─── 3. Inbound Scan / Warehouse (Grouped by Vendor) ─────────────────────
const InboundScan = () => {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState({});
  const [actionLoading, setActionLoading] = useState({});
  const [search, setSearch] = useState('');
  const { showToast } = useToast();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.get('/dispatcher/packages?status=Pick Up Requested,Picked Up,In Warehouse');
      setPackages(r.data.data || []);
    } catch { showToast('Failed to load packages', 'error'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const confirmArrival = async (packageId) => {
    setActionLoading(s => ({ ...s, [packageId]: true }));
    try {
      await api.put('/dispatcher/confirm-warehouse', { packageId });
      showToast('✓ Package confirmed at warehouse!', 'success');
      fetchData();
    } catch (e) { showToast(e.response?.data?.message || 'Failed', 'error'); }
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
        <div style={{ display: 'flex', gap: 10 }}>
          {[
            { label: 'Pick Up Requested', color: '#f59e0b', count: packages.filter(p => p.status === 'Pick Up Requested').length },
            { label: 'Picked Up', color: '#3b82f6', count: packages.filter(p => p.status === 'Picked Up').length },
            { label: 'In Warehouse', color: '#8b5cf6', count: packages.filter(p => p.status === 'In Warehouse').length },
          ].map(s => (
            <span key={s.label} style={{ padding: '5px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: s.color + '18', color: s.color, border: `1px solid ${s.color}30` }}>
              {s.label}: {s.count}
            </span>
          ))}
        </div>
        <ActionBtn onClick={fetchData} variant="ghost">↻ Refresh</ActionBtn>
      </div>

      {loading ? <Spinner /> : Object.keys(grouped).length === 0 ? (
        <EmptyState message="No incoming packages found." icon="🏭" />
      ) : Object.entries(grouped).map(([vid, { vendor, packages: pkgs }]) => {
        const isOpen = !collapsed[vid];
        const inWarehouseCount = pkgs.filter(p => p.status === 'In Warehouse').length;
        return (
          <div key={vid} style={cardStyle}>
            {/* Vendor Group Header */}
            <div
              style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', borderBottom: isOpen ? '1px solid #e5e7eb' : 'none', userSelect: 'none' }}
              onClick={() => toggleGroup(vid)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🏪</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{vendor?.name || 'Unknown Vendor'}</div>
                  <div style={{ fontSize: 11, color: '#6b7280', marginTop: 1 }}>{pkgs.length} packages — {inWarehouseCount} confirmed in warehouse</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700, background: '#f0fdf4', color: '#059669' }}>{inWarehouseCount}/{pkgs.length} scanned</span>
                <svg style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2"><path d="m6 9 6 6 6-6"/></svg>
              </div>
            </div>

            {/* Package Rows */}
            {isOpen && (
              <table style={tableStyle}>
                <thead>
                  <tr>
                    {['Tracking', 'Customer', 'Address', 'Weight', 'COD', 'Status', 'Action'].map(h => <th key={h} style={thStyle}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {pkgs.map(p => (
                    <tr key={p._id} onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'} onMouseLeave={e => e.currentTarget.style.background = ''}>
                      <td style={{ ...tdStyle, fontFamily: 'monospace', fontWeight: 700, color: '#1d4ed8' }}>{p.trackingCode}</td>
                      <td style={tdStyle}>{p.customerName}</td>
                      <td style={{ ...tdStyle, maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#6b7280', fontSize: 12 }}>{p.city || p.address}</td>
                      <td style={tdStyle}>{p.weight} kg</td>
                      <td style={{ ...tdStyle, fontWeight: 600 }}>Rs. {p.amount?.toLocaleString()}</td>
                      <td style={tdStyle}><StatusBadge status={p.status} /></td>
                      <td style={tdStyle}>
                        {p.status !== 'In Warehouse' ? (
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
            )}
          </div>
        );
      })}
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
  const { showToast } = useToast();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [pRes, rRes] = await Promise.all([
        api.get('/dispatcher/packages?status=In Warehouse'),
        api.get('/dispatcher/riders'),
      ]);
      setPackages(pRes.data.data || []);
      setRiders(rRes.data.data || []);
    } catch { showToast('Failed to load', 'error'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = packages.filter(p =>
    !search || p.trackingCode.toLowerCase().includes(search.toLowerCase()) || (p.vendorId?.name || '').toLowerCase().includes(search.toLowerCase())
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
      fetchData();
    } catch (e) { showToast(e.response?.data?.message || 'Failed', 'error'); }
    finally { setAssigning(false); }
  };

  const selectedRider = riders.find(r => r._id === riderId);

  return (
    <div>
      {/* Toolbar */}
      <div style={{ ...cardStyle, padding: '16px 20px', display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', marginBottom: 20 }}>
        <input
          type="text"
          placeholder="Search tracking or vendor..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ flex: '1 1 200px', border: '1px solid #e5e7eb', borderRadius: 8, padding: '8px 14px', fontSize: 13, outline: 'none' }}
        />
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
                {['Tracking', 'Vendor', 'Customer', 'Destination', 'Weight', 'COD (Rs.)', 'Current Rider'].map(h => <th key={h} style={thStyle}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan="8"><Spinner /></td></tr>
                : filtered.length === 0 ? <tr><td colSpan="8"><EmptyState message="No packages in warehouse ready for assignment." icon="📦" /></td></tr>
                : filtered.map(p => (
                  <tr key={p._id} style={{ cursor: 'pointer' }} onClick={() => handleSelect(p._id)} onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'} onMouseLeave={e => e.currentTarget.style.background = selected.includes(p._id) ? '#eff6ff' : ''}>
                    <td style={tdStyle} onClick={e => e.stopPropagation()}>
                      <input type="checkbox" checked={selected.includes(p._id)} onChange={() => handleSelect(p._id)} />
                    </td>
                    <td style={{ ...tdStyle, fontFamily: 'monospace', fontWeight: 700, color: '#1d4ed8' }}>{p.trackingCode}</td>
                    <td style={{ ...tdStyle, fontWeight: 600 }}>{p.vendorId?.name || '—'}</td>
                    <td style={tdStyle}>{p.customerName}</td>
                    <td style={{ ...tdStyle, maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#6b7280', fontSize: 12 }}>{p.city || p.address || '—'}</td>
                    <td style={tdStyle}>{p.weight} kg</td>
                    <td style={{ ...tdStyle, fontWeight: 600 }}>{p.amount?.toLocaleString()}</td>
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
  const { showToast } = useToast();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.get('/dispatcher/packages?status=Returned,Returned to Vendor');
      setPackages(r.data.data || []);
    } catch { showToast('Failed to load returns', 'error'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const confirmStep = async (packageId, type) => {
    setActionLoading(s => ({ ...s, [packageId]: type }));
    try {
      await api.put('/dispatcher/confirm-return', { packageId, type });
      showToast(`✓ ${type === 'rider' ? 'Rider return' : 'Vendor receipt'} confirmed!`, 'success');
      fetchData();
    } catch (e) { showToast(e.response?.data?.message || 'Failed', 'error'); }
    finally { setActionLoading(s => ({ ...s, [packageId]: null })); }
  };

  const filtered = packages.filter(p => {
    if (filter === 'pending_rider') return !p.rtvSignoff?.riderReturned;
    if (filter === 'pending_vendor') return p.rtvSignoff?.riderReturned && !p.rtvSignoff?.vendorReceived;
    if (filter === 'complete') return p.rtvSignoff?.riderReturned && p.rtvSignoff?.vendorReceived;
    return true;
  });

  const stats = {
    pendingRider: packages.filter(p => !p.rtvSignoff?.riderReturned).length,
    pendingVendor: packages.filter(p => p.rtvSignoff?.riderReturned && !p.rtvSignoff?.vendorReceived).length,
    complete: packages.filter(p => p.rtvSignoff?.riderReturned && p.rtvSignoff?.vendorReceived).length,
  };

  return (
    <div>
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
          <ActionBtn onClick={fetchData} variant="ghost">↻ Refresh</ActionBtn>
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
                : filtered.length === 0 ? <tr><td colSpan="7"><EmptyState message="No returns in this category." icon="↩️" /></td></tr>
                : filtered.map(p => {
                  const riderDone = !!p.rtvSignoff?.riderReturned;
                  const vendorDone = !!p.rtvSignoff?.vendorReceived;
                  const fullDone = riderDone && vendorDone;
                  const aLoading = actionLoading[p._id];
                  return (
                    <tr key={p._id} style={{ opacity: fullDone ? 0.6 : 1 }} onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'} onMouseLeave={e => e.currentTarget.style.background = ''}>
                      <td style={{ ...tdStyle, fontFamily: 'monospace', fontWeight: 700, color: '#1d4ed8' }}>{p.trackingCode}</td>
                      <td style={{ ...tdStyle, fontWeight: 600 }}>{p.vendorId?.name || '—'}</td>
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
        console.error('Failed to fetch notifications', e);
      }
    };
    
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const notifications = pendingPickups.map(p => ({
    id: p._id,
    title: 'New Pickup Request',
    message: `${p.vendorId?.name || 'A vendor'} requested a pickup for ${p.packageId?.trackingCode || 'a package'}.`,
    time: p.requestedAt ? new Date(p.requestedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
    read: false,
    icon: '🚚',
    path: '/dispatcher/pickup-requests'
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
        <Route path="/pickup-requests" element={<PickupRequests />} />
        <Route path="/scan-station" element={<ScanStation role="dispatcher" />} />
        <Route path="/inbound-scan" element={<InboundScan />} />
        <Route path="/routing-assign" element={<Routing />} />
        <Route path="/reverse-logistics" element={<ReverseLogistics />} />
      </Routes>
    </AppShell>
  );
};

export default DispatcherDashboard;
