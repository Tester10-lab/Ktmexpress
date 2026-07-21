import React, { useEffect, useState } from 'react';
import { useTrackingDrawer } from '../store/TrackingDrawerContext';
import { useAuth } from '../store/AuthContext';
import api from '../api/axios';
import { X, MapPin, Loader2, Package, Phone, Truck, CreditCard } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useToast } from '../store/ToastContext';
import PackageTimeline from './PackageTimeline';

const statusColors = {
  Delivered: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  Cancelled: 'bg-red-100 text-red-700 border-red-200',
  'Returned to Vendor': 'bg-sky-100 text-sky-700 border-sky-200',
  default: 'bg-brand-100 text-brand-700 border-brand-200',
};

const TrackingDrawer = () => {
  const { trackingCode, shopData, openTracking, closeTracking } = useTrackingDrawer();
  const { user } = useAuth();
  const { showToast } = useToast();
  
  const [pkg, setPkg] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (trackingCode) {
      setIsClosing(false);
      fetchPackage(trackingCode);
    } else {
      setTimeout(() => setPkg(null), 300); // clear after animation
    }
  }, [trackingCode]);

  const fetchPackage = async (code) => {
    setLoading(true);
    setError('');
    try {
      // If user is logged in, use private route to get more details.
      // If not, use public route.
      const endpoint = user ? `/packages/track/${code}` : `/public/track/${code}`;
      const { data } = await api.get(endpoint);
      setPkg(data.data);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load tracking details.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(closeTracking, 300);
  };

  const statusStyle = pkg ? (statusColors[pkg.status] || statusColors.default) : statusColors.default;

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] transition-opacity duration-300 ${
          (trackingCode || shopData) && !isClosing ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={handleClose}
      />

      {/* Drawer */}
      <div 
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-[101] transform transition-transform duration-300 ease-in-out flex flex-col ${
          (trackingCode || shopData) && !isClosing ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Package className="w-5 h-5 text-brand-600" />
            {shopData ? 'Shop Pickup Requests' : 'Tracking Details'}
          </h2>
          <button onClick={handleClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {shopData ? (
            <div className="p-6 space-y-4">
              <div className="bg-brand-50 border border-brand-200 text-brand-700 rounded-xl p-4">
                <p className="font-bold text-sm">{shopData.packages.length} Pending Packages for {shopData.shopName}</p>
              </div>
              <div className="space-y-3">
                {shopData.packages.map((pkg, idx) => (
                  <div key={idx} className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                      <button 
                        onClick={() => openTracking(pkg.packageId?.trackingCode || pkg.trackingCode)}
                        className="text-sm font-bold font-mono text-brand-600 hover:underline">
                        {pkg.packageId?.trackingCode || pkg.trackingCode}
                      </button>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                        {pkg.status}
                      </span>
                    </div>
                    <div className="text-sm text-slate-700">
                      <p className="font-medium">{pkg.packageId?.customerName || pkg.customerName}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{pkg.packageId?.address || pkg.address}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : loading ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin mb-4" />
              <p>Loading package details...</p>
            </div>
          ) : error ? (
            <div className="p-6">
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4">
                <p className="font-bold mb-1">Error</p>
                <p className="text-sm">{error}</p>
              </div>
            </div>
          ) : pkg ? (
            <div className="p-6 space-y-6">
              {/* Header */}
              <div className={`p-5 rounded-xl border ${statusStyle}`}>
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider mb-1 opacity-80">Tracking ID</p>
                    <h3 className="text-xl font-black font-mono tracking-widest">{pkg.trackingCode}</h3>
                  </div>
                  <div className="px-3 py-1 rounded-full font-bold text-sm bg-white/50 backdrop-blur-sm border border-current">
                    {pkg.status}
                  </div>
                </div>
              </div>

              {/* Recipient Info */}
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-slate-400" /> Destination
                </h4>
                <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
                  <p className="font-bold text-slate-900">{pkg.customerName}</p>
                  <p className="text-sm text-slate-600 mt-1">{pkg.address}{pkg.city ? `, ${pkg.city}` : ''}</p>
                  {pkg.customerPhone && (
                    <p className="text-sm text-slate-600 mt-1 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5" /> {pkg.customerPhone}
                    </p>
                  )}
                </div>
              </div>

              {/* Protected Details (For Authenticated Users) */}
              {user && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    {pkg.vendorId && (
                      <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Vendor</p>
                        <p className="font-semibold text-slate-900">{(pkg.vendorId?.vendorMeta?.shopName || pkg.vendorId?.name) || pkg.vendorId}</p>
                      </div>
                    )}
                    <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                        <CreditCard className="w-3.5 h-3.5" /> Amount
                      </p>
                      <p className="font-semibold text-slate-900">Rs. {pkg.amount}</p>
                    </div>
                  </div>

                  {pkg.riderId && (
                    <div className="space-y-3">
                      <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                        <Truck className="w-4 h-4 text-slate-400" /> Assigned Rider
                      </h4>
                      <div className="bg-blue-50 rounded-lg p-4 border border-blue-100 flex justify-between items-center">
                        <p className="font-bold text-blue-900">{pkg.riderId.name || pkg.riderId}</p>
                        {pkg.riderId.contact && (
                          <a href={`tel:${pkg.riderId.contact}`} className="text-xs font-bold bg-white text-blue-600 px-3 py-1.5 rounded shadow-sm border border-blue-200 hover:bg-blue-50 transition-colors">
                            Call
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* QR / Barcode */}
              <div className="flex gap-4 p-4 bg-slate-50 border border-slate-100 rounded-xl">
                <div className="flex flex-col items-center justify-center bg-white p-2 rounded-lg border border-slate-200 shadow-sm shrink-0">
                  <img
                    src={pkg.qrCodeUrl || `https://quickchart.io/qr?size=100&text=${encodeURIComponent(`${window.location.origin}/track?code=${pkg.trackingCode}`)}`}
                    alt="QR Code" 
                    className="w-20 h-20"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 uppercase font-bold tracking-wider">QR</span>
                </div>
                <div className="flex flex-col items-center justify-center flex-1 bg-white p-2 rounded-lg border border-slate-200 shadow-sm">
                  <img
                    src={pkg.barcodeUrl || `https://barcodeapi.org/api/128/${pkg.trackingCode}`}
                    alt="Barcode" 
                    className="h-12 w-full object-contain"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 uppercase font-bold tracking-wider">Barcode</span>
                </div>
              </div>

              {/* Package Timeline & Comment Section */}
              <PackageTimeline 
                pkg={pkg} 
                onCommentAdded={(updatedPkg) => setPkg(updatedPkg)} 
              />
            </div>
          ) : (
            <div className="p-6 text-center text-slate-500">
              No package details available.
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default TrackingDrawer;
