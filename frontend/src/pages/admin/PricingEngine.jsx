import React, { useState, useEffect, useCallback } from 'react';
import api from '../../api/axios';
import { useToast } from '../../store/ToastContext';
import MetricCard from '../../components/MetricCard';
import Pagination from '../../components/Pagination';
import { 
  DollarSign, Weight, MapPin, Users, Search, Plus, Map, 
  Trash2, Edit2, CheckCircle2, XCircle, AlertTriangle, RefreshCw, X 
} from 'lucide-react';

// ─── Helpers ─────────────────────────────────────────────────────────────────
const debounce = (func, wait) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// ─── Skeleton Loading Component ──────────────────────────────────────────────
const SkeletonTable = ({ rows = 3 }) => (
  <div className="overflow-x-auto">
    <table className="w-full text-sm text-left">
      <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-xs">
        <tr><th className="px-6 py-3">Loading...</th></tr>
      </thead>
      <tbody className="divide-y divide-slate-100 bg-white">
        {Array.from({ length: rows }).map((_, i) => (
          <tr key={i}>
            <td className="px-6 py-4">
              <div className="h-4 bg-slate-200 rounded animate-pulse w-full"></div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const PricingEngine = () => {
  const { showToast } = useToast();
  
  // -- State: Summary & Global Settings --
  const [summary, setSummary] = useState({});
  const [globalSettings, setGlobalSettings] = useState({ ktmBaseRate: 150, weightSurchargePerKg: 50 });
  const [savingGlobal, setSavingGlobal] = useState(false);
  const [loadingSummary, setLoadingSummary] = useState(true);

  // -- State: Outside Valley Fees --
  const [ovFees, setOvFees] = useState([]);
  const [ovPagination, setOvPagination] = useState({ page: 1, total: 0, pages: 1 });
  const [ovSearch, setOvSearch] = useState('');
  const [loadingOv, setLoadingOv] = useState(true);
  
  // -- State: Outside Valley Modal --
  const [ovModalOpen, setOvModalOpen] = useState(false);
  const [ovForm, setOvForm] = useState({ id: null, city: '', fee: 200, isActive: true });
  
  // -- State: Vendor Pricing --
  const [vendors, setVendors] = useState([]);
  const [vendorPagination, setVendorPagination] = useState({ page: 1, total: 0, pages: 1 });
  const [vendorSearch, setVendorSearch] = useState('');
  const [loadingVendors, setLoadingVendors] = useState(true);

  // -- State: Vendor Pricing Modal --
  const [vendorModalOpen, setVendorModalOpen] = useState(false);
  const [vendorForm, setVendorForm] = useState({ 
    id: null, name: '', shopName: '', customFlatRate: '', defaultKtmRate: 150, defaultOutsideRate: 200, useGlobalPricing: true 
  });

  // -- State: Confirmation Modal --
  const [confirmModal, setConfirmModal] = useState({ open: false, title: '', message: '', onConfirm: null });

  // -- State: Delivery Charge Rules --
  const [dcRules, setDcRules] = useState([]);
  const [loadingDc, setLoadingDc] = useState(true);
  const [dcModalOpen, setDcModalOpen] = useState(false);
  const BRANCH_OPTIONS = ['HEAD OFFICE', 'Kathmandu Branch', 'Pokhara Branch', 'Chitwan Branch', 'Lalitpur Branch', 'Bhaktapur Branch', 'Dharan Branch', 'Biratnagar Branch'];
  const EMPTY_DC_FORM = { id: null, fromBranch: '', toBranch: '', baseCharge: 0, perKgCharge: 0, weightLimit: 0, isActive: true };
  const [dcForm, setDcForm] = useState(EMPTY_DC_FORM);
  const [dcSaving, setDcSaving] = useState(false);

  // ─── Fetch Data Functions ──────────────────────────────────────────────────
  
  const fetchSummary = async () => {
    try {
      const res = await api.get('/admin/pricing-engine/summary');
      setSummary(res.data.data);
      if (res.data.data.globalSettings) {
        setGlobalSettings({
          ktmBaseRate: res.data.data.globalSettings.ktmBaseRate,
          weightSurchargePerKg: res.data.data.globalSettings.weightSurchargePerKg
        });
      }
    } catch (err) {
      showToast('Failed to load pricing summary', 'error');
    } finally {
      setLoadingSummary(false);
    }
  };

  const fetchOvFees = async (page = 1, search = ovSearch) => {
    setLoadingOv(true);
    try {
      const res = await api.get(`/admin/pricing-engine/outside-valley?page=${page}&search=${search}`);
      setOvFees(res.data.data);
      setOvPagination(res.data.pagination);
    } catch (err) {
      showToast('Failed to load city fees', 'error');
    } finally {
      setLoadingOv(false);
    }
  };

  const fetchVendors = async (page = 1, search = vendorSearch) => {
    setLoadingVendors(true);
    try {
      const res = await api.get(`/admin/pricing-engine/vendors?page=${page}&search=${search}`);
      setVendors(res.data.data);
      setVendorPagination(res.data.pagination);
    } catch (err) {
      showToast('Failed to load vendors pricing', 'error');
    } finally {
      setLoadingVendors(false);
    }
  };

  // Initial Load
  useEffect(() => {
    fetchSummary();
    fetchOvFees();
    fetchVendors();
    fetchDcRules();
  }, []);

  // Debounced Searches
  const debouncedFetchOv = useCallback(debounce((query) => fetchOvFees(1, query), 400), []);
  const handleOvSearchChange = (e) => {
    setOvSearch(e.target.value);
    debouncedFetchOv(e.target.value);
  };

  const debouncedFetchVendors = useCallback(debounce((query) => fetchVendors(1, query), 400), []);
  const handleVendorSearchChange = (e) => {
    setVendorSearch(e.target.value);
    debouncedFetchVendors(e.target.value);
  };

  // ─── Fetch: Delivery Charge Rules ─────────────────────────────────────────
  const fetchDcRules = async () => {
    setLoadingDc(true);
    try {
      const res = await api.get('/admin/delivery-charges');
      setDcRules(res.data.data || []);
    } catch (err) {
      showToast('Failed to load delivery charge rules', 'error');
    } finally {
      setLoadingDc(false);
    }
  };

  const openDcModal = (rule = null) => {
    if (rule) {
      setDcForm({ id: rule._id, fromBranch: rule.fromBranch, toBranch: rule.toBranch,
        baseCharge: rule.baseCharge, perKgCharge: rule.perKgCharge || 0,
        weightLimit: rule.weightLimit || 0, isActive: rule.isActive });
    } else {
      setDcForm(EMPTY_DC_FORM);
    }
    setDcModalOpen(true);
  };

  const handleSaveDcRule = async (e) => {
    e.preventDefault();
    if (!dcForm.fromBranch || !dcForm.toBranch) return showToast('Please select both branches', 'error');
    if (dcForm.fromBranch === dcForm.toBranch) return showToast('From and To cannot be the same branch', 'error');
    setDcSaving(true);
    try {
      if (dcForm.id) {
        await api.put(`/admin/delivery-charges/${dcForm.id}`, dcForm);
        showToast('Rule updated', 'success');
      } else {
        await api.post('/admin/delivery-charges', dcForm);
        showToast('Rule created', 'success');
      }
      setDcModalOpen(false);
      fetchDcRules();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save rule', 'error');
    } finally {
      setDcSaving(false);
    }
  };

  const handleToggleDcRule = async (rule) => {
    try {
      await api.patch(`/admin/delivery-charges/${rule._id}/toggle`);
      showToast(`Rule ${rule.isActive ? 'deactivated' : 'activated'}`, 'success');
      fetchDcRules();
    } catch (err) {
      showToast('Failed to toggle rule', 'error');
    }
  };

  const handleDeleteDcRule = (rule) => {
    setConfirmModal({
      open: true,
      title: 'Delete Delivery Charge Rule',
      message: `Delete rule for ${rule.fromBranch} → ${rule.toBranch}?`,
      onConfirm: async () => {
        try {
          await api.delete(`/admin/delivery-charges/${rule._id}`);
          showToast('Rule deleted', 'success');
          fetchDcRules();
        } catch (err) {
          showToast('Failed to delete rule', 'error');
        }
        setConfirmModal({ open: false });
      },
    });
  };

  // ─── Handlers: Global Settings ──────────────────────────────────────────────

  const handleSaveGlobalSettings = async (e) => {
    e.preventDefault();
    setSavingGlobal(true);
    try {
      await api.put('/admin/pricing-engine/settings', globalSettings);
      showToast('Global settings updated', 'success');
      fetchSummary(); // Refresh summary cards
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update global settings', 'error');
    } finally {
      setSavingGlobal(false);
    }
  };

  // ─── Handlers: Outside Valley City Fees ────────────────────────────────────

  const openOvModal = (feeObj = null) => {
    if (feeObj) {
      setOvForm({ id: feeObj._id, city: feeObj.city, fee: feeObj.fee, isActive: feeObj.isActive });
    } else {
      setOvForm({ id: null, city: '', fee: 200, isActive: true });
    }
    setOvModalOpen(true);
  };

  const handleSaveOvFee = async (e) => {
    e.preventDefault();
    try {
      if (ovForm.id) {
        await api.put(`/admin/pricing-engine/outside-valley/${ovForm.id}`, ovForm);
        showToast('City fee updated', 'success');
      } else {
        await api.post('/admin/pricing-engine/outside-valley', ovForm);
        showToast('City fee added', 'success');
      }
      setOvModalOpen(false);
      fetchOvFees(ovPagination.page);
      fetchSummary();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save city fee', 'error');
    }
  };

  const handleDeleteOvFee = (feeObj) => {
    setConfirmModal({
      open: true,
      title: 'Delete City Fee',
      message: `Are you sure you want to delete the delivery fee configuration for ${feeObj.city}?`,
      onConfirm: async () => {
        try {
          await api.delete(`/admin/pricing-engine/outside-valley/${feeObj._id}`);
          showToast('City fee deleted', 'success');
          fetchOvFees(ovPagination.page);
          fetchSummary();
        } catch (err) {
          showToast(err.response?.data?.message || 'Failed to delete fee', 'error');
        }
        setConfirmModal({ open: false });
      }
    });
  };

  const handleToggleOvFeeStatus = async (feeObj) => {
    try {
      await api.put(`/admin/pricing-engine/outside-valley/${feeObj._id}`, { isActive: !feeObj.isActive });
      showToast(`City fee ${!feeObj.isActive ? 'activated' : 'deactivated'}`, 'success');
      fetchOvFees(ovPagination.page);
    } catch (err) {
      showToast('Failed to update status', 'error');
    }
  };

  // ─── Handlers: Vendor Pricing ──────────────────────────────────────────────

  const openVendorModal = (vendor) => {
    const meta = vendor.vendorMeta || {};
    setVendorForm({
      id: vendor._id,
      name: vendor.name,
      shopName: meta.shopName || '',
      customFlatRate: meta.customFlatRate ?? '',
      defaultKtmRate: meta.defaultKtmRate ?? 150,
      defaultOutsideRate: meta.defaultOutsideRate ?? 200,
      useGlobalPricing: meta.useGlobalPricing !== undefined ? meta.useGlobalPricing : true
    });
    setVendorModalOpen(true);
  };

  const handleSaveVendorPricing = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        customFlatRate: vendorForm.customFlatRate === '' ? null : Number(vendorForm.customFlatRate),
        defaultKtmRate: Number(vendorForm.defaultKtmRate),
        defaultOutsideRate: Number(vendorForm.defaultOutsideRate),
        useGlobalPricing: vendorForm.useGlobalPricing
      };
      
      await api.put(`/admin/pricing-engine/vendors/${vendorForm.id}`, payload);
      showToast('Vendor pricing updated', 'success');
      setVendorModalOpen(false);
      fetchVendors(vendorPagination.page);
      fetchSummary();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update vendor pricing', 'error');
    }
  };

  // ─── Render Components ──────────────────────────────────────────────────────

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* 1. Dashboard Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard title="Global KTM Rate" value={`Rs. ${globalSettings.ktmBaseRate}`} color="primary"
          icon={<DollarSign className="w-6 h-6 text-brand-600" />} />
        <MetricCard title="Surcharge / KG" value={`Rs. ${globalSettings.weightSurchargePerKg}`} color="warning"
          icon={<Weight className="w-6 h-6 text-amber-600" />} />
        <MetricCard title="Cities Configured" value={loadingSummary ? '-' : summary.totalOvCities} color="info"
          icon={<MapPin className="w-6 h-6 text-sky-600" />} />
        <MetricCard title="Custom Pricing Vendors" value={loadingSummary ? '-' : summary.customPricingVendors} color="purple"
          icon={<Users className="w-6 h-6 text-purple-600" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* 2. Global Pricing Settings */}
        <div className="card-premium h-fit col-span-1">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
            <h3 className="font-bold text-slate-800 text-lg">Global Pricing Settings</h3>
            <p className="text-sm text-slate-500">Default rates across the platform</p>
          </div>
          <div className="p-6">
            <form onSubmit={handleSaveGlobalSettings} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">KTM Valley Base Rate (Rs.)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-medium text-sm">Rs.</span>
                  <input type="number" min="0" required className="input-field pl-9" 
                    value={globalSettings.ktmBaseRate} 
                    onChange={(e) => setGlobalSettings({...globalSettings, ktmBaseRate: Number(e.target.value)})} />
                </div>
                <p className="text-xs text-slate-500 mt-1.5">Applied to deliveries within the valley unless overridden by vendor.</p>
              </div>
              <div className="pb-2">
                <label className="block text-sm font-semibold text-slate-700 mb-1">Weight Surcharge per KG (Rs.)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-medium text-sm">Rs.</span>
                  <input type="number" min="0" required className="input-field pl-9" 
                    value={globalSettings.weightSurchargePerKg} 
                    onChange={(e) => setGlobalSettings({...globalSettings, weightSurchargePerKg: Number(e.target.value)})} />
                </div>
                <p className="text-xs text-slate-500 mt-1.5">Added for every KG above 1KG.</p>
              </div>
              <button type="submit" className="btn-primary w-full" disabled={savingGlobal}>
                {savingGlobal ? 'Saving...' : 'Save Global Settings'}
              </button>
            </form>
          </div>
        </div>

        {/* 3. Outside Valley City Fees */}
        <div className="card-premium overflow-hidden col-span-1 lg:col-span-2 flex flex-col h-full">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-slate-800 text-lg">Outside Valley Delivery Fees</h3>
              <p className="text-sm text-slate-500">Rates for specific cities outside Kathmandu</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input type="text" className="input-field py-2 pl-9 w-full sm:w-48 text-sm" placeholder="Search city..." 
                  value={ovSearch} onChange={handleOvSearchChange} />
              </div>
              <button className="btn-primary py-2 flex items-center gap-1.5 whitespace-nowrap" onClick={() => openOvModal()}>
                <Plus className="w-4 h-4" /> Add City
              </button>
            </div>
          </div>
          
          {loadingOv ? <SkeletonTable /> : (
            <>
              <div className="overflow-x-auto flex-1">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-xs sticky top-0">
                    <tr>
                      <th className="px-6 py-3">City Name</th>
                      <th className="px-6 py-3">Delivery Fee</th>
                      <th className="px-6 py-3">Status</th>
                      <th className="px-6 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {ovFees.length === 0 ? (
                      <tr><td colSpan="4" className="px-6 py-12 text-center text-slate-500">No cities configured.</td></tr>
                    ) : (
                      ovFees.map(fee => (
                        <tr key={fee._id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4 font-bold text-slate-900">{fee.city}</td>
                          <td className="px-6 py-4 font-bold text-brand-600">Rs. {fee.fee}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${fee.isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                              {fee.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex gap-2 justify-end">
                              <button className={`btn-sm p-2 rounded-lg font-bold border ${fee.isActive ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100' : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'}`} onClick={() => handleToggleOvFeeStatus(fee)} title={fee.isActive ? 'Deactivate' : 'Activate'}>
                                {fee.isActive ? <XCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                              </button>
                              <button className="btn-secondary btn-sm p-2" onClick={() => openOvModal(fee)} title="Edit">
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button className="btn-sm p-2 rounded-lg bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 font-bold" onClick={() => handleDeleteOvFee(fee)} title="Delete">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <Pagination pagination={ovPagination} onPageChange={(page) => fetchOvFees(page)} />
            </>
          )}
        </div>
      </div>

      {/* ─── Delivery Charge Rules ─────────────────────────────────────────── */}
      <div className="card-premium overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
              <Map className="w-5 h-5 text-emerald-600" /> Branch-to-Branch Delivery Charge Rules
            </h3>
            <p className="text-sm text-slate-500 mt-1">Auto-applied in the New Order modal based on route + weight.</p>
          </div>
          <button className="btn-primary py-2 flex items-center gap-1.5 whitespace-nowrap" onClick={() => openDcModal()}>
            <Plus className="w-4 h-4" /> Add Rule
          </button>
        </div>

        {loadingDc ? <SkeletonTable rows={4} /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-xs">
                <tr>
                  <th className="px-6 py-3">From Branch</th>
                  <th className="px-6 py-3">To Branch</th>
                  <th className="px-6 py-3">Base Charge</th>
                  <th className="px-6 py-3">Free Weight</th>
                  <th className="px-6 py-3">Per kg above</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {dcRules.length === 0 ? (
                  <tr><td colSpan="7" className="px-6 py-12 text-center text-slate-500">No rules yet. Click <strong>+ Add Rule</strong> to create one.</td></tr>
                ) : dcRules.map(rule => (
                  <tr key={rule._id} className={`hover:bg-slate-50 transition-colors ${!rule.isActive ? 'opacity-60 bg-slate-50/50' : ''}`}>
                    <td className="px-6 py-4 font-bold text-slate-900">{rule.fromBranch}</td>
                    <td className="px-6 py-4 font-bold text-slate-900">{rule.toBranch}</td>
                    <td className="px-6 py-4 font-bold text-brand-600">Rs. {rule.baseCharge}</td>
                    <td className="px-6 py-4 text-slate-600 font-medium">{rule.weightLimit || 0} kg</td>
                    <td className="px-6 py-4 text-slate-600 font-medium">{rule.perKgCharge > 0 ? `Rs. ${rule.perKgCharge}` : '—'}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${rule.isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                        {rule.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex gap-2 justify-end">
                        <button className={`btn-sm p-2 rounded-lg font-bold border ${rule.isActive ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100' : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'}`} onClick={() => handleToggleDcRule(rule)} title={rule.isActive ? 'Deactivate' : 'Activate'}>
                          {rule.isActive ? <XCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                        </button>
                        <button className="btn-secondary btn-sm p-2" onClick={() => openDcModal(rule)} title="Edit">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button className="btn-sm p-2 rounded-lg bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 font-bold" onClick={() => handleDeleteDcRule(rule)} title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 4. Vendor-Specific Pricing Matrix */}
      <div className="card-premium overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 className="font-bold text-slate-800 text-lg">Vendor Pricing Matrix</h3>
            <p className="text-sm text-slate-500 mt-1">Manage pricing overrides and rules for individual vendors</p>
          </div>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input type="text" className="input-field py-2 pl-9 w-full sm:w-64 text-sm" placeholder="Search vendors..." 
              value={vendorSearch} onChange={handleVendorSearchChange} />
          </div>
        </div>

        {loadingVendors ? <SkeletonTable rows={5} /> : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-xs">
                  <tr>
                    <th className="px-6 py-3">Vendor</th>
                    <th className="px-6 py-3">Pricing Mode</th>
                    <th className="px-6 py-3">Custom Flat Rate</th>
                    <th className="px-6 py-3">KTM Override</th>
                    <th className="px-6 py-3">OV Override</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {vendors.length === 0 ? (
                    <tr><td colSpan="6" className="px-6 py-12 text-center text-slate-500">No vendors found.</td></tr>
                  ) : (
                    vendors.map(v => {
                      const meta = v.vendorMeta || {};
                      const isGlobal = meta.useGlobalPricing !== false;
                      const hasFlat = meta.customFlatRate !== null && meta.customFlatRate !== undefined;
                      
                      return (
                        <tr key={v._id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="font-bold text-slate-900">{v.name}</div>
                            <div className="text-xs text-slate-500 mt-0.5">{meta.shopName || v.email}</div>
                          </td>
                          <td className="px-6 py-4">
                            {hasFlat ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-700 border border-purple-200">Flat Rate</span>
                            ) : isGlobal ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 border border-emerald-200">Global</span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 border border-amber-200">Custom</span>
                            )}
                          </td>
                          <td className="px-6 py-4 font-bold text-purple-600">
                            {hasFlat ? `Rs. ${meta.customFlatRate}` : '—'}
                          </td>
                          <td className={`px-6 py-4 ${!isGlobal && !hasFlat ? 'font-bold text-slate-900' : 'text-slate-400 font-medium'}`}>
                            {meta.defaultKtmRate !== undefined ? `Rs. ${meta.defaultKtmRate}` : '—'}
                          </td>
                          <td className={`px-6 py-4 ${!isGlobal && !hasFlat ? 'font-bold text-slate-900' : 'text-slate-400 font-medium'}`}>
                            {meta.defaultOutsideRate !== undefined ? `Rs. ${meta.defaultOutsideRate}` : '—'}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button className="btn-secondary btn-sm" onClick={() => openVendorModal(v)}>Manage Rules</button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            <Pagination pagination={vendorPagination} onPageChange={(page) => fetchVendors(page)} />
          </>
        )}
      </div>

      {/* --- Modals --- */}
      
      {/* Delivery Charge Rule Modal */}
      {dcModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn" onClick={() => setDcModalOpen(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl overflow-hidden animate-scaleIn" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                <Map className="w-5 h-5 text-emerald-600" /> {dcForm.id ? 'Edit Delivery Rule' : 'Add Delivery Rule'}
              </h3>
              <button onClick={() => setDcModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <form onSubmit={handleSaveDcRule} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">From Branch <span className="text-red-500">*</span></label>
                    <select required className="input-field" value={dcForm.fromBranch} onChange={e => setDcForm({...dcForm, fromBranch: e.target.value})}>
                      <option value="">Select branch...</option>
                      {BRANCH_OPTIONS.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">To Branch <span className="text-red-500">*</span></label>
                    <select required className="input-field" value={dcForm.toBranch} onChange={e => setDcForm({...dcForm, toBranch: e.target.value})}>
                      <option value="">Select branch...</option>
                      {BRANCH_OPTIONS.filter(b => b !== dcForm.fromBranch).map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Base Charge (Rs.) <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-medium text-sm">Rs.</span>
                      <input type="number" required min="0" className="input-field pl-9"
                        value={dcForm.baseCharge} onChange={e => setDcForm({...dcForm, baseCharge: Number(e.target.value)})} />
                    </div>
                    <p className="text-xs text-slate-500 mt-1">Fixed charge for this route.</p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Free Weight Limit (kg)</label>
                    <div className="relative">
                      <input type="number" min="0" step="0.1" className="input-field pr-8"
                        value={dcForm.weightLimit} onChange={e => setDcForm({...dcForm, weightLimit: Number(e.target.value)})} />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 font-medium text-sm">kg</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">Included in base charge (0 = none).</p>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Per kg Charge above weight limit (Rs.)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-medium text-sm">Rs.</span>
                      <input type="number" min="0" step="0.5" className="input-field pl-9"
                        value={dcForm.perKgCharge} onChange={e => setDcForm({...dcForm, perKgCharge: Number(e.target.value)})} />
                    </div>
                    <p className="text-xs text-slate-500 mt-1">0 = weight-based surcharge disabled.</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 pt-2">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={dcForm.isActive} onChange={e => setDcForm({...dcForm, isActive: e.target.checked})} />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                  </label>
                  <span className="text-sm font-bold text-slate-700">Active Rule</span>
                </div>
                
                {/* Preview */}
                {dcForm.fromBranch && dcForm.toBranch && (
                  <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-4 mt-4">
                    <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-2">Rule Preview</p>
                    <p className="text-sm text-emerald-900 font-medium">
                      {dcForm.fromBranch} → {dcForm.toBranch} <br/>
                      Base: Rs.{dcForm.baseCharge}
                      {dcForm.perKgCharge > 0 && ` + Rs.${dcForm.perKgCharge}/kg above ${dcForm.weightLimit}kg`}
                      {dcForm.weightLimit === 0 && dcForm.perKgCharge === 0 && ' (Fixed charge regardless of weight)'}
                    </p>
                  </div>
                )}
                
                <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 mt-6">
                  <button type="button" className="btn-secondary" onClick={() => setDcModalOpen(false)}>Cancel</button>
                  <button type="submit" className="btn-primary" disabled={dcSaving}>{dcSaving ? 'Saving...' : 'Save Rule'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* OV Fee Modal */}
      {ovModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn" onClick={() => setOvModalOpen(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-scaleIn" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-bold text-slate-900 text-lg">{ovForm.id ? 'Edit City Fee' : 'Add City Fee'}</h3>
              <button onClick={() => setOvModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <form onSubmit={handleSaveOvFee} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">City Name <span className="text-red-500">*</span></label>
                  <input type="text" required className="input-field" placeholder="e.g. Pokhara"
                    value={ovForm.city} onChange={e => setOvForm({...ovForm, city: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Delivery Fee (Rs.) <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-medium text-sm">Rs.</span>
                    <input type="number" required min="0" className="input-field pl-9" 
                      value={ovForm.fee} onChange={e => setOvForm({...ovForm, fee: Number(e.target.value)})} />
                  </div>
                </div>
                <div className="flex items-center gap-3 pt-2">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={ovForm.isActive} onChange={e => setOvForm({...ovForm, isActive: e.target.checked})} />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                  </label>
                  <span className="text-sm font-bold text-slate-700">Active</span>
                </div>
                <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 mt-6">
                  <button type="button" className="btn-secondary" onClick={() => setOvModalOpen(false)}>Cancel</button>
                  <button type="submit" className="btn-primary">Save Fee</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Vendor Pricing Modal */}
      {vendorModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn" onClick={() => setVendorModalOpen(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl overflow-hidden animate-scaleIn" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h3 className="font-bold text-slate-900 text-lg">Configure Pricing Rules</h3>
                <p className="text-sm text-slate-500 mt-0.5">{vendorForm.name} {vendorForm.shopName ? `— ${vendorForm.shopName}` : ''}</p>
              </div>
              <button onClick={() => setVendorModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <form onSubmit={handleSaveVendorPricing} className="space-y-6">
                
                <div className="bg-purple-50 border border-purple-100 rounded-xl p-5">
                  <h4 className="font-bold text-purple-900 mb-1 flex items-center gap-2">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-purple-200 text-purple-800 text-xs">1</span> 
                    Master Override (Optional)
                  </h4>
                  <p className="text-xs text-purple-700 mb-4">If set, this flat rate is charged for EVERY delivery for this vendor, regardless of location or global settings.</p>
                  <div>
                    <label className="block text-sm font-semibold text-purple-900 mb-1">Custom Flat Rate (Rs.)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-500 font-medium text-sm">Rs.</span>
                      <input type="number" min="0" className="input-field pl-9 border-purple-200 focus:ring-purple-500 focus:border-purple-500 bg-white" placeholder="Leave empty to use rules below"
                        value={vendorForm.customFlatRate} onChange={e => setVendorForm({...vendorForm, customFlatRate: e.target.value})} />
                    </div>
                  </div>
                </div>

                <div className="border border-slate-200 rounded-xl p-5">
                  <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-4">
                    <h4 className="font-bold text-slate-800 flex items-center gap-2">
                      <span className="flex items-center justify-center w-5 h-5 rounded-full bg-slate-200 text-slate-700 text-xs">2</span>
                      Standard Pricing Rules
                    </h4>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-slate-600">Use Global Settings?</span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" checked={vendorForm.useGlobalPricing} onChange={e => setVendorForm({...vendorForm, useGlobalPricing: e.target.checked})} />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-500"></div>
                      </label>
                    </div>
                  </div>
                  
                  {!vendorForm.useGlobalPricing ? (
                    <div className="grid grid-cols-2 gap-4 animate-fadeIn">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">KTM Override Rate (Rs.) <span className="text-red-500">*</span></label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-medium text-sm">Rs.</span>
                          <input type="number" min="0" required className="input-field pl-9" 
                            value={vendorForm.defaultKtmRate} onChange={e => setVendorForm({...vendorForm, defaultKtmRate: Number(e.target.value)})} />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Outside Valley Base (Rs.) <span className="text-red-500">*</span></label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-medium text-sm">Rs.</span>
                          <input type="number" min="0" required className="input-field pl-9" 
                            value={vendorForm.defaultOutsideRate} onChange={e => setVendorForm({...vendorForm, defaultOutsideRate: Number(e.target.value)})} />
                        </div>
                        <p className="text-xs text-slate-500 mt-1.5">Fallback if city fee is not configured.</p>
                      </div>
                    </div>
                  ) : (
                    <div className="animate-fadeIn p-4 text-center bg-slate-50 border border-slate-100 rounded-lg text-slate-500 text-sm font-medium">
                      Vendor is currently using the Global Pricing Settings and configured City Fees.
                    </div>
                  )}
                </div>

                <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 mt-6">
                  <button type="button" className="btn-secondary" onClick={() => setVendorModalOpen(false)}>Cancel</button>
                  <button type="submit" className="btn-primary">Save Rules</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center animate-scaleIn">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-red-100">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h3 className="font-bold text-slate-900 text-xl mb-2">{confirmModal.title}</h3>
            <p className="text-slate-500 text-sm mb-6 leading-relaxed">{confirmModal.message}</p>
            <div className="flex gap-3 justify-center">
              <button className="btn-secondary flex-1" onClick={() => setConfirmModal({ open: false })}>Cancel</button>
              <button className="btn-primary bg-red-600 hover:bg-red-700 text-white flex-1 border-0" onClick={confirmModal.onConfirm}>Yes, Delete</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default PricingEngine;
