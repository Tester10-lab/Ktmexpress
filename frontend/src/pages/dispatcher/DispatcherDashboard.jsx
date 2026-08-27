import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import AppShell from '../../layouts/AppShell';
import MetricCard from '../../components/MetricCard';
import ScanStation from '../../components/ScanStation';
import QrScanner from '../../components/QrScanner';
import api from '../../api/axios';
import { useToast } from '../../store/ToastContext';
import useNotificationSound from '../../hooks/useNotificationSound';
import TrackingLink from '../../components/TrackingLink';
import SearchPanel from '../../components/SearchPanel';
import { useTrackingDrawer } from '../../store/TrackingDrawerContext';
import PackageTimeline from '../../components/PackageTimeline';

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
  '/dispatcher/reverse-logistics': 'Reverse Logistics (RTV)',
  '/dispatcher/riders':          'Active Riders Overview',
  '/dispatcher/handovers':       'COD Reconciliation & Handover',
  '/dispatcher/scan-station':    'Warehouse Scan Station',
  '/dispatcher/inbound-scan':    'Inbound & Sorting Station',
  '/dispatcher':                 'Warehouse Management Overview',
};

// ─── Status Badge ─────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const map = {
    'Delivered':           { bg: '#dcfce7', text: '#15803d' },
    'In Warehouse':        { bg: '#ede9fe', text: '#6d28d9' },
    'Out for Delivery':    { bg: '#e0f2fe', text: '#0369a1' },
    'Picked Up':           { bg: '#fef3c7', text: '#b45309' },
    'Pick Up Requested':   { bg: '#fef9c3', text: '#a16207' },
    'Postponed':           { bg: '#ffedd5', text: '#c2410c' },
    'Cancelled':           { bg: '#fee2e2', text: '#b91c1c' },
    'Returned':            { bg: '#f1f5f9', text: '#475569' },
    'Returned to Vendor':  { bg: '#f1f5f9', text: '#334155' },
    'Pending':             { bg: '#fef3c7', text: '#92400e' },
  };
  const s = map[status] || { bg: '#f3f4f6', text: '#374151' };
  return (
    <span style={{
      background: s.bg,
      color: s.text,
      padding: '3px 10px',
      borderRadius: 20,
      fontSize: 12,
      fontWeight: 600,
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4
    }}>
      {status === 'Delivered' && '✓ '}
      {status === 'Cancelled' && '✕ '}
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
    primary: 'bg-blue-600 hover:bg-blue-700 text-white border-none',
    secondary: 'bg-slate-500 hover:bg-slate-600 text-white border-none',
    success: 'bg-emerald-600 hover:bg-emerald-700 text-white border-none',
    warning: 'bg-amber-600 hover:bg-amber-700 text-white border-none',
    danger: 'bg-red-600 hover:bg-red-700 text-white border-none',
    ghost: 'bg-transparent hover:bg-slate-100 text-slate-700 border border-slate-200',
  };
  
  const baseClasses = 'inline-flex items-center gap-1.5 font-semibold rounded-md transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap';
  const sizeClasses = size === 'sm' ? 'py-[5px] px-[12px] text-xs' : 'py-[8px] px-[18px] text-sm';
  const variantClasses = colors[variant] || colors.primary;
  
  return (
    <button
      className={`${baseClasses} ${sizeClasses} ${variantClasses} ${icon ? 'btn-mobile-icon' : ''}`}
      onClick={onClick}
      disabled={disabled}
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
  const [packages, setPackages] = useState([]);
  const [riders, setRiders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [riderFilter, setRiderFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleScanSuccess = async (trackingCode) => {
    try {
      const res = await api.patch(`/packages/${trackingCode}/warehouse-arrival`);
      showToast(res.data.message || 'Arrival confirmed!', 'success');
      fetchAll();
    } catch (e) {
      showToast(e.message || 'Failed to confirm arrival', 'error');
    }
  };

  const fetchAll = useCallback(async () => {
    try {
      const [sRes, pRes, rRes] = await Promise.all([
        api.get('/dispatcher/dashboard'),
        api.get('/dispatcher/packages?status=all'),
        api.get('/dispatcher/riders'),
      ]);
      setStats(sRes.data.data || {});
      setPackages(pRes.data.data || []);
      setRiders(rRes.data.data || []);
    } catch { showToast('Failed to load dashboard', 'error'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 30000);
    return () => clearInterval(interval);
  }, [fetchAll]);

  // Real-time filtering
  const filteredPackages = useMemo(() => {
    return packages.filter(p => {
      // 1. Search Query
      if (search.trim()) {
        const s = search.toLowerCase().trim();
        const vendorName = (p.vendorId?.vendorMeta?.shopName || p.vendorId?.name || '').toLowerCase();
        const riderName = (p.riderId?.name || '').toLowerCase();
        const match =
          (p.trackingCode && p.trackingCode.toLowerCase().includes(s)) ||
          (p.invoiceId && p.invoiceId.toLowerCase().includes(s)) ||
          (p.customerName && p.customerName.toLowerCase().includes(s)) ||
          (p.customerPhone && p.customerPhone.toLowerCase().includes(s)) ||
          (p.address && p.address.toLowerCase().includes(s)) ||
          (p.city && p.city.toLowerCase().includes(s)) ||
          vendorName.includes(s) ||
          riderName.includes(s);
        if (!match) return false;
      }

      // 2. Status Filter
      if (statusFilter !== 'all') {
        if (statusFilter === 'Postponed') {
          if (p.status !== 'Postponed' && p.riderId) return false;
        } else if (p.status !== statusFilter) {
          return false;
        }
      }

      // 3. Rider Filter
      if (riderFilter !== 'all') {
        if (riderFilter === 'postponed' || riderFilter === 'unassigned') {
          if (p.riderId) return false;
        } else {
          const rId = p.riderId?._id || p.riderId;
          if (String(rId) !== String(riderFilter)) return false;
        }
      }

      // 4. Date Filter
      if (dateFilter !== 'all' && p.createdAt) {
        const pkgDate = new Date(p.createdAt);
        const now = new Date();
        if (dateFilter === 'today') {
          if (pkgDate.toDateString() !== now.toDateString()) return false;
        } else if (dateFilter === 'yesterday') {
          const yest = new Date();
          yest.setDate(now.getDate() - 1);
          if (pkgDate.toDateString() !== yest.toDateString()) return false;
        } else if (dateFilter === 'this_week') {
          const weekAgo = new Date();
          weekAgo.setDate(now.getDate() - 7);
          if (pkgDate < weekAgo) return false;
        } else if (dateFilter === 'this_month') {
          if (pkgDate.getMonth() !== now.getMonth() || pkgDate.getFullYear() !== now.getFullYear()) return false;
        }
      }

      return true;
    });
  }, [packages, search, statusFilter, riderFilter, dateFilter]);

  const hasActiveFilters = search.trim() !== '' || statusFilter !== 'all' || riderFilter !== 'all' || dateFilter !== 'all';
  const clearFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setRiderFilter('all');
    setDateFilter('all');
  };

  if (loading) return <Spinner />;

  const s = stats || {};

  // Status counts
  const countInWarehouse = packages.filter(p => p.status === 'In Warehouse').length;
  const countOutForDelivery = packages.filter(p => p.status === 'Out for Delivery').length;
  const countDelivered = packages.filter(p => p.status === 'Delivered').length;
  const countPostponed = packages.filter(p => p.status === 'Postponed' || (!p.riderId && p.status === 'In Warehouse')).length;
  const countPickups = packages.filter(p => ['Pending', 'Pick Up Requested', 'Picked Up'].includes(p.status)).length;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#111827', margin: 0 }}>Warehouse Dispatch Overview</h2>
          <p style={{ margin: '2px 0 0', fontSize: 13, color: '#6b7280' }}>Manage deliveries, search tracking codes & monitor active riders</p>
        </div>
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
          { label: 'Postponed', value: s.unassigned || 0, color: '#ef4444', icon: '⚠️', path: '/dispatcher/tasks' },
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

      {/* Live Delivery Progress with Comprehensive Search & Filter Controls */}
      <div style={cardStyle}>
        <div style={cardHeaderStyle}>
          <div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#0f172a' }}>Live Delivery Progress</h3>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748b' }}>
              Showing {filteredPackages.length} of {packages.length} packages — auto-refreshes every 30s
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                style={{ fontSize: 12, color: '#ef4444', fontWeight: 600, background: '#fee2e2', border: '1px solid #fecaca', borderRadius: 6, padding: '5px 10px', cursor: 'pointer' }}
              >
                ✕ Clear Filters
              </button>
            )}
            <ActionBtn onClick={fetchAll} variant="ghost">↻ Refresh</ActionBtn>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div style={{ padding: '16px 20px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Main Search and Dropdowns Row */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
            {/* Search Input */}
            <div style={{ flex: '1 1 260px', position: 'relative' }}>
              <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }}>
                🔍
              </div>
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search tracking, invoice, customer, phone, address, vendor, rider..."
                style={{
                  width: '100%',
                  padding: '9px 34px 9px 34px',
                  borderRadius: 8,
                  border: '1px solid #cbd5e1',
                  background: '#fff',
                  fontSize: 13,
                  outline: 'none',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                }}
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 14 }}
                >
                  ✕
                </button>
              )}
            </div>

            {/* Status Dropdown */}
            <div style={{ minWidth: 150, flex: '0 1 auto' }}>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 8,
                  border: '1px solid #cbd5e1',
                  background: '#fff',
                  fontSize: 13,
                  fontWeight: 500,
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                <option value="all">All Statuses ({packages.length})</option>
                <option value="In Warehouse">🏬 In Warehouse ({countInWarehouse})</option>
                <option value="Out for Delivery">🚀 Out for Delivery ({countOutForDelivery})</option>
                <option value="Delivered">✅ Delivered ({countDelivered})</option>
                <option value="Postponed">⚠️ Postponed ({countPostponed})</option>
                <option value="Pick Up Requested">🚚 Pick Up Requested</option>
                <option value="Picked Up">📦 Picked Up</option>
                <option value="Cancelled">❌ Cancelled</option>
                <option value="Returned">↩️ Returned</option>
                <option value="Returned to Vendor">🔄 Returned to Vendor</option>
              </select>
            </div>

            {/* Rider Dropdown */}
            <div style={{ minWidth: 160, flex: '0 1 auto' }}>
              <select
                value={riderFilter}
                onChange={e => setRiderFilter(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 8,
                  border: '1px solid #cbd5e1',
                  background: '#fff',
                  fontSize: 13,
                  fontWeight: 500,
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                <option value="all">All Riders</option>
                <option value="postponed">⚠️ Postponed (No Rider)</option>
                {riders.map(r => (
                  <option key={r._id} value={r._id}>🏍️ {r.name}</option>
                ))}
              </select>
            </div>

            {/* Date Dropdown */}
            <div style={{ minWidth: 130, flex: '0 1 auto' }}>
              <select
                value={dateFilter}
                onChange={e => setDateFilter(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 8,
                  border: '1px solid #cbd5e1',
                  background: '#fff',
                  fontSize: 13,
                  fontWeight: 500,
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                <option value="all">📅 All Time</option>
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="this_week">Last 7 Days</option>
                <option value="this_month">This Month</option>
              </select>
            </div>
          </div>

          {/* Quick Filter Pill Buttons */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Quick Filter:</span>
            {[
              { id: 'all', label: 'All', count: packages.length, color: '#3b82f6' },
              { id: 'In Warehouse', label: 'In Warehouse', count: countInWarehouse, color: '#8b5cf6' },
              { id: 'Out for Delivery', label: 'Out for Delivery', count: countOutForDelivery, color: '#0284c7' },
              { id: 'Delivered', label: 'Delivered', count: countDelivered, color: '#10b981' },
              { id: 'Postponed', label: 'Postponed', count: countPostponed, color: '#ef4444' },
              { id: 'Pick Up Requested', label: 'Pickups', count: countPickups, color: '#f59e0b' },
            ].map(tab => {
              const active = statusFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setStatusFilter(tab.id)}
                  style={{
                    padding: '4px 12px',
                    borderRadius: 20,
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    background: active ? tab.color : '#fff',
                    color: active ? '#fff' : '#475569',
                    border: active ? `1px solid ${tab.color}` : '1px solid #cbd5e1',
                    boxShadow: active ? `0 2px 6px ${tab.color}35` : 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                >
                  <span>{tab.label}</span>
                  <span style={{
                    background: active ? 'rgba(255,255,255,0.25)' : '#f1f5f9',
                    color: active ? '#fff' : '#64748b',
                    borderRadius: 10,
                    padding: '1px 6px',
                    fontSize: 10,
                    fontWeight: 700
                  }}>
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Table Content */}
        <div style={{ overflowX: 'auto' }}>
          <table style={tableStyle}>
            <thead>
              <tr>
                {['Tracking / Invoice', 'Vendor', 'Customer', 'Destination', 'Assigned Rider', 'Status', 'COD'].map(h => (
                  <th key={h} style={thStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredPackages.length === 0 ? (
                <tr>
                  <td colSpan="7">
                    <EmptyState 
                      message={hasActiveFilters ? "No packages match your search filters." : "No packages yet."} 
                      icon={hasActiveFilters ? "🔍" : "📭"} 
                    />
                  </td>
                </tr>
              ) : filteredPackages.slice(0, 100).map(p => (
                <tr key={p._id} style={{ transition: 'background 0.1s' }} onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'} onMouseLeave={e => e.currentTarget.style.background = ''}>
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <TrackingLink code={p.trackingCode} />
                      {p.invoiceId && (
                        <span style={{ fontSize: 10, color: '#6366f1', background: '#eef2ff', padding: '1px 6px', borderRadius: 4, width: 'fit-content', fontWeight: 600 }}>
                          Inv: {p.invoiceId}
                        </span>
                      )}
                    </div>
                  </td>
                  <td style={{ ...tdStyle, fontWeight: 500 }}>
                    {(p.vendorId?.vendorMeta?.shopName || p.vendorId?.name) || '—'}
                  </td>
                  <td style={tdStyle}>
                    <div style={{ fontWeight: 600, color: '#1e293b' }}>{p.customerName || '—'}</div>
                    {p.customerPhone && <div style={{ fontSize: 11, color: '#64748b' }}>{p.customerPhone}</div>}
                  </td>
                  <td style={{ ...tdStyle, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#475569' }}>
                    {p.city || p.address || '—'}
                  </td>
                  <td style={tdStyle}>
                    {p.riderId?.name ? (
                      <span style={{ fontWeight: 600, color: '#0f766e', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        🏍️ {p.riderId.name}
                      </span>
                    ) : (
                      <span style={{ color: '#ea580c', background: '#fff7ed', border: '1px solid #ffedd5', padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600 }}>
                        Postponed
                      </span>
                    )}
                  </td>
                  <td style={tdStyle}><StatusBadge status={p.status} /></td>
                  <td style={{ ...tdStyle, fontWeight: 700, color: '#0f172a' }}>Rs. {p.amount?.toLocaleString()}</td>
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
  const { openTracking, openShopTracking } = useTrackingDrawer();
  const [pickups, setPickups] = useState([]);
  const [riders, setRiders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assignMap, setAssignMap] = useState({});
  const [actionLoading, setActionLoading] = useState({});
  const [selected, setSelected] = useState([]);
  const [selectedAssigned, setSelectedAssigned] = useState([]);
  const [bulkRiderId, setBulkRiderId] = useState('');
  const [bulkAssigning, setBulkAssigning] = useState(false);
  const [bulkConfirming, setBulkConfirming] = useState(false);
  const [search, setSearch] = useState('');
  const { showToast } = useToast();

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
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
      fetchData(true);
    } catch (e) { showToast(e.message || 'Failed to assign', 'error'); }
    finally { setActionLoading(s => ({ ...s, [pickupId]: null })); }
  };

  const assignShopPickups = async (shopId, pickupIds) => {
    const riderId = assignMap[shopId];
    if (!riderId) return showToast('Please select a rider first', 'warning');
    setActionLoading(s => ({ ...s, [shopId]: 'assigning' }));
    try {
      await Promise.all(pickupIds.map(pickupId => api.put('/dispatcher/assign-pickup', { pickupId, riderId })));
      showToast('Rider assigned for all pickups!', 'success');
      fetchData(true);
    } catch (e) { showToast('Failed to assign some pickups', 'error'); }
    finally { setActionLoading(s => ({ ...s, [shopId]: null })); }
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

  const filteredPickups = useMemo(() => {
    if (!search.trim()) return pickups;
    const s = search.toLowerCase().trim();
    return pickups.filter(p => {
      const shopName = (p.vendorId?.vendorMeta?.shopName || p.vendorId?.name || '').toLowerCase();
      const riderName = (p.assignedRiderId?.name || '').toLowerCase();
      const trackingCode = (p.packageId?.trackingCode || p.trackingCode || '').toLowerCase();
      const customerName = (p.packageId?.customerName || '').toLowerCase();
      const address = (p.packageId?.address || '').toLowerCase();
      return (
        shopName.includes(s) ||
        riderName.includes(s) ||
        trackingCode.includes(s) ||
        customerName.includes(s) ||
        address.includes(s)
      );
    });
  }, [pickups, search]);

  const pending = filteredPickups.filter(p => p.status === 'pending');
  const pendingGroups = Object.values(pending.reduce((acc, p) => {
    const shopId = p.vendorId?._id || 'unknown';
    if (!acc[shopId]) acc[shopId] = { shopId, shopName: p.vendorId?.vendorMeta?.shopName || p.vendorId?.name || '—', packages: [], oldestDate: p.requestedAt, pickupIds: [] };
    acc[shopId].packages.push(p);
    acc[shopId].pickupIds.push(p._id);
    if (new Date(p.requestedAt) < new Date(acc[shopId].oldestDate)) acc[shopId].oldestDate = p.requestedAt;
    return acc;
  }, {}));
  const assigned = filteredPickups.filter(p => p.status === 'assigned');

  const selectStyle = { padding: '6px 10px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 13, width: '100%', minWidth: '120px' };

  const GroupedPickupTable = ({ groups, title, color }) => (
    <div style={cardStyle}>
      <div style={cardHeaderStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: color, boxShadow: `0 0 8px ${color}` }}></span>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>{title}</h3>
          <span style={{ background: color + '20', color, borderRadius: 20, padding: '2px 10px', fontSize: 12, fontWeight: 700 }}>{groups.length} Shops</span>
        </div>
        <ActionBtn onClick={() => fetchData()} variant="ghost">↻ Refresh</ActionBtn>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={tableStyle}>
          <thead>
            <tr>
              {['Shop Name', 'Total Pending', 'Oldest Requested At', 'Assign Rider', 'Action'].map(h => <th key={h} style={thStyle}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan="5"><Spinner /></td></tr>
              : groups.length === 0 ? <tr><td colSpan="5"><EmptyState message={`No ${title.toLowerCase()}.`} /></td></tr>
              : groups.map(g => {
                const aLoading = actionLoading[g.shopId];
                return (
                  <tr key={g.shopId} className="hover:bg-slate-50 transition-colors">
                    <td style={tdStyle}>
                      <button 
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); openShopTracking(g.shopName, g.packages); }} 
                        style={{ fontWeight: 600, color: '#2563eb', textDecoration: 'none', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                        onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                        onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
                        title="View Packages"
                      >
                        {g.shopName} ({g.packages.length})
                      </button>
                    </td>
                    <td style={{...tdStyle, fontWeight: 'bold'}}>{g.packages.length} Packages</td>
                    <td style={{ ...tdStyle, color: '#6b7280', fontSize: 12 }}>{g.oldestDate ? new Date(g.oldestDate).toLocaleString('en-NP', { dateStyle: 'short', timeStyle: 'short' }) : '—'}</td>
                    <td style={tdStyle}>
                      <select style={selectStyle} value={assignMap[g.shopId] || ''} onChange={e => setAssignMap(m => ({ ...m, [g.shopId]: e.target.value }))}>
                        <option value="">Select Rider</option>
                        {riders.map(r => <option key={r._id} value={r._id}>{r.name}</option>)}
                      </select>
                    </td>
                    <td style={tdStyle}>
                      <ActionBtn onClick={() => assignShopPickups(g.shopId, g.pickupIds)} disabled={!assignMap[g.shopId] || aLoading}>
                        {aLoading === 'assigning' ? 'Assigning...' : 'Assign'}
                      </ActionBtn>
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
        <ActionBtn onClick={fetchData} variant="ghost">↻ Refresh</ActionBtn>
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
                      <button 
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); openTracking(p.packageId?.trackingCode || p.trackingCode); }} 
                        style={{ fontWeight: 600, color: '#2563eb', textDecoration: 'none', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                        onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                        onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
                        title="View Package Details"
                      >
                        {p.vendorId?.vendorMeta?.shopName || '—'}
                      </button>
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
      {/* Search & Filter Header for Pickups */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 260px', position: 'relative' }}>
          <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }}>
            🔍
          </div>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search shop, tracking code, customer, address, assigned rider..."
            style={{
              width: '100%',
              padding: '9px 34px 9px 34px',
              borderRadius: 8,
              border: '1px solid #cbd5e1',
              background: '#fff',
              fontSize: 13,
              outline: 'none',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
            }}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 14 }}
            >
              ✕
            </button>
          )}
        </div>
        <ActionBtn onClick={() => fetchData()} variant="ghost">↻ Refresh Pickups</ActionBtn>
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

      <GroupedPickupTable 
        groups={pendingGroups} 
        title="Pending Pickup Requests" 
        color="#f59e0b" 
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
  const [selected, setSelected] = useState([]);
  const [bulkConfirming, setBulkConfirming] = useState(false);
  const [bulkAssigning, setBulkAssigning] = useState(false);
  const [riderId, setRiderId] = useState('');
  const [bulkStatusLoading, setBulkStatusLoading] = useState(false);
  const { showToast } = useToast();

  const bulkSetStatus = async (targetStatus) => {
    if (!selected.length) return showToast('No packages selected', 'warning');
    setBulkStatusLoading(true);
    try {
      const res = await api.put('/dispatcher/bulk-status-update', { packageIds: selected, status: targetStatus });
      showToast(`✓ ${res.data?.data?.count || selected.length} package(s) updated to "${targetStatus}"!`, 'success');
      setSelected([]);
      fetchData(true);
    } catch (e) {
      showToast(e.response?.data?.message || e.message || 'Bulk status update failed', 'error');
    } finally {
      setBulkStatusLoading(false);
    }
  };

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [pRes, rRes] = await Promise.all([
        api.get('/dispatcher/packages?status=Pick Up Requested,Picked Up,In Warehouse'),
        api.get('/dispatcher/riders')
      ]);
      setPackages(pRes.data.data || []);
      setRiders(rRes.data.data || []);
    } catch { showToast('Failed to load packages', 'error'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

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
  const filtered = packages.filter(p => {
    if (!search) return true;
    const s = search.toLowerCase();
    const vendorName = (p.vendorId?.vendorMeta?.shopName || p.vendorId?.name || '').toLowerCase();
    return p.trackingCode?.toLowerCase().includes(s) || 
           p.customerName?.toLowerCase().includes(s) || 
           p.customerPhone?.toLowerCase().includes(s) || 
           p.invoiceId?.toLowerCase().includes(s) || 
           vendorName.includes(s);
  });

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
    const toSend = selected.filter(id => ['In Warehouse', 'Sorted', 'Postponed'].includes(packages.find(p => p._id === id)?.status));
    if (!toSend.length) return showToast('No eligible packages selected', 'warning');
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
        <div style={{ flex: '1 1 240px' }}>
          <SearchPanel 
            value={search} 
            onChange={setSearch} 
            placeholder="Search tracking, name, phone, vendor, invoice..." 
          />
        </div>
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

      {selected.length > 0 && (
        <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 10, padding: '10px 16px', marginBottom: 16, display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#1d4ed8' }}>
            {selected.length} package(s) selected
          </span>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <ActionBtn onClick={() => bulkSetStatus('In Warehouse')} disabled={bulkStatusLoading} variant="warning" size="sm">
              🏬 Return to Warehouse
            </ActionBtn>
            <ActionBtn onClick={() => bulkSetStatus('Out for Delivery')} disabled={bulkStatusLoading} variant="primary" size="sm">
              🚀 Dispatched
            </ActionBtn>
            <ActionBtn onClick={() => bulkSetStatus('Delivered')} disabled={bulkStatusLoading} variant="success" size="sm">
              ✅ Delivered
            </ActionBtn>
            {hasUnconfirmed && (
              <ActionBtn onClick={bulkConfirmArrival} disabled={bulkConfirming} variant="ghost" size="sm">
                {bulkConfirming ? '...' : '✓ Confirm Arrival'}
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
                  {bulkAssigning ? '...' : 'Assign Rider'}
                </ActionBtn>
              </>
            )}
            <button onClick={() => setSelected([])} style={{ fontSize: 12, color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer', marginLeft: 4 }}>Clear</button>
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
                    <td style={{ ...tdStyle, fontWeight: 600 }}>{(p.vendorId?.vendorMeta?.shopName || p.vendorId?.name) || 'Unknown'}</td>
                    <td style={tdStyle}>{p.customerName}</td>
                    <td style={{ ...tdStyle, maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#6b7280', fontSize: 12 }}>{p.city ? `${p.city}, ` : ''}{p.address}</td>
                    <td style={tdStyle}>{p.weight} kg</td>
                    <td style={{ ...tdStyle, fontWeight: 600 }}>Rs. {p.amount?.toLocaleString()}</td>
                    <td style={tdStyle}><StatusBadge status={p.status} /></td>
                    <td style={tdStyle} onClick={e => e.stopPropagation()}>
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
  const [bulkStatusLoading, setBulkStatusLoading] = useState(false);
  const { showToast } = useToast();

  const bulkSetStatus = async (targetStatus) => {
    if (!selected.length) return showToast('No packages selected', 'warning');
    setBulkStatusLoading(true);
    try {
      const res = await api.put('/dispatcher/bulk-status-update', { packageIds: selected, status: targetStatus });
      showToast(`✓ ${res.data?.data?.count || selected.length} package(s) updated to "${targetStatus}"!`, 'success');
      setSelected([]);
      fetchData(true);
    } catch (e) {
      showToast(e.response?.data?.message || e.message || 'Bulk status update failed', 'error');
    } finally {
      setBulkStatusLoading(false);
    }
  };

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [pRes, rRes] = await Promise.all([
        api.get('/dispatcher/packages?status=In Warehouse,Out for Delivery,Postponed'),
        api.get('/dispatcher/riders'),
      ]);
      setPackages(pRes.data.data || []);
      setRiders(rRes.data.data || []);
    } catch { showToast('Failed to load', 'error'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = packages.filter(p => {
    if (!search) return true;
    const s = search.toLowerCase();
    const vendorName = (p.vendorId?.vendorMeta?.shopName || p.vendorId?.name || '').toLowerCase();
    return p.trackingCode?.toLowerCase().includes(s) || 
           p.customerName?.toLowerCase().includes(s) || 
           p.customerPhone?.toLowerCase().includes(s) || 
           p.invoiceId?.toLowerCase().includes(s) || 
           vendorName.includes(s);
  });

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
        <div style={{ flex: '1 1 200px' }}>
          <SearchPanel 
            value={search} 
            onChange={setSearch} 
            placeholder="Search tracking, name, phone, vendor, invoice..." 
          />
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

      {/* Selection Info + Bulk Actions */}
      {selected.length > 0 && (
        <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 10, padding: '10px 16px', marginBottom: 16, display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#1d4ed8' }}>
            {selected.length} package(s) selected
            {selectedRider ? ` → Assigning to ${selectedRider.name}` : ''}
          </span>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <ActionBtn onClick={() => bulkSetStatus('In Warehouse')} disabled={bulkStatusLoading} variant="warning" size="sm">
              🏬 Return to Warehouse
            </ActionBtn>
            <ActionBtn onClick={() => bulkSetStatus('Out for Delivery')} disabled={bulkStatusLoading} variant="primary" size="sm">
              🚀 Dispatched
            </ActionBtn>
            <ActionBtn onClick={() => bulkSetStatus('Delivered')} disabled={bulkStatusLoading} variant="success" size="sm">
              ✅ Delivered
            </ActionBtn>
            <button onClick={() => setSelected([])} style={{ fontSize: 12, color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer', marginLeft: 4 }}>Clear</button>
          </div>
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
              {loading ? <tr><td colSpan="9"><Spinner /></td></tr>
                : filtered.length === 0 ? <tr><td colSpan="9"><EmptyState message="No packages found." icon="📦" /></td></tr>
                : filtered.map(p => (
                  <tr key={p._id} style={{ cursor: 'pointer' }} onClick={() => handleSelect(p._id)} onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'} onMouseLeave={e => e.currentTarget.style.background = selected.includes(p._id) ? '#eff6ff' : ''}>
                    <td style={tdStyle} onClick={e => e.stopPropagation()}>
                      <input type="checkbox" checked={selected.includes(p._id)} onChange={() => handleSelect(p._id)} />
                    </td>
                    <td style={tdStyle}><TrackingLink code={p.trackingCode} /></td>
                    <td style={{ ...tdStyle, fontWeight: 600 }}>{(p.vendorId?.vendorMeta?.shopName || p.vendorId?.name) || '—'}</td>
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
  const [filter, setFilter] = useState('pending_rider');
  const [selectedVendors, setSelectedVendors] = useState({});
  const { showToast } = useToast();

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const r = await api.get('/dispatcher/packages?status=Returned,Cancelled,Exchanged,Returned to Vendor');
      setPackages(r.data.data || []);
    } catch { showToast('Failed to load returns', 'error'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const confirmStep = async (packageId, type) => {
    setActionLoading(s => ({ ...s, [packageId]: type }));
    try {
      await api.put('/dispatcher/confirm-return', { packageId, type });
      showToast(`✓ Rider return confirmed!`, 'success');
      fetchData(true);
    } catch (e) { showToast(e.message || 'Failed', 'error'); }
    finally { setActionLoading(s => ({ ...s, [packageId]: null })); }
  };

  const bulkVendorHandover = async (vendorId, packageIds) => {
    setActionLoading(s => ({ ...s, [vendorId]: 'bulk_vendor' }));
    try {
      await api.put('/dispatcher/bulk-vendor-handover', { packageIds });
      showToast(`✓ Bulk handover complete!`, 'success');
      fetchData(true);
    } catch (e) { showToast(e.message || 'Failed', 'error'); }
    finally { setActionLoading(s => ({ ...s, [vendorId]: null })); }
  };

  const pendingRider = packages.filter(p => !p.rtvSignoff?.riderReturned);
  const pendingVendor = packages.filter(p => p.rtvSignoff?.riderReturned && !p.rtvSignoff?.vendorReceived);
  const complete = packages.filter(p => p.rtvSignoff?.riderReturned && p.rtvSignoff?.vendorReceived);

  // Group pendingRider by Rider
  const riderGroups = pendingRider.reduce((acc, p) => {
    const riderName = p.riderId?.name || 'Postponed';
    if (!acc[riderName]) acc[riderName] = [];
    acc[riderName].push(p);
    return acc;
  }, {});

  // Group pendingVendor by Vendor
  const vendorGroups = pendingVendor.reduce((acc, p) => {
    const vendorId = p.vendorId?._id || 'unknown';
    const shopName = p.vendorId?.vendorMeta?.shopName || p.vendorId?.name || 'Unknown Vendor';
    if (!acc[vendorId]) acc[vendorId] = { shopName, packages: [] };
    acc[vendorId].packages.push(p);
    return acc;
  }, {});

  const toggleVendor = (vId) => {
    setSelectedVendors(prev => ({ ...prev, [vId]: !prev[vId] }));
  };

  const renderTable = (pkgs, hideRiderAction = false) => (
    <div style={{ overflowX: 'auto', marginTop: 10 }}>
      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={thStyle}>Tracking</th>
            <th style={thStyle}>Customer</th>
            <th style={thStyle}>Vendor Shop</th>
            <th style={thStyle}>Return Status</th>
            <th style={thStyle}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {pkgs.map(p => (
            <tr key={p._id} style={{ borderBottom: '1px solid #f3f4f6' }}>
              <td style={tdStyle}><TrackingLink code={p.trackingCode} /></td>
              <td style={tdStyle}>{p.customerName}</td>
              <td style={tdStyle}>{(p.vendorId?.vendorMeta?.shopName || p.vendorId?.name) || '—'}</td>
              <td style={tdStyle}><StatusBadge status={p.status} /></td>
              <td style={tdStyle}>
                {!p.rtvSignoff?.riderReturned && !hideRiderAction && (
                  <ActionBtn onClick={() => confirmStep(p._id, 'rider')} disabled={actionLoading[p._id]} variant="warning" size="sm">
                    {actionLoading[p._id] ? '...' : '✓ Rider Returned'}
                  </ActionBtn>
                )}
                {p.rtvSignoff?.riderReturned && p.rtvSignoff?.vendorReceived && (
                  <span style={{ color: '#059669', fontWeight: 600, fontSize: 12 }}>✓ RTV Complete</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        {[
          { key: 'pending_rider', label: 'Warehouse Receive (From Rider)', count: pendingRider.length, color: '#f59e0b' },
          { key: 'pending_vendor', label: 'Vendor Handover', count: pendingVendor.length, color: '#3b82f6' },
          { key: 'complete', label: 'Complete', count: complete.length, color: '#10b981' },
          { key: 'all', label: 'All', count: packages.length, color: '#6b7280' },
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
        {loading ? <div style={{ padding: 20 }}><Spinner /></div> : (
          <>
            {filter === 'pending_rider' && (
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 15, color: '#1f2937' }}>Receive from Riders</h3>
                {Object.keys(riderGroups).length === 0 ? <EmptyState message="No packages waiting from riders." icon="↩️" /> : 
                  Object.entries(riderGroups).map(([riderName, pkgs]) => (
                    <div key={riderName} style={{ marginBottom: 20, border: '1px solid #e5e7eb', borderRadius: 8, padding: 15 }}>
                      <div style={{ fontWeight: 700, fontSize: 15, color: '#374151', marginBottom: 10 }}>🛵 Rider: {riderName} ({pkgs.length})</div>
                      {renderTable(pkgs)}
                    </div>
                  ))
                }
              </div>
            )}

            {filter === 'pending_vendor' && (
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 15, color: '#1f2937' }}>Handover to Vendors</h3>
                {Object.keys(vendorGroups).length === 0 ? <EmptyState message="No packages waiting for vendor handover." icon="📦" /> : 
                  Object.entries(vendorGroups).map(([vendorId, { shopName, packages: pkgs }]) => (
                    <div key={vendorId} style={{ marginBottom: 15, border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden' }}>
                      <div 
                        onClick={() => toggleVendor(vendorId)}
                        style={{ padding: '12px 15px', background: '#f9fafb', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                      >
                        <div style={{ fontWeight: 700, color: '#1f2937' }}>🏢 {shopName} <span style={{ color: '#6b7280', fontSize: 12, marginLeft: 8 }}>{pkgs.length} packages</span></div>
                        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                          <ActionBtn onClick={(e) => { e.stopPropagation(); bulkVendorHandover(vendorId, pkgs.map(p => p._id)); }} disabled={actionLoading[vendorId]} variant="success" size="sm">
                            {actionLoading[vendorId] ? 'Handing over...' : `Handover All (${pkgs.length})`}
                          </ActionBtn>
                          <span style={{ fontSize: 12 }}>{selectedVendors[vendorId] ? '▲' : '▼'}</span>
                        </div>
                      </div>
                      {selectedVendors[vendorId] && (
                        <div style={{ padding: 15 }}>
                          {renderTable(pkgs, true)}
                        </div>
                      )}
                    </div>
                  ))
                }
              </div>
            )}

            {(filter === 'complete' || filter === 'all') && (
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 15, color: '#1f2937' }}>{filter === 'complete' ? 'Completed RTV' : 'All Reverse Logistics'}</h3>
                {renderTable(filter === 'complete' ? complete : packages)}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

// ─── 6. Active Riders ───────────────────────────────────────────────────────
const ActiveRiders = () => {
  const [riders, setRiders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  const [hoveredId, setHoveredId] = useState(null);
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
  const [verificationModal, setVerificationModal] = useState({ open: false, pkgId: null, reason: '', comment: '' });

  const handleRequestVerificationSubmit = async (e) => {
    e.preventDefault();
    if (!verificationModal.reason) return;
    try {
      const payloadReason = verificationModal.reason === 'Other' ? verificationModal.comment : verificationModal.reason;
      await api.post(`/packages/${verificationModal.pkgId}/request-verification`, { reason: payloadReason });
      showToast("Verification requested", "success");
      setVerificationModal({ open: false, pkgId: null, reason: '', comment: '' });
      if (selectedRider) fetchRiderHistory(selectedRider._id, historyFilters);
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to request verification", "error");
    }
  };

  const fetchRiders = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await api.get('/dispatcher/riders');
      setRiders(res.data.data || []);
    } catch { showToast('Failed to load riders', 'error'); }
    finally { setLoading(false); }
  }, [showToast]);

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
    } catch {
      showToast('Failed to load rider history', 'error');
    } finally {
      setRiderHistoryLoading(false);
    }
  }, [showToast]);

  useEffect(() => { fetchRiders(); }, [fetchRiders]);

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
              onClick={() => handleRiderClick(rider)}
              onMouseEnter={() => setHoveredId(rider._id)}
              onMouseLeave={() => setHoveredId(null)}
              style={{ 
                ...cardStyle, 
                padding: 20, 
                marginBottom: 0, 
                display: 'flex', 
                alignItems: 'center', 
                gap: 16,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                transform: hoveredId === rider._id ? 'translateY(-2px)' : 'none',
                boxShadow: hoveredId === rider._id ? '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)' : 'none',
                borderColor: hoveredId === rider._id ? '#2563eb' : '#e5e7eb'
              }}
            >
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700 }}>
                {rider.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 700 }}>{rider.name}</h3>
                <div style={{ fontSize: 13, color: '#6b7280' }} onClick={(e) => e.stopPropagation()}>📧 {rider.email}</div>
                <div style={{ fontSize: 13, color: '#6b7280' }} onClick={(e) => e.stopPropagation()}>📞 {rider.contact || 'No contact info'}</div>
                <div style={{ fontSize: 13, color: '#059669', fontWeight: 600, marginTop: 4 }}>💵 COD Collected: Rs. {(rider.totalCOD || 0).toLocaleString()}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Rider History Drawer/Modal */}
      {selectedRider && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ width: '100%', maxWidth: 850, background: '#fff', boxShadow: '-4px 0 24px rgba(0,0,0,0.15)', height: '100%', display: 'flex', flexDirection: 'column' }}>
            
            {/* Header */}
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #e5e7eb', background: '#f9fafb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>🏍️ Rider Activity History: {selectedRider.name}</h3>
                <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>
                  <span style={{ marginRight: 16 }}>📧 {selectedRider.email}</span>
                  <span>📞 {selectedRider.contact || 'No contact'}</span>
                </div>
              </div>
              <button 
                onClick={() => setSelectedRider(null)}
                style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: '#9ca3af', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: 6 }}
                onMouseEnter={(e) => e.target.style.color = '#374151'}
                onMouseLeave={(e) => e.target.style.color = '#9ca3af'}
              >
                ×
              </button>
            </div>

            {/* Body */}
            <div style={{ padding: 24, overflowY: 'auto', flex: 1 }}>
              {riderHistoryLoading ? (
                <div style={{ textAlign: 'center', padding: '60px 0', color: '#9ca3af', fontSize: 14 }}>Loading activity history...</div>
              ) : !riderHistory ? (
                <div style={{ textAlign: 'center', padding: '60px 0', color: '#9ca3af', fontSize: 14 }}>Failed to load rider statistics.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  
                  {/* KPIs */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 10 }}>
                    {[
                      { label: 'Handled', value: riderHistory.stats.totalHandled, color: '#f3f4f6', tColor: '#374151' },
                      { label: 'Picked Up', value: riderHistory.stats.totalPickedUp, color: '#dbeafe', tColor: '#1e40af' },
                      { label: 'Delivered', value: riderHistory.stats.totalDelivered, color: '#d1fae5', tColor: '#065f46' },
                      { label: 'Failed/Ret', value: riderHistory.stats.totalFailedReturned, color: '#fee2e2', tColor: '#991b1b' },
                      { label: 'COD Collected', value: `Rs. ${riderHistory.stats.totalCODCollected.toLocaleString()}`, color: '#fef3c7', tColor: '#92400e' },
                      { label: 'Assigned Now', value: riderHistory.stats.currentAssigned, color: '#f3e8ff', tColor: '#6b21a8' }
                    ].map((kpi, idx) => (
                      <div key={idx} style={{ background: kpi.color, border: '1px solid rgba(0,0,0,0.05)', borderRadius: 8, padding: 10, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: 64 }}>
                        <div style={{ fontSize: 9, fontWeight: 700, color: kpi.tColor, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{kpi.label}</div>
                        <div style={{ fontSize: 13, fontWeight: 800, color: kpi.tColor }}>{kpi.value}</div>
                      </div>
                    ))}
                  </div>

                  {/* Filters */}
                  <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8, padding: 16, display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: '#4b5563', textTransform: 'uppercase', marginBottom: 4 }}>Status</label>
                      <select 
                        style={{ width: '100%', padding: '5px 8px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 12, background: '#fff' }}
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
                      <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: '#4b5563', textTransform: 'uppercase', marginBottom: 4 }}>Vendor</label>
                      <select 
                        style={{ width: '100%', padding: '5px 8px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 12, background: '#fff' }}
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
                      <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: '#4b5563', textTransform: 'uppercase', marginBottom: 4 }}>Region</label>
                      <select 
                        style={{ width: '100%', padding: '5px 8px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 12, background: '#fff' }}
                        value={historyFilters.valley}
                        onChange={(e) => setHistoryFilters({ ...historyFilters, valley: e.target.value })}
                      >
                        <option value="all">All Regions</option>
                        <option value="inside">Inside Valley</option>
                        <option value="outside">Outside Valley</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: '#4b5563', textTransform: 'uppercase', marginBottom: 4 }}>Start Date</label>
                      <input 
                        type="date"
                        style={{ width: '105%', padding: '4px 8px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 12 }}
                        value={historyFilters.startDate}
                        onChange={(e) => setHistoryFilters({ ...historyFilters, startDate: e.target.value })}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: '#4b5563', textTransform: 'uppercase', marginBottom: 4 }}>End Date</label>
                      <input 
                        type="date"
                        style={{ width: '105%', padding: '4px 8px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 12 }}
                        value={historyFilters.endDate}
                        onChange={(e) => setHistoryFilters({ ...historyFilters, endDate: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Packages Table */}
                  <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden' }}>
                    <div style={{ maxHeight: 400, overflowY: 'auto' }}>
                      <table style={tableStyle}>
                        <thead>
                          <tr>
                            <th style={thStyle}>Tracking Code</th>
                            <th style={thStyle}>Vendor / Region</th>
                            <th style={thStyle}>Customer</th>
                            <th style={thStyle}>COD / Dates</th>
                            <th style={thStyle}>Status</th>
                            <th style={{ ...thStyle, textAlign: 'right' }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody style={{ fontSize: 12 }}>
                          {riderHistory.packages.length === 0 ? (
                            <tr>
                              <td colSpan="6" style={{ ...tdStyle, textAlign: 'center', padding: '40px 0', color: '#9ca3af' }}>
                                No historical packages match the selected criteria.
                              </td>
                            </tr>
                          ) : (
                            riderHistory.packages.map(p => {
                              const isTimelineExpanded = expandedTimelines.has(p._id);
                              return (
                                <React.Fragment key={p._id}>
                                  <tr>
                                    <td style={tdStyle}>
                                      <TrackingLink code={p.trackingCode} />
                                    </td>
                                    <td style={tdStyle}>
                                      <div style={{ fontWeight: 700 }}>{p.vendorId?.vendorMeta?.shopName || (p.vendorId?.vendorMeta?.shopName || p.vendorId?.name) || 'Unknown'}</div>
                                      <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 2 }}>
                                        {p.outOfValley ? '🏔️ Outside Valley' : '🏡 Inside Valley'}
                                      </div>
                                    </td>
                                    <td style={tdStyle}>
                                      <div style={{ fontWeight: 700 }}>{p.customerName}</div>
                                      <div style={{ color: '#6b7280' }}>{p.customerPhone}</div>
                                    </td>
                                    <td style={tdStyle}>
                                      <div style={{ fontWeight: 800 }}>Rs. {p.amount}</div>
                                      <div style={{ fontSize: 9, color: '#9ca3af', marginTop: 2 }}>
                                        Created: {new Date(p.createdAt).toLocaleDateString()}
                                      </div>
                                    </td>
                                    <td style={tdStyle}>
                                      <StatusBadge status={p.status} />
                                    </td>
                                    <td style={{ ...tdStyle, textAlign: 'right' }}>
                                      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', alignItems: 'center' }}>
                                        {['Delivered', 'Cancelled', 'Returned', 'Exchanged'].includes(p.status) && p.deliveryVerificationStatus !== 'Pending' && p.deliveryVerificationStatus !== 'Verified' && (
                                          <button 
                                            onClick={() => setVerificationModal({ open: true, pkgId: p._id, reason: '', comment: '' })}
                                            style={{ background: 'none', border: 'none', color: '#d97706', fontWeight: 700, cursor: 'pointer', padding: 0 }}
                                            title="Request Verification"
                                          >
                                            Verify?
                                          </button>
                                        )}
                                        <button 
                                          onClick={() => toggleTimeline(p._id)}
                                          style={{ background: 'none', border: 'none', color: '#2563eb', fontWeight: 700, cursor: 'pointer', padding: 0 }}
                                        >
                                          {isTimelineExpanded ? 'Hide' : 'Timeline'}
                                        </button>
                                      </div>
                                    </td>
                                  </tr>

                                  {isTimelineExpanded && (
                                    <tr>
                                      <td colSpan="6" style={{ ...tdStyle, background: '#f9fafb' }}>
                                        <div style={{ padding: '8px 12px' }}>
                                          <PackageTimeline pkg={p} onCommentAdded={() => fetchPackageLogs(true)} />
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

                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{ padding: '16px 24px', borderTop: '1px solid #e5e7eb', background: '#f9fafb', display: 'flex', justifyContent: 'flex-end' }}>
              <ActionBtn onClick={() => setSelectedRider(null)} variant="secondary">Close History</ActionBtn>
            </div>

          </div>
        </div>
      )}

      {/* Verification Modal */}
      {verificationModal.open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn" onClick={() => setVerificationModal({open:false,pkgId:null,reason:'',comment:''})}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-scaleIn" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-bold text-slate-900 text-lg">Request Verification</h3>
              <button onClick={() => setVerificationModal({open:false,pkgId:null,reason:'',comment:''})} className="text-slate-400 hover:text-slate-600 transition-colors">
                ✕
              </button>
            </div>
            <div className="p-6">
              <form onSubmit={handleRequestVerificationSubmit}>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Reason for Verification <span className="text-red-500">*</span></label>
                  <select 
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 mb-4" 
                    value={verificationModal.reason || ''} 
                    onChange={e => setVerificationModal(m => ({ ...m, reason: e.target.value, comment: e.target.value === 'Other' ? '' : e.target.value }))}
                    required
                  >
                    <option value="" disabled>Select a reason...</option>
                    <option value="COD amount mismatch">COD amount mismatch</option>
                    <option value="Delivery charge correction">Delivery charge correction</option>
                    <option value="Wrong package status">Wrong package status</option>
                    <option value="Customer dispute">Customer dispute</option>
                    <option value="Exchange issue">Exchange issue</option>
                    <option value="Return issue">Return issue</option>
                    <option value="Damaged package">Damaged package</option>
                    <option value="Address correction">Address correction</option>
                    <option value="Receiver information correction">Receiver information correction</option>
                    <option value="Other">Other (please specify below)</option>
                  </select>
                </div>
                {verificationModal.reason === 'Other' && (
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Additional Details <span className="text-red-500">*</span></label>
                    <textarea 
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 min-h-[100px]" 
                      placeholder="Please specify the reason..." 
                      value={verificationModal.comment} 
                      onChange={e=>setVerificationModal(m=>({...m,comment:e.target.value}))} 
                      required
                    />
                  </div>
                )}
                <div className="flex justify-end gap-3 mt-6">
                  <button type="button" onClick={() => setVerificationModal({open:false,pkgId:null,reason:'',comment:''})} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #e5e7eb', background: '#fff', color: '#374151', cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
                  <button type="submit" style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: '#0ea5e9', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>Request Verification</button>
                </div>
              </form>
            </div>
          </div>
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
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
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

  const stats = useMemo(() => {
    let gross = 0;
    let expenses = 0;
    let net = 0;
    let pending = 0;

    handovers.forEach(h => {
      const hGross = h.grossCOD || ((h.amount || 0) + (h.expenseDeduction || 0));
      const hExp = h.expenseDeduction || 0;
      const hNet = h.amount || 0;
      gross += hGross;
      expenses += hExp;
      net += hNet;
      if (h.status === 'Pending Verification') pending += hNet;
    });

    return { gross, expenses, net, pending };
  }, [handovers]);

  const filteredHandovers = useMemo(() => {
    return handovers.filter(h => {
      if (search.trim()) {
        const s = search.toLowerCase().trim();
        const riderName = (h.riderId?.name || '').toLowerCase();
        const riderPhone = (h.riderId?.contact || h.riderId?.phone || '').toLowerCase();
        if (!riderName.includes(s) && !riderPhone.includes(s)) return false;
      }
      if (statusFilter !== 'all' && h.status !== statusFilter) return false;
      return true;
    });
  }, [handovers, search, statusFilter]);

  const filteredTotals = useMemo(() => {
    let gross = 0;
    let expenses = 0;
    let net = 0;
    let packages = 0;
    filteredHandovers.forEach(h => {
      gross += h.grossCOD || ((h.amount || 0) + (h.expenseDeduction || 0));
      expenses += h.expenseDeduction || 0;
      net += h.amount || 0;
      packages += h.packageIds?.length || 0;
    });
    return { gross, expenses, net, packages };
  }, [filteredHandovers]);

  if (loading) return <Spinner />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#111827', margin: 0 }}>COD Reconciliation & Rider Expenses</h2>
          <p style={{ margin: '2px 0 0', fontSize: 13, color: '#6b7280' }}>Track gross collections, rider expense deductions and verify net cash deposits.</p>
        </div>
        <ActionBtn onClick={() => fetchHandovers()} variant="ghost">↻ Refresh</ActionBtn>
      </div>

      {/* Summary KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: '16px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', marginBottom: 4 }}>Total Gross COD</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#1e293b' }}>Rs. {stats.gross.toLocaleString()}</div>
        </div>
        <div style={{ background: '#fffbeb', borderRadius: 12, border: '1px solid #fde68a', padding: '16px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#b45309', textTransform: 'uppercase', marginBottom: 4 }}>Total Rider Expenses</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#d97706' }}>- Rs. {stats.expenses.toLocaleString()}</div>
        </div>
        <div style={{ background: '#f0fdf4', borderRadius: 12, border: '1px solid #bbf7d0', padding: '16px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#15803d', textTransform: 'uppercase', marginBottom: 4 }}>Total Net Deposited</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#166534' }}>Rs. {stats.net.toLocaleString()}</div>
        </div>
        <div style={{ background: '#faf5ff', borderRadius: 12, border: '1px solid #e9d5ff', padding: '16px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#7e22ce', textTransform: 'uppercase', marginBottom: 4 }}>Pending Verification</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#9333ea' }}>Rs. {stats.pending.toLocaleString()}</div>
        </div>
      </div>

      <div style={cardStyle}>
        <div style={{ ...cardHeaderStyle, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#111827' }}>Pending & Completed Handovers</h3>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: '#6b7280' }}>
              Showing {filteredHandovers.length} of {handovers.length} records
            </p>
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search rider name, contact..."
              style={{ padding: '7px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 12, width: 200, outline: 'none' }}
            />
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              style={{ padding: '7px 10px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 12, outline: 'none' }}
            >
              <option value="all">All Statuses ({handovers.length})</option>
              <option value="Pending Verification">⏳ Pending</option>
              <option value="Verified">✓ Verified</option>
              <option value="Rejected">✕ Rejected</option>
            </select>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Date</th>
                <th style={thStyle}>Rider</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Gross COD</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Rider Expenses</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Net Cash Handover</th>
                <th style={{ ...thStyle, textAlign: 'center' }}>Packages</th>
                <th style={{ ...thStyle, textAlign: 'center' }}>Status</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredHandovers.length === 0 ? (
                <tr><td colSpan="8"><EmptyState message="No matching COD handovers found." /></td></tr>
              ) : (
                filteredHandovers.map(h => {
                  const gross = h.grossCOD || ((h.amount || 0) + (h.expenseDeduction || 0));
                  const expense = h.expenseDeduction || 0;
                  const net = h.amount || 0;

                  return (
                    <tr key={h._id} style={{ transition: 'background 0.1s' }} onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'} onMouseLeave={e => e.currentTarget.style.background = ''}>
                      <td style={tdStyle}>
                        <div style={{ fontWeight: 600, color: '#111827' }}>{new Date(h.createdAt).toLocaleDateString()}</div>
                        <div style={{ fontSize: 11, color: '#6b7280' }}>{new Date(h.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                      </td>
                      <td style={tdStyle}>
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>{h.riderId?.name || 'Rider'}</div>
                        <div style={{ fontSize: 11, color: '#6b7280' }}>{h.riderId?.contact || '-'}</div>
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 600, color: '#334155' }}>
                        Rs. {gross.toLocaleString()}
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'right' }}>
                        {expense > 0 ? (
                          <span style={{ color: '#b45309', background: '#fef3c7', padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700 }}>
                            - Rs. {expense.toLocaleString()}
                          </span>
                        ) : (
                          <span style={{ color: '#94a3b8', fontSize: 12 }}>Rs. 0</span>
                        )}
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'right' }}>
                        <span style={{ fontWeight: 800, color: '#15803d', fontSize: 15 }}>
                          Rs. {net.toLocaleString()}
                        </span>
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'center' }}>
                        <span style={{ background: '#f1f5f9', padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 700, color: '#475569' }}>
                          {h.packageIds?.length || 0}
                        </span>
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'center' }}>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${h.status === 'Verified' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : h.status === 'Rejected' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                          {h.status === 'Verified' && '✓ '}
                          {h.status}
                        </span>
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'right' }}>
                        {h.status === 'Pending Verification' ? (
                          <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                            <ActionBtn onClick={() => handleVerify(h._id, 'Verified')} variant="success" size="sm" disabled={verifying === h._id}>Verify</ActionBtn>
                            <ActionBtn onClick={() => handleVerify(h._id, 'Rejected')} variant="danger" size="sm" disabled={verifying === h._id}>Reject</ActionBtn>
                          </div>
                        ) : (
                          <span style={{ fontSize: 11, color: '#94a3b8', fontStyle: 'italic' }}>
                            By {h.verifiedBy?.name || 'Admin'}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {filteredHandovers.length > 0 && (
              <tfoot style={{ background: '#f8fafc', borderTop: '2px solid #e2e8f0', fontWeight: 700 }}>
                <tr>
                  <td colSpan="2" style={{ ...tdStyle, fontSize: 11, textTransform: 'uppercase', color: '#475569' }}>
                    Total Summary ({filteredHandovers.length} records)
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'right', color: '#1e293b' }}>
                    Rs. {filteredTotals.gross.toLocaleString()}
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'right', color: '#b45309' }}>
                    - Rs. {filteredTotals.expenses.toLocaleString()}
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'right', color: '#15803d', fontSize: 15 }}>
                    Rs. {filteredTotals.net.toLocaleString()}
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'center', color: '#475569' }}>
                    {filteredTotals.packages} pkgs
                  </td>
                  <td colSpan="2" style={tdStyle}></td>
                </tr>
              </tfoot>
            )}
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
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const notifs = [];
        
        // 1. Pending Pickups
        const pRes = await api.get('/dispatcher/pickups');
        const pickups = pRes.data.data || [];
        const pendingPickups = pickups.filter(p => p.status === 'pending');
        
        pendingPickups.forEach(p => {
          notifs.push({
            id: `pickup_${p._id}`,
            title: 'New Pickup Request',
            message: `${(p.vendorId?.vendorMeta?.shopName || p.vendorId?.name) || 'A vendor'} requested a pickup for ${p.packageId?.trackingCode || 'a package'}.`,
            time: p.requestedAt ? new Date(p.requestedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            read: false,
            icon: '🚚',
            path: '/dispatcher/tasks'
          });
        });

        // 2. Unassigned Deliveries (In Warehouse)
        const dRes = await api.get('/dispatcher/packages?status=all');
        const pkgs = dRes.data.data || [];
        const unassignedPkgs = pkgs.filter(p => p.status === 'In Warehouse' && !p.riderId);
        
        unassignedPkgs.forEach(p => {
          notifs.push({
            id: `pkg_${p._id}`,
            title: 'Ready for Delivery',
            message: `${p.trackingCode} is in warehouse and needs a rider.`,
            time: p.updatedAt ? new Date(p.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            read: false,
            icon: '📦',
            path: '/dispatcher/tasks'
          });
        });

        setNotifications(notifs.slice(0, 15));
      } catch (e) {
        console.error('Failed to fetch notifications:', e.message || e);
      }
    };
    
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);

    const handleNewNotif = (e) => {
      if (e.detail) {
        setNotifications(prev => [e.detail, ...prev]);
      }
    };
    window.addEventListener('app_notification', handleNewNotif);

    return () => {
      clearInterval(interval);
      window.removeEventListener('app_notification', handleNewNotif);
    };
  }, []);

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
