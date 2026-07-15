import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import api from '../../../api/axios';
import MetricCard from '../../../components/MetricCard';
import { useToast } from '../../../store/ToastContext';
import ScanStation from '../../../components/ScanStation';
import Pagination from '../../../components/Pagination';
import TrackingLink from '../../../components/TrackingLink';
import { 

  LayoutDashboard, Wallet, Receipt, Users, Settings2, Activity, 
  Package, LayoutGrid, BarChart3, Truck, Factory, AlertTriangle, 
  MapPin, CheckCircle2, XCircle, Search, RefreshCw, Plus, FileSpreadsheet,
  Edit2, Trash2, Check, X, Bell, History, Sliders, ChevronDown, ChevronUp
} from 'lucide-react';

import { VerificationStatusBadge, VerificationPriorityBadge } from '../../../components/verification/VerificationRequestBadge';
import { VerificationAudit } from '../../../components/verification/VerificationAudit';

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

const AdminPackages = () => {
  const navigate = useNavigate();
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [verificationStatusFilter, setVerificationStatusFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [trackingCode, setTrackingCode] = useState('');
  const [vendor, setVendor] = useState('');
  const [customer, setCustomer] = useState('');
  const [rider, setRider] = useState('');
  const [riders, setRiders] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [pagination, setPagination] = useState(null);
  const [selected, setSelected] = useState([]);
  const { showToast } = useToast();

  const [editModal, setEditModal] = useState(false);
  const [editPkg, setEditPkg] = useState(null);
  const [editReason, setEditReason] = useState('');

  const [expandedAudits, setExpandedAudits] = useState(new Set());
  const toggleAudit = (pkgId) => {
    const newSet = new Set(expandedAudits);
    if (newSet.has(pkgId)) newSet.delete(pkgId);
    else newSet.add(pkgId);
    setExpandedAudits(newSet);
  };

  const [createModal, setCreateModal] = useState(false);
  const [csvModal, setCsvModal] = useState(false);
  const [vendors, setVendors] = useState([]);
  const [newPkg, setNewPkg] = useState({ vendorId: '', customerName: '', customerPhone: '', address: '', city: '', amount: '', weight: '0.5', deliveryDate: '' });
  const [csvVendorId, setCsvVendorId] = useState('');
  const [csvFile, setCsvFile] = useState(null);
  const [csvUploading, setCsvUploading] = useState(false);

  const fetchPackages = (silent = false) => {
    if (!silent) setLoading(true);
    const q = new URLSearchParams({ page, limit });
    if (search) q.append('search', search);
    if (statusFilter) q.append('status', statusFilter);
    if (verificationStatusFilter) q.append('verificationStatus', verificationStatusFilter);
    if (startDate) q.append('startDate', startDate);
    if (endDate) q.append('endDate', endDate);
    if (trackingCode) q.append('trackingCode', trackingCode);
    if (vendor) q.append('vendor', vendor);
    if (customer) q.append('customer', customer);
    if (rider) q.append('rider', rider);
    
    api.get(`/admin/packages?${q.toString()}`)
      .then(r => {
        setPackages(r.data.data || []);
        setPagination(r.data.pagination);
      })
      .catch(() => showToast('Failed to load packages', 'error'))
      .finally(() => setLoading(false));
  };

  const fetchVendors = () => {
    api.get('/admin/users?role=vendor&limit=500').then(r => {
      setVendors((r.data.data || []).filter(u => u.role === 'vendor'));
    });
  };

  const fetchRiders = () => {
    api.get('/admin/users?role=rider&limit=500').then(r => {
      setRiders((r.data.data || []).filter(u => u.role === 'rider'));
    });
  };

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('');
    setVerificationStatusFilter('');
    setStartDate('');
    setEndDate('');
    setTrackingCode('');
    setVendor('');
    setCustomer('');
    setRider('');
    setPage(1);
    setTimeout(() => {
      setPage(prev => {
        if (prev === 1) fetchPackages();
        return 1;
      });
    }, 0);
  };

  useEffect(() => { fetchPackages(); }, [page, limit]);
  useEffect(() => { fetchVendors(); fetchRiders(); }, []);
  
  const openEdit = (pkg) => {
    setEditPkg({ ...pkg, deliveryDate: pkg.deliveryDate ? new Date(pkg.deliveryDate).toISOString().split('T')[0] : '' });
    setEditReason('');
    setEditModal(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    const payload = {
      customerName: editPkg.customerName,
      customerPhone: editPkg.customerPhone,
      address: editPkg.address,
      city: editPkg.city,
      amount: Number(editPkg.amount),
      weight: Number(editPkg.weight),
      deliveryDate: editPkg.deliveryDate || null,
      status: editPkg.status,
      reason: editReason
    };

    setPackages(prev => prev.map(p => p._id === editPkg._id ? { ...p, ...payload } : p));

    try {
      setEditModal(false); 
      await api.put(`/admin/packages/${editPkg._id}`, payload);
      showToast('Package updated successfully', 'success');
      fetchPackages(true);
    } catch (err) {
      showToast(err.message || 'Failed to update package', 'error');
      fetchPackages(true);
    }
  };

  const handleDelete = async (id, trackingCode) => {
    if (!window.confirm(`Delete package "${trackingCode}"? This will soft-delete it.`)) return;
    
    setPackages(prev => prev.filter(p => p._id !== id));

    try {
      await api.delete(`/admin/packages/${id}`);
      showToast('Package deleted', 'success');
      fetchPackages(true);
    } catch (err) { 
      showToast(err.message || 'Failed to delete', 'error');
      fetchPackages(true);
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
      fetchPackages(true);
    } catch (err) { showToast(err.message || 'Failed to create package', 'error'); fetchPackages(true); }
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
      fetchPackages(true);
    } catch (err) { showToast(err.message || 'CSV upload failed', 'error'); }
    finally { setCsvUploading(false); }
  };

  const toggleSelect = (id) => {
    setSelected(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);
  };
  const toggleSelectAll = (e) => {
    if (e.target.checked) {
      setSelected(packages.map(p => p._id));
    } else {
      setSelected([]);
    }
  };

  const statuses = ['Pending', 'Pick Up Requested', 'Picked Up', 'In Warehouse', 'Out for Delivery', 'Delivered', 'Postponed', 'Cancelled', 'Returned', 'Returned to Vendor'];

  return (
    <>
      <div className="card-premium animate-fadeIn overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-50/50">
        <div>
          <h3 className="font-bold text-slate-800 text-lg">All Packages</h3>
          <p className="text-sm text-slate-500">Manage all packages across the platform</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              className="input-field py-2 pl-9 w-full sm:w-64" 
              placeholder="Search tracking or customer..." 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              onKeyDown={e => e.key === 'Enter' && fetchPackages()} 
            />
          </div>
          <button className="btn-secondary py-2" onClick={() => { setPage(1); fetchPackages(); }}>Search</button>
          
          <button className={`btn-outline py-2 flex items-center gap-2 ${showFilters ? 'bg-slate-100' : ''}`} onClick={() => setShowFilters(!showFilters)}>
            <Settings2 className="w-4 h-4" /> Filters
          </button>
          
          <div className="w-px h-8 bg-slate-200 mx-1 hidden lg:block" />

          <button className="btn-primary py-2 flex items-center gap-2" onClick={() => setCreateModal(true)}>
            <Plus className="w-4 h-4" /> Create Order
          </button>
          <button className="btn-outline py-2 flex items-center gap-2" onClick={() => setCsvModal(true)}>
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> CSV Upload
          </button>
        </div>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="px-6 py-4 border-b border-slate-100 bg-white grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-fadeIn">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Date Range</label>
              <div className="flex gap-2">
                <input type="date" className="input-field py-2 w-full" value={startDate} onChange={e => setStartDate(e.target.value)} />
                <input type="date" className="input-field py-2 w-full" value={endDate} onChange={e => setEndDate(e.target.value)} />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Tracking Code</label>
              <input type="text" className="input-field py-2 w-full" placeholder="Exact or partial..." value={trackingCode} onChange={e => setTrackingCode(e.target.value)} onKeyDown={e => e.key === 'Enter' && fetchPackages()} />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Vendor Shop Name</label>
              <select className="input-field py-2 w-full" value={vendor} onChange={e => setVendor(e.target.value)}>
                <option value="">All Vendors</option>
                {vendors.map(v => (
                  <option key={v._id} value={v._id}>
                    {v.vendorMeta?.shopName || v.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Customer Name/Phone</label>
              <input type="text" className="input-field py-2 w-full" placeholder="Search customer..." value={customer} onChange={e => setCustomer(e.target.value)} onKeyDown={e => e.key === 'Enter' && fetchPackages()} />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Rider</label>
              <select className="input-field py-2 w-full" value={rider} onChange={e => setRider(e.target.value)}>
                <option value="">All Riders</option>
                {riders.map(r => <option key={r._id} value={r._id}>{r.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Status</label>
              <select className="input-field py-2 w-full" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                <option value="">All Statuses</option>
                {statuses.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Verification Status</label>
              <select className="input-field py-2 w-full" value={verificationStatusFilter} onChange={e => setVerificationStatusFilter(e.target.value)}>
                <option value="">All Verification Statuses</option>
                <option value="Pending">Verification Requested (Pending)</option>
                <option value="Verified">Verified</option>
              </select>
            </div>
            <div className="col-span-full flex gap-3 mt-2">
              <button className="btn-primary py-2 px-6" onClick={() => { setPage(1); fetchPackages(); }}>Apply Filters</button>
              <button className="btn-outline py-2 px-6 text-slate-500" onClick={clearFilters}>Clear Filters</button>
            </div>
          </div>
        )}
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-xs">
            <tr>
              <th className="px-6 py-3 w-12">
                <input type="checkbox" className="rounded border-slate-300 text-brand-600 focus:ring-brand-500" onChange={toggleSelectAll} checked={packages.length > 0 && selected.length === packages.length} />
              </th>
              <th className="px-6 py-3">Date</th>
              <th className="px-6 py-3">Tracking Code</th>
              <th className="px-6 py-3">Vendor</th>
              <th className="px-6 py-3">Customer</th>
              <th className="px-6 py-3">Rider</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3">Verification Info</th>
              <th className="px-6 py-3 text-right">Amount (COD)</th>
              <th className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {loading ? <tr><td colSpan="10" className="px-6 py-12 text-center text-slate-500">Loading...</td></tr>
              : packages.length === 0 ? <tr><td colSpan="10" className="px-6 py-12 text-center text-slate-500">No packages found.</td></tr>
                : packages.map(p => (
                  <React.Fragment key={p._id}>
                  <tr className={`hover:bg-slate-50 transition-colors ${selected.includes(p._id) ? 'bg-brand-50/30' : ''}`}>
                    <td className="px-6 py-4">
                      <input type="checkbox" className="rounded border-slate-300 text-brand-600 focus:ring-brand-500" checked={selected.includes(p._id)} onChange={() => toggleSelect(p._id)} />
                    </td>
                    <td className="px-6 py-4 text-slate-500 font-medium whitespace-nowrap">{new Date(p.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4"><TrackingLink code={p.trackingCode} /></td>
                    <td className="px-6 py-4 font-bold text-slate-900">{p.vendorId?.vendorMeta?.shopName || p.vendorId?.name || '—'}</td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-800">{p.customerName}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{p.city ? `${p.city}, ` : ''}{p.address}</div>
                    </td>
                    <td className={`px-6 py-4 font-medium ${p.riderId?.name ? 'text-slate-800' : 'text-slate-400 italic'}`}>
                      {p.riderId?.name || 'Unassigned'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1 items-start">
                        {statusBadge(p.status)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1">
                          <VerificationStatusBadge status={p.deliveryVerificationStatus} />
                          {p.deliveryVerificationStatus === 'Pending' && p.activeVerificationPriority && (
                            <VerificationPriorityBadge priority={p.activeVerificationPriority} />
                          )}
                        </div>
                        {p.deliveryVerificationStatus === 'Pending' && p.verificationRequests && p.verificationRequests.find(r => r.status === 'Pending') && (
                          <div className="text-[10px] text-slate-500 mt-1">
                            Requested by: <span className="font-semibold">{p.verificationRequests.find(r => r.status === 'Pending').requestedByName}</span> ({p.verificationRequests.find(r => r.status === 'Pending').requestedByRole})
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-slate-900">Rs. {p.amount?.toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2 justify-end">
                        <button className="btn-secondary btn-sm p-2" onClick={() => openEdit(p)} title="Edit">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button className="btn-sm p-2 rounded-lg bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 font-bold" onClick={() => handleDelete(p._id, p.trackingCode)} title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </button>
                        {p.verificationAudit && p.verificationAudit.length > 0 && (
                          <button onClick={() => toggleAudit(p._id)} className="text-slate-400 hover:text-slate-700 transition-colors p-1" title="View Logs">
                            {expandedAudits.has(p._id) ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                  {expandedAudits.has(p._id) && (
                    <tr>
                      <td colSpan="10" className="px-6 py-4 bg-slate-50 border-t border-slate-100">
                        <VerificationAudit auditLogs={p.verificationAudit} />
                      </td>
                    </tr>
                  )}
                  </React.Fragment>
                ))}
          </tbody>
        </table>
      </div>
      <Pagination pagination={pagination} onPageChange={setPage} limit={limit} onLimitChange={setLimit} />
      </div>

      {/* Edit Package Modal */}
      {editModal && editPkg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn" onClick={() => setEditModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-scaleIn" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-bold text-slate-900 text-lg">Edit Package Details</h3>
              <button onClick={() => setEditModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 max-h-[80vh] overflow-y-auto">
              <form onSubmit={handleUpdate} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Tracking Code (Read Only)</label>
                  <input type="text" className="input-field bg-slate-50 text-slate-500 font-mono font-bold tracking-wider" value={editPkg.trackingCode} disabled />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Customer Name <span className="text-red-500">*</span></label>
                    <input type="text" className="input-field" required value={editPkg.customerName} onChange={e => setEditPkg({ ...editPkg, customerName: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Customer Phone <span className="text-red-500">*</span></label>
                    <input type="text" className="input-field" required value={editPkg.customerPhone} onChange={e => setEditPkg({ ...editPkg, customerPhone: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">City</label>
                    <input type="text" className="input-field" value={editPkg.city || ''} onChange={e => setEditPkg({ ...editPkg, city: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Address <span className="text-red-500">*</span></label>
                    <input type="text" className="input-field" required value={editPkg.address} onChange={e => setEditPkg({ ...editPkg, address: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-100 pt-5">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Amount (COD) <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-medium text-sm">Rs.</span>
                      <input type="number" className="input-field pl-9" required value={editPkg.amount} onChange={e => setEditPkg({ ...editPkg, amount: e.target.value })} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Weight (KG) <span className="text-red-500">*</span></label>
                    <input type="number" className="input-field" step="0.1" required value={editPkg.weight} onChange={e => setEditPkg({ ...editPkg, weight: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Delivery Date</label>
                    <input type="date" className="input-field" value={editPkg.deliveryDate || ''} onChange={e => setEditPkg({ ...editPkg, deliveryDate: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Delivery Status</label>
                    <select className="input-field" value={editPkg.status || ''} onChange={e => setEditPkg({ ...editPkg, status: e.target.value })}>
                      <option value="Pending">Pending</option>
                      <option value="In Warehouse">In Warehouse</option>
                      <option value="Sorted">Sorted</option>
                      <option value="Out for Delivery">Out for Delivery</option>
                      <option value="Delivered">Delivered</option>
                      <option value="Returned">Returned</option>
                      <option value="Cancelled">Cancelled</option>
                      <option value="Exchanged">Exchanged</option>
                      <option value="Postponed">Hold (Postponed)</option>
                    </select>
                  </div>
                </div>
                
                {/* Reason for Edit */}
                <div className="border-t border-slate-100 pt-5">
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Reason for Edit <span className="text-slate-400 font-normal">(Optional but recommended)</span></label>
                  <input type="text" className="input-field" placeholder="Why are you making these changes?" value={editReason} onChange={e => setEditReason(e.target.value)} />
                </div>

                {/* Audit History */}
                {editPkg.timeline && editPkg.timeline.some(t => t.changes && t.changes.length > 0) && (
                  <div className="border-t border-slate-100 pt-5">
                    <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                      <History className="w-4 h-4 text-brand-600" /> Package Edit History
                    </h4>
                    <div className="space-y-3 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                      {editPkg.timeline.filter(t => t.changes && t.changes.length > 0).map((t, idx) => (
                        <div key={idx} className="bg-slate-50 border border-slate-100 rounded-lg p-3 text-sm">
                          <div className="flex justify-between items-start mb-2">
                            <span className="font-semibold text-slate-700">{t.user} <span className="font-normal text-slate-500">edited</span></span>
                            <span className="text-xs text-slate-400">{new Date(t.time).toLocaleString()}</span>
                          </div>
                          {t.message && <div className="text-xs text-slate-600 mb-2 italic">"{t.message}"</div>}
                          <ul className="space-y-1">
                            {t.changes.map((c, i) => (
                              <li key={i} className="text-xs flex items-center gap-2">
                                <span className="font-mono bg-slate-200 px-1 rounded text-slate-600">{c.field}</span>
                                <span className="line-through text-red-500">{String(c.before)}</span>
                                <span className="text-slate-400">→</span>
                                <span className="text-emerald-600 font-medium">{String(c.after)}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 mt-6">
                  <button type="button" onClick={() => setEditModal(false)} className="btn-secondary">Cancel</button>
                  <button type="submit" className="btn-primary">Save Changes</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Create Package Modal */}
      {createModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn" onClick={() => setCreateModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-scaleIn" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-bold text-slate-900 text-lg">Create Order for Vendor</h3>
              <button onClick={() => setCreateModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 max-h-[80vh] overflow-y-auto">
              <form onSubmit={handleCreate} className="space-y-5">
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
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Customer Phone <span className="text-red-500">*</span></label>
                    <input type="text" className="input-field" required value={newPkg.customerPhone} onChange={e => setNewPkg(f => ({ ...f, customerPhone: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">City</label>
                    <input type="text" className="input-field" value={newPkg.city} onChange={e => setNewPkg(f => ({ ...f, city: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Address <span className="text-red-500">*</span></label>
                    <input type="text" className="input-field" required value={newPkg.address} onChange={e => setNewPkg(f => ({ ...f, address: e.target.value }))} />
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
                    <p className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-2 flex items-center gap-1.5"><AlertTriangle className="w-4 h-4" /> Required Columns</p>
                    <p className="text-xs font-mono text-amber-700 leading-relaxed bg-white/50 p-2 rounded-lg border border-amber-100">
                      customerName, customerPhone, address, city, amount, weight, deliveryCharge, outOfValley
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
    </>
  );
};


export default AdminPackages;
