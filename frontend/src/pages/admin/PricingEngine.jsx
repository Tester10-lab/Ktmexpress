import React, { useState, useEffect, useCallback } from 'react';
import api from '../../api/axios';
import { useToast } from '../../context/ToastContext';
import MetricCard from '../../components/MetricCard';

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
  <div className="table-container">
    <table className="data-table">
      <thead>
        <tr><th>Loading...</th></tr>
      </thead>
      <tbody>
        {Array.from({ length: rows }).map((_, i) => (
          <tr key={i}><td><div className="skeleton-row" /></td></tr>
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
    <div>
      {/* 1. Dashboard Summary Cards */}
      <div className="metrics-grid">
        <MetricCard title="Global KTM Rate" value={`Rs. ${globalSettings.ktmBaseRate}`} color="primary"
          icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="15" rx="2" ry="2"/><polyline points="17 2 12 7 7 2"/></svg>} />
        <MetricCard title="Surcharge / KG" value={`Rs. ${globalSettings.weightSurchargePerKg}`} color="warning"
          icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>} />
        <MetricCard title="Cities Configured" value={loadingSummary ? '-' : summary.totalOvCities} color="info"
          icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>} />
        <MetricCard title="Custom Pricing Vendors" value={loadingSummary ? '-' : summary.customPricingVendors} color="purple"
          icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>} />
      </div>

      <div className="dashboard-section-grid" style={{ gridTemplateColumns: 'minmax(300px, 1fr) 2fr' }}>
        
        {/* 2. Global Pricing Settings */}
        <div className="card h-fit">
          <div className="card-header border-b">
            <div className="header-title-group">
              <h3>Global Pricing Settings</h3>
              <p>Default rates across the platform</p>
            </div>
          </div>
          <div className="card-body">
            <form onSubmit={handleSaveGlobalSettings}>
              <div className="form-group">
                <label>KTM Valley Base Rate (Rs.)</label>
                <input type="number" min="0" required className="form-control" 
                  value={globalSettings.ktmBaseRate} 
                  onChange={(e) => setGlobalSettings({...globalSettings, ktmBaseRate: Number(e.target.value)})} />
                <p className="font-xs text-muted mt-1">Applied to deliveries within the valley unless overridden by vendor.</p>
              </div>
              <div className="form-group mb-6">
                <label>Weight Surcharge per KG (Rs.)</label>
                <input type="number" min="0" required className="form-control" 
                  value={globalSettings.weightSurchargePerKg} 
                  onChange={(e) => setGlobalSettings({...globalSettings, weightSurchargePerKg: Number(e.target.value)})} />
                <p className="font-xs text-muted mt-1">Added for every KG above 1KG.</p>
              </div>
              <button type="submit" className="btn btn-primary btn-block" disabled={savingGlobal}>
                {savingGlobal ? 'Saving...' : 'Save Global Settings'}
              </button>
            </form>
          </div>
        </div>

        {/* 3. Outside Valley City Fees */}
        <div className="card p-0">
          <div className="card-header border-b" style={{ padding: 20 }}>
            <div className="header-title-group">
              <h3>Outside Valley Delivery Fees</h3>
              <p>Configure specific delivery rates for cities outside Kathmandu Valley</p>
            </div>
            <div className="header-controls">
              <div className="search-bar-inline" style={{ width: 220 }}>
                <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                <input type="text" className="form-control search-input select-sm" placeholder="Search city..." 
                  value={ovSearch} onChange={handleOvSearchChange} />
              </div>
              <button className="btn btn-primary btn-sm" onClick={() => openOvModal()}>+ Add City</button>
            </div>
          </div>
          
          {loadingOv ? <SkeletonTable /> : (
            <>
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>City Name</th>
                      <th>Delivery Fee</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ovFees.length === 0 ? (
                      <tr><td colSpan="4" className="text-center text-muted" style={{ padding: 32 }}>No cities configured.</td></tr>
                    ) : (
                      ovFees.map(fee => (
                        <tr key={fee._id}>
                          <td className="semibold">{fee.city}</td>
                          <td className="text-primary-color semibold">Rs. {fee.fee}</td>
                          <td>
                            <span className={`badge ${fee.isActive ? 'badge-success' : 'badge-secondary'}`}>
                              {fee.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                              <button className="btn btn-sm btn-outline" onClick={() => handleToggleOvFeeStatus(fee)} title={fee.isActive ? 'Deactivate' : 'Activate'}>
                                {fee.isActive ? 'Disable' : 'Enable'}
                              </button>
                              <button className="btn btn-sm btn-secondary" onClick={() => openOvModal(fee)}>Edit</button>
                              <button className="btn btn-sm btn-danger" onClick={() => handleDeleteOvFee(fee)}>Del</button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              {ovPagination.pages > 1 && (
                <div className="pagination-controls">
                  <span>Page {ovPagination.page} of {ovPagination.pages}</span>
                  <div className="pagination-btn-group">
                    <button className="btn btn-sm btn-outline" disabled={ovPagination.page === 1} onClick={() => fetchOvFees(ovPagination.page - 1)}>Prev</button>
                    <button className="btn btn-sm btn-outline" disabled={ovPagination.page === ovPagination.pages} onClick={() => fetchOvFees(ovPagination.page + 1)}>Next</button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* 4. Vendor-Specific Pricing Matrix */}
      <div className="card p-0 mt-4">
        <div className="card-header border-b" style={{ padding: 20 }}>
          <div className="header-title-group">
            <h3>Vendor Pricing Matrix</h3>
            <p>Manage pricing overrides and rules for individual vendors</p>
          </div>
          <div className="header-controls">
            <div className="search-bar-inline" style={{ width: 260 }}>
              <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
              <input type="text" className="form-control search-input" placeholder="Search vendors..." 
                value={vendorSearch} onChange={handleVendorSearchChange} />
            </div>
          </div>
        </div>

        {loadingVendors ? <SkeletonTable rows={5} /> : (
          <>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Vendor</th>
                    <th>Pricing Mode</th>
                    <th>Custom Flat Rate</th>
                    <th>KTM Override</th>
                    <th>OV Override</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {vendors.length === 0 ? (
                    <tr><td colSpan="6" className="text-center text-muted" style={{ padding: 32 }}>No vendors found.</td></tr>
                  ) : (
                    vendors.map(v => {
                      const meta = v.vendorMeta || {};
                      const isGlobal = meta.useGlobalPricing !== false;
                      const hasFlat = meta.customFlatRate !== null && meta.customFlatRate !== undefined;
                      
                      return (
                        <tr key={v._id}>
                          <td>
                            <div className="semibold">{v.name}</div>
                            <div className="font-xs text-muted">{meta.shopName || v.email}</div>
                          </td>
                          <td>
                            {hasFlat ? (
                              <span className="badge badge-purple">Flat Rate</span>
                            ) : isGlobal ? (
                              <span className="badge badge-success">Global</span>
                            ) : (
                              <span className="badge badge-warning">Custom Override</span>
                            )}
                          </td>
                          <td className="semibold text-purple">
                            {hasFlat ? `Rs. ${meta.customFlatRate}` : '—'}
                          </td>
                          <td className={!isGlobal && !hasFlat ? 'semibold' : 'text-muted'}>
                            {meta.defaultKtmRate !== undefined ? `Rs. ${meta.defaultKtmRate}` : '—'}
                          </td>
                          <td className={!isGlobal && !hasFlat ? 'semibold' : 'text-muted'}>
                            {meta.defaultOutsideRate !== undefined ? `Rs. ${meta.defaultOutsideRate}` : '—'}
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <button className="btn btn-sm btn-secondary" onClick={() => openVendorModal(v)}>Manage Rules</button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            {vendorPagination.pages > 1 && (
              <div className="pagination-controls">
                <span>Page {vendorPagination.page} of {vendorPagination.pages}</span>
                <div className="pagination-btn-group">
                  <button className="btn btn-sm btn-outline" disabled={vendorPagination.page === 1} onClick={() => fetchVendors(vendorPagination.page - 1)}>Prev</button>
                  <button className="btn btn-sm btn-outline" disabled={vendorPagination.page === vendorPagination.pages} onClick={() => fetchVendors(vendorPagination.page + 1)}>Next</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* --- Modals --- */}
      
      {/* OV Fee Modal */}
      {ovModalOpen && (
        <div className="modal-backdrop" onClick={() => setOvModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{ovForm.id ? 'Edit City Fee' : 'Add City Fee'}</h3>
              <button className="modal-close" onClick={() => setOvModalOpen(false)}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleSaveOvFee}>
                <div className="form-group">
                  <label>City Name *</label>
                  <input type="text" required className="form-control" placeholder="e.g. Pokhara"
                    value={ovForm.city} onChange={e => setOvForm({...ovForm, city: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Delivery Fee (Rs.) *</label>
                  <input type="number" required min="0" className="form-control" 
                    value={ovForm.fee} onChange={e => setOvForm({...ovForm, fee: Number(e.target.value)})} />
                </div>
                <div className="checkbox-wrapper mt-4">
                  <label className="toggle-switch">
                    <input type="checkbox" checked={ovForm.isActive} onChange={e => setOvForm({...ovForm, isActive: e.target.checked})} />
                    <span className="toggle-slider"></span>
                  </label>
                  <span className="font-sm semibold">Active</span>
                </div>
                <div className="confirm-modal-actions">
                  <button type="button" className="btn btn-outline" onClick={() => setOvModalOpen(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">Save Fee</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Vendor Pricing Modal */}
      {vendorModalOpen && (
        <div className="modal-backdrop" onClick={() => setVendorModalOpen(false)}>
          <div className="modal-content max-w-600" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 style={{ marginBottom: 4 }}>Configure Pricing Rules</h3>
                <p className="font-xs text-muted">{vendorForm.name} {vendorForm.shopName ? `— ${vendorForm.shopName}` : ''}</p>
              </div>
              <button className="modal-close" onClick={() => setVendorModalOpen(false)}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleSaveVendorPricing}>
                
                <div className="card p-0 mb-6 bg-purple-soft" style={{ border: '1px dashed var(--color-purple)' }}>
                  <div className="card-body" style={{ padding: 16 }}>
                    <h4 className="font-sm text-purple mb-2">1. Master Override (Optional)</h4>
                    <p className="font-xs text-muted mb-3">If set, this flat rate is charged for EVERY delivery for this vendor, regardless of location or global settings.</p>
                    <div className="form-group mb-0">
                      <label>Custom Flat Rate (Rs.)</label>
                      <input type="number" min="0" className="form-control" placeholder="Leave empty to use rules below"
                        value={vendorForm.customFlatRate} onChange={e => setVendorForm({...vendorForm, customFlatRate: e.target.value})} />
                    </div>
                  </div>
                </div>

                <div className="card p-0 mb-4">
                  <div className="card-body" style={{ padding: 16 }}>
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-sm mb-0">2. Standard Pricing Rules</h4>
                      <div className="flex items-center gap-2">
                        <span className="font-xs text-muted">Use Global Settings?</span>
                        <label className="toggle-switch">
                          <input type="checkbox" checked={vendorForm.useGlobalPricing} onChange={e => setVendorForm({...vendorForm, useGlobalPricing: e.target.checked})} />
                          <span className="toggle-slider"></span>
                        </label>
                      </div>
                    </div>
                    
                    {!vendorForm.useGlobalPricing ? (
                      <div className="form-row animate-fadeIn">
                        <div className="form-group col-6">
                          <label>KTM Override Rate (Rs.)</label>
                          <input type="number" min="0" required className="form-control" 
                            value={vendorForm.defaultKtmRate} onChange={e => setVendorForm({...vendorForm, defaultKtmRate: Number(e.target.value)})} />
                        </div>
                        <div className="form-group col-6">
                          <label>Outside Valley Base (Rs.)</label>
                          <input type="number" min="0" required className="form-control" 
                            value={vendorForm.defaultOutsideRate} onChange={e => setVendorForm({...vendorForm, defaultOutsideRate: Number(e.target.value)})} />
                          <p className="font-xs text-muted mt-1">Fallback if city fee is not configured.</p>
                        </div>
                      </div>
                    ) : (
                      <div className="animate-fadeIn p-4 text-center border-t text-muted font-sm" style={{ backgroundColor: 'rgba(0,0,0,0.02)', borderRadius: 'var(--radius-sm)' }}>
                        Vendor is currently using the Global Pricing Settings and configured City Fees.
                      </div>
                    )}
                  </div>
                </div>

                <div className="confirm-modal-actions">
                  <button type="button" className="btn btn-outline" onClick={() => setVendorModalOpen(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">Save Rules</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmModal.open && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: 400 }}>
            <div className="modal-body text-center">
              <div className="metric-icon bg-danger-soft text-danger mx-auto mb-4" style={{ margin: '0 auto', width: 64, height: 64, borderRadius: '50%' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
              </div>
              <h3 className="mb-2">{confirmModal.title}</h3>
              <p className="text-muted font-sm mb-6">{confirmModal.message}</p>
              <div className="flex gap-3 justify-center">
                <button className="btn btn-outline" onClick={() => setConfirmModal({ open: false })}>Cancel</button>
                <button className="btn btn-danger" onClick={confirmModal.onConfirm}>Yes, Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default PricingEngine;
