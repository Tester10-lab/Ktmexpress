import React, { useState, useEffect, useRef, useCallback } from 'react';
import api from '../api/axios';
import { useToast } from '../store/ToastContext';
import { Camera, Check, Clock, Edit2, Keyboard, Package, Phone, Copy, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';

// ─── Role-to-allowed-actions map ─────────────────────────────────────────────
const ROLE_ACTIONS = {
  dispatcher: ['Picked Up', 'In Warehouse', 'Sorted', 'Returned to Vendor'],
  rider:      ['Out for Delivery', 'Delivered', 'Returned'],
  admin:      ['Picked Up', 'In Warehouse', 'Sorted', 'Out for Delivery', 'Delivered', 'Returned', 'Returned to Vendor', 'Cancelled'],
};

const STATUS_COLORS = {
  'Pending':           'bg-amber-100 text-amber-700 ring-amber-500/30',
  'Pick Up Requested': 'bg-amber-100 text-amber-700 ring-amber-500/30',
  'Picked Up':         'bg-blue-100 text-blue-700 ring-blue-500/30',
  'In Warehouse':      'bg-purple-100 text-purple-700 ring-purple-500/30',
  'Sorted':            'bg-cyan-100 text-cyan-700 ring-cyan-500/30',
  'Out for Delivery':  'bg-orange-100 text-orange-700 ring-orange-500/30',
  'Delivered':         'bg-emerald-100 text-emerald-700 ring-emerald-500/30',
  'Postponed':         'bg-orange-100 text-orange-700 ring-orange-500/30',
  'Cancelled':         'bg-red-100 text-red-700 ring-red-500/30',
  'Returned':          'bg-red-100 text-red-700 ring-red-500/30',
  'Returned to Vendor':'bg-slate-100 text-slate-700 ring-slate-500/30',
};

function StatusPill({ status }) {
  const colorClass = STATUS_COLORS[status] || 'bg-slate-100 text-slate-700 ring-slate-500/30';
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${colorClass}`}>
      {status}
    </span>
  );
}

function beep(success = true) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = success ? 1200 : 400;
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.3);
  } catch (_) {}
}

// ─── Camera QR Scanner ────────────────────────────────────────────────────────
const CameraScanner = ({ onDetected, active }) => {
  const videoRef  = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const timerRef  = useRef(null);
  const lastCodeRef = useRef('');
  const [error, setError] = useState('');
  const [scanning, setScanning] = useState(false);

  const stopCamera = useCallback(() => {
    clearInterval(timerRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setScanning(false);
  }, []);

  const startCamera = useCallback(async () => {
    setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      
      if (!active || !videoRef.current) {
        stream.getTracks().forEach(t => t.stop());
        return;
      }
      
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(()=>{});
        setScanning(true);
      }

      const detector = ('BarcodeDetector' in window)
        ? new window.BarcodeDetector({ formats: ['qr_code', 'code_128', 'code_39'] })
        : null;

      timerRef.current = setInterval(async () => {
        if (!videoRef.current || videoRef.current.readyState < 2) return;
        try {
          let code = null;
          if (detector) {
            const results = await detector.detect(videoRef.current);
            if (results.length > 0) code = results[0].rawValue;
          } else {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            canvas.width  = videoRef.current.videoWidth;
            canvas.height = videoRef.current.videoHeight;
            ctx.drawImage(videoRef.current, 0, 0);
            const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const jsQR = (await import('jsqr')).default;
            const result = jsQR(imgData.data, imgData.width, imgData.height, { inversionAttempts: 'dontInvert' });
            if (result) code = result.data;
          }

          if (code && code !== lastCodeRef.current) {
            lastCodeRef.current = code;
            let trackingCode = code;
            try {
              const url = new URL(code);
              const param = url.searchParams.get('code');
              if (param) trackingCode = param;
            } catch (_) {}

            onDetected(trackingCode.toUpperCase());
            setTimeout(() => { lastCodeRef.current = ''; }, 3000);
          }
        } catch (_) {}
      }, 300);
    } catch (e) {
      console.error('Camera initialization error:', e);
      const isHttps = window.isSecureContext ? 'Yes' : 'No';
      const hasMedia = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
      setError(`Camera Error [${e.name}]: ${e.message}. 
        Debug Info -> HTTPS: ${isHttps} | API Supported: ${hasMedia} | UserAgent: ${navigator.userAgent.substring(0, 50)}...
        Please ensure you are on HTTPS and have granted camera permissions.`);
    }
  }, [onDetected, active]);

  useEffect(() => {
    if (active) startCamera();
    else stopCamera();
    return stopCamera;
  }, [active, startCamera, stopCamera]);

  return (
    <div>
      {error && (
        <div className="p-3 mb-3 bg-red-50 text-red-700 text-sm border border-red-200 rounded-lg">{error}</div>
      )}
      <div className="relative rounded-xl overflow-hidden bg-slate-900 aspect-video sm:aspect-[4/3] max-h-[300px]">
        <video ref={videoRef} muted playsInline className="w-full h-full object-cover" />
        <canvas ref={canvasRef} className="hidden" />
        {/* Scan overlay target */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-48 h-48 relative">
            <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-brand-400 rounded-tl-lg" />
            <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-brand-400 rounded-tr-lg" />
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-brand-400 rounded-bl-lg" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-brand-400 rounded-br-lg" />
          </div>
        </div>
        {!scanning && !error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white/80 gap-2 backdrop-blur-sm">
            <Camera className="w-8 h-8 animate-pulse" />
            <span className="text-sm font-medium">Starting camera...</span>
          </div>
        )}
        {scanning && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-brand-400 text-xs font-bold px-3 py-1.5 rounded-full tracking-wider backdrop-blur-md">
            SCANNING...
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Main ScanStation Component ───────────────────────────────────────────────
const ScanStation = ({ role = 'dispatcher', defaultAction = '' }) => {
  const [tab, setTab]             = useState('manual');
  const [code, setCode]           = useState('');
  const [action, setAction]       = useState(defaultAction);
  const [location, setLocation]   = useState('');
  const [notes, setNotes]         = useState('');
  const [lookupResult, setLookup] = useState(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [scanning, setScanning]   = useState(false);
  const [sessionLog, setSessionLog] = useState([]);
  const [bulkInput, setBulkInput] = useState('');
  const [bulkResults, setBulkResults] = useState(null);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [history, setHistory]     = useState([]);
  const [histLoading, setHistLoading] = useState(false);
  const inputRef = useRef(null);
  const { showToast } = useToast();

  const allowedActions = ROLE_ACTIONS[role] || [];

  useEffect(() => {
    if (tab === 'manual' && inputRef.current) inputRef.current.focus();
  }, [tab]);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => setLocation(`${pos.coords.latitude.toFixed(4)},${pos.coords.longitude.toFixed(4)}`),
        () => {}
      );
    }
  }, []);

  const loadHistory = useCallback(async () => {
    if (tab !== 'history') return;
    setHistLoading(true);
    try {
      const r = await api.get('/scan/my-history?limit=30');
      setHistory(r.data.data || []);
    } catch { showToast('Failed to load history', 'error'); }
    finally { setHistLoading(false); }
  }, [tab, showToast]);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  const lookupPackage = useCallback(async (trackingCode) => {
    const c = (trackingCode || code).trim().toUpperCase();
    if (!c) return;
    setLookupLoading(true);
    setLookup(null);
    try {
      const r = await api.get(`/scan/lookup/${c}`);
      setLookup(r.data.data);
      if (r.data.data.allowedActions?.length === 1 && !action) {
        setAction(r.data.data.allowedActions[0]);
      }
      beep(true);
    } catch (e) {
      beep(false);
      showToast(e.response?.data?.message || 'Package not found', 'error');
    } finally { setLookupLoading(false); }
  }, [code, action, showToast]);

  const submitScan = async () => {
    if (!lookupResult?.package || !action) return;
    setScanning(true);
    try {
      const r = await api.post('/scan', {
        trackingCode: lookupResult.package.trackingCode,
        action,
        location,
        notes,
      });
      const pkg = r.data.data.package;
      beep(true);
      showToast(r.data.message, 'success');
      setSessionLog(prev => [{
        trackingCode: pkg.trackingCode,
        customer: pkg.customerName,
        action,
        time: new Date().toLocaleTimeString(),
        success: true,
      }, ...prev.slice(0, 49)]);
      
      setCode('');
      setLookup(null);
      setNotes('');
      setAction(defaultAction);
      if (inputRef.current) inputRef.current.focus();
    } catch (e) {
      beep(false);
      showToast(e.response?.data?.message || 'Scan failed', 'error');
    } finally { setScanning(false); }
  };

  const onCameraDetected = useCallback(async (detectedCode) => {
    setCode(detectedCode);
    if (window.innerWidth <= 768) {
      setTab('manual');
    }
    await lookupPackage(detectedCode);
  }, [lookupPackage]);

  const submitBulkScan = async () => {
    if (!action) return showToast('Select an action first', 'warning');
    const codes = bulkInput.split(/[\n,\s]+/).map(s => s.trim().toUpperCase()).filter(Boolean);
    if (!codes.length) return showToast('Enter at least one tracking code', 'warning');
    setBulkLoading(true);
    setBulkResults(null);
    try {
      const r = await api.post('/scan/bulk', { trackingCodes: codes, action, location, notes });
      setBulkResults(r.data.data);
      beep(r.data.data.failed === 0);
      showToast(`${r.data.data.processed} processed, ${r.data.data.failed} failed`, r.data.data.failed === 0 ? 'success' : 'warning');
      setBulkInput('');
    } catch (e) {
      beep(false);
      showToast(e.response?.data?.message || 'Bulk scan failed', 'error');
    } finally { setBulkLoading(false); }
  };

  const tabs = [
    { id: 'manual', label: 'Manual Input', icon: <Keyboard className="w-5 h-5" /> },
    { id: 'camera', label: 'Camera Scan', icon: <Camera className="w-5 h-5" /> },
    { id: 'bulk',   label: 'Bulk Scan', icon: <Copy className="w-5 h-5" /> },
    { id: 'history',label: 'My History', icon: <Clock className="w-5 h-5" /> },
  ];

  const pkg = lookupResult?.package;

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto w-full">
      
      {/* Session counter */}
      {sessionLog.length > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 bg-brand-600 text-white rounded-xl shadow-md">
          <CheckCircle2 className="w-5 h-5 text-brand-200" />
          <span className="font-semibold text-sm">{sessionLog.length} packages scanned this session</span>
          <span className="ml-auto text-xs text-brand-200 font-medium hidden sm:inline">
            Last: {sessionLog[0]?.trackingCode} → {sessionLog[0]?.action}
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left panel - Input controls */}
        <div className="col-span-1 lg:col-span-7 xl:col-span-8 flex flex-col gap-6">
          
          {/* Tabs */}
          <div className="flex p-1 space-x-1 bg-slate-200/60 rounded-xl overflow-x-auto hide-scrollbar">
            {tabs.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex flex-col sm:flex-row items-center justify-center gap-2 flex-1 min-w-[80px] py-2.5 px-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                  tab === t.id
                    ? 'bg-white text-brand-600 shadow-sm ring-1 ring-slate-900/5'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                {t.icon}
                <span className="text-xs sm:text-sm">{t.label}</span>
              </button>
            ))}
          </div>

          {/* Active Tab Content */}
          <div className="card-premium p-6">
            
            {/* Manual Tab */}
            {tab === 'manual' && (
              <div className="animate-fadeIn">
                <h3 className="text-lg font-bold text-slate-900 mb-4">Scan or Type Tracking Code</h3>
                <div className="flex flex-col sm:flex-row gap-3 mb-4">
                  <input
                    ref={inputRef}
                    type="text"
                    value={code}
                    onChange={e => setCode(e.target.value.toUpperCase())}
                    onKeyDown={e => e.key === 'Enter' && lookupPackage()}
                    placeholder="e.g. ABC1234 or paste QR data"
                    className="flex-1 input-field font-mono font-bold tracking-wider text-lg uppercase"
                    autoComplete="off"
                  />
                  <button 
                    onClick={() => lookupPackage()} 
                    disabled={lookupLoading || !code.trim()}
                    className="btn-primary w-full sm:w-auto h-[46px]"
                  >
                    {lookupLoading ? '...' : 'Lookup Package'}
                  </button>
                </div>
                <p className="text-xs text-slate-500 font-medium">Press Enter after typing. USB barcode scanners work automatically.</p>
              </div>
            )}

            {/* Camera Tab */}
            {tab === 'camera' && (
              <div className="animate-fadeIn">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-slate-900">Mobile Camera Scanner</h3>
                </div>
                <CameraScanner onDetected={onCameraDetected} active={tab === 'camera'} />
                {code && (
                  <div className="mt-4 p-3 bg-emerald-50 text-emerald-800 rounded-lg border border-emerald-200 flex items-center justify-between">
                    <span className="text-sm font-medium">Code Detected</span>
                    <span className="font-mono font-bold tracking-wider">{code}</span>
                  </div>
                )}
              </div>
            )}

            {/* Bulk Tab */}
            {tab === 'bulk' && (
              <div className="animate-fadeIn">
                <h3 className="text-lg font-bold text-slate-900 mb-2">Bulk Scan</h3>
                <p className="text-sm text-slate-500 mb-4">Paste or type multiple tracking codes (one per line). Select an action, then submit.</p>
                <textarea
                  value={bulkInput}
                  onChange={e => setBulkInput(e.target.value.toUpperCase())}
                  placeholder="ABC1234&#10;DEF5678&#10;GHI9012"
                  rows={6}
                  className="input-field font-mono text-sm resize-y"
                />
                <div className="mt-4 flex flex-col sm:flex-row gap-3">
                  <select 
                    value={action} 
                    onChange={e => setAction(e.target.value)}
                    className="input-field sm:w-1/2"
                  >
                    <option value="">— Select Action —</option>
                    {allowedActions.map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                  <button 
                    onClick={submitBulkScan} 
                    disabled={bulkLoading || !bulkInput.trim() || !action}
                    className="btn-primary flex-1 h-[42px]"
                  >
                    {bulkLoading ? 'Processing...' : 'Submit Bulk Update'}
                  </button>
                </div>
                {bulkResults && (
                  <div className="mt-6 pt-4 border-t border-slate-100">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-sm font-semibold">
                        <CheckCircle2 className="w-4 h-4" /> {bulkResults.processed} Success
                      </span>
                      {bulkResults.failed > 0 && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-100 text-red-700 text-sm font-semibold">
                          <XCircle className="w-4 h-4" /> {bulkResults.failed} Failed
                        </span>
                      )}
                    </div>
                    {bulkResults.errors?.length > 0 && (
                      <div className="space-y-1 mt-3">
                        {bulkResults.errors.map((e, i) => (
                          <div key={i} className="text-sm text-red-600 flex items-start gap-2">
                            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                            <span><span className="font-mono font-bold mr-1">{e.code}:</span> {e.error}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* History Tab */}
            {tab === 'history' && (
              <div className="animate-fadeIn">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-slate-900">My Scan History</h3>
                  <button onClick={loadHistory} className="btn-secondary btn-sm">Refresh</button>
                </div>
                {histLoading ? (
                  <div className="py-12 text-center text-slate-400">Loading history...</div>
                ) : history.length === 0 ? (
                  <div className="py-12 text-center text-slate-400">No scans recorded yet.</div>
                ) : (
                  <div className="overflow-x-auto rounded-lg border border-slate-200">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-xs">
                        <tr>
                          <th className="px-4 py-3">Time</th>
                          <th className="px-4 py-3">Tracking Code</th>
                          <th className="px-4 py-3">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 bg-white">
                        {history.map(ev => (
                          <tr key={ev._id} className="hover:bg-slate-50">
                            <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{new Date(ev.createdAt).toLocaleTimeString()}</td>
                            <td className="px-4 py-3 font-mono font-bold text-brand-600">{ev.trackingCode}</td>
                            <td className="px-4 py-3"><StatusPill status={ev.toStatus} /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>

        {/* Right panel - Action & Detail */}
        <div className="col-span-1 lg:col-span-5 xl:col-span-4 flex flex-col gap-6">
          
          {pkg ? (
            <div className="card-premium animate-scaleIn bg-white overflow-visible">
              <div className="px-5 py-4 border-b border-brand-100 bg-brand-50 flex items-center gap-3">
                <Package className="w-5 h-5 text-brand-600" />
                <h4 className="font-bold text-brand-800">Package Found</h4>
              </div>
              
              <div className="p-5 space-y-5">
                <div>
                  <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase mb-1">Tracking Code</p>
                  <p className="font-mono text-2xl font-black text-slate-900 tracking-widest">{pkg.trackingCode}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase mb-1">Customer</p>
                    <p className="font-semibold text-slate-900">{pkg.customerName}</p>
                    <p className="text-sm text-slate-500 flex items-center gap-1.5 mt-0.5"><Phone className="w-3.5 h-3.5" /> {pkg.customerPhone}</p>
                  </div>
                  
                  <div className="col-span-2">
                    <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase mb-1">Delivery Address</p>
                    <p className="text-sm text-slate-700 leading-snug">{pkg.city ? `${pkg.city}, ` : ''}{pkg.address}</p>
                  </div>

                  <div>
                    <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase mb-1.5">Current Status</p>
                    <StatusPill status={pkg.status} />
                  </div>
                  
                  <div>
                    <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase mb-1">COD Amount</p>
                    <p className="font-bold text-brand-600 text-lg">Rs. {pkg.amount.toLocaleString()}</p>
                  </div>
                </div>

                {!lookupResult?.canScan && (
                  <div className="mt-2 p-3 bg-amber-50 rounded-lg border border-amber-200 flex gap-2 text-amber-800 text-sm">
                    <AlertTriangle className="w-5 h-5 shrink-0 text-amber-500" />
                    <span>This package cannot be updated from its current status.</span>
                  </div>
                )}
              </div>

              {lookupResult?.canScan && (
                <div className="p-5 bg-slate-50 border-t border-slate-100 space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Update Action <span className="text-red-500">*</span></label>
                    <select 
                      value={action} 
                      onChange={e => setAction(e.target.value)}
                      className="input-field bg-white"
                    >
                      <option value="">— Select Action —</option>
                      {(lookupResult?.allowedActions?.length > 0 ? lookupResult.allowedActions : allowedActions).map(a => (
                        <option key={a} value={a}>{a}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">Location / Notes (Optional)</label>
                    <input 
                      type="text" 
                      value={notes} 
                      onChange={e => setNotes(e.target.value)}
                      placeholder="Add remarks or location"
                      className="input-field bg-white" 
                    />
                  </div>

                  <button
                    onClick={submitScan}
                    disabled={scanning || !action}
                    className="w-full btn-primary h-12 text-base font-bold tracking-wide mt-2"
                  >
                    {scanning ? 'Processing...' : `Confirm ${action || 'Update'}`}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="card-premium h-full min-h-[300px] flex flex-col items-center justify-center p-8 text-center border-dashed bg-slate-50/50">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4 text-slate-400">
                <Package className="w-8 h-8" />
              </div>
              <h4 className="text-slate-900 font-semibold mb-1">No Package Selected</h4>
              <p className="text-sm text-slate-500 max-w-[200px]">Scan or type a tracking code to view details and take action.</p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default ScanStation;
