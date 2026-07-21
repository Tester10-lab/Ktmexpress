import React, { useState, useEffect, useCallback } from 'react';
import api from '../../../api/axios';
import MetricCard from '../../../components/MetricCard';
import { useToast } from '../../../store/ToastContext';
import Pagination from '../../../components/Pagination';
import TrackingLink from '../../../components/TrackingLink';
import { 
  Wallet, CheckCircle2, XCircle, Clock, FileSpreadsheet, Check, Download, ChevronDown, ChevronUp, Package as PackageIcon, Store
} from 'lucide-react';

const AdminSettlements = () => {
  const [activeTab, setActiveTab] = useState('requests'); // 'requests' or 'packages'
  
  // State for Settlement Requests tab
  const [settlementRequests, setSettlementRequests] = useState([]);
  const [reqLoading, setReqLoading] = useState(true);
  const [reqFilter, setReqFilter] = useState('Pending');
  const [expandedReqs, setExpandedReqs] = useState({});
  const [reqPagination, setReqPagination] = useState(null);
  const [reqPage, setReqPage] = useState(1);

  // State for Direct Packages tab
  const [packages, setPackages] = useState([]);
  const [pkgLoading, setPkgLoading] = useState(true);
  const [pkgPage, setPkgPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [pkgPagination, setPkgPagination] = useState(null);
  const [statusFilter, setStatusFilter] = useState('unpaid');
  const [selectedPackages, setSelectedPackages] = useState(new Set());
  const [processing, setProcessing] = useState(false);
  
  const { showToast } = useToast();

  // Fetch Vendor Settlement Requests
  const fetchSettlementRequests = useCallback((silent = false) => {
    if (!silent) setReqLoading(true);
    const q = new URLSearchParams({ page: reqPage, limit, status: reqFilter });
    
    api.get(`/admin/settlements?${q.toString()}`)
      .then(r => {
        setSettlementRequests(r.data.data || []);
        setReqPagination(r.data.pagination);
      })
      .catch(() => showToast('Failed to load settlement requests', 'error'))
      .finally(() => setReqLoading(false));
  }, [reqPage, limit, reqFilter, showToast]);

  // Fetch Direct Packages
  const fetchPackages = useCallback((silent = false) => {
    if (!silent) setPkgLoading(true);
    const q = new URLSearchParams({ page: pkgPage, limit, status: 'history' });
    
    api.get(`/admin/packages?${q.toString()}`)
      .then(r => {
        let pkgData = r.data.data || [];
        if (statusFilter === 'unpaid') {
          pkgData = pkgData.filter(p => p.status === 'Delivered' && !p.vendorPaid);
        } else if (statusFilter === 'paid') {
          pkgData = pkgData.filter(p => p.status === 'Delivered' && p.vendorPaid);
        }
        setPackages(pkgData);
        setPkgPagination(r.data.pagination);
        setSelectedPackages(new Set());
      })
      .catch(() => showToast('Failed to load packages', 'error'))
      .finally(() => setPkgLoading(false));
  }, [pkgPage, limit, statusFilter, showToast]);

  useEffect(() => {
    if (activeTab === 'requests') {
      fetchSettlementRequests();
    } else {
      fetchPackages();
    }
  }, [activeTab, fetchSettlementRequests, fetchPackages]);

  // Handle Approve Settlement Request
  const handleApproveRequest = async (settlementId) => {
    try {
      await api.put(`/admin/settlements/${settlementId}`, { status: 'Approved' });
      showToast('Settlement request approved & paid!', 'success');
      fetchSettlementRequests(true);
    } catch (err) {
      showToast(err.response?.data?.message || err.message || 'Failed to approve settlement', 'error');
    }
  };

  // Handle Reject Settlement Request
  const handleRejectRequest = async (settlementId) => {
    const reason = window.prompt('Enter reason for rejecting this settlement request:');
    if (reason === null) return;

    try {
      await api.put(`/admin/settlements/${settlementId}`, { status: 'Rejected', adminNotes: reason });
      showToast('Settlement request rejected', 'info');
      fetchSettlementRequests(true);
    } catch (err) {
      showToast(err.response?.data?.message || err.message || 'Failed to reject settlement', 'error');
    }
  };

  const toggleExpandReq = (id) => {
    setExpandedReqs(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Package Direct Selection & Paid Handlers
  const toggleSelect = (id) => {
    const newSet = new Set(selectedPackages);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedPackages(newSet);
  };

  const selectAll = () => {
    if (selectedPackages.size === packages.length) {
      setSelectedPackages(new Set());
    } else {
      setSelectedPackages(new Set(packages.filter(p => !p.vendorPaid).map(p => p._id)));
    }
  };

  const handleVerifyCOD = async (id) => {
    setPackages(prev => prev.map(p => p._id === id ? { ...p, codVerified: true } : p));
    try {
      await api.post(`/admin/settlements/verify-cod/${id}`);
      showToast('COD marked as verified', 'success');
      fetchPackages(true);
    } catch (err) {
      showToast(err.message || 'Failed to verify COD', 'error');
      fetchPackages(true);
    }
  };

  const handleMarkPaid = async () => {
    if (selectedPackages.size === 0) return;
    if (!window.confirm(`Mark ${selectedPackages.size} packages as paid to vendor?`)) return;

    setProcessing(true);
    if (statusFilter === 'unpaid') {
       setPackages(prev => prev.filter(p => !selectedPackages.has(p._id)));
    } else {
       setPackages(prev => prev.map(p => selectedPackages.has(p._id) ? { ...p, vendorPaid: true } : p));
    }

    try {
      await api.post('/admin/settlements/mark-paid', {
        packageIds: Array.from(selectedPackages),
        paymentMethod: 'Bank Transfer'
      });
      showToast('Packages marked as paid', 'success');
      fetchPackages(true);
    } catch (err) {
      showToast(err.message || 'Failed to mark paid', 'error');
      fetchPackages(true);
    } finally {
      setProcessing(false);
    }
  };

  const exportCSV = async () => {
    try {
      const q = new URLSearchParams({ status: statusFilter });
      const res = await api.get(`/admin/settlements/export?${q.toString()}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `settlements_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      showToast('Failed to export CSV', 'error');
    }
  };

  const totalSelectedAmount = packages
    .filter(p => selectedPackages.has(p._id))
    .reduce((sum, p) => sum + (p.vendorReceivable || 0), 0);

  return (
    <div className="card-premium animate-fadeIn overflow-hidden">
      {/* Header & Tabs */}
      <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
            <Wallet className="w-5 h-5 text-brand-600" />
            Vendor Settlements
          </h3>
          <p className="text-sm text-slate-500 mt-1">Review vendor settlement requests and manage COD payouts</p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 bg-slate-200/60 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('requests')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'requests' 
                ? 'bg-white text-brand-700 shadow-sm' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Settlement Requests
          </button>
          <button
            onClick={() => setActiveTab('packages')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'packages' 
                ? 'bg-white text-brand-700 shadow-sm' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Package Payouts & COD
          </button>
        </div>
      </div>

      {/* ── TAB 1: SETTLEMENT REQUESTS ──────────────────────────────────── */}
      {activeTab === 'requests' && (
        <div>
          {/* Action & Filter Bar */}
          <div className="px-6 py-3 border-b border-slate-100 flex items-center justify-between bg-white">
            <div className="flex items-center gap-2">
              {['Pending', 'Approved', 'Rejected', 'all'].map((f) => (
                <button
                  key={f}
                  onClick={() => { setReqFilter(f); setReqPage(1); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                    reqFilter === f 
                      ? 'bg-brand-600 text-white shadow-xs' 
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {f === 'all' ? 'All Requests' : f}
                </button>
              ))}
            </div>
            <button onClick={exportCSV} className="btn-secondary btn-sm flex items-center gap-2" title="Export CSV">
              <Download className="w-4 h-4" /> Export
            </button>
          </div>

          <div className="overflow-x-auto min-h-[400px]">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-xs">
                <tr>
                  <th className="px-6 py-3 w-10"></th>
                  <th className="px-6 py-3">Date Requested</th>
                  <th className="px-6 py-3">Vendor / Shop</th>
                  <th className="px-6 py-3 text-right">Packages</th>
                  <th className="px-6 py-3 text-right">Net Requested Amount</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {reqLoading ? (
                  <tr><td colSpan="7" className="px-6 py-12 text-center text-slate-500">Loading settlement requests...</td></tr>
                ) : settlementRequests.length === 0 ? (
                  <tr><td colSpan="7" className="px-6 py-12 text-center text-slate-500">No settlement requests found.</td></tr>
                ) : (
                  settlementRequests.map(s => {
                    const isExpanded = Boolean(expandedReqs[s._id]);
                    const shopName = s.vendorId?.vendorMeta?.shopName || s.vendorId?.name || 'Unknown Vendor';
                    
                    return (
                      <React.Fragment key={s._id}>
                        <tr className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4">
                            <button 
                              onClick={() => toggleExpandReq(s._id)} 
                              className="text-slate-400 hover:text-slate-600 p-1"
                            >
                              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-semibold text-slate-900">{new Date(s.createdAt).toLocaleDateString()}</div>
                            <div className="text-xs text-slate-400">{new Date(s.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-bold text-slate-800 flex items-center gap-1.5">
                              <Store className="w-4 h-4 text-brand-600 shrink-0" />
                              {shopName}
                            </div>
                            <div className="text-xs text-slate-400">{s.vendorId?.email || ''}</div>
                          </td>
                          <td className="px-6 py-4 text-right font-medium text-slate-700">
                            {s.packages?.length || s.packageIds?.length || 0} pkgs
                          </td>
                          <td className="px-6 py-4 text-right font-bold text-brand-700 text-base">
                            Rs. {s.requestedAmount?.toLocaleString()}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${
                              s.status === 'Approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                              s.status === 'Rejected' ? 'bg-red-50 text-red-700 border-red-200' :
                              'bg-amber-50 text-amber-700 border-amber-200'
                            }`}>
                              {s.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            {s.status === 'Pending' ? (
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => handleApproveRequest(s._id)}
                                  className="btn-primary btn-sm px-3 py-1 flex items-center gap-1 text-xs"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" /> Approve & Pay
                                </button>
                                <button
                                  onClick={() => handleRejectRequest(s._id)}
                                  className="btn-secondary btn-sm px-3 py-1 flex items-center gap-1 text-xs text-red-600 hover:bg-red-50 hover:border-red-200"
                                >
                                  <XCircle className="w-3.5 h-3.5" /> Reject
                                </button>
                              </div>
                            ) : (
                              <span className="text-xs text-slate-400 font-medium">
                                {s.status === 'Approved' ? `Paid ${s.paidAt ? new Date(s.paidAt).toLocaleDateString() : ''}` : 'Rejected'}
                              </span>
                            )}
                          </td>
                        </tr>

                        {/* Expanded Package Details Row */}
                        {isExpanded && (
                          <tr className="bg-slate-50/70">
                            <td colSpan="7" className="px-8 py-4">
                              <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
                                <div className="px-4 py-2.5 bg-slate-100 border-b border-slate-200 font-bold text-xs text-slate-700 flex justify-between">
                                  <span>Package Details Breakdown ({s.packages?.length || 0} packages)</span>
                                  <span>Total COD: Rs. {s.summary?.totalCOD || 0} | Delivery Charges: Rs. {s.summary?.totalDeliveryCharges || 0}</span>
                                </div>
                                <table className="w-full text-xs text-left">
                                  <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                                    <tr>
                                      <th className="px-4 py-2">Tracking Code</th>
                                      <th className="px-4 py-2">Customer</th>
                                      <th className="px-4 py-2 text-right">COD Amount</th>
                                      <th className="px-4 py-2 text-right">Delivery Fee</th>
                                      <th className="px-4 py-2 text-right">Net Vendor Share</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100">
                                    {(s.packages || []).map(p => (
                                      <tr key={p._id}>
                                        <td className="px-4 py-2 font-mono"><TrackingLink code={p.trackingCode} /></td>
                                        <td className="px-4 py-2">{p.customerName}</td>
                                        <td className="px-4 py-2 text-right font-medium">Rs. {p.amount}</td>
                                        <td className="px-4 py-2 text-right text-red-500">Rs. {p.deliveryCharge}</td>
                                        <td className="px-4 py-2 text-right font-bold text-brand-600">Rs. {p.amount - p.deliveryCharge}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          <Pagination pagination={reqPagination} onPageChange={setReqPage} limit={limit} onLimitChange={setLimit} />
        </div>
      )}

      {/* ── TAB 2: DIRECT PACKAGE PAYOUTS & COD ──────────────────────────── */}
      {activeTab === 'packages' && (
        <div>
          {/* Action & Filter Bar */}
          <div className="px-6 py-3 border-b border-slate-100 flex items-center justify-between bg-white">
            <select 
              className="input-field py-1.5 text-xs w-44" 
              value={statusFilter} 
              onChange={(e) => { setStatusFilter(e.target.value); setPkgPage(1); }}
            >
              <option value="unpaid">Pending Payment</option>
              <option value="paid">Already Paid</option>
              <option value="all">All Delivered</option>
            </select>
            <button onClick={exportCSV} className="btn-secondary btn-sm flex items-center gap-2" title="Export CSV">
              <Download className="w-4 h-4" /> Export
            </button>
          </div>

          {/* Bulk Action Bar */}
          {selectedPackages.size > 0 && (
            <div className="bg-brand-50 border-b border-brand-100 px-6 py-3 flex items-center justify-between animate-fadeIn">
              <div className="flex items-center gap-4">
                <span className="font-bold text-brand-900">{selectedPackages.size} packages selected</span>
                <span className="text-sm text-brand-700">
                  Total Payout: <span className="font-bold">Rs. {totalSelectedAmount.toLocaleString()}</span>
                </span>
              </div>
              <button 
                onClick={handleMarkPaid} 
                disabled={processing}
                className="btn-primary btn-sm flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                {processing ? 'Processing...' : 'Mark Vendor Paid'}
              </button>
            </div>
          )}

          <div className="overflow-x-auto min-h-[400px]">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-xs">
                <tr>
                  <th className="px-6 py-3 w-10">
                    <input 
                      type="checkbox" 
                      className="rounded border-slate-300 text-brand-600 focus:ring-brand-600"
                      checked={packages.length > 0 && packages.filter(p => !p.vendorPaid).length > 0 && selectedPackages.size === packages.filter(p => !p.vendorPaid).length}
                      onChange={selectAll}
                    />
                  </th>
                  <th className="px-6 py-3">Tracking / Date</th>
                  <th className="px-6 py-3">Vendor</th>
                  <th className="px-6 py-3 text-right">COD Amount</th>
                  <th className="px-6 py-3 text-right">Delivery Charge</th>
                  <th className="px-6 py-3 text-right">Vendor Payable</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {pkgLoading ? <tr><td colSpan="8" className="px-6 py-12 text-center text-slate-500">Loading...</td></tr>
                  : packages.length === 0 ? <tr><td colSpan="8" className="px-6 py-12 text-center text-slate-500">No packages found for the selected filter.</td></tr>
                    : packages.map(p => (
                      <tr key={p._id} className={`hover:bg-slate-50 transition-colors ${selectedPackages.has(p._id) ? 'bg-brand-50/30' : ''}`}>
                        <td className="px-6 py-4">
                          <input 
                            type="checkbox" 
                            disabled={p.vendorPaid}
                            className="rounded border-slate-300 text-brand-600 focus:ring-brand-600 disabled:opacity-50"
                            checked={selectedPackages.has(p._id)}
                            onChange={() => toggleSelect(p._id)}
                          />
                        </td>
                        <td className="px-6 py-4">
                          <div><TrackingLink code={p.trackingCode} /></div>
                          <div className="text-xs text-slate-500 mt-0.5">{new Date(p.createdAt).toLocaleDateString()}</div>
                        </td>
                        <td className="px-6 py-4 font-bold text-slate-700">{(p.vendorId?.vendorMeta?.shopName || p.vendorId?.name) || 'Unknown'}</td>
                        <td className="px-6 py-4 text-right font-medium">Rs. {p.amount}</td>
                        <td className="px-6 py-4 text-right font-medium text-red-500">Rs. {p.deliveryCharge}</td>
                        <td className="px-6 py-4 text-right font-bold text-brand-600">Rs. {p.vendorReceivable}</td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1">
                            {!p.codVerified ? (
                               <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 border border-amber-200 w-max">
                                 COD Unverified
                               </span>
                            ) : (
                               <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200 w-max">
                                 COD Verified
                               </span>
                            )}
                            {p.vendorPaid ? (
                               <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200 w-max">
                                 Paid: {new Date(p.paidAt).toLocaleDateString()}
                               </span>
                            ) : (
                               <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700 border border-red-200 w-max">
                                 Unpaid
                               </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            {!p.codVerified && !p.vendorPaid && (
                              <button 
                                onClick={() => handleVerifyCOD(p._id)}
                                className="btn-sm px-2 py-1 bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 font-bold rounded flex items-center gap-1"
                                title="Verify COD Collected"
                              >
                                <Check className="w-3 h-3" /> Verify COD
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>
          <Pagination pagination={pkgPagination} onPageChange={setPkgPage} limit={limit} onLimitChange={setLimit} />
        </div>
      )}
    </div>
  );
};

export default AdminSettlements;
