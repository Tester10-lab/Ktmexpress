import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import AppShell from '../../layouts/AppShell';
import api from '../../api/axios';
import MetricCard from '../../components/MetricCard';
import { useToast } from '../../store/ToastContext';
import PricingEngine from './PricingEngine';
import ScanStation from '../../components/ScanStation';
import Pagination from '../../components/Pagination';
import { 
  LayoutDashboard, Wallet, Receipt, Users, Settings2, Activity, 
  Package, LayoutGrid, BarChart3, Truck, Factory, AlertTriangle, 
  MapPin, CheckCircle2, XCircle, Search, RefreshCw, Plus, FileSpreadsheet,
  Edit2, Trash2, Check, X, Bell
} from 'lucide-react';

// Nav icons
const navLinks = [
  { name: 'Dashboard', path: '/admin', exact: true, icon: <LayoutDashboard className="w-5 h-5" /> },
  { name: 'Settlements', path: '/admin/settlements', icon: <Wallet className="w-5 h-5" /> },
  { name: 'Rider Expenses', path: '/admin/expenses', icon: <Receipt className="w-5 h-5" /> },
  { name: 'Manage Users', path: '/admin/users', icon: <Users className="w-5 h-5" /> },
  { name: 'Pricing Engine', path: '/admin/pricing-engine', icon: <Settings2 className="w-5 h-5" /> },
  { name: 'Global Scan History', path: '/admin/scan-history', icon: <Activity className="w-5 h-5" /> },
  { name: 'All Packages', path: '/admin/packages', icon: <Package className="w-5 h-5" /> },
  { name: 'Dispatcher Panel', path: '/admin/dispatcher', icon: <LayoutGrid className="w-5 h-5" /> },
  { name: 'Reports', path: '/admin/reports', icon: <BarChart3 className="w-5 h-5" /> }
];

const titleMap = {
  '/admin': 'Global Dashboard',
  '/admin/settlements': 'Vendor Settlements',
  '/admin/expenses': 'Rider Expenses',
  '/admin/users': 'Manage Users',
  '/admin/pricing-engine': 'Dynamic Pricing Engine',
  '/admin/scan-history': 'Global Scan History',
  '/admin/packages': 'All Packages',
  '/admin/dispatcher': 'Dispatcher Panel',
  '/admin/reports': 'Financial Reports',
};

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
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${style}`}>{status}</span>;
}

// ─── Dashboard ───────────────────────────────────────────────────────────────
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

// ─── Manage Users ──────────────────────────────────────────────────────────
const ManageUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createModal, setCreateModal] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'vendor', contact: '', shopName: '', monthlyTarget: '' });
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [pagination, setPagination] = useState(null);
  const { showToast } = useToast();

  const fetchUsers = () => {
    setLoading(true);
    api.get(`/admin/users?page=${page}&limit=${limit}`)
      .then(r => {
        setUsers(r.data.data || []);
        setPagination(r.data.pagination);
      })
      .catch(() => showToast('Failed to load users', 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchUsers(); }, [page, limit]);

  const toggle = async (id) => {
    try {
      await api.put(`/admin/users/${id}/toggle-status`);
      showToast('User status updated', 'success');
      fetchUsers();
    } catch { showToast('Failed to update status', 'error'); }
  };

  const handleDeleteUser = async (id, name) => {
    if (!window.confirm(`Delete user "${name}"? This cannot be undone.`)) return;
    try { await api.delete(`/admin/users/${id}`); showToast('User deleted', 'success'); fetchUsers(); }
    catch (e) { showToast(e.response?.data?.message || 'Failed', 'error'); }
  };

  const createUser = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/users', newUser);
      showToast(`User "${newUser.name}" created!`, 'success');
      setCreateModal(false);
      setNewUser({ name: '', email: '', password: '', role: 'vendor', contact: '', shopName: '', monthlyTarget: '' });
      fetchUsers();
    } catch (err) { showToast(err.response?.data?.message || 'Failed to create user', 'error'); }
  };

  const openEditUser = (u) => {
    setEditUser({ _id: u._id, name: u.name, email: u.email, role: u.role, contact: u.contact || '', status: u.status, shopName: u.vendorMeta?.shopName || '', monthlyTarget: u.riderMeta?.monthlyTarget || 0 });
    setEditModal(true);
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    try {
      const payload = { name: editUser.name, contact: editUser.contact, status: editUser.status };
      if (editUser.role === 'vendor') {
        payload.vendorMeta = { shopName: editUser.shopName };
      }
      if (editUser.role === 'rider') {
        payload.riderMeta = { monthlyTarget: parseInt(editUser.monthlyTarget) || 0 };
      }
      await api.put(`/admin/users/${editUser._id}`, payload);
      showToast('User updated successfully', 'success');
      setEditModal(false);
      fetchUsers();
    } catch (err) { showToast(err.response?.data?.message || 'Failed to update user', 'error'); }
  };

  const roleClass = { 
    admin: 'bg-red-100 text-red-700 border border-red-200', 
    vendor: 'bg-brand-100 text-brand-700 border border-brand-200', 
    dispatcher: 'bg-amber-100 text-amber-700 border border-amber-200', 
    rider: 'bg-emerald-100 text-emerald-700 border border-emerald-200' 
  };

  return (
    <div className="card-premium animate-fadeIn overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
        <div>
          <h3 className="font-bold text-slate-800 text-lg">Platform Users</h3>
          <p className="text-sm text-slate-500">Manage vendors, dispatchers, and riders</p>
        </div>
        <button className="btn-primary btn-sm flex items-center gap-2" onClick={() => setCreateModal(true)}>
          <Plus className="w-4 h-4" /> Add User
        </button>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-xs">
            <tr>
              <th className="px-6 py-3">User</th>
              <th className="px-6 py-3">Role</th>
              <th className="px-6 py-3">Contact</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3">Last Active</th>
              <th className="px-6 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {loading ? <tr><td colSpan="6" className="px-6 py-12 text-center text-slate-500">Loading...</td></tr>
              : users.length === 0 ? <tr><td colSpan="6" className="px-6 py-12 text-center text-slate-500">No users found.</td></tr>
                : users.map(u => (
                  <tr key={u._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900">{u.name}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{u.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${roleClass[u.role] || 'bg-slate-100 text-slate-700'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600 font-medium">{u.contact || '—'}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${u.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                        {u.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-xs font-medium">{u.lastActive ? new Date(u.lastActive).toLocaleDateString() : '—'}</td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button onClick={() => openEditUser(u)} className="btn-secondary btn-sm p-2" title="Edit">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => toggle(u._id)} 
                          className={`btn-sm p-2 rounded-lg font-bold border ${u.status === 'Active' ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100' : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'}`}
                          title={u.status === 'Active' ? 'Suspend' : 'Activate'}
                        >
                          {u.status === 'Active' ? <XCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                        </button>
                        {u.role !== 'admin' && (
                          <button onClick={() => handleDeleteUser(u._id, u.name)} className="btn-sm p-2 rounded-lg bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 font-bold" title="Delete">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>
      <Pagination pagination={pagination} onPageChange={setPage} limit={limit} onLimitChange={setLimit} />

      {/* Modals can keep some structure but use Tailwind classes */}
      {createModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn" onClick={() => setCreateModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-scaleIn" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-bold text-slate-900 text-lg">Create New User</h3>
              <button onClick={() => setCreateModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <form onSubmit={createUser} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Full Name <span className="text-red-500">*</span></label>
                    <input type="text" className="input-field" required value={newUser.name} onChange={e => setNewUser(f => ({ ...f, name: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Email <span className="text-red-500">*</span></label>
                    <input type="email" className="input-field" required value={newUser.email} onChange={e => setNewUser(f => ({ ...f, email: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Password <span className="text-red-500">*</span></label>
                    <input type="password" className="input-field" required minLength={6} value={newUser.password} onChange={e => setNewUser(f => ({ ...f, password: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Role <span className="text-red-500">*</span></label>
                    <select className="input-field" value={newUser.role} onChange={e => setNewUser(f => ({ ...f, role: e.target.value }))}>
                      <option value="vendor">Vendor</option>
                      <option value="dispatcher">Dispatcher</option>
                      <option value="rider">Rider</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Contact/Phone</label>
                    <input type="text" className="input-field" value={newUser.contact} onChange={e => setNewUser(f => ({ ...f, contact: e.target.value }))} />
                  </div>
                  {newUser.role === 'vendor' && (
                    <div className="col-span-2 sm:col-span-1">
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Shop Name</label>
                      <input type="text" className="input-field" value={newUser.shopName} onChange={e => setNewUser(f => ({ ...f, shopName: e.target.value }))} />
                    </div>
                  )}
                  {newUser.role === 'rider' && (
                    <div className="col-span-2 sm:col-span-1">
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Monthly Target</label>
                      <input type="number" min="0" className="input-field" value={newUser.monthlyTarget} onChange={e => setNewUser(f => ({ ...f, monthlyTarget: e.target.value }))} />
                    </div>
                  )}
                </div>
                <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 mt-6">
                  <button type="button" className="btn-secondary" onClick={() => setCreateModal(false)}>Cancel</button>
                  <button type="submit" className="btn-primary">Create User</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {editModal && editUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn" onClick={() => setEditModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-scaleIn" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-bold text-slate-900 text-lg">Edit User</h3>
              <button onClick={() => setEditModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <form onSubmit={handleUpdateUser} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Full Name</label>
                    <input type="text" className="input-field" required value={editUser.name} onChange={e => setEditUser(f => ({ ...f, name: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Email (read-only)</label>
                    <input type="email" className="input-field bg-slate-50 text-slate-500" disabled value={editUser.email} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Role</label>
                    <input type="text" className="input-field bg-slate-50 text-slate-500 capitalize" disabled value={editUser.role} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Status</label>
                    <select className="input-field" value={editUser.status} onChange={e => setEditUser(f => ({ ...f, status: e.target.value }))}>
                      <option value="Active">Active</option>
                      <option value="Suspended">Suspended</option>
                    </select>
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Contact/Phone</label>
                    <input type="text" className="input-field" value={editUser.contact} onChange={e => setEditUser(f => ({ ...f, contact: e.target.value }))} />
                  </div>
                  {editUser.role === 'vendor' && (
                    <div className="col-span-2 sm:col-span-1">
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Shop Name</label>
                      <input type="text" className="input-field" value={editUser.shopName} onChange={e => setEditUser(f => ({ ...f, shopName: e.target.value }))} />
                    </div>
                  )}
                  {editUser.role === 'rider' && (
                    <div className="col-span-2 sm:col-span-1">
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Monthly Target</label>
                      <input type="number" min="0" className="input-field" value={editUser.monthlyTarget} onChange={e => setEditUser(f => ({ ...f, monthlyTarget: e.target.value }))} />
                    </div>
                  )}
                </div>
                <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 mt-6">
                  <button type="button" className="btn-secondary" onClick={() => setEditModal(false)}>Cancel</button>
                  <button type="submit" className="btn-primary">Save Changes</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


// ─── Package Override ──────────────────────────────────────────────────────
const AdminScanHistory = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ role: '', trackingCode: '' });
  const { showToast } = useToast();

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams();
      if (filter.role) q.append('role', filter.role);
      if (filter.trackingCode) q.append('trackingCode', filter.trackingCode);
      const r = await api.get(`/scan/all?${q.toString()}`);
      setHistory(r.data.data || []);
    } catch { showToast('Failed to load global scan history', 'error'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchHistory(); }, [filter.role]);

  return (
    <div className="card-premium animate-fadeIn overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-50/50">
        <div>
          <h3 className="font-bold text-slate-800 text-lg">Global Scan History</h3>
          <p className="text-sm text-slate-500">Audit log of all package scans and status changes</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full sm:w-auto">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              className="input-field pl-9 w-full sm:w-64" 
              placeholder="Tracking Code..." 
              value={filter.trackingCode} 
              onChange={e => setFilter({ ...filter, trackingCode: e.target.value })} 
              onKeyDown={e => e.key === 'Enter' && fetchHistory()} 
            />
          </div>
          <select className="input-field w-full sm:w-auto" value={filter.role} onChange={e => setFilter({ ...filter, role: e.target.value })}>
            <option value="">All Roles</option>
            <option value="dispatcher">Warehouse Staff</option>
            <option value="rider">Rider</option>
            <option value="admin">Admin Override</option>
          </select>
          <button className="btn-secondary w-full sm:w-auto flex justify-center items-center gap-2" onClick={fetchHistory}>
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-xs">
            <tr>
              <th className="px-6 py-3">Time</th>
              <th className="px-6 py-3">User / Role</th>
              <th className="px-6 py-3">Tracking Code</th>
              <th className="px-6 py-3">Action</th>
              <th className="px-6 py-3">Location / Notes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {loading ? <tr><td colSpan="5" className="px-6 py-12 text-center text-slate-500">Loading...</td></tr>
              : history.length === 0 ? <tr><td colSpan="5" className="px-6 py-12 text-center text-slate-500">No scan records found.</td></tr>
                : history.map(ev => (
                  <tr key={ev._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-slate-500 font-medium whitespace-nowrap">{new Date(ev.createdAt).toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900">{ev.scannerName}</div>
                      <div className="text-xs text-slate-500 font-medium mt-0.5">
                        {ev.scannerRole === 'dispatcher' ? 'Warehouse Staff' : ev.scannerRole}
                        {ev.isAdminOverride && <span className="text-amber-600 ml-1">(Override)</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-brand-600">{ev.trackingCode}</td>
                    <td className="px-6 py-4">{statusBadge(ev.toStatus)}</td>
                    <td className="px-6 py-4">
                      {ev.location && <div className="text-xs text-slate-500 flex items-center gap-1 mb-1"><MapPin className="w-3 h-3 text-slate-400" /> {ev.location}</div>}
                      {ev.notes && <div className="text-sm text-slate-700 italic border-l-2 border-slate-200 pl-2 mt-1">{ev.notes}</div>}
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ─── Reports ──────────────────────────────────────────────────────────────
const AdminReports = () => {
  const [analytics, setAnalytics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchReports = () => {
    setLoading(true);
    const q = new URLSearchParams();
    if (startDate) q.append('startDate', startDate);
    if (endDate) q.append('endDate', endDate);

    api.get(`/admin/analytics?${q.toString()}`)
      .then(r => setAnalytics(r.data.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchReports(); }, [startDate, endDate]);

  return (
    <div className="card-premium animate-fadeIn overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-50/50">
        <div>
          <h3 className="font-bold text-slate-800 text-lg">Vendor P&L Analytics</h3>
          <p className="text-sm text-slate-500">Revenue, delivery costs, and payouts by vendor</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">From</label>
            <input type="date" className="input-field py-2 px-3 text-sm" value={startDate} onChange={e => setStartDate(e.target.value)} />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">To</label>
            <input type="date" className="input-field py-2 px-3 text-sm" value={endDate} onChange={e => setEndDate(e.target.value)} />
          </div>
          {(startDate || endDate) && (
            <button onClick={() => { setStartDate(''); setEndDate(''); }} className="btn-secondary btn-sm px-4">Clear</button>
          )}
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-xs">
            <tr>
              <th className="px-6 py-3">Vendor</th>
              <th className="px-6 py-3 text-center">Deliveries</th>
              <th className="px-6 py-3 text-right">Gross Revenue (COD)</th>
              <th className="px-6 py-3 text-right">Delivery Costs</th>
              <th className="px-6 py-3 text-right">Net Payout</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {loading ? <tr><td colSpan="5" className="px-6 py-12 text-center text-slate-500">Loading...</td></tr>
              : analytics.length === 0 ? <tr><td colSpan="5" className="px-6 py-12 text-center text-slate-500">No analytics data yet.</td></tr>
                : analytics.map((a, i) => (
                  <tr key={i} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-900">{a.vendorInfo?.[0]?.name || 'Unknown'}</td>
                    <td className="px-6 py-4 text-center font-medium text-slate-700">{a.count}</td>
                    <td className="px-6 py-4 text-right font-bold text-emerald-600">Rs. {a.grossRevenue?.toLocaleString()}</td>
                    <td className="px-6 py-4 text-right font-bold text-red-500">Rs. {a.deliveryCosts?.toLocaleString()}</td>
                    <td className="px-6 py-4 text-right font-black text-brand-600">Rs. {((a.grossRevenue || 0) - (a.deliveryCosts || 0)).toLocaleString()}</td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ─── Admin Settlements ──────────────────────────────────────────────────────
const AdminSettlements = () => {
  const [settlements, setSettlements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [pagination, setPagination] = useState(null);
  const { showToast } = useToast();

  const fetchSettlements = () => {
    setLoading(true);
    api.get(`/admin/settlements?page=${page}&limit=${limit}`)
      .then(r => {
        setSettlements(r.data.data || []);
        setPagination(r.data.pagination);
      })
      .catch(() => showToast('Failed to load settlements', 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchSettlements(); }, [page, limit]);

  const handleAction = async (id, status) => {
    try {
      await api.put(`/admin/settlements/${id}`, { status });
      showToast(`Settlement marked as ${status}`, 'success');
      fetchSettlements();
    } catch { showToast('Failed to update settlement', 'error'); }
  };

  return (
    <div className="card-premium animate-fadeIn overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
        <h3 className="font-bold text-slate-800 text-lg">Vendor Settlement Requests</h3>
        <p className="text-sm text-slate-500">Approve and reconcile vendor payments</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-xs">
            <tr>
              <th className="px-6 py-3">Date Requested</th>
              <th className="px-6 py-3">Vendor</th>
              <th className="px-6 py-3">Requested Amount</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {loading ? <tr><td colSpan="5" className="px-6 py-12 text-center text-slate-500">Loading...</td></tr>
              : settlements.length === 0 ? <tr><td colSpan="5" className="px-6 py-12 text-center text-slate-500">No settlement requests found.</td></tr>
                : settlements.map(s => (
                  <tr key={s._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-slate-500 font-medium whitespace-nowrap">{new Date(s.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900">{s.vendorId?.name || 'Unknown'}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{s.vendorId?.vendorMeta?.shopName}</div>
                    </td>
                    <td className="px-6 py-4 font-bold text-brand-600 text-base">Rs. {s.requestedAmount?.toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                        s.status === 'Approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                        : s.status === 'Rejected' ? 'bg-red-50 text-red-700 border-red-200' 
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {s.status === 'Pending' ? (
                        <div className="flex gap-2">
                          <button className="btn-sm p-2 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 font-bold flex items-center gap-1.5" onClick={() => handleAction(s._id, 'Approved')} title="Approve">
                            <Check className="w-4 h-4" /> <span className="hidden sm:inline">Approve</span>
                          </button>
                          <button className="btn-sm p-2 rounded-lg bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 font-bold flex items-center gap-1.5" onClick={() => handleAction(s._id, 'Rejected')} title="Reject">
                            <X className="w-4 h-4" /> <span className="hidden sm:inline">Reject</span>
                          </button>
                        </div>
                      ) : <span className="text-slate-400 font-medium text-xs uppercase tracking-wider">Processed</span>}
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>
      <Pagination pagination={pagination} onPageChange={setPage} limit={limit} onLimitChange={setLimit} />
    </div>
  );
};

// ─── Admin Expenses ────────────────────────────────────────────────────────
const AdminExpenses = () => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [pagination, setPagination] = useState(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const { showToast } = useToast();

  const fetchExpenses = () => {
    setLoading(true);
    const q = new URLSearchParams({ page, limit });
    if (filterStatus) q.append('status', filterStatus);
    if (filterCategory) q.append('category', filterCategory);

    api.get(`/admin/expenses?${q.toString()}`)
      .then(r => {
        setExpenses(r.data.data || []);
        setPagination(r.data.pagination);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchExpenses(); }, [page, limit, filterStatus, filterCategory]);

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      await api.put(`/admin/expenses/${id}/status`, { status: newStatus });
      showToast(`Expense marked as ${newStatus}`, 'success');
      fetchExpenses();
    } catch (err) {
      showToast('Failed to update expense status', 'error');
    }
  };

  return (
    <div className="card-premium animate-fadeIn overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-50/50">
        <div>
          <h3 className="font-bold text-slate-800 text-lg">Rider Expenses Log</h3>
          <p className="text-sm text-slate-500">Global view of all submitted rider expenses</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <select className="input-field py-2" value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
            <option value="">All Categories</option>
            <option value="fuel">Fuel</option>
            <option value="food">Food</option>
            <option value="misc">Misc</option>
          </select>
          <select className="input-field py-2" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-xs">
            <tr>
              <th className="px-6 py-3">Date</th>
              <th className="px-6 py-3">Rider</th>
              <th className="px-6 py-3">Category</th>
              <th className="px-6 py-3 text-right">Amount</th>
              <th className="px-6 py-3">Description</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {loading ? <tr><td colSpan="7" className="px-6 py-12 text-center text-slate-500">Loading...</td></tr>
              : expenses.length === 0 ? <tr><td colSpan="7" className="px-6 py-12 text-center text-slate-500">No expenses logged.</td></tr>
                : expenses.map(e => (
                  <tr key={e._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-slate-500 font-medium whitespace-nowrap">{new Date(e.date).toLocaleDateString()}</td>
                    <td className="px-6 py-4 font-bold text-slate-900">{e.riderId?.name || 'Unknown'}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-slate-100 text-slate-700 capitalize tracking-wider">
                        {e.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-red-500 text-right">Rs. {e.amount?.toLocaleString()}</td>
                    <td className="px-6 py-4 text-slate-600">{e.description}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                        e.status === 'Approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                        : e.status === 'Rejected' ? 'bg-red-50 text-red-700 border-red-200' 
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {e.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {e.status === 'Pending' ? (
                        <div className="flex gap-2">
                          <button className="btn-sm p-2 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 font-bold flex items-center gap-1.5" onClick={() => handleStatusUpdate(e._id, 'Approved')} title="Approve">
                            <Check className="w-4 h-4" /> <span className="hidden sm:inline">Approve</span>
                          </button>
                          <button className="btn-sm p-2 rounded-lg bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 font-bold flex items-center gap-1.5" onClick={() => handleStatusUpdate(e._id, 'Rejected')} title="Reject">
                            <X className="w-4 h-4" /> <span className="hidden sm:inline">Reject</span>
                          </button>
                        </div>
                      ) : <span className="text-slate-400 font-medium text-xs uppercase tracking-wider">Processed</span>}
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>
      <Pagination pagination={pagination} onPageChange={setPage} limit={limit} onLimitChange={setLimit} />
    </div>
  );
};

// ─── Admin Packages (with Create, Edit, Delete, Status Filter, Rider Column, CSV Upload) ───
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

  const [editModal, setEditModal] = useState(false);
  const [editPkg, setEditPkg] = useState(null);

  const [createModal, setCreateModal] = useState(false);
  const [csvModal, setCsvModal] = useState(false);
  const [vendors, setVendors] = useState([]);
  const [newPkg, setNewPkg] = useState({ vendorId: '', customerName: '', customerPhone: '', address: '', city: '', amount: '', weight: '0.5', deliveryDate: '' });
  const [csvVendorId, setCsvVendorId] = useState('');
  const [csvVendorSearch, setCsvVendorSearch] = useState('');
  const [csvVendorDropdownOpen, setCsvVendorDropdownOpen] = useState(false);
  const [csvFile, setCsvFile] = useState(null);
  const [csvUploading, setCsvUploading] = useState(false);

  const fetchPackages = () => {
    setLoading(true);
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

  const openEdit = (pkg) => {
    setEditPkg({ ...pkg, deliveryDate: pkg.deliveryDate ? new Date(pkg.deliveryDate).toISOString().split('T')[0] : '' });
    setEditModal(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/admin/packages/${editPkg._id}`, {
        customerName: editPkg.customerName,
        customerPhone: editPkg.customerPhone,
        address: editPkg.address,
        city: editPkg.city,
        amount: Number(editPkg.amount),
        weight: Number(editPkg.weight),
        deliveryDate: editPkg.deliveryDate || null
      });
      showToast('Package updated successfully', 'success');
      setEditModal(false);
      fetchPackages();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update package', 'error');
    }
  };

  const handleDelete = async (id, trackingCode) => {
    if (!window.confirm(`Delete package "${trackingCode}"? This will soft-delete it.`)) return;
    try {
      await api.delete(`/admin/packages/${id}`);
      showToast('Package deleted', 'success');
      fetchPackages();
    } catch (err) { showToast(err.response?.data?.message || 'Failed to delete', 'error'); }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/packages', {
        ...newPkg,
        amount: Number(newPkg.amount),
        weight: Number(newPkg.weight),
        deliveryDate: newPkg.deliveryDate || null
      });
      showToast('Package created successfully', 'success');
      setCreateModal(false);
      setNewPkg({ vendorId: '', customerName: '', customerPhone: '', address: '', city: '', amount: '', weight: '0.5', deliveryDate: '' });
      fetchPackages();
    } catch (err) { showToast(err.response?.data?.message || 'Failed to create package', 'error'); }
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
      showToast(res.data.message || 'CSV uploaded!', 'success');
      setCsvModal(false);
      setCsvFile(null);
      setCsvVendorId('');
      setCsvVendorSearch('');
      fetchPackages();
    } catch (err) { showToast(err.response?.data?.message || 'CSV upload failed', 'error'); }
    finally { setCsvUploading(false); }
  };

  const handleRequestPickup = async () => {
    if (selected.length === 0) return;
    if (!window.confirm(`Request pickup for ${selected.length} package(s)?`)) return;
    try {
      await api.post('/admin/packages/pickup-request', { packageIds: selected });
      showToast('Pickup requested successfully', 'success');
      setSelected([]);
      fetchPackages();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to request pickup', 'error');
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
                    <td className="px-6 py-4 font-mono font-bold text-brand-600">{p.trackingCode}</td>
                    <td className="px-6 py-4 font-bold text-slate-900">{p.vendorId?.name || '—'}</td>
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
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search and select vendor..."
                      className="input-field w-full"
                      value={csvVendorSearch}
                      onChange={e => {
                        setCsvVendorSearch(e.target.value);
                        setCsvVendorDropdownOpen(true);
                        setCsvVendorId('');
                      }}
                      onFocus={() => setCsvVendorDropdownOpen(true)}
                      onBlur={() => setTimeout(() => setCsvVendorDropdownOpen(false), 200)}
                    />
                    {csvVendorDropdownOpen && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {vendors
                          .filter(v => (v.name + ' ' + (v.vendorMeta?.shopName || v.email)).toLowerCase().includes(csvVendorSearch.toLowerCase()))
                          .map(v => (
                            <div 
                              key={v._id} 
                              className="px-4 py-2 hover:bg-brand-50 cursor-pointer text-sm text-slate-700 border-b border-slate-100 last:border-0"
                              onClick={() => {
                                setCsvVendorId(v._id);
                                setCsvVendorSearch(`${v.name} — ${v.vendorMeta?.shopName || v.email}`);
                                setCsvVendorDropdownOpen(false);
                              }}
                            >
                              {v.name} — {v.vendorMeta?.shopName || v.email}
                            </div>
                          ))}
                        {vendors.filter(v => (v.name + ' ' + (v.vendorMeta?.shopName || v.email)).toLowerCase().includes(csvVendorSearch.toLowerCase())).length === 0 && (
                          <div className="px-4 py-2 text-sm text-slate-500">No vendors found.</div>
                        )}
                      </div>
                    )}
                  </div>
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
    </div>
  );
};

// ─── Dispatcher Panel (Admin can perform dispatcher actions) ─────────────────
const AdminDispatcher = () => {
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

  const fetchAll = useCallback(async () => {
    setLoading(true);
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
      fetchAll();
    } catch (e) { showToast(e.response?.data?.message || 'Failed', 'error'); }
    finally { setActionLoading(s => ({ ...s, [`p_${pickupId}`]: false })); }
  };

  const confirmWarehouse = async (packageId) => {
    setActionLoading(s => ({ ...s, [`w_${packageId}`]: true }));
    try {
      await api.put('/dispatcher/confirm-warehouse', { packageId });
      showToast('Package confirmed at warehouse!', 'success');
      fetchAll();
    } catch (e) { showToast(e.response?.data?.message || 'Failed', 'error'); }
    finally { setActionLoading(s => ({ ...s, [`w_${packageId}`]: false })); }
  };

  const assignDelivery = async (packageId) => {
    const riderId = deliveryRiderMap[packageId];
    if (!riderId) return showToast('Select a rider first', 'warning');
    setActionLoading(s => ({ ...s, [`d_${packageId}`]: true }));
    try {
      await api.put('/dispatcher/assign-delivery', { packageId, riderId });
      showToast('Rider assigned for delivery!', 'success');
      fetchAll();
    } catch (e) { showToast(e.response?.data?.message || 'Failed', 'error'); }
    finally { setActionLoading(s => ({ ...s, [`d_${packageId}`]: false })); }
  };

  const confirmReturn = async (packageId, type) => {
    setActionLoading(s => ({ ...s, [`r_${packageId}_${type}`]: true }));
    try {
      await api.put('/dispatcher/confirm-return', { packageId, type });
      showToast(`Return ${type} confirmed!`, 'success');
      fetchAll();
    } catch (e) { showToast(e.response?.data?.message || 'Failed', 'error'); }
    finally { setActionLoading(s => ({ ...s, [`r_${packageId}_${type}`]: false })); }
  };

  const pendingPickups = pickups.filter(p => p.status === 'pending');
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
                <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-xs">
                  <tr>
                    <th className="px-6 py-3">Tracking</th>
                    <th className="px-6 py-3">Vendor</th>
                    <th className="px-6 py-3">Customer</th>
                    <th className="px-6 py-3">Address</th>
                    <th className="px-6 py-3">Assign Rider</th>
                    <th className="px-6 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {pendingPickups.length === 0 ? <tr><td colSpan="6" className="px-6 py-12 text-center text-slate-500">No pending pickups.</td></tr>
                    : pendingPickups.map(p => (
                    <tr key={p._id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-mono font-bold text-brand-600">{p.packageId?.trackingCode || '—'}</td>
                      <td className="px-6 py-4 font-bold text-slate-900">{p.vendorId?.name || '—'}</td>
                      <td className="px-6 py-4 text-slate-700 font-medium">{p.packageId?.customerName || '—'}</td>
                      <td className="px-6 py-4 text-slate-500 max-w-[160px] truncate">{p.packageId?.address || '—'}</td>
                      <td className="px-6 py-4">
                        <select className="input-field py-1.5 text-xs w-40" value={assignMap[p._id] || ''} onChange={e => setAssignMap(m => ({ ...m, [p._id]: e.target.value }))}>
                          <option value="">Select Rider</option>
                          {riders.map(r => <option key={r._id} value={r._id}>{r.name}</option>)}
                        </select>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="btn-primary btn-sm px-4" onClick={() => assignPickup(p._id)} disabled={actionLoading[`p_${p._id}`]}>
                          {actionLoading[`p_${p._id}`] ? '...' : 'Assign'}
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
                        <td className="px-6 py-4 font-mono font-bold text-brand-600">{p.packageId?.trackingCode || '—'}</td>
                        <td className="px-6 py-4 font-bold text-slate-900">{p.vendorId?.name || '—'}</td>
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
                    <td className="px-6 py-4 font-mono font-bold text-brand-600">{p.trackingCode}</td>
                    <td className="px-6 py-4 font-bold text-slate-900">{p.vendorId?.name || '—'}</td>
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
                    <td className="px-6 py-4 font-mono font-bold text-brand-600">{p.trackingCode}</td>
                    <td className="px-6 py-4 font-bold text-slate-900">{p.vendorId?.name || '—'}</td>
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
                  <tr key={r._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-900">{r.name}</td>
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
};

// ─── Admin Dashboard (Shell + Routes) ────────────────────────────────────
const AdminDashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const notifs = [];
        
        // Fetch Pending Settlements
        const settleRes = await api.get('/admin/settlements?limit=50');
        const pendingSettlements = (settleRes.data.data || []).filter(s => s.status === 'Pending');
        pendingSettlements.forEach(s => {
          notifs.push({
            id: `settle_${s._id}`,
            title: 'Settlement Request',
            message: `${s.vendorId?.name || 'A vendor'} requested Rs. ${s.requestedAmount}`,
            time: new Date(s.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            read: false,
            icon: '💰',
            path: '/admin/settlements'
          });
        });

        // Fetch Pending Expenses
        const expRes = await api.get('/admin/expenses?limit=50');
        const pendingExpenses = (expRes.data.data || []).filter(e => e.status === 'Pending');
        pendingExpenses.forEach(e => {
          notifs.push({
            id: `exp_${e._id}`,
            title: 'Rider Expense',
            message: `${e.riderId?.name || 'A rider'} logged Rs. ${e.amount} for ${e.category}`,
            time: new Date(e.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            read: false,
            icon: '🏍️',
            path: '/admin/expenses'
          });
        });

        setNotifications(notifs);
      } catch (err) {
        console.error('Failed to fetch admin notifications', err);
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleNotificationClick = (n) => {
    if (n.path) navigate(n.path);
  };

  const title = Object.entries(titleMap).sort((a, b) => b[0].length - a[0].length).find(([p]) => location.pathname.startsWith(p))?.[1] || 'Admin';

  return (
    <AppShell 
      navLinks={navLinks} 
      currentTitle={title} 
      roleBadge="Admin Workspace"
      notifications={notifications}
      onNotificationClick={handleNotificationClick}
    >
      <Routes>
        <Route path="/" element={<AdminHome />} />
        <Route path="/settlements" element={<AdminSettlements />} />
        <Route path="/expenses" element={<AdminExpenses />} />
        <Route path="/users" element={<ManageUsers />} />
        <Route path="/pricing-engine" element={<PricingEngine />} />
        <Route path="/pricing" element={<PricingEngine />} />
        <Route path="/scan-history" element={<AdminScanHistory />} />
        <Route path="/packages" element={<AdminPackages />} />
        <Route path="/dispatcher" element={<AdminDispatcher />} />
        <Route path="/reports" element={<AdminReports />} />
      </Routes>
    </AppShell>
  );
};

export default AdminDashboard;
