import React, { useState, useEffect, useMemo } from 'react';
import api from '../../../api/axios';
import MetricCard from '../../../components/MetricCard';
import { useToast } from '../../../store/ToastContext';
import { 
  Wallet, Receipt, Search, RefreshCw, CheckCircle2, 
  XCircle, Clock, Coins, Filter, X, ArrowDownRight, User
} from 'lucide-react';

const AdminCodHandovers = () => {
  const [handovers, setHandovers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const { showToast } = useToast();

  const fetchHandovers = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await api.get('/dispatcher/cod-handovers');
      setHandovers(res.data.data || []);
    } catch (e) {
      showToast('Failed to load handovers', 'error');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchHandovers();
  }, []);

  const handleVerify = async (id, status) => {
    if (!window.confirm(`Are you sure you want to mark this handover as ${status}?`)) return;
    setVerifying(id);
    try {
      await api.put(`/dispatcher/cod-handovers/${id}/verify`, { status });
      showToast(`Handover marked as ${status}`, 'success');
      fetchHandovers(true);
    } catch (e) {
      showToast(e.message || 'Failed to verify handover', 'error');
    } finally {
      setVerifying(null);
    }
  };

  // Lifetime / Total stats across all handovers
  const stats = useMemo(() => {
    let gross = 0;
    let expenses = 0;
    let net = 0;
    let pending = 0;
    let pendingCount = 0;
    let verified = 0;
    let verifiedCount = 0;

    handovers.forEach(h => {
      const hGross = h.grossCOD || ((h.amount || 0) + (h.expenseDeduction || 0));
      const hExp = h.expenseDeduction || 0;
      const hNet = h.amount || 0;

      gross += hGross;
      expenses += hExp;
      net += hNet;

      if (h.status === 'Pending Verification') {
        pending += hNet;
        pendingCount++;
      } else if (h.status === 'Verified') {
        verified += hNet;
        verifiedCount++;
      }
    });

    return {
      gross,
      expenses,
      net,
      pending,
      pendingCount,
      verified,
      verifiedCount,
      totalCount: handovers.length
    };
  }, [handovers]);

  // Filtered handovers based on search, status, and date
  const filteredHandovers = useMemo(() => {
    return handovers.filter(h => {
      // 1. Search Query
      if (search.trim()) {
        const s = search.toLowerCase().trim();
        const riderName = (h.riderId?.name || '').toLowerCase();
        const riderPhone = (h.riderId?.contact || h.riderId?.phone || '').toLowerCase();
        const remarks = (h.remarks || '').toLowerCase();
        const idMatch = h._id?.toLowerCase().includes(s);
        if (!riderName.includes(s) && !riderPhone.includes(s) && !remarks.includes(s) && !idMatch) {
          return false;
        }
      }

      // 2. Status Filter
      if (statusFilter !== 'all' && h.status !== statusFilter) {
        return false;
      }

      // 3. Date Filter
      if (dateFilter !== 'all' && h.createdAt) {
        const hDate = new Date(h.createdAt);
        const now = new Date();
        if (dateFilter === 'today') {
          if (hDate.toDateString() !== now.toDateString()) return false;
        } else if (dateFilter === 'yesterday') {
          const yest = new Date();
          yest.setDate(now.getDate() - 1);
          if (hDate.toDateString() !== yest.toDateString()) return false;
        } else if (dateFilter === 'this_week') {
          const weekAgo = new Date();
          weekAgo.setDate(now.getDate() - 7);
          if (hDate < weekAgo) return false;
        } else if (dateFilter === 'this_month') {
          if (hDate.getMonth() !== now.getMonth() || hDate.getFullYear() !== now.getFullYear()) return false;
        }
      }

      return true;
    });
  }, [handovers, search, statusFilter, dateFilter]);

  // Filtered subset totals
  const filteredTotals = useMemo(() => {
    let gross = 0;
    let expenses = 0;
    let net = 0;
    let packages = 0;

    filteredHandovers.forEach(h => {
      gross += h.grossCOD || ((h.amount || 0) + (h.expenseDeduction || 0));
      expenses += h.expenseDeduction || 0;
      net += h.amount || 0;
      packages += h.packageIds?.length || 0;
    });

    return { gross, expenses, net, packages };
  }, [filteredHandovers]);

  const hasActiveFilters = search.trim() !== '' || statusFilter !== 'all' || dateFilter !== 'all';
  const clearFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setDateFilter('all');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">COD Handovers & Rider Expenses</h2>
          <p className="text-sm text-slate-500">
            Reconcile cash collections, track total rider expense deductions, and verify deposits.
          </p>
        </div>
        <button 
          onClick={() => fetchHandovers()} 
          className="btn-secondary btn-sm flex items-center gap-1.5"
        >
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Summary KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 animate-scaleIn">
        <MetricCard
          title="Total Gross COD"
          value={`Rs. ${stats.gross.toLocaleString()}`}
          icon={<Coins />}
          color="primary"
        />
        <MetricCard
          title="Total Rider Expenses"
          value={`Rs. ${stats.expenses.toLocaleString()}`}
          icon={<Receipt />}
          color="warning"
        />
        <MetricCard
          title="Total Net Cash Deposited"
          value={`Rs. ${stats.net.toLocaleString()}`}
          icon={<Wallet />}
          color="success"
        />
        <MetricCard
          title="Pending Verification"
          value={`Rs. ${stats.pending.toLocaleString()}`}
          icon={<Clock />}
          color="purple"
        />
      </div>

      {/* Table Card with Filter Toolbar */}
      <div className="card-premium overflow-hidden">
        {/* Filter Controls Header */}
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center flex-wrap gap-4">
          <div>
            <h3 className="font-bold text-slate-800 text-lg">Handover Records</h3>
            <p className="text-sm text-slate-500">
              Showing {filteredHandovers.length} of {handovers.length} handover submission(s)
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Search Input */}
            <div className="relative min-w-[240px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search rider name, phone..."
                className="input-field pl-9 pr-8 py-1.5 text-xs w-full"
              />
              {search && (
                <button 
                  onClick={() => setSearch('')} 
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Status Dropdown */}
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="input-field py-1.5 text-xs w-44 font-medium"
            >
              <option value="all">All Statuses ({handovers.length})</option>
              <option value="Pending Verification">⏳ Pending ({stats.pendingCount})</option>
              <option value="Verified">✓ Verified ({stats.verifiedCount})</option>
              <option value="Rejected">✕ Rejected</option>
            </select>

            {/* Date Range Selector */}
            <select
              value={dateFilter}
              onChange={e => setDateFilter(e.target.value)}
              className="input-field py-1.5 text-xs w-36 font-medium"
            >
              <option value="all">📅 All Time</option>
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="this_week">Last 7 Days</option>
              <option value="this_month">This Month</option>
            </select>

            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-xs font-semibold text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 px-2.5 py-1.5 rounded-lg transition-colors"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-xs border-y border-slate-100">
              <tr>
                <th className="px-6 py-4">Submission Date</th>
                <th className="px-6 py-4">Rider</th>
                <th className="px-6 py-4 text-right">Gross COD</th>
                <th className="px-6 py-4 text-right">Expenses</th>
                <th className="px-6 py-4 text-right">💵 Cash</th>
                <th className="px-6 py-4 text-right">📱 Online</th>
                <th className="px-6 py-4 text-right">Net Total</th>
                <th className="px-6 py-4 text-center">Packages</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredHandovers.length === 0 ? (
                <tr>
                  <td colSpan="10" className="text-center py-12 text-slate-500">
                    <div className="text-2xl mb-2">🔍</div>
                    {hasActiveFilters ? "No COD handovers match your search filters." : "No COD handovers found."}
                  </td>
                </tr>
              ) : (
                filteredHandovers.map(h => {
                  const gross = h.grossCOD || ((h.amount || 0) + (h.expenseDeduction || 0));
                  const expense = h.expenseDeduction || 0;
                  const net = h.amount || 0;
                  const cash = h.cashAmount !== undefined ? h.cashAmount : (h.onlineAmount ? Math.max(0, net - h.onlineAmount) : net);
                  const online = h.onlineAmount || 0;

                  return (
                    <tr key={h._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-900">{new Date(h.createdAt).toLocaleDateString()}</div>
                        <div className="text-xs text-slate-400">{new Date(h.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          {h.riderId?.name || 'Unknown Rider'}
                        </div>
                        <div className="text-xs text-slate-500 pl-5">{h.riderId?.contact || h.riderId?.phone || '—'}</div>
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-slate-800">
                        Rs. {gross.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {expense > 0 ? (
                          <span className="inline-flex items-center gap-1 font-semibold text-amber-700 bg-amber-50 border border-amber-200/60 px-2 py-0.5 rounded-md text-xs">
                            <ArrowDownRight className="w-3 h-3 text-amber-600" />
                            - Rs. {expense.toLocaleString()}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs font-mono">Rs. 0</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-emerald-700">
                        <span className="bg-emerald-50 text-emerald-800 px-2 py-1 rounded-md text-xs">
                          Rs. {cash.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {online > 0 ? (
                          <div className="inline-flex flex-col items-end">
                            <span className="font-bold text-sky-800 bg-sky-50 px-2 py-1 rounded-md text-xs">
                              Rs. {online.toLocaleString()}
                            </span>
                            {h.onlineReference && (
                              <span className="text-[10px] text-slate-400 mt-0.5 max-w-[120px] truncate" title={h.onlineReference}>
                                Ref: {h.onlineReference}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs font-mono">Rs. 0</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right font-black text-slate-900 text-base">
                        Rs. {net.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg text-xs font-bold">
                          {h.packageIds?.length || 0}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                          h.status === 'Verified'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                            : h.status === 'Rejected' 
                            ? 'bg-red-50 text-red-700 border-red-200' 
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {h.status === 'Verified' && '✓ '}
                          {h.status === 'Rejected' && '✕ '}
                          {h.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {h.status === 'Pending Verification' ? (
                          <div className="flex gap-2 justify-end">
                            <button 
                              onClick={() => handleVerify(h._id, 'Verified')} 
                              disabled={verifying === h._id} 
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" /> Verify
                            </button>
                            <button 
                              onClick={() => handleVerify(h._id, 'Rejected')} 
                              disabled={verifying === h._id} 
                              className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1"
                            >
                              <XCircle className="w-3.5 h-3.5" /> Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic">
                            By {h.verifiedBy?.name || 'Admin'}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>

            {/* Table Footer Totals Summary Row */}
            {filteredHandovers.length > 0 && (
              <tfoot className="bg-slate-50 border-t-2 border-slate-200 font-bold text-slate-900">
                <tr>
                  <td colSpan="2" className="px-6 py-4 uppercase text-xs text-slate-600">
                    Total Summary ({filteredHandovers.length} records)
                  </td>
                  <td className="px-6 py-4 text-right text-slate-800 font-bold">
                    Rs. {filteredTotals.gross.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-right text-amber-700 font-bold">
                    - Rs. {filteredTotals.expenses.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-right text-emerald-700 font-black text-base">
                    Rs. {filteredTotals.net.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {filteredTotals.packages} pkgs
                  </td>
                  <td colSpan="2" className="px-6 py-4"></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminCodHandovers;
