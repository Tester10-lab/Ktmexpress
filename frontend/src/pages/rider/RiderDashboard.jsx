import React, { useState, useEffect } from 'react';
import { Routes, Route, useLocation, useNavigate, Navigate } from 'react-router-dom';
import AppShell from '../../layouts/AppShell';
import MetricCard from '../../components/MetricCard';
import ScanStation from '../../components/ScanStation';
import api from '../../api/axios';
import { useToast } from '../../store/ToastContext';

const navLinks = [
  { name: 'My Deliveries', path: '/rider/deliveries', icon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg> },
  { name: 'COD Wallet', path: '/rider/wallet', icon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4z"/></svg> },
  { name: 'Log Expense', path: '/rider/expenses', icon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg> },
  { name: 'Expense History', path: '/rider/expense-history', icon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> },
];

const titleMap = {
  '/rider/deliveries': 'My Deliveries & Pickups',
  '/rider/wallet': 'COD Wallet',
  '/rider/expenses': 'Log Expense',
  '/rider/expense-history': 'Expense History',
};

function statusBadge(status) {
  const m = { 'Delivered':'badge-success','Cancelled':'badge-danger','Returned':'badge-info','Postponed':'badge-warning','Out for Delivery':'badge-primary','Pick Up Requested':'badge-warning','Picked Up':'badge-primary' };
  return <span className={`badge ${m[status]||'badge-secondary'}`}>{status}</span>;
}

// ─── My Deliveries ────────────────────────────────────────────────────────
const MyDeliveries = () => {
  const [deliveries, setDeliveries] = useState([]);
  const [pickups, setPickups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionModal, setActionModal] = useState({open:false,pkg:null,action:''});
  const [form, setForm] = useState({comment:'',cashCollected:'',newDate:''});
  const [selectedPickups, setSelectedPickups] = useState([]);
  const [selectedDeliveries, setSelectedDeliveries] = useState([]);
  
  // UI State for Filters
  const [activeTab, setActiveTab] = useState('deliveries'); // 'deliveries' or 'pickups'
  const [deliveryFilter, setDeliveryFilter] = useState('all'); // 'all', 'pending', 'active', 'completed', 'failed'
  const [pickupFilter, setPickupFilter] = useState('pending'); // 'all', 'pending', 'completed'
  
  const { showToast } = useToast();

  const fetchAll = async () => {
    setLoading(true);
    try {
      // Fetch all deliveries and pickups
      const [d, p] = await Promise.all([
        api.get('/rider/deliveries?type=delivery'), 
        api.get('/rider/deliveries?type=pickup')
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
  };

  useEffect(() => { fetchAll(); }, []);

  const openModal = (pkg, action) => { 
    setActionModal({open:true,pkg,action}); 
    setForm({comment:'',cashCollected:pkg.amount,newDate:''}); 
  };

  const submitAction = async e => {
    e.preventDefault();
    try {
      await api.put('/rider/update-status',{packageId:actionModal.pkg._id,action:actionModal.action,comment:form.comment,cashCollected:Number(form.cashCollected),newDate:form.newDate});
      showToast('Status updated!','success');
      setActionModal({open:false,pkg:null,action:''});
      fetchAll();
    } catch(err) { showToast(err.response?.data?.message||'Failed','error'); }
  };

  const handleBulkPickup = async () => {
    if (!selectedPickups.length) return;
    try {
      await api.put('/rider/bulk-pickup', { packageIds: selectedPickups });
      showToast(`${selectedPickups.length} pickups confirmed!`, 'success');
      fetchAll();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to confirm bulk pickup', 'error');
    }
  };

  const toggleSelect = (id) => {
    setSelectedPickups(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleSelectDelivery = (id) => {
    setSelectedDeliveries(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

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
      fetchAll();
    } catch (err) {
      showToast('Some deliveries failed to update', 'error');
      fetchAll();
    }
  };

  const actionLabel = { deliver:'Mark Delivered',postpone:'Postpone',cancel:'Cancel',return:'Mark Return',pickup_complete:'Confirm Pickup' };

  // Filtering Logic
  const filteredDeliveries = deliveries.filter(d => {
    if (deliveryFilter === 'pending') return ['In Warehouse', 'Sorted', 'Postponed'].includes(d.status);
    if (deliveryFilter === 'active') return ['Out for Delivery'].includes(d.status);
    if (deliveryFilter === 'completed') return ['Delivered'].includes(d.status);
    if (deliveryFilter === 'failed') return ['Cancelled', 'Returned', 'Returned to Vendor'].includes(d.status);
    return true; // 'all'
  });

  const filteredPickups = pickups.filter(p => {
    if (pickupFilter === 'pending') return p.status === 'Pick Up Requested';
    if (pickupFilter === 'completed') return p.status === 'Picked Up';
    return true; // 'all'
  });

  const TaskCard = ({ pkg, isPickup }) => {
    const isPendingPickup = isPickup && pkg.status === 'Pick Up Requested';
    const isActiveDelivery = !isPickup && ['Out for Delivery'].includes(pkg.status);

    return (
      <div className="rider-task-card" style={{ display: 'flex', gap: 12, alignItems: 'center', opacity: (!isPendingPickup && !isActiveDelivery) ? 0.8 : 1, transition: 'all 0.3s ease' }}>
        {isPendingPickup && (
          <input 
            type="checkbox" 
            checked={selectedPickups.includes(pkg._id)} 
            onChange={() => toggleSelect(pkg._id)} 
            style={{ width: 22, height: 22, accentColor: 'var(--color-primary)', cursor: 'pointer' }} 
          />
        )}
        {isActiveDelivery && (
          <input 
            type="checkbox" 
            checked={selectedDeliveries.includes(pkg._id)} 
            onChange={() => toggleSelectDelivery(pkg._id)} 
            style={{ width: 22, height: 22, accentColor: 'var(--color-success)', cursor: 'pointer' }} 
          />
        )}
        <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div className="task-info">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <h4 style={{ margin: 0, fontWeight: 700 }}>{pkg.trackingCode}</h4>
              <span style={{ fontSize: '12px', padding: '3px 8px', background: 'var(--color-primary-soft)', color: 'var(--color-primary)', borderRadius: 6, fontWeight: 600 }}>
                🏢 {pkg.vendorId?.vendorMeta?.shopName || pkg.vendorId?.name || 'Vendor'}
              </span>
              {statusBadge(pkg.status)}
            </div>
            <div style={{ fontSize: 'var(--font-size-sm)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 8 }}>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)', display:'flex', alignItems:'center', gap:6 }}>
                👤 {pkg.customerName}
              </div>
              <div style={{ color: 'var(--text-secondary)', display:'flex', alignItems:'center', gap:6 }}>
                📞 {pkg.customerPhone || 'No Phone'}
              </div>
              <div style={{ color: 'var(--text-secondary)', display:'flex', alignItems:'center', gap:6, gridColumn: '1 / -1' }}>
                📍 {pkg.city ? `${pkg.city}, ` : ''}{pkg.address}
              </div>
            </div>
            <div style={{marginTop:12, fontSize:'14px', fontWeight:700}}>
              To Collect: <span style={{ color: 'var(--color-primary)' }}>Rs. {pkg.amount}</span>
            </div>
          </div>
          
          <div className="task-actions" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {isPendingPickup && (
              <button className="btn btn-success btn-sm btn-mobile-icon" onClick={()=>openModal(pkg,'pickup_complete')} style={{fontWeight:600}} title="Confirm Pickup">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
                <span className="btn-text">Confirm Pickup</span>
              </button>
            )}
            {isActiveDelivery && (
              <>
                <button className="btn btn-success btn-sm btn-mobile-icon" onClick={()=>openModal(pkg,'deliver')} style={{fontWeight:600}} title="Delivered">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                  <span className="btn-text">Delivered</span>
                </button>
                <button className="btn btn-warning btn-sm btn-mobile-icon" onClick={()=>openModal(pkg,'postpone')} style={{fontWeight:600}} title="Postpone">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  <span className="btn-text">Postpone</span>
                </button>
                <button className="btn btn-danger btn-sm btn-mobile-icon" onClick={()=>openModal(pkg,'cancel')} style={{fontWeight:600}} title="Cancel">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  <span className="btn-text">Cancel</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{display:'flex',flexDirection:'column',gap:24}}>
      
      {/* Tab Navigation */}
      <div style={{ display: 'flex', gap: 16, borderBottom: '2px solid var(--border-color)', marginBottom: 8 }}>
        <button 
          onClick={() => setActiveTab('deliveries')}
          style={{
            background: 'none', border: 'none', padding: '12px 16px', fontSize: '16px', fontWeight: 600, cursor: 'pointer',
            color: activeTab === 'deliveries' ? 'var(--color-primary)' : 'var(--text-secondary)',
            borderBottom: activeTab === 'deliveries' ? '3px solid var(--color-primary)' : '3px solid transparent',
            marginBottom: '-2px', transition: 'all 0.2s'
          }}
        >
          Deliveries ({deliveries.length})
        </button>
        <button 
          onClick={() => setActiveTab('pickups')}
          style={{
            background: 'none', border: 'none', padding: '12px 16px', fontSize: '16px', fontWeight: 600, cursor: 'pointer',
            color: activeTab === 'pickups' ? 'var(--color-primary)' : 'var(--text-secondary)',
            borderBottom: activeTab === 'pickups' ? '3px solid var(--color-primary)' : '3px solid transparent',
            marginBottom: '-2px', transition: 'all 0.2s'
          }}
        >
          Pickups ({pickups.length})
        </button>
      </div>

      {activeTab === 'deliveries' && (
        <div className="tab-pane animate-fade-in">
          {/* Filters */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 20, overflowX: 'auto', paddingBottom: 4 }}>
            {['all', 'pending', 'active', 'completed', 'failed'].map(f => {
              const count = f === 'all' ? deliveries.length : deliveries.filter(d => 
                f === 'pending' ? ['In Warehouse', 'Sorted', 'Postponed'].includes(d.status) :
                f === 'active' ? ['Out for Delivery'].includes(d.status) :
                f === 'completed' ? ['Delivered'].includes(d.status) :
                ['Cancelled', 'Returned', 'Returned to Vendor'].includes(d.status)
              ).length;
              
              return (
                <button 
                  key={f}
                  className={`btn btn-sm ${deliveryFilter === f ? 'btn-primary' : 'btn-outline'}`}
                  style={{ borderRadius: 20, textTransform: 'capitalize', fontWeight: 600 }}
                  onClick={() => setDeliveryFilter(f)}
                >
                  {f} ({count})
                </button>
              );
            })}
            
            {selectedDeliveries.length > 0 && (
              <button className="btn btn-success" onClick={handleBulkDelivery} style={{fontWeight: 700, marginLeft: 'auto'}}>
                Mark {selectedDeliveries.length} Delivered
              </button>
            )}
          </div>

          <div style={{display:'flex',flexDirection:'column',gap:12}}>
            {loading ? <p style={{color:'var(--text-muted)'}}>Loading...</p>
            : filteredDeliveries.length === 0 ? (
              <div className="empty-state" style={{padding:40, background: 'var(--surface-color)', borderRadius: 12, border: '1px solid var(--border-color)'}}>
                <div style={{fontSize:40, marginBottom:16}}>📦</div>
                <h4>No deliveries found</h4>
                <p style={{color:'var(--text-muted)'}}>Try changing the filter or check back later.</p>
              </div>
            )
            : filteredDeliveries.map(p => <TaskCard key={p._id} pkg={p} isPickup={false}/>)}
          </div>
        </div>
      )}

      {activeTab === 'pickups' && (
        <div className="tab-pane animate-fade-in">
          {/* Filters & Bulk Action */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
              {['all', 'pending', 'completed'].map(f => {
                const count = f === 'all' ? pickups.length : pickups.filter(p => 
                  f === 'pending' ? p.status === 'Pick Up Requested' : p.status === 'Picked Up'
                ).length;
                
                return (
                  <button 
                    key={f}
                    className={`btn btn-sm ${pickupFilter === f ? 'btn-primary' : 'btn-outline'}`}
                    style={{ borderRadius: 20, textTransform: 'capitalize', fontWeight: 600 }}
                    onClick={() => setPickupFilter(f)}
                  >
                    {f} ({count})
                  </button>
                );
              })}
            </div>
            
            {selectedPickups.length > 0 && (
              <button className="btn btn-primary" onClick={handleBulkPickup} style={{fontWeight: 700}}>
                Confirm {selectedPickups.length} Pickups
              </button>
            )}
          </div>

          <div style={{display:'flex',flexDirection:'column',gap:12}}>
            {loading ? <p style={{color:'var(--text-muted)'}}>Loading...</p>
            : filteredPickups.length === 0 ? (
              <div className="empty-state" style={{padding:40, background: 'var(--surface-color)', borderRadius: 12, border: '1px solid var(--border-color)'}}>
                <div style={{fontSize:40, marginBottom:16}}>🚚</div>
                <h4>No pickups found</h4>
                <p style={{color:'var(--text-muted)'}}>Try changing the filter or check back later.</p>
              </div>
            )
            : filteredPickups.map(p => <TaskCard key={p._id} pkg={p} isPickup={true}/>)}
          </div>
        </div>
      )}

      {/* Action Modal */}
      {actionModal.open && (
        <div className="modal-backdrop" onClick={()=>setActionModal({open:false,pkg:null,action:''})}>
          <div className="modal-content" onClick={e=>e.stopPropagation()}>
            <div className="modal-header">
              <h3>{actionLabel[actionModal.action]}</h3>
              <button className="modal-close" onClick={()=>setActionModal({open:false,pkg:null,action:''})}>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className="modal-body">
              <form onSubmit={submitAction}>
                {actionModal.action === 'deliver' && (
                  <div className="form-group">
                    <label>COD Cash Collected (Rs.)</label>
                    <div style={{position: 'relative'}}>
                      <span style={{position:'absolute', left:12, top:10, color:'var(--text-muted)'}}>Rs.</span>
                      <input type="number" className="form-control" style={{paddingLeft: 36}} value={form.cashCollected} onChange={e=>setForm(f=>({...f,cashCollected:e.target.value}))}/>
                    </div>
                    <p style={{fontSize:'var(--font-size-xs)',color:'var(--text-muted)',marginTop:6}}>Expected: Rs. {actionModal.pkg?.amount}</p>
                  </div>
                )}
                {actionModal.action === 'postpone' && (
                  <div className="form-group"><label>Reschedule Date</label><input type="date" className="form-control" value={form.newDate} onChange={e=>setForm(f=>({...f,newDate:e.target.value}))}/></div>
                )}
                <div className="form-group"><label>Remarks / Reason {actionModal.action!=='deliver'&&'*'}</label><textarea className="form-control" rows="3" placeholder="Explain reason..." value={form.comment} onChange={e=>setForm(f=>({...f,comment:e.target.value}))} required={actionModal.action!=='deliver'}/></div>
                <button type="submit" className="btn btn-primary btn-block" style={{marginTop: 16, padding: 12, fontSize: '16px'}}>Submit Update</button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── COD Wallet ──────────────────────────────────────────────────────────
const CODWallet = () => {
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/rider/summary').then(r=>setStats(r.data.data||{})).catch(console.error).finally(()=>setLoading(false));
  }, []);

  if (loading) return <div className="empty-state"><p>Loading...</p></div>;

  return (
    <div className="rider-wallet-card">
      <div style={{marginBottom:16}}>
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{color:'var(--color-primary)',margin:'0 auto',display:'block'}}><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4z"/></svg>
      </div>
      <h2>Cash COD Wallet</h2>
      <div className="wallet-amount">Rs. {stats.totalCOD??0}</div>
      <p className="wallet-subtext">Total Cash-On-Delivery collected. Must be turned in at the hub.</p>
      <hr className="my-4"/>
      <h3>Shift Summary</h3>
      <div className="wallet-summary-grid">
        <div className="sum-item"><span>Delivered</span><strong>{stats.delivered??0}</strong></div>
        <div className="sum-item"><span>Postponed</span><strong>{stats.postponed??0}</strong></div>
        <div className="sum-item"><span>Cancelled</span><strong>{stats.cancelled??0}</strong></div>
      </div>
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
    } catch(err) { showToast(err.response?.data?.message||'Failed to log expense','error'); }
  };

  const dailyRemaining = (summary.allowance?.dailyAllowance||500) - (summary.daily?.total||0);

  return (
    <div className="dashboard-section-grid">
      <div className="card">
        <div className="card-header border-b"><h3>Log Expense</h3></div>
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Category</label>
              <select className="form-select" value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))} required>
                <option value="">Select category...</option>
                <option value="fuel">🛢️ Fuel</option>
                <option value="food">🍱 Food</option>
                <option value="misc">📦 Miscellaneous</option>
              </select>
            </div>
            <div className="form-group"><label>Amount (Rs.)</label><input type="number" className="form-control" placeholder="Enter amount" min="1" value={form.amount} onChange={e=>setForm(f=>({...f,amount:e.target.value}))} required/></div>
            <div className="form-group"><label>Description (Optional)</label><input type="text" className="form-control" placeholder="e.g. Petrol refill" value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))}/></div>
            <button type="submit" className="btn btn-primary btn-block">Add Expense</button>
          </form>
        </div>
      </div>

      <div className="card col-span-2">
        <div className="card-header border-b"><h3>Expense Summary</h3></div>
        <div className="card-body">
          <div className="expense-card-grid">
            <div className="expense-summary-card"><p className="amount">Rs. {summary.daily?.total||0}</p><p className="label">Today</p></div>
            <div className="expense-summary-card"><p className="amount">Rs. {summary.weekly?.total||0}</p><p className="label">This Week</p></div>
            <div className="expense-summary-card"><p className="amount">Rs. {summary.monthly?.total||0}</p><p className="label">This Month</p></div>
            <div className="expense-summary-card"><p className="amount text-success">Rs. {summary.allowance?.dailyAllowance||500}</p><p className="label">Daily Limit</p></div>
            <div className="expense-summary-card"><p className={`amount ${dailyRemaining<0?'text-danger':'text-primary-color'}`}>Rs. {dailyRemaining}</p><p className="label">Remaining Today</p></div>
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
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    setLoading(true);
    api.get(`/expenses/history?period=${period}`).then(r=>setExpenses(r.data.data||[])).catch(()=>showToast('Failed to load history','error')).finally(()=>setLoading(false));
  }, [period]);

  const catEmoji = { fuel:'🛢️', food:'🍱', misc:'📦' };

  return (
    <div className="card p-0">
      <div className="card-header border-b" style={{padding:20}}>
        <div className="header-title-group"><h3>Expense History</h3><p>View all logged expenses</p></div>
        <select className="form-select select-sm" style={{width:140}} value={period} onChange={e=>setPeriod(e.target.value)}>
          <option value="daily">Today</option>
          <option value="weekly">This Week</option>
          <option value="monthly">This Month</option>
        </select>
      </div>
      <div className="table-container">
        <table className="data-table">
          <thead><tr><th>Date</th><th>Category</th><th>Amount</th><th>Description</th></tr></thead>
          <tbody>
            {loading ? <tr><td colSpan="4" style={{textAlign:'center',padding:40,color:'var(--text-muted)'}}>Loading...</td></tr>
            : expenses.length===0 ? <tr><td colSpan="4" style={{textAlign:'center',padding:40,color:'var(--text-muted)'}}>No expenses found.</td></tr>
            : expenses.map(e=>(
              <tr key={e._id}>
                <td style={{color:'var(--text-muted)'}}>{new Date(e.date).toLocaleDateString()}</td>
                <td><span className="badge badge-secondary">{catEmoji[e.category]||''} {e.category}</span></td>
                <td style={{fontWeight:600,color:'var(--color-primary)'}}>Rs. {e.amount}</td>
                <td style={{color:'var(--text-secondary)'}}>{e.description||'—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
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
              ? `Collect package from ${p.vendorId?.name || 'Vendor'}`
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
    return () => clearInterval(interval);
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
