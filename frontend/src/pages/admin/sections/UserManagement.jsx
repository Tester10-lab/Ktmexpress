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



export default ManageUsers;
