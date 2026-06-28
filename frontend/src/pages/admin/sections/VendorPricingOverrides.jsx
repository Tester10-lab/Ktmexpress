import React, { useState, useEffect, useCallback } from 'react';
import api from '../../../api/axios';
import { useToast } from '../../../store/ToastContext';
import Pagination from '../../../components/Pagination';
import { Search, X } from 'lucide-react';

const debounce = (func, wait) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

const SkeletonTable = ({ rows = 5 }) => (
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

const VendorPricingOverrides = ({ onUpdate }) => {
  const { showToast } = useToast();
  
  const [vendors, setVendors] = useState([]);
  const [vendorPagination, setVendorPagination] = useState({ page: 1, total: 0, pages: 1 });
  const [vendorSearch, setVendorSearch] = useState('');
  const [loadingVendors, setLoadingVendors] = useState(true);

  const [vendorModalOpen, setVendorModalOpen] = useState(false);
  const [vendorForm, setVendorForm] = useState({ 
    id: null, name: '', shopName: '', customFlatRate: '', defaultKtmRate: 150, defaultOutsideRate: 200, useGlobalPricing: true 
  });

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

  useEffect(() => {
    fetchVendors();
  }, []);

  const debouncedFetchVendors = useCallback(debounce((query) => fetchVendors(1, query), 400), []);
  const handleVendorSearchChange = (e) => {
    setVendorSearch(e.target.value);
    debouncedFetchVendors(e.target.value);
  };

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
      if (onUpdate) onUpdate();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update vendor pricing', 'error');
    }
  };

  return (
    <>
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
    </>
  );
};

export default VendorPricingOverrides;
