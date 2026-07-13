import React, { useState, useEffect, useCallback } from 'react';
import api from '../../../api/axios';
import { useToast } from '../../../store/ToastContext';
import { useAuth } from '../../../store/AuthContext';
import TrackingLink from '../../../components/TrackingLink';
import Pagination from '../../../components/Pagination';
import { 
  Clock, CheckSquare, RefreshCw, Search, AlertTriangle, CheckCircle2, 
  Wallet, RotateCcw, FileText, ChevronDown, ChevronUp, Sliders, X, Check, Save
} from 'lucide-react';

const PendingVerification = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState('pending');
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [pagination, setPagination] = useState(null);

  // KPIs
  const [kpis, setKpis] = useState({
    pending: 0,
    verifiedToday: 0,
    reopened: 0,
    codDifferences: 0,
    draftsSaved: 0,
    slaAlerts: 0,
  });

  // Selected packages for bulk verify
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [bulkConfirmModal, setBulkConfirmModal] = useState(false);

  // Edit / Verify Modal
  const [editModal, setEditModal] = useState(false);
  const [currentPkg, setCurrentPkg] = useState(null);
  const [form, setForm] = useState({
    status: '',
    amount: 0,
    deliveryCharge: 0,
    comments: '',
    receiverName: '',
    receiverPhone: '',
    deliveryDate: '',
    holdReason: '',
    rejectReason: '',
    paymentMethod: 'Cash',
    collectionType: '',
    reason: 'System correction',
    customRemarks: '',
  });

  // Expanded audit details map
  const [expandedAudits, setExpandedAudits] = useState(new Set());

  // Load KPI Stats
  const fetchKPIs = useCallback(async () => {
    try {
      // Get all packages for current day or pending list
      const r = await api.get('/admin/packages?limit=1000');
      const pkgs = r.data.data || [];
      
      const now = new Date();
      const todayStr = now.toLocaleDateString();

      let pendingCount = 0;
      let verifiedTodayCount = 0;
      let reopenedCount = 0;
      let diffCount = 0;
      let draftsCount = 0;
      let slaCount = 0;

      pkgs.forEach(p => {
        if (p.deliveryVerificationStatus === 'Pending' || p.deliveryVerificationStatus === 'Reopened') {
          pendingCount++;
          if (p.deliveryVerificationStatus === 'Reopened') reopenedCount++;
          
          // SLA Check: over 30 minutes since rider submission
          const submittedAt = p.riderSubmission?.submittedAt || p.updatedAt;
          if (submittedAt) {
            const minutesDiff = (now - new Date(submittedAt)) / 60000;
            if (minutesDiff > 30) {
              slaCount++;
            }
          }
        }
        if (p.deliveryVerificationStatus === 'Verified') {
          const verifiedAt = p.verifiedAt ? new Date(p.verifiedAt) : new Date(p.updatedAt);
          if (verifiedAt.toLocaleDateString() === todayStr) {
            verifiedTodayCount++;
          }
        }
        if (p.financialAdjustments && p.financialAdjustments.length > 0) {
          diffCount++;
        }
        if (p.verificationDraft) {
          draftsCount++;
        }
      });

      setKpis({
        pending: pendingCount,
        verifiedToday: verifiedTodayCount,
        reopened: reopenedCount,
        codDifferences: diffCount,
        draftsSaved: draftsCount,
        slaAlerts: slaCount
      });
    } catch (e) {
      console.error('Failed to calculate verification KPIs', e);
    }
  }, []);

  // Fetch Packages based on Tab & filters
  const fetchPackages = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      let url = `/admin/packages?page=${page}&limit=${limit}`;
      if (search) {
        url += `&search=${search.trim()}`;
      }

      const r = await api.get(url);
      let list = r.data.data || [];

      // Filter local lists by verification tab criteria
      const now = new Date();
      const todayStr = now.toLocaleDateString();

      if (activeTab === 'pending') {
        list = list.filter(p => p.deliveryVerificationStatus === 'Pending' || p.deliveryVerificationStatus === 'Reopened');
      } else if (activeTab === 'verified_today') {
        list = list.filter(p => p.deliveryVerificationStatus === 'Verified' && p.verifiedAt && new Date(p.verifiedAt).toLocaleDateString() === todayStr);
      } else if (activeTab === 'history') {
        list = list.filter(p => p.deliveryVerificationStatus === 'Verified' || (p.verificationAudit && p.verificationAudit.length > 0));
      }

      setPackages(list);
      setPagination(r.data.pagination);
      setSelectedIds(new Set());
    } catch (e) {
      showToast('Failed to load packages for verification', 'error');
    } finally {
      setLoading(false);
    }
  }, [activeTab, page, limit, search, showToast]);

  useEffect(() => {
    fetchPackages();
    fetchKPIs();
  }, [activeTab, page, limit, fetchPackages, fetchKPIs]);

  // Toggle Audit Log expansion
  const toggleAudit = (pkgId) => {
    const newSet = new Set(expandedAudits);
    if (newSet.has(pkgId)) newSet.delete(pkgId);
    else newSet.add(pkgId);
    setExpandedAudits(newSet);
  };

  // Toggle package selection for bulk verify
  const toggleSelect = (id) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  // Select all checkboxes
  const toggleSelectAll = () => {
    if (selectedIds.size === packages.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(packages.map(p => p._id)));
    }
  };

  // Open Verify / Edit Modal
  const openEditModal = (pkg) => {
    const isVerified = pkg.deliveryVerificationStatus === 'Verified';
    const defaultVal = isVerified ? pkg : (pkg.verificationDraft || pkg.riderSubmission || pkg);
    setCurrentPkg(pkg);
    setForm({
      status: defaultVal.status || pkg.status,
      amount: defaultVal.amount !== undefined ? defaultVal.amount : pkg.amount,
      deliveryCharge: defaultVal.deliveryCharge !== undefined ? defaultVal.deliveryCharge : pkg.deliveryCharge,
      comments: defaultVal.comments || pkg.comments || '',
      receiverName: defaultVal.receiverName || pkg.customerName || '',
      receiverPhone: defaultVal.receiverPhone || pkg.customerPhone || '',
      deliveryDate: defaultVal.deliveryDate ? new Date(defaultVal.deliveryDate).toISOString().split('T')[0] : pkg.deliveryDate ? new Date(pkg.deliveryDate).toISOString().split('T')[0] : '',
      holdReason: defaultVal.holdReason || pkg.holdReason || '',
      rejectReason: defaultVal.rejectReason || pkg.rejectReason || '',
      paymentMethod: defaultVal.paymentMethod || pkg.paymentMethod || 'Cash',
      collectionType: defaultVal.collectionType || pkg.collectionType || '',
      reason: 'System correction',
      customRemarks: '',
    });
    setEditModal(true);
  };

  // Save Verification Draft
  const handleSaveDraft = async () => {
    try {
      await api.put(`/admin/packages/${currentPkg._id}/verification-draft`, form);
      showToast('Verification draft saved successfully.', 'success');
      setEditModal(false);
      fetchPackages(true);
      fetchKPIs();
    } catch (e) {
      showToast(e.response?.data?.message || 'Failed to save draft', 'error');
    }
  };

  // Verify Package
  const handleVerify = async () => {
    try {
      const payload = {
        ...form,
        version: currentPkg.__v, // Concurrency Version
      };
      await api.post(`/admin/packages/${currentPkg._id}/verify-action`, payload);
      showToast('Package verified successfully.', 'success');
      setEditModal(false);
      fetchPackages(true);
      fetchKPIs();
    } catch (e) {
      showToast(e.response?.data?.message || 'Failed to verify package', 'error');
    }
  };


  // Direct quick verification using rider details
  const handleQuickVerify = async (pkg) => {
    if (!window.confirm(`Verify delivery status of package ${pkg.trackingCode} as submitted?`)) return;
    try {
      const payload = {
        version: pkg.__v,
        status: pkg.riderSubmission?.status || pkg.status,
        amount: pkg.riderSubmission?.amount !== undefined ? pkg.riderSubmission.amount : pkg.amount,
        deliveryCharge: pkg.deliveryCharge,
        comments: pkg.riderSubmission?.comments || pkg.comments,
        paymentMethod: pkg.paymentMethod || 'Cash',
        reason: 'System correction',
        customRemarks: 'Directly verified from pending'
      };
      await api.post(`/admin/packages/${pkg._id}/verify-action`, payload);
      showToast('Package verified successfully.', 'success');
      fetchPackages(true);
      fetchKPIs();
    } catch (e) {
      showToast(e.response?.data?.message || 'Failed to verify package', 'error');
    }
  };

  // Bulk Verification Confirmation
  const handleBulkVerify = async () => {
    try {
      await api.post('/admin/packages/bulk-verify', { packageIds: Array.from(selectedIds) });
      showToast(`Bulk verified ${selectedIds.size} packages successfully.`, 'success');
      setBulkConfirmModal(false);
      fetchPackages(true);
      fetchKPIs();
    } catch (e) {
      showToast(e.response?.data?.message || 'Bulk verification failed.', 'error');
    }
  };

  // Predefined reasons list
  const predefinedReasons = [
    'Customer unavailable',
    'Wrong amount entered',
    'Wrong delivery status',
    'Returned partial order',
    'Duplicate submission',
    'System correction',
    'Other'
  ];

  // Helper: Status badge
  const renderStatusBadge = (status) => {
    const styles = {
      'Delivered': 'bg-emerald-100 text-emerald-800 border-emerald-200',
      'Postponed': 'bg-amber-100 text-amber-800 border-amber-200',
      'Hold': 'bg-purple-100 text-purple-800 border-purple-200',
      'Rejected': 'bg-red-100 text-red-800 border-red-200',
      'Cancelled': 'bg-red-100 text-red-800 border-red-200',
      'Returned': 'bg-blue-100 text-blue-800 border-blue-200',
    };
    return (
      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${styles[status] || 'bg-slate-100 text-slate-800 border-slate-200'}`}>
        {status}
      </span>
    );
  };

  // Helper: Verification Status Badge
  const renderVerificationBadge = (vStatus) => {
    const styles = {
      'Verified': 'bg-emerald-100 text-emerald-800 border-emerald-200',
      'Pending': 'bg-amber-100 text-amber-800 border-amber-200',
      'Reopened': 'bg-indigo-100 text-indigo-800 border-indigo-200',
      'Rejected': 'bg-rose-100 text-rose-800 border-rose-200'
    };
    return (
      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${styles[vStatus] || 'bg-slate-100 text-slate-850'}`}>
        {vStatus || 'Pending'}
      </span>
    );
  };

  // Calculate sum of COD for selected packages
  const selectedCodSum = packages
    .filter(p => selectedIds.has(p._id))
    .reduce((sum, p) => sum + (p.riderSubmission?.amount || p.amount || 0), 0);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Tab Nav & Refresh */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-100">
        <div className="flex gap-2 p-1 bg-slate-100 rounded-lg">
          {[
            { id: 'pending', label: 'Pending Verification', count: kpis.pending },
            { id: 'verified_today', label: 'Verified Today', count: kpis.verifiedToday },
            { id: 'history', label: 'Verification History', count: null }
          ].map(t => (
            <button
              key={t.id}
              onClick={() => { setActiveTab(t.id); setPage(1); }}
              className={`px-4 py-2 rounded-md text-xs font-bold transition-all ${
                activeTab === t.id 
                  ? 'bg-white text-brand-600 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {t.label} {t.count !== null && <span className="ml-1 px-1.5 py-0.5 rounded-full bg-slate-200 text-slate-700">{t.count}</span>}
            </button>
          ))}
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search tracking, rider, vendor..." 
              className="input-field pl-9 py-2 w-full text-xs" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchPackages()}
            />
          </div>
          <button className="btn-secondary py-2 flex items-center gap-1.5 text-xs font-bold" onClick={() => { fetchPackages(); fetchKPIs(); }}>
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>
      </div>

      {/* KPI Section */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { title: 'Pending', value: kpis.pending, color: 'text-amber-600 bg-amber-50 border-amber-100', desc: 'Awaiting verification' },
          { title: 'Verified Today', value: kpis.verifiedToday, color: 'text-emerald-600 bg-emerald-50 border-emerald-100', desc: 'Completed today' },
          { title: 'Reopened', value: kpis.reopened, color: 'text-indigo-600 bg-indigo-50 border-indigo-100', desc: 'Unlocked for edits' },
          { title: 'COD Differences', value: kpis.codDifferences, color: 'text-rose-600 bg-rose-50 border-rose-100', desc: 'Financial discrepancies' },
          { title: 'Drafts Saved', value: kpis.draftsSaved, color: 'text-blue-600 bg-blue-50 border-blue-100', desc: 'Unfinished works' },
          { title: 'SLA Alerts', value: kpis.slaAlerts, color: kpis.slaAlerts > 0 ? 'text-red-600 bg-red-50 border-red-100 animate-pulse' : 'text-slate-600 bg-slate-50 border-slate-100', desc: 'Pending over 30 mins' },
        ].map((card, i) => (
          <div key={i} className={`p-4 rounded-xl border ${card.color} flex flex-col justify-between h-24 shadow-sm`}>
            <div className="text-[10px] uppercase font-bold tracking-wider opacity-80">{card.title}</div>
            <div className="text-2xl font-black">{card.value}</div>
            <div className="text-[9px] font-medium opacity-70">{card.desc}</div>
          </div>
        ))}
      </div>

      {/* Bulk Action Bar */}
      {selectedIds.size > 0 && activeTab === 'pending' && (
        <div className="bg-brand-50 border border-brand-100 p-4 rounded-xl flex items-center justify-between animate-fadeIn shadow-sm">
          <div className="flex items-center gap-4 text-sm font-bold text-brand-900">
            <span>{selectedIds.size} packages selected</span>
            <span>Total COD Value: Rs. {selectedCodSum.toLocaleString()}</span>
          </div>
          <button 
            onClick={() => setBulkConfirmModal(true)}
            className="btn-primary py-2 px-4 flex items-center gap-1.5 text-xs font-bold"
          >
            <CheckCircle2 className="w-4 h-4" /> Verify Selected
          </button>
        </div>
      )}

      {/* Main Table */}
      <div className="card-premium overflow-hidden border border-slate-100 shadow-sm">
        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
              <tr>
                {activeTab === 'pending' && (
                  <th className="px-6 py-4 w-10">
                    <input 
                      type="checkbox" 
                      className="rounded border-slate-300 text-brand-650 focus:ring-brand-650"
                      checked={packages.length > 0 && selectedIds.size === packages.length}
                      onChange={toggleSelectAll}
                    />
                  </th>
                )}
                <th className="px-6 py-4">Shipment Details</th>
                <th className="px-6 py-4">Rider Submission</th>
                <th className="px-6 py-4">Verification Draft</th>
                <th className="px-6 py-4">SLA / Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {loading ? (
                <tr><td colSpan="6" className="px-6 py-12 text-center text-slate-400">Loading packages data...</td></tr>
              ) : packages.length === 0 ? (
                <tr><td colSpan="6" className="px-6 py-12 text-center text-slate-400">No packages found for verification.</td></tr>
              ) : (
                packages.map(p => {
                  const isExpanded = expandedAudits.has(p._id);
                  const isSlaAlert = (p.deliveryVerificationStatus === 'Pending' || p.deliveryVerificationStatus === 'Reopened') && 
                    p.riderSubmission?.submittedAt && 
                    ((new Date() - new Date(p.riderSubmission.submittedAt)) / 60000 > 30);
                  
                  return (
                    <React.Fragment key={p._id}>
                      <tr className={`hover:bg-slate-50/50 transition-colors ${selectedIds.has(p._id) ? 'bg-brand-50/20' : ''}`}>
                        {activeTab === 'pending' && (
                          <td className="px-6 py-4">
                            <input 
                              type="checkbox" 
                              className="rounded border-slate-300 text-brand-650 focus:ring-brand-650"
                              checked={selectedIds.has(p._id)}
                              onChange={() => toggleSelect(p._id)}
                            />
                          </td>
                        )}
                        <td className="px-6 py-4">
                          <div>
                            <TrackingLink code={p.trackingCode} />
                            {p.invoiceId && <span className="ml-2 text-[10px] text-slate-400 font-bold border border-slate-200 px-1 rounded">{p.invoiceId}</span>}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-1">Vendor: <span className="font-bold text-slate-600">{(p.vendorId?.vendorMeta?.shopName || p.vendorId?.name) || 'Unknown'}</span></div>
                          <div className="text-[10px] text-slate-400">Recipient: <span className="text-slate-600 font-semibold">{p.customerName} ({p.customerPhone})</span></div>
                        </td>
                        <td className="px-6 py-4">
                          {p.riderSubmission ? (
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5">
                                {renderStatusBadge(p.riderSubmission.status)}
                                <span className="text-xs font-bold text-slate-700">Rs. {p.riderSubmission.amount}</span>
                              </div>
                              <div className="text-[10px] text-slate-400">Rider: <span className="text-slate-600 font-bold">{p.riderId?.name || 'Assigned'}</span></div>
                              {p.riderSubmission.comments && <div className="text-[10px] text-slate-500 italic">"{p.riderSubmission.comments}"</div>}
                            </div>
                          ) : (
                            <span className="text-slate-400 text-xs italic">No rider submission</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {p.verificationDraft ? (
                            <div className="space-y-1 text-slate-700 bg-blue-50/50 p-2 rounded border border-blue-100 w-max max-w-xs">
                              <div className="flex items-center gap-1.5">
                                <span className="px-1.5 py-0.5 bg-blue-100 text-blue-800 text-[10px] font-bold rounded">DRAFT</span>
                                {renderStatusBadge(p.verificationDraft.status)}
                                <span className="text-xs font-bold">Rs. {p.verificationDraft.amount}</span>
                              </div>
                              {p.verificationDraft.comments && <div className="text-[10px] italic">"{p.verificationDraft.comments}"</div>}
                            </div>
                          ) : (
                            <span className="text-slate-400 text-xs italic">No draft saved</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1.5">
                            <div className="flex items-center gap-2">
                              {renderVerificationBadge(p.deliveryVerificationStatus)}
                              {isSlaAlert && (
                                <span className="px-2 py-0.5 bg-red-150 text-red-800 text-[9px] font-bold rounded border border-red-200 flex items-center gap-0.5">
                                  <AlertTriangle className="w-2.5 h-2.5" /> Overdue
                                </span>
                              )}
                            </div>
                            {p.riderSubmission?.submittedAt && (
                              <div className="text-[10px] text-slate-400">
                                Submitted: {new Date(p.riderSubmission.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex gap-2 justify-end items-center">
                            {activeTab === 'pending' ? (
                              <>
                                <button 
                                  onClick={() => handleQuickVerify(p)}
                                  className="btn-sm py-1.5 px-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded font-bold text-xs flex items-center gap-1"
                                >
                                  <Check className="w-3.5 h-3.5" /> Verify
                                </button>
                                <button 
                                  onClick={() => openEditModal(p)}
                                  className="btn-sm py-1.5 px-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded font-bold text-xs flex items-center gap-1"
                                >
                                  <Sliders className="w-3.5 h-3.5" /> Edit & Verify
                                </button>
                              </>
                            ) : (
                              <>
                                <span className="text-xs text-slate-500 font-medium">Verified</span>
                                {p.deliveryVerificationStatus === 'Verified' && (
                                  <button
                                    onClick={() => openEditModal(p)}
                                    className="btn-sm py-1.5 px-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded font-bold text-xs flex items-center gap-1"
                                    title="Edit & Verify"
                                  >
                                    <Sliders className="w-3.5 h-3.5" /> Edit & Verify
                                  </button>
                                )}
                              </>
                            )}

                            {/* Audit details collapse toggler */}
                            {p.verificationAudit && p.verificationAudit.length > 0 && (
                              <button 
                                onClick={() => toggleAudit(p._id)}
                                className="text-slate-400 hover:text-slate-700 transition-colors p-1"
                                title="View Verification Logs"
                              >
                                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>

                      {/* Audit Log Details row */}
                      {isExpanded && (
                        <tr>
                          <td colSpan={activeTab === 'pending' ? 6 : 5} className="px-6 py-4 bg-slate-50/50 border-t border-slate-100">
                            <div className="space-y-4">
                              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                                <FileText className="w-3.5 h-3.5 text-brand-600" /> Verification Audit Logs ({p.verificationAudit.length})
                              </h4>
                              
                              <div className="space-y-3">
                                {p.verificationAudit.map((audit, idx) => (
                                  <div key={audit._id || idx} className="p-3 bg-white rounded-lg border border-slate-200 shadow-sm text-xs grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <div>
                                      <div className="text-[10px] text-slate-400 font-bold uppercase">Action & Operator</div>
                                      <div className="font-bold text-slate-800 mt-1">
                                        {audit.action === 'Reopen' ? '🔄 Reopened' : audit.action === 'Edit & Verify' ? '📝 Edited & Verified' : '✅ Verified'}
                                      </div>
                                      <div className="text-slate-500 mt-0.5">By {audit.approvedByName || 'System'}</div>
                                      <div className="text-[10px] text-slate-400 mt-1">{new Date(audit.verificationTime || audit.editTime).toLocaleString()}</div>
                                    </div>
                                    <div>
                                      <div className="text-[10px] text-slate-400 font-bold uppercase">Status Migration</div>
                                      <div className="mt-1 flex items-center gap-1.5">
                                        <span className="text-slate-400">{audit.previousStatus || 'N/A'}</span>
                                        <span className="text-slate-400">→</span>
                                        <span className="font-bold text-slate-700">{audit.updatedStatus}</span>
                                      </div>
                                    </div>
                                    <div>
                                      <div className="text-[10px] text-slate-400 font-bold uppercase">Financial Adjustment</div>
                                      <div className="mt-1">
                                        <span className="text-slate-500">Rs. {audit.previousAmount}</span>
                                        <span className="text-slate-400 mx-1">→</span>
                                        <span className="font-bold text-slate-850">Rs. {audit.updatedAmount}</span>
                                        {audit.difference !== 0 && (
                                          <div className={`mt-0.5 font-bold ${audit.difference > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                            {audit.difference > 0 ? `+ Rs. ${audit.difference}` : `- Rs. ${Math.abs(audit.difference)}`}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                    <div>
                                      <div className="text-[10px] text-slate-400 font-bold uppercase">Audit Scope / Metadata</div>
                                      <div className="text-slate-600 mt-1">Reason: <span className="font-semibold text-slate-800">{audit.reason || 'None'}</span></div>
                                      {audit.customRemarks && <div className="text-slate-500 italic mt-0.5">"{audit.customRemarks}"</div>}
                                      <div className="text-[10px] text-slate-400 mt-1">IP: {audit.ipAddress || 'Unknown'} | Device: {audit.device || 'Desktop'} ({audit.browser})</div>
                                    </div>
                                  </div>
                                ))}
                              </div>
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
        <Pagination pagination={pagination} onPageChange={setPage} limit={limit} onLimitChange={setLimit} />
      </div>

      {/* Edit & Verify Modal */}
      {editModal && currentPkg && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex justify-center items-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full shadow-xl border border-slate-200 flex flex-col max-h-[90vh] animate-scaleUp">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 rounded-t-xl">
              <div>
                <h3 className="font-bold text-slate-800 text-lg flex items-center gap-1.5">
                  <Sliders className="w-5 h-5 text-brand-600" /> Edit & Verify Shipment
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Package Code: {currentPkg.trackingCode}</p>
              </div>
              <button onClick={() => setEditModal(false)} className="text-slate-400 hover:text-slate-700 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4">
              
              {/* Compare Info Box */}
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-lg grid grid-cols-2 gap-4 text-xs">
                <div>
                  <div className="font-bold text-slate-400 uppercase tracking-wide">Rider Submission</div>
                  {currentPkg.riderSubmission ? (
                    <div className="mt-2 space-y-1.5">
                      <div className="flex items-center gap-1.5">
                        {renderStatusBadge(currentPkg.riderSubmission.status)}
                        <span className="font-bold text-slate-800">Rs. {currentPkg.riderSubmission.amount}</span>
                      </div>
                      <div className="text-slate-500">Remarks: "{currentPkg.riderSubmission.comments || 'No comment'}"</div>
                    </div>
                  ) : (
                    <div className="text-slate-400 italic mt-2">None</div>
                  )}
                </div>
                <div>
                  <div className="font-bold text-slate-400 uppercase tracking-wide">Original Package Details</div>
                  <div className="mt-2 space-y-1">
                    <div>Original Status: <span className="font-bold text-slate-700">{currentPkg.status}</span></div>
                    
                    <div className="flex items-center gap-2">Original COD: 
                      {currentPkg.originalValues?.amount !== undefined && (
                        <span className="line-through text-slate-400 font-normal">Rs. {currentPkg.originalValues.amount}</span>
                      )}
                      <span className="font-bold text-slate-700">Rs. {currentPkg.amount}</span>
                    </div>

                    <div className="flex items-center gap-2">Delivery Charge: 
                      {currentPkg.originalValues?.deliveryCharge !== undefined && (
                        <span className="line-through text-slate-400 font-normal">Rs. {currentPkg.originalValues.deliveryCharge}</span>
                      )}
                      <span className="font-bold text-slate-700">Rs. {currentPkg.deliveryCharge}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Form Fields Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">Delivery Status</label>
                  <select 
                    className="input-field w-full text-xs"
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                  >
                    <option value="Delivered">Delivered</option>
                    <option value="Postponed">Postponed</option>
                    <option value="Hold">Hold</option>
                    <option value="Rejected">Rejected</option>
                    <option value="Cancelled">Cancelled</option>
                    <option value="Returned">Returned</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">Verified COD Amount (Rs.)</label>
                  <input 
                    type="number"
                    className="input-field w-full text-xs"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">Delivery Charge (Rs.)</label>
                  <input 
                    type="number"
                    className="input-field w-full text-xs"
                    value={form.deliveryCharge}
                    onChange={(e) => setForm({ ...form, deliveryCharge: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">Payment Method</label>
                  <select 
                    className="input-field w-full text-xs"
                    value={form.paymentMethod}
                    onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
                  >
                    <option value="Cash">Cash</option>
                    <option value="Online">Online</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Wallet">Wallet</option>
                    <option value="COD">COD</option>
                    <option value="Mixed">Mixed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">Receiver Name</label>
                  <input 
                    type="text"
                    className="input-field w-full text-xs"
                    value={form.receiverName}
                    onChange={(e) => setForm({ ...form, receiverName: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">Receiver Phone</label>
                  <input 
                    type="text"
                    className="input-field w-full text-xs"
                    value={form.receiverPhone}
                    onChange={(e) => setForm({ ...form, receiverPhone: e.target.value })}
                  />
                </div>

                {form.status === 'Postponed' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5">Postponed New Date</label>
                    <input 
                      type="date"
                      className="input-field w-full text-xs"
                      value={form.deliveryDate}
                      onChange={(e) => setForm({ ...form, deliveryDate: e.target.value })}
                    />
                  </div>
                )}

                {form.status === 'Hold' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5">Hold Reason</label>
                    <input 
                      type="text"
                      className="input-field w-full text-xs"
                      value={form.holdReason}
                      onChange={(e) => setForm({ ...form, holdReason: e.target.value })}
                    />
                  </div>
                )}

                {(form.status === 'Rejected' || form.status === 'Cancelled') && (
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5">Reject / Cancel Reason</label>
                    <input 
                      type="text"
                      className="input-field w-full text-xs"
                      value={form.rejectReason}
                      onChange={(e) => setForm({ ...form, rejectReason: e.target.value })}
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">Verification Reason (Required for verification)</label>
                  <select 
                    className="input-field w-full text-xs font-semibold text-slate-700"
                    value={form.reason}
                    onChange={(e) => setForm({ ...form, reason: e.target.value })}
                  >
                    {predefinedReasons.map((r, i) => (
                      <option key={i} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Custom Remarks</label>
                <textarea 
                  className="input-field w-full text-xs min-h-[60px]"
                  placeholder="Type any additional remarks..."
                  value={form.customRemarks}
                  onChange={(e) => setForm({ ...form, customRemarks: e.target.value })}
                />
              </div>

              {currentPkg.verificationAudit && currentPkg.verificationAudit.length > 0 && (
                <div className="mt-4 border-t border-slate-100 pt-4">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5 text-brand-600" /> Verification Audit Logs ({currentPkg.verificationAudit.length})
                  </h4>
                  <div className="space-y-3">
                    {currentPkg.verificationAudit.map((audit, idx) => (
                      <div key={audit._id || idx} className="p-3 bg-white rounded-lg border border-slate-200 shadow-sm text-xs grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                          <div className="text-[10px] text-slate-400 font-bold uppercase">Action & Operator</div>
                          <div className="font-bold text-slate-800 mt-1">
                            {audit.action === 'Reopen' ? '🔄 Reopened' : audit.action === 'Edit & Verify' ? '📝 Edited & Verified' : '✅ Verified'}
                          </div>
                          <div className="text-slate-500 mt-0.5">By {audit.approvedByName || 'System'}</div>
                          <div className="text-[10px] text-slate-400 mt-1">{new Date(audit.verificationTime || audit.editTime).toLocaleString()}</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-slate-400 font-bold uppercase">Status Migration</div>
                          <div className="mt-1 flex items-center gap-1.5">
                            <span className="text-slate-400">{audit.previousStatus || 'N/A'}</span>
                            <span className="text-slate-400">→</span>
                            <span className="font-bold text-slate-700">{audit.updatedStatus}</span>
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] text-slate-400 font-bold uppercase">Financial Adjustment</div>
                          <div className="mt-1">
                            <span className="text-slate-500">Rs. {audit.previousAmount}</span>
                            <span className="text-slate-400 mx-1">→</span>
                            <span className="font-bold text-slate-850">Rs. {audit.updatedAmount}</span>
                            {audit.difference !== 0 && (
                              <div className={`mt-0.5 font-bold ${audit.difference > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                {audit.difference > 0 ? `+ Rs. ${audit.difference}` : `- Rs. ${Math.abs(audit.difference)}`}
                              </div>
                            )}
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] text-slate-400 font-bold uppercase">Audit Scope / Metadata</div>
                          <div className="text-slate-600 mt-1">Reason: <span className="font-semibold text-slate-800">{audit.reason || 'None'}</span></div>
                          {audit.customRemarks && <div className="text-slate-500 italic mt-0.5">"{audit.customRemarks}"</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-100 flex justify-between bg-slate-50/50 rounded-b-xl">
              <button onClick={() => setEditModal(false)} className="btn-secondary py-2 text-xs font-bold">
                Cancel
              </button>
              <div className="flex gap-2">
                <button 
                  onClick={handleSaveDraft}
                  className="px-4 py-2 border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded text-xs font-bold flex items-center gap-1"
                >
                  <Save className="w-3.5 h-3.5" /> Save Draft
                </button>
                <button 
                  onClick={handleVerify}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold flex items-center gap-1 shadow-sm"
                >
                  <Check className="w-3.5 h-3.5" /> Verify & Lock
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Verification Confirmation Modal */}
      {bulkConfirmModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex justify-center items-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full shadow-xl border border-slate-200 flex flex-col p-6 animate-scaleUp">
            <h3 className="font-bold text-slate-800 text-lg flex items-center gap-1.5 border-b pb-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" /> Confirm Bulk Verification
            </h3>
            <div className="py-4 space-y-3 text-sm text-slate-600">
              <p>You are about to verify multiple shipments at once using the values submitted by the riders (or drafts if saved).</p>
              <div className="p-3 bg-slate-50 border rounded-lg space-y-1.5">
                <div>Selected Shipments: <span className="font-bold text-slate-800">{selectedIds.size} packages</span></div>
                <div>Total COD to Verify: <span className="font-bold text-emerald-600">Rs. {selectedCodSum.toLocaleString()}</span></div>
              </div>
              <p className="text-xs text-red-500 font-medium">⚠️ Warning: Verified records will be locked and cannot be edited by normal admin users.</p>
            </div>
            <div className="flex justify-between items-center border-t pt-3 mt-2">
              <button onClick={() => setBulkConfirmModal(false)} className="btn-secondary py-2 text-xs font-bold">
                Cancel
              </button>
              <button 
                onClick={handleBulkVerify}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold shadow-sm"
              >
                Verify {selectedIds.size} Packages
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PendingVerification;
