import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MetricCard from '../../../components/MetricCard';
import api from '../../../api/axios';
import { useToast } from '../../../context/ToastContext';
import { Package, TrendingUp, CheckCircle, XCircle, Clock, Truck, RotateCcw } from 'lucide-react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

const DashboardOverview = () => {
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { showToast } = useToast();

  useEffect(() => {
    api.get('/vendor/dashboard')
      .then(r => setStats(r.data.data || {}))
      .catch(err => {
        console.error(err);
        showToast('Failed to load dashboard statistics', 'error');
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Fallbacks for chart data
  const statusData = {
    labels: ['Pending', 'In Transit', 'Delivered', 'Returned', 'Cancelled'],
    datasets: [
      {
        data: [stats.pending || 0, stats.pickupRequests || 0, stats.delivered || 0, stats.returned || 0, 0],
        backgroundColor: ['#eab308', '#3b82f6', '#22c55e', '#6366f1', '#ef4444'],
        borderWidth: 0,
      },
    ],
  };

  const performanceData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Deliveries',
        data: [12, 19, 15, 22, 30, 25, stats.delivered || 0], // Mocking some history
        backgroundColor: '#3b82f6',
        borderRadius: 4,
      },
    ],
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Dashboard Overview</h2>
          <p className="text-sm text-gray-500">Track your logistics performance and recent activity.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => navigate('/vendor/packages/new')} className="btn btn-primary flex items-center gap-2">
            <Package size={18} /> New Package
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Total Packages" value={stats.total || 0} icon={<Package size={24} />} color="primary" />
        <MetricCard title="Delivered" value={stats.delivered || 0} icon={<CheckCircle size={24} />} color="success" />
        <MetricCard title="Pending Pickup" value={stats.pickupRequests || 0} icon={<Clock size={24} />} color="warning" />
        <MetricCard title="Returned" value={stats.returned || 0} icon={<RotateCcw size={24} />} color="danger" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart 1 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 lg:col-span-2">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2"><TrendingUp size={18} className="text-blue-500"/> Delivery Performance (7 Days)</h3>
          <div className="h-64">
            <Bar data={performanceData} options={{ maintainAspectRatio: false, plugins: { legend: { display: false } } }} />
          </div>
        </div>

        {/* Chart 2 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Orders by Status</h3>
          <div className="h-64 flex justify-center">
            <Doughnut data={statusData} options={{ maintainAspectRatio: false }} />
          </div>
        </div>
      </div>

      {/* Quick Actions & Recent Activity Placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => navigate('/vendor/packages/bulk')} className="p-4 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium transition-colors flex flex-col items-center gap-2">
              <TrendingUp size={24} /> Bulk Upload
            </button>
            <button onClick={() => navigate('/vendor/packages')} className="p-4 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-medium transition-colors flex flex-col items-center gap-2">
              <Truck size={24} /> Manage Orders
            </button>
            <button onClick={() => navigate('/vendor/finance')} className="p-4 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 font-medium transition-colors flex flex-col items-center gap-2">
              <CheckCircle size={24} /> Request Payment
            </button>
            <button onClick={() => navigate('/vendor/returns')} className="p-4 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-medium transition-colors flex flex-col items-center gap-2">
              <RotateCcw size={24} /> View Returns
            </button>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Activity</h3>
          <div className="space-y-4">
             <div className="text-sm text-gray-500 italic flex items-center justify-center h-32 bg-gray-50 rounded-lg border border-dashed border-gray-200">
               Live activity feed loading...
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardOverview;
