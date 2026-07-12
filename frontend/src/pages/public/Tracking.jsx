import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../../api/axios';
import { Search, Phone, MapPin, Loader2, Info } from 'lucide-react';
import PublicNav from '../../components/PublicNav';
import PublicFooter from '../../components/PublicFooter';

const statusColors = {
  Delivered: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  Cancelled: 'bg-red-100 text-red-700 border-red-200',
  'Returned to Vendor': 'bg-sky-100 text-sky-700 border-sky-200',
  default: 'bg-brand-100 text-brand-700 border-brand-200',
};

const Tracking = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [code, setCode] = useState(searchParams.get('code') || '');
  const [pkg, setPkg] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const initial = searchParams.get('code');
    if (initial) doTrack(initial);
  }, []);

  const doTrack = async (trackCode) => {
    const q = (trackCode || code).trim();
    if (!q) return;
    setLoading(true); setError(''); setPkg(null);
    setSearchParams({ code: q });
    try {
      const { data } = await api.get(`/public/track/${q}`);
      setPkg(data.data);
    } catch (e) {
      setError(e.message || 'Tracking code not found. Please check and try again.');
    } finally { setLoading(false); }
  };

  const statusStyle = pkg ? (statusColors[pkg.status] || statusColors.default) : statusColors.default;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <PublicNav active="/track" />

      <section className="bg-gradient-to-r from-brand-900 via-brand-800 to-indigo-900 py-16 px-6 text-center shadow-inner relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5"></div>
        <div className="max-w-2xl mx-auto relative z-10">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-4 tracking-tight">Track Your Package</h1>
          <p className="text-brand-100 text-lg mb-8">Enter your tracking code for real-time status updates</p>
          
          <div className="flex bg-white/10 backdrop-blur-md p-1.5 rounded-2xl shadow-2xl border border-white/20">
            <input 
              type="text" 
              value={code} 
              onChange={e => setCode(e.target.value)} 
              onKeyDown={e => e.key === 'Enter' && doTrack()}
              placeholder="e.g. LOG-2026-ABC12"
              className="flex-1 bg-white border-none outline-none px-5 py-4 rounded-xl text-slate-900 font-mono tracking-wider font-semibold placeholder:text-slate-400 placeholder:font-sans placeholder:font-normal"
            />
            <button 
              className="ml-2 bg-brand-600 hover:bg-brand-500 text-white font-bold px-6 py-4 rounded-xl transition-colors shadow-lg disabled:opacity-70 flex items-center gap-2"
              onClick={() => doTrack()} 
              disabled={loading}
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
              <span className="hidden sm:inline">{loading ? 'Searching...' : 'Track'}</span>
            </button>
          </div>
        </div>
      </section>

      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-12 -mt-8 relative z-20">
        <div className="max-w-3xl mx-auto">
          
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-5 mb-8 flex gap-4 shadow-sm animate-scaleIn">
              <Info className="w-6 h-6 text-red-500 shrink-0" />
              <div>
                <strong className="block text-red-800 mb-1">Package Not Found</strong>
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            </div>
          )}

          {pkg && (
            <div className="card-premium overflow-hidden animate-fadeInUp shadow-xl">
              {/* Header */}
              <div className={`px-6 py-5 border-b flex justify-between items-center gap-4 flex-wrap ${statusStyle.replace('border-', 'border-b-')}`}>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Tracking ID</p>
                  <h2 className="text-2xl font-black font-mono tracking-widest text-slate-900">{pkg.trackingCode}</h2>
                </div>
                <div className={`px-4 py-2 rounded-full font-bold text-sm border ${statusStyle}`}>
                  {pkg.status}
                </div>
              </div>

              {/* Info Row */}
              <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-end">
                <div className="text-right">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Last Updated</p>
                  <p className="font-semibold text-slate-900">{new Date(pkg.updatedAt).toLocaleString()}</p>
                </div>
              </div>

              {/* QR / Barcode */}
              <div className="m-6 flex flex-wrap gap-6">
                <div className="flex flex-col items-center p-4 bg-slate-50 border border-slate-200 rounded-xl">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Scan to Track</p>
                  <div className="bg-white p-2 rounded-lg border border-slate-200 shadow-sm">
                    <img
                      src={pkg.qrCodeUrl || `https://quickchart.io/qr?size=150&text=${encodeURIComponent(`${window.location.origin}/track?code=${pkg.trackingCode}`)}`}
                      alt="QR Code" 
                      className="w-32 h-32"
                    />
                  </div>
                </div>
                <div className="flex-1 min-w-[200px] flex flex-col items-center p-4 bg-slate-50 border border-slate-200 rounded-xl justify-center">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Package Barcode</p>
                  <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm w-full">
                    <img
                      src={pkg.barcodeUrl || `https://barcodeapi.org/api/128/${pkg.trackingCode}`}
                      alt="Barcode" 
                      className="h-16 w-full object-contain"
                    />
                  </div>
                </div>
              </div>

              {/* Timeline */}
              {pkg.timeline?.length > 0 && (
                <div className="p-6 pt-0 mt-4">
                  <h3 className="text-lg font-bold text-slate-900 mb-6">Delivery Timeline</h3>
                  <div className="space-y-0">
                    {[...pkg.timeline].reverse().map((event, idx, arr) => (
                      <div key={idx} className="flex gap-4 pb-6 relative group">
                        {/* Line & Dot */}
                        <div className="flex flex-col items-center shrink-0">
                          <div className={`w-3.5 h-3.5 rounded-full border-2 mt-1 z-10 ${
                            idx === 0 
                              ? 'bg-brand-500 border-brand-500 ring-4 ring-brand-100' 
                              : 'bg-white border-slate-300'
                          }`} />
                          {idx < arr.length - 1 && (
                            <div className="w-0.5 h-full bg-slate-200 absolute top-4 bottom-0" />
                          )}
                        </div>
                        
                        {/* Content */}
                        <div className="flex-1 pb-2">
                          <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                            <span className={`font-bold text-sm ${idx === 0 ? 'text-slate-900' : 'text-slate-600'}`}>{event.status}</span>
                            <span className="text-xs font-medium text-slate-400">{event.time}</span>
                          </div>
                          {event.message && <p className="text-sm text-slate-500 mt-1">{event.message}</p>}
                          
                          <div className="flex flex-wrap items-center gap-2 mt-2">
                            <span className="text-xs text-slate-400">by <span className="font-medium text-slate-600">{event.user}</span></span>
                            {event.role && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 uppercase tracking-wider">
                                {event.role}
                              </span>
                            )}
                            {event.location && (
                              <span className="text-xs text-slate-500 flex items-center gap-1 ml-2">
                                <MapPin className="w-3 h-3 text-slate-400" /> {event.location}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {!pkg && !error && !loading && (
            <div className="card-premium p-16 text-center border-dashed bg-white shadow-sm">
              <Search className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-slate-900 mb-2">Enter a Tracking Code</h3>
              <p className="text-slate-500 text-sm max-w-sm mx-auto">Type your code above and press Track to see real-time delivery status updates and history.</p>
            </div>
          )}
        </div>
      </main>

      <PublicFooter />
    </div>
  );
};

export default Tracking;
