import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Search, Filter, Truck, CornerUpLeft, MessageSquare, AlertCircle } from 'lucide-react';

const StatusBadge = ({ status }) => {
  let color = 'bg-gray-100 text-gray-800';
  if (status === 'Delivered') color = 'bg-green-100 text-green-800';
  if (status === 'Cancelled') color = 'bg-red-100 text-red-800';
  if (['Returned', 'Returned to Vendor'].includes(status)) color = 'bg-blue-100 text-blue-800';
  if (['Pending', 'Pick Up Requested', 'Picked Up', 'In Warehouse', 'Out for Delivery'].includes(status)) color = 'bg-yellow-100 text-yellow-800';

  return (
    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${color}`}>
      {status}
    </span>
  );
};

const PackageList = () => {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedPackages, setSelectedPackages] = useState([]);
  
  // Comment Modal state
  const [commentModal, setCommentModal] = useState({ open: false, packageId: null, text: '' });

  const fetchPackages = async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/vendor/packages?status=${statusFilter}&search=${search}`);
      setPackages(data.data);
    } catch (error) {
      console.error('Failed to fetch packages', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchPackages();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [search, statusFilter]);

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const selectable = packages.filter(p => p.status === 'Pending').map(p => p._id);
      setSelectedPackages(selectable);
    } else {
      setSelectedPackages([]);
    }
  };

  const handleSelect = (id) => {
    if (selectedPackages.includes(id)) {
      setSelectedPackages(selectedPackages.filter(p => p !== id));
    } else {
      setSelectedPackages([...selectedPackages, id]);
    }
  };

  const handleRequestPickup = async () => {
    if (selectedPackages.length === 0) return alert('Select packages first');
    try {
      await api.post('/vendor/pickup-request', { packageIds: selectedPackages });
      alert('Pickup requested successfully');
      setSelectedPackages([]);
      fetchPackages();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to request pickup');
    }
  };

  const handleRequestReturn = async (id) => {
    if (!window.confirm('Are you sure you want to request a return for this package?')) return;
    try {
      await api.put(`/vendor/packages/${id}/return`);
      fetchPackages();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to request return');
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentModal.text) return;
    try {
      await api.post(`/vendor/packages/${commentModal.packageId}/comments`, { text: commentModal.text });
      setCommentModal({ open: false, packageId: null, text: '' });
      fetchPackages();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to add comment');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <h1 className="text-2xl font-bold text-gray-900">Order Management</h1>
        <div className="flex space-x-2">
          {selectedPackages.length > 0 && (
            <button
              onClick={handleRequestPickup}
              className="flex items-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
            >
              <Truck size={16} className="mr-2" />
              Request Pickup ({selectedPackages.length})
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search by tracking code, name, invoice..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div className="w-full md:w-64 relative">
          <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white"
          >
            <option value="all">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Pick Up Requested">Pick Up Requested</option>
            <option value="In Warehouse">In Warehouse</option>
            <option value="Out for Delivery">Out for Delivery</option>
            <option value="Delivered">Delivered</option>
            <option value="Cancelled">Cancelled</option>
            <option value="Returned to Vendor">Returned to Vendor</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white shadow-sm rounded-xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    onChange={handleSelectAll}
                    checked={selectedPackages.length > 0 && selectedPackages.length === packages.filter(p => p.status === 'Pending').length}
                  />
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tracking / Invoice</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan="7" className="px-6 py-10 text-center text-gray-500">Loading...</td></tr>
              ) : packages.length === 0 ? (
                <tr><td colSpan="7" className="px-6 py-10 text-center text-gray-500">No packages found.</td></tr>
              ) : (
                packages.map((pkg) => (
                  <tr key={pkg._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                        checked={selectedPackages.includes(pkg._id)}
                        onChange={() => handleSelect(pkg._id)}
                        disabled={pkg.status !== 'Pending'}
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">{pkg.trackingCode}</div>
                      <div className="text-xs text-gray-500">{pkg.invoiceId}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{pkg.customerName}</div>
                      <div className="text-xs text-gray-500">{pkg.city ? `${pkg.city}, ` : ''}{pkg.address}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={pkg.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      Rs. {pkg.amount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(pkg.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button 
                          onClick={() => setCommentModal({ open: true, packageId: pkg._id, text: '' })}
                          className="text-gray-400 hover:text-blue-600 transition-colors"
                          title="Add Note/Comment"
                        >
                          <MessageSquare size={18} />
                        </button>
                        {['Pending', 'Cancelled', 'Returned'].includes(pkg.status) && (
                          <button 
                            onClick={() => handleRequestReturn(pkg._id)}
                            className="text-gray-400 hover:text-red-600 transition-colors"
                            title="Request Return to Vendor"
                          >
                            <CornerUpLeft size={18} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Comment Modal */}
      {commentModal.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Add Comment to Package</h3>
            <form onSubmit={handleAddComment}>
              <textarea
                value={commentModal.text}
                onChange={(e) => setCommentModal({ ...commentModal, text: e.target.value })}
                className="w-full border border-gray-300 rounded-lg p-3 h-32 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="Enter your notes or instructions for the dispatcher/rider..."
                required
              ></textarea>
              <div className="mt-4 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setCommentModal({ open: false, packageId: null, text: '' })}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Save Comment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PackageList;
