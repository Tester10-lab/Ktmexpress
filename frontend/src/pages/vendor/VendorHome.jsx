import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import MetricCard from '../../components/MetricCard';
import { Package, CheckCircle, Clock, RefreshCcw, Truck } from 'lucide-react';
import { Link } from 'react-router-dom';

const VendorHome = () => {
  const [stats, setStats] = useState({
    total: 0,
    delivered: 0,
    pending: 0,
    returned: 0,
    todayPkgs: 0,
    pickupRequests: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const { data } = await api.get('/vendor/dashboard');
        setStats(data.data);
      } catch (error) {
        console.error('Failed to fetch dashboard stats', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) {
    return <div className="flex justify-center items-center h-64 text-gray-500">Loading dashboard...</div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
        <Link to="/vendor/packages/new" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm">
          + New Order
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <MetricCard title="Total Orders" value={stats.total} icon={<Package />} color="blue" />
        <MetricCard title="Delivered" value={stats.delivered} icon={<CheckCircle />} color="green" />
        <MetricCard title="Pending" value={stats.pending} icon={<Clock />} color="yellow" />
        <MetricCard title="Returned" value={stats.returned} icon={<RefreshCcw />} color="red" />
        <MetricCard title="Added Today" value={stats.todayPkgs} icon={<Package />} color="indigo" />
        <MetricCard title="Pending Pickups" value={stats.pickupRequests} icon={<Truck />} color="blue" />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mt-8">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <Link to="/vendor/packages/bulk" className="flex flex-col items-center justify-center p-6 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors border border-blue-100 cursor-pointer">
            <Package size={24} className="mb-2" />
            <span className="font-medium">Bulk Upload CSV</span>
          </Link>
          <Link to="/vendor/packages" className="flex flex-col items-center justify-center p-6 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg transition-colors border border-green-100 cursor-pointer">
            <Truck size={24} className="mb-2" />
            <span className="font-medium">Request Pickup</span>
          </Link>
          <Link to="/vendor/finance" className="flex flex-col items-center justify-center p-6 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg transition-colors border border-purple-100 cursor-pointer">
            <DollarSignIcon className="mb-2 text-purple-600" />
            <span className="font-medium">Request Payment</span>
          </Link>
          <Link to="/vendor/history" className="flex flex-col items-center justify-center p-6 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg transition-colors border border-gray-200 cursor-pointer">
            <HistoryIcon className="mb-2 text-gray-600" />
            <span className="font-medium">View History</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

// Helper icons
const DollarSignIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
);

const HistoryIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
);

export default VendorHome;
