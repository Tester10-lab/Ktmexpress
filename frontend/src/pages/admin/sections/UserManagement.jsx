import React, { useState, useEffect, useCallback, useRef, memo } from 'react';
import api from '../../../api/axios';
import MetricCard from '../../../components/MetricCard';
import { useToast } from '../../../store/ToastContext';
import Pagination from '../../../components/Pagination';
import { 
  Users, Plus, Edit2, Trash2, CheckCircle2, XCircle, X
} from 'lucide-react';

// ─── Extracted Edit User Modal (React.memo prevents parent re-renders from remounting) ──
const EditUserModal = memo(({ user, onClose, onSave }) => {
  const [form, setForm] = useState(null);

  // Initialize form only when user identity changes
  useEffect(() => {
    if (user) {
      setForm({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        contact: user.contact || '',
        status: user.status,
        shopName: user.vendorMeta?.shopName || '',
        monthlyTarget: user.riderMeta?.monthlyTarget || 0,
      });
    }
  }, [user?._id]);

  if (!form) return null;

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn" 
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-scaleIn" 
        onClick={e => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h3 className="font-bold text-slate-900 text-lg">Edit User</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Full Name</label>
                <input type="text" className="input-field" required value={form.name} onChange={e => handleChange('name', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Email (read-only)</label>
                <input type="email" className="input-field bg-slate-50 text-slate-500" disabled value={form.email} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Role</label>
                <input type="text" className="input-field bg-slate-50 text-slate-500 capitalize" disabled value={form.role} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Status</label>
                <select className="input-field" value={form.status} onChange={e => handleChange('status', e.target.value)}>
                  <option value="Active">Active</option>
                  <option value="Suspended">Suspended</option>
                </select>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-sm font-semibold text-slate-700 mb-1">Contact/Phone</label>
                <input type="text" className="input-field" value={form.contact} onChange={e => handleChange('contact', e.target.value)} />
              </div>
              {form.role === 'vendor' && (
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Shop Name</label>
                  <input type="text" className="input-field" value={form.shopName} onChange={e => handleChange('shopName', e.target.value)} />
                </div>
              )}
              {form.role === 'rider' && (
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Monthly Target</label>
                  <input type="number" min="0" className="input-field" value={form.monthlyTarget} onChange={e => handleChange('monthlyTarget', e.target.value)} />
                </div>
              )}
            </div>
            <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 mt-6">
              <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn-primary">Save Changes</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
});

EditUserModal.displayName = 'EditUserModal';

// ─── Main Component ─────────────────────────────────────────────────────────
const ManageUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createModal, setCreateModal] = useState(false);
  const [editUser, setEditUser] = useState(null); // null = closed, object = open
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'vendor', contact: '', shopName: '', monthlyTarget: '' });
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [pagination, setPagination] = useState(null);
  const { showToast } = useToast();

  // Ref to track if a modal is open — prevents background refetches from causing flicker
  const modalOpenRef = useRef(false);

  const fetchUsers = useCallback((silent = false) => {
    if (modalOpenRef.current && !silent) return; // Don't block silent background fetches
    if (!silent) setLoading(true);
    api.get(`/admin/users?page=${page}&limit=${limit}`)
      .then(r => {
        setUsers(r.data.data || []);
        setPagination(r.data.pagination);
      })
      .catch(() => showToast('Failed to load users', 'error'))
      .finally(() => setLoading(false));
  }, [page, limit, showToast]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const toggleStatus = useCallback(async (id, currentStatus) => {
    const action = currentStatus === 'Active' ? 'suspend' : 'reactivate';
    let reason = '';
    if (action === 'suspend') {
      const input = window.prompt("Reason for suspension (optional):");
      if (input === null) return; // User cancelled
      reason = input;
    } else {
      if (!window.confirm("Are you sure you want to reactivate this user?")) return;
    }

    const newStatus = currentStatus === 'Active' ? 'Suspended' : 'Active';
    // Optimistic Update
    setUsers(prev => prev.map(u => u._id === id ? { ...u, status: newStatus } : u));

    try {
      await api.patch(`/admin/users/${id}/${action}`, { reason });
      showToast(`User ${action}ed successfully`, 'success');
      fetchUsers(true);
    } catch { 
      showToast(`Failed to ${action} user`, 'error');
      fetchUsers(true); // revert on failure
    }
  }, [fetchUsers, showToast]);

  const createUser = useCallback(async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/users', newUser);
      showToast(`User "${newUser.name}" created!`, 'success');
      setCreateModal(false);
      modalOpenRef.current = false;
      setNewUser({ name: '', email: '', password: '', role: 'vendor', contact: '', shopName: '', monthlyTarget: '' });
      fetchUsers(true);
    } catch (err) { showToast(err.message || 'Failed to create user', 'error'); }
  }, [newUser, fetchUsers, showToast]);

  const openEditUser = useCallback((u) => {
    modalOpenRef.current = true;
    setEditUser(u);
  }, []);

  const closeEditModal = useCallback(() => {
    modalOpenRef.current = false;
    setEditUser(null);
  }, []);

  const handleUpdateUser = useCallback(async (form) => {
    try {
      const payload = { name: form.name, contact: form.contact, status: form.status };
      if (form.role === 'vendor') {
        payload.vendorMeta = { shopName: form.shopName };
      }
      if (form.role === 'rider') {
        payload.riderMeta = { monthlyTarget: parseInt(form.monthlyTarget) || 0 };
      }
      // Optimistic Update
      setUsers(prev => prev.map(u => u._id === form._id ? { 
        ...u, 
        ...payload,
        vendorMeta: payload.vendorMeta ? { ...u.vendorMeta, ...payload.vendorMeta } : u.vendorMeta,
        riderMeta: payload.riderMeta ? { ...u.riderMeta, ...payload.riderMeta } : u.riderMeta
      } : u));

      await api.put(`/admin/users/${form._id}`, payload);
      showToast('User updated successfully', 'success');
      closeEditModal();
      fetchUsers(true);
    } catch (err) { 
      showToast(err.message || 'Failed to update user', 'error');
      fetchUsers(true); // revert on failure
    }
  }, [fetchUsers, showToast, closeEditModal]);

  const openCreateModal = useCallback(() => {
    modalOpenRef.current = true;
    setCreateModal(true);
  }, []);

  const closeCreateModal = useCallback(() => {
    modalOpenRef.current = false;
    setCreateModal(false);
  }, []);

  const roleClass = { 
    admin: 'bg-red-100 text-red-700 border border-red-200', 
    vendor: 'bg-brand-100 text-brand-700 border border-brand-200', 
    dispatcher: 'bg-amber-100 text-amber-700 border border-amber-200', 
    rider: 'bg-emerald-100 text-emerald-700 border border-emerald-200' 
  };

  return (
    <>
      <div className="card-premium animate-fadeIn overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
        <div>
          <h3 className="font-bold text-slate-800 text-lg">Platform Users</h3>
          <p className="text-sm text-slate-500">Manage vendors, dispatchers, and riders</p>
        </div>
        <button className="btn-primary btn-sm flex items-center gap-2" onClick={openCreateModal}>
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
                          onClick={() => toggleStatus(u._id, u.status)} 
                          className={`btn-sm p-2 rounded-lg font-bold border ${u.status === 'Active' ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100' : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'}`}
                          title={u.status === 'Active' ? 'Suspend' : 'Activate'}
                        >
                          {u.status === 'Active' ? <XCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
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

      {editUser && (
        <EditUserModal
          user={editUser}
          onClose={closeEditModal}
          onSave={handleUpdateUser}
        />
      )}

      {createModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn" onClick={closeCreateModal}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-scaleIn" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-bold text-slate-900 text-lg">Create New User</h3>
              <button onClick={closeCreateModal} className="text-slate-400 hover:text-slate-600 transition-colors">
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
                  <button type="button" className="btn-secondary" onClick={closeCreateModal}>Cancel</button>
                  <button type="submit" className="btn-primary">Create User</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
};



export default ManageUsers;
