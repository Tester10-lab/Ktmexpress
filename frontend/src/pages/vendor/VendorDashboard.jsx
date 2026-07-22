import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import AppShell from '../../layouts/AppShell';
import MetricCard from '../../components/MetricCard';
import PrintLabel from '../../components/PrintLabel';
import Pagination from '../../components/Pagination';
import QrScanner from '../../components/QrScanner';
import TrackingLink from '../../components/TrackingLink';
import api from '../../api/axios';
import { useToast } from '../../store/ToastContext';
import PackageTimeline from '../../components/PackageTimeline';
import { useDeliveryCharge } from '../../hooks/useDeliveryCharge';
import {
  LayoutDashboard, Package, ShoppingBag, UploadCloud, 
  Wallet, History, Map, Plus, Search, CheckCircle2,
  XCircle, ArrowLeftRight, Clock, MapPin, Printer, 
  FileText, Eye, Edit2, AlertCircle, X, ChevronRight,
  Download, Phone, Trash2, Calendar, DollarSign, Receipt, AlertTriangle, ArrowUpRight, Camera
} from 'lucide-react';

const navLinks = [
  { name: 'Dashboard', path: '/vendor', exact: true, icon: <LayoutDashboard className="w-[18px] h-[18px]" /> },
  { name: 'My Orders', path: '/vendor/packages', icon: <Package className="w-[18px] h-[18px]" /> },
  { name: 'Products', path: '/vendor/products', icon: <ShoppingBag className="w-[18px] h-[18px]" /> },
  { name: 'Bulk Upload', path: '/vendor/packages/bulk', icon: <UploadCloud className="w-[18px] h-[18px]" /> },
  { name: 'Finance', path: '/vendor/finance', icon: <Wallet className="w-[18px] h-[18px]" /> },
  { name: 'Delivery History', path: '/vendor/history', icon: <History className="w-[18px] h-[18px]" /> },
  { name: 'Branch Directory', path: '/vendor/branches', icon: <Map className="w-[18px] h-[18px]" /> },
];

const titleMap = {
  '/vendor': 'Dashboard Overview',
  '/vendor/products': 'Product Management',
  '/vendor/packages/new': 'Create New Order',
  '/vendor/packages/bulk': 'Bulk Upload',
  '/vendor/packages': 'Order Management',
  '/vendor/finance': 'Finance & Payments',
  '/vendor/history': 'Delivery History',
  '/vendor/branches': 'Branch Directory',
};

function statusBadge(status) {
  const base = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border";
  const styles = {
    'Delivered': 'bg-emerald-50 text-emerald-700 border-emerald-200',
    'Cancelled': 'bg-red-50 text-red-700 border-red-200',
    'Returned to Vendor': 'bg-sky-50 text-sky-700 border-sky-200',
    'Returned': 'bg-sky-50 text-sky-700 border-sky-200',
    'Pending': 'bg-amber-50 text-amber-700 border-amber-200',
    'Pick Up Requested': 'bg-amber-50 text-amber-700 border-amber-200',
    'Picked Up': 'bg-brand-50 text-brand-700 border-brand-200',
    'In Warehouse': 'bg-brand-50 text-brand-700 border-brand-200',
    'Out for Delivery': 'bg-brand-50 text-brand-700 border-brand-200',
    'Postponed': 'bg-amber-50 text-amber-700 border-amber-200'
  };
  return <span className={`${base} ${styles[status] || 'bg-slate-100 text-slate-700 border-slate-200'}`}>{status}</span>;
}

const PackageRow = React.memo(({ pkg, isSelected, handleSelect, setViewPackageDetails, setCommentModal, setEditMode, setEditPackageId, setCreateForm, setDrawerOpen }) => {
  return (
    <tr className="hover:bg-slate-50 transition-colors">
      <td className="px-6 py-4">
        <input type="checkbox" className="rounded border-slate-300 text-brand-600 focus:ring-brand-500" checked={isSelected} onChange={()=>handleSelect(pkg._id)} disabled={pkg.status!=='Pending'}/>
      </td>
      <td className="px-6 py-4">
        <TrackingLink code={pkg.trackingCode} className="text-base" />
        <div className="text-xs text-slate-500 font-medium mt-0.5">{pkg.invoiceId || 'No Invoice'}</div>
      </td>
      <td className="px-6 py-4">
        <div className="font-bold text-slate-900">{pkg.customerName}</div>
        <div className="text-xs text-slate-500 mt-0.5 truncate max-w-[200px]">{pkg.city ? `${pkg.city}, ` : ''}{pkg.address}</div>
      </td>
      <td className="px-6 py-4">{statusBadge(pkg.status)}</td>
      <td className="px-6 py-4 font-bold text-brand-600">Rs. {pkg.amount}</td>
      <td className="px-6 py-4 text-slate-500 font-medium">{new Date(pkg.createdAt).toLocaleDateString()}</td>
      <td className="px-6 py-4 text-right">
        <div className="flex justify-end gap-1">
          <button onClick={()=>setViewPackageDetails(pkg)} className="p-2 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors" title="View details">
            <Eye className="w-4 h-4" />
          </button>
          <button onClick={()=>setCommentModal({open:true,packageId:pkg._id,text:'', isVerification: false})} className="p-2 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors" title="Add note">
            <FileText className="w-4 h-4" />
          </button>
          {['Delivered', 'Cancelled', 'Returned', 'Exchanged'].includes(pkg.status) && pkg.deliveryVerificationStatus !== 'Pending' && pkg.deliveryVerificationStatus !== 'Verified' && (
            <button onClick={()=>setCommentModal({open:true,packageId:pkg._id,text:'', isVerification: true})} className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors" title="Request Verification">
              <AlertCircle className="w-4 h-4" />
            </button>
          )}
          {pkg.status === 'Pending' && (
            <button onClick={() => {
              setEditMode(true);
              setEditPackageId(pkg._id);
              setCreateForm({
                branch: 'HEAD OFFICE',
                destinationBranch: pkg.city || '--------',
                customerName: pkg.customerName,
                customerPhone: pkg.customerPhone,
                altPhone: '',
                address: pkg.address,
                city: pkg.city || '',
                deliveryDate: pkg.deliveryDate || '',
                outOfValley: pkg.outOfValley || false,
                weight: pkg.weight || 1,
                deliveryCharge: pkg.deliveryCharge || 0,
                amount: pkg.amount || 0,
                packageAccess: pkg.packageAccess === 'open' ? 'Can Open' : 'Sealed',
                invoiceId: pkg.invoiceId || '',
                packageType: pkg.packageType || '',
                comments: pkg.comments || ''
              });
              setDrawerOpen(true);
            }} className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors" title="Edit Order">
              <Edit2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
});

// ─── Vendor Home ─────────────────────────────────────────────────────────
const VendorHome = () => {
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/vendor/dashboard').then(r => setStats(r.data.data || {})).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex justify-center items-center h-64 text-slate-500">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600 mr-3"></div>
      Loading dashboard...
    </div>
  );

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Welcome back 👋</h2>
          <p className="text-sm text-slate-500 mt-1">Here's your delivery overview</p>
        </div>
        <button className="btn-primary py-2.5 px-5 flex items-center gap-2" onClick={() => navigate('/vendor/packages/new')}>
          <Plus className="w-5 h-5" /> New Order
        </button>
      </div>

      {/* ─── Standard KPIs ─────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <div onClick={() => navigate('/vendor/packages')} className="cursor-pointer transition-transform hover:-translate-y-1">
          <MetricCard title="Today's Packages" value={stats.todayPkgs??0} color="primary" icon={<Package className="w-5 h-5 text-brand-600" />} />
        </div>
        <div onClick={() => navigate('/vendor/packages')} className="cursor-pointer transition-transform hover:-translate-y-1">
          <MetricCard title="Pending" value={stats.pending??0} color="warning" icon={<Clock className="w-5 h-5 text-amber-600" />} />
        </div>
        <div onClick={() => navigate('/vendor/history')} className="cursor-pointer transition-transform hover:-translate-y-1">
          <MetricCard title="Delivered" value={stats.delivered??0} color="success" icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />} />
        </div>
        <div onClick={() => navigate('/vendor/history')} className="cursor-pointer transition-transform hover:-translate-y-1">
          <MetricCard title="Returned" value={stats.returned??0} color="danger" icon={<ArrowLeftRight className="w-5 h-5 text-red-600" />} />
        </div>
        <div onClick={() => navigate('/vendor/packages')} className="cursor-pointer transition-transform hover:-translate-y-1">
          <MetricCard title="Pickup Requests" value={stats.pickupRequests??0} color="info" icon={<MapPin className="w-5 h-5 text-sky-600" />} />
        </div>
      </div>

      {/* ─── Settlement KPIs ───────────────────────────────────── */}
      <div>
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 mt-8 flex items-center gap-2">
          <Wallet className="w-4 h-4" /> Settlement Overview
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <MetricCard title="Today's Sales" value={`Rs. ${(stats.todaySales??0).toLocaleString()}`} color="primary" icon={<Package className="w-5 h-5 text-brand-600" />} />
          <MetricCard title="Today's COD" value={`Rs. ${(stats.todayCOD??0).toLocaleString()}`} color="info" icon={<DollarSign className="w-5 h-5 text-sky-600" />} />
          <MetricCard title="Delivery Charges" value={`Rs. ${(stats.deliveryCharges??0).toLocaleString()}`} color="danger" icon={<Receipt className="w-5 h-5 text-red-600" />} />
          <MetricCard title="Total Receivable" value={`Rs. ${(stats.amountReceivable??0).toLocaleString()}`} color="success" icon={<ArrowUpRight className="w-5 h-5 text-emerald-600" />} />
          <MetricCard title="Total Paid" value={`Rs. ${(stats.paid??0).toLocaleString()}`} color="purple" icon={<CheckCircle2 className="w-5 h-5 text-purple-600" />} />
          <MetricCard title="Pending Settlement" value={`Rs. ${(stats.pendingSettlement??0).toLocaleString()}`} color="warning" icon={<AlertTriangle className="w-5 h-5 text-amber-600" />} />
        </div>
      </div>

      <div className="card-premium">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <h3 className="font-bold text-slate-800 text-lg">Quick Actions</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              {label:'Bulk Upload CSV',path:'/vendor/packages/bulk',bgColor:'bg-brand-50 hover:bg-brand-100',textColor:'text-brand-700', icon: <UploadCloud className="w-8 h-8 mb-2 opacity-80" />},
              {label:'Request Pickup',path:'/vendor/packages',bgColor:'bg-emerald-50 hover:bg-emerald-100',textColor:'text-emerald-700', icon: <MapPin className="w-8 h-8 mb-2 opacity-80" />},
              {label:'View Finance',path:'/vendor/finance',bgColor:'bg-purple-50 hover:bg-purple-100',textColor:'text-purple-700', icon: <Wallet className="w-8 h-8 mb-2 opacity-80" />},
              {label:'Delivery History',path:'/vendor/history',bgColor:'bg-amber-50 hover:bg-amber-100',textColor:'text-amber-700', icon: <History className="w-8 h-8 mb-2 opacity-80" />},
            ].map(a => (
              <button key={a.label} onClick={() => navigate(a.path)} className={`flex flex-col items-center justify-center p-6 rounded-xl transition-all duration-200 border border-transparent hover:border-black/5 ${a.bgColor} ${a.textColor}`}>
                {a.icon}
                <span className="font-bold text-sm tracking-wide">{a.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Searchable Dropdown ──────────────────────────────────────────────────
const inputClass = "input-field w-full text-base py-2.5";
const labelClass = "block text-sm font-semibold text-slate-700 mb-1.5";

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
        <ChevronRight className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-90' : ''} pointer-events-none`} />
      </div>
      {isOpen && (
        <div className="absolute top-full left-0 right-0 z-50 bg-white border border-slate-200 rounded-xl shadow-xl max-h-60 overflow-y-auto mt-2 animate-in fade-in zoom-in-95 duration-100">
          {filteredOptions.length > 0 ? filteredOptions.map((opt, i) => (
            <div key={i} onClick={() => { onChange({ target: { name, value: opt } }); setSearch(''); setIsOpen(false); }} className={`px-4 py-3 text-sm cursor-pointer border-b border-slate-50 last:border-0 hover:bg-brand-50 transition-colors ${value === opt ? 'bg-brand-50 text-brand-700 font-bold' : 'text-slate-700 font-medium'}`}>
              {opt}
            </div>
          )) : <div className="px-4 py-3 text-sm text-slate-400 italic">No options found</div>}
        </div>
      )}
    </div>
  );
};

const SIMPLE_BRANCHES = ['HEAD OFFICE', 'Kathmandu Branch', 'Pokhara Branch', 'Chitwan Branch', 'Lalitpur Branch', 'Bhaktapur Branch', 'Dharan Branch', 'Biratnagar Branch'];
const PICKUP_POINTS = ['Koteshwor Hub', 'Baneshwor Hub', 'Thamel Hub', 'Patan Hub', 'Boudha Hub'];
const KATHMANDU_VALLEY_AREAS = ['Kathmandu', 'Lalitpur', 'Bhaktapur', 'Thamel', 'Patan', 'Boudha', 'Koteshwor', 'Baneshwor', 'Balaju', 'Kirtipur', 'Thankot', 'Budhanilkantha'];
const OUT_OF_VALLEY_CITIES = ["Argakhachi (Sandhikharka)","Arun Khola (East Nawalparasi)","Attariya (Kailali)","Baglung","Bajura (Kolti)","Banepa (Kavre)","Baniyani (Jhapa)","Bansagadhi (Bardiya)","Bardaghat (Nawalparasi)","Bardibas","Battar Bazar (Nuwakot)","Bauniya (Kailali)","Belauri (Kanchanpur)","Belbari (Morang)","Beltar (Udayapur)","Beni","Bhadrapur (Jhapa)","Bhairahawa","Bhajani (Kailali)","Bhalubang (Dang)","Bhojpur","Bhurigoan (Bardiya)","Bidur (Nuwakot)","Biratchowk (Morang)","Biratnagar","Birgunj","Birtamod (Jhapa)","Budhabare (Jhapa)","Burtibang (Baglung)","Butwal","Chainpur (Bajhang)","Chainpur (Sankhuwasawa)","Chandranigahapur (Rautahat)","Chandrauta (Kapilvastu)","Charaali (Jhapa)","Charikot (Dolakha)","Chinchu (Bheri)","Chisapani (Kailali)","Chormara (East Nawalparasi)","Dadeldhura (Amargadi)","Dailekh Bazar","Daldale (East Nawalparasi)","Damak (Jhapa)","Damauli","Darchula (Khalanga)","Dhading (Besi)","Dhalkebar (Dhanusa)","Dhangadhi (Sudur Paschim)","Dhankuta","Dharan","Dhulabari (Jhapa)","Dhulikhel","Diktel Bazaar (Khotang)","Dipayal Bazar (Doti)","Dodhara Chadani (Kanchanpur)","Dudhauli (Sindhuli)","Duhabi (Sunsari)","Dullu (Dailekh)","Dumkibas (East Nawalparasi)","Dumre","Fikkal","Gaidakot (Nawalparasi East)","Gaighat (Udayapur)","Galkot (Baglung)","Gaur (Rautahat)","Gauradaha (Jhapa)","Gauriganj (Jhapa)","Gaushala (Mahottari)","Ghorahi (Dang)","Gokuleswor (Darchula)","Gorkha (Palungtar)","Gorkha Bazaar","Gothlapani (Baitadi)","Gulariya (Bardiya)","Gulmi (Tamghas)","Haldibari (Jhapa)","Hariwan (Sarlahi)","Hemja (Pokhara)","Hetauda","Hile Bazar (Dhankuta)","Ilam Bazaar","Inaruwa (Sunsari)","Itahari","Jajarkot","Jaleshwor (Mahottari)","Janakpur","Jeetpur (Bara)","Jeetpur No.4 (Kapilvastu)","Jhalari (Kanchanpur)","Jirikhimti (Terahthum)","Jogikuti (Rupandehi)","Jomsom","Joshipur (Kailali)","Jumla (Khalanga)"];

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
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [pagination, setPagination] = useState(null);
  const [selected, setSelected] = useState([]);
  const [commentModal, setCommentModal] = useState({open:false,packageId:null,text:'', isVerification: false, verificationReason: ''});
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [createForm, setCreateForm] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [createLoading, setCreateLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editPackageId, setEditPackageId] = useState(null);
  const [successModal, setSuccessModal] = useState(null);
  const [viewPackageDetails, setViewPackageDetails] = useState(null);
  const [printPackages, setPrintPackages] = useState([]);
  const [scannerOpen, setScannerOpen] = useState(false);
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
    createForm.weight,
    createForm.city
  );

  // Sync fetched charge into form state
  useEffect(() => {
    if (fetchedCharge !== null && fetchedCharge !== undefined) {
      setCreateForm(prev => ({ ...prev, deliveryCharge: fetchedCharge }));
    }
  }, [fetchedCharge]);

  const fetchPackages = async (silent = false) => {
    if (!silent) setLoading(true);
    try { 
      let url = `/vendor/packages?status=${encodeURIComponent(statusFilter)}&search=${encodeURIComponent(search)}&page=${page}&limit=${limit}`;
      if (startDate) url += `&startDate=${startDate}`;
      if (endDate) url += `&endDate=${endDate}`;
      const r = await api.get(url); 
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
  }, [search, statusFilter, startDate, endDate, page, limit]);

  // Reset page when search or filter changes
  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, startDate, endDate]);

  const handleScanSuccess = async (trackingCode) => {
    try {
      const r = await api.get(`packages/track/${trackingCode}`);
      setViewPackageDetails(r.data.data);
      setScannerOpen(false);
      showToast('Package found', 'success');
    } catch (e) {
      showToast(e.message || 'Package not found', 'error');
    }
  };

  const handleSelectAll = e => setSelected(e.target.checked ? packages.filter(p=>p.status==='Pending').map(p=>p._id) : []);
  const handleSelect = id => setSelected(s => s.includes(id) ? s.filter(x=>x!==id) : [...s,id]);

  const requestPickup = async () => {
    if (!selected.length) return;
    
    // Optimistic Update
    setPackages(prev => prev.map(p => selected.includes(p._id) ? { ...p, status: 'Pick Up Requested' } : p));
    
    try { 
      await api.post('/vendor/pickup-request',{packageIds:selected}); 
      showToast('Pickup requested!','success'); 
      setSelected([]); 
      fetchPackages(true); 
    }
    catch(e) { 
      showToast(e.message||'Failed to request pickup','error'); 
      fetchPackages(true);
    }
  };

  const addComment = async e => {
    e.preventDefault();
    try { 
      if (commentModal.isVerification) {
        const payloadReason = commentModal.verificationReason === 'Other' ? commentModal.text : commentModal.verificationReason;
        await api.post(`/packages/${commentModal.packageId}/request-verification`, { reason: payloadReason });
        showToast('Verification requested successfully', 'success');
      } else {
        await api.post(`/vendor/packages/${commentModal.packageId}/comments`,{text:commentModal.text}); 
        showToast('Comment saved','success'); 
      }
      setCommentModal({open:false,packageId:null,text:'', isVerification: false}); 
      fetchPackages(true); 
    }
    catch (err) { showToast(err.response?.data?.message || 'Failed to complete action','error'); }
  };

  const handleFormChange = e => {
    const { name, value, type, checked } = e.target;
    const finalValue = type === 'checkbox' ? checked : value;
    
    setCreateForm(f => {
      const next = { ...f, [name]: finalValue };
      // IF package_amount = 0 THEN vendor_delivery_charge = applicable_delivery_fee
      if (name === 'amount' && Number(finalValue) === 0 && fetchedCharge !== null) {
        next.deliveryCharge = fetchedCharge;
      }
      return next;
    });
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
        packageAccess: createForm.packageAccess === 'Can Open' ? 'open' : 'sealed',
        comments: createForm.comments,
        packageType: createForm.packageType
      };
      
      if (editMode) {
        await api.put(`/vendor/packages/${editPackageId}`, payload);
        showToast('Order updated successfully', 'success');
        setDrawerOpen(false);
      } else {
        const res = await api.post('/vendor/packages', payload);
        const pkg = res.data.data;
        
        if (!keepOpen) {
          setDrawerOpen(false);
          setSuccessModal({ trackingCode: pkg.trackingCode, customerName: pkg.customerName });
        } else {
          showToast(`✓ Order created! Tracking: ${pkg.trackingCode}`, 'success');
        }
      }
      
      if (!editMode) setCreateForm(EMPTY_FORM);
      fetchPackages(true);
    } catch (err) {
      const msg = err.message || (editMode ? 'Failed to update order' : 'Failed to create order');
      showToast(msg, 'error');
      console.error('Submit order error:', err.errors || err.message);
    } finally { setCreateLoading(false); }
  };

  const f = createForm;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* ── Header row ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            My Orders 
            {pagination?.total !== undefined && (
              <span className="text-base font-semibold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
                {pagination.total}
              </span>
            )}
          </h2>
          <p className="text-sm text-slate-500 mt-1">Manage and track all your delivery packages</p>
        </div>
        <div className="flex flex-wrap gap-3">
          {selected.length > 0 && (
            <>
              <button className="btn-secondary flex items-center gap-2" onClick={requestPickup}>
                <MapPin className="w-4 h-4" /> Request Pickup ({selected.length})
              </button>
              <button className="btn-secondary flex items-center gap-2" onClick={() => {
                const selectedPkgs = packages.filter(p => selected.includes(p._id));
                setPrintPackages(selectedPkgs);
                setTimeout(() => window.print(), 200);
              }}>
                <Printer className="w-4 h-4" /> Print Labels ({selected.length})
              </button>
            </>
          )}
          <button className="btn-secondary py-2 px-4 flex items-center gap-2" onClick={() => setScannerOpen(true)}>
            <Camera className="w-5 h-5" /> Scan to Track
          </button>
          <button className="btn-primary py-2 px-4 flex items-center gap-2" onClick={() => { setEditMode(false); setEditPackageId(null); setCreateForm(EMPTY_FORM); setDrawerOpen(true); }}>
            <Plus className="w-5 h-5" /> New Order
          </button>
        </div>
      </div>

      <div className="card-premium p-4">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input type="text" className="input-field pl-9 w-full" placeholder="Search tracking, name, invoice..." value={search} onChange={e=>setSearch(e.target.value)}/>
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <input type="date" className="input-field w-full md:w-36 text-sm" value={startDate} onChange={e=>setStartDate(e.target.value)} title="Start Date"/>
            <span className="text-slate-400">-</span>
            <input type="date" className="input-field w-full md:w-36 text-sm" value={endDate} onChange={e=>setEndDate(e.target.value)} title="End Date"/>
          </div>
          <select className="input-field w-full md:w-48 text-sm" value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}>
            <option value="all">All Statuses</option>
            {['Pending','Pick Up Requested','In Warehouse','Out for Delivery','Delivered','Cancelled','Returned to Vendor'].map(s=><option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <div className="card-premium overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-xs">
              <tr>
                <th className="px-6 py-3 w-12">
                  <input type="checkbox" className="rounded border-slate-300 text-brand-600 focus:ring-brand-500" onChange={handleSelectAll} checked={selected.length>0 && selected.length===packages.filter(p=>p.status==='Pending').length}/>
                </th>
                <th className="px-6 py-3">Tracking / Invoice</th>
                <th className="px-6 py-3">Customer</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Amount</th>
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {loading ? <tr><td colSpan="7" className="px-6 py-12 text-center text-slate-500"><div className="flex justify-center items-center"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-600 mr-2"></div>Loading...</div></td></tr>
              : packages.length===0 ? <tr><td colSpan="7" className="px-6 py-12 text-center text-slate-500">No packages found. <button className="text-brand-600 font-semibold ml-2 hover:underline" onClick={()=>setDrawerOpen(true)}>+ Create First Order</button></td></tr>
              : packages.map(pkg => (
                <PackageRow 
                  key={pkg._id} 
                  pkg={pkg} 
                  isSelected={selected.includes(pkg._id)}
                  handleSelect={handleSelect}
                  setViewPackageDetails={setViewPackageDetails}
                  setCommentModal={setCommentModal}
                  setEditMode={setEditMode}
                  setEditPackageId={setEditPackageId}
                  setCreateForm={setCreateForm}
                  setDrawerOpen={setDrawerOpen}
                />
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn" onClick={() => setCommentModal({open:false,packageId:null,text:'', verificationReason: '', isVerification: false})}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-scaleIn" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-bold text-slate-900 text-lg">{commentModal.isVerification ? "Request Verification" : "Add Note / Comment"}</h3>
              <button onClick={() => setCommentModal({open:false,packageId:null,text:'', verificationReason: '', isVerification: false})} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <form onSubmit={addComment}>
                {commentModal.isVerification ? (
                  <>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">Reason for Verification <span className="text-red-500">*</span></label>
                      <select 
                        className="input-field mb-4" 
                        value={commentModal.verificationReason || ''} 
                        onChange={e => setCommentModal(m => ({ ...m, verificationReason: e.target.value, text: e.target.value === 'Other' ? '' : e.target.value }))}
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
                    {commentModal.verificationReason === 'Other' && (
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Additional Details <span className="text-red-500">*</span></label>
                        <textarea className="input-field min-h-[100px]" placeholder="Please specify the reason..." value={commentModal.text} onChange={e=>setCommentModal(m=>({...m,text:e.target.value}))} required/>
                      </div>
                    )}
                  </>
                ) : (
                  <div>
                    <label className={labelClass}>Note for dispatcher/rider</label>
                    <textarea className="input-field" rows="4" value={commentModal.text} onChange={e => setCommentModal(m => ({...m,text:e.target.value}))} placeholder="Enter instructions or notes..." required />
                  </div>
                )}
                <div className="flex justify-end gap-3 mt-6">
                  <button type="button" className="btn-secondary" onClick={() => setCommentModal({open:false,packageId:null,text:'', verificationReason: '', isVerification: false})}>Cancel</button>
                  <button type="submit" className="btn-primary">{commentModal.isVerification ? "Request Verification" : "Save Comment"}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      
      {/* Scanner Modal */}
      {scannerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn" onClick={() => setScannerOpen(false)}>
          <div className="w-full max-w-md h-[90vh] sm:h-auto max-h-[800px]" onClick={e => e.stopPropagation()}>
            <QrScanner onScanSuccess={handleScanSuccess} onClose={() => setScannerOpen(false)} />
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {viewPackageDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn" onClick={() => setViewPackageDetails(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-scaleIn" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-start bg-slate-50/50 shrink-0">
              <div>
                <h3 className="font-bold text-slate-900 text-lg">Package Details</h3>
                <p className="text-sm text-slate-500 mt-1">Tracking Code: <TrackingLink code={viewPackageDetails.trackingCode} /></p>
              </div>
              <button onClick={() => setViewPackageDetails(null)} className="text-slate-400 hover:text-slate-600 transition-colors p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 space-y-6 bg-slate-50/30">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Customer Info */}
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Customer Details</h4>
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <p className="font-bold text-slate-900 mb-2 text-base">
                      {viewPackageDetails.originalValues?.customerName && (
                        <span className="line-through text-slate-400 mr-2 text-sm">{viewPackageDetails.originalValues.customerName}</span>
                      )}
                      {viewPackageDetails.customerName}
                    </p>
                    <p className="text-sm text-slate-600 mb-1 flex items-center gap-2">
                      <Phone className="w-4 h-4 text-slate-400"/> 
                      {viewPackageDetails.originalValues?.customerPhone && (
                        <span className="line-through text-slate-400 mr-1">{viewPackageDetails.originalValues.customerPhone}</span>
                      )}
                      {viewPackageDetails.customerPhone}
                    </p>
                    <p className="text-sm text-slate-600 flex items-start gap-2 mt-2">
                      <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5"/> 
                      {viewPackageDetails.originalValues?.address && (
                        <span className="line-through text-slate-400 mr-1 block">
                          {viewPackageDetails.originalValues.city ? `${viewPackageDetails.originalValues.city}, ` : ''}{viewPackageDetails.originalValues.address}
                        </span>
                      )}
                      <span>{viewPackageDetails.city ? `${viewPackageDetails.city}, ` : ''}{viewPackageDetails.address}</span>
                    </p>
                  </div>
                </div>
                {/* Order Financials */}
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Financials</h4>
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-50">
                      <span className="text-sm text-slate-500 font-medium">COD Amount</span>
                      <span className="font-bold text-brand-600 text-lg flex items-center gap-2">
                        {viewPackageDetails.originalValues?.amount !== undefined && (
                          <span className="line-through text-slate-400 text-sm font-normal">Rs. {viewPackageDetails.originalValues.amount}</span>
                        )}
                        Rs. {viewPackageDetails.amount}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pb-2 border-b border-slate-50">
                      <span className="text-sm text-slate-500 font-medium">Delivery Charge</span>
                      <span className="font-bold text-slate-700 flex items-center gap-2">
                        {viewPackageDetails.originalValues?.deliveryCharge !== undefined && (
                          <span className="line-through text-slate-400 text-xs font-normal">Rs. {viewPackageDetails.originalValues.deliveryCharge}</span>
                        )}
                        Rs. {viewPackageDetails.deliveryCharge}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-500 font-medium">Status</span>
                      {statusBadge(viewPackageDetails.status)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Package Meta */}
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Package Info</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <div><div className="text-xs font-medium text-slate-500 mb-1">Weight</div><div className="font-bold text-slate-900">{viewPackageDetails.weight} kg</div></div>
                  <div><div className="text-xs font-medium text-slate-500 mb-1">Package Type</div><div className="font-bold text-slate-900 truncate" title={viewPackageDetails.packageType}>{viewPackageDetails.packageType || 'N/A'}</div></div>
                  <div><div className="text-xs font-medium text-slate-500 mb-1">Invoice ID</div><div className="font-bold text-slate-900">{viewPackageDetails.invoiceId || 'N/A'}</div></div>
                  <div><div className="text-xs font-medium text-slate-500 mb-1">Destination</div><div className="font-bold text-slate-900 truncate" title={viewPackageDetails.destinationBranch}>{viewPackageDetails.destinationBranch || 'N/A'}</div></div>
                  <div><div className="text-xs font-medium text-slate-500 mb-1">Access</div><div className="font-bold text-slate-900">{viewPackageDetails.packageAccess || 'Sealed'}</div></div>
                  <div><div className="text-xs font-medium text-slate-500 mb-1">Created Date</div><div className="font-bold text-slate-900">{new Date(viewPackageDetails.createdAt).toLocaleDateString()}</div></div>
                </div>
              </div>

              {/* Package Timeline & Comment Section */}
              <div className="pt-2">
                <PackageTimeline 
                  pkg={viewPackageDetails} 
                  onCommentAdded={(updatedPkg) => setViewPackageDetails(updatedPkg)} 
                />
              </div>
              
              {/* QR Code & Barcode */}
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Scan / Label</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center col-span-1">
                    <span className="text-xs font-bold text-slate-500 uppercase mb-3">QR Code</span>
                    <img
                      src={viewPackageDetails.qrCodeUrl || `https://api.qrserver.com/v1/create-qr-code/?size=140x140&ecc=M&data=${encodeURIComponent('http://localhost:5173/track?code='+viewPackageDetails.trackingCode)}`}
                      alt="QR Code" width="120" height="120" className="border border-slate-200 rounded-lg shadow-sm"
                    />
                    <a
                      href={viewPackageDetails.qrCodeUrl || `https://api.qrserver.com/v1/create-qr-code/?size=300x300&ecc=M&data=${encodeURIComponent('http://localhost:5173/track?code='+viewPackageDetails.trackingCode)}`}
                      download={`QR-${viewPackageDetails.trackingCode}.png`} target="_blank" rel="noreferrer"
                      className="mt-4 btn-secondary btn-sm w-full flex justify-center items-center gap-1.5">
                      <Download className="w-3.5 h-3.5" /> Download
                    </a>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center col-span-1 sm:col-span-2">
                    <span className="text-xs font-bold text-slate-500 uppercase mb-3">Code 128 Barcode</span>
                    <img
                      src={viewPackageDetails.barcodeUrl || `https://barcodeapi.org/api/128/${viewPackageDetails.trackingCode}`}
                      alt="Barcode" className="h-16 w-full object-contain border border-slate-200 rounded-lg p-2 bg-white shadow-sm max-w-[300px]"
                    />
                    <div className="flex gap-2 w-full mt-4 max-w-[300px]">
                      <a
                        href={viewPackageDetails.barcodeUrl || `https://barcodeapi.org/api/128/${viewPackageDetails.trackingCode}`}
                        download={`Barcode-${viewPackageDetails.trackingCode}.png`} target="_blank" rel="noreferrer"
                        className="btn-secondary btn-sm flex-1 flex justify-center items-center gap-1.5">
                        <Download className="w-3.5 h-3.5" /> Download
                      </a>
                      <button className="btn-primary btn-sm flex-1 flex justify-center items-center gap-1.5" onClick={() => {
                        setPrintPackages([viewPackageDetails]);
                        setTimeout(() => window.print(), 200);
                      }}>
                        <Printer className="w-3.5 h-3.5" /> Print Label
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl h-full max-h-[90vh] flex flex-col overflow-hidden animate-scaleIn">
            
            {/* Modal header */}
            <div className="px-6 py-5 border-b border-slate-100 flex items-start justify-between bg-white shrink-0 shadow-sm relative z-10">
              <div>
                <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <Package className="w-6 h-6 text-brand-600" />
                  {editMode ? 'Edit Order' : 'Create new order'}
                </h3>
                <p className="text-sm text-slate-500 mt-1.5">{editMode ? 'Update order details before dispatch' : 'A unique 7-digit tracking code will be generated on save'}</p>
              </div>
              <button className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors" onClick={() => setDrawerOpen(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal body / form */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-slate-50/50">
              <form id="create-order-form" className="space-y-8 max-w-2xl mx-auto">
                
                {/* 1. RECIPIENT */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-brand-100 text-brand-700 text-xs font-bold">1</span>
                    <h4 className="text-sm font-bold text-brand-700 uppercase tracking-wider">Recipient Details</h4>
                  </div>
                  
                  <div className="space-y-5">
                    <div>
                      <label className={labelClass}>Full name <span className="text-red-500">*</span></label>
                      <input type="text" name="customerName" value={f.customerName} onChange={handleFormChange} className="input-field" placeholder="Enter recipient's full name" />
                      {formErrors.customerName && <span className="text-xs text-red-500 mt-1.5 block font-medium">{formErrors.customerName}</span>}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label className={labelClass}>Contact number <span className="text-red-500">*</span></label>
                        <input type="tel" name="customerPhone" value={f.customerPhone} onChange={handleFormChange} className="input-field" placeholder="98XXXXXXXX" />
                        {formErrors.customerPhone && <span className="text-xs text-red-500 mt-1.5 block font-medium">{formErrors.customerPhone}</span>}
                      </div>
                      <div>
                        <label className={labelClass}>Alt. contact number</label>
                        <input type="tel" name="altPhone" value={f.altPhone || ''} onChange={handleFormChange} className="input-field" placeholder="98XXXXXXXX (optional)" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. DELIVERY */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-brand-100 text-brand-700 text-xs font-bold">2</span>
                    <h4 className="text-sm font-bold text-brand-700 uppercase tracking-wider">Delivery Info</h4>
                  </div>
                  
                  <div className="space-y-5">
                    <div>
                      <label className={labelClass}>Full delivery address <span className="text-red-500">*</span></label>
                      <input type="text" name="address" value={f.address} onChange={handleFormChange} className="input-field" placeholder="Street, landmark, ward no..." />
                      {formErrors.address && <span className="text-xs text-red-500 mt-1.5 block font-medium">{formErrors.address}</span>}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label className={labelClass}>City / Branch <span className="text-red-500">*</span></label>
                        <SearchableDropdown name="destinationBranch" value={f.destinationBranch} onChange={handleFormChange} options={SIMPLE_BRANCHES} placeholder="Select nearest branch" />
                        {formErrors.destinationBranch && <span className="text-xs text-red-500 mt-1.5 block font-medium">{formErrors.destinationBranch}</span>}
                      </div>
                      <div>
                        <label className={labelClass}>Area / Sub-city</label>
                        <SearchableDropdown name="city" value={f.city} onChange={handleFormChange} options={f.destinationBranch === 'HEAD OFFICE' ? KATHMANDU_VALLEY_AREAS : OUT_OF_VALLEY_CITIES} placeholder="Select area" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. PACKAGE */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-brand-100 text-brand-700 text-xs font-bold">3</span>
                    <h4 className="text-sm font-bold text-brand-700 uppercase tracking-wider">Package Details</h4>
                  </div>
                  
                  <div className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label className={labelClass}>Invoice / Order ID</label>
                        <input type="text" name="invoiceId" value={f.invoiceId} onChange={handleFormChange} className="input-field" placeholder="#INV-0000" />
                      </div>
                      <div>
                        <label className={labelClass}>Scheduled Date</label>
                        <input type="date" name="deliveryDate" value={f.deliveryDate} onChange={handleFormChange} className="input-field" />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label className={labelClass}>Weight (kg) <span className="text-red-500">*</span></label>
                        <div className="relative">
                          <input type="number" step="0.1" name="weight" value={f.weight} onChange={handleFormChange} className="input-field pr-10" placeholder="0.0" />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-sm pointer-events-none">kg</span>
                        </div>
                        {formErrors.weight && <span className="text-xs text-red-500 mt-1.5 block font-medium">{formErrors.weight}</span>}
                      </div>
                      <div>
                        <label className={labelClass}>Package access <span className="text-red-500">*</span></label>
                        <div className="flex gap-2">
                          <button type="button" onClick={() => handleFormChange({target:{name:'packageAccess',value:'Sealed'}})} className={`flex-1 py-2.5 px-3 rounded-xl border text-sm font-bold transition-colors flex justify-center items-center gap-2 ${f.packageAccess === 'Sealed' ? 'bg-brand-50 border-brand-200 text-brand-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                            <Package className="w-4 h-4" /> Sealed
                          </button>
                          <button type="button" onClick={() => handleFormChange({target:{name:'packageAccess',value:'Can Open'}})} className={`flex-1 py-2.5 px-3 rounded-xl border text-sm font-bold transition-colors flex justify-center items-center gap-2 ${f.packageAccess === 'Can Open' ? 'bg-brand-50 border-brand-200 text-brand-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                            <Eye className="w-4 h-4" /> Open
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 p-4 bg-slate-50 border border-slate-100 rounded-xl">
                      <div>
                        <label className={labelClass}>Product price (Rs.) <span className="text-red-500">*</span></label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-medium text-sm pointer-events-none">Rs.</span>
                          <input type="number" name="amount" value={f.amount} onChange={handleFormChange} className="input-field pl-9" />
                        </div>
                        {formErrors.amount && <span className="text-xs text-red-500 mt-1.5 block font-medium">{formErrors.amount}</span>}
                      </div>
                      <div>
                        <label className={`${labelClass} flex items-center justify-between`}>
                          <span>Delivery charges (Rs.)</span>
                          {chargeLoading && <span className="text-slate-400 text-xs font-normal animate-pulse">Calculating...</span>}
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-medium text-sm pointer-events-none">Rs.</span>
                          <input 
                            type="number" 
                            name="deliveryCharge" 
                            value={f.deliveryCharge} 
                            onChange={handleFormChange} 
                            disabled={Number(f.amount) === 0}
                            className={`input-field pl-9 ${chargeError ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' : ''} ${Number(f.amount) === 0 ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : ''}`} 
                          />
                        </div>
                        {chargeError && <span className="text-xs text-amber-600 mt-1.5 block font-medium">{chargeError}</span>}
                        {formErrors.deliveryCharge && <span className="text-xs text-red-500 mt-1.5 block font-medium">{formErrors.deliveryCharge}</span>}
                      </div>
                    </div>

                    <div>
                      <label className={labelClass}>Product details <span className="text-red-500">*</span></label>
                      <input type="text" name="packageType" value={f.packageType} onChange={handleFormChange} className="input-field" placeholder="Describe the product (e.g., T-shirt, Shoes)..." />
                      {formErrors.packageType && <span className="text-xs text-red-500 mt-1.5 block font-medium">{formErrors.packageType}</span>}
                    </div>

                    <div>
                      <label className={labelClass}>Remarks / Special instructions</label>
                      <textarea name="comments" value={f.comments} onChange={handleFormChange} className="input-field min-h-[80px] py-3" placeholder="Any special instructions for the rider..."></textarea>
                    </div>
                  </div>
                </div>

              </form>
            </div>

            {/* Modal footer */}
            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex flex-col-reverse sm:flex-row items-center justify-end gap-3 shrink-0">
              <button type="button" className="btn-secondary w-full sm:w-auto" onClick={() => setDrawerOpen(false)}>
                Cancel
              </button>
              {!editMode && (
                <button type="button" onClick={(e) => handleCreateSubmit(e, true)} className="btn-outline w-full sm:w-auto flex justify-center items-center gap-2" disabled={createLoading}>
                  Add & create another
                </button>
              )}
              <button type="button" onClick={(e) => handleCreateSubmit(e, false)} className="btn-primary w-full sm:w-auto flex justify-center items-center gap-2" disabled={createLoading}>
                {createLoading ? (
                  <><div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div> {editMode ? 'Updating...' : 'Creating...'}</>
                ) : (
                  <>{editMode ? 'Update Order' : 'Create order & get tracking code'}</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Success Modal ── */}
      {successModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 text-center animate-scaleIn" onClick={e => e.stopPropagation()}>
            <div className="w-20 h-20 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Order Created!</h2>
            <p className="text-slate-500 mb-8">Package for <strong className="text-slate-700">{successModal.customerName}</strong> is now pending dispatch.</p>
            
            <div className="bg-gradient-to-br from-brand-600 to-indigo-700 rounded-xl p-6 mb-6 shadow-lg relative overflow-hidden">
              {/* Decorative background pattern */}
              <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white opacity-10 rounded-full blur-xl"></div>
              <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-24 h-24 bg-black opacity-10 rounded-full blur-xl"></div>
              
              <p className="text-brand-100 text-xs font-bold uppercase tracking-widest mb-2 relative z-10">Tracking Code</p>
              <div className="text-4xl font-black text-white tracking-[0.2em] font-mono relative z-10"><TrackingLink code={successModal.trackingCode} className="bg-transparent border-none text-white hover:bg-white/10" /></div>
              <p className="text-brand-200 text-xs mt-3 relative z-10">Share with recipient to track delivery</p>
            </div>
            
            <button className="btn-outline w-full mb-4 flex justify-center items-center gap-2 py-3 border-2" onClick={() => { navigator.clipboard.writeText(successModal.trackingCode); showToast('Copied to clipboard!', 'success'); }}>
              Copy Tracking Code
            </button>
            <div className="flex gap-3">
              <button className="btn-secondary flex-1 py-3" onClick={() => { setSuccessModal(null); setCreateForm(EMPTY_FORM); setDrawerOpen(true); }}>+ Create Another</button>
              <button className="btn-primary flex-1 py-3" onClick={() => setSuccessModal(null)}>Done</button>
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
      const data = r.data;
      if (data.failedCount > 0) {
        setResult({
          success: data.importedCount > 0,
          partial: true,
          message: data.message,
          importedCount: data.importedCount,
          failedCount: data.failedCount,
          failedRows: data.failedRows
        });
        if (data.importedCount > 0) {
          showToast(`Imported ${data.importedCount} packages successfully. ${data.failedCount} failed.`,'warning');
        } else {
          showToast(`Upload failed. All ${data.failedCount} rows had errors.`,'error');
        }
      } else {
        setResult({
          success: true,
          message: data.message || `Successfully uploaded ${data.importedCount} packages.`
        });
        showToast(`${data.importedCount} packages created!`,'success');
      }
      setFile(null);
    } catch(e) {
      setResult({success:false, message:e.message||'Upload failed'});
      showToast('Upload failed','error');
    } finally { setLoading(false); }
  };

  return (
    <div className="max-w-3xl mx-auto animate-fadeIn">
      <div className="card-premium">
        <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50">
          <h3 className="font-bold text-slate-900 text-lg">Bulk Order Upload</h3>
          <p className="text-sm text-slate-500 mt-1">Upload a CSV file to create multiple orders at once. Max 500 rows.</p>
        </div>
        <div className="p-8">
          <div className={`border-2 border-dashed rounded-2xl p-12 text-center transition-colors ${file ? 'border-brand-300 bg-brand-50/50' : 'border-slate-200 hover:border-brand-300 hover:bg-slate-50'}`}>
            <UploadCloud className={`w-16 h-16 mx-auto mb-4 ${file ? 'text-brand-500' : 'text-slate-300'}`} />
            <h3 className="text-lg font-bold text-slate-800 mb-2">{file ? 'File Selected' : 'Upload CSV File'}</h3>
            <p className="text-sm text-slate-500 mb-6 max-w-md mx-auto">
              Required columns: <code className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-mono text-xs font-semibold">Customer Name, Customer Phone, Address, Amount</code>
            </p>
            <input type="file" accept=".csv" id="csv-upload" className="hidden" onChange={e=>{setFile(e.target.files?.[0]||null);setResult(null);}}/>
            <label htmlFor="csv-upload" className="btn-secondary inline-flex items-center gap-2 cursor-pointer py-3 px-6 shadow-sm">
              <FileText className="w-5 h-5" />
              {file ? file.name : 'Browse Files'}
            </label>
          </div>

          {file && (
            <div className="mt-6 flex justify-end">
              <button className="btn-primary py-3 px-8 flex items-center gap-2" onClick={handleUpload} disabled={loading}>
                {loading ? (
                  <><div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div> Processing...</>
                ) : (
                  <><UploadCloud className="w-5 h-5" /> Upload {file.name}</>
                )}
              </button>
            </div>
          )}

          {result && (
            <div className="mt-8 space-y-4 animate-fadeIn">
              <div className={`p-5 rounded-xl border flex items-start gap-4 ${result.success ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
                <div className="mt-0.5">
                  {result.success && !result.partial ? <CheckCircle2 className="w-6 h-6 text-emerald-600" /> : <XCircle className="w-6 h-6 text-red-600" />}
                </div>
                <div>
                  <p className={`font-bold ${result.success && !result.partial ? 'text-emerald-800' : 'text-red-800'}`}>
                    {result.success && !result.partial ? 'Upload Successful' : result.success ? 'Upload Partially Successful' : 'Upload Failed'}
                  </p>
                  <p className={`text-sm mt-1 ${result.success && !result.partial ? 'text-emerald-600' : 'text-red-600'}`}>{result.message}</p>
                </div>
              </div>

              {result.failedRows && result.failedRows.length > 0 && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
                  <h4 className="font-bold text-slate-800 text-sm mb-3">Failed Rows Details ({result.failedCount})</h4>
                  <div className="max-h-60 overflow-y-auto space-y-2 pr-2">
                    {result.failedRows.map((f, i) => (
                      <div key={i} className="text-xs flex items-start justify-between border-b border-slate-100 pb-2 last:border-0 last:pb-0">
                        <span className="font-bold text-slate-600">Row {f.row}</span>
                        <span className="text-red-600 text-right max-w-[80%] font-medium">{f.errors.join(', ')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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
  const [settlements, setSettlements] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();
  const navigate = useNavigate();

  const fetchFinanceData = async () => {
    try {
      const [finRes, setRes] = await Promise.all([
        api.get('/vendor/finance'),
        api.get('/vendor/settlements')
      ]);
      setData(finRes.data.data || {});
      setSettlements(setRes.data.data || []);
    } catch (err) {
      showToast('Failed to load finance data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinanceData();
  }, []);

  const requestSettlement = async () => {
    try {
      await api.post('/vendor/settlements');
      showToast('Settlement request sent to admin!', 'success');
      // Refresh finance data
      fetchFinanceData();
    } catch (err) {
      showToast(err.message || 'Failed to request settlement', 'error');
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center h-64 text-slate-500">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600 mr-3"></div>
      Loading finance data...
    </div>
  );

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div onClick={() => navigate('/vendor/history')} className="cursor-pointer transition-transform hover:-translate-y-1">
          <MetricCard title="Packages to Settle" value={data.pendingPackagesCount??0} color="primary" icon={<Package className="w-6 h-6 text-brand-600" />} />
        </div>
        <div onClick={() => navigate('/vendor/history')} className="cursor-pointer transition-transform hover:-translate-y-1">
          <MetricCard title="COD Collected" value={`Rs. ${data.pendingCOD??0}`} color="success" icon={<Wallet className="w-6 h-6 text-emerald-600" />} />
        </div>
        <div onClick={() => navigate('/vendor/history')} className="cursor-pointer transition-transform hover:-translate-y-1">
          <MetricCard title="Delivery Charges" value={`Rs. ${data.pendingDeliveryCharges??0}`} color="danger" icon={<AlertCircle className="w-6 h-6 text-red-600" />} />
        </div>
        <div onClick={() => navigate('/vendor/history')} className="cursor-pointer transition-transform hover:-translate-y-1">
          <MetricCard title="Net Payable to You" value={`Rs. ${data.totalPayable??0}`} color="purple" icon={<Wallet className="w-6 h-6 text-purple-600" />} />
        </div>
      </div>
      
      <div className="card-premium">
        <div className="px-6 py-5 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50/50">
          <div>
            <h3 className="font-bold text-slate-900 text-lg">Request Settlement</h3>
            <p className="text-sm text-slate-500 mt-1">Request payment for delivered packages</p>
          </div>
          <button className="btn-primary py-2.5 px-6 whitespace-nowrap" disabled={(data.totalPayable||0)<=0} onClick={requestSettlement}>
            Request Payment
          </button>
        </div>
        <div className="p-6">
          {(data.totalPayable||0) > 0
            ? <div className="bg-brand-50 border border-brand-200 rounded-xl p-5 text-brand-800 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-brand-600 shrink-0 mt-0.5" />
                <div>You have <strong className="font-bold text-brand-900">Rs. {data.totalPayable}</strong> pending settlement across <strong className="font-bold text-brand-900">{data.pendingPackagesCount}</strong> delivered packages.</div>
              </div>
            : <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 text-slate-600 text-center">No pending settlements available at this time.</div>
          }
        </div>
      </div>

      <div className="card-premium overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50">
          <h3 className="font-bold text-slate-900 text-lg">Payment History</h3>
          <p className="text-sm text-slate-500 mt-1">Log of your past settlement requests and payments</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-xs">
              <tr>
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3">Amount Requested</th>
                <th className="px-6 py-3">Packages</th>
                <th className="px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {settlements.length === 0 ? (
                <tr><td colSpan="4" className="px-6 py-12 text-center text-slate-500">No settlement history found.</td></tr>
              ) : (
                settlements.map(s => (
                  <tr key={s._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-slate-500 font-medium">{new Date(s.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4 font-bold text-slate-900">Rs. {s.requestedAmount}</td>
                    <td className="px-6 py-4 text-slate-600">{s.packageIds?.length || 0} packages</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${s.status === 'Paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : s.status === 'Rejected' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                        {s.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ─── Delivery History ─────────────────────────────────────────────────────
const DeliveryHistory = () => {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [pagination, setPagination] = useState(null);
  const { showToast } = useToast();

  useEffect(() => {
    setLoading(true);
    api.get(`/vendor/packages?status=history&page=${page}&limit=${limit}`)
      .then(r => {
        setPackages(r.data.data || []);
        setPagination(r.data.pagination);
      })
      .catch(()=>showToast('Failed to load history','error'))
      .finally(()=>setLoading(false));
  }, [page, limit]);

  const exportCSV = () => {
    const rows = [['Tracking Code','Customer','Status','Rider','Amount','Date'], ...packages.map(p=>[p.trackingCode,p.customerName,p.status,p.riderId?.name||'N/A',p.amount,new Date(p.createdAt).toLocaleDateString()])];
    const csv = rows.map(r=>r.map(c=>`"${c}"`).join(',')).join('\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv],{type:'text/csv'})); a.download='delivery_history.csv'; a.click();
  };

  return (
    <div className="card-premium overflow-hidden animate-fadeIn">
      <div className="px-6 py-5 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50/50">
        <div>
          <h3 className="font-bold text-slate-900 text-lg">Delivery History</h3>
          <p className="text-sm text-slate-500 mt-1">Completed, cancelled, and returned orders</p>
        </div>
        <button className="btn-secondary flex items-center gap-2" onClick={exportCSV} disabled={!packages.length}>
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-xs">
            <tr>
              <th className="px-6 py-3">Date</th>
              <th className="px-6 py-3">Tracking Code</th>
              <th className="px-6 py-3">Customer</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3">Rider</th>
              <th className="px-6 py-3">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {loading ? <tr><td colSpan="6" className="px-6 py-12 text-center text-slate-500"><div className="flex justify-center items-center"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-600 mr-2"></div>Loading...</div></td></tr>
            : packages.length===0 ? <tr><td colSpan="6" className="px-6 py-12 text-center text-slate-500">No history found.</td></tr>
            : packages.map(p=>(
              <tr key={p._id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 text-slate-500 font-medium">{new Date(p.createdAt).toLocaleDateString()}</td>
                <td className="px-6 py-4"><TrackingLink code={p.trackingCode} /></td>
                <td className="px-6 py-4 font-medium text-slate-800">{p.customerName}</td>
                <td className="px-6 py-4">{statusBadge(p.status)}</td>
                <td className="px-6 py-4 text-slate-500">{p.riderId?.name||'N/A'}</td>
                <td className="px-6 py-4 font-bold text-brand-600">Rs. {p.amount}</td>
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
  );
};


// ─── Vendor Products ──────────────────────────────────────────────────────
const VendorProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ name: '', barcode: '', category: 'General', price: '', threshold: 5, stockReceived: 0 });
  const [stockModal, setStockModal] = useState({ open: false, id: null, name: '', addQuantity: '' });
  const { showToast } = useToast();

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const r = await api.get('/vendor/products');
      setProducts(r.data.data || []);
    } catch {
      showToast('Failed to load products', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProducts(); }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editMode) {
        await api.put(`/vendor/products/${editId}`, form);
        showToast('Product updated', 'success');
      } else {
        await api.post('/vendor/products', form);
        showToast('Product added', 'success');
      }
      setDrawerOpen(false);
      fetchProducts();
    } catch(err) {
      showToast(err.message || 'Failed to save product', 'error');
    }
  };

  const handleStockUpdate = async (e) => {
    e.preventDefault();
    try {
      await api.patch(`/vendor/products/${stockModal.id}/stock`, { quantity: stockModal.addQuantity });
      showToast('Stock updated', 'success');
      setStockModal({ open: false, id: null, name: '', addQuantity: '' });
      fetchProducts();
    } catch {
      showToast('Failed to update stock', 'error');
    }
  };

  const handleDelete = async (id) => {
    if(!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      await api.delete(`/vendor/products/${id}`);
      showToast('Product deleted', 'success');
      fetchProducts();
    } catch {
      showToast('Failed to delete product', 'error');
    }
  };

  const filtered = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.barcode.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Products & Inventory</h2>
          <p className="text-sm text-slate-500 mt-1">Manage your catalog and stock levels</p>
        </div>
        <button className="btn-primary py-2 px-4 flex items-center gap-2" onClick={() => { setEditMode(false); setForm({ name: '', barcode: '', category: 'General', price: '', threshold: 5, stockReceived: 0 }); setDrawerOpen(true); }}>
          <Plus className="w-5 h-5" /> Add Product
        </button>
      </div>

      <div className="card-premium p-4">
        <div className="relative w-full sm:max-w-md">
          <input type="text" className="input-field pl-9" placeholder="Search by product name or barcode..." value={search} onChange={e=>setSearch(e.target.value)}/>
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>
      </div>

      <div className="card-premium overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-xs">
              <tr>
                <th className="px-6 py-3">Barcode</th>
                <th className="px-6 py-3">Product Name</th>
                <th className="px-6 py-3">Category</th>
                <th className="px-6 py-3">Price</th>
                <th className="px-6 py-3">In Stock</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {loading ? <tr><td colSpan="6" className="px-6 py-12 text-center text-slate-500"><div className="flex justify-center items-center"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-600 mr-2"></div>Loading...</div></td></tr>
              : filtered.length === 0 ? <tr><td colSpan="6" className="px-6 py-12 text-center text-slate-500">No products found.</td></tr>
              : filtered.map(p => {
                const currentStock = p.stockReceived - p.stockSold;
                const isLow = currentStock <= p.threshold;
                return (
                <tr key={p._id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-mono text-slate-500 tracking-wider text-xs">{p.barcode}</td>
                  <td className="px-6 py-4 font-bold text-slate-900">{p.name}</td>
                  <td className="px-6 py-4 text-slate-600">{p.category}</td>
                  <td className="px-6 py-4 font-bold text-brand-600">Rs. {p.price}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className={`font-bold ${isLow ? 'text-red-600' : 'text-slate-800'}`}>{currentStock}</span>
                      {isLow && <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-red-50 text-red-700 border border-red-200">Low Stock</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-1">
                      <button className="btn-secondary btn-sm py-1.5 px-3 mr-1" onClick={() => setStockModal({ open: true, id: p._id, name: p.name, addQuantity: '' })}>+ Stock</button>
                      <button className="p-2 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors" onClick={() => { setEditMode(true); setEditId(p._id); setForm({ name: p.name, barcode: p.barcode, category: p.category, price: p.price, threshold: p.threshold, stockReceived: p.stockReceived }); setDrawerOpen(true); }} title="Edit"><Edit2 className="w-4 h-4" /></button>
                      <button className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" onClick={() => handleDelete(p._id)} title="Delete"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              )})}
            </tbody>
          </table>
        </div>
      </div>

      {/* Product Form Modal */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-scaleIn">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-bold text-slate-900 text-lg">{editMode ? 'Edit Product' : 'Add New Product'}</h3>
              <button className="text-slate-400 hover:text-slate-600 transition-colors" onClick={() => setDrawerOpen(false)}><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6">
              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className={labelClass}>Product Name <span className="text-red-500">*</span></label>
                  <input type="text" className="input-field" value={form.name} onChange={e=>setForm({...form, name: e.target.value})} required/>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Barcode (Optional)</label>
                    <input type="text" className="input-field font-mono text-sm placeholder:font-sans" value={form.barcode} onChange={e=>setForm({...form, barcode: e.target.value})} placeholder="Auto-generated"/>
                  </div>
                  <div>
                    <label className={labelClass}>Category</label>
                    <input type="text" className="input-field" value={form.category} onChange={e=>setForm({...form, category: e.target.value})}/>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Price (Rs.) <span className="text-red-500">*</span></label>
                    <input type="number" className="input-field" value={form.price} onChange={e=>setForm({...form, price: e.target.value})} required min="0"/>
                  </div>
                  <div>
                    <label className={labelClass}>Low Stock Threshold</label>
                    <input type="number" className="input-field" value={form.threshold} onChange={e=>setForm({...form, threshold: e.target.value})} min="0"/>
                  </div>
                </div>
                {!editMode && <div>
                  <label className={labelClass}>Initial Stock Quantity</label>
                  <input type="number" className="input-field" value={form.stockReceived} onChange={e=>setForm({...form, stockReceived: e.target.value})} min="0"/>
                </div>}
                <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 mt-6">
                  <button type="button" className="btn-secondary" onClick={() => setDrawerOpen(false)}>Cancel</button>
                  <button type="submit" className="btn-primary">{editMode ? 'Save Changes' : 'Add Product'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Stock Update Modal */}
      {stockModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-scaleIn">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-start">
              <div>
                <h3 className="font-bold text-slate-900 text-lg">Add Stock</h3>
                <p className="text-sm font-medium text-slate-600 mt-0.5">{stockModal.name}</p>
              </div>
              <button className="text-slate-400 hover:text-slate-600 transition-colors" onClick={() => setStockModal({open: false, id: null, name: '', addQuantity: ''})}><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6">
              <form onSubmit={handleStockUpdate} className="space-y-4">
                <div>
                  <label className={labelClass}>Quantity to Add</label>
                  <input type="number" className="input-field text-lg font-bold" value={stockModal.addQuantity} onChange={e=>setStockModal({...stockModal, addQuantity: e.target.value})} required min="1"/>
                </div>
                <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 mt-6">
                  <button type="button" className="btn-secondary flex-1" onClick={() => setStockModal({open: false, id: null, name: '', addQuantity: ''})}>Cancel</button>
                  <button type="submit" className="btn-primary flex-1">Update Stock</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
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
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Branch Directory</h2>
          <p className="text-sm text-slate-500 mt-1">Find branches by name, district, or province</p>
        </div>
        <div className="relative w-full sm:w-auto min-w-[260px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            className="input-field pl-9 w-full"
            placeholder="Search branch, district..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="card-premium overflow-hidden">
        {/* Table Header */}
        <div className="hidden md:grid grid-cols-[40px_2fr_1fr_1fr_100px_120px_2fr] gap-2 p-4 bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-wider">
          <div />
          <div>Branch / Arrival</div>
          <div>District</div>
          <div>Province</div>
          <div className="text-center">Base (Rs.)</div>
          <div className="text-center">Delivery (Rs.)</div>
          <div>Area Covered</div>
        </div>

        {/* Rows */}
        <div className="divide-y divide-slate-100 bg-white">
          {filtered.length === 0 ? (
            <div className="p-12 text-center text-slate-500 font-medium">
              No branches match your search.
            </div>
          ) : filtered.map((branch) => (
            <div key={branch.id}>
              {/* Main Row */}
              <div
                onClick={() => toggle(branch.id)}
                className={`grid grid-cols-1 md:grid-cols-[40px_2fr_1fr_1fr_100px_120px_2fr] gap-4 md:gap-2 p-4 items-center cursor-pointer transition-colors ${expanded[branch.id] ? 'bg-brand-50/30' : 'hover:bg-slate-50'}`}
              >
                {/* Expand Arrow - Mobile */}
                <div className="md:hidden flex items-center justify-between w-full border-b border-slate-100 pb-3 mb-2">
                  <div className="font-bold text-slate-900">{branch.name}</div>
                  <ChevronRight className={`w-5 h-5 text-brand-600 transition-transform ${expanded[branch.id] ? 'rotate-90' : ''}`} />
                </div>

                {/* Expand Arrow - Desktop */}
                <div className="hidden md:flex justify-center">
                  <ChevronRight className={`w-5 h-5 text-slate-400 transition-transform ${expanded[branch.id] ? 'rotate-90 text-brand-600' : ''}`} />
                </div>

                {/* Branch Name + Arrival */}
                <div className="flex flex-col">
                  <div className="hidden md:block font-bold text-slate-900 text-sm">{branch.name}</div>
                  <div className="flex items-center gap-1 text-xs text-slate-500 font-medium mt-1">
                    <Clock className="w-3.5 h-3.5" /> {branch.arrivalTime}
                  </div>
                </div>

                {/* District */}
                <div className="text-sm font-medium text-slate-700 flex items-center md:block">
                  <span className="md:hidden text-slate-400 text-xs w-20">District:</span>
                  {branch.district}
                </div>

                {/* Province */}
                <div className="flex items-center md:block">
                  <span className="md:hidden text-slate-400 text-xs w-20">Province:</span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
                    {branch.province}
                  </span>
                </div>

                {/* Base Charge */}
                <div className="flex items-center md:justify-center font-bold text-slate-900">
                  <span className="md:hidden text-slate-400 text-xs font-normal w-20">Base:</span>
                  Rs. {branch.baseCharge}
                </div>

                {/* Delivery Charge */}
                <div className="flex items-center md:justify-center font-bold text-emerald-600">
                  <span className="md:hidden text-slate-400 text-xs font-normal w-20">Delivery:</span>
                  Rs. {branch.deliveryCharge}
                </div>

                {/* Area */}
                <div className="text-xs text-slate-500 leading-relaxed truncate" title={branch.area}>
                  <span className="md:hidden text-slate-400 mr-2">Areas:</span>
                  {branch.area}
                </div>
              </div>

              {/* Expanded Sub-Row */}
              {expanded[branch.id] && (
                <div className="bg-brand-50/50 p-4 md:pl-[64px] border-t border-brand-100/50 flex flex-wrap items-center gap-4 animate-fadeIn">
                  <span className="text-xs font-bold text-brand-700 uppercase tracking-wider">Contacts:</span>
                  <div className="flex flex-wrap gap-2">
                    {branch.contacts.map((c, ci) => (
                      <a
                        key={ci}
                        href={`tel:${c.phone}`}
                        onClick={e => e.stopPropagation()}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-brand-200 text-brand-700 text-sm font-bold shadow-sm hover:bg-brand-50 transition-colors"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        {c.phone}
                        <span className="text-xs text-brand-400 font-medium ml-1">({c.label})</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <p className="text-right text-xs font-medium text-slate-400">Showing {filtered.length} of {BRANCHES.length} branches</p>
    </div>
  );
};

// ─── Vendor Dashboard Shell ───────────────────────────────────────────────
const VendorDashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  
  const title = Object.entries(titleMap).sort((a,b)=>b[0].length-a[0].length).find(([p])=>location.pathname===p || (p!=='/vendor'&&location.pathname.startsWith(p)))?.[1] || 'Vendor';

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        // Fetch recent active deliveries and history (returned/delivered)
        const [delRes, histRes] = await Promise.all([
          api.get('/vendor/packages?status=deliveries&limit=10'),
          api.get('/vendor/packages?status=history&limit=10')
        ]);
        
        const activePkgs = delRes.data.data || [];
        const histPkgs = histRes.data.data || [];
        const pkgs = [...activePkgs, ...histPkgs].sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt));
        
        const notifs = pkgs
          .map(p => ({
            id: p._id,
            title: `Order ${p.status}`,
            message: `${p.trackingCode} - ${p.customerName}`,
            time: new Date(p.updatedAt || p.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            read: false,
            icon: p.status === 'Delivered' ? '✅' : p.status === 'Returned' ? '↩️' : p.status === 'Cancelled' ? '❌' : p.status === 'Out for Delivery' ? '🚚' : '📦',
            path: '/vendor/packages'
          }));
          
        setNotifications(notifs.slice(0, 15));
      } catch (err) {
        console.error('Failed to fetch vendor notifications', err);
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);

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

  return (
    <AppShell navLinks={navLinks} currentTitle={title} roleBadge="Vendor Portal" notifications={notifications} onNotificationClick={handleNotificationClick}>
      <Routes>
        <Route path="/" element={<VendorHome />} />
        <Route path="/packages" element={<PackageList />} />
        <Route path="/packages/bulk" element={<PackageBulkUpload />} />
        <Route path="/products" element={<VendorProducts />} />
        <Route path="/finance" element={<Finance />} />
        <Route path="/history" element={<DeliveryHistory />} />
        <Route path="/branches" element={<BranchDirectory />} />
      </Routes>
    </AppShell>
  );
};

export default VendorDashboard;
