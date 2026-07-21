import React, { useState, useEffect, useCallback } from 'react';
import api from '../../../api/axios';
import MetricCard from '../../../components/MetricCard';
import { useToast } from '../../../store/ToastContext';
import Pagination from '../../../components/Pagination';
import TrackingLink from '../../../components/TrackingLink';
import { 
  Wallet, CheckCircle2, XCircle, Clock, FileSpreadsheet, Check, Download, 
  ChevronDown, ChevronUp, Package as PackageIcon, Store, CreditCard, DollarSign, 
  Send, AlertCircle, X, ShieldCheck
} from 'lucide-react';

const AdminSettlements = () => {
  const [activeTab, setActiveTab] = useState('requests'); // 'requests', 'vendor_balances', 'packages'
  
  // ─── Metrics State ────────────────────────────────────────────────────────
  const [metrics, setMetrics] = useState({
    pendingRequestsAmount: 0,
    pendingRequestsCount: 0,
    unpaidDeliveredAmount: 0,
    unpaidDeliveredCount: 0,
    vendorBalancesCount: 0
  });

  // ─── Tab 1: Settlement Requests State ──────────────────────────────────────
  const [settlementRequests, setSettlementRequests] = useState([]);
  const [reqLoading, setReqLoading] = useState(true);
  const [reqFilter, setReqFilter] = useState('Pending');
  const [expandedReqs, setExpandedReqs] = useState({});
  const [reqPagination, setReqPagination] = useState(null);
  const [reqPage, setReqPage] = useState(1);

  // ─── Tab 2: Vendor Balances State ──────────────────────────────────────────
  const [vendorBalances, setVendorBalances] = useState([]);
  const [vbLoading, setVbLoading] = useState(true);

  // ─── Tab 3: Direct Packages State ──────────────────────────────────────────
  const [packages, setPackages] = useState([]);
  const [pkgLoading, setPkgLoading] = useState(true);
  const [pkgPage, setPkgPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [pkgPagination, setPkgPagination] = useState(null);
  const [statusFilter, setStatusFilter] = useState('unpaid');
  const [selectedPackages, setSelectedPackages] = useState(new Set());
  
  // ─── Payment Modal State ───────────────────────────────────────────────────
  const [payModal, setPayModal] = useState({
    open: false,
    mode: '', // 'request' or 'direct'
    settlementId: null,
    vendorId: null,
    vendorName: '',
    bankDetails: null,
    requestedAmount: 0,
    maxPayableAmount: 0,
    paidAmount: '',
    paymentMethod: 'Bank Transfer',
    reference: '',
    adminNotes: ''
  });
  const [processing, setProcessing] = useState(false);

  const { showToast } = useToast();

  // ─── Fetch Vendor Settlement Requests ──────────────────────────────────────
  const fetchSettlementRequests = useCallback((silent = false) => {
    if (!silent) setReqLoading(true);
    const q = new URLSearchParams({ page: reqPage, limit, status: reqFilter });
    
    api.get(`/admin/settlements?${q.toString()}`)
      .then(r => {
        const list = r.data.data || [];
        setSettlementRequests(list);
        setReqPagination(r.data.pagination);

        // Update metrics
        const pendingList = list.filter(s => s.status === 'Pending');
        const pendingAmt = pendingList.reduce((sum, s) => sum + (s.requestedAmount || 0), 0);
        setMetrics(prev => ({
          ...prev,
          pendingRequestsAmount: pendingAmt,
          pendingRequestsCount: pendingList.length
        }));
      })
      .catch(() => showToast('Failed to load settlement requests', 'error'))
      .finally(() => setReqLoading(false));
  }, [reqPage, limit, reqFilter, showToast]);

  // ─── Fetch Vendor Balances (Grouped View) ──────────────────────────────────
  const fetchVendorBalances = useCallback((silent = false) => {
    if (!silent) setVbLoading(true);
    api.get('/admin/settlements/vendor-balances')
      .then(r => {
        const list = r.data.data || [];
        setVendorBalances(list);

        const totalUnpaidAmt = list.reduce((sum, v) => sum + (v.netPayable || 0), 0);
        const totalUnpaidPkgs = list.reduce((sum, v) => sum + (v.pendingCount || 0), 0);
        setMetrics(prev => ({
          ...prev,
          unpaidDeliveredAmount: totalUnpaidAmt,
          unpaidDeliveredCount: totalUnpaidPkgs,
          vendorBalancesCount: list.length
        }));
      })
      .catch(() => showToast('Failed to load vendor balances', 'error'))
      .finally(() => setVbLoading(false));
  }, [showToast]);

  // ─── Fetch Direct Packages ──────────────────────────────────────────────────
  const fetchPackages = useCallback((silent = false) => {
    if (!silent) setPkgLoading(true);
    const q = new URLSearchParams({ page: pkgPage, limit, status: 'Delivered' });
    
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
    fetchVendorBalances(true);
    if (activeTab === 'requests') {
      fetchSettlementRequests();
    } else if (activeTab === 'vendor_balances') {
      fetchVendorBalances();
    } else {
      fetchPackages();
    }
  }, [activeTab, fetchSettlementRequests, fetchVendorBalances, fetchPackages]);

  // ─── Modal Openers ─────────────────────────────────────────────────────────
  const openApproveModal = (settlement) => {
    const vMeta = settlement.vendorId?.vendorMeta || {};
    setPayModal({
      open: true,
      mode: 'request',
      settlementId: settlement._id,
      vendorId: settlement.vendorId?._id || settlement.vendorId,
      vendorName: vMeta.shopName || settlement.vendorId?.name || 'Vendor',
      bankDetails: {
        bankName: vMeta.bankName || 'N/A',
        accountNumber: vMeta.accountNumber || 'N/A',
        branch: vMeta.branch || 'N/A',
        accountHolder: vMeta.accountHolder || settlement.vendorId?.name || 'N/A'
      },
      requestedAmount: settlement.requestedAmount || 0,
      maxPayableAmount: settlement.requestedAmount || 0,
      paidAmount: settlement.requestedAmount || 0,
      paymentMethod: 'Bank Transfer',
      reference: '',
      adminNotes: ''
    });
  };

  const openDirectPayModal = (vb) => {
    setPayModal({
      open: true,
      mode: 'direct',
      settlementId: null,
      vendorId: vb.vendorId,
      vendorName: vb.shopName || vb.name,
      bankDetails: {
        bankName: vb.bankName,
        accountNumber: vb.accountNumber,
        branch: vb.branch,
        accountHolder: vb.accountHolder
      },
      requestedAmount: vb.netPayable || 0,
      maxPayableAmount: vb.netPayable || 0,
      paidAmount: vb.netPayable || 0,
      paymentMethod: 'Bank Transfer',
      reference: '',
      adminNotes: ''
    });
  };

  // ─── Handle Payment Submission ────────────────────────────────────────────
  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    const amountToPay = Number(payModal.paidAmount);
    if (isNaN(amountToPay) || amountToPay <= 0) {
      showToast('Please enter a valid payment amount.', 'error');
      return;
    }

    setProcessing(true);
    try {
      if (payModal.mode === 'request') {
        // Approve settlement request (Full or Partial)
        await api.put(`/admin/settlements/${payModal.settlementId}`, {
          status: amountToPay < payModal.requestedAmount ? 'Partially Paid' : 'Approved',
          paidAmount: amountToPay,
          paymentMethod: payModal.paymentMethod,
          reference: payModal.reference,
          adminNotes: payModal.adminNotes
        });
        showToast(`Successfully paid Rs. ${amountToPay.toLocaleString()} to ${payModal.vendorName}!`, 'success');
        fetchSettlementRequests(true);
      } else {
        // Direct Vendor Payout (Unrequested or Requested)
        const res = await api.post('/admin/settlements/direct-payout', {
          vendorId: payModal.vendorId,
          amount: amountToPay,
          paymentMethod: payModal.paymentMethod,
          reference: payModal.reference,
          adminNotes: payModal.adminNotes
        });
        showToast(res.data.message || 'Direct payout processed!', 'success');
        fetchVendorBalances(true);
      }
      setPayModal({ open: false, mode: '', settlementId: null, vendorId: null, vendorName: '', bankDetails: null, requestedAmount: 0, maxPayableAmount: 0, paidAmount: '', paymentMethod: 'Bank Transfer', reference: '', adminNotes: '' });
    } catch (err) {
      showToast(err.response?.data?.message || err.message || 'Payment submission failed', 'error');
    } finally {
      setProcessing(false);
    }
  };

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
    const refInput = window.prompt(`Enter Bank Transaction Reference ID for ${selectedPackages.size} package(s):`);
    if (refInput === null) return;

    setProcessing(true);
    try {
      await api.post('/admin/settlements/mark-paid', {
        packageIds: Array.from(selectedPackages),
        reference: refInput,
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

  const remainingBalance = Math.max(0, (payModal.maxPayableAmount || 0) - Number(payModal.paidAmount || 0));

  return (
    <div className="space-y-6 animate-fadeIn">

      {/* ── METRICS DASHBOARD CARDS ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <MetricCard 
          title="Pending Requests" 
          value={`Rs. ${metrics.pendingRequestsAmount.toLocaleString()}`} 
          subtitle={`${metrics.pendingRequestsCount} vendor request(s)`}
          color="purple" 
          icon={<Wallet className="w-6 h-6 text-purple-600" />} 
        />
        <MetricCard 
          title="Unpaid Delivered COD" 
          value={`Rs. ${metrics.unpaidDeliveredAmount.toLocaleString()}`} 
          subtitle={`${metrics.unpaidDeliveredCount} package(s) awaiting payout`}
          color="danger" 
          icon={<DollarSign className="w-6 h-6 text-red-600" />} 
        />
        <MetricCard 
          title="Vendors Awaiting Payout" 
          value={metrics.vendorBalancesCount} 
          subtitle="Vendors with unpaid balance"
          color="primary" 
          icon={<Store className="w-6 h-6 text-brand-600" />} 
        />
        <MetricCard 
          title="COD Reconciliation" 
          value="100%" 
          subtitle="All rider cash reconciled"
          color="success" 
          icon={<ShieldCheck className="w-6 h-6 text-emerald-600" />} 
        />
      </div>

      {/* ── MAIN CARD WITH TABS ─────────────────────────────────────────── */}
      <div className="card-premium overflow-hidden">
        
        {/* Header & Navigation Tabs */}
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/60 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
              <Wallet className="w-5 h-5 text-brand-600" />
              Vendor Settlement Hub
            </h3>
            <p className="text-sm text-slate-500 mt-0.5">Process vendor payout requests, direct payouts, and COD verification</p>
          </div>

          {/* 3-Tab Switcher */}
          <div className="flex items-center gap-1.5 bg-slate-200/70 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('requests')}
              className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'requests' 
                  ? 'bg-white text-brand-700 shadow-sm' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              Vendor Requests
              {metrics.pendingRequestsCount > 0 && (
                <span className="bg-brand-600 text-white text-[10px] px-1.5 py-0.2 rounded-full">
                  {metrics.pendingRequestsCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('vendor_balances')}
              className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'vendor_balances' 
                  ? 'bg-white text-brand-700 shadow-sm' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Store className="w-3.5 h-3.5" />
              Vendor Balances
              {metrics.vendorBalancesCount > 0 && (
                <span className="bg-purple-600 text-white text-[10px] px-1.5 py-0.2 rounded-full">
                  {metrics.vendorBalancesCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('packages')}
              className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'packages' 
                  ? 'bg-white text-brand-700 shadow-sm' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <PackageIcon className="w-3.5 h-3.5" />
              Package Audit
            </button>
          </div>
        </div>

        {/* ── TAB 1: VENDOR SETTLEMENT REQUESTS ────────────────────────────── */}
        {activeTab === 'requests' && (
          <div>
            {/* Filter Bar */}
            <div className="px-6 py-3 border-b border-slate-100 flex items-center justify-between bg-white">
              <div className="flex items-center gap-2">
                {['Pending', 'Approved', 'Partially Paid', 'Rejected', 'all'].map((f) => (
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

            <div className="overflow-x-auto min-h-[380px]">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-xs">
                  <tr>
                    <th className="px-6 py-3 w-10"></th>
                    <th className="px-6 py-3">Date / ID</th>
                    <th className="px-6 py-3">Vendor / Shop</th>
                    <th className="px-6 py-3">Bank Details</th>
                    <th className="px-6 py-3 text-right">Packages</th>
                    <th className="px-6 py-3 text-right">Requested Net</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {reqLoading ? (
                    <tr><td colSpan="8" className="px-6 py-12 text-center text-slate-500">Loading settlement requests...</td></tr>
                  ) : settlementRequests.length === 0 ? (
                    <tr><td colSpan="8" className="px-6 py-12 text-center text-slate-500">No settlement requests found for this filter.</td></tr>
                  ) : (
                    settlementRequests.map(s => {
                      const isExpanded = Boolean(expandedReqs[s._id]);
                      const shopName = s.vendorId?.vendorMeta?.shopName || s.vendorId?.name || 'Unknown Vendor';
                      const vMeta = s.vendorId?.vendorMeta || {};
                      
                      return (
                        <React.Fragment key={s._id}>
                          <tr className="hover:bg-slate-50/80 transition-colors">
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
                            <td className="px-6 py-4">
                              <div className="text-xs font-semibold text-slate-700">{vMeta.bankName || 'No Bank Added'}</div>
                              <div className="text-xs font-mono text-slate-500">{vMeta.accountNumber || 'N/A'}</div>
                            </td>
                            <td className="px-6 py-4 text-right font-medium text-slate-700">
                              {s.packages?.length || s.packageIds?.length || 0} pkgs
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="font-bold text-brand-700 text-base">Rs. {s.requestedAmount?.toLocaleString()}</div>
                              {s.paidAmount > 0 && s.paidAmount !== s.requestedAmount && (
                                <div className="text-[11px] text-emerald-600 font-semibold">Paid: Rs. {s.paidAmount.toLocaleString()}</div>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${
                                s.status === 'Approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                s.status === 'Partially Paid' ? 'bg-blue-50 text-blue-700 border-blue-200' :
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
                                    onClick={() => openApproveModal(s)}
                                    className="btn-primary btn-sm px-3 py-1 flex items-center gap-1 text-xs"
                                  >
                                    <Send className="w-3.5 h-3.5" /> Approve / Pay
                                  </button>
                                  <button
                                    onClick={() => handleRejectRequest(s._id)}
                                    className="btn-secondary btn-sm px-3 py-1 flex items-center gap-1 text-xs text-red-600 hover:bg-red-50 hover:border-red-200"
                                  >
                                    <XCircle className="w-3.5 h-3.5" /> Reject
                                  </button>
                                </div>
                              ) : (
                                <div className="text-xs text-slate-500 font-medium">
                                  {s.status === 'Approved' || s.status === 'Partially Paid' ? (
                                    <div>
                                      <div>Ref: <span className="font-mono font-semibold text-slate-800">{s.reference || 'N/A'}</span></div>
                                      <div className="text-[10px] text-slate-400">{s.paidAt ? new Date(s.paidAt).toLocaleDateString() : ''}</div>
                                    </div>
                                  ) : (
                                    <span className="text-red-500">Rejected</span>
                                  )}
                                </div>
                              )}
                            </td>
                          </tr>

                          {/* Expanded Package Details Row */}
                          {isExpanded && (
                            <tr className="bg-slate-50/70">
                              <td colSpan="8" className="px-8 py-4">
                                <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
                                  <div className="px-4 py-2.5 bg-slate-100 border-b border-slate-200 font-bold text-xs text-slate-700 flex justify-between">
                                    <span>Included Packages ({s.packages?.length || 0})</span>
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

        {/* ── TAB 2: VENDOR BALANCES (GROUPED PAYOUTS) ────────────────────── */}
        {activeTab === 'vendor_balances' && (
          <div>
            <div className="px-6 py-3 border-b border-slate-100 bg-white flex justify-between items-center">
              <p className="text-xs text-slate-500 font-medium">
                Showing all vendors with delivered, unpaid packages. Pay vendors directly at any time whether requested or not.
              </p>
              <button onClick={() => fetchVendorBalances()} className="btn-secondary btn-sm flex items-center gap-1.5 text-xs">
                Refresh Balances
              </button>
            </div>

            <div className="overflow-x-auto min-h-[380px]">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-xs">
                  <tr>
                    <th className="px-6 py-3">Vendor / Shop</th>
                    <th className="px-6 py-3">Bank Account Details</th>
                    <th className="px-6 py-3 text-right">Unpaid Packages</th>
                    <th className="px-6 py-3 text-right">Total COD</th>
                    <th className="px-6 py-3 text-right">Delivery Charges</th>
                    <th className="px-6 py-3 text-right">Net Payable Balance</th>
                    <th className="px-6 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {vbLoading ? (
                    <tr><td colSpan="7" className="px-6 py-12 text-center text-slate-500">Loading vendor balances...</td></tr>
                  ) : vendorBalances.length === 0 ? (
                    <tr><td colSpan="7" className="px-6 py-12 text-center text-slate-500">No unpaid vendor balances available. All vendors settled!</td></tr>
                  ) : (
                    vendorBalances.map(vb => (
                      <tr key={vb.vendorId} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-900 flex items-center gap-1.5">
                            <Store className="w-4 h-4 text-brand-600 shrink-0" />
                            {vb.shopName}
                          </div>
                          <div className="text-xs text-slate-400">{vb.email}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-xs font-semibold text-slate-800">{vb.bankName}</div>
                          <div className="text-xs font-mono text-slate-600">Acc: {vb.accountNumber}</div>
                          <div className="text-[10px] text-slate-400">Holder: {vb.accountHolder} ({vb.branch})</div>
                        </td>
                        <td className="px-6 py-4 text-right font-medium text-slate-700">
                          {vb.pendingCount} packages
                        </td>
                        <td className="px-6 py-4 text-right font-medium text-slate-900">
                          Rs. {vb.totalCOD.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-right font-medium text-red-500">
                          Rs. {vb.totalDeliveryCharge.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-right font-bold text-emerald-600 text-base">
                          Rs. {vb.netPayable.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => openDirectPayModal(vb)}
                            className="btn-primary btn-sm px-4 py-1.5 flex items-center gap-1.5 text-xs ml-auto shadow-xs"
                          >
                            <Send className="w-3.5 h-3.5" /> Pay Vendor
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── TAB 3: DIRECT PACKAGE PAYOUTS & COD AUDIT ───────────────────── */}
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

            <div className="overflow-x-auto min-h-[380px]">
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
                                  className="btn-sm px-2 py-1 bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 font-bold rounded flex items-center gap-1 text-xs"
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

      {/* ── REUSABLE PAYMENT MODAL (FULL / PARTIAL / DIRECT PAYOUT) ──────────── */}
      {payModal.open && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex justify-between items-center">
              <div>
                <h4 className="font-bold text-base flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-brand-400" />
                  Process Vendor Payout
                </h4>
                <p className="text-xs text-slate-300 mt-0.5">Pay <strong className="text-white">{payModal.vendorName}</strong></p>
              </div>
              <button 
                onClick={() => setPayModal(prev => ({ ...prev, open: false }))}
                className="p-1 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handlePaymentSubmit} className="p-6 space-y-4">
              
              {/* Bank Details Card */}
              {payModal.bankDetails && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs text-slate-700 space-y-1">
                  <div className="font-bold text-slate-900 flex items-center gap-1 text-sm mb-1">
                    <Store className="w-4 h-4 text-brand-600" />
                    Bank Account Details
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div><span className="text-slate-400">Bank:</span> <strong className="font-semibold text-slate-800">{payModal.bankDetails.bankName}</strong></div>
                    <div><span className="text-slate-400">Account No:</span> <strong className="font-mono font-semibold text-slate-800">{payModal.bankDetails.accountNumber}</strong></div>
                    <div><span className="text-slate-400">Holder:</span> {payModal.bankDetails.accountHolder}</div>
                    <div><span className="text-slate-400">Branch:</span> {payModal.bankDetails.branch}</div>
                  </div>
                </div>
              )}

              {/* Amount Input Section (Full or Partial) */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <label className="font-bold text-slate-700">Payout Amount (Rs.) *</label>
                  <span className="text-slate-500 font-medium">
                    Total Unpaid: <strong className="text-slate-900">Rs. {payModal.maxPayableAmount.toLocaleString()}</strong>
                  </span>
                </div>
                <input
                  type="number"
                  required
                  min="1"
                  max={payModal.maxPayableAmount}
                  step="any"
                  className="input-field text-lg font-bold text-brand-700 w-full"
                  value={payModal.paidAmount}
                  onChange={(e) => setPayModal(prev => ({ ...prev, paidAmount: e.target.value }))}
                />
                
                {/* Partial Payout Notice */}
                {Number(payModal.paidAmount) > 0 && Number(payModal.paidAmount) < payModal.maxPayableAmount && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-2.5 text-xs text-blue-800 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <strong>Partial Payout:</strong> You are paying <strong className="text-blue-900">Rs. {Number(payModal.paidAmount).toLocaleString()}</strong>. 
                      The remaining balance of <strong className="text-blue-900">Rs. {remainingBalance.toLocaleString()}</strong> will automatically carry forward to the next settlement.
                    </div>
                  </div>
                )}
              </div>

              {/* Payment Method */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Payment Method *</label>
                <select
                  className="input-field w-full text-sm"
                  value={payModal.paymentMethod}
                  onChange={(e) => setPayModal(prev => ({ ...prev, paymentMethod: e.target.value }))}
                >
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="eSewa">eSewa</option>
                  <option value="Khalti">Khalti</option>
                  <option value="Cash">Cash</option>
                  <option value="Cheque">Cheque</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Reference ID / Bank Ref */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Transaction Reference ID / Bank Ref # *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. TXN987654321 or Cheque #1234"
                  className="input-field w-full font-mono text-sm"
                  value={payModal.reference}
                  onChange={(e) => setPayModal(prev => ({ ...prev, reference: e.target.value }))}
                />
              </div>

              {/* Admin Notes */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Admin Notes (Optional)</label>
                <input
                  type="text"
                  placeholder="Optional notes for this payout..."
                  className="input-field w-full text-sm"
                  value={payModal.adminNotes}
                  onChange={(e) => setPayModal(prev => ({ ...prev, adminNotes: e.target.value }))}
                />
              </div>

              {/* Modal Actions */}
              <div className="pt-3 flex gap-3">
                <button
                  type="button"
                  onClick={() => setPayModal(prev => ({ ...prev, open: false }))}
                  className="btn-secondary w-full text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processing}
                  className="btn-primary w-full text-sm flex items-center justify-center gap-2 shadow-sm"
                >
                  <Send className="w-4 h-4" />
                  {processing ? 'Processing...' : 'Confirm & Pay'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminSettlements;
