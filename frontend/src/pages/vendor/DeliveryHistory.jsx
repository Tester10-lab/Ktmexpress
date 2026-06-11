import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Download, Calendar } from 'lucide-react';

const DeliveryHistory = () => {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPackages = async () => {
      try {
        const { data } = await api.get(`/vendor/packages?status=all`);
        // Filter out pending and active ones to show history
        const history = data.data.filter(p => ['Delivered', 'Cancelled', 'Returned to Vendor'].includes(p.status));
        setPackages(history);
      } catch (error) {
        console.error('Failed to fetch packages', error);
      } finally {
        setLoading(false);
      }
    };
    fetchPackages();
  }, []);

  const handleExportCSV = () => {
    const headers = ['Tracking Code', 'Customer Name', 'Status', 'Amount', 'Date'];
    const csvContent = [
      headers.join(','),
      ...packages.map(p => `"${p.trackingCode}","${p.customerName}","${p.status}",${p.amount},"${new Date(p.createdAt).toLocaleDateString()}"`)
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', 'delivery_history.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Delivery History</h1>
        <button 
          onClick={handleExportCSV}
          disabled={packages.length === 0}
          className="flex items-center bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm disabled:opacity-50"
        >
          <Download size={16} className="mr-2" />
          Export CSV
        </button>
      </div>

      <div className="bg-white shadow-sm rounded-xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tracking Code</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rider</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan="6" className="px-6 py-10 text-center text-gray-500">Loading history...</td></tr>
              ) : packages.length === 0 ? (
                <tr><td colSpan="6" className="px-6 py-10 text-center text-gray-500">No delivery history found.</td></tr>
              ) : (
                packages.map((pkg) => (
                  <tr key={pkg._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(pkg.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                      {pkg.trackingCode}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {pkg.customerName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        pkg.status === 'Delivered' ? 'bg-green-100 text-green-800' : 
                        pkg.status === 'Cancelled' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {pkg.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {pkg.riderId?.name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      Rs. {pkg.amount}
                    </td>
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

export default DeliveryHistory;
