import React, { useState, useEffect } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import AppShell from '../../layouts/AppShell';
import api from '../../api/axios';
import MetricCard from '../../components/MetricCard';
import { useToast } from '../../store/ToastContext';
import PricingEngine from './PricingEngine';
import ScanStation from '../../components/ScanStation';
import Pagination from '../../components/Pagination';

// Nav icons
const Icon = ({ d, d2, d3 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d={d} />{d2 && <path d={d2} />}{d3 && <path d={d3} />}
  </svg>
);

const navLinks = [
  { name: 'Dashboard', path: '/admin', exact: true, icon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg> },
  { name: 'Settlements', path: '/admin/settlements', icon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg> },
  { name: 'Rider Expenses', path: '/admin/expenses', icon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="2" x2="12" y2="22" /><line x1="17" y1="5" x2="9.5" y2="5" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg> },
  { name: 'Manage Users', path: '/admin/users', icon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg> },
  { name: 'Pricing Engine', path: '/admin/pricing-engine', icon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg> },
  { name: 'Global Scan History', path: '/admin/scan-history', icon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg> },
  { name: 'All Packages', path: '/admin/packages', icon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg> },
  { name: 'Reports', path: '/admin/reports', icon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg> }
];

const titleMap = {
  '/admin': 'Global Dashboard',
  '/admin/settlements': 'Vendor Settlements',
  '/admin/expenses': 'Rider Expenses',
  '/admin/users': 'Manage Users',
  '/admin/pricing-engine': 'Dynamic Pricing Engine',
  '/admin/scan-history': 'Global Scan History',
  '/admin/packages': 'All Packages',
  '/admin/reports': 'Financial Reports',
};

// ─── Status Badge ───────────────────────────────────────────────────────────
function statusBadge(status) {
  const m = {
    'Delivered': 'badge-success', 'Cancelled': 'badge-danger',
    'Returned': 'badge-info', 'Returned to Vendor': 'badge-info',
    'Pending': 'badge-warning', 'Pick Up Requested': 'badge-warning',
    'Picked Up': 'badge-primary', 'In Warehouse': 'badge-primary',
    'Out for Delivery': 'badge-primary', 'Postponed': 'badge-warning',
  };
  return <span className={`badge ${m[status] || 'badge-secondary'}`}>{status}</span>;
}

// ─── Dashboard ───────────────────────────────────────────────────────────────
const AdminHome = () => {
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/admin/dashboard').then(r => setStats(r.data.data || {})).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="empty-state"><p>Loading dashboard...</p></div>;

  return (
    <>
      <div className="metrics-grid">
        <div onClick={() => navigate('/admin/scan-history')} className="cursor-pointer hover:shadow-md transition-shadow">
          <MetricCard title="Total Packages" value={stats.totalPackages ?? 0} color="primary"
            icon={<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="16.5" y1="9.4" x2="7.5" y2="4.21" /><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" /></svg>} />
        </div>
        <div onClick={() => navigate('/admin/scan-history')} className="cursor-pointer hover:shadow-md transition-shadow">
          <MetricCard title="Delivered" value={stats.delivered ?? 0} color="success"
            icon={<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>} />
        </div>
        <div onClick={() => navigate('/admin/scan-history')} className="cursor-pointer hover:shadow-md transition-shadow">
          <MetricCard title="Pending" value={stats.pending ?? 0} color="warning"
            icon={<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>} />
        </div>
        <div onClick={() => navigate('/admin/scan-history')} className="cursor-pointer hover:shadow-md transition-shadow">
          <MetricCard title="Cancelled" value={stats.cancelled ?? 0} color="danger"
            icon={<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>} />
        </div>
        <div onClick={() => navigate('/admin/scan-history')} className="cursor-pointer hover:shadow-md transition-shadow">
          <MetricCard title="Returned" value={stats.returned ?? 0} color="info"
            icon={<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 .49-4.5" /></svg>} />
        </div>
        <div onClick={() => navigate('/admin/users')} className="cursor-pointer hover:shadow-md transition-shadow">
          <MetricCard title="Active Vendors" value={stats.activeVendors ?? 0} color="purple"
            icon={<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>} />
        </div>
        <div onClick={() => navigate('/admin/users')} className="cursor-pointer hover:shadow-md transition-shadow">
          <MetricCard title="Active Riders" value={stats.activeRiders ?? 0} color="success"
            icon={<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="5.5" cy="17.5" r="3.5" /><circle cx="18.5" cy="17.5" r="3.5" /><path d="M15 6l-3-5-4 5H2v2l5 2 2 6h2l2-6 6-2V6z" /></svg>} />
        </div>
        <div onClick={() => navigate('/admin/reports')} className="cursor-pointer hover:shadow-md transition-shadow">
          <MetricCard title="Total Revenue" value={`Rs. ${stats.totalRevenue ?? 0}`} color="primary"
            icon={<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" /></svg>} />
        </div>
      </div>

      <div className="dashboard-section-grid">
        <div className="card col-span-2 cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/admin/reports')}>
          <div className="card-header border-b">
            <div className="header-title-group"><h3>Platform Summary</h3><p>Delivery fees collected by the platform</p></div>
          </div>
          <div className="card-body" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', padding: 32 }}>
            <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginBottom: 8 }}>Platform Profit (Delivery Fees)</p>
            <p className="metric-value text-success">Rs. {stats.profit ?? 0}</p>
          </div>
        </div>
        <div className="card cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/admin/reports')}>
          <div className="card-header border-b"><h3>Delivery Charges Collected</h3></div>
          <div className="card-body" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', padding: 32 }}>
            <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginBottom: 8 }}>Total Delivery Fees</p>
            <p className="metric-value text-primary-color">Rs. {stats.totalDeliveryCharges ?? 0}</p>
          </div>
        </div>
      </div>
    </>
  );
};

// ─── Manage Users ──────────────────────────────────────────────────────────
const ManageUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createModal, setCreateModal] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'vendor', contact: '', shopName: '' });
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

  const deleteUser = async (id, name) => {
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
      setNewUser({ name: '', email: '', password: '', role: 'vendor', contact: '', shopName: '' });
      fetchUsers();
    } catch (err) { showToast(err.response?.data?.message || 'Failed to create user', 'error'); }
  };

  const roleClass = { admin: 'badge-danger', vendor: 'badge-primary', dispatcher: 'badge-warning', rider: 'badge-success' };

  return (
    <>
      <div className="card p-0">
        <div className="card-header border-b" style={{ padding: 20 }}>
          <div className="header-title-group"><h3>Platform Users</h3><p>Manage vendors, dispatchers, and riders</p></div>
          <button className="btn btn-primary btn-sm" onClick={() => setCreateModal(true)}>+ Add User</button>
        </div>
        <div className="table-container">
          <table className="data-table">
            <thead><tr><th>User</th><th>Role</th><th>Contact</th><th>Status</th><th>Last Active</th><th>Actions</th></tr></thead>
            <tbody>
              {loading ? <tr><td colSpan="6" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Loading...</td></tr>
                : users.length === 0 ? <tr><td colSpan="6" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No users found.</td></tr>
                  : users.map(u => (
                    <tr key={u._id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{u.name}</div>
                        <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>{u.email}</div>
                      </td>
                      <td><span className={`badge ${roleClass[u.role] || 'badge-secondary'}`}>{u.role}</span></td>
                      <td style={{ color: 'var(--text-secondary)' }}>{u.contact || '—'}</td>
                      <td><span className={`badge ${u.status === 'Active' ? 'badge-success' : 'badge-danger'}`}>{u.status}</span></td>
                      <td style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-xs)' }}>{u.lastActive ? new Date(u.lastActive).toLocaleDateString() : '—'}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button onClick={() => toggle(u._id)} className={`btn btn-sm ${u.status === 'Active' ? 'btn-warning' : 'btn-success'}`}>
                            {u.status === 'Active' ? 'Suspend' : 'Activate'}
                          </button>
                          {u.role !== 'admin' && (
                            <button onClick={() => deleteUser(u._id, u.name)} className="btn btn-sm btn-danger">Del</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
        <Pagination pagination={pagination} onPageChange={setPage} limit={limit} onLimitChange={setLimit} />
      </div>

      {createModal && (
        <div className="modal-backdrop" onClick={() => setCreateModal(false)}>
          <div className="modal-content max-w-600" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create New User</h3>
              <button className="modal-close" onClick={() => setCreateModal(false)}>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>
            <div className="modal-body">
              <form onSubmit={createUser}>
                <div className="form-row">
                  <div className="form-group col-6"><label>Full Name *</label><input type="text" className="form-control" required value={newUser.name} onChange={e => setNewUser(f => ({ ...f, name: e.target.value }))} /></div>
                  <div className="form-group col-6"><label>Email *</label><input type="email" className="form-control" required value={newUser.email} onChange={e => setNewUser(f => ({ ...f, email: e.target.value }))} /></div>
                </div>
                <div className="form-row">
                  <div className="form-group col-6"><label>Password *</label><input type="password" className="form-control" required minLength={6} value={newUser.password} onChange={e => setNewUser(f => ({ ...f, password: e.target.value }))} /></div>
                  <div className="form-group col-6">
                    <label>Role *</label>
                    <select className="form-select" value={newUser.role} onChange={e => setNewUser(f => ({ ...f, role: e.target.value }))}>
                      <option value="vendor">Vendor</option>
                      <option value="dispatcher">Dispatcher</option>
                      <option value="rider">Rider</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group col-6"><label>Contact/Phone</label><input type="text" className="form-control" value={newUser.contact} onChange={e => setNewUser(f => ({ ...f, contact: e.target.value }))} /></div>
                  {newUser.role === 'vendor' && <div className="form-group col-6"><label>Shop Name</label><input type="text" className="form-control" value={newUser.shopName} onChange={e => setNewUser(f => ({ ...f, shopName: e.target.value }))} /></div>}
                </div>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
                  <button type="button" className="btn btn-outline" onClick={() => setCreateModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">Create User</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
};



// ─── Pricing Rules ──────────────────────────────────────────────────────────
const PricingRules = () => {
  const [users, setUsers] = useState([]);
  const [vendorId, setVendorId] = useState('');
  const [form, setForm] = useState({ defaultKtmRate: 150, defaultOutsideRate: 200, weightSurcharge: 50 });
  const { showToast } = useToast();

  useEffect(() => {
    api.get('/admin/users?role=vendor&limit=500').then(r => {
      const vendors = (r.data.data || []).filter(u => u.role === 'vendor');
      setUsers(vendors);
      if (vendors.length) { setVendorId(vendors[0]._id); setForm({ defaultKtmRate: vendors[0].vendorMeta?.defaultKtmRate || 150, defaultOutsideRate: vendors[0].vendorMeta?.defaultOutsideRate || 200, weightSurcharge: vendors[0].vendorMeta?.weightSurcharge || 50 }); }
    });
  }, []);

  const handleVendorChange = (e) => {
    const v = users.find(u => u._id === e.target.value);
    setVendorId(e.target.value);
    if (v) setForm({ defaultKtmRate: v.vendorMeta?.defaultKtmRate || 150, defaultOutsideRate: v.vendorMeta?.defaultOutsideRate || 200, weightSurcharge: v.vendorMeta?.weightSurcharge || 50 });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.put('/admin/pricing', { vendorId, ...form });
      showToast('Pricing updated successfully', 'success');
    } catch { showToast('Failed to update pricing', 'error'); }
  };

  return (
    <div className="card">
      <div className="card-header border-b">
        <div className="header-title-group"><h3>Pricing Engine Rules</h3><p>Configure vendor-specific delivery rates</p></div>
      </div>
      <div className="card-body">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Select Vendor</label>
            <select className="form-select" value={vendorId} onChange={handleVendorChange}>
              {users.map(u => <option key={u._id} value={u._id}>{u.name} — {u.vendorMeta?.shopName || u.email}</option>)}
            </select>
          </div>
          <div className="form-row">
            <div className="form-group col-6"><label>KTM Valley Base Rate (Rs.)</label><input type="number" className="form-control" value={form.defaultKtmRate} onChange={e => setForm(f => ({ ...f, defaultKtmRate: Number(e.target.value) }))} /></div>
            <div className="form-group col-6"><label>Outside Valley Rate (Rs.)</label><input type="number" className="form-control" value={form.defaultOutsideRate} onChange={e => setForm(f => ({ ...f, defaultOutsideRate: Number(e.target.value) }))} /></div>
          </div>
          <div className="form-group"><label>Weight Surcharge per KG (Rs.)</label><input type="number" className="form-control" value={form.weightSurcharge} onChange={e => setForm(f => ({ ...f, weightSurcharge: Number(e.target.value) }))} /></div>
          <button type="submit" className="btn btn-primary">Update Pricing</button>
        </form>
      </div>
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

  useEffect(() => { fetchHistory(); }, [filter.role]); // Auto-fetch on role change

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Global History */}
      <div className="card p-0">
        <div className="card-header border-b" style={{ padding: 20, display: 'flex', flexWrap: 'wrap', gap: 16, justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="header-title-group"><h3>Global Scan History</h3><p>Audit log of all package scans and status changes</p></div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <input type="text" className="form-control" placeholder="Filter by Tracking Code" value={filter.trackingCode} onChange={e => setFilter({ ...filter, trackingCode: e.target.value })} onKeyDown={e => e.key === 'Enter' && fetchHistory()} style={{ flex: '1 1 160px', minWidth: 0 }} />
            <select className="form-select" value={filter.role} onChange={e => setFilter({ ...filter, role: e.target.value })} style={{ flex: '1 1 140px' }}>
              <option value="">All Roles</option>
              <option value="dispatcher">Warehouse Staff</option>
              <option value="rider">Rider</option>
              <option value="admin">Admin Override</option>
            </select>
            <button className="btn btn-outline" onClick={fetchHistory}>Refresh</button>
          </div>
        </div>
        <div className="table-container">
          <table className="data-table">
            <thead><tr><th>Time</th><th>User / Role</th><th>Tracking Code</th><th>Action</th><th>Location / Notes</th></tr></thead>
            <tbody>
              {loading ? <tr><td colSpan="5" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Loading...</td></tr>
                : history.length === 0 ? <tr><td colSpan="5" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No scan records found.</td></tr>
                  : history.map(ev => (
                    <tr key={ev._id}>
                      <td style={{ color: 'var(--text-muted)' }}>{new Date(ev.createdAt).toLocaleString()}</td>
                      <td><div style={{ fontWeight: 600 }}>{ev.scannerName}</div><div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>{ev.scannerRole === 'dispatcher' ? 'Warehouse Staff' : ev.scannerRole}{ev.isAdminOverride && ' (Override)'}</div></td>
                      <td style={{ fontWeight: 600, fontFamily: 'monospace', color: 'var(--color-primary)' }}>{ev.trackingCode}</td>
                      <td>{statusBadge(ev.toStatus)}</td>
                      <td>
                        {ev.location && <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>📍 {ev.location}</div>}
                        {ev.notes && <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>📝 {ev.notes}</div>}
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
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
    <div className="card p-0">
      <div className="card-header border-b" style={{ padding: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div className="header-title-group"><h3>Vendor P&L Analytics</h3><p>Revenue, delivery costs, and payouts by vendor</p></div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: '#6b7280' }}>From:</label>
          <input type="date" className="form-control" value={startDate} onChange={e => setStartDate(e.target.value)} style={{ padding: '6px 12px', fontSize: 13 }} />
          <label style={{ fontSize: 12, fontWeight: 600, color: '#6b7280' }}>To:</label>
          <input type="date" className="form-control" value={endDate} onChange={e => setEndDate(e.target.value)} style={{ padding: '6px 12px', fontSize: 13 }} />
          {(startDate || endDate) && <button onClick={() => { setStartDate(''); setEndDate(''); }} className="btn btn-outline btn-sm">Clear</button>}
        </div>
      </div>
      <div className="table-container">
        <table className="data-table">
          <thead><tr><th>Vendor</th><th>Deliveries</th><th>Gross Revenue (COD)</th><th>Delivery Costs</th><th>Net Payout</th></tr></thead>
          <tbody>
            {loading ? <tr><td colSpan="5" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Loading...</td></tr>
              : analytics.length === 0 ? <tr><td colSpan="5" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No analytics data yet.</td></tr>
                : analytics.map((a, i) => (
                  <tr key={i}>
                    <td><div style={{ fontWeight: 600 }}>{a.vendorInfo?.[0]?.name || 'Unknown'}</div></td>
                    <td>{a.count}</td>
                    <td className="text-success">Rs. {a.grossRevenue?.toLocaleString()}</td>
                    <td className="text-danger">Rs. {a.deliveryCosts?.toLocaleString()}</td>
                    <td className="text-primary-color bold">Rs. {((a.grossRevenue || 0) - (a.deliveryCosts || 0)).toLocaleString()}</td>
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
    <div className="card p-0">
      <div className="card-header border-b" style={{ padding: 20 }}>
        <div className="header-title-group"><h3>Vendor Settlement Requests</h3><p>Approve and reconcile vendor payments</p></div>
      </div>
      <div className="table-container">
        <table className="data-table">
          <thead><tr><th>Date Requested</th><th>Vendor</th><th>Requested Amount</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {loading ? <tr><td colSpan="5" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Loading...</td></tr>
              : settlements.length === 0 ? <tr><td colSpan="5" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No settlement requests found.</td></tr>
                : settlements.map(s => (
                  <tr key={s._id}>
                    <td style={{ color: 'var(--text-muted)' }}>{new Date(s.createdAt).toLocaleDateString()}</td>
                    <td><div style={{ fontWeight: 600 }}>{s.vendorId?.name || 'Unknown'}</div><div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>{s.vendorId?.vendorMeta?.shopName}</div></td>
                    <td style={{ fontWeight: 600, color: 'var(--color-primary)' }}>Rs. {s.requestedAmount}</td>
                    <td><span className={`badge ${s.status === 'Approved' ? 'badge-success' : s.status === 'Rejected' ? 'badge-danger' : 'badge-warning'}`}>{s.status}</span></td>
                    <td>
                      {s.status === 'Pending' ? (
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button className="btn btn-success btn-sm btn-mobile-icon" onClick={() => handleAction(s._id, 'Approved')} title="Approve">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                            <span className="btn-text">Approve</span>
                          </button>
                          <button className="btn btn-danger btn-sm btn-mobile-icon" onClick={() => handleAction(s._id, 'Rejected')} title="Reject">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                            <span className="btn-text">Reject</span>
                          </button>
                        </div>
                      ) : <span style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)' }}>Processed</span>}
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
    <div className="card p-0">
      <div className="card-header border-b" style={{ padding: 20, display: 'flex', flexWrap: 'wrap', gap: 16, justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="header-title-group"><h3>Rider Expenses Log</h3><p>Global view of all submitted rider expenses</p></div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <select className="form-select" value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
            <option value="">All Categories</option>
            <option value="fuel">Fuel</option>
            <option value="food">Food</option>
            <option value="misc">Misc</option>
          </select>
          <select className="form-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>
      </div>
      <div className="table-container">
        <table className="data-table">
          <thead><tr><th>Date</th><th>Rider</th><th>Category</th><th>Amount</th><th>Description</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {loading ? <tr><td colSpan="7" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Loading...</td></tr>
              : expenses.length === 0 ? <tr><td colSpan="7" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No expenses logged.</td></tr>
                : expenses.map(e => (
                  <tr key={e._id}>
                    <td style={{ color: 'var(--text-muted)' }}>{new Date(e.date).toLocaleDateString()}</td>
                    <td style={{ fontWeight: 600 }}>{e.riderId?.name || 'Unknown'}</td>
                    <td><span className="badge badge-secondary">{e.category}</span></td>
                    <td className="text-danger">Rs. {e.amount}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{e.description}</td>
                    <td><span className={`badge ${e.status === 'Approved' ? 'badge-success' : e.status === 'Rejected' ? 'badge-danger' : 'badge-warning'}`}>{e.status}</span></td>
                    <td>
                      {e.status === 'Pending' ? (
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button className="btn btn-success btn-sm btn-mobile-icon" onClick={() => handleStatusUpdate(e._id, 'Approved')} title="Approve">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                            <span className="btn-text">Approve</span>
                          </button>
                          <button className="btn btn-danger btn-sm btn-mobile-icon" onClick={() => handleStatusUpdate(e._id, 'Rejected')} title="Reject">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                            <span className="btn-text">Reject</span>
                          </button>
                        </div>
                      ) : <span style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)' }}>Processed</span>}
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

// ─── Admin Packages ────────────────────────────────────────────────────────
const AdminPackages = () => {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState(null);
  const { showToast } = useToast();

  const [editModal, setEditModal] = useState(false);
  const [editPkg, setEditPkg] = useState(null);

  const fetchPackages = () => {
    setLoading(true);
    const q = new URLSearchParams({ page, limit });
    if (search) q.append('search', search);
    
    api.get(`/admin/packages?${q.toString()}`)
      .then(r => {
        setPackages(r.data.data || []);
        setPagination(r.data.pagination);
      })
      .catch(() => showToast('Failed to load packages', 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchPackages(); }, [page, limit, search]);

  const openEdit = (pkg) => {
    setEditPkg({ ...pkg });
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
        weight: Number(editPkg.weight)
      });
      showToast('Package updated successfully', 'success');
      setEditModal(false);
      fetchPackages();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update package', 'error');
    }
  };

  return (
    <div className="card p-0">
      <div className="card-header border-b" style={{ padding: 20, display: 'flex', flexWrap: 'wrap', gap: 16, justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="header-title-group"><h3>All Packages</h3><p>Manage all packages across the platform</p></div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <input type="text" className="form-control" placeholder="Search tracking or customer..." value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && fetchPackages()} style={{ minWidth: 200 }} />
          <button className="btn btn-primary" onClick={() => { setPage(1); fetchPackages(); }}>Search</button>
        </div>
      </div>
      <div className="table-container">
        <table className="data-table">
          <thead><tr><th>Date</th><th>Tracking Code</th><th>Vendor</th><th>Customer</th><th>Status</th><th>Amount (COD)</th><th>Actions</th></tr></thead>
          <tbody>
            {loading ? <tr><td colSpan="7" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Loading...</td></tr>
              : packages.length === 0 ? <tr><td colSpan="7" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No packages found.</td></tr>
                : packages.map(p => (
                  <tr key={p._id}>
                    <td style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)' }}>{new Date(p.createdAt).toLocaleDateString()}</td>
                    <td style={{ fontWeight: 600, fontFamily: 'monospace', color: 'var(--color-primary)' }}>{p.trackingCode}</td>
                    <td><div style={{ fontWeight: 600 }}>{p.vendorId?.name || '—'}</div></td>
                    <td>
                      <div>{p.customerName}</div>
                      <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>{p.city ? `${p.city}, ` : ''}{p.address}</div>
                    </td>
                    <td>{statusBadge(p.status)}</td>
                    <td style={{ fontWeight: 600 }}>Rs. {p.amount?.toLocaleString()}</td>
                    <td>
                      <button className="btn btn-outline btn-sm btn-mobile-icon" onClick={() => openEdit(p)} title="Edit">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        <span className="btn-text">Edit</span>
                      </button>
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>
      <Pagination pagination={pagination} onPageChange={setPage} limit={limit} onLimitChange={setLimit} />

      {/* Edit Modal */}
      {editModal && editPkg && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 12, width: '100%', maxWidth: 500, overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Edit Package Details</h3>
              <button onClick={() => setEditModal(false)} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: '#6b7280' }}>&times;</button>
            </div>
            <form onSubmit={handleUpdate} style={{ padding: 20 }}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 4 }}>Tracking Code (Read Only)</label>
                <input type="text" value={editPkg.trackingCode} disabled style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6, background: '#f3f4f6', color: '#6b7280', fontFamily: 'monospace' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 4 }}>Customer Name</label>
                  <input type="text" required value={editPkg.customerName} onChange={e => setEditPkg({ ...editPkg, customerName: e.target.value })} style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6, boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 4 }}>Customer Phone</label>
                  <input type="text" required value={editPkg.customerPhone} onChange={e => setEditPkg({ ...editPkg, customerPhone: e.target.value })} style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6, boxSizing: 'border-box' }} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 4 }}>City</label>
                  <input type="text" value={editPkg.city || ''} onChange={e => setEditPkg({ ...editPkg, city: e.target.value })} style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6, boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 4 }}>Address</label>
                  <input type="text" required value={editPkg.address} onChange={e => setEditPkg({ ...editPkg, address: e.target.value })} style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6, boxSizing: 'border-box' }} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 4 }}>Amount (COD)</label>
                  <input type="number" required value={editPkg.amount} onChange={e => setEditPkg({ ...editPkg, amount: e.target.value })} style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6, boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 4 }}>Weight (KG)</label>
                  <input type="number" step="0.1" required value={editPkg.weight} onChange={e => setEditPkg({ ...editPkg, weight: e.target.value })} style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6, boxSizing: 'border-box' }} />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                <button type="button" onClick={() => setEditModal(false)} className="btn btn-outline">Cancel</button>
                <button type="submit" className="btn btn-primary">Save Changes</button>
              </div>
            </form>
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
        {/* Redirect old pricing link if users have it bookmarked */}
        <Route path="/pricing" element={<PricingEngine />} />
        <Route path="/scan-history" element={<AdminScanHistory />} />
        <Route path="/packages" element={<AdminPackages />} />
        <Route path="/reports" element={<AdminReports />} />
      </Routes>
    </AppShell>
  );
};

export default AdminDashboard;
