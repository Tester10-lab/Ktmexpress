import React, { useState, useEffect, useRef, useCallback } from 'react';
import api from '../api/axios';
import { useToast } from '../store/ToastContext';

// ─── Role-to-allowed-actions map ─────────────────────────────────────────────
const ROLE_ACTIONS = {
  dispatcher: ['Picked Up', 'In Warehouse', 'Sorted', 'Returned to Vendor'],
  rider:      ['Out for Delivery', 'Delivered', 'Returned'],
  admin:      ['Picked Up', 'In Warehouse', 'Sorted', 'Out for Delivery', 'Delivered', 'Returned', 'Returned to Vendor', 'Cancelled'],
};

const STATUS_COLORS = {
  'Pending':           '#f59e0b',
  'Pick Up Requested': '#f59e0b',
  'Picked Up':         '#3b82f6',
  'In Warehouse':      '#8b5cf6',
  'Sorted':            '#06b6d4',
  'Out for Delivery':  '#f97316',
  'Delivered':         '#10b981',
  'Postponed':         '#f97316',
  'Cancelled':         '#ef4444',
  'Returned':          '#ef4444',
  'Returned to Vendor':'#6b7280',
};

function StatusPill({ status }) {
  const c = STATUS_COLORS[status] || '#6b7280';
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700, background: c + '18', color: c, border: `1px solid ${c}40` }}>
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: c }} />
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
      
      // If component unmounted or stopped while we were waiting for permissions
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

      // Try native BarcodeDetector API first (faster), fallback to jsQR
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
            // jsQR fallback
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
            // Extract tracking code from URL if it's a full URL
            let trackingCode = code;
            try {
              const url = new URL(code);
              const param = url.searchParams.get('code');
              if (param) trackingCode = param;
            } catch (_) {}

            onDetected(trackingCode.toUpperCase());
            // Debounce — don't re-fire same code for 3s
            setTimeout(() => { lastCodeRef.current = ''; }, 3000);
          }
        } catch (_) {}
      }, 300);
    } catch (e) {
      setError('Camera access denied. Please allow camera permission or use manual input.');
    }
  }, [onDetected]);

  useEffect(() => {
    if (active) startCamera();
    else stopCamera();
    return stopCamera;
  }, [active, startCamera, stopCamera]);

  return (
    <div>
      {error && (
        <div style={{ padding: '10px 14px', borderRadius: 8, background: '#fef2f2', border: '1px solid #fee2e2', color: '#991b1b', fontSize: 13, marginBottom: 12 }}>{error}</div>
      )}
      <div className="camera-container" style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', background: '#111', aspectRatio: '4/3', maxHeight: 300 }}>
        <video ref={videoRef} muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        <canvas ref={canvasRef} style={{ display: 'none' }} />
        {/* Scan overlay */}
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
          <div style={{ width: 180, height: 180, position: 'relative' }}>
            {[['0%','0%','borderTop','borderLeft'],['100%','0%','borderTop','borderRight'],['0%','100%','borderBottom','borderLeft'],['100%','100%','borderBottom','borderRight']].map(([t,r,b1,b2],i) => (
              <div key={i} style={{ position: 'absolute', top: i<2?t:undefined, bottom: i>=2?'0%':undefined, left: (i===0||i===2)?r:undefined, right: (i===1||i===3)?'0%':undefined, width: 28, height: 28, [b1]: '3px solid #22d3ee', [b2]: '3px solid #22d3ee', borderRadius: 3 }} />
            ))}
          </div>
        </div>
        {!scanning && !error && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#fff', gap: 8 }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 9V6a3 3 0 0 1 3-3h3"/><path d="M15 3h3a3 3 0 0 1 3 3v3"/><path d="M3 15v3a3 3 0 0 0 3 3h3"/><path d="M15 21h3a3 3 0 0 0 3-3v-3"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
            <span style={{ fontSize: 13, opacity: 0.7 }}>Starting camera...</span>
          </div>
        )}
        {scanning && (
          <div style={{ position: 'absolute', bottom: 10, left: '50%', transform: 'translateX(-50%)', background: 'rgba(0,0,0,0.6)', color: '#22d3ee', fontSize: 11, fontWeight: 600, padding: '4px 12px', borderRadius: 20, letterSpacing: '0.05em' }}>
            SCANNING...
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Main ScanStation Component ───────────────────────────────────────────────
/**
 * Shared scan station for Dispatcher (Warehouse Staff) and Rider dashboards.
 * Props:
 *   role — 'dispatcher' | 'rider' | 'admin'
 *   defaultAction — pre-select an action (optional)
 */
const ScanStation = ({ role = 'dispatcher', defaultAction = '' }) => {
  const [tab, setTab]             = useState('manual');     // 'manual' | 'camera' | 'bulk' | 'history'
  const [code, setCode]           = useState('');
  const [action, setAction]       = useState(defaultAction);
  const [location, setLocation]   = useState('');
  const [notes, setNotes]         = useState('');
  const [lookupResult, setLookup] = useState(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [scanning, setScanning]   = useState(false);
  const [sessionLog, setSessionLog] = useState([]);  // scans this session
  const [bulkInput, setBulkInput] = useState('');
  const [bulkResults, setBulkResults] = useState(null);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [history, setHistory]     = useState([]);
  const [histLoading, setHistLoading] = useState(false);
  const inputRef = useRef(null);
  const { showToast } = useToast();

  const allowedActions = ROLE_ACTIONS[role] || [];

  // Auto-focus input when tab changes
  useEffect(() => {
    if (tab === 'manual' && inputRef.current) inputRef.current.focus();
  }, [tab]);

  // Try to get GPS location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => setLocation(`${pos.coords.latitude.toFixed(4)},${pos.coords.longitude.toFixed(4)}`),
        () => {} // silently fail
      );
    }
  }, []);

  // Load history
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

  // Lookup package by code
  const lookupPackage = useCallback(async (trackingCode) => {
    const c = (trackingCode || code).trim().toUpperCase();
    if (!c) return;
    setLookupLoading(true);
    setLookup(null);
    try {
      const r = await api.get(`/scan/lookup/${c}`);
      setLookup(r.data.data);
      // Auto-select the action if only one is available
      if (r.data.data.allowedActions?.length === 1 && !action) {
        setAction(r.data.data.allowedActions[0]);
      }
      beep(true);
    } catch (e) {
      beep(false);
      showToast(e.response?.data?.message || 'Package not found', 'error');
    } finally { setLookupLoading(false); }
  }, [code, action, showToast]);

  // Submit a scan
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
      // Reset for next scan
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

  // Camera scan detected
  const onCameraDetected = useCallback(async (detectedCode) => {
    setCode(detectedCode);
    if (window.innerWidth <= 768) {
      setTab('manual'); // Switch back so they can see the scanned package and take action
    }
    await lookupPackage(detectedCode);
  }, [lookupPackage]);

  // Bulk scan submit
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
    { id: 'manual', label: 'Manual / Keyboard', icon: '⌨️' },
    { id: 'camera', label: 'Camera Scan', icon: '📷' },
    { id: 'bulk',   label: 'Bulk Scan', icon: '📋' },
    { id: 'history',label: 'My History', icon: '🕐' },
  ];

  const pkg = lookupResult?.package;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 960, margin: '0 auto' }}>
      
      {/* Session counter */}
      {sessionLog.length > 0 && (
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '10px 16px', background: 'linear-gradient(90deg,#1e3a8a,#2563eb)', borderRadius: 10, color: '#fff' }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
          <span style={{ fontWeight: 700 }}>{sessionLog.length} packages scanned this session</span>
          <span style={{ marginLeft: 'auto', fontSize: 12, opacity: 0.8 }}>Last: {sessionLog[0]?.trackingCode} → {sessionLog[0]?.action}</span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20 }}>
        {/* Left panel */}
        <div>
          {/* Tabs */}
          <div style={{ display: 'flex', gap: 4, marginBottom: 16, background: '#f3f4f6', borderRadius: 10, padding: 4 }}>
            {tabs.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                style={{ flex: 1, padding: '8px 4px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, background: tab === t.id ? '#fff' : 'transparent', color: tab === t.id ? '#1d4ed8' : '#6b7280', boxShadow: tab === t.id ? '0 1px 4px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.15s', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                <span style={{ fontSize: 16 }}>{t.icon}</span>
                <span style={{ fontSize: 10 }}>{t.label}</span>
              </button>
            ))}
          </div>

          {/* Manual Tab */}
          {tab === 'manual' && (
            <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', padding: 20 }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700 }}>Scan or Type Tracking Code</h3>
              <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                <input
                  ref={inputRef}
                  type="text"
                  value={code}
                  onChange={e => setCode(e.target.value.toUpperCase())}
                  onKeyDown={e => e.key === 'Enter' && lookupPackage()}
                  placeholder="e.g. ABC1234 or paste QR data"
                  style={{ flex: 1, border: '2px solid #e5e7eb', borderRadius: 8, padding: '10px 14px', fontSize: 15, fontFamily: 'monospace', fontWeight: 700, outline: 'none', letterSpacing: '0.1em' }}
                  autoComplete="off"
                />
                <button onClick={() => lookupPackage()} disabled={lookupLoading || !code.trim()}
                  style={{ padding: '10px 20px', borderRadius: 8, border: 'none', cursor: 'pointer', background: '#2563eb', color: '#fff', fontWeight: 700, fontSize: 14, opacity: (lookupLoading || !code.trim()) ? 0.5 : 1 }}>
                  {lookupLoading ? '...' : 'Lookup'}
                </button>
              </div>
              <p style={{ fontSize: 12, color: '#9ca3af', margin: 0 }}>Press Enter or click Lookup after typing/scanning a code. USB barcode scanners work automatically.</p>
            </div>
          )}

          {/* Camera Tab */}
          {tab === 'camera' && (
            <div className="mobile-fullscreen-scanner" style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>Mobile Camera Scanner</h3>
                <button onClick={() => setTab('manual')} className="btn btn-outline btn-sm" style={{ display: window.innerWidth <= 768 ? 'block' : 'none' }}>Close</button>
              </div>
              <CameraScanner onDetected={onCameraDetected} active={tab === 'camera'} />
              {code && (
                <div style={{ marginTop: 12, padding: '8px 14px', background: '#f0fdf4', borderRadius: 8, border: '1px solid #bbf7d0', fontSize: 13, fontWeight: 600, color: '#166534' }}>
                  Detected: <span style={{ fontFamily: 'monospace', fontSize: 15 }}>{code}</span>
                </div>
              )}
            </div>
          )}

          {/* Bulk Tab */}
          {tab === 'bulk' && (
            <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', padding: 20 }}>
              <h3 style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 700 }}>Bulk Scan</h3>
              <p style={{ fontSize: 12, color: '#6b7280', margin: '0 0 16px' }}>Paste or type multiple tracking codes (one per line, or comma-separated). Select an action below, then submit.</p>
              <textarea
                value={bulkInput}
                onChange={e => setBulkInput(e.target.value.toUpperCase())}
                placeholder={"ABC1234\nDEF5678\nGHI9012"}
                rows={6}
                style={{ width: '100%', border: '2px solid #e5e7eb', borderRadius: 8, padding: '10px 14px', fontSize: 13, fontFamily: 'monospace', resize: 'vertical', boxSizing: 'border-box', outline: 'none' }}
              />
              <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                <select value={action} onChange={e => setAction(e.target.value)}
                  style={{ flex: 1, border: '1px solid #e5e7eb', borderRadius: 8, padding: '8px 12px', fontSize: 13, outline: 'none' }}>
                  <option value="">— Select Action —</option>
                  {allowedActions.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
                <button onClick={submitBulkScan} disabled={bulkLoading || !bulkInput.trim() || !action}
                  style={{ padding: '8px 20px', borderRadius: 8, border: 'none', cursor: 'pointer', background: '#2563eb', color: '#fff', fontWeight: 700, fontSize: 13, opacity: (bulkLoading || !bulkInput.trim() || !action) ? 0.5 : 1 }}>
                  {bulkLoading ? 'Processing...' : 'Bulk Submit'}
                </button>
              </div>
              {bulkResults && (
                <div style={{ marginTop: 16 }}>
                  <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                    <span style={{ padding: '4px 12px', borderRadius: 20, background: '#f0fdf4', color: '#166534', fontWeight: 700, fontSize: 12 }}>✓ {bulkResults.processed} Success</span>
                    {bulkResults.failed > 0 && <span style={{ padding: '4px 12px', borderRadius: 20, background: '#fef2f2', color: '#991b1b', fontWeight: 700, fontSize: 12 }}>✗ {bulkResults.failed} Failed</span>}
                  </div>
                  {bulkResults.errors?.map((e, i) => (
                    <div key={i} style={{ fontSize: 12, color: '#ef4444', padding: '4px 0' }}>{e.code}: {e.error}</div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* History Tab */}
          {tab === 'history' && (
            <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>My Scan History</h3>
                <button onClick={loadHistory} style={{ fontSize: 12, color: '#6b7280', background: 'none', border: '1px solid #e5e7eb', borderRadius: 6, padding: '4px 10px', cursor: 'pointer' }}>↻ Refresh</button>
              </div>
              {histLoading ? (
                <div style={{ padding: 40, textAlign: 'center', color: '#9ca3af' }}>Loading...</div>
              ) : history.length === 0 ? (
                <div style={{ padding: 40, textAlign: 'center', color: '#9ca3af' }}>No scans recorded yet.</div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: '#f9fafb' }}>
                        {['Time', 'Tracking Code', 'Action', 'Location'].map(h => (
                          <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid #e5e7eb' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {history.map(ev => (
                        <tr key={ev._id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                          <td style={{ padding: '10px 14px', color: '#6b7280', fontSize: 12 }}>{new Date(ev.createdAt).toLocaleString()}</td>
                          <td style={{ padding: '10px 14px', fontFamily: 'monospace', fontWeight: 700, color: '#1d4ed8' }}>{ev.trackingCode}</td>
                          <td style={{ padding: '10px 14px' }}><StatusPill status={ev.toStatus} /></td>
                          <td style={{ padding: '10px 14px', color: '#6b7280', fontSize: 12 }}>{ev.location || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right panel — package detail + action */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Package Result Card */}
          {pkg ? (
            <div style={{ background: '#fff', borderRadius: 12, border: '2px solid #2563eb33', overflow: 'hidden' }}>
              <div style={{ padding: '12px 16px', background: '#eff6ff', borderBottom: '1px solid #bfdbfe', display: 'flex', alignItems: 'center', gap: 8 }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                <span style={{ fontWeight: 700, fontSize: 13, color: '#1d4ed8' }}>Package Found</span>
              </div>
              <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div>
                  <div style={{ fontSize: 11, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tracking Code</div>
                  <div style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: 18, letterSpacing: '0.12em', color: '#111' }}>{pkg.trackingCode}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Customer</div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{pkg.customerName}</div>
                  <div style={{ fontSize: 12, color: '#6b7280' }}>📞 {pkg.customerPhone}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Address</div>
                  <div style={{ fontSize: 12, color: '#374151' }}>{pkg.city ? `${pkg.city}, ` : ''}{pkg.address}</div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 11, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Current Status</div>
                    <div style={{ marginTop: 4 }}><StatusPill status={pkg.status} /></div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>COD</div>
                    <div style={{ fontWeight: 700, color: '#2563eb' }}>Rs. {pkg.amount}</div>
                  </div>
                </div>
                {!lookupResult?.canScan && (
                  <div style={{ padding: '8px 12px', background: '#fef3c7', borderRadius: 8, border: '1px solid #fde68a', fontSize: 12, color: '#92400e' }}>
                    ⚠️ You cannot perform any action on this package in its current status.
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div style={{ background: '#f9fafb', borderRadius: 12, border: '2px dashed #e5e7eb', padding: 32, textAlign: 'center', color: '#9ca3af' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ display: 'block', margin: '0 auto 12px' }}><path d="M3 9V6a3 3 0 0 1 3-3h3"/><path d="M15 3h3a3 3 0 0 1 3 3v3"/><path d="M3 15v3a3 3 0 0 0 3 3h3"/><path d="M15 21h3a3 3 0 0 0 3-3v-3"/></svg>
              <p style={{ margin: 0, fontSize: 13 }}>Scan or enter a tracking code to see package details</p>
            </div>
          )}

          {/* Action Panel */}
          {pkg && lookupResult?.canScan && (
            <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>Confirm Action</h4>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Action *</label>
                <select value={action} onChange={e => setAction(e.target.value)}
                  style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: 8, padding: '8px 12px', fontSize: 13, outline: 'none' }}>
                  <option value="">— Select Action —</option>
                  {(lookupResult?.allowedActions?.length > 0 ? lookupResult.allowedActions : allowedActions).map(a => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Location (optional)</label>
                <input type="text" value={location} onChange={e => setLocation(e.target.value)}
                  placeholder="Office, area, or GPS coords"
                  style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: 8, padding: '8px 12px', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Notes (optional)</label>
                <input type="text" value={notes} onChange={e => setNotes(e.target.value)}
                  placeholder="Any remarks..."
                  style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: 8, padding: '8px 12px', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <button
                onClick={submitScan}
                disabled={scanning || !action}
                style={{ width: '100%', padding: '12px', borderRadius: 8, border: 'none', cursor: scanning || !action ? 'not-allowed' : 'pointer', background: scanning || !action ? '#93c5fd' : '#2563eb', color: '#fff', fontWeight: 800, fontSize: 15, letterSpacing: '0.02em', transition: 'background 0.15s' }}>
                {scanning ? 'Processing...' : `✓ Confirm ${action || 'Action'}`}
              </button>
            </div>
          )}

          {/* Session Log mini */}
          {sessionLog.length > 0 && (
            <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
              <div style={{ padding: '10px 14px', borderBottom: '1px solid #e5e7eb', fontSize: 12, fontWeight: 700, color: '#374151' }}>Session Log ({sessionLog.length})</div>
              {sessionLog.slice(0, 8).map((s, i) => (
                <div key={i} style={{ padding: '8px 14px', borderBottom: i < Math.min(sessionLog.length, 8) - 1 ? '1px solid #f3f4f6' : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 700, color: '#1d4ed8' }}>{s.trackingCode}</span>
                    <span style={{ fontSize: 11, color: '#6b7280', marginLeft: 8 }}>{s.customer}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <StatusPill status={s.action} />
                    <span style={{ fontSize: 10, color: '#9ca3af' }}>{s.time}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ScanStation;
