import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import MetricCard from '../../components/MetricCard';
import { DollarSign, FileText, CheckCircle, Clock } from 'lucide-react';

const Finance = () => {
  const [financeData, setFinanceData] = useState({
    pendingPackagesCount: 0,
    pendingCOD: 0,
    pendingDeliveryCharges: 0,
    totalPayable: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFinance = async () => {
      try {
        const { data } = await api.get('/vendor/finance');
        setFinanceData(data.data);
      } catch (error) {
        console.error('Failed to fetch finance stats', error);
      } finally {
        setLoading(false);
      }
    };
    fetchFinance();
  }, []);

  const handleRequestPayment = () => {
    alert('Payment request sent to admin! We will process it shortly.');
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64 text-gray-500">Loading finance data...</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Payments & Finance</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Packages to Settle" value={financeData.pendingPackagesCount} icon={<PackageIcon />} color="blue" />
        <MetricCard title="Total COD Collected" value={`Rs. ${financeData.pendingCOD}`} icon={<DollarSign />} color="green" />
        <MetricCard title="Delivery Charges" value={`Rs. ${financeData.pendingDeliveryCharges}`} icon={<FileText />} color="red" />
        <MetricCard title="Net Payable to You" value={`Rs. ${financeData.totalPayable}`} icon={<CheckCircle />} color="indigo" />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mt-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-bold text-gray-900">Request Settlement</h2>
          <button 
            onClick={handleRequestPayment}
            disabled={financeData.totalPayable <= 0}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-medium transition-colors shadow-sm disabled:opacity-50"
          >
            Request Payment
          </button>
        </div>
        
        {financeData.totalPayable > 0 ? (
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-blue-800">
            You have <strong>Rs. {financeData.totalPayable}</strong> pending settlement across {financeData.pendingPackagesCount} delivered packages. Click the button above to request a bank transfer.
          </div>
        ) : (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-gray-600 flex items-center">
            <Clock size={20} className="mr-2" />
            No pending settlements available at this time.
          </div>
        )}
      </div>
    </div>
  );
};

const PackageIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="16.5" y1="9.4" x2="7.5" y2="4.21"></line><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
);

export default Finance;
