import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../api/axios';
import MetricCard from '../../../components/MetricCard';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import {
  Package, CheckCircle2, XCircle, AlertTriangle, Truck, Users,
  Wallet, Clock, ArrowUpRight, TrendingUp, RefreshCw, DollarSign,
  BarChart3, Activity, MapPin, ShieldCheck
} from 'lucide-react';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#8b5cf6', '#ec4899', '#f97316', '#14b8a6', '#84cc16'];
const STATUS_COLORS = {
  'Delivered': '#10b981',
  'Pending': '#f59e0b',
  'Out for Delivery': '#6366f1',
  'Cancelled': '#ef4444',
  'Returned': '#06b6d4',
  'Returned to Vendor': '#8b5cf6',
  'Pick Up Requested': '#f97316',
  'Picked Up': '#14b8a6',
  'In Warehouse': '#84cc16',
  'Postponed': '#fb923c',
};

const fmt = (n) => {
  if (n >= 10000000) return `${(n / 10000000).toFixed(1)}Cr`;
  if (n >= 100000) return `${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return n?.toLocaleString?.() ?? n;
};

const AnalyticsDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(null);
  const navigate = useNavigate();

  const fetchDashboard = async () => {
    try {
      const res = await api.get('/admin/dashboard');
      setData(res.data.data);
      setLastRefresh(new Date());
    } catch (err) {
      console.error('Dashboard fetch failed', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
    const interval = setInterval(fetchDashboard, 60000);
    return () => clearInterval(interval);
  }, []);

  const dailyChartData = useMemo(() => {
    if (!data?.dailyRevenue) return [];
    return data.dailyRevenue.map(d => ({
      date: new Date(d._id).toLocaleDateString('en', { month: 'short', day: 'numeric' }),
      revenue: d.revenue,
      charges: d.charges,
      orders: d.count,
    }));
  }, [data?.dailyRevenue]);

  const monthlyChartData = useMemo(() => {
    if (!data?.monthlyRevenue) return [];
    return data.monthlyRevenue.map(d => ({
      month: new Date(d._id + '-01').toLocaleDateString('en', { month: 'short', year: '2-digit' }),
      revenue: d.revenue,
      charges: d.charges,
      orders: d.count,
    }));
  }, [data?.monthlyRevenue]);

  const statusChartData = useMemo(() => {
    if (!data?.statusDistribution) return [];
    return data.statusDistribution.map(d => ({
      name: d._id,
      value: d.count,
      color: STATUS_COLORS[d._id] || '#94a3b8',
    }));
  }, [data?.statusDistribution]);

  const ordersPerDayData = useMemo(() => {
    if (!data?.ordersPerDay) return [];
    return data.ordersPerDay.map(d => ({
      day: new Date(d._id).toLocaleDateString('en', { weekday: 'short', day: 'numeric' }),
      orders: d.count,
    }));
  }, [data?.ordersPerDay]);

  const ordersPerHourData = useMemo(() => {
    if (!data?.ordersPerHour) return [];
    return data.ordersPerHour.map(d => ({
      hour: `${d._id}:00`,
      orders: d.count,
    }));
  }, [data?.ordersPerHour]);

  if (loading) return (
    <div className="flex justify-center items-center h-64 text-slate-500">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600 mr-3"></div>
      Loading analytics...
    </div>
  );

  if (!data) return <div className="p-8 text-center text-slate-500">Failed to load dashboard data.</div>;

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Analytics Dashboard</h2>
          <p className="text-sm text-slate-500 mt-1">
            Real-time logistics intelligence
            {lastRefresh && <span className="ml-2 text-xs text-slate-400">• Updated {lastRefresh.toLocaleTimeString()}</span>}
          </p>
        </div>
        <button onClick={fetchDashboard} className="btn-secondary btn-sm flex items-center gap-2">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* ─── KPI Section: Today ───────────────────────────────────── */}
      <div>
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
          <span className="text-lg">📅</span> Today's Activity
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <MetricCard title="Orders Today" value={data.todayPackages} color="primary" icon={<Package className="w-5 h-5 text-brand-600" />} />
          <MetricCard title="Deliveries Today" value={data.todayDeliveries} color="success" icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />} />
          <MetricCard title="COD Today" value={`Rs. ${fmt(data.todayCOD)}`} color="info" icon={<DollarSign className="w-5 h-5 text-sky-600" />} />
          <MetricCard title="Orders This Month" value={data.monthPackages} color="purple" icon={<TrendingUp className="w-5 h-5 text-purple-600" />} />
          <MetricCard title="Pending Expenses" value={data.todayExpenses} color="warning" icon={<AlertTriangle className="w-5 h-5 text-amber-600" />} />
          <MetricCard title="COD Pending" value={`Rs. ${fmt(data.codPending)}`} color="danger" icon={<Clock className="w-5 h-5 text-red-600" />} />
        </div>
      </div>

      {/* ─── KPI Section: Delivery Status ──────────────────────────── */}
      <div>
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Delivery Overview</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <div className="cursor-pointer transition-transform hover:-translate-y-1" onClick={() => navigate('/admin/packages')}>
            <MetricCard title="Total Packages" value={data.totalPackages} color="primary" icon={<Package className="w-5 h-5 text-brand-600" />} />
          </div>
          <div className="cursor-pointer transition-transform hover:-translate-y-1" onClick={() => navigate('/admin/packages')}>
            <MetricCard title="Delivered" value={data.delivered} color="success" icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />} />
          </div>
          <div className="cursor-pointer transition-transform hover:-translate-y-1" onClick={() => navigate('/admin/packages')}>
            <MetricCard title="Pending" value={data.pending} color="warning" icon={<AlertTriangle className="w-5 h-5 text-amber-600" />} />
          </div>
          <div className="cursor-pointer transition-transform hover:-translate-y-1" onClick={() => navigate('/admin/packages')}>
            <MetricCard title="Out for Delivery" value={data.outForDelivery} color="info" icon={<Truck className="w-5 h-5 text-sky-600" />} />
          </div>
          <div className="cursor-pointer transition-transform hover:-translate-y-1" onClick={() => navigate('/admin/packages')}>
            <MetricCard title="Cancelled" value={data.cancelled} color="danger" icon={<XCircle className="w-5 h-5 text-red-600" />} />
          </div>
        </div>
      </div>

      {/* ─── KPI Section: Financial ────────────────────────────────── */}
      <div>
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Revenue & Settlement</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <MetricCard title="Total Revenue" value={`Rs. ${fmt(data.totalRevenue)}`} color="primary" icon={<Wallet className="w-5 h-5 text-brand-600" />} />
          <MetricCard title="Delivery Revenue" value={`Rs. ${fmt(data.totalDeliveryCharges)}`} color="success" icon={<ArrowUpRight className="w-5 h-5 text-emerald-600" />} />
          <MetricCard title="Vendor Payable" value={`Rs. ${fmt(data.vendorPayable)}`} color="warning" icon={<DollarSign className="w-5 h-5 text-amber-600" />} />
          <div className="cursor-pointer transition-transform hover:-translate-y-1" onClick={() => navigate('/admin/users')}>
            <MetricCard title="Active Vendors" value={data.activeVendors} color="purple" icon={<Users className="w-5 h-5 text-purple-600" />} />
          </div>
          <div className="cursor-pointer transition-transform hover:-translate-y-1" onClick={() => navigate('/admin/users')}>
            <MetricCard title="Active Riders" value={data.activeRiders} color="success" icon={<Truck className="w-5 h-5 text-emerald-600" />} />
          </div>
        </div>
      </div>

      {/* ─── Charts Row 1: Revenue ──────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Revenue Line Chart */}
        <div className="card-premium">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
            <h3 className="font-bold text-slate-800">Daily Revenue (30 Days)</h3>
            <p className="text-xs text-slate-500 mt-0.5">COD collected vs delivery charges</p>
          </div>
          <div className="p-6" style={{ height: 320 }}>
            {dailyChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailyChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                  <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
                  <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                  <Legend />
                  <Line type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2.5} dot={false} name="COD Revenue" />
                  <Line type="monotone" dataKey="charges" stroke="#10b981" strokeWidth={2.5} dot={false} name="Delivery Charges" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400 text-sm">No revenue data yet</div>
            )}
          </div>
        </div>

        {/* Monthly Revenue Bar Chart */}
        <div className="card-premium">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
            <h3 className="font-bold text-slate-800">Monthly Revenue</h3>
            <p className="text-xs text-slate-500 mt-0.5">Last 12 months</p>
          </div>
          <div className="p-6" style={{ height: 320 }}>
            {monthlyChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                  <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
                  <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0' }} />
                  <Legend />
                  <Bar dataKey="revenue" fill="#6366f1" radius={[6, 6, 0, 0]} name="Revenue" />
                  <Bar dataKey="charges" fill="#10b981" radius={[6, 6, 0, 0]} name="Charges" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400 text-sm">No monthly data yet</div>
            )}
          </div>
        </div>
      </div>

      {/* ─── Charts Row 2: Delivery Analytics ───────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Status Distribution Donut */}
        <div className="card-premium">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
            <h3 className="font-bold text-slate-800">Deliveries by Status</h3>
          </div>
          <div className="p-6" style={{ height: 300 }}>
            {statusChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={3}>
                    {statusChartData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0' }} />
                  <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400 text-sm">No data</div>
            )}
          </div>
        </div>

        {/* Orders Per Day */}
        <div className="card-premium">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
            <h3 className="font-bold text-slate-800">Orders Per Day (7 Days)</h3>
          </div>
          <div className="p-6" style={{ height: 300 }}>
            {ordersPerDayData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ordersPerDayData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="day" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                  <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
                  <Tooltip contentStyle={{ borderRadius: 12 }} />
                  <Bar dataKey="orders" fill="#6366f1" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400 text-sm">No data</div>
            )}
          </div>
        </div>

        {/* Orders Per Hour (Today) */}
        <div className="card-premium">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
            <h3 className="font-bold text-slate-800">Today's Orders by Hour</h3>
          </div>
          <div className="p-6" style={{ height: 300 }}>
            {ordersPerHourData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={ordersPerHourData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="hour" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                  <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
                  <Tooltip contentStyle={{ borderRadius: 12 }} />
                  <Area type="monotone" dataKey="orders" stroke="#8b5cf6" fill="#8b5cf640" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400 text-sm">No orders today yet</div>
            )}
          </div>
        </div>
      </div>

      {/* ─── Rider Leaderboard ──────────────────────────────────── */}
      <div className="card-premium">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
          <Truck className="w-5 h-5 text-emerald-600" />
          <div>
            <h3 className="font-bold text-slate-800">Rider Leaderboard</h3>
            <p className="text-xs text-slate-500 mt-0.5">Sorted by best performance</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-xs">
              <tr>
                <th className="px-6 py-3">#</th>
                <th className="px-6 py-3">Rider</th>
                <th className="px-6 py-3 text-center">Assigned</th>
                <th className="px-6 py-3 text-center">Delivered</th>
                <th className="px-6 py-3 text-center">Failed</th>
                <th className="px-6 py-3 text-right">COD Collected</th>
                <th className="px-6 py-3 text-right">Success Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {(data.riderLeaderboard || []).length === 0 ? (
                <tr><td colSpan="7" className="px-6 py-8 text-center text-slate-400">No rider data yet</td></tr>
              ) : data.riderLeaderboard.map((r, i) => (
                <tr key={r._id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-3">
                    <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${i < 3 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
                      {i + 1}
                    </span>
                  </td>
                  <td className="px-6 py-3 font-bold text-slate-900">{r.riderName || 'Unknown'}</td>
                  <td className="px-6 py-3 text-center font-medium text-slate-700">{r.assigned}</td>
                  <td className="px-6 py-3 text-center font-bold text-emerald-600">{r.delivered}</td>
                  <td className="px-6 py-3 text-center font-bold text-red-500">{r.failed}</td>
                  <td className="px-6 py-3 text-right font-bold text-brand-600">Rs. {r.codCollected?.toLocaleString()}</td>
                  <td className="px-6 py-3 text-right">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${r.successRate >= 80 ? 'bg-emerald-100 text-emerald-700' : r.successRate >= 50 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                      {r.successRate?.toFixed(1)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── Vendor Analytics ──────────────────────────────────── */}
      <div className="card-premium">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
          <Users className="w-5 h-5 text-purple-600" />
          <div>
            <h3 className="font-bold text-slate-800">Vendor Analytics</h3>
            <p className="text-xs text-slate-500 mt-0.5">Sorted by highest sales</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-xs">
              <tr>
                <th className="px-6 py-3">Vendor</th>
                <th className="px-6 py-3 text-center">Orders</th>
                <th className="px-6 py-3 text-right">COD Amount</th>
                <th className="px-6 py-3 text-right">Delivery Charges</th>
                <th className="px-6 py-3 text-right">Vendor Receivable</th>
                <th className="px-6 py-3 text-right">Paid</th>
                <th className="px-6 py-3 text-right">Pending</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {(data.vendorAnalytics || []).length === 0 ? (
                <tr><td colSpan="7" className="px-6 py-8 text-center text-slate-400">No vendor data yet</td></tr>
              ) : data.vendorAnalytics.map((v) => (
                <tr key={v._id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-3 font-bold text-slate-900">{v.vendorName || 'Unknown'}</td>
                  <td className="px-6 py-3 text-center font-medium text-slate-700">{v.orders}</td>
                  <td className="px-6 py-3 text-right font-bold text-brand-600">Rs. {v.codAmount?.toLocaleString()}</td>
                  <td className="px-6 py-3 text-right font-medium text-red-500">Rs. {v.deliveryCharges?.toLocaleString()}</td>
                  <td className="px-6 py-3 text-right font-bold text-emerald-600">Rs. {v.vendorReceivable?.toLocaleString()}</td>
                  <td className="px-6 py-3 text-right font-medium text-slate-600">Rs. {v.paid?.toLocaleString()}</td>
                  <td className="px-6 py-3 text-right">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${v.pending > 0 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                      Rs. {v.pending?.toLocaleString()}
                    </span>
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

export default AnalyticsDashboard;
