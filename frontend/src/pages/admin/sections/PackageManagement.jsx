import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import api from '../../../api/axios';
import MetricCard from '../../../components/MetricCard';
import { useToast } from '../../../store/ToastContext';
import { useSocket } from '../../../hooks/useSocket';
import ScanStation from '../../../components/ScanStation';
import Pagination from '../../../components/Pagination';
import TrackingLink from '../../../components/TrackingLink';
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

const AdminPackages = () => {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [pagination, setPagination] = useState(null);
  const [selected, setSelected] = useState([]);
  const { showToast } = useToast();
  const socket = useSocket();

  const [editModal, setEditModal] = useState(false);
  const [editPkg, setEditPkg] = useState(null);

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

  useEffect(() => { fetchPackages(); }, [page, limit, statusFilter]);
  useEffect(() => { fetchVendors(); }, []);
  
  useEffect(() => {
    if (!socket) return;
    const handleCreated = () => {
      fetchPackages(true);
    };
    socket.on('package:created', handleCreated);
    return () => socket.off('package:created', handleCreated);
  }, [socket]);

  const openEdit = (pkg) => {
    setEditPkg({ ...pkg, deliveryDate: pkg.deliveryDate ? new Date(pkg.deliveryDate).toISOString().split('T')[0] : '' });
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
      deliveryDate: editPkg.deliveryDate || null
    };

    // Optimistic Update
    setPackages(prev => prev.map(p => p._id === editPkg._id ? { ...p, ...payload } : p));

    try {
      setEditModal(false); // Close immediately for optimistic UI
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
    
    // Optimistic Update
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
      setCreateModal(false); // Close immediately
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

  const handleRequestPickup = async () => {
    if (selected.length === 0) return;
    if (!window.confirm(`Request pickup for ${selected.length} package(s)?`)) return;
    
    // Optimistic Update
    setPackages(prev => prev.map(p => selected.includes(p._id) ? { ...p, status: 'Pick Up Requested' } : p));

    try {
      setSelected([]); // Clear selection immediately
      await api.post('/admin/packages/pickup-request', { packageIds: selected });
      showToast('Pickup requested successfully', 'success');
      fetchPackages(true);
    } catch (err) {
      showToast(err.message || 'Failed to request pickup', 'error');
      fetchPackages(true);
    }
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
          <select className="input-field py-2" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
            <option value="">All Statuses</option>
            {statuses.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
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
          
          <div className="w-px h-8 bg-slate-200 mx-1 hidden lg:block" />
          
          {selected.length > 0 && (
            <button className="btn-sm bg-brand-50 text-brand-700 border border-brand-200 font-bold hover:bg-brand-100 py-2 flex items-center gap-2" onClick={handleRequestPickup}>
              <Truck className="w-4 h-4" /> Request Pickup ({selected.length})
            </button>
          )}

          <button className="btn-primary py-2 flex items-center gap-2" onClick={() => setCreateModal(true)}>
            <Plus className="w-4 h-4" /> Create Order
          </button>
          <button className="btn-outline py-2 flex items-center gap-2" onClick={() => setCsvModal(true)}>
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> CSV Upload
          </button>
        </div>
      </div>
      
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
              <th className="px-6 py-3 text-right">Amount (COD)</th>
              <th className="px-6 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {loading ? <tr><td colSpan="9" className="px-6 py-12 text-center text-slate-500">Loading...</td></tr>
              : packages.length === 0 ? <tr><td colSpan="9" className="px-6 py-12 text-center text-slate-500">No packages found.</td></tr>
                : packages.map(p => (
                  <tr key={p._id} className={`hover:bg-slate-50 transition-colors ${selected.includes(p._id) ? 'bg-brand-50/30' : ''}`}>
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
                    <td className="px-6 py-4">{statusBadge(p.status)}</td>
                    <td className="px-6 py-4 text-right font-bold text-slate-900">Rs. {p.amount?.toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button className="btn-secondary btn-sm p-2" onClick={() => openEdit(p)} title="Edit">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button className="btn-sm p-2 rounded-lg bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 font-bold" onClick={() => handleDelete(p._id, p.trackingCode)} title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
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
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-slate-100 pt-5">
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
                </div>
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
