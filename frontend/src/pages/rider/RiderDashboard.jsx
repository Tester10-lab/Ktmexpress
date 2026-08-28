import React, { useState, useEffect } from 'react';
import { Routes, Route, useLocation, useNavigate, Navigate } from 'react-router-dom';
import AppShell from '../../layouts/AppShell';
import MetricCard from '../../components/MetricCard';
import api from '../../api/axios';
import { useToast } from '../../store/ToastContext';
import TrackingLink from '../../components/TrackingLink';
import SearchPanel from '../../components/SearchPanel';
import { 
  Package, Truck, Wallet, History, MapPin, Navigation, 
  CheckCircle2, XCircle, Clock, Search, AlertCircle, X,
  Calendar, FileText, ChevronRight, Phone, Target, ArrowLeftRight,
  Coins, QrCode, CreditCard, Banknote, Check
} from 'lucide-react';

const navLinks = [
  { name: 'My Deliveries', path: '/rider/deliveries', icon: <Truck className="w-[18px] h-[18px]" /> },
  { name: 'Performance & Wallet', path: '/rider/wallet', icon: <Wallet className="w-[18px] h-[18px]" /> },
  { name: 'Log Expense', path: '/rider/expenses', icon: <FileText className="w-[18px] h-[18px]" /> },
  { name: 'Expense History', path: '/rider/expense-history', icon: <History className="w-[18px] h-[18px]" /> },
];

const titleMap = {
  '/rider/deliveries': 'My Deliveries & Pickups',
  '/rider/wallet': 'Performance & Wallet',
  '/rider/expenses': 'Log Expense',
  '/rider/expense-history': 'Expense History',
};

function statusBadge(status, verificationStatus) {
  const base = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border";
  if (verificationStatus === 'Pending' || verificationStatus === 'Reopened') {
    return <span className={`${base} bg-amber-50 text-amber-700 border-amber-200 animate-pulse`}>⏳ Pending Verification</span>;
  }
  if (verificationStatus === 'Verified') {
    return (
      <span className={`${base} bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold inline-flex items-center gap-1`}>
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 inline" />
        {status} • Verified
      </span>
    );
  }
  const styles = {
    'Delivered': 'bg-emerald-50 text-emerald-700 border-emerald-200',
    'Cancelled': 'bg-red-50 text-red-700 border-red-200',
    'Returned': 'bg-sky-50 text-sky-700 border-sky-200',
    'Postponed': 'bg-amber-50 text-amber-700 border-amber-200',
    'Out for Delivery': 'bg-brand-50 text-brand-700 border-brand-200',
    'Pick Up Requested': 'bg-amber-50 text-amber-700 border-amber-200',
    'Picked Up': 'bg-brand-50 text-brand-700 border-brand-200'
  };
  return <span className={`${base} ${styles[status] || 'bg-slate-100 text-slate-700 border-slate-200'}`}>{status}</span>;
}

const TaskCard = React.memo(({ pkg, isPickup, selectedPickups, selectedDeliveries, toggleSelect, toggleSelectDelivery, openModal }) => {
  const isPendingPickup = isPickup && pkg.status === 'Pick Up Requested';
  const isActiveDelivery = !isPickup && ['Out for Delivery'].includes(pkg.status);

  return (
    <div className={`bg-white rounded-2xl border p-5 transition-all duration-300 shadow-sm hover:shadow-md hover:-translate-y-0.5 ${isPendingPickup || isActiveDelivery ? 'border-slate-900 shadow-sm' : 'border-slate-200 opacity-90'}`}>
      <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
        
        <div className="flex items-center gap-4">
          {isPendingPickup && (
            <input type="checkbox" className="w-5 h-5 rounded border-slate-300 text-slate-900 focus:ring-slate-900 cursor-pointer" checked={selectedPickups.includes(pkg._id)} onChange={() => toggleSelect(pkg._id)} />
          )}
          {isActiveDelivery && (
            <input type="checkbox" className="w-5 h-5 rounded border-slate-300 text-slate-900 focus:ring-slate-900 cursor-pointer" checked={selectedDeliveries.includes(pkg._id)} onChange={() => toggleSelectDelivery(pkg._id)} />
          )}
        </div>

        <div className="flex-1 flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          <div className="space-y-3 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <TrackingLink code={pkg.trackingCode} className="text-lg" />
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-brand-50 text-brand-700 border border-brand-200">
                🏢 {pkg.vendorId?.vendorMeta?.shopName || (pkg.vendorId?.vendorMeta?.shopName || pkg.vendorId?.name) || 'Vendor'}
              </span>
              {statusBadge(pkg.status, pkg.deliveryVerificationStatus)}
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
              <div className="flex items-center gap-2 font-semibold text-slate-800">
                <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center shrink-0">👤</div>
                {pkg.customerName}
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center shrink-0"><Phone className="w-3.5 h-3.5"/></div>
                {pkg.customerPhone || 'No Phone'}
              </div>
              <div className="flex items-start gap-2 text-slate-600 sm:col-span-2 lg:col-span-1">
                <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center shrink-0 mt-0.5"><MapPin className="w-3.5 h-3.5"/></div>
                <span>{pkg.city ? `${pkg.city}, ` : ''}{pkg.address}</span>
              </div>
            </div>
            
            <div className="pt-2 border-t border-slate-100 mt-2">
              <span className="text-sm font-medium text-slate-500 mr-2">To Collect:</span>
              <span className="text-lg font-bold text-brand-600">Rs. {pkg.amount}</span>
            </div>
          </div>

          <div className="flex flex-wrap sm:flex-col lg:flex-row gap-2 shrink-0 md:min-w-[140px] md:justify-end">
            {isPendingPickup && (
              <button className="btn-primary py-2 px-4 flex items-center gap-2 flex-1 justify-center whitespace-nowrap" onClick={()=>openModal(pkg,'pickup_complete')} title="Confirm Pickup">
                <CheckCircle2 className="w-4 h-4" /> Confirm Pickup
              </button>
            )}
            {isActiveDelivery && (
              <>
                <button className="flex-1 lg:flex-none py-2 px-3 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-1.5" onClick={()=>openModal(pkg,'deliver')} title="Delivered">
                  <CheckCircle2 className="w-4 h-4" /> Delivered
                </button>
                <button className="flex-1 lg:flex-none py-2 px-3 bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-1.5" onClick={()=>openModal(pkg,'postpone')} title="Postpone">
                  <Clock className="w-4 h-4" /> Postpone
                </button>
                <button className="flex-1 lg:flex-none py-2 px-3 bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-1.5" onClick={()=>openModal(pkg,'cancel')} title="Cancel">
                  <XCircle className="w-4 h-4" /> Cancel
                </button>
                <button className="flex-1 lg:flex-none py-2 px-3 bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-1.5" onClick={()=>openModal(pkg,'return')} title="Return">
                  <ArrowLeftRight className="w-4 h-4" /> Return
                </button>
                <button className="flex-1 lg:flex-none py-2 px-3 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-1.5" onClick={()=>openModal(pkg,'exchange')} title="Exchange">
                  <ArrowLeftRight className="w-4 h-4" /> Exchange
                </button>
              </>
            )}
            {(!isActiveDelivery && !isPendingPickup && pkg.deliveryVerificationStatus !== 'Pending' && pkg.deliveryVerificationStatus !== 'Verified') && (
              <button className="flex-1 lg:flex-none py-2 px-3 bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-1.5" onClick={()=>openModal(pkg,'request_verification')} title="Request Verification">
                <AlertCircle className="w-4 h-4" /> Request Verification
              </button>
            )}
          </div>
          
        </div>
      </div>
    </div>
  );
});

// ─── My Deliveries ────────────────────────────────────────────────────────
const MyDeliveries = () => {
  const [deliveries, setDeliveries] = useState([]);
  const [pickups, setPickups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionModal, setActionModal] = useState({open:false,pkg:null,action:''});
  const [form, setForm] = useState({comment:'',cashCollected:'',newDate:''});
  const [selectedPickups, setSelectedPickups] = useState([]);
  const [selectedDeliveries, setSelectedDeliveries] = useState([]);
  const [search, setSearch] = useState('');
  
  // UI State for Filters
  const [activeTab, setActiveTab] = useState('deliveries'); // 'deliveries' or 'pickups'
  const [deliveryFilter, setDeliveryFilter] = useState('all'); // 'all', 'pending', 'active', 'completed', 'failed'
  const [pickupFilter, setPickupFilter] = useState('pending'); // 'all', 'pending', 'completed'
  
  const { showToast } = useToast();

  const fetchAll = React.useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const queryStr = search ? `&search=${encodeURIComponent(search)}` : '';
      const [d, p] = await Promise.all([
        api.get(`/rider/deliveries?type=delivery${queryStr}`), 
        api.get(`/rider/deliveries?type=pickup${queryStr}`)
      ]);
      setDeliveries(d.data.data||[]);
      setPickups(p.data.data||[]);
      setSelectedPickups([]);
      setSelectedDeliveries([]);
    } catch { 
      showToast('Failed to load deliveries','error'); 
    } finally { 
      setLoading(false); 
    }
  }, [showToast, search]);

  useEffect(() => { 
    const t = setTimeout(() => fetchAll(), 400); 
    return () => clearTimeout(t);
  }, [fetchAll]);

  // Real-time notification & polling listener
  useEffect(() => {
    const handleNotifUpdate = () => {
      fetchAll(true);
    };
    window.addEventListener('app_notification', handleNotifUpdate);
    const interval = setInterval(() => fetchAll(true), 15000);
    return () => {
      window.removeEventListener('app_notification', handleNotifUpdate);
      clearInterval(interval);
    };
  }, [fetchAll]);

  const openModal = React.useCallback((pkg, action) => { 
    setActionModal({open:true,pkg,action}); 
    setForm({
      comment: '',
      cashCollected: pkg.amount,
      newDate: '',
      proposedStatus: pkg.status || 'Delivered',
      verificationReason: ''
    }); 
  }, []);

  const submitAction = async e => {
    e.preventDefault();
    try {
      if (actionModal.action === 'request_verification') {
        const payloadReason = form.verificationReason === 'Other' ? form.comment : (form.verificationReason || form.comment);
        if (!payloadReason || !payloadReason.trim()) {
          showToast('Please select or specify a reason for verification', 'error');
          return;
        }
        await api.post(`/packages/${actionModal.pkg._id}/request-verification`, { 
          reason: payloadReason.trim(),
          proposedStatus: form.proposedStatus || actionModal.pkg.status,
          proposedAmount: form.cashCollected !== undefined && form.cashCollected !== '' ? Number(form.cashCollected) : actionModal.pkg.amount,
          comments: form.comment
        });
        showToast('Verification request sent to dispatcher!', 'success');
      } else {
        await api.put('/rider/update-status',{packageId:actionModal.pkg._id,action:actionModal.action,comment:form.comment,cashCollected:Number(form.cashCollected),newDate:form.newDate});
        showToast('Status updated!','success');
      }
      setActionModal({open:false,pkg:null,action:''});
      fetchAll(true);
    } catch(err) { showToast(err.response?.data?.message || err.message || 'Failed','error'); }
  };

  const handleBulkPickup = async () => {
    if (!selectedPickups.length) return;
    try {
      await api.put('/rider/bulk-pickup', { packageIds: selectedPickups });
      showToast(`${selectedPickups.length} pickups confirmed!`, 'success');
      fetchAll(true);
    } catch (err) {
      showToast(err.message || 'Failed to confirm bulk pickup', 'error');
    }
  };

  const toggleSelect = React.useCallback((id) => {
    setSelectedPickups(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }, []);

  const toggleSelectDelivery = React.useCallback((id) => {
    setSelectedDeliveries(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }, []);

  const handleBulkDelivery = async () => {
    if (!selectedDeliveries.length) return;
    let count = 0;
    try {
      await Promise.all(selectedDeliveries.map(async (id) => {
        const pkg = deliveries.find(d => d._id === id);
        if (pkg) {
          await api.put('/rider/update-status', { packageId: id, action: 'deliver', cashCollected: pkg.amount, comment: 'Bulk delivered' });
          count++;
        }
      }));
      showToast(`${count} deliveries marked as Completed!`, 'success');
      setSelectedDeliveries([]);
      fetchAll(true);
    } catch (err) {
      showToast('Some deliveries failed to update', 'error');
      fetchAll(true);
    }
  };

  const actionLabel = { deliver:'Mark Delivered',postpone:'Postpone',cancel:'Cancel',return:'Mark Return',exchange:'Exchange',pickup_complete:'Confirm Pickup', request_verification: 'Request Verification' };

  // Filtering Logic
  const filteredDeliveries = deliveries.filter(d => {
    if (deliveryFilter === 'pending') return d.status === 'Postponed';
    if (deliveryFilter === 'active') return d.status === 'Out for Delivery';
    if (deliveryFilter === 'completed') return d.status === 'Delivered';
    if (deliveryFilter === 'failed') return ['Cancelled', 'Returned', 'Exchanged'].includes(d.status);
    
    // For 'all' tab
    return true;
  });

  const filteredPickups = pickups.filter(p => {
    if (pickupFilter === 'pending') return p.status === 'Pick Up Requested';
    if (pickupFilter === 'completed') return p.status === 'Picked Up';
    return true; // 'all'
  });

  const activeFilteredDeliveries = filteredDeliveries.filter(d => ['Out for Delivery'].includes(d.status));
  const allDeliveriesSelected = activeFilteredDeliveries.length > 0 && selectedDeliveries.length === activeFilteredDeliveries.length;
  
  const handleSelectAllDeliveries = () => {
    if (allDeliveriesSelected) {
      setSelectedDeliveries([]);
    } else {
      setSelectedDeliveries(activeFilteredDeliveries.map(d => d._id));
    }
  };

  const pendingFilteredPickups = filteredPickups.filter(p => p.status === 'Pick Up Requested');
  const allPickupsSelected = pendingFilteredPickups.length > 0 && selectedPickups.length === pendingFilteredPickups.length;
  
  const handleSelectAllPickups = () => {
    if (allPickupsSelected) {
      setSelectedPickups([]);
    } else {
      setSelectedPickups(pendingFilteredPickups.map(p => p._id));
    }
  };



  return (
    <div className="space-y-6 animate-fadeIn">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Task Overview</h2>
          <p className="text-sm text-slate-500 mt-1">Manage your pending deliveries and pickups</p>
        </div>
        <div className="w-full sm:w-72">
          <SearchPanel 
            value={search} 
            onChange={setSearch} 
            placeholder="Search tracking, phone, vendor, etc..." 
          />
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-4 border-b-2 border-slate-100 mb-6 relative">
        <button 
          onClick={() => setActiveTab('deliveries')}
          className={`pb-3 px-2 text-base font-bold transition-colors relative ${activeTab === 'deliveries' ? 'text-brand-600' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Deliveries <span className="ml-1.5 inline-flex items-center justify-center px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs">{deliveries.length}</span>
          {activeTab === 'deliveries' && <div className="absolute bottom-[-2px] left-0 right-0 h-[3px] bg-brand-600 rounded-t-full"></div>}
        </button>
        <button 
          onClick={() => setActiveTab('pickups')}
          className={`pb-3 px-2 text-base font-bold transition-colors relative ${activeTab === 'pickups' ? 'text-brand-600' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Pickups <span className="ml-1.5 inline-flex items-center justify-center px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs">{pickups.length}</span>
          {activeTab === 'pickups' && <div className="absolute bottom-[-2px] left-0 right-0 h-[3px] bg-brand-600 rounded-t-full"></div>}
        </button>
      </div>

      {activeTab === 'deliveries' && (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-4">
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
            <div className="flex gap-2 overflow-x-auto pb-2 w-full md:w-auto hide-scrollbar">
              {['all', 'pending', 'active', 'completed', 'failed'].map(f => {
                const count = f === 'all' ? deliveries.length : deliveries.filter(d => 
                  f === 'pending' ? ['In Warehouse', 'Sorted', 'Postponed'].includes(d.status) :
                  f === 'active' ? ['Out for Delivery'].includes(d.status) :
                  f === 'completed' ? ['Delivered'].includes(d.status) :
                  ['Cancelled', 'Returned', 'Exchanged', 'Returned to Vendor'].includes(d.status)
                ).length;
                
                return (
                  <button 
                    key={f}
                    className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-bold transition-colors ${deliveryFilter === f ? 'bg-brand-600 text-white shadow-md' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                    onClick={() => setDeliveryFilter(f)}
                  >
                    <span className="capitalize">{f}</span> <span className={`ml-1 opacity-80 ${deliveryFilter === f ? 'text-brand-100' : 'text-slate-400'}`}>({count})</span>
                  </button>
                );
              })}
            </div>
            
            <div className="flex items-center gap-4 shrink-0">
              {activeFilteredDeliveries.length > 0 && (
                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-600 text-sm hover:text-slate-900 transition-colors">
                  <input type="checkbox" checked={allDeliveriesSelected} onChange={handleSelectAllDeliveries} className="w-5 h-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" />
                  Select All Active
                </label>
              )}
              {selectedDeliveries.length > 0 && (
                <button className="bg-emerald-600 hover:bg-emerald-700 text-white py-2 px-4 rounded-xl font-bold text-sm transition-colors shadow-sm flex items-center gap-2" onClick={handleBulkDelivery}>
                  <CheckCircle2 className="w-4 h-4" /> Mark {selectedDeliveries.length} Delivered
                </button>
              )}
            </div>
          </div>

          <div className="space-y-4">
            {loading ? <div className="flex justify-center items-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div></div>
            : filteredDeliveries.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-sm">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4"><Package className="w-8 h-8 text-slate-300" /></div>
                <h4 className="text-lg font-bold text-slate-800 mb-1">No deliveries found</h4>
                <p className="text-slate-500">Try changing the filter or check back later.</p>
              </div>
            )
            : filteredDeliveries.map(p => <TaskCard key={p._id} pkg={p} isPickup={false} selectedPickups={selectedPickups} selectedDeliveries={selectedDeliveries} toggleSelect={toggleSelect} toggleSelectDelivery={toggleSelectDelivery} openModal={openModal}/>)}
          </div>
        </div>
      )}

      {activeTab === 'pickups' && (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-4">
          {/* Filters & Bulk Action */}
          <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
            <div className="flex gap-2 overflow-x-auto pb-2 w-full md:w-auto hide-scrollbar">
              {['all', 'pending', 'completed'].map(f => {
                const count = f === 'all' ? pickups.length : pickups.filter(p => 
                  f === 'pending' ? p.status === 'Pick Up Requested' : p.status === 'Picked Up'
                ).length;
                
                return (
                  <button 
                    key={f}
                    className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-bold transition-colors ${pickupFilter === f ? 'bg-brand-600 text-white shadow-md' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                    onClick={() => setPickupFilter(f)}
                  >
                    <span className="capitalize">{f}</span> <span className={`ml-1 opacity-80 ${pickupFilter === f ? 'text-brand-100' : 'text-slate-400'}`}>({count})</span>
                  </button>
                );
              })}
            </div>
            
            <div className="flex items-center gap-4 shrink-0">
              {pendingFilteredPickups.length > 0 && (
                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-600 text-sm hover:text-slate-900 transition-colors">
                  <input type="checkbox" checked={allPickupsSelected} onChange={handleSelectAllPickups} className="w-5 h-5 rounded border-slate-300 text-brand-600 focus:ring-brand-500" />
                  Select All Pending
                </label>
              )}
              {selectedPickups.length > 0 && (
                <button className="bg-brand-600 hover:bg-brand-700 text-white py-2 px-4 rounded-xl font-bold text-sm transition-colors shadow-sm flex items-center gap-2" onClick={handleBulkPickup}>
                  <CheckCircle2 className="w-4 h-4" /> Confirm {selectedPickups.length} Pickups
                </button>
              )}
            </div>
          </div>

          <div className="space-y-4">
            {loading ? <div className="flex justify-center items-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div></div>
            : filteredPickups.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-sm">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4"><Truck className="w-8 h-8 text-slate-300" /></div>
                <h4 className="text-lg font-bold text-slate-800 mb-1">No pickups found</h4>
                <p className="text-slate-500">Try changing the filter or check back later.</p>
              </div>
            )
            : filteredPickups.map(p => <TaskCard key={p._id} pkg={p} isPickup={true} selectedPickups={selectedPickups} selectedDeliveries={selectedDeliveries} toggleSelect={toggleSelect} toggleSelectDelivery={toggleSelectDelivery} openModal={openModal}/>)}
          </div>
        </div>
      )}

      {/* Action Modal */}
      {actionModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn" onClick={()=>setActionModal({open:false,pkg:null,action:''})}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-scaleIn" onClick={e=>e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-bold text-slate-900 text-lg">{actionLabel[actionModal.action]}</h3>
              <button className="text-slate-400 hover:text-slate-600 transition-colors" onClick={()=>setActionModal({open:false,pkg:null,action:''})}><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6">
              <form onSubmit={submitAction} className="space-y-5">
                {actionModal.action === 'deliver' && (
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">COD Cash Collected (Rs.)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-medium">Rs.</span>
                      <input type="number" className="input-field pl-9" value={form.cashCollected} onChange={e=>setForm(f=>({...f,cashCollected:e.target.value}))}/>
                    </div>
                    <p className="text-xs text-slate-500 mt-1.5 font-medium">Expected: Rs. {actionModal.pkg?.amount}</p>
                  </div>
                )}
                {actionModal.action === 'postpone' && (
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Reschedule Date</label>
                    <input type="date" className="input-field" value={form.newDate} onChange={e=>setForm(f=>({...f,newDate:e.target.value}))}/>
                  </div>
                )}
                {actionModal.action === 'request_verification' ? (
                  <>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">Reason for Verification <span className="text-red-500">*</span></label>
                      <select 
                        className="input-field mb-3" 
                        value={form.verificationReason || ''} 
                        onChange={e => setForm(f => ({ ...f, verificationReason: e.target.value, comment: e.target.value === 'Other' ? '' : e.target.value }))}
                        required
                      >
                        <option value="" disabled>Select a reason...</option>
                        <option value="COD amount mismatch">COD amount mismatch</option>
                        <option value="Delivery charge correction">Delivery charge correction</option>
                        <option value="Wrong package status">Wrong package status</option>
                        <option value="Customer dispute">Customer dispute</option>
                        <option value="Exchange issue">Exchange issue</option>
                        <option value="Return issue">Return issue</option>
                        <option value="Damaged package">Damaged package</option>
                        <option value="Address correction">Address correction</option>
                        <option value="Receiver information correction">Receiver information correction</option>
                        <option value="Other">Other (please specify below)</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Target Package Status</label>
                        <select 
                          className="input-field" 
                          value={form.proposedStatus || actionModal.pkg.status}
                          onChange={e => setForm(f => ({ ...f, proposedStatus: e.target.value }))}
                        >
                          <option value="Delivered">Delivered</option>
                          <option value="Postponed">Postponed</option>
                          <option value="Cancelled">Cancelled</option>
                          <option value="Returned">Returned</option>
                          <option value="Exchanged">Exchanged</option>
                          <option value="Hold">Hold</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Actual COD Collected (Rs.)</label>
                        <input 
                          type="number" 
                          className="input-field" 
                          value={form.cashCollected} 
                          onChange={e => setForm(f => ({ ...f, cashCollected: e.target.value }))} 
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">Remarks / Details {form.verificationReason === 'Other' && <span className="text-red-500">*</span>}</label>
                      <textarea 
                        className="input-field min-h-[90px]" 
                        placeholder="Explain details for dispatcher verification..." 
                        value={form.comment} 
                        onChange={e => setForm(f => ({ ...f, comment: e.target.value }))} 
                        required={form.verificationReason === 'Other'}
                      />
                    </div>
                  </>
                ) : (
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Remarks / Reason {actionModal.action!=='deliver'&&<span className="text-red-500">*</span>}</label>
                    <textarea className="input-field min-h-[100px]" placeholder="Explain reason or add notes..." value={form.comment} onChange={e=>setForm(f=>({...f,comment:e.target.value}))} required={actionModal.action!=='deliver'}/>
                  </div>
                )}
                <div className="pt-2">
                  <button type="submit" className="btn-primary w-full py-3 text-base">Submit Update</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Performance & Wallet ────────────────────────────────────────────────
const CODWallet = () => {
  const [stats, setStats] = useState({});
  const [unreconciledPkgs, setUnreconciledPkgs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [handoverModal, setHandoverModal] = useState({
    open: false,
    cashAmount: '',
    onlineAmount: '',
    onlineReference: '',
    remarks: '',
  });
  const { showToast } = useToast();

  const fetchWallet = async () => {
    try {
      const [sumRes, delRes] = await Promise.all([
        api.get('/rider/summary'),
        api.get('/rider/deliveries?type=delivery')
      ]);
      setStats(sumRes.data.data || {});
      const pkgs = delRes.data.data || [];
      setUnreconciledPkgs(pkgs.filter(p => p.status === 'Delivered' && !p.cashReconciled));
    } catch (e) {
      console.error(e);
      showToast('Failed to load wallet data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWallet();
  }, []);

  const openHandoverModal = () => {
    const total = stats.totalCOD || 0;
    setHandoverModal({
      open: true,
      cashAmount: total > 0 ? String(total) : '0',
      onlineAmount: '0',
      onlineReference: '',
      remarks: '',
    });
  };

  const handleHandoverSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!unreconciledPkgs.length) return;

    const cash = Number(handoverModal.cashAmount) || 0;
    const online = Number(handoverModal.onlineAmount) || 0;
    const totalCOD = stats.totalCOD || 0;

    if (cash < 0 || online < 0) {
      return showToast('Handover amounts cannot be negative', 'error');
    }

    if (cash + online <= 0 && totalCOD > 0) {
      return showToast('Please enter a valid cash or online amount.', 'warning');
    }

    setSubmitting(true);
    try {
      await api.post('/rider/cod-handover', {
        packageIds: unreconciledPkgs.map(p => p._id),
        cashAmount: cash,
        onlineAmount: online,
        onlineReference: handoverModal.onlineReference,
        remarks: handoverModal.remarks,
      });
      showToast('COD Handover submitted successfully!', 'success');
      setHandoverModal({ open: false, cashAmount: '', onlineAmount: '', onlineReference: '', remarks: '' });
      fetchWallet();
    } catch (err) {
      showToast(err.response?.data?.message || err.message || 'Failed to submit handover', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div></div>;

  const target = stats.monthlyTarget || 0;
  const current = stats.deliveredThisMonth || 0;
  const progress = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;
  const enteredCash = Number(handoverModal.cashAmount) || 0;
  const enteredOnline = Number(handoverModal.onlineAmount) || 0;
  const enteredSum = enteredCash + enteredOnline;
  const targetTotal = stats.totalCOD || 0;
  const diff = enteredSum - targetTotal;
  
  return (
    <div className="space-y-6 animate-fadeIn">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Performance & Wallet</h2>
          <p className="text-sm text-slate-500 mt-1">Track your earnings, collections and handover deposits</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Wallet Primary Card */}
        <div className="lg:col-span-2 bg-gradient-to-br from-brand-600 to-indigo-700 rounded-3xl p-8 text-white shadow-lg relative overflow-hidden flex flex-col justify-between min-h-[240px]">
          {/* Decor */}
          <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl"></div>
          <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-32 h-32 bg-black opacity-10 rounded-full blur-2xl"></div>
          
          <div className="relative z-10 flex justify-between items-start">
            <div>
              <p className="text-brand-100 font-bold uppercase tracking-widest text-xs mb-1">Net COD to Handover</p>
              <h3 className="text-4xl sm:text-5xl font-black tracking-tight mt-2">Rs. {(stats.totalCOD || 0).toLocaleString()}</h3>
              {stats.totalExpenses > 0 && (
                <div className="mt-2 inline-flex items-center gap-2 bg-black/20 px-3 py-1 rounded-lg text-xs text-brand-100 font-medium border border-white/10">
                  <span>Gross COD: <strong>Rs. {(stats.grossCOD || 0).toLocaleString()}</strong></span>
                  <span>•</span>
                  <span>Expenses: <strong className="text-amber-300">- Rs. {(stats.totalExpenses || 0).toLocaleString()}</strong></span>
                </div>
              )}
            </div>
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm shadow-inner">
              <Wallet className="w-6 h-6 text-white" />
            </div>
          </div>
          
          <div className="relative z-10 mt-8 bg-black/20 rounded-2xl p-4 backdrop-blur-sm border border-white/10 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-xs text-brand-50 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0"/> 
              Net COD = Delivered Cash/Online collected minus approved daily expenses.
            </p>
            {unreconciledPkgs.length > 0 && (
              <button 
                onClick={openHandoverModal}
                disabled={submitting}
                className="whitespace-nowrap px-5 py-2.5 bg-white text-brand-700 hover:bg-brand-50 rounded-xl text-sm font-bold shadow-md transition-all active:scale-[0.98] disabled:opacity-50 flex items-center gap-2"
              >
                <Banknote className="w-4 h-4" />
                Handover COD (Rs. {(stats.totalCOD || 0).toLocaleString()})
              </button>
            )}
          </div>
        </div>

        {/* Target Card */}
        <div className="card-premium p-6 flex flex-col justify-center">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="font-bold text-slate-900 text-lg">Monthly Target</h3>
              <p className="text-sm text-slate-500 mt-1">Deliveries this month</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center text-brand-600">
              <Target className="w-5 h-5" />
            </div>
          </div>
          
          {target > 0 ? (
            <div>
              <div className="flex justify-between items-end mb-2">
                <div className="text-3xl font-black text-slate-900">{current}</div>
                <div className="text-sm font-bold text-slate-500 mb-1">/ {target}</div>
              </div>
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden mb-3">
                <div className={`h-full rounded-full transition-all duration-1000 ${progress >= 100 ? 'bg-emerald-500' : 'bg-brand-500'}`} style={{width: `${progress}%`}}></div>
              </div>
              <p className="text-xs font-medium text-slate-500">
                {progress >= 100 ? (
                  <span className="text-emerald-600 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5"/> Target reached! Awesome job.</span>
                ) : (
                  <span>You are {progress}% of the way there!</span>
                )}
              </p>
            </div>
          ) : (
            <div className="text-center py-4 bg-slate-50 rounded-xl border border-slate-100">
              <p className="text-sm text-slate-500 font-medium">No target set for this month.</p>
            </div>
          )}
        </div>
      </div>

      <h3 className="text-lg font-bold text-slate-900 mt-4 mb-2">Shift Summary</h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <MetricCard title="Delivered" value={stats.delivered??0} color="success" icon={<CheckCircle2 className="w-6 h-6 text-emerald-600" />} />
        <MetricCard title="Postponed" value={stats.postponed??0} color="warning" icon={<Clock className="w-6 h-6 text-amber-600" />} />
        <MetricCard title="Cancelled" value={stats.cancelled??0} color="danger" icon={<XCircle className="w-6 h-6 text-red-600" />} />
      </div>

      {/* ─── COD Handover Breakdown Modal ────────────────────────────────────── */}
      {handoverModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setHandoverModal(prev => ({ ...prev, open: false }))}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
                <Coins className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">COD Handover Deposit</h3>
                <p className="text-xs text-slate-500">Specify physical cash vs online collections</p>
              </div>
            </div>

            {/* Handover Summary Banner */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-5 space-y-2 text-sm">
              <div className="flex justify-between items-center text-slate-600">
                <span>Gross COD ({unreconciledPkgs.length} packages):</span>
                <span className="font-semibold text-slate-900">Rs. {(stats.grossCOD || 0).toLocaleString()}</span>
              </div>
              {stats.totalExpenses > 0 && (
                <div className="flex justify-between items-center text-amber-700">
                  <span>Deducted Expenses:</span>
                  <span className="font-semibold">- Rs. {(stats.totalExpenses || 0).toLocaleString()}</span>
                </div>
              )}
              <div className="pt-2 border-t border-slate-200 flex justify-between items-center font-bold text-slate-900 text-base">
                <span>Net Total Expected:</span>
                <span className="text-brand-700">Rs. {targetTotal.toLocaleString()}</span>
              </div>
            </div>

            <form onSubmit={handleHandoverSubmit} className="space-y-4">
              {/* Preset Quick Buttons */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Quick Split:</span>
                <button
                  type="button"
                  onClick={() => setHandoverModal(prev => ({ ...prev, cashAmount: String(targetTotal), onlineAmount: '0' }))}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition-colors"
                >
                  💵 100% Cash
                </button>
                <button
                  type="button"
                  onClick={() => setHandoverModal(prev => ({ ...prev, cashAmount: '0', onlineAmount: String(targetTotal) }))}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition-colors"
                >
                  📱 100% Online
                </button>
              </div>

              {/* Cash Amount Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <Banknote className="w-4 h-4 text-emerald-600" />
                  Physical Cash Amount (Rs.)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">Rs.</span>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={handoverModal.cashAmount}
                    onChange={e => {
                      const val = e.target.value;
                      setHandoverModal(prev => {
                        const num = Number(val) || 0;
                        const autoOnline = Math.max(0, targetTotal - num);
                        return { ...prev, cashAmount: val, onlineAmount: String(autoOnline) };
                      });
                    }}
                    placeholder="0"
                    className="input-field pl-11 font-bold text-slate-900"
                    required
                  />
                </div>
              </div>

              {/* Online Amount Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <QrCode className="w-4 h-4 text-sky-600" />
                  Online / Digital Payment Amount (Rs.)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">Rs.</span>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={handoverModal.onlineAmount}
                    onChange={e => {
                      const val = e.target.value;
                      setHandoverModal(prev => {
                        const num = Number(val) || 0;
                        const autoCash = Math.max(0, targetTotal - num);
                        return { ...prev, onlineAmount: val, cashAmount: String(autoCash) };
                      });
                    }}
                    placeholder="0"
                    className="input-field pl-11 font-bold text-slate-900"
                  />
                </div>
              </div>

              {/* Online Transaction Reference */}
              {enteredOnline > 0 && (
                <div className="animate-fadeIn">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Online Transaction Ref / Notes (Optional)
                  </label>
                  <input
                    type="text"
                    value={handoverModal.onlineReference}
                    onChange={e => setHandoverModal(prev => ({ ...prev, onlineReference: e.target.value }))}
                    placeholder="e.g. Fonepay ID, eSewa ref, Bank Txn #..."
                    className="input-field text-xs"
                  />
                </div>
              )}

              {/* Remarks */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Additional Notes (Optional)
                </label>
                <textarea
                  rows="2"
                  value={handoverModal.remarks}
                  onChange={e => setHandoverModal(prev => ({ ...prev, remarks: e.target.value }))}
                  placeholder="Any notes for the dispatcher..."
                  className="input-field text-xs resize-none"
                />
              </div>

              {/* Breakdown Balance Status */}
              <div className={`p-3 rounded-xl border text-xs font-medium flex items-center justify-between ${
                diff === 0 
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                  : 'bg-amber-50 border-amber-200 text-amber-800'
              }`}>
                <span>Total Handover (Cash + Online):</span>
                <span className="font-bold">Rs. {enteredSum.toLocaleString()} {diff !== 0 && `(Diff: Rs. ${diff > 0 ? `+${diff}` : diff})`}</span>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setHandoverModal(prev => ({ ...prev, open: false }))}
                  className="btn-secondary flex-1 py-2.5 text-sm"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary flex-1 py-2.5 text-sm flex items-center justify-center gap-2"
                >
                  {submitting ? 'Submitting...' : 'Submit Handover'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Expense Log ─────────────────────────────────────────────────────────
const ExpenseLog = () => {
  const [form, setForm] = useState({category:'',amount:'',description:''});
  const [summary, setSummary] = useState({daily:{total:0},weekly:{total:0},monthly:{total:0},allowance:{dailyAllowance:500}});
  const { showToast } = useToast();

  const fetchSummary = () => {
    api.get('/expenses/summary').then(r=>setSummary(r.data.data||{})).catch(console.error);
  };

  useEffect(() => { fetchSummary(); }, []);

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      await api.post('/expenses',{...form,amount:Number(form.amount)});
      showToast('Expense logged!','success');
      setForm({category:'',amount:'',description:''});
      fetchSummary();
    } catch(err) { showToast(err.message||'Failed to log expense','error'); }
  };

  const dailyRemaining = (summary.allowance?.dailyAllowance||500) - (summary.daily?.total||0);

  return (
    <div className="space-y-6 animate-fadeIn">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Expense Management</h2>
          <p className="text-sm text-slate-500 mt-1">Log your daily expenses and track allowances</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Form */}
        <div className="card-premium lg:col-span-1 h-fit">
          <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50">
            <h3 className="font-bold text-slate-900 text-lg">Log New Expense</h3>
          </div>
          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Category <span className="text-red-500">*</span></label>
                <select className="input-field" value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))} required>
                  <option value="">Select category...</option>
                  <option value="fuel">🛢️ Fuel</option>
                  <option value="food">🍱 Food</option>
                  <option value="misc">📦 Miscellaneous</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Amount (Rs.) <span className="text-red-500">*</span></label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-medium">Rs.</span>
                  <input type="number" className="input-field pl-9" placeholder="0.00" min="1" value={form.amount} onChange={e=>setForm(f=>({...f,amount:e.target.value}))} required/>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Description (Optional)</label>
                <input type="text" className="input-field" placeholder="e.g. Petrol refill at Kalanki" value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))}/>
              </div>
              <button type="submit" className="btn-primary w-full py-3 mt-2 flex items-center justify-center gap-2">
                <FileText className="w-4 h-4" /> Add Expense
              </button>
            </form>
          </div>
        </div>

        {/* Summary Dashboard */}
        <div className="card-premium lg:col-span-2">
          <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50">
            <h3 className="font-bold text-slate-900 text-lg">Expense Summary</h3>
          </div>
          <div className="p-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Daily Allowance Block */}
              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
                <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Daily Allowance</p>
                <h4 className="text-3xl font-black text-slate-900">Rs. {summary.allowance?.dailyAllowance||500}</h4>
                <div className="mt-4 w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-500 ${dailyRemaining < 0 ? 'bg-red-500' : 'bg-brand-500'}`} style={{width: `${Math.min(100, ((summary.daily?.total||0)/(summary.allowance?.dailyAllowance||500))*100)}%`}}></div>
                </div>
              </div>
              
              {/* Remaining Block */}
              <div className={`rounded-2xl p-6 border ${dailyRemaining < 0 ? 'bg-red-50 border-red-200' : 'bg-emerald-50 border-emerald-200'}`}>
                <p className={`text-sm font-bold uppercase tracking-wider mb-2 ${dailyRemaining < 0 ? 'text-red-500' : 'text-emerald-600'}`}>Remaining Today</p>
                <h4 className={`text-3xl font-black ${dailyRemaining < 0 ? 'text-red-600' : 'text-emerald-700'}`}>Rs. {dailyRemaining}</h4>
                <p className={`text-sm font-medium mt-2 ${dailyRemaining < 0 ? 'text-red-500' : 'text-emerald-600/80'}`}>
                  {dailyRemaining < 0 ? 'You have exceeded your daily limit.' : 'Available to spend today.'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 border-t border-slate-100 pt-6">
              <div className="text-center">
                <p className="text-sm font-medium text-slate-500 mb-1">Spent Today</p>
                <p className="text-xl font-bold text-slate-900">Rs. {summary.daily?.total||0}</p>
              </div>
              <div className="text-center border-l border-r border-slate-100">
                <p className="text-sm font-medium text-slate-500 mb-1">This Week</p>
                <p className="text-xl font-bold text-slate-900">Rs. {summary.weekly?.total||0}</p>
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-slate-500 mb-1">This Month</p>
                <p className="text-xl font-bold text-slate-900">Rs. {summary.monthly?.total||0}</p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Expense History ─────────────────────────────────────────────────────
const ExpenseHistory = () => {
  const [expenses, setExpenses] = useState([]);
  const [period, setPeriod] = useState('monthly');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    setLoading(true);
    api.get(`/expenses/history?period=${period}`)
      .then(r => setExpenses(r.data.data || []))
      .catch(() => showToast('Failed to load history', 'error'))
      .finally(() => setLoading(false));
  }, [period, showToast]);

  const catEmoji = { fuel: '🛢️', food: '🍱', misc: '📦' };

  const filteredExpenses = expenses.filter(e => {
    if (!search.trim()) return true;
    const s = search.toLowerCase();
    const cat = (e.category || '').toLowerCase();
    const desc = (e.description || '').toLowerCase();
    const amt = String(e.amount || '');
    const dt = new Date(e.date).toLocaleDateString().toLowerCase();
    return cat.includes(s) || desc.includes(s) || amt.includes(s) || dt.includes(s);
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="card-premium overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50/50">
          <div>
            <h3 className="font-bold text-slate-900 text-lg">Expense History</h3>
            <p className="text-sm text-slate-500 mt-1">View and search all your logged expenses</p>
          </div>
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <div className="w-full sm:w-64">
              <SearchPanel 
                value={search} 
                onChange={setSearch} 
                placeholder="Search category, notes, amount..." 
              />
            </div>
            <select className="input-field w-full sm:w-auto text-sm py-2" value={period} onChange={e => setPeriod(e.target.value)}>
              <option value="daily">Today</option>
              <option value="weekly">This Week</option>
              <option value="monthly">This Month</option>
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-xs">
              <tr>
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3">Category</th>
                <th className="px-6 py-3">Amount</th>
                <th className="px-6 py-3">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {loading ? <tr><td colSpan="4" className="px-6 py-12 text-center text-slate-500"><div className="flex justify-center items-center"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-600 mr-2"></div>Loading...</div></td></tr>
              : filteredExpenses.length === 0 ? <tr><td colSpan="4" className="px-6 py-12 text-center text-slate-500">No expenses found matching your search.</td></tr>
              : filteredExpenses.map(e => (
                <tr key={e._id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 text-slate-500 font-medium">{new Date(e.date).toLocaleDateString()}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200 capitalize shadow-sm">
                      <span className="mr-1.5">{catEmoji[e.category] || ''}</span> {e.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-bold text-brand-600">Rs. {e.amount}</td>
                  <td className="px-6 py-4 text-slate-600">{e.description || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ─── Rider Dashboard Shell ───────────────────────────────────────────────
const RiderDashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await api.get('/rider/deliveries?type=all');
        const pkgs = res.data.data || [];
        
        const notifs = pkgs
          .filter(p => ['Pick Up Requested', 'Out for Delivery'].includes(p.status))
          .map(p => ({
            id: p._id,
            title: p.status === 'Pick Up Requested' ? 'New Pickup Assigned' : 'New Delivery Assigned',
            message: p.status === 'Pick Up Requested' 
              ? `Collect package from ${(p.vendorId?.vendorMeta?.shopName || p.vendorId?.name) || 'Vendor'}`
              : `Deliver ${p.trackingCode} to ${p.customerName}`,
            time: new Date(p.updatedAt || p.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            read: false,
            icon: p.status === 'Pick Up Requested' ? '🚚' : '📦',
            path: '/rider/deliveries'
          }));
          
        setNotifications(notifs);
      } catch (e) {
        console.error('Failed to fetch notifications', e);
      }
    };
    
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);

    const handleNewNotif = (e) => {
      if (e.detail) {
        setNotifications(prev => [e.detail, ...prev]);
      }
    };
    window.addEventListener('app_notification', handleNewNotif);

    return () => {
      clearInterval(interval);
      window.removeEventListener('app_notification', handleNewNotif);
    };
  }, []);

  const handleNotificationClick = (n) => {
    if (n.path) navigate(n.path);
  };

  const title = Object.entries(titleMap).sort((a,b)=>b[0].length-a[0].length).find(([p])=>location.pathname.startsWith(p))?.[1] || 'Rider';

  return (
    <AppShell 
      navLinks={navLinks} 
      currentTitle={title} 
      roleBadge="Rider Portal"
      notifications={notifications}
      onNotificationClick={handleNotificationClick}
    >
      <Routes>
        <Route path="/" element={<Navigate to="/rider/deliveries" replace />} />
        <Route path="/deliveries" element={<MyDeliveries />} />
        <Route path="/wallet" element={<CODWallet />} />
        <Route path="/expenses" element={<ExpenseLog />} />
        <Route path="/expense-history" element={<ExpenseHistory />} />
      </Routes>
    </AppShell>
  );
};

export default RiderDashboard;
