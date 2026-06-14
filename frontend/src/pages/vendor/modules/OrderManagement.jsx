import React, { useState, useEffect } from 'react';
import { Search, Filter, Download, Plus, ChevronDown, Package, Edit, Copy, Eye, FileText } from 'lucide-react';
import api from '../../../api/axios';
import { useToast } from '../../../context/ToastContext';
import { useNavigate } from 'react-router-dom';
import Pagination from '../../../components/Pagination';

const OrderManagement = () => {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all'); // all, today, week, month
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [pagination, setPagination] = useState(null);
  const [selected, setSelected] = useState([]);
  const { showToast } = useToast();
  const navigate = useNavigate();

  const fetchPackages = async () => {
    setLoading(true);
    try {
      let url = `/vendor/packages?status=${statusFilter}&search=${search}&page=${page}&limit=${limit}`;
      
      // Calculate date filters
      if (dateFilter !== 'all') {
        const today = new Date();
        today.setHours(0,0,0,0);
        let startDate, endDate;
        if (dateFilter === 'today') {
          startDate = new Date(today);
          endDate = new Date(today);
          endDate.setDate(endDate.getDate() + 1);
        } else if (dateFilter === 'week') {
          startDate = new Date(today);
          startDate.setDate(startDate.getDate() - 7);
          endDate = new Date();
        } else if (dateFilter === 'month') {
          startDate = new Date(today);
          startDate.setMonth(startDate.getMonth() - 1);
          endDate = new Date();
        }
        url += `&startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`;
      }

      const r = await api.get(url);
      setPackages(r.data.data || []);
      setPagination(r.data.pagination);
    } catch {
      showToast('Failed to load packages', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(fetchPackages, 400); // Debounce
    return () => clearTimeout(t);
  }, [search, statusFilter, dateFilter, page, limit]);

  useEffect(() => { setPage(1); }, [search, statusFilter, dateFilter]); // Reset page

  const handleSelectAll = (e) => setSelected(e.target.checked ? packages.map(p => p._id) : []);
  const handleSelect = (id) => setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);

  const requestPickup = async () => {
    const pendingSelected = packages.filter(p => selected.includes(p._id) && p.status === 'Pending').map(p => p._id);
    if (!pendingSelected.length) return showToast('No pending packages selected for pickup.', 'warning');
    
    try {
      await api.post('/vendor/pickup-request', { packageIds: pendingSelected });
      showToast('Pickup requested successfully!', 'success');
      setSelected([]);
      fetchPackages();
    } catch (e) {
      showToast(e.response?.data?.message || 'Failed to request pickup', 'error');
    }
  };

  const statusColors = {
    'Delivered': 'bg-emerald-100 text-emerald-800',
    'Cancelled': 'bg-rose-100 text-rose-800',
    'Returned to Vendor': 'bg-blue-100 text-blue-800',
    'Pending': 'bg-amber-100 text-amber-800',
    'Pick Up Requested': 'bg-amber-100 text-amber-800',
    'Picked Up': 'bg-indigo-100 text-indigo-800',
    'In Warehouse': 'bg-indigo-100 text-indigo-800',
    'Out for Delivery': 'bg-indigo-100 text-indigo-800'
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Order Management</h2>
          <p className="text-sm text-gray-500">Manage, track, and perform bulk actions on your orders.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => navigate('/vendor/packages/new')} className="btn btn-primary flex items-center gap-2">
            <Plus size={18} /> New Order
          </button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex gap-3 flex-wrap flex-1">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search tracking, phone, or name..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
            />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none">
            <option value="all">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Pick Up Requested">Pick Up Requested</option>
            <option value="Out for Delivery">Out for Delivery</option>
            <option value="Delivered">Delivered</option>
            <option value="Returned to Vendor">Returned</option>
          </select>
          <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none">
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
          </select>
        </div>
      </div>

      {selected.length > 0 && (
        <div className="bg-blue-50 border border-blue-100 p-3 rounded-lg flex items-center justify-between animate-in fade-in slide-in-from-top-4 duration-200">
          <span className="text-blue-800 font-medium text-sm">{selected.length} orders selected</span>
          <div className="flex gap-2">
            <button onClick={requestPickup} className="btn btn-sm bg-white border border-blue-200 text-blue-700 hover:bg-blue-50">Request Pickup</button>
            <button onClick={() => setTimeout(() => window.print(), 200)} className="btn btn-sm bg-white border border-blue-200 text-blue-700 hover:bg-blue-50 flex items-center gap-1.5"><FileText size={14}/> Print Labels</button>
          </div>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase text-xs font-semibold">
              <tr>
                <th className="px-4 py-3 w-10">
                  <input type="checkbox" onChange={handleSelectAll} checked={selected.length > 0 && selected.length === packages.length} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                </th>
                <th className="px-4 py-3">Tracking / Reference</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-4 py-12 text-center">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
                  </td>
                </tr>
              ) : packages.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-4 py-12 text-center text-gray-500">
                    <Package className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                    <p className="text-lg font-medium text-gray-900 mb-1">No orders found</p>
                    <p>Try adjusting your search or filters.</p>
                  </td>
                </tr>
              ) : (
                packages.map(pkg => (
                  <tr key={pkg._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <input type="checkbox" checked={selected.includes(pkg._id)} onChange={() => handleSelect(pkg._id)} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-gray-900">{pkg.trackingCode}</div>
                      <div className="text-xs text-gray-500">{pkg.invoiceId}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{pkg.customerName}</div>
                      <div className="text-xs text-gray-500">{pkg.customerPhone}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[pkg.status] || 'bg-gray-100 text-gray-800'}`}>
                        {pkg.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {new Date(pkg.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">
                      Rs. {pkg.amount}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => navigate(`/vendor/packages/${pkg._id}`)} className="text-gray-400 hover:text-blue-600 p-1.5 rounded hover:bg-blue-50 transition-colors tooltip" title="View Details">
                        <Eye size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-gray-200">
          <Pagination pagination={pagination} onPageChange={setPage} limit={limit} onLimitChange={setLimit} />
        </div>
      </div>
    </div>
  );
};

export default OrderManagement;
