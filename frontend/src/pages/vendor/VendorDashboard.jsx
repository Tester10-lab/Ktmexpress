import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import AppShell from '../../components/AppShell';
import MetricCard from '../../components/MetricCard';
import PrintLabel from '../../components/PrintLabel';
import Pagination from '../../components/Pagination';
import api from '../../api/axios';
import { useToast } from '../../context/ToastContext';
import { useDeliveryCharge } from '../../hooks/useDeliveryCharge';

const navLinks = [
  { name: 'Dashboard', path: '/vendor', exact: true, icon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg> },
  { name: 'Inventory', path: '/vendor/inventory', icon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg> },
  { name: 'My Orders', path: '/vendor/packages', icon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg> },
  { name: 'Bulk Upload', path: '/vendor/packages/bulk', icon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></svg> },
  { name: 'Finance', path: '/vendor/finance', icon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg> },
  { name: 'Delivery History', path: '/vendor/history', icon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> },
  { name: 'Branch Directory', path: '/vendor/branches', icon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg> },
];

const titleMap = {
  '/vendor': 'Dashboard Overview',
  '/vendor/packages/new': 'Create New Order',
  '/vendor/packages/bulk': 'Bulk Upload',
  '/vendor/packages': 'Order Management',
  '/vendor/finance': 'Finance & Payments',
  '/vendor/history': 'Delivery History',
  '/vendor/inventory': 'Inventory Management',
  '/vendor/branches': 'Branch Directory',
};

function statusBadge(status) {
  const m = { 'Delivered':'badge-success','Cancelled':'badge-danger','Returned to Vendor':'badge-info','Returned':'badge-info','Pending':'badge-warning','Pick Up Requested':'badge-warning','Picked Up':'badge-primary','In Warehouse':'badge-primary','Out for Delivery':'badge-primary','Postponed':'badge-warning' };
  return <span className={`badge ${m[status]||'badge-secondary'}`}>{status}</span>;
}

// ─── Vendor Home ─────────────────────────────────────────────────────────
const VendorHome = () => {
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/vendor/dashboard').then(r => setStats(r.data.data || {})).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="empty-state"><p>Loading...</p></div>;

  return (
    <>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20,flexWrap:'wrap',gap:12}}>
        <div><h2 style={{fontSize:'var(--font-size-xl)',marginBottom:4}}>Welcome back 👋</h2><p style={{color:'var(--text-muted)',fontSize:'var(--font-size-sm)'}}>Here's your delivery overview</p></div>
        <button className="btn btn-primary" onClick={() => navigate('/vendor/packages/new')}>+ New Order</button>
      </div>
      <div className="metrics-grid">
        <div onClick={() => navigate('/vendor/packages')} className="cursor-pointer hover:shadow-md transition-shadow">
          <MetricCard title="Today's Packages" value={stats.todayPkgs??0} color="primary" icon={<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>}/>
        </div>
        <div onClick={() => navigate('/vendor/packages')} className="cursor-pointer hover:shadow-md transition-shadow">
          <MetricCard title="Pending" value={stats.pending??0} color="warning" icon={<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>}/>
        </div>
        <div onClick={() => navigate('/vendor/history')} className="cursor-pointer hover:shadow-md transition-shadow">
          <MetricCard title="Delivered" value={stats.delivered??0} color="success" icon={<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>}/>
        </div>
        <div onClick={() => navigate('/vendor/history')} className="cursor-pointer hover:shadow-md transition-shadow">
          <MetricCard title="Returned" value={stats.returned??0} color="danger" icon={<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.5"/></svg>}/>
        </div>
        <div onClick={() => navigate('/vendor/packages')} className="cursor-pointer hover:shadow-md transition-shadow">
          <MetricCard title="Pickup Requests" value={stats.pickupRequests??0} color="info" icon={<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>}/>
        </div>
      </div>
      <div className="card">
        <div className="card-header border-b"><h3>Quick Actions</h3></div>
        <div className="card-body">
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))',gap:16}}>
            {[
              {label:'Bulk Upload CSV',path:'/vendor/packages/bulk',color:'var(--color-primary-soft)',textColor:'var(--color-primary)'},
              {label:'Request Pickup',path:'/vendor/packages',color:'var(--color-success-soft)',textColor:'var(--color-success)'},
              {label:'View Finance',path:'/vendor/finance',color:'var(--color-purple-soft)',textColor:'var(--color-purple)'},
              {label:'Delivery History',path:'/vendor/history',color:'var(--color-warning-soft)',textColor:'var(--color-warning)'},
            ].map(a => (
              <button key={a.label} onClick={() => navigate(a.path)} style={{background:a.color,border:'none',borderRadius:'var(--radius-md)',padding:'20px 16px',cursor:'pointer',display:'flex',flexDirection:'column',alignItems:'center',gap:8,color:a.textColor,fontFamily:'var(--font-heading)',fontWeight:600,fontSize:'var(--font-size-sm)',transition:'var(--transition-normal)'}}>
                {a.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

// ─── Searchable Dropdown ──────────────────────────────────────────────────
const inputClass = "w-full text-lg bg-white border border-gray-200 rounded-lg shadow-sm px-3 py-2.5 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all placeholder:text-base placeholder:text-gray-400";
const labelClass = "block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5";

const SearchableDropdown = ({ value, onChange, options, name, placeholder = "Select..." }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const wrapperRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = options.filter(opt => opt.toLowerCase().includes(search.toLowerCase()));

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <input
          type="text"
          className={inputClass}
          style={{ paddingRight: 36 }}
          placeholder={placeholder}
          value={isOpen ? search : value}
          onChange={(e) => { setSearch(e.target.value); if(!isOpen) setIsOpen(true); onChange({ target: { name, value: e.target.value } }); }}
          onClick={() => setIsOpen(true)}
        />
        <svg xmlns="http://www.w3.org/2000/svg" className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6"/></svg>
      </div>
      {isOpen && (
        <div className="absolute top-full left-0 right-0 z-50 bg-white border border-gray-100 rounded-lg shadow-xl max-h-60 overflow-y-auto mt-2 animate-in fade-in zoom-in-95 duration-100">
          {filteredOptions.length > 0 ? filteredOptions.map((opt, i) => (
            <div key={i} onClick={() => { onChange({ target: { name, value: opt } }); setSearch(''); setIsOpen(false); }} className={`px-4 py-2.5 text-lg cursor-pointer border-b border-gray-50 last:border-0 hover:bg-blue-50 transition-colors ${value === opt ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-700'}`}>
              {opt}
            </div>
          )) : <div className="px-4 py-3 text-lg text-gray-400 italic">No options found</div>}
        </div>
      )}
    </div>
  );
};

const SIMPLE_BRANCHES = ['HEAD OFFICE', 'Kathmandu Branch', 'Pokhara Branch', 'Chitwan Branch', 'Lalitpur Branch', 'Bhaktapur Branch', 'Dharan Branch', 'Biratnagar Branch'];
const PICKUP_POINTS = ['Koteshwor Hub', 'Baneshwor Hub', 'Thamel Hub', 'Patan Hub', 'Boudha Hub'];
const KATHMANDU_VALLEY_AREAS = ['Kathmandu', 'Lalitpur', 'Bhaktapur', 'Thamel', 'Patan', 'Boudha', 'Koteshwor', 'Baneshwor', 'Balaju', 'Kirtipur', 'Thankot', 'Budhanilkantha'];
const OUT_OF_VALLEY_CITIES = ['Pokhara', 'Chitwan', 'Butwal', 'Dharan', 'Biratnagar', 'Nepalgunj', 'Dhangadhi', 'Janakpur', 'Hetauda', 'Bharatpur'];

// ─── Package List ─────────────────────────────────────────────────────────
const EMPTY_FORM = {
  branch: 'HEAD OFFICE',
  destinationBranch: '--------',
  customerName: '',
  customerPhone: '',
  altPhone: '',
  address: '',
  city: '',
  deliveryDate: '',
  outOfValley: false,
  weight: 1,
  deliveryCharge: 0,
  amount: 0,
  packageAccess: 'Sealed',
  invoiceId: '',
  pickupPoint: '--------',
  pickupType: 'Pickup',
  packageType: '',
  comments: ''
};

const PackageList = () => {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [pagination, setPagination] = useState(null);
  const [selected, setSelected] = useState([]);
  const [commentModal, setCommentModal] = useState({open:false,packageId:null,text:''});
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [createForm, setCreateForm] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [createLoading, setCreateLoading] = useState(false);
  const [successModal, setSuccessModal] = useState(null);
  const [viewPackageDetails, setViewPackageDetails] = useState(null);
  const [printPackages, setPrintPackages] = useState([]);
  const printRef = useRef();
  const { showToast } = useToast();

  // ── Auto-fetch delivery charge from admin rules ──
  const {
    charge: fetchedCharge,
    loading: chargeLoading,
    error: chargeError,
    ruleDetail,
  } = useDeliveryCharge(
    createForm.branch,
    createForm.destinationBranch,
    createForm.weight
  );

  // Sync fetched charge into form state
  useEffect(() => {
    if (fetchedCharge !== null && fetchedCharge !== undefined) {
      setCreateForm(prev => ({ ...prev, deliveryCharge: fetchedCharge }));
    }
  }, [fetchedCharge]);

  const fetchPackages = async () => {
    setLoading(true);
    try { 
      const r = await api.get(`/vendor/packages?status=${statusFilter}&search=${search}&page=${page}&limit=${limit}`); 
      setPackages(r.data.data||[]);
      setPagination(r.data.pagination);
    } catch { 
      showToast('Failed to load packages','error'); 
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { 
    const t = setTimeout(fetchPackages, 400); 
    return () => clearTimeout(t); 
  }, [search, statusFilter, page, limit]);

  // Reset page when search or filter changes
  useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

  const handleSelectAll = e => setSelected(e.target.checked ? packages.filter(p=>p.status==='Pending').map(p=>p._id) : []);
  const handleSelect = id => setSelected(s => s.includes(id) ? s.filter(x=>x!==id) : [...s,id]);

  const requestPickup = async () => {
    if (!selected.length) return;
    try { await api.post('/vendor/pickup-request',{packageIds:selected}); showToast('Pickup requested!','success'); setSelected([]); fetchPackages(); }
    catch(e) { showToast(e.response?.data?.message||'Failed to request pickup','error'); }
  };

  const addComment = async e => {
    e.preventDefault();
    try { await api.post(`/vendor/packages/${commentModal.packageId}/comments`,{text:commentModal.text}); showToast('Comment saved','success'); setCommentModal({open:false,packageId:null,text:''}); fetchPackages(); }
    catch { showToast('Failed to add comment','error'); }
  };

  const handleFormChange = e => {
    const { name, value, type, checked } = e.target;
    setCreateForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
    if (formErrors[name]) setFormErrors(err => ({ ...err, [name]: null }));
  };

  const validateForm = () => {
    const errors = {};
    if (!createForm.branch) errors.branch = "Branch is required";
    if (!createForm.destinationBranch || createForm.destinationBranch === '--------') errors.destinationBranch = "Destination Branch is required";
    if (!createForm.customerName.trim()) errors.customerName = "Receiver Name is required";
    if (!createForm.customerPhone) errors.customerPhone = "Receiver Phone Number is required";
    if (!createForm.address.trim()) errors.address = "Receiver Full Address is required";
    if (createForm.weight === '' || isNaN(Number(createForm.weight))) errors.weight = "Valid weight is required";
    if (createForm.deliveryCharge === '' || isNaN(Number(createForm.deliveryCharge))) errors.deliveryCharge = "Valid delivery charge is required";
    if (createForm.amount === '' || isNaN(Number(createForm.amount))) errors.amount = "Valid COD charge is required";
    if (!createForm.packageType.trim()) errors.packageType = "Package Type is required";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateSubmit = async (e, keepOpen = false) => {
    e.preventDefault();
    if (!validateForm()) return showToast('Please fix the errors in the form', 'error');

    setCreateLoading(true);
    try {
      const payload = {
        invoiceId: createForm.invoiceId,
        customerName: createForm.customerName,
        customerPhone: createForm.customerPhone,
        address: createForm.address,
        city: createForm.city || createForm.destinationBranch,
        outOfValley: createForm.outOfValley || (createForm.destinationBranch !== 'HEAD OFFICE' && createForm.destinationBranch !== '--------'),
        weight: Number(createForm.weight),
        amount: Number(createForm.amount),
        deliveryCharge: Number(createForm.deliveryCharge),
        deliveryDate: createForm.deliveryDate,
        // Normalize to lowercase enum values expected by the model
        packageAccess: createForm.packageAccess === 'Can Open' ? 'open' : 'sealed',
        comments: createForm.comments,
      };
      
      const res = await api.post('/vendor/packages', payload);
      const pkg = res.data.data;
      
      if (!keepOpen) {
        setDrawerOpen(false);
        setSuccessModal({ trackingCode: pkg.trackingCode, customerName: pkg.customerName });
      } else {
        showToast(`✓ Order created! Tracking: ${pkg.trackingCode}`, 'success');
      }
      
      setCreateForm(EMPTY_FORM);
      fetchPackages();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to create order';
      showToast(msg, 'error');
      console.error('Create order error:', err.response?.data);
    } finally { setCreateLoading(false); }
  };

  const f = createForm;

  return (
    <div>
      {/* ── Header row ── */}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20,flexWrap:'wrap',gap:12}}>
        <div>
          <h2 style={{fontSize:'var(--font-size-xl)',marginBottom:2}}>My Orders</h2>
          <p style={{fontSize:'var(--font-size-xs)',color:'var(--text-muted)'}}>Manage and track all your delivery packages</p>
        </div>
        <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
          {selected.length > 0 && (
            <>
              <button className="btn btn-outline" onClick={requestPickup}>Request Pickup ({selected.length})</button>
              <button className="btn btn-secondary" onClick={() => {
                const selectedPkgs = packages.filter(p => selected.includes(p._id));
                setPrintPackages(selectedPkgs);
                setTimeout(() => window.print(), 200);
              }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{marginRight:4}}><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
                Print Labels ({selected.length})
              </button>
            </>
          )}
          <button className="btn btn-primary" onClick={() => { setCreateForm(EMPTY_FORM); setDrawerOpen(true); }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{marginRight:6}}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            New Order
          </button>
        </div>
      </div>

      <div className="card mb-4" style={{flexDirection:'row',gap:12,flexWrap:'wrap',padding:'12px 16px'}}>
        <div style={{flex:1,position:'relative',minWidth:200}}>
          <svg xmlns="http://www.w3.org/2000/svg" style={{position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',color:'var(--text-muted)'}} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input type="text" className="form-control" style={{paddingLeft:38}} placeholder="Search tracking, name, invoice..." value={search} onChange={e=>setSearch(e.target.value)}/>
        </div>
        <select className="form-select" style={{width:200}} value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}>
          <option value="all">All Statuses</option>
          {['Pending','Pick Up Requested','In Warehouse','Out for Delivery','Delivered','Cancelled','Returned to Vendor'].map(s=><option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="card p-0">
        <div className="table-container">
          <table className="data-table">
            <thead><tr><th width="40"><input type="checkbox" onChange={handleSelectAll} checked={selected.length>0 && selected.length===packages.filter(p=>p.status==='Pending').length}/></th><th>Tracking / Invoice</th><th>Customer</th><th>Status</th><th>Amount</th><th>Date</th><th>Actions</th></tr></thead>
            <tbody>
              {loading ? <tr><td colSpan="7" style={{textAlign:'center',padding:40,color:'var(--text-muted)'}}>Loading...</td></tr>
              : packages.length===0 ? <tr><td colSpan="7" style={{textAlign:'center',padding:40,color:'var(--text-muted)'}}>No packages found. <button className="btn btn-primary btn-sm" style={{marginLeft:8}} onClick={()=>setDrawerOpen(true)}>+ Create First Order</button></td></tr>
              : packages.map(pkg => (
                <tr key={pkg._id}>
                  <td><input type="checkbox" checked={selected.includes(pkg._id)} onChange={()=>handleSelect(pkg._id)} disabled={pkg.status!=='Pending'}/></td>
                  <td><div style={{fontWeight:600,fontSize:'var(--font-size-sm)'}}>{pkg.trackingCode}</div><div style={{fontSize:'var(--font-size-xs)',color:'var(--text-muted)'}}>{pkg.invoiceId}</div></td>
                  <td><div>{pkg.customerName}</div><div style={{fontSize:'var(--font-size-xs)',color:'var(--text-muted)'}}>{pkg.city ? `${pkg.city}, ` : ''}{pkg.address}</div></td>
                  <td>{statusBadge(pkg.status)}</td>
                  <td>Rs. {pkg.amount}</td>
                  <td style={{color:'var(--text-muted)'}}>{new Date(pkg.createdAt).toLocaleDateString()}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button onClick={()=>setViewPackageDetails(pkg)} className="btn btn-ghost btn-sm" title="View details">
                        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                      </button>
                      <button onClick={()=>setCommentModal({open:true,packageId:pkg._id,text:''})} className="btn btn-ghost btn-sm" title="Add note">
                        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination 
          pagination={pagination} 
          onPageChange={setPage} 
          limit={limit} 
          onLimitChange={setLimit} 
        />
      </div>

      {/* Comment Modal */}
      {commentModal.open && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)', padding: '16px' }} onClick={() => setCommentModal({open:false,packageId:null,text:''})}>
          <div style={{ background: '#fff', borderRadius: '16px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.35)', width: '100%', maxWidth: '440px', overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '20px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '18px' }}>Add Note / Comment</h3>
              <button style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 4 }} onClick={() => setCommentModal({open:false,packageId:null,text:''})}><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
            </div>
            <div style={{ padding: '20px' }}>
              <form onSubmit={addComment}>
                <div className="form-group"><label>Note for dispatcher/rider</label><textarea className="form-control" rows="4" value={commentModal.text} onChange={e => setCommentModal(m => ({...m,text:e.target.value}))} placeholder="Enter instructions or notes..." required /></div>
                <div style={{display:'flex',gap:8,justifyContent:'flex-end', marginTop: 16}}>
                  <button type="button" className="btn btn-outline" onClick={() => setCommentModal({open:false,packageId:null,text:''})}>Cancel</button>
                  <button type="submit" className="btn btn-primary">Save Comment</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      {/* View Details Modal */}
      {viewPackageDetails && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)', padding: '16px' }} onClick={() => setViewPackageDetails(null)}>
          <div style={{ background: '#fff', borderRadius: '16px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.35)', width: '100%', maxWidth: '680px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexShrink: 0 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>Package Details</h3>
                <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>Tracking Code: <strong style={{color:'var(--text-primary)'}}>{viewPackageDetails.trackingCode}</strong></p>
              </div>
              <button style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 4 }} onClick={() => setViewPackageDetails(null)}><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
            </div>
            <div style={{ padding: '24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              <div className="grid grid-cols-2 gap-6">
                {/* Customer Info */}
                <div>
                  <h4 style={{fontSize:'12px',textTransform:'uppercase',letterSpacing:'0.05em',color:'var(--text-muted)',marginBottom:'12px'}}>Customer Details</h4>
                  <div style={{background:'var(--bg-surface)',padding:'12px 16px',borderRadius:'8px',border:'1px solid var(--border-color)'}}>
                    <p style={{margin:'0 0 8px',fontWeight:600}}>{viewPackageDetails.customerName}</p>
                    <p style={{margin:'0 0 4px',fontSize:'14px',color:'var(--text-muted)'}}>📞 {viewPackageDetails.customerPhone}</p>
                    <p style={{margin:0,fontSize:'14px',color:'var(--text-muted)'}}>📍 {viewPackageDetails.city ? `${viewPackageDetails.city}, ` : ''}{viewPackageDetails.address}</p>
                  </div>
                </div>
                {/* Order Financials */}
                <div>
                  <h4 style={{fontSize:'12px',textTransform:'uppercase',letterSpacing:'0.05em',color:'var(--text-muted)',marginBottom:'12px'}}>Financials</h4>
                  <div style={{background:'var(--bg-surface)',padding:'12px 16px',borderRadius:'8px',border:'1px solid var(--border-color)'}}>
                    <div style={{display:'flex',justifyContent:'space-between',marginBottom:'8px'}}><span style={{color:'var(--text-muted)',fontSize:'14px'}}>COD Amount</span><strong style={{color:'var(--color-primary)'}}>Rs. {viewPackageDetails.amount}</strong></div>
                    <div style={{display:'flex',justifyContent:'space-between',marginBottom:'8px'}}><span style={{color:'var(--text-muted)',fontSize:'14px'}}>Delivery Charge</span><strong>Rs. {viewPackageDetails.deliveryCharge}</strong></div>
                    <div style={{display:'flex',justifyContent:'space-between'}}><span style={{color:'var(--text-muted)',fontSize:'14px'}}>Status</span>{statusBadge(viewPackageDetails.status)}</div>
                  </div>
                </div>
              </div>

              {/* Package Meta */}
              <div>
                <h4 style={{fontSize:'12px',textTransform:'uppercase',letterSpacing:'0.05em',color:'var(--text-muted)',marginBottom:'12px'}}>Package Info</h4>
                <div className="grid grid-cols-3 gap-4" style={{background:'var(--bg-surface)',padding:'12px 16px',borderRadius:'8px',border:'1px solid var(--border-color)'}}>
                  <div><div style={{fontSize:'11px',color:'var(--text-muted)',marginBottom:'2px'}}>Weight</div><div style={{fontWeight:500,fontSize:'14px'}}>{viewPackageDetails.weight} kg</div></div>
                  <div><div style={{fontSize:'11px',color:'var(--text-muted)',marginBottom:'2px'}}>Package Type</div><div style={{fontWeight:500,fontSize:'14px'}}>{viewPackageDetails.packageType || 'N/A'}</div></div>
                  <div><div style={{fontSize:'11px',color:'var(--text-muted)',marginBottom:'2px'}}>Invoice ID</div><div style={{fontWeight:500,fontSize:'14px'}}>{viewPackageDetails.invoiceId || 'N/A'}</div></div>
                  <div><div style={{fontSize:'11px',color:'var(--text-muted)',marginBottom:'2px'}}>Destination</div><div style={{fontWeight:500,fontSize:'14px'}}>{viewPackageDetails.destinationBranch || 'N/A'}</div></div>
                  <div><div style={{fontSize:'11px',color:'var(--text-muted)',marginBottom:'2px'}}>Access</div><div style={{fontWeight:500,fontSize:'14px'}}>{viewPackageDetails.packageAccess || 'Sealed'}</div></div>
                  <div><div style={{fontSize:'11px',color:'var(--text-muted)',marginBottom:'2px'}}>Created Date</div><div style={{fontWeight:500,fontSize:'14px'}}>{new Date(viewPackageDetails.createdAt).toLocaleDateString()}</div></div>
                </div>
              </div>

              {/* Notes */}
              {(viewPackageDetails.comments || viewPackageDetails.timeline?.length > 0) && (
                <div>
                  {viewPackageDetails.comments && (
                    <div style={{marginBottom:'16px'}}>
                      <h4 style={{fontSize:'12px',textTransform:'uppercase',letterSpacing:'0.05em',color:'var(--text-muted)',marginBottom:'12px'}}>Special Instructions</h4>
                      <div style={{background:'rgba(245,158,11,0.1)',padding:'12px 16px',borderRadius:'8px',border:'1px solid rgba(245,158,11,0.2)',color:'#92400e',fontSize:'14px'}}>
                        {viewPackageDetails.comments}
                      </div>
                    </div>
                  )}
                  {viewPackageDetails.timeline?.length > 0 && (
                    <div>
                      <h4 style={{fontSize:'12px',textTransform:'uppercase',letterSpacing:'0.05em',color:'var(--text-muted)',marginBottom:'12px'}}>Timeline</h4>
                      <div style={{background:'var(--bg-surface)',padding:'16px',borderRadius:'8px',border:'1px solid var(--border-color)'}}>
                        {viewPackageDetails.timeline.map((t, idx) => (
                          <div key={idx} style={{display:'flex',gap:'12px',marginBottom:idx===viewPackageDetails.timeline.length-1?0:'12px',position:'relative'}}>
                            {idx !== viewPackageDetails.timeline.length-1 && <div style={{position:'absolute',left:'4px',top:'20px',bottom:'-12px',width:'2px',background:'var(--border-color)'}}></div>}
                            <div style={{width:'10px',height:'10px',borderRadius:'50%',background:'var(--color-primary)',marginTop:'5px',position:'relative',zIndex:2}}></div>
                            <div>
                              <div style={{fontWeight:600,fontSize:'14px'}}>{t.status}</div>
                              <div style={{fontSize:'12px',color:'var(--text-muted)'}}>{new Date(t.time).toLocaleString()} • {t.user || 'System'}</div>
                              {t.message && <div style={{fontSize:'13px',marginTop:'2px'}}>{t.message}</div>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
              {/* QR Code & Barcode */}
              <div>
                <h4 style={{fontSize:'12px',textTransform:'uppercase',letterSpacing:'0.05em',color:'var(--text-muted)',marginBottom:'12px'}}>Scan / Label</h4>
                <div className="qr-barcode-panel">
                  <div className="qr-barcode-box">
                    <span className="qr-barcode-label">QR Code</span>
                    <img
                      src={viewPackageDetails.qrCodeUrl || `https://api.qrserver.com/v1/create-qr-code/?size=140x140&ecc=M&data=${encodeURIComponent('http://localhost:5173/track?code='+viewPackageDetails.trackingCode)}`}
                      alt="QR Code" width="120" height="120" style={{border:'1px solid var(--border-color)',borderRadius:4}}
                    />
                    <div className="qr-barcode-actions">
                      <a
                        href={viewPackageDetails.qrCodeUrl || `https://api.qrserver.com/v1/create-qr-code/?size=300x300&ecc=M&data=${encodeURIComponent('http://localhost:5173/track?code='+viewPackageDetails.trackingCode)}`}
                        download={`QR-${viewPackageDetails.trackingCode}.png`} target="_blank" rel="noreferrer"
                        className="btn btn-outline btn-sm">↓ Download</a>
                    </div>
                  </div>
                  <div className="qr-barcode-box" style={{flex:1,minWidth:200}}>
                    <span className="qr-barcode-label">Code 128 Barcode</span>
                    <img
                      src={viewPackageDetails.barcodeUrl || `https://barcodeapi.org/api/128/${viewPackageDetails.trackingCode}`}
                      alt="Barcode" style={{height:56,width:'100%',objectFit:'contain',border:'1px solid var(--border-color)',borderRadius:4,background:'#fff',padding:'4px'}}
                    />
                    <div className="qr-barcode-actions">
                      <a
                        href={viewPackageDetails.barcodeUrl || `https://barcodeapi.org/api/128/${viewPackageDetails.trackingCode}`}
                        download={`Barcode-${viewPackageDetails.trackingCode}.png`} target="_blank" rel="noreferrer"
                        className="btn btn-outline btn-sm">↓ Download</a>
                      <button className="btn btn-primary btn-sm" onClick={() => {
                        setPrintPackages([viewPackageDetails]);
                        setTimeout(() => window.print(), 200);
                      }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{marginRight:4}}><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
                        Print Label
                      </button>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Hidden Print Label renderer — activated by window.print() */}
      <PrintLabel ref={printRef} packages={printPackages} />

      {/* ── Create Order Centered Modal ── */}
      {drawerOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)', padding: '16px' }}>
          <div style={{ background: '#fff', borderRadius: '16px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.35)', width: '100%', maxWidth: '680px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            
            {/* Modal header */}
            <div style={{ padding: '24px 24px 16px', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexShrink: 0, background: '#fff' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#111827" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/></svg>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#111827' }}>Create new order</h3>
                </div>
                <p style={{ margin: 0, fontSize: '13px', color: '#4b5563' }}>A unique 7-digit tracking code will be generated on save</p>
              </div>
              <button style={{ padding: '6px', borderRadius: '8px', border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer', color: '#6b7280', display: 'flex', alignItems: 'center' }} onMouseEnter={e => e.currentTarget.style.background='#f3f4f6'} onMouseLeave={e => e.currentTarget.style.background='#fff'} onClick={() => setDrawerOpen(false)}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            {/* Modal body / form */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px', background: '#f9f8f6' }}>
              <form id="create-order-form" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                
                {/* 1. RECIPIENT */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/></svg>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#2563eb', letterSpacing: '0.05em' }}>RECIPIENT</span>
                  </div>
                  <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', margin: '0 0 16px' }} />
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#111827', marginBottom: '4px' }}>Full name <span style={{ color: '#dc2626' }}>*</span></label>
                      <input type="text" name="customerName" value={f.customerName} onChange={handleFormChange} style={{ width: '100%', borderRadius: '6px', border: '1px solid #d1d5db', padding: '10px 12px', fontSize: '15px', outline: 'none', background: '#fff' }} placeholder="Enter recipient's full name" />
                      {formErrors.customerName && <span className="text-xs text-red-500 mt-1 block">{formErrors.customerName}</span>}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#111827', marginBottom: '4px' }}>Contact number <span style={{ color: '#dc2626' }}>*</span></label>
                        <input type="tel" name="customerPhone" value={f.customerPhone} onChange={handleFormChange} style={{ width: '100%', borderRadius: '6px', border: '1px solid #d1d5db', padding: '10px 12px', fontSize: '15px', outline: 'none', background: '#fff' }} placeholder="98XXXXXXXX" />
                        {formErrors.customerPhone && <span className="text-xs text-red-500 mt-1 block">{formErrors.customerPhone}</span>}
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#111827', marginBottom: '4px' }}>Alt. contact number</label>
                        <input type="tel" name="altPhone" value={f.altPhone || ''} onChange={handleFormChange} style={{ width: '100%', borderRadius: '6px', border: '1px solid #d1d5db', padding: '10px 12px', fontSize: '15px', outline: 'none', background: '#fff' }} placeholder="98XXXXXXXX (optional)" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. DELIVERY */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#92400e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/></svg>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#92400e', letterSpacing: '0.05em' }}>DELIVERY</span>
                  </div>
                  <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', margin: '0 0 16px' }} />
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#111827', marginBottom: '4px' }}>From branch <span style={{ color: '#dc2626' }}>*</span></label>
                        <div style={{ position: 'relative' }}>
                          <select name="branch" value={f.branch} onChange={handleFormChange} style={{ width: '100%', borderRadius: '6px', border: '1px solid #d1d5db', padding: '10px 12px', fontSize: '15px', outline: 'none', background: '#fff', appearance: 'none' }}>
                            <option value="">Select branch</option>
                            {SIMPLE_BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
                          </select>
                          <svg xmlns="http://www.w3.org/2000/svg" style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#111827' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6"/></svg>
                        </div>
                        {formErrors.branch && <span className="text-xs text-red-500 mt-1 block">{formErrors.branch}</span>}
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#111827', marginBottom: '4px' }}>Destination branch <span style={{ color: '#dc2626' }}>*</span></label>
                        <div style={{ position: 'relative' }}>
                          <select name="destinationBranch" value={f.destinationBranch} onChange={handleFormChange} style={{ width: '100%', borderRadius: '6px', border: '1px solid #d1d5db', padding: '10px 12px', fontSize: '15px', outline: 'none', background: '#fff', appearance: 'none' }}>
                            <option value="--------">Select branch</option>
                            {SIMPLE_BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
                          </select>
                          <svg xmlns="http://www.w3.org/2000/svg" style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#111827' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6"/></svg>
                        </div>
                        {formErrors.destinationBranch && <span className="text-xs text-red-500 mt-1 block">{formErrors.destinationBranch}</span>}
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#111827', marginBottom: '4px' }}>Receiver full address <span style={{ color: '#dc2626' }}>*</span></label>
                      <input type="text" name="address" value={f.address} onChange={handleFormChange} style={{ width: '100%', borderRadius: '6px', border: '1px solid #d1d5db', padding: '10px 12px', fontSize: '15px', outline: 'none', background: '#fff' }} placeholder="Street, tole, landmark..." />
                      {formErrors.address && <span className="text-xs text-red-500 mt-1 block">{formErrors.address}</span>}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#111827', marginBottom: '4px' }}>City / area <span style={{ color: '#dc2626' }}>*</span></label>
                        <input type="text" name="city" value={f.city} onChange={handleFormChange} style={{ width: '100%', borderRadius: '6px', border: '1px solid #d1d5db', padding: '10px 12px', fontSize: '15px', outline: 'none', background: '#fff' }} placeholder="City or area name" />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#111827', marginBottom: '4px' }}>Delivery date</label>
                        <div style={{ position: 'relative' }}>
                          <input type="date" name="deliveryDate" value={f.deliveryDate} onChange={handleFormChange} min={new Date().toISOString().split('T')[0]} style={{ width: '100%', borderRadius: '6px', border: '1px solid #d1d5db', padding: '10px 12px', fontSize: '15px', outline: 'none', background: '#fff', color: '#111827' }} />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', padding: '12px 14px', background: '#fff', border: '1px solid #d1d5db', borderRadius: '6px' }}>
                        <input type="checkbox" name="outOfValley" checked={f.outOfValley} onChange={handleFormChange} style={{ width: '18px', height: '18px', accentColor: '#3b82f6', borderRadius: '4px', border: '1px solid #9ca3af' }} />
                        <span style={{ fontSize: '15px', color: '#374151', userSelect: 'none' }}>Out of Kathmandu Valley</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* 3. PACKAGE & FINANCIALS */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#166534" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/></svg>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#166534', letterSpacing: '0.05em' }}>PACKAGE & FINANCIALS</span>
                  </div>
                  <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', margin: '0 0 16px' }} />
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#111827', marginBottom: '4px' }}>Weight (kg) <span style={{ color: '#dc2626' }}>*</span></label>
                        <input type="number" step="0.1" name="weight" value={f.weight} onChange={handleFormChange} style={{ width: '100%', borderRadius: '6px', border: '1px solid #d1d5db', padding: '10px 12px', fontSize: '15px', outline: 'none', background: '#fff' }} placeholder="0.0" />
                        {formErrors.weight && <span className="text-xs text-red-500 mt-1 block">{formErrors.weight}</span>}
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#111827', marginBottom: '4px' }}>Package access <span style={{ color: '#dc2626' }}>*</span></label>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button type="button" onClick={() => handleFormChange({target:{name:'packageAccess',value:'Sealed'}})} style={{ flex: 1, fontSize: '14px', fontWeight: 500, padding: '10px 4px', borderRadius: '6px', border: f.packageAccess === 'Sealed' ? '1px solid #93c5fd' : '1px solid #d1d5db', cursor: 'pointer', transition: 'all 0.15s', background: f.packageAccess === 'Sealed' ? '#dbeafe' : '#fff', color: f.packageAccess === 'Sealed' ? '#1e40af' : '#4b5563' }}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ display: 'inline-block', marginRight: '6px', verticalAlign: '-2px' }}><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                            Sealed
                          </button>
                          <button type="button" onClick={() => handleFormChange({target:{name:'packageAccess',value:'Can Open'}})} style={{ flex: 1, fontSize: '14px', fontWeight: 500, padding: '10px 4px', borderRadius: '6px', border: f.packageAccess === 'Can Open' ? '1px solid #93c5fd' : '1px solid #d1d5db', cursor: 'pointer', transition: 'all 0.15s', background: f.packageAccess === 'Can Open' ? '#dbeafe' : '#fff', color: f.packageAccess === 'Can Open' ? '#1e40af' : '#4b5563' }}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ display: 'inline-block', marginRight: '6px', verticalAlign: '-2px' }}><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg>
                            Open
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#111827', marginBottom: '4px' }}>Product price (Rs.) <span style={{ color: '#dc2626' }}>*</span></label>
                        <input type="number" name="amount" value={f.amount} onChange={handleFormChange} style={{ width: '100%', borderRadius: '6px', border: '1px solid #d1d5db', padding: '10px 12px', fontSize: '15px', outline: 'none', background: '#fff' }} />
                        {formErrors.amount && <span className="text-xs text-red-500 mt-1 block">{formErrors.amount}</span>}
                      </div>
                      <div>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '13px', fontWeight: 600, color: '#111827', marginBottom: '4px' }}>
                          Delivery charges (Rs.)
                        </label>
                        <div style={{
                          position: 'relative',
                          borderRadius: 6,
                          border: chargeError ? '1px solid #ef4444' : fetchedCharge !== null ? '1px solid #10b981' : '1px solid #d1d5db',
                          background: chargeError ? '#fef2f2' : fetchedCharge !== null ? '#f0fdf4' : '#fff',
                          padding: '10px 12px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}>
                          {chargeLoading ? (
                            <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#6b7280', fontSize: 15 }}>
                              <svg style={{ animation: 'spin 1s linear infinite' }} xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                              Fetching rate...
                            </span>
                          ) : chargeError ? (
                            <span style={{ color: '#b91c1c', fontSize: 14, fontWeight: 500 }}>{chargeError}</span>
                          ) : fetchedCharge !== null ? (
                            <span style={{ fontWeight: 600, fontSize: 15, color: fetchedCharge === 0 ? '#10b981' : '#1f2937' }}>
                              {fetchedCharge === 0 ? 'Free delivery' : fetchedCharge.toFixed(2)}
                            </span>
                          ) : (
                            <span style={{ color: '#9ca3af', fontSize: 14 }}>Select branch / weight</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#111827', marginBottom: '4px' }}>Product details <span style={{ color: '#dc2626' }}>*</span></label>
                      <input type="text" name="packageType" value={f.packageType} onChange={handleFormChange} style={{ width: '100%', borderRadius: '6px', border: '1px solid #d1d5db', padding: '10px 12px', fontSize: '15px', outline: 'none', background: '#fff' }} placeholder="Describe the product..." />
                      {formErrors.packageType && <span className="text-xs text-red-500 mt-1 block">{formErrors.packageType}</span>}
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#111827', marginBottom: '4px' }}>Remarks / Special instructions</label>
                      <textarea name="comments" value={f.comments} onChange={handleFormChange} style={{ width: '100%', borderRadius: '6px', border: '1px solid #d1d5db', padding: '10px 12px', fontSize: '15px', outline: 'none', background: '#fff', resize: 'vertical', minHeight: '60px' }} placeholder="Any special instructions..."></textarea>
                    </div>
                  </div>
                </div>

              </form>
            </div>

            {/* Modal footer */}
            <div style={{ padding: '16px 24px', borderTop: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, background: '#f4f1eb', gap: '12px' }}>
              <button type="button" style={{ flex: 1, padding: '12px', fontSize: '14px', fontWeight: 500, color: '#374151', background: '#f6f5f3', border: '1px solid #d1d5db', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.15s' }} onMouseEnter={e => e.currentTarget.style.background='#e5e7eb'} onMouseLeave={e => e.currentTarget.style.background='#f6f5f3'} onClick={() => setDrawerOpen(false)}>
                Cancel
              </button>
              <button type="button" onClick={(e) => handleCreateSubmit(e, true)} style={{ flex: 1, padding: '12px', fontSize: '14px', fontWeight: 500, color: '#111827', background: '#f6f5f3', border: '1px solid #d1d5db', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.15s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', opacity: createLoading ? 0.5 : 1 }} disabled={createLoading} onMouseEnter={e => e.currentTarget.style.background='#e5e7eb'} onMouseLeave={e => e.currentTarget.style.background='#f6f5f3'}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/></svg>
                Add & create another
              </button>
              <button type="button" onClick={(e) => handleCreateSubmit(e, false)} style={{ flex: 1.5, padding: '12px', fontSize: '14px', fontWeight: 600, color: '#111827', background: '#f6f5f3', border: '1px solid #9ca3af', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', opacity: createLoading ? 0.8 : 1, transition: 'all 0.15s' }} disabled={createLoading} onMouseEnter={e => e.currentTarget.style.background='#e5e7eb'} onMouseLeave={e => e.currentTarget.style.background='#f6f5f3'}>
                {createLoading ? (
                  <><svg className="animate-spin h-4 w-4 text-gray-800" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Creating...</>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/></svg>
                    Create order & get tracking code
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Success Modal ── */}
      {successModal && (
        <div className="modal-backdrop" style={{ zIndex: 9000 }}>
          <div className="modal-content" style={{ maxWidth: 440, textAlign: 'center' }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '36px 28px 28px' }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg,#10b981,#059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', boxShadow: '0 8px 24px rgba(16,185,129,0.3)' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              <h2 style={{ marginBottom: 6 }}>Order Created!</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)', marginBottom: 24 }}>Package for <strong>{successModal.customerName}</strong> is now pending dispatch.</p>
              <div style={{ background: 'linear-gradient(135deg,#1e3a8a,#2563eb)', borderRadius: 'var(--radius-md)', padding: '20px 24px', marginBottom: 20 }}>
                <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>Tracking Code</p>
                <div style={{ fontSize: 34, fontWeight: 900, color: '#fff', letterSpacing: '0.25em', fontFamily: 'var(--font-heading)' }}>{successModal.trackingCode}</div>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, marginTop: 8 }}>Share with recipient to track delivery</p>
              </div>
              <button className="btn btn-outline" style={{ width: '100%', marginBottom: 10 }} onClick={() => { navigator.clipboard.writeText(successModal.trackingCode); showToast('Copied!', 'success'); }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{marginRight:6}}><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                Copy Tracking Code
              </button>
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => { setSuccessModal(null); setCreateForm(EMPTY_FORM); setDrawerOpen(true); }}>+ Create Another</button>
                <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => setSuccessModal(null)}>Done</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Bulk Upload ──────────────────────────────────────────────────────────
const PackageBulkUpload = () => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const { showToast } = useToast();

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const r = await api.post('/vendor/packages/upload-csv', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setResult({success:true, message: r.data.message || `Successfully uploaded ${r.data.data.length} packages.`});
      setFile(null);
      showToast(`${r.data.data.length} packages created!`,'success');
    } catch(e) { setResult({success:false, message:e.response?.data?.message||'Upload failed'}); showToast('Upload failed','error'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{maxWidth:700,margin:'0 auto'}}>
      <div className="card">
        <div className="card-header border-b">
          <div className="header-title-group"><h3>Bulk Order Upload</h3><p>Upload a CSV file to create multiple orders at once</p></div>
        </div>
        <div className="card-body">
          <div style={{border:'2px dashed var(--color-primary-soft)',borderRadius:'var(--radius-md)',padding:48,textAlign:'center',background:'rgba(37,99,235,0.02)'}}>
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{color:'var(--color-primary)',margin:'0 auto 16px',display:'block'}}><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></svg>
            <h3 style={{marginBottom:8}}>Upload CSV File</h3>
            <p style={{fontSize:'var(--font-size-sm)',color:'var(--text-muted)',marginBottom:24,maxWidth:400,margin:'0 auto 24px'}}>Required columns: <code style={{background:'var(--bg-surface)',padding:'2px 6px',borderRadius:4}}>Customer Name, Customer Phone, Address, Amount</code></p>
            <input type="file" accept=".csv" id="csv-upload" style={{display:'none'}} onChange={e=>{setFile(e.target.files?.[0]||null);setResult(null);}}/>
            <label htmlFor="csv-upload" className="btn btn-secondary" style={{cursor:'pointer'}}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              {file ? file.name : 'Select CSV File'}
            </label>
          </div>

          {file && <div style={{marginTop:20,textAlign:'right'}}><button className="btn btn-primary" onClick={handleUpload} disabled={loading}>{loading?'Processing...':'Upload '+file.name}</button></div>}

          {result && (
            <div style={{marginTop:20,padding:'16px 20px',borderRadius:'var(--radius-sm)',borderLeft:`4px solid ${result.success?'var(--color-success)':'var(--color-danger)'}`,background:result.success?'var(--color-success-soft)':'var(--color-danger-soft)'}}>
              <p style={{fontWeight:600,marginBottom:4,color:result.success?'var(--color-success)':'var(--color-danger)'}}>{result.success?'Upload Successful':'Upload Failed'}</p>
              <p style={{fontSize:'var(--font-size-sm)'}}>{result.message}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Finance ──────────────────────────────────────────────────────────────
const Finance = () => {
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    api.get('/vendor/finance').then(r=>setData(r.data.data||{})).catch(()=>showToast('Failed to load finance data','error')).finally(()=>setLoading(false));
  }, []);

  const requestSettlement = async () => {
    try {
      await api.post('/vendor/settlements');
      showToast('Settlement request sent to admin!', 'success');
      // Refresh finance data
      const r = await api.get('/vendor/finance');
      setData(r.data.data || {});
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to request settlement', 'error');
    }
  };

  if (loading) return <div className="empty-state"><p>Loading finance data...</p></div>;

  return (
    <>
      <div className="metrics-grid">
        <MetricCard title="Packages to Settle" value={data.pendingPackagesCount??0} color="primary" icon={<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>}/>
        <MetricCard title="COD Collected" value={`Rs. ${data.pendingCOD??0}`} color="success" icon={<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>}/>
        <MetricCard title="Delivery Charges" value={`Rs. ${data.pendingDeliveryCharges??0}`} color="danger" icon={<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/></svg>}/>
        <MetricCard title="Net Payable to You" value={`Rs. ${data.totalPayable??0}`} color="purple" icon={<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>}/>
      </div>
      <div className="card">
        <div className="card-header border-b"><div className="header-title-group"><h3>Request Settlement</h3><p>Request payment for delivered packages</p></div><button className="btn btn-primary" disabled={(data.totalPayable||0)<=0} onClick={requestSettlement}>Request Payment</button></div>
        <div className="card-body">
          {(data.totalPayable||0) > 0
            ? <div style={{background:'var(--color-primary-soft)',border:'1px solid rgba(37,99,235,0.2)',borderRadius:'var(--radius-sm)',padding:'16px 20px',color:'var(--color-primary)'}}>You have <strong>Rs. {data.totalPayable}</strong> pending settlement across <strong>{data.pendingPackagesCount}</strong> delivered packages.</div>
            : <div style={{background:'var(--bg-surface)',border:'1px solid var(--border-color)',borderRadius:'var(--radius-sm)',padding:'16px 20px',color:'var(--text-muted)'}}>No pending settlements available at this time.</div>
          }
        </div>
      </div>
    </>
  );
};

// ─── Delivery History ─────────────────────────────────────────────────────
const DeliveryHistory = () => {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    api.get('/vendor/packages?status=all').then(r => setPackages((r.data.data||[]).filter(p=>['Delivered','Cancelled','Returned to Vendor'].includes(p.status)))).catch(()=>showToast('Failed to load history','error')).finally(()=>setLoading(false));
  }, []);

  const exportCSV = () => {
    const rows = [['Tracking Code','Customer','Status','Rider','Amount','Date'], ...packages.map(p=>[p.trackingCode,p.customerName,p.status,p.riderId?.name||'N/A',p.amount,new Date(p.createdAt).toLocaleDateString()])];
    const csv = rows.map(r=>r.map(c=>`"${c}"`).join(',')).join('\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv],{type:'text/csv'})); a.download='delivery_history.csv'; a.click();
  };

  return (
    <div className="card p-0">
      <div className="card-header border-b" style={{padding:20}}>
        <div className="header-title-group"><h3>Delivery History</h3><p>Completed, cancelled, and returned orders</p></div>
        <button className="btn btn-success btn-sm" onClick={exportCSV} disabled={!packages.length}>
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          Export CSV
        </button>
      </div>
      <div className="table-container">
        <table className="data-table">
          <thead><tr><th>Date</th><th>Tracking Code</th><th>Customer</th><th>Status</th><th>Rider</th><th>Amount</th></tr></thead>
          <tbody>
            {loading ? <tr><td colSpan="6" style={{textAlign:'center',padding:40,color:'var(--text-muted)'}}>Loading...</td></tr>
            : packages.length===0 ? <tr><td colSpan="6" style={{textAlign:'center',padding:40,color:'var(--text-muted)'}}>No history found.</td></tr>
            : packages.map(p=>(
              <tr key={p._id}>
                <td style={{color:'var(--text-muted)'}}>{new Date(p.createdAt).toLocaleDateString()}</td>
                <td style={{fontWeight:600}}>{p.trackingCode}</td>
                <td>{p.customerName}</td>
                <td>{statusBadge(p.status)}</td>
                <td style={{color:'var(--text-secondary)'}}>{p.riderId?.name||'N/A'}</td>
                <td>Rs. {p.amount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ─── Inventory ─────────────────────────────────────────────────────────────
const Inventory = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState({ name: '', barcode: '', category: '', price: 0, threshold: 5, stockReceived: 0 });
  const { showToast } = useToast();

  const fetchProducts = () => {
    setLoading(true);
    api.get('/vendor/products').then(r => setProducts(r.data.data || [])).catch(()=>showToast('Failed to load inventory','error')).finally(()=>setLoading(false));
  };

  useEffect(() => { fetchProducts(); }, []);

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      await api.post('/vendor/products', form);
      showToast('Product added to inventory','success');
      setFormOpen(false);
      setForm({ name: '', barcode: '', category: '', price: 0, threshold: 5, stockReceived: 0 });
      fetchProducts();
    } catch(err) { showToast(err.response?.data?.message || 'Failed to add product','error'); }
  };

  return (
    <div className="card p-0">
      <div className="card-header border-b" style={{padding:20, display:'flex', justifyContent:'space-between', alignItems:'center'}}>
        <div className="header-title-group"><h3>Inventory Management</h3><p>Manage your product stock levels and catalog</p></div>
        <button className="btn btn-primary" onClick={() => setFormOpen(true)}>+ Add Product</button>
      </div>
      
      {formOpen && (
        <div style={{padding:20, background:'var(--bg-surface)', borderBottom:'1px solid var(--border-color)'}}>
          <form onSubmit={handleSubmit} style={{display:'grid', gap:16, gridTemplateColumns:'repeat(auto-fit, minmax(150px, 1fr))'}}>
            <div className="form-group"><label>Product Name</label><input type="text" className="form-control" value={form.name} onChange={e=>setForm({...form, name:e.target.value})} required /></div>
            <div className="form-group"><label>Barcode / SKU</label><input type="text" className="form-control" value={form.barcode} onChange={e=>setForm({...form, barcode:e.target.value})} required /></div>
            <div className="form-group"><label>Category</label><input type="text" className="form-control" value={form.category} onChange={e=>setForm({...form, category:e.target.value})} required /></div>
            <div className="form-group"><label>Price (Rs.)</label><input type="number" min="0" className="form-control" value={form.price} onChange={e=>setForm({...form, price:Number(e.target.value)})} required /></div>
            <div className="form-group"><label>Initial Quantity</label><input type="number" min="0" className="form-control" value={form.stockReceived} onChange={e=>setForm({...form, stockReceived:Number(e.target.value)})} required /></div>
            <div className="form-group" style={{display:'flex', alignItems:'flex-end'}}>
              <div style={{display:'flex', gap:8, width:'100%'}}>
                <button type="button" className="btn btn-outline" style={{flex:1}} onClick={()=>setFormOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{flex:1}}>Save</button>
              </div>
            </div>
          </form>
        </div>
      )}

      <div className="table-container">
        <table className="data-table">
          <thead><tr><th>Barcode</th><th>Product Name</th><th>Category</th><th>Price</th><th>Stock (Available)</th></tr></thead>
          <tbody>
            {loading ? <tr><td colSpan="5" style={{textAlign:'center',padding:40,color:'var(--text-muted)'}}>Loading...</td></tr>
            : products.length===0 ? <tr><td colSpan="5" style={{textAlign:'center',padding:40,color:'var(--text-muted)'}}>No products in inventory.</td></tr>
            : products.map(p=>(
              <tr key={p._id}>
                <td style={{fontWeight:600}}>{p.barcode}</td>
                <td>{p.name}</td>
                <td><span className="badge badge-secondary">{p.category}</span></td>
                <td>Rs. {p.price}</td>
                <td>
                  <span style={{color: (p.stockReceived - p.stockSold) <= p.threshold ? 'var(--color-danger)' : 'var(--color-success)', fontWeight:600}}>
                    {p.stockReceived - p.stockSold}
                  </span>
                  <span style={{color:'var(--text-muted)', fontSize:'var(--font-size-xs)', marginLeft:8}}>(Threshold: {p.threshold})</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ─── Branch Directory ─────────────────────────────────────────────────────
const BRANCHES = [
  { id: 1, name: 'Bhalubang Branch', arrivalTime: '10:00 AM – 2:00 PM', district: 'Dang', province: 'Lumbini', baseCharge: 80, deliveryCharge: 100, area: 'Ghorahi, Tulsipur, Lamahi, Deukhuri', contacts: [{ phone: '9857041234', label: 'Main' }, { phone: '9857045678', label: 'Backup' }] },
  { id: 2, name: 'Pakhribas Dhankuta Branch', arrivalTime: '12:00 PM – 4:00 PM', district: 'Dhankuta', province: 'Koshi', baseCharge: 100, deliveryCharge: 130, area: 'Dhankuta Bazaar, Pakhribas, Chaubise, Hile', contacts: [{ phone: '9852067890', label: 'Main' }] },
  { id: 3, name: 'Haldibari Jhapa Branch', arrivalTime: '9:00 AM – 1:00 PM', district: 'Jhapa', province: 'Koshi', baseCharge: 70, deliveryCharge: 90, area: 'Birtamod, Bhadrapur, Arjundhara, Shivasataxi', contacts: [{ phone: '9842011223', label: 'Main' }, { phone: '9842099001', label: 'Alternate' }] },
  { id: 4, name: 'Bauniya Branch', arrivalTime: '11:00 AM – 3:00 PM', district: 'Kailali', province: 'Sudurpaschim', baseCharge: 120, deliveryCharge: 150, area: 'Dhangadhi, Tikapur, Bhajani, Gauriganga', contacts: [{ phone: '9868031415', label: 'Main' }] },
  { id: 5, name: 'Bhurigaon Bardiya Branch', arrivalTime: '1:00 PM – 5:00 PM', district: 'Bardiya', province: 'Lumbini', baseCharge: 90, deliveryCharge: 120, area: 'Gulariya, Rajapur, Madhuban, Banbaasa', contacts: [{ phone: '9857016162', label: 'Main' }, { phone: '9857016163', label: 'Office' }] },
  { id: 6, name: 'Pokhara Lakeside Branch', arrivalTime: '8:00 AM – 12:00 PM', district: 'Kaski', province: 'Gandaki', baseCharge: 75, deliveryCharge: 95, area: 'Lakeside, Newroad, Mahendrapul, Prithvichowk', contacts: [{ phone: '9856023456', label: 'Main' }] },
  { id: 7, name: 'Hetauda Branch', arrivalTime: '10:30 AM – 2:30 PM', district: 'Makwanpur', province: 'Bagmati', baseCharge: 65, deliveryCharge: 85, area: 'Hetauda Bazaar, Churiyamai, Bhimphedi, Lothar', contacts: [{ phone: '9855045678', label: 'Main' }, { phone: '9845001234', label: 'Backup' }] },
];

const BranchDirectory = () => {
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState({});

  const toggle = (id) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

  const filtered = BRANCHES.filter(b =>
    b.name.toLowerCase().includes(search.toLowerCase()) ||
    b.district.toLowerCase().includes(search.toLowerCase()) ||
    b.province.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 'var(--font-size-xl)', marginBottom: 4 }}>Branch Directory</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)' }}>Find branches by name, district, or province</p>
        </div>
        <div style={{ position: 'relative', minWidth: 260 }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input
            type="text"
            className="form-control"
            style={{ paddingLeft: 38 }}
            placeholder="Search branch, district..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        {/* Table Header */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '40px 2fr 1fr 1fr 100px 120px 2fr',
          padding: '10px 16px',
          background: '#f8fafc',
          borderBottom: '1px solid #e2e8f0',
          fontSize: 11,
          fontWeight: 700,
          color: '#64748b',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          gap: 8,
        }}>
          <div />
          <div>Branch / Arrival</div>
          <div>District</div>
          <div>Province</div>
          <div style={{ textAlign: 'center' }}>Base (Rs.)</div>
          <div style={{ textAlign: 'center' }}>Delivery (Rs.)</div>
          <div>Area Covered</div>
        </div>

        {/* Rows */}
        {filtered.length === 0 ? (
          <div style={{ padding: '48px 24px', textAlign: 'center', color: '#94a3b8', fontSize: 'var(--font-size-sm)' }}>
            No branches match your search.
          </div>
        ) : filtered.map((branch, idx) => (
          <div key={branch.id} style={{ borderBottom: idx < filtered.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
            {/* Main Row */}
            <div
              onClick={() => toggle(branch.id)}
              style={{
                display: 'grid',
                gridTemplateColumns: '40px 2fr 1fr 1fr 100px 120px 2fr',
                padding: '14px 16px',
                gap: 8,
                alignItems: 'center',
                cursor: 'pointer',
                background: expanded[branch.id] ? '#f0f7ff' : (idx % 2 === 0 ? '#fff' : '#fafbfc'),
                transition: 'background 0.15s',
              }}
            >
              {/* Expand Arrow */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg
                  xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
                  fill="none" stroke="#2563eb" strokeWidth="2.5"
                  style={{
                    transform: expanded[branch.id] ? 'rotate(90deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s ease',
                    flexShrink: 0,
                  }}
                >
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </div>

              {/* Branch Name + Arrival */}
              <div>
                <div style={{ fontWeight: 700, fontSize: 'var(--font-size-sm)', color: '#1e293b' }}>{branch.name}</div>
                <div style={{ fontStyle: 'italic', fontSize: 11, color: '#64748b', marginTop: 2 }}>{branch.arrivalTime}</div>
              </div>

              {/* District */}
              <div style={{ fontSize: 'var(--font-size-sm)', color: '#334155' }}>{branch.district}</div>

              {/* Province */}
              <div style={{ fontSize: 'var(--font-size-sm)' }}>
                <span style={{
                  display: 'inline-block', padding: '2px 8px',
                  background: '#eff6ff', color: '#2563eb',
                  borderRadius: 99, fontSize: 11, fontWeight: 600,
                }}>{branch.province}</span>
              </div>

              {/* Base Charge */}
              <div style={{ textAlign: 'center', fontWeight: 600, fontSize: 'var(--font-size-sm)', color: '#0f172a' }}>Rs. {branch.baseCharge}</div>

              {/* Delivery Charge */}
              <div style={{ textAlign: 'center', fontWeight: 600, fontSize: 'var(--font-size-sm)', color: '#16a34a' }}>Rs. {branch.deliveryCharge}</div>

              {/* Area */}
              <div style={{ fontStyle: 'italic', textTransform: 'uppercase', fontSize: 10, color: '#64748b', lineHeight: 1.6 }}>{branch.area}</div>
            </div>

            {/* Expanded Sub-Row */}
            {expanded[branch.id] && (
              <div style={{
                borderTop: '1px dashed #bfdbfe',
                background: '#f0f7ff',
                padding: '12px 16px 12px 56px',
                display: 'flex',
                gap: 24,
                alignItems: 'center',
                flexWrap: 'wrap',
              }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#2563eb', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Contacts:</span>
                {branch.contacts.map((c, ci) => (
                  <a
                    key={ci}
                    href={`tel:${c.phone}`}
                    onClick={e => e.stopPropagation()}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      padding: '5px 14px', borderRadius: 99,
                      background: '#fff', border: '1px solid #bfdbfe',
                      color: '#1d4ed8', fontWeight: 600, fontSize: 13,
                      textDecoration: 'none',
                      boxShadow: '0 1px 3px rgba(37,99,235,0.08)',
                      transition: 'background 0.15s',
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13 19.79 19.79 0 0 1 1.61 4.44a2 2 0 0 1 1.99-2.18h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.07 6.07l.92-.92a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                    {c.phone}
                    <span style={{ fontSize: 10, color: '#60a5fa', fontWeight: 400 }}>({c.label})</span>
                  </a>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <p style={{ marginTop: 12, fontSize: 11, color: '#94a3b8', textAlign: 'right' }}>{filtered.length} of {BRANCHES.length} branches shown</p>
    </div>
  );
};

// ─── Vendor Dashboard Shell ───────────────────────────────────────────────
const VendorDashboard = () => {
  const location = useLocation();
  const titleMapWithInventory = { ...titleMap, '/vendor/inventory': 'Inventory Management' };
  const title = Object.entries(titleMapWithInventory).sort((a,b)=>b[0].length-a[0].length).find(([p])=>location.pathname===p || (p!=='/vendor'&&location.pathname.startsWith(p)))?.[1] || 'Vendor';

  return (
    <AppShell navLinks={navLinks} currentTitle={title} roleBadge="Vendor Portal">
      <Routes>
        <Route path="/" element={<VendorHome />} />
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/packages" element={<PackageList />} />
        <Route path="/packages/bulk" element={<PackageBulkUpload />} />
        <Route path="/finance" element={<Finance />} />
        <Route path="/history" element={<DeliveryHistory />} />
        <Route path="/branches" element={<BranchDirectory />} />
      </Routes>
    </AppShell>
  );
};

export default VendorDashboard;
