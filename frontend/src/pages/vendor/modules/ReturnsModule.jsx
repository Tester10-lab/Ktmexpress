import React, { useState, useEffect } from 'react';
import { RotateCcw, AlertCircle, FileText, Search, Plus } from 'lucide-react';
import api from '../../../api/axios';
import { useToast } from '../../../context/ToastContext';
import { useNavigate } from 'react-router-dom';

const ReturnsModule = () => {
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const { showToast } = useToast();
  const navigate = useNavigate();

  const fetchReturns = async () => {
    setLoading(true);
    try {
      const res = await api.get('/vendor/returns');
      setReturns(res.data.data);
    } catch (err) {
      showToast('Failed to load return requests', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReturns();
  }, []);

  const filteredReturns = returns.filter(r => {
    const matchStatus = statusFilter === 'all' || r.status === statusFilter;
    const matchSearch = search === '' || 
      r.packageId?.trackingCode?.toLowerCase().includes(search.toLowerCase()) || 
      r.packageId?.customerName?.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const statusColors = {
    'Requested': 'bg-amber-100 text-amber-800',
    'Approved': 'bg-blue-100 text-blue-800',
    'In Transit': 'bg-indigo-100 text-indigo-800',
    'Returned To Vendor': 'bg-emerald-100 text-emerald-800'
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Return Management</h2>
          <p className="text-sm text-gray-500">Track and manage your returned packages.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => navigate('/vendor/packages')} className="btn btn-primary flex items-center gap-2">
            <Plus size={18} /> Request New Return
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm flex flex-col justify-center">
          <div className="text-gray-500 text-sm font-medium mb-1 uppercase tracking-wider">Total Returns</div>
          <div className="text-3xl font-bold text-gray-800">{returns.length}</div>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm flex flex-col justify-center border-l-4 border-l-amber-400">
          <div className="text-gray-500 text-sm font-medium mb-1 uppercase tracking-wider">Pending Requests</div>
          <div className="text-3xl font-bold text-gray-800">{returns.filter(r => r.status === 'Requested').length}</div>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm flex flex-col justify-center border-l-4 border-l-indigo-400">
          <div className="text-gray-500 text-sm font-medium mb-1 uppercase tracking-wider">In Transit</div>
          <div className="text-3xl font-bold text-gray-800">{returns.filter(r => r.status === 'In Transit').length}</div>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm flex flex-col justify-center border-l-4 border-l-emerald-400">
          <div className="text-gray-500 text-sm font-medium mb-1 uppercase tracking-wider">Returned to Vendor</div>
          <div className="text-3xl font-bold text-gray-800">{returns.filter(r => r.status === 'Returned To Vendor').length}</div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex gap-3 flex-wrap flex-1">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search tracking or customer..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
            />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none">
            <option value="all">All Statuses</option>
            <option value="Requested">Requested</option>
            <option value="Approved">Approved</option>
            <option value="In Transit">In Transit</option>
            <option value="Returned To Vendor">Returned To Vendor</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mt-8">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase text-xs font-semibold">
              <tr>
                <th className="px-5 py-4">Tracking Code</th>
                <th className="px-5 py-4">Customer</th>
                <th className="px-5 py-4">Reason</th>
                <th className="px-5 py-4">Notes</th>
                <th className="px-5 py-4 text-center">Status</th>
                <th className="px-5 py-4 text-right">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-5 py-12 text-center">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
                  </td>
                </tr>
              ) : filteredReturns.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-5 py-12 text-center text-gray-500">
                    <RotateCcw className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                    <p className="text-lg font-medium text-gray-900 mb-1">No return requests found</p>
                    <p>Try adjusting your filters or search.</p>
                  </td>
                </tr>
              ) : (
                filteredReturns.map(r => (
                  <tr key={r._id} className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => navigate(`/vendor/packages/${r.packageId?._id}`)}>
                    <td className="px-5 py-4 font-semibold text-blue-600">{r.packageId?.trackingCode || 'Unknown'}</td>
                    <td className="px-5 py-4 text-gray-900 font-medium">{r.packageId?.customerName || 'Unknown'}</td>
                    <td className="px-5 py-4 text-gray-700 font-medium">{r.reason}</td>
                    <td className="px-5 py-4 text-gray-500 max-w-[200px] truncate" title={r.notes}>{r.notes || '-'}</td>
                    <td className="px-5 py-4 text-center">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[r.status] || 'bg-gray-100 text-gray-800'}`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right text-gray-500">{new Date(r.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ReturnsModule;
