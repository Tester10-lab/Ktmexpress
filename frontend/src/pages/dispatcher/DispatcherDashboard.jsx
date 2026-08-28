import React, { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import { Routes, Route, useLocation, useNavigate, Navigate } from 'react-router-dom';
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

const SectionLoader = () => (
  <div className="flex items-center justify-center p-16">
    <div className="w-8 h-8 border-2 border-slate-200 border-t-slate-900 rounded-full animate-spin"></div>
  </div>
);

const ExpenseLog = React.lazy(() => import('../admin/sections/ExpenseLog'));

import {
  LayoutDashboard, Package, Truck, RotateCcw, Bike, Wallet, Receipt,
  Search, CheckCircle2, XCircle, Clock, AlertCircle, Eye,
  ChevronDown, ChevronUp, QrCode, RefreshCw, Filter, Check, X,
  Store, ArrowDownLeft, ArrowUpRight, Plus, FileSpreadsheet, Download, AlertTriangle
} from 'lucide-react';

// ─── Nav + Title Map ──────────────────────────────────────────────────────
const navLinks = [
  { name: 'Dashboard', path: '/dispatcher', exact: true, icon: <LayoutDashboard className="w-[18px] h-[18px]" /> },
  { name: 'Tasks (Pickup & Delivery)', path: '/dispatcher/tasks', icon: <Truck className="w-[18px] h-[18px]" /> },
  { name: 'Reverse Logistics', path: '/dispatcher/reverse-logistics', icon: <RotateCcw className="w-[18px] h-[18px]" /> },
  { name: 'Active Riders', path: '/dispatcher/riders', icon: <Bike className="w-[18px] h-[18px]" /> },
  { name: 'COD Handovers', path: '/dispatcher/handovers', icon: <Wallet className="w-[18px] h-[18px]" /> },
  { name: 'Rider Expenses', path: '/dispatcher/expenses', icon: <Receipt className="w-[18px] h-[18px]" /> },
];

const titleMap = {
  '/dispatcher/tasks':           'Tasks (Pickup & Delivery)',
  '/dispatcher/reverse-logistics': 'Reverse Logistics (RTV)',
  '/dispatcher/riders':          'Active Riders Overview',
  '/dispatcher/handovers':       'COD Reconciliation & Handover',
  '/dispatcher/expenses':        'Rider Expenses Log',
  '/dispatcher/scan-station':    'Warehouse Scan Station',
  '/dispatcher/inbound-scan':    'Inbound & Sorting Station',
  '/dispatcher':                 'Warehouse Management Overview',
};

// ─── Status Badge ─────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const base = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border";
  const styles = {
    'Delivered':           'bg-emerald-50 text-emerald-700 border-emerald-200',
    'In Warehouse':        'bg-slate-100 text-slate-800 border-slate-300',
    'Out for Delivery':    'bg-sky-50 text-sky-700 border-sky-200',
    'Picked Up':           'bg-amber-50 text-amber-700 border-amber-200',
    'Pick Up Requested':   'bg-amber-50 text-amber-700 border-amber-200',
    'Postponed':           'bg-orange-50 text-orange-700 border-orange-200',
    'Cancelled':           'bg-red-50 text-red-700 border-red-200',
    'Returned':            'bg-slate-100 text-slate-700 border-slate-200',
    'Returned to Vendor':  'bg-slate-100 text-slate-700 border-slate-200',
    'Pending':             'bg-amber-50 text-amber-700 border-amber-200',
    'Hold':                'bg-rose-50 text-rose-700 border-rose-200',
  };
  return (
    <span className={`${base} ${styles[status] || 'bg-slate-100 text-slate-700 border-slate-200'}`}>
      {status === 'Delivered' && '✓ '}
      {status === 'Cancelled' && '✕ '}
      {status}
    </span>
  );
}

function Spinner() {
  return (
    <div className="flex items-center justify-center p-12">
      <div className="w-7 h-7 border-2 border-slate-200 border-t-slate-900 rounded-full animate-spin"></div>
    </div>
  );
}

function EmptyState({ message, icon }) {
  return (
    <div className="text-center py-12 px-4 text-slate-400">
      <div className="text-4xl mb-3">{icon || '📭'}</div>
      <p className="m-0 text-sm font-medium text-slate-500">{message}</p>
    </div>
  );
}

const tableStyle = { width: '100%', borderCollapse: 'collapse', fontSize: 13 };
const thStyle = { padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #f1f5f9', background: '#f8fafc' };
const tdStyle = { padding: '12px 16px', borderBottom: '1px solid #f1f5f9', verticalAlign: 'middle' };
const cardStyle = { background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)', overflow: 'hidden', marginBottom: 24 };
const cardHeaderStyle = { padding: '16px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fff' };

function ActionBtn({ onClick, children, variant = 'primary', disabled = false, size = 'sm', icon }) {
  const colors = {
    primary: 'bg-slate-900 hover:bg-slate-800 text-white shadow-sm border border-transparent',
    secondary: 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-sm',
    success: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm border border-transparent',
    warning: 'bg-amber-600 hover:bg-amber-700 text-white shadow-sm border border-transparent',
    danger: 'bg-white hover:bg-red-50 text-red-600 border border-slate-200 hover:border-red-200 shadow-sm',
    ghost: 'bg-transparent hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-transparent',
  };
  
  const baseClasses = 'inline-flex items-center justify-center gap-1.5 font-semibold rounded-lg transition-all duration-150 active:scale-[0.98] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap';
  const sizeClasses = size === 'sm' ? 'py-1.5 px-3 text-xs' : 'py-2 px-4 text-sm';
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

  // Create Order, CSV Upload, & Excel Export states
  const [createModal, setCreateModal] = useState(false);
  const [csvModal, setCsvModal] = useState(false);
  const [vendors, setVendors] = useState([]);
  const [newPkg, setNewPkg] = useState({ vendorId: '', customerName: '', customerPhone: '', address: '', city: '', amount: '', weight: '0.5', deliveryDate: '' });
  const [csvVendorId, setCsvVendorId] = useState('');
  const [csvFile, setCsvFile] = useState(null);
  const [csvUploading, setCsvUploading] = useState(false);

  const fetchVendors = async () => {
    try {
      const res = await api.get('/admin/users?role=vendor');
      setVendors(res.data.data || []);
    } catch (e) {
      console.error('Failed to load vendors', e);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      setCreateModal(false);
      await api.post('/admin/packages', {
        ...newPkg,
        amount: Number(newPkg.amount),
        weight: Number(newPkg.weight),
        deliveryDate: newPkg.deliveryDate || null
      });
      showToast('Package created successfully', 'success');
      setNewPkg({ vendorId: '', customerName: '', customerPhone: '', address: '', city: '', amount: '', weight: '0.5', deliveryDate: '' });
      fetchAll();
    } catch (err) {
      showToast(err.message || 'Failed to create package', 'error');
      fetchAll();
    }
  };

  const downloadSampleCsv = () => {
    const headers = ['customer name', 'address', 'customerPhone', 'city', 'amount', 'weight', 'delivery charge', 'out of valley'];
    const sampleRow1 = ['Ram Sharma', 'New Road, Kathmandu', '9841234567', 'Kathmandu', '1500', '0.5', '100', 'false'];
    const sampleRow2 = ['Sita Thapa', 'Lakeside, Pokhara', '9801234567', 'Pokhara', '2500', '1.0', '200', 'true'];
    const csvContent = [headers.join(','), sampleRow1.join(','), sampleRow2.join(',')].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'bulk_upload_sample.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCsvUpload = async (e) => {
    e.preventDefault();
    if (!csvVendorId || !csvFile) return showToast('Select a vendor and file first', 'warning');
    setCsvUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', csvFile);
      formData.append('vendorId', csvVendorId);
      const res = await api.post('/admin/packages/upload-csv', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      const data = res.data;
      
      if (data.failedCount > 0) {
        if (data.importedCount > 0) {
          showToast(`Imported ${data.importedCount} packages. ${data.failedCount} failed.`, 'warning');
        } else {
          showToast(`Upload failed. All ${data.failedCount} rows had errors.`, 'error');
        }
      } else {
        showToast(data.message || 'CSV uploaded!', 'success');
      }
      
      setCsvModal(false);
      setCsvFile(null);
      setCsvVendorId('');
      fetchAll();
    } catch (err) { showToast(err.message || 'CSV upload failed', 'error'); }
    finally { setCsvUploading(false); }
  };

  const handleExportDailyExcel = async () => {
    try {
      showToast('Generating 2-Sheet Excel export...', 'info');
      const response = await api.get('/admin/export/daily-excel', {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      const fileName = `ktmexpress_daily_export_${new Date().toISOString().split('T')[0]}.xlsx`;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      showToast('Daily Excel file downloaded successfully!', 'success');
    } catch (err) {
      showToast('Failed to export Excel file: ' + (err.message || 'Error'), 'error');
    }
  };

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
    fetchVendors();
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
        if (statusFilter === 'verification_pending') {
          if (p.deliveryVerificationStatus !== 'Pending') return false;
        } else if (statusFilter === 'Postponed') {
          if (p.status !== 'Postponed') return false;
        } else if (p.status !== statusFilter) {
          return false;
        }
      }

      // 3. Rider Filter
      if (riderFilter !== 'all') {
        if (riderFilter === 'unassigned') {
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

  const handleAcceptVerify = async (pkg) => {
    const targetStatus = pkg.riderSubmission?.status || pkg.status;
    const targetAmount = pkg.riderSubmission?.amount !== undefined ? pkg.riderSubmission.amount : pkg.amount;
    const notes = pkg.riderSubmission?.comments || 'Accepted by Dispatcher';
    if (!window.confirm(`Accept & Verify changes for ${pkg.trackingCode}?\n• Status: ${targetStatus}\n• COD: Rs. ${targetAmount}\n• Reason/Notes: ${notes}`)) return;
    try {
      const payload = {
        version: pkg.__v,
        status: targetStatus,
        amount: targetAmount,
        deliveryCharge: pkg.deliveryCharge,
        comments: notes,
        paymentMethod: pkg.paymentMethod || 'Cash',
        reason: 'Dispatcher accepted verification',
        customRemarks: notes
      };
      await api.post(`/packages/${pkg._id}/verify-action`, payload);
      showToast(`✓ Package ${pkg.trackingCode} verified and changes accepted!`, 'success');
      fetchAll();
    } catch (e) {
      showToast(e.response?.data?.message || e.message || 'Failed to verify package', 'error');
    }
  };

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
  const countVerificationPending = packages.filter(p => p.deliveryVerificationStatus === 'Pending').length;
  const countInWarehouse = packages.filter(p => p.status === 'In Warehouse').length;
  const countOutForDelivery = packages.filter(p => p.status === 'Out for Delivery').length;
  const countDelivered = packages.filter(p => p.status === 'Delivered').length;
  const countPostponed = packages.filter(p => p.status === 'Postponed').length;
  const countPickups = packages.filter(p => ['Pending', 'Pick Up Requested', 'Picked Up'].includes(p.status)).length;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#111827', margin: 0 }}>Warehouse Dispatch Overview</h2>
          <p style={{ margin: '2px 0 0', fontSize: 13, color: '#6b7280' }}>Manage deliveries, search tracking codes & monitor active riders</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <button 
            type="button"
            className="btn-primary py-2 px-3.5 text-xs font-bold flex items-center gap-1.5 shadow-sm rounded-xl" 
            onClick={() => setCreateModal(true)}
          >
            <Plus className="w-4 h-4" /> Create Order
          </button>
          <button 
            type="button"
            className="btn-outline py-2 px-3.5 text-xs font-bold flex items-center gap-1.5 text-emerald-700 border-emerald-300 hover:bg-emerald-50 shadow-sm rounded-xl bg-white" 
            onClick={() => setCsvModal(true)}
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> CSV Upload
          </button>
          <button 
            type="button"
            className="btn-outline py-2 px-3.5 text-xs font-bold flex items-center gap-1.5 text-emerald-700 border-emerald-300 hover:bg-emerald-50 shadow-sm rounded-xl bg-white" 
            onClick={handleExportDailyExcel} 
            title="Export 2-Sheet Daily Excel Report"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Daily Excel
          </button>
          <ActionBtn onClick={() => setScannerOpen(true)} variant="primary" icon={<span style={{fontSize:16}}>📷</span>}>
            Scan Arrival
          </ActionBtn>
        </div>
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
          { label: 'Unassigned', value: s.unassigned || 0, color: '#64748b', icon: '📋', path: '/dispatcher/tasks' },
          { label: 'Out for Delivery', value: s.outForDelivery || 0, color: '#06b6d4', icon: '📦', path: '/dispatcher/tasks' },
          { label: 'Postponed', value: s.postponed || 0, color: '#ef4444', icon: '⚠️', path: '/dispatcher/tasks' },
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
                <option value="unassigned">📋 Unassigned (No Rider)</option>
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
              { id: 'verification_pending', label: '⏳ Verification Pending', count: countVerificationPending, color: '#d97706' },
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
                {['Tracking / Invoice', 'Vendor', 'Customer', 'Destination', 'Assigned Rider', 'Status', 'Verification', 'COD', 'Actions'].map(h => (
                  <th key={h} style={{ ...thStyle, textAlign: h === 'Actions' || h === 'COD' ? 'right' : 'left' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredPackages.length === 0 ? (
                <tr>
                  <td colSpan="9">
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
                      <span style={{ color: '#64748b', background: '#f1f5f9', border: '1px solid #e2e8f0', padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600 }}>
                        Unassigned
                      </span>
                    )}
                  </td>
                  <td style={tdStyle}><StatusBadge status={p.status} /></td>
                  <td style={tdStyle}>
                    {p.deliveryVerificationStatus === 'Pending' ? (
                      <div>
                        <span style={{ fontSize: 10, fontWeight: 700, color: '#b45309', background: '#fef3c7', border: '1px solid #fde68a', padding: '2px 6px', borderRadius: 4, display: 'inline-block' }}>
                          ⏳ Pending Verification
                        </span>
                        {p.riderSubmission && (
                          <div style={{ fontSize: 10, color: '#92400e', fontWeight: 600, marginTop: 2 }}>
                            To: {p.riderSubmission.status} (Rs. {p.riderSubmission.amount})
                          </div>
                        )}
                      </div>
                    ) : p.deliveryVerificationStatus === 'Verified' ? (
                      <span style={{ fontSize: 10, fontWeight: 600, color: '#059669', background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '2px 6px', borderRadius: 4 }}>
                        ✓ Verified
                      </span>
                    ) : (
                      <span style={{ fontSize: 10, color: '#94a3b8' }}>—</span>
                    )}
                  </td>
                  <td style={{ ...tdStyle, fontWeight: 700, color: '#0f172a', textAlign: 'right' }}>Rs. {p.amount?.toLocaleString()}</td>
                  <td style={{ ...tdStyle, textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', alignItems: 'center' }}>
                      {p.deliveryVerificationStatus === 'Pending' ? (
                        <button
                          onClick={() => handleAcceptVerify(p)}
                          style={{
                            background: '#059669',
                            color: '#fff',
                            border: 'none',
                            borderRadius: 6,
                            padding: '4px 10px',
                            fontSize: 11,
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            boxShadow: '0 1px 2px rgba(0,0,0,0.08)'
                          }}
                          title="Accept Rider Changes & Verify"
                        >
                          <CheckCircle2 style={{ width: 12, height: 12 }} /> Accept
                        </button>
                      ) : ['Delivered', 'Cancelled', 'Returned', 'Exchanged'].includes(p.status) && p.deliveryVerificationStatus !== 'Verified' ? (
                        <button
                          onClick={() => handleAcceptVerify(p)}
                          style={{
                            background: '#f1f5f9',
                            color: '#334155',
                            border: '1px solid #cbd5e1',
                            borderRadius: 6,
                            padding: '3px 8px',
                            fontSize: 11,
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                          title="Verify Status"
                        >
                          Verify
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Order Modal */}
      {createModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn" onClick={() => setCreateModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-scaleIn" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                <Plus className="w-5 h-5 text-brand-600" /> Create Single Order
              </h3>
              <button onClick={() => setCreateModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Select Vendor <span className="text-red-500">*</span></label>
                  <select className="input-field" required value={newPkg.vendorId} onChange={e => setNewPkg(f => ({ ...f, vendorId: e.target.value }))}>
                    <option value="">— Choose Vendor —</option>
                    {vendors.map(v => <option key={v._id} value={v._id}>{v.name} — {v.vendorMeta?.shopName || v.email}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Customer Name <span className="text-red-500">*</span></label>
                    <input type="text" className="input-field" required value={newPkg.customerName} onChange={e => setNewPkg(f => ({ ...f, customerName: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Address <span className="text-red-500">*</span></label>
                    <input type="text" className="input-field" required value={newPkg.address} onChange={e => setNewPkg(f => ({ ...f, address: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Customer Phone <span className="text-red-500">*</span></label>
                    <input type="text" className="input-field" required value={newPkg.customerPhone} onChange={e => setNewPkg(f => ({ ...f, customerPhone: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">City</label>
                    <input type="text" className="input-field" value={newPkg.city} onChange={e => setNewPkg(f => ({ ...f, city: e.target.value }))} />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-slate-100 pt-5">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Amount (COD) <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-medium text-sm">Rs.</span>
                      <input type="number" className="input-field pl-9" required value={newPkg.amount} onChange={e => setNewPkg(f => ({ ...f, amount: e.target.value }))} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Weight (KG)</label>
                    <input type="number" className="input-field" step="0.1" value={newPkg.weight} onChange={e => setNewPkg(f => ({ ...f, weight: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Delivery Date</label>
                    <input type="date" className="input-field" value={newPkg.deliveryDate} onChange={e => setNewPkg(f => ({ ...f, deliveryDate: e.target.value }))} />
                  </div>
                </div>
                <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 mt-6">
                  <button type="button" onClick={() => setCreateModal(false)} className="btn-secondary">Cancel</button>
                  <button type="submit" className="btn-primary">Create Order</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* CSV Upload Modal */}
      {csvModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn" onClick={() => setCsvModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-scaleIn" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" /> Bulk CSV Upload
              </h3>
              <button onClick={() => setCsvModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <form onSubmit={handleCsvUpload} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Select Vendor <span className="text-red-500">*</span></label>
                  <select className="input-field" required value={csvVendorId} onChange={e => setCsvVendorId(e.target.value)}>
                    <option value="">— Choose Vendor —</option>
                    {vendors.map(v => <option key={v._id} value={v._id}>{v.name} — {v.vendorMeta?.shopName || v.email}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Upload CSV File <span className="text-red-500">*</span></label>
                  <input type="file" className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100 transition-all border border-slate-200 rounded-xl p-2 cursor-pointer" accept=".csv" required onChange={e => setCsvFile(e.target.files[0])} />
                  <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1.5"><AlertTriangle className="w-4 h-4" /> Standard Columns</p>
                      <button type="button" onClick={downloadSampleCsv} className="text-xs text-amber-800 hover:text-amber-950 font-semibold underline flex items-center gap-1">
                        <Download className="w-3.5 h-3.5" /> Sample CSV
                      </button>
                    </div>
                    <p className="text-xs font-mono text-amber-700 leading-relaxed bg-white/50 p-2 rounded-lg border border-amber-100">
                      customer name, address, customerPhone, city, amount, weight, delivery charge, out of valley
                    </p>
                  </div>
                </div>
                <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 mt-6">
                  <button type="button" onClick={() => setCsvModal(false)} className="btn-secondary">Cancel</button>
                  <button type="submit" className="btn-primary flex items-center gap-2" disabled={csvUploading}>
                    {csvUploading ? 'Uploading...' : 'Upload & Import'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
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
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVendors, setSelectedVendors] = useState({});
  const [selectedRiders, setSelectedRiders] = useState({});
  const { showToast } = useToast();

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const r = await api.get('/dispatcher/packages?status=Returned,Cancelled,Exchanged,Returned to Vendor');
      setPackages(r.data.data || []);
    } catch { 
      showToast('Failed to load return packages', 'error'); 
    } finally { 
      setLoading(false); 
    }
  }, [showToast]);

  useEffect(() => { 
    fetchData(); 
  }, [fetchData]);

  const confirmStep = async (packageId, type) => {
    setActionLoading(s => ({ ...s, [packageId]: type }));
    try {
      await api.put('/dispatcher/confirm-return', { packageId, type });
      showToast(type === 'rider' ? '✓ Inbound package received from rider' : '✓ Returned to vendor signoff complete', 'success');
      fetchData(true);
    } catch (e) { 
      showToast(e.response?.data?.message || e.message || 'Action failed', 'error'); 
    } finally { 
      setActionLoading(s => ({ ...s, [packageId]: null })); 
    }
  };

  const bulkRiderReceive = async (riderKey, pkgIds) => {
    setActionLoading(s => ({ ...s, [riderKey]: 'bulk_rider' }));
    try {
      for (const id of pkgIds) {
        await api.put('/dispatcher/confirm-return', { packageId: id, type: 'rider' });
      }
      showToast(`✓ Received ${pkgIds.length} return package(s) from rider`, 'success');
      fetchData(true);
    } catch (e) {
      showToast(e.response?.data?.message || e.message || 'Failed to receive packages', 'error');
    } finally {
      setActionLoading(s => ({ ...s, [riderKey]: null }));
    }
  };

  const bulkVendorHandover = async (vendorId, packageIds) => {
    setActionLoading(s => ({ ...s, [vendorId]: 'bulk_vendor' }));
    try {
      await api.put('/dispatcher/bulk-vendor-handover', { packageIds });
      showToast(`✓ Handover of ${packageIds.length} package(s) to vendor complete!`, 'success');
      fetchData(true);
    } catch (e) { 
      showToast(e.response?.data?.message || e.message || 'Handover failed', 'error'); 
    } finally { 
      setActionLoading(s => ({ ...s, [vendorId]: null })); 
    }
  };

  // Filter partitions
  const pendingRider = packages.filter(p => !p.rtvSignoff?.riderReturned);
  const pendingVendor = packages.filter(p => p.rtvSignoff?.riderReturned && !p.rtvSignoff?.vendorReceived);
  const complete = packages.filter(p => p.rtvSignoff?.riderReturned && p.rtvSignoff?.vendorReceived);

  // Search filtering
  const applySearch = (list) => {
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(p => 
      p.trackingCode?.toLowerCase().includes(q) ||
      p.invoiceId?.toLowerCase().includes(q) ||
      p.customerName?.toLowerCase().includes(q) ||
      p.customerPhone?.toLowerCase().includes(q) ||
      (p.vendorId?.vendorMeta?.shopName || p.vendorId?.name || '').toLowerCase().includes(q) ||
      (p.riderId?.name || '').toLowerCase().includes(q)
    );
  };

  // Group pendingRider by Rider
  const filteredPendingRider = applySearch(pendingRider);
  const riderGroups = filteredPendingRider.reduce((acc, p) => {
    const riderName = p.riderId?.name || 'Unassigned';
    const riderId = p.riderId?._id || 'unassigned';
    if (!acc[riderName]) acc[riderName] = { riderId, riderName, packages: [] };
    acc[riderName].packages.push(p);
    return acc;
  }, {});

  // Group pendingVendor by Vendor
  const filteredPendingVendor = applySearch(pendingVendor);
  const vendorGroups = filteredPendingVendor.reduce((acc, p) => {
    const vendorId = p.vendorId?._id || 'unknown';
    const shopName = p.vendorId?.vendorMeta?.shopName || p.vendorId?.name || 'Unknown Vendor';
    const contact = p.vendorId?.contact || p.vendorId?.email || '';
    if (!acc[vendorId]) acc[vendorId] = { shopName, contact, packages: [] };
    acc[vendorId].packages.push(p);
    return acc;
  }, {});

  const toggleVendor = (vId) => {
    setSelectedVendors(prev => ({ ...prev, [vId]: !prev[vId] }));
  };

  const toggleRider = (rName) => {
    setSelectedRiders(prev => ({ ...prev, [rName]: !prev[rName] }));
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* ── Top Stat Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Returns (RTV)</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{packages.length}</p>
            <p className="text-xs text-slate-500 mt-1">Returned, Cancelled & Exchanged</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
            <RotateCcw className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-amber-500">Inbound From Riders</p>
            <p className="text-2xl font-bold text-amber-600 mt-1">{pendingRider.length}</p>
            <p className="text-xs text-slate-500 mt-1">Awaiting warehouse check-in</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <ArrowDownLeft className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-sky-500">Ready for Vendor</p>
            <p className="text-2xl font-bold text-sky-600 mt-1">{pendingVendor.length}</p>
            <p className="text-xs text-slate-500 mt-1">Checked in, ready for handover</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
            <ArrowUpRight className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-500">Handover Complete</p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">{complete.length}</p>
            <p className="text-xs text-slate-500 mt-1">Returned to vendor verified</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* ── Filter Tabs & Search Bar ── */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Navigation Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            {[
              { key: 'pending_rider', label: 'Receive from Rider', count: pendingRider.length, icon: Bike },
              { key: 'pending_vendor', label: 'Handover to Vendor', count: pendingVendor.length, icon: Store },
              { key: 'complete', label: 'Completed RTV', count: complete.length, icon: CheckCircle2 },
              { key: 'all', label: 'All Returns', count: packages.length, icon: RotateCcw },
            ].map(tab => {
              const Icon = tab.icon;
              const active = filter === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                    active
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/60'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${active ? 'text-white' : 'text-slate-500'}`} />
                  <span>{tab.label}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                    active ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search & Refresh */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 md:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search tracking, shop, customer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <button
              onClick={() => fetchData()}
              disabled={loading}
              className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 rounded-xl transition-all flex items-center justify-center shrink-0"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-slate-900' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Main View Container ── */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-16 flex flex-col items-center justify-center text-center">
          <div className="w-8 h-8 border-2 border-slate-200 border-t-slate-900 rounded-full animate-spin mb-3"></div>
          <p className="text-xs font-semibold text-slate-500">Loading reverse logistics data...</p>
        </div>
      ) : (
        <>
          {/* TAB 1: RECEIVE FROM RIDERS */}
          {filter === 'pending_rider' && (
            <div className="space-y-4">
              {Object.keys(riderGroups).length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center">
                  <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">All Inbound Returns Received</h4>
                  <p className="text-xs text-slate-500 mt-1">No packages are currently waiting to be checked in from delivery riders.</p>
                </div>
              ) : (
                Object.entries(riderGroups).map(([riderName, { riderId, packages: pkgs }]) => {
                  const isExpanded = selectedRiders[riderName] !== false; // expanded by default
                  return (
                    <div key={riderName} className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                      {/* Rider Header */}
                      <div className="px-5 py-4 bg-slate-50/70 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
                        <div 
                          className="flex items-center gap-3 cursor-pointer select-none"
                          onClick={() => toggleRider(riderName)}
                        >
                          <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-sm">
                            <Bike className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-bold text-slate-900">{riderName}</h4>
                              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">
                                {pkgs.length} return{pkgs.length !== 1 ? 's' : ''}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500">Rider physical return check-in</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => bulkRiderReceive(riderName, pkgs.map(p => p._id))}
                            disabled={actionLoading[riderName] === 'bulk_rider'}
                            className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold transition-all shadow-xs flex items-center gap-1.5"
                          >
                            <Check className="w-3.5 h-3.5" />
                            {actionLoading[riderName] === 'bulk_rider' ? 'Receiving...' : `Receive All (${pkgs.length})`}
                          </button>
                          <button
                            onClick={() => toggleRider(riderName)}
                            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition-colors"
                          >
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      {/* Package Table */}
                      {isExpanded && (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse text-xs">
                            <thead>
                              <tr className="border-b border-slate-100 bg-slate-50/40 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                                <th className="py-3 px-4">Tracking & Invoice</th>
                                <th className="py-3 px-4">Customer Details</th>
                                <th className="py-3 px-4">Vendor Shop</th>
                                <th className="py-3 px-4">Status</th>
                                <th className="py-3 px-4">Return Reason</th>
                                <th className="py-3 px-4 text-right">Action</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {pkgs.map(p => (
                                <tr key={p._id} className="hover:bg-slate-50/60 transition-colors">
                                  <td className="py-3 px-4 font-medium">
                                    <TrackingLink code={p.trackingCode} />
                                    {p.invoiceId && (
                                      <span className="block text-[11px] text-slate-400 font-mono mt-0.5">
                                        INV: {p.invoiceId}
                                      </span>
                                    )}
                                  </td>
                                  <td className="py-3 px-4">
                                    <div className="font-semibold text-slate-800">{p.customerName || '—'}</div>
                                    <div className="text-slate-500 text-[11px]">{p.customerPhone || '—'}</div>
                                  </td>
                                  <td className="py-3 px-4">
                                    <div className="font-semibold text-slate-800">
                                      {p.vendorId?.vendorMeta?.shopName || p.vendorId?.name || '—'}
                                    </div>
                                    <div className="text-slate-400 text-[11px] truncate max-w-[150px]">
                                      {p.address || ''}
                                    </div>
                                  </td>
                                  <td className="py-3 px-4">
                                    <StatusBadge status={p.status} />
                                  </td>
                                  <td className="py-3 px-4">
                                    <span className="text-slate-600 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                                      {p.comments?.[p.comments.length - 1]?.text || (typeof p.comments === 'string' ? p.comments : '') || 'Customer return'}
                                    </span>
                                  </td>
                                  <td className="py-3 px-4 text-right">
                                    <button
                                      onClick={() => confirmStep(p._id, 'rider')}
                                      disabled={actionLoading[p._id] === 'rider'}
                                      className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-lg text-xs font-semibold transition-all inline-flex items-center gap-1"
                                    >
                                      <Check className="w-3 h-3" />
                                      {actionLoading[p._id] === 'rider' ? 'Checking in...' : 'Confirm Received'}
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* TAB 2: VENDOR HANDOVER */}
          {filter === 'pending_vendor' && (
            <div className="space-y-4">
              {Object.keys(vendorGroups).length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center">
                  <div className="w-12 h-12 rounded-full bg-sky-50 text-sky-600 flex items-center justify-center mx-auto mb-3">
                    <Store className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">No Packages Pending Vendor Return</h4>
                  <p className="text-xs text-slate-500 mt-1">All checked-in return packages have been handed back to their respective vendors.</p>
                </div>
              ) : (
                Object.entries(vendorGroups).map(([vendorId, { shopName, contact, packages: pkgs }]) => {
                  const isExpanded = selectedVendors[vendorId] !== false; // expanded by default
                  return (
                    <div key={vendorId} className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                      {/* Vendor Header */}
                      <div className="px-5 py-4 bg-slate-50/70 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
                        <div 
                          className="flex items-center gap-3 cursor-pointer select-none"
                          onClick={() => toggleVendor(vendorId)}
                        >
                          <div className="w-9 h-9 rounded-xl bg-sky-100 text-sky-800 flex items-center justify-center font-bold text-sm">
                            <Store className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-bold text-slate-900">{shopName}</h4>
                              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-sky-100 text-sky-800">
                                {pkgs.length} item{pkgs.length !== 1 ? 's' : ''} to return
                              </span>
                            </div>
                            <p className="text-xs text-slate-500">{contact || 'Vendor Store'}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => bulkVendorHandover(vendorId, pkgs.map(p => p._id))}
                            disabled={actionLoading[vendorId] === 'bulk_vendor'}
                            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition-all shadow-xs flex items-center gap-1.5"
                          >
                            <Check className="w-3.5 h-3.5" />
                            {actionLoading[vendorId] === 'bulk_vendor' ? 'Handing over...' : `Handover All to Vendor (${pkgs.length})`}
                          </button>
                          <button
                            onClick={() => toggleVendor(vendorId)}
                            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition-colors"
                          >
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      {/* Package Table */}
                      {isExpanded && (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse text-xs">
                            <thead>
                              <tr className="border-b border-slate-100 bg-slate-50/40 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                                <th className="py-3 px-4">Tracking & Invoice</th>
                                <th className="py-3 px-4">Customer</th>
                                <th className="py-3 px-4">Status</th>
                                <th className="py-3 px-4">Return Reason</th>
                                <th className="py-3 px-4">Warehouse Checked-in</th>
                                <th className="py-3 px-4 text-right">Action</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {pkgs.map(p => (
                                <tr key={p._id} className="hover:bg-slate-50/60 transition-colors">
                                  <td className="py-3 px-4 font-medium">
                                    <TrackingLink code={p.trackingCode} />
                                    {p.invoiceId && (
                                      <span className="block text-[11px] text-slate-400 font-mono mt-0.5">
                                        INV: {p.invoiceId}
                                      </span>
                                    )}
                                  </td>
                                  <td className="py-3 px-4">
                                    <div className="font-semibold text-slate-800">{p.customerName || '—'}</div>
                                    <div className="text-slate-500 text-[11px]">{p.customerPhone || '—'}</div>
                                  </td>
                                  <td className="py-3 px-4">
                                    <StatusBadge status={p.status} />
                                  </td>
                                  <td className="py-3 px-4">
                                    <span className="text-slate-600 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                                      {p.comments?.[p.comments.length - 1]?.text || (typeof p.comments === 'string' ? p.comments : '') || 'Return to Vendor'}
                                    </span>
                                  </td>
                                  <td className="py-3 px-4">
                                    <span className="inline-flex items-center gap-1 text-emerald-700 font-medium text-[11px]">
                                      <CheckCircle2 className="w-3.5 h-3.5" /> Received
                                    </span>
                                  </td>
                                  <td className="py-3 px-4 text-right">
                                    <button
                                      onClick={() => confirmStep(p._id, 'vendor')}
                                      disabled={actionLoading[p._id] === 'vendor'}
                                      className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-semibold transition-all inline-flex items-center gap-1"
                                    >
                                      <Check className="w-3 h-3" />
                                      {actionLoading[p._id] === 'vendor' ? 'Processing...' : 'Handover to Vendor'}
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* TAB 3 & 4: COMPLETED & ALL */}
          {(filter === 'complete' || filter === 'all') && (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    {filter === 'complete' ? 'Completed Reverse Logistics' : 'All Return Packages'}
                  </h4>
                  <p className="text-xs text-slate-500">
                    {filter === 'complete' 
                      ? 'Packages with completed rider return and vendor handover' 
                      : 'Complete audit log of all return-path shipments'}
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200/80">
                  {applySearch(filter === 'complete' ? complete : packages).length} total
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/40 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                      <th className="py-3 px-4">Tracking Code</th>
                      <th className="py-3 px-4">Customer</th>
                      <th className="py-3 px-4">Vendor Shop</th>
                      <th className="py-3 px-4">Assigned Rider</th>
                      <th className="py-3 px-4">Current Status</th>
                      <th className="py-3 px-4">RTV Stage</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {applySearch(filter === 'complete' ? complete : packages).length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-slate-400">
                          No packages matching your criteria.
                        </td>
                      </tr>
                    ) : (
                      applySearch(filter === 'complete' ? complete : packages).map(p => (
                        <tr key={p._id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3 px-4 font-medium">
                            <TrackingLink code={p.trackingCode} />
                            {p.invoiceId && (
                              <span className="block text-[11px] text-slate-400 font-mono mt-0.5">
                                INV: {p.invoiceId}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-semibold text-slate-800">{p.customerName || '—'}</div>
                            <div className="text-slate-500 text-[11px]">{p.customerPhone || '—'}</div>
                          </td>
                          <td className="py-3 px-4 font-medium text-slate-800">
                            {p.vendorId?.vendorMeta?.shopName || p.vendorId?.name || '—'}
                          </td>
                          <td className="py-3 px-4 text-slate-600">
                            {p.riderId?.name || 'Unassigned'}
                          </td>
                          <td className="py-3 px-4">
                            <StatusBadge status={p.status} />
                          </td>
                          <td className="py-3 px-4">
                            {p.rtvSignoff?.riderReturned && p.rtvSignoff?.vendorReceived ? (
                              <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-semibold text-[11px] border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3" /> Returned to Vendor
                              </span>
                            ) : p.rtvSignoff?.riderReturned ? (
                              <span className="inline-flex items-center gap-1 text-sky-700 bg-sky-50 px-2 py-0.5 rounded-full font-semibold text-[11px] border border-sky-200">
                                <Clock className="w-3 h-3" /> In Warehouse (Ready for Vendor)
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full font-semibold text-[11px] border border-amber-200">
                                <Clock className="w-3 h-3" /> Inbound from Rider
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            {!p.rtvSignoff?.riderReturned && (
                              <button
                                onClick={() => confirmStep(p._id, 'rider')}
                                disabled={actionLoading[p._id] === 'rider'}
                                className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-lg text-xs font-semibold transition-all inline-flex items-center gap-1"
                              >
                                Receive
                              </button>
                            )}
                            {p.rtvSignoff?.riderReturned && !p.rtvSignoff?.vendorReceived && (
                              <button
                                onClick={() => confirmStep(p._id, 'vendor')}
                                disabled={actionLoading[p._id] === 'vendor'}
                                className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-semibold transition-all inline-flex items-center gap-1"
                              >
                                Handover
                              </button>
                            )}
                            {p.rtvSignoff?.riderReturned && p.rtvSignoff?.vendorReceived && (
                              <span className="text-emerald-600 font-semibold text-xs">✓ Complete</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
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
  const [historySearch, setHistorySearch] = useState('');
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

  const handleVerifyDelivery = async (pkg) => {
    if (!window.confirm(`Accept & Verify delivery for tracking code ${pkg.trackingCode}?`)) return;
    try {
      const payload = {
        version: pkg.__v,
        status: pkg.riderSubmission?.status || pkg.status,
        amount: pkg.riderSubmission?.amount !== undefined ? pkg.riderSubmission.amount : pkg.amount,
        deliveryCharge: pkg.deliveryCharge,
        comments: pkg.riderSubmission?.comments || pkg.comments,
        paymentMethod: pkg.paymentMethod || 'Cash',
        reason: 'Dispatcher verification',
        customRemarks: 'Verified and accepted by Dispatcher'
      };
      await api.post(`/packages/${pkg._id}/verify-action`, payload);
      showToast(`✓ Package ${pkg.trackingCode} verified and accepted!`, 'success');
      if (selectedRider) fetchRiderHistory(selectedRider._id, historyFilters);
    } catch (err) {
      showToast(err.response?.data?.message || err.message || "Failed to verify package", "error");
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

                  {/* Filters & Search */}
                  <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                    
                    {/* Search Row */}
                    <div>
                      <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: '#4b5563', textTransform: 'uppercase', marginBottom: 4 }}>Search History</label>
                      <input 
                        type="text"
                        placeholder="Search by tracking code, customer name, phone, vendor shop, or address..."
                        style={{ width: '100%', padding: '6px 12px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 12, background: '#fff' }}
                        value={historySearch}
                        onChange={(e) => setHistorySearch(e.target.value)}
                      />
                    </div>

                    {/* Filter Controls Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
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
                          style={{ width: '100%', padding: '4px 8px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 12 }}
                          value={historyFilters.startDate}
                          onChange={(e) => setHistoryFilters({ ...historyFilters, startDate: e.target.value })}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: '#4b5563', textTransform: 'uppercase', marginBottom: 4 }}>End Date</label>
                        <input 
                          type="date"
                          style={{ width: '100%', padding: '4px 8px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 12 }}
                          value={historyFilters.endDate}
                          onChange={(e) => setHistoryFilters({ ...historyFilters, endDate: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Packages Table */}
                  {(() => {
                    const filteredHistoryPackages = (riderHistory.packages || []).filter(p => {
                      if (!historySearch.trim()) return true;
                      const s = historySearch.toLowerCase();
                      const tc = (p.trackingCode || '').toLowerCase();
                      const cn = (p.customerName || '').toLowerCase();
                      const cp = (p.customerPhone || '').toLowerCase();
                      const vn = ((p.vendorId?.vendorMeta?.shopName || p.vendorId?.name) || '').toLowerCase();
                      const addr = (p.address || '').toLowerCase();
                      return tc.includes(s) || cn.includes(s) || cp.includes(s) || vn.includes(s) || addr.includes(s);
                    });

                    return (
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
                              {filteredHistoryPackages.length === 0 ? (
                                <tr>
                                  <td colSpan="6" style={{ ...tdStyle, textAlign: 'center', padding: '40px 0', color: '#9ca3af' }}>
                                    No historical packages match the selected criteria.
                                  </td>
                                </tr>
                              ) : (
                                filteredHistoryPackages.map(p => {
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
                                        {p.deliveryVerificationStatus === 'Pending' ? (
                                          <button 
                                            onClick={() => handleVerifyDelivery(p)}
                                            style={{ 
                                              background: '#ecfdf5', 
                                              border: '1px solid #a7f3d0', 
                                              color: '#047857', 
                                              fontWeight: 700, 
                                              cursor: 'pointer', 
                                              padding: '4px 10px',
                                              borderRadius: '6px',
                                              fontSize: '11px',
                                              display: 'flex',
                                              alignItems: 'center',
                                              gap: '4px'
                                            }}
                                            title="Accept & Verify Rider Submission"
                                          >
                                            <CheckCircle2 style={{ width: 12, height: 12 }} /> Accept & Verify
                                          </button>
                                        ) : p.deliveryVerificationStatus === 'Verified' ? (
                                          <span style={{ fontSize: '11px', fontWeight: 600, color: '#059669', background: '#ecfdf5', padding: '2px 8px', borderRadius: '4px', border: '1px solid #a7f3d0' }}>
                                            ✓ Verified
                                          </span>
                                        ) : ['Delivered', 'Cancelled', 'Returned', 'Exchanged'].includes(p.status) ? (
                                          <button 
                                            onClick={() => handleVerifyDelivery(p)}
                                            style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', color: '#334155', fontWeight: 600, cursor: 'pointer', padding: '3px 8px', borderRadius: '6px', fontSize: '11px' }}
                                            title="Verify Status"
                                          >
                                            Verify
                                          </button>
                                        ) : null}
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
                    );
                  })()}

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
    let cash = 0;
    let online = 0;
    let pending = 0;

    handovers.forEach(h => {
      const hGross = h.grossCOD || ((h.amount || 0) + (h.expenseDeduction || 0));
      const hExp = h.expenseDeduction || 0;
      const hNet = h.amount || 0;
      const hCash = h.cashAmount !== undefined ? h.cashAmount : (h.onlineAmount ? Math.max(0, hNet - h.onlineAmount) : hNet);
      const hOnline = h.onlineAmount || 0;
      gross += hGross;
      expenses += hExp;
      net += hNet;
      cash += hCash;
      online += hOnline;
      if (h.status === 'Pending Verification') pending += hNet;
    });

    return { gross, expenses, net, cash, online, pending };
  }, [handovers]);

  const filteredHandovers = useMemo(() => {
    return handovers.filter(h => {
      if (search.trim()) {
        const s = search.toLowerCase().trim();
        const riderName = (h.riderId?.name || '').toLowerCase();
        const riderPhone = (h.riderId?.contact || h.riderId?.phone || '').toLowerCase();
        const ref = (h.onlineReference || '').toLowerCase();
        if (!riderName.includes(s) && !riderPhone.includes(s) && !ref.includes(s)) return false;
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
          <p style={{ margin: '2px 0 0', fontSize: 13, color: '#6b7280' }}>Track gross collections, cash & online payment split, and verify net deposits.</p>
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
          <div style={{ fontSize: 11, color: '#15803d', marginTop: 4, fontWeight: 600 }}>
            💵 Cash: Rs. {stats.cash.toLocaleString()} | 📱 Online: Rs. {stats.online.toLocaleString()}
          </div>
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
              placeholder="Search rider, phone, ref..."
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
                <th style={{ ...thStyle, textAlign: 'right' }}>Net Handover (Cash / Online)</th>
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
                  const cash = h.cashAmount !== undefined ? h.cashAmount : (h.onlineAmount ? Math.max(0, net - h.onlineAmount) : net);
                  const online = h.onlineAmount || 0;

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
                        <span style={{ fontWeight: 800, color: '#15803d', fontSize: 15, display: 'block' }}>
                          Rs. {net.toLocaleString()}
                        </span>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 4, alignItems: 'flex-end' }}>
                          <span style={{ fontSize: 11, color: '#047857', background: '#ecfdf5', padding: '1px 6px', borderRadius: 4, fontWeight: 600 }}>
                            💵 Cash: Rs. {cash.toLocaleString()}
                          </span>
                          {online > 0 && (
                            <span style={{ fontSize: 11, color: '#0369a1', background: '#f0f9ff', padding: '1px 6px', borderRadius: 4, fontWeight: 600 }} title={h.onlineReference ? `Ref: ${h.onlineReference}` : 'Online payment'}>
                              📱 Online: Rs. {online.toLocaleString()} {h.onlineReference ? `(${h.onlineReference})` : ''}
                            </span>
                          )}
                        </div>
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

        // 3. Pending Verifications (excluding Delivered packages)
        const pendingVerifications = pkgs.filter(p => 
          p.deliveryVerificationStatus === 'Pending' && 
          p.status !== 'Delivered' && 
          p.riderSubmission?.status !== 'Delivered'
        );
        pendingVerifications.forEach(p => {
          notifs.push({
            id: `verify_${p._id}`,
            title: 'Verification Pending',
            message: `Package ${p.trackingCode} (${p.riderSubmission?.status || p.status}) requires verification.`,
            time: p.riderSubmission?.submittedAt ? new Date(p.riderSubmission.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            read: false,
            icon: '⏳',
            path: '/dispatcher'
          });
        });

        // 4. Pending Rider Expenses
        try {
          const expRes = await api.get('/dispatcher/expenses?limit=50&status=Pending');
          const pendingExpenses = expRes.data.data || [];
          pendingExpenses.forEach(e => {
            notifs.push({
              id: `exp_${e._id}`,
              title: 'Rider Expense',
              message: `${e.riderId?.name || 'A rider'} logged Rs. ${e.amount} for ${e.category}`,
              time: new Date(e.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              read: false,
              icon: '🏍️',
              path: '/dispatcher/expenses'
            });
          });
        } catch (err) {
          // ignore notification errors
        }

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
      <Suspense fallback={<SectionLoader />}>
        <Routes>
          <Route path="/" element={<DispatcherHome />} />
          <Route path="/packages" element={<Navigate to="/dispatcher" replace />} />
          <Route path="/tasks" element={<CombinedTasks />} />
          <Route path="/scan-station" element={<ScanStation role="dispatcher" />} />
          <Route path="/inbound-scan" element={<InboundScan />} />
          <Route path="/reverse-logistics" element={<ReverseLogistics />} />
          <Route path="/riders" element={<ActiveRiders />} />
          <Route path="/handovers" element={<CodHandovers />} />
          <Route path="/expenses" element={<ExpenseLog />} />
        </Routes>
      </Suspense>
    </AppShell>
  );
};

export default DispatcherDashboard;
