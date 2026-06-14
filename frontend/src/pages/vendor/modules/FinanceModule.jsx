import React, { useState, useEffect } from 'react';
import { DollarSign, CreditCard, Clock, CheckCircle, Download, FileText } from 'lucide-react';
import api from '../../../api/axios';
import { useToast } from '../../../context/ToastContext';

const FinanceModule = () => {
  const [financeData, setFinanceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);
  const { showToast } = useToast();

  const fetchFinance = async () => {
    try {
      const res = await api.get('/vendor/finance');
      setFinanceData(res.data.data);
    } catch (err) {
      showToast('Failed to load finance data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinance();
  }, []);

  const handleRequestSettlement = async () => {
    setRequesting(true);
    try {
      await api.post('/vendor/settlements');
      showToast('Settlement requested successfully', 'success');
      fetchFinance();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to request settlement', 'error');
    } finally {
      setRequesting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const statusColors = {
    'Pending': 'bg-amber-100 text-amber-800',
    'Approved': 'bg-blue-100 text-blue-800',
    'Paid': 'bg-emerald-100 text-emerald-800',
    'Rejected': 'bg-rose-100 text-rose-800'
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Finance & Settlements</h2>
        <p className="text-sm text-gray-500">Track your COD collections, delivery charges, and request payouts.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10 text-emerald-500"><DollarSign size={80}/></div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg"><DollarSign size={20}/></div>
            <h3 className="font-semibold text-gray-700">Total COD Collected</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900 mt-4">Rs. {financeData?.pendingCOD || 0}</p>
          <p className="text-sm text-gray-500 mt-1">From {financeData?.pendingPackagesCount || 0} delivered orders</p>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10 text-rose-500"><CreditCard size={80}/></div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-rose-100 text-rose-600 rounded-lg"><CreditCard size={20}/></div>
            <h3 className="font-semibold text-gray-700">Total Fees</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900 mt-4">Rs. {financeData?.pendingDeliveryCharges || 0}</p>
          <p className="text-sm text-gray-500 mt-1">Delivery charges deducted</p>
        </div>

        <div className="bg-white rounded-xl p-6 border border-emerald-500 shadow-sm relative overflow-hidden bg-emerald-50">
          <div className="absolute top-0 right-0 p-4 opacity-10 text-emerald-600"><CheckCircle size={80}/></div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-200 text-emerald-700 rounded-lg"><CheckCircle size={20}/></div>
            <h3 className="font-semibold text-emerald-800">Net Settled Amount</h3>
          </div>
          <p className="text-3xl font-bold text-emerald-900 mt-4">Rs. {financeData?.totalPayable || 0}</p>
          <div className="mt-4">
            <button 
              onClick={handleRequestSettlement}
              disabled={requesting || !financeData?.totalPayable || financeData.totalPayable <= 0}
              className="w-full btn bg-emerald-600 hover:bg-emerald-700 text-white font-medium border-none shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {requesting ? 'Requesting...' : 'Request Payout'}
            </button>
          </div>
        </div>
      </div>

      {/* Settlements Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mt-8">
        <div className="p-5 border-b border-gray-200 flex justify-between items-center bg-gray-50">
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2"><Clock size={18} className="text-blue-500"/> Settlement History</h3>
          <button className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1.5"><Download size={16}/> Export History</button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-white border-b border-gray-100 text-gray-500 uppercase text-xs font-semibold">
              <tr>
                <th className="px-5 py-4">Settlement ID</th>
                <th className="px-5 py-4">Date Requested</th>
                <th className="px-5 py-4 text-center">Orders</th>
                <th className="px-5 py-4 text-right">COD Amount</th>
                <th className="px-5 py-4 text-right">Fees</th>
                <th className="px-5 py-4 text-right">Net Amount</th>
                <th className="px-5 py-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {!financeData?.settlements || financeData.settlements.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-5 py-12 text-center text-gray-500">
                    <FileText className="mx-auto h-10 w-10 text-gray-300 mb-3" />
                    <p className="text-base font-medium text-gray-900">No settlements found</p>
                    <p className="text-sm mt-1">Request a payout to see your history here.</p>
                  </td>
                </tr>
              ) : (
                financeData.settlements.map((s) => (
                  <tr key={s._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4 font-medium text-blue-600">#{s._id.substring(s._id.length - 8).toUpperCase()}</td>
                    <td className="px-5 py-4 text-gray-600">{new Date(s.createdAt).toLocaleDateString()}</td>
                    <td className="px-5 py-4 text-center text-gray-900">{s.totalOrders || s.packageIds?.length || 0}</td>
                    <td className="px-5 py-4 text-right text-gray-600">Rs. {s.totalCOD || 0}</td>
                    <td className="px-5 py-4 text-right text-rose-600">- Rs. {s.totalFees || 0}</td>
                    <td className="px-5 py-4 text-right font-bold text-gray-900">Rs. {s.netAmount || s.requestedAmount}</td>
                    <td className="px-5 py-4 text-center">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[s.status] || 'bg-gray-100 text-gray-800'}`}>
                        {s.status}
                      </span>
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

export default FinanceModule;
