import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Printer, X, Search, Calendar, Store, Bike, CheckSquare, 
  Square, Filter, Package, RefreshCw, AlertCircle 
} from 'lucide-react';
import PrintLabel from './PrintLabel';
import api from '../api/axios';

/**
 * PrintLabelsModal Component
 * Interactive modal for Dispatcher and Admin to filter, select, and batch print 4x6 courier labels.
 */
export default function PrintLabelsModal({ 
  isOpen, 
  onClose, 
  packages = [], 
  vendors = [], 
  riders = [],
  onRefresh
}) {
  const printRef = useRef(null);

  // Filter states
  const [activeDateTab, setActiveDateTab] = useState('all'); // 'all', 'today', 'date'
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedVendor, setSelectedVendor] = useState('');
  const [selectedRider, setSelectedRider] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected packages IDs
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [isPrinting, setIsPrinting] = useState(false);

  // Auto-select all filtered packages when opening or filter changes if desired
  // Or synchronize selection
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Filtered packages
  const filteredPackages = useMemo(() => {
    return packages.filter((pkg) => {
      // 1. Date Filter
      if (activeDateTab === 'today') {
        const pkgDate = pkg.createdAt ? new Date(pkg.createdAt).toISOString().split('T')[0] : '';
        const deliveryDate = pkg.deliveryDate ? new Date(pkg.deliveryDate).toISOString().split('T')[0] : '';
        if (pkgDate !== todayStr && deliveryDate !== todayStr) return false;
      } else if (activeDateTab === 'date' && selectedDate) {
        const pkgDate = pkg.createdAt ? new Date(pkg.createdAt).toISOString().split('T')[0] : '';
        const deliveryDate = pkg.deliveryDate ? new Date(pkg.deliveryDate).toISOString().split('T')[0] : '';
        if (pkgDate !== selectedDate && deliveryDate !== selectedDate) return false;
      }

      // 2. Vendor Filter
      if (selectedVendor) {
        const vendorId = pkg.vendorId?._id || pkg.vendorId || '';
        const vendorName = pkg.vendorId?.vendorMeta?.shopName || pkg.vendorId?.name || pkg.vendorName || '';
        if (vendorId !== selectedVendor && vendorName !== selectedVendor) return false;
      }

      // 3. Rider Filter
      if (selectedRider) {
        const riderId = pkg.riderId?._id || pkg.riderId || '';
        const riderName = pkg.riderId?.name || (typeof pkg.riderId === 'string' ? pkg.riderId : '') || '';
        if (riderId !== selectedRider && riderName !== selectedRider) return false;
      }

      // 4. Status Filter
      if (selectedStatus) {
        if (pkg.status !== selectedStatus) return false;
      }

      // 5. Search query (Tracking ID, Invoice, Customer Name, Phone)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const trk = (pkg.trackingCode || '').toLowerCase();
        const inv = (pkg.invoiceId || '').toLowerCase();
        const cust = (pkg.customerName || '').toLowerCase();
        const phone = (pkg.customerPhone || '').toLowerCase();
        const city = (pkg.city || '').toLowerCase();
        if (!trk.includes(q) && !inv.includes(q) && !cust.includes(q) && !phone.includes(q) && !city.includes(q)) {
          return false;
        }
      }

      return true;
    });
  }, [packages, activeDateTab, selectedDate, selectedVendor, selectedRider, selectedStatus, searchQuery, todayStr]);

  // Initial selection when opening
  useEffect(() => {
    if (isOpen) {
      // By default select all currently filtered packages
      const ids = new Set(filteredPackages.map(p => p._id || p.trackingCode));
      setSelectedIds(ids);
    }
  }, [isOpen, filteredPackages.length]);

  if (!isOpen) return null;

  // Toggle single selection
  const toggleSelectOne = (id) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  // Toggle select all visible
  const allVisibleSelected = filteredPackages.length > 0 && filteredPackages.every(p => selectedIds.has(p._id || p.trackingCode));
  const someVisibleSelected = filteredPackages.some(p => selectedIds.has(p._id || p.trackingCode));

  const toggleSelectAll = () => {
    const next = new Set(selectedIds);
    if (allVisibleSelected) {
      filteredPackages.forEach(p => next.delete(p._id || p.trackingCode));
    } else {
      filteredPackages.forEach(p => next.add(p._id || p.trackingCode));
    }
    setSelectedIds(next);
  };

  // Packages ready to print
  const selectedPackagesToPrint = packages.filter(p => selectedIds.has(p._id || p.trackingCode));

  // Handle Print Action
  const handlePrint = () => {
    if (selectedPackagesToPrint.length === 0) return;
    setIsPrinting(true);
    if (printRef.current) {
      printRef.current.print();
    }
    setTimeout(() => setIsPrinting(false), 1000);
  };

  // Reset Filters
  const handleResetFilters = () => {
    setActiveDateTab('all');
    setSelectedDate(todayStr);
    setSelectedVendor('');
    setSelectedRider('');
    setSelectedStatus('');
    setSearchQuery('');
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden border border-slate-200">
        
        {/* ── MODAL HEADER ── */}
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-md">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Print Delivery Labels</h2>
              <p className="text-xs text-slate-500">4×6 Inch thermal courier label batch generator</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── FILTERS BAR ── */}
        <div className="p-5 border-b border-slate-200 bg-white space-y-3 shrink-0">
          
          {/* Quick Date Tabs & Controls */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-1">Filter Date:</span>
            
            <button
              onClick={() => setActiveDateTab('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                activeDateTab === 'all' 
                  ? 'bg-slate-900 text-white shadow-sm' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Dates
            </button>

            <button
              onClick={() => setActiveDateTab('today')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                activeDateTab === 'today' 
                  ? 'bg-slate-900 text-white shadow-sm' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              📅 Today's Deliveries
            </button>

            <button
              onClick={() => setActiveDateTab('date')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                activeDateTab === 'date' 
                  ? 'bg-slate-900 text-white shadow-sm' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              📆 Date Wise
            </button>

            {activeDateTab === 'date' && (
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="input-field text-xs py-1 px-2.5 w-auto"
              />
            )}

            <div className="ml-auto flex items-center gap-2">
              <button
                onClick={handleResetFilters}
                className="text-xs text-slate-500 hover:text-slate-800 underline font-medium px-2 py-1"
              >
                Reset Filters
              </button>
              {onRefresh && (
                <button
                  onClick={onRefresh}
                  className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
                  title="Refresh Packages"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Secondary Dropdown Filters Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-1">
            
            {/* Search Box */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search Tracking ID, Customer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-field pl-8 py-1.5 text-xs"
              />
            </div>

            {/* Vendor Selector */}
            <select
              value={selectedVendor}
              onChange={(e) => setSelectedVendor(e.target.value)}
              className="input-field py-1.5 text-xs font-medium"
            >
              <option value="">🏢 All Vendors</option>
              {vendors.map((v) => (
                <option key={v._id || v.id} value={v._id || v.id}>
                  {v.vendorMeta?.shopName || v.name || v.shopName || v.email}
                </option>
              ))}
            </select>

            {/* Rider Selector */}
            <select
              value={selectedRider}
              onChange={(e) => setSelectedRider(e.target.value)}
              className="input-field py-1.5 text-xs font-medium"
            >
              <option value="">🛵 All Assigned Riders</option>
              {riders.map((r) => (
                <option key={r._id || r.id} value={r._id || r.id}>
                  {r.name} {r.contact ? `(${r.contact})` : ''}
                </option>
              ))}
            </select>

            {/* Status Selector */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="input-field py-1.5 text-xs font-medium"
            >
              <option value="">🏷️ All Statuses</option>
              <option value="Dispatched">Dispatched / Out for Delivery</option>
              <option value="In Warehouse">In Warehouse / Arrived</option>
              <option value="Picked Up">Picked Up</option>
              <option value="Pending">Pending</option>
              <option value="Postponed">Postponed</option>
              <option value="Delivered">Delivered</option>
              <option value="Returned">Returned to Vendor</option>
            </select>

          </div>
        </div>

        {/* ── PACKAGE SELECTION TABLE ── */}
        <div className="flex-1 overflow-y-auto bg-slate-50/50 p-4">
          {filteredPackages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400">
              <Package className="w-10 h-10 mb-2 opacity-40" />
              <p className="font-semibold text-slate-600">No packages match the current filters.</p>
              <p className="text-xs text-slate-400 mt-1">Try selecting a different date, vendor, or clearing the search query.</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100 text-slate-600 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200 sticky top-0 z-10">
                  <tr>
                    <th className="p-3 w-10 text-center">
                      <button 
                        onClick={toggleSelectAll}
                        className="text-slate-700 hover:text-slate-900 transition-colors"
                        title={allVisibleSelected ? 'Deselect All' : 'Select All'}
                      >
                        {allVisibleSelected ? (
                          <CheckSquare className="w-4 h-4 text-slate-900" />
                        ) : someVisibleSelected ? (
                          <div className="w-4 h-4 bg-slate-900 text-white rounded flex items-center justify-center text-[10px] font-black">-</div>
                        ) : (
                          <Square className="w-4 h-4 text-slate-400" />
                        )}
                      </button>
                    </th>
                    <th className="p-3">Tracking ID / Invoice</th>
                    <th className="p-3">Customer & Destination</th>
                    <th className="p-3">Vendor</th>
                    <th className="p-3">Rider</th>
                    <th className="p-3">COD Amount</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPackages.map((pkg) => {
                    const id = pkg._id || pkg.trackingCode;
                    const isSelected = selectedIds.has(id);
                    const vendorName = pkg.vendorId?.vendorMeta?.shopName || pkg.vendorId?.name || pkg.vendorName || '—';
                    const riderName = pkg.riderId?.name || (typeof pkg.riderId === 'string' ? pkg.riderId : '') || 'Unassigned';

                    return (
                      <tr 
                        key={id}
                        onClick={() => toggleSelectOne(id)}
                        className={`cursor-pointer transition-colors ${
                          isSelected ? 'bg-slate-50 hover:bg-slate-100/80 font-medium' : 'hover:bg-slate-50/60'
                        }`}
                      >
                        <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                          <button 
                            onClick={() => toggleSelectOne(id)}
                            className="text-slate-700 hover:text-slate-900"
                          >
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-slate-900" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-300" />
                            )}
                          </button>
                        </td>
                        <td className="p-3 font-mono">
                          <div className="font-bold text-slate-900">{pkg.trackingCode}</div>
                          {pkg.invoiceId && (
                            <div className="text-[10px] text-slate-400">Ref: {pkg.invoiceId}</div>
                          )}
                        </td>
                        <td className="p-3">
                          <div className="font-semibold text-slate-900">{pkg.customerName}</div>
                          <div className="text-[11px] text-slate-500 truncate max-w-xs">
                            {pkg.address}{pkg.city ? `, ${pkg.city}` : ''}
                          </div>
                          <div className="text-[10px] text-slate-400">📞 {pkg.customerPhone || '—'}</div>
                        </td>
                        <td className="p-3 text-slate-700">
                          <div className="font-medium truncate max-w-[140px]">{vendorName}</div>
                        </td>
                        <td className="p-3 text-slate-700">
                          <div className="font-medium truncate max-w-[130px]">{riderName}</div>
                        </td>
                        <td className="p-3">
                          <div className="font-bold text-slate-900">
                            Rs. {Number(pkg.amount || 0).toLocaleString()}
                          </div>
                          <div className="text-[10px] text-slate-400 uppercase font-semibold">
                            {pkg.paymentMethod || (pkg.amount > 0 ? 'COD' : 'Prepaid')}
                          </div>
                        </td>
                        <td className="p-3">
                          <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
                            {pkg.status || 'Pending'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── MODAL FOOTER & ACTION ── */}
        <div className="px-6 py-4 border-t border-slate-200 bg-white flex items-center justify-between shrink-0 shadow-lg">
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-slate-900">
              {selectedPackagesToPrint.length} package{selectedPackagesToPrint.length === 1 ? '' : 's'} selected
            </span>
            <span className="text-xs text-slate-400">
              (out of {filteredPackages.length} filtered)
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="btn-secondary text-xs px-4 py-2"
            >
              Cancel
            </button>

            <button
              onClick={handlePrint}
              disabled={selectedPackagesToPrint.length === 0}
              className="btn-primary text-xs px-5 py-2.5 flex items-center gap-2 shadow-md disabled:opacity-50 disabled:pointer-events-none"
            >
              <Printer className="w-4 h-4" />
              Print {selectedPackagesToPrint.length} Label{selectedPackagesToPrint.length === 1 ? '' : 's'}
            </button>
          </div>
        </div>

      </div>

      {/* Hidden Print Portal */}
      <PrintLabel ref={printRef} packages={selectedPackagesToPrint} />
    </div>
  );
}
