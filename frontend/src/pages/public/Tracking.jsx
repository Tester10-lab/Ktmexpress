import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../../api/axios';

const PublicNav = ({ active }) => (
  <header style={{ background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(12px)', borderBottom: '1px solid var(--border-color)', position: 'sticky', top: 0, zIndex: 200, boxShadow: 'var(--shadow-sm)' }}>
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--color-primary)' }}><line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
        <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.35rem', background: 'linear-gradient(135deg, var(--color-primary) 0%, #6366f1 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>exdexpress</span>
      </Link>
      <nav style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {[{ label: 'Pricing', path: '/pricing' }, { label: 'Contact', path: '/contact' }].map(({ label, path }) => (
          <Link key={path} to={path} style={{ padding: '8px 16px', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-heading)', fontWeight: 500, fontSize: 'var(--font-size-sm)', textDecoration: 'none', color: active === path ? 'var(--color-primary)' : 'var(--text-secondary)', background: active === path ? 'var(--color-primary-soft)' : 'transparent' }}>{label}</Link>
        ))}
        <Link to="/login" className="btn btn-primary btn-sm" style={{ marginLeft: 8 }}>Login</Link>
      </nav>
    </div>
  </header>
);

const statusColors = {
  Delivered: { bg: 'var(--color-success-soft)', color: 'var(--color-success)', border: 'rgba(16,185,129,0.2)' },
  Cancelled: { bg: 'var(--color-danger-soft)', color: 'var(--color-danger)', border: 'rgba(239,68,68,0.2)' },
  'Returned to Vendor': { bg: 'var(--color-info-soft)', color: 'var(--color-info)', border: 'rgba(59,130,246,0.2)' },
  default: { bg: 'var(--color-primary-soft)', color: 'var(--color-primary)', border: 'rgba(37,99,235,0.2)' },
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
      setError(e.response?.data?.message || 'Tracking code not found. Please check and try again.');
    } finally { setLoading(false); }
  };

  const sc = pkg ? (statusColors[pkg.status] || statusColors.default) : statusColors.default;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-base)' }}>
      <PublicNav active="/track" />

      <section style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)', padding: '56px 24px 80px', textAlign: 'center' }}>
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', fontWeight: 700, color: '#fff', marginBottom: 12 }}>Track Your Package</h1>
          <p style={{ color: 'rgba(255,255,255,0.75)', marginBottom: 28, fontSize: 'var(--font-size-base)' }}>Enter your tracking code for real-time status updates</p>
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.95)', borderRadius: 'var(--radius-md)', padding: 6, gap: 8, boxShadow: '0 12px 40px rgba(0,0,0,0.25)' }}>
            <input type="text" value={code} onChange={e => setCode(e.target.value)} onKeyDown={e => e.key === 'Enter' && doTrack()}
              placeholder="e.g. LOG-2026-ABC12"
              style={{ flex: 1, border: 'none', outline: 'none', padding: '10px 16px', borderRadius: 'var(--radius-sm)', fontSize: 'var(--font-size-base)', fontFamily: 'var(--font-body)', background: 'transparent', color: 'var(--text-primary)' }}
            />
            <button className="btn btn-primary" onClick={() => doTrack()} disabled={loading}>
              {loading ? 'Searching...' : <>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                Track
              </>}
            </button>
          </div>
        </div>
      </section>

      <main style={{ flex: 1, padding: '32px 24px', marginTop: -32 }}>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          {error && (
            <div style={{ background: 'var(--color-danger-soft)', border: '1px solid rgba(239,68,68,0.2)', borderLeft: '4px solid var(--color-danger)', borderRadius: 'var(--radius-md)', padding: '20px 24px', color: 'var(--color-danger)', display: 'flex', gap: 16, alignItems: 'flex-start', marginBottom: 24 }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
              <div><strong style={{ display: 'block', marginBottom: 4 }}>Package Not Found</strong>{error}</div>
            </div>
          )}

          {pkg && (
            <div className="card" style={{ padding: 0, overflow: 'hidden', animation: 'fadeInUp 0.4s var(--transition-spring)' }}>
              {/* Status header */}
              <div style={{ background: sc.bg, borderBottom: `1px solid ${sc.border}`, padding: '24px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Tracking ID</p>
                  <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--font-size-xl)', fontWeight: 700 }}>{pkg.trackingCode}</h2>
                </div>
                <div style={{ background: sc.bg, color: sc.color, border: `1px solid ${sc.border}`, borderRadius: 'var(--radius-full)', padding: '8px 20px', fontWeight: 700, fontFamily: 'var(--font-heading)', fontSize: 'var(--font-size-sm)' }}>
                  {pkg.status}
                </div>
              </div>

              {/* Info row */}
              <div style={{ padding: '20px 28px', borderBottom: '1px solid var(--border-color)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20 }}>
                {[
                  ['Recipient', pkg.customerName + (pkg.city ? ` · ${pkg.city}` : '')],
                  ['Last Updated', new Date(pkg.updatedAt).toLocaleString()],
                ].map(([label, val]) => (
                  <div key={label}>
                    <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginBottom: 4 }}>{label}</p>
                    <p style={{ fontWeight: 600 }}>{val}</p>
                  </div>
                ))}
              </div>

              {/* Rider info (out for delivery) */}
              {pkg.rider && (
                <div style={{ margin: '0 28px 20px', marginTop: 20, background: 'var(--color-primary-soft)', border: '1px solid rgba(37,99,235,0.2)', borderRadius: 'var(--radius-sm)', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                  <div>
                    <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-primary)', fontWeight: 600, marginBottom: 4 }}>Out for delivery by</p>
                    <p style={{ fontWeight: 600 }}>{pkg.rider.name}</p>
                  </div>
                  {pkg.rider.contact && (
                    <a href={`tel:${pkg.rider.contact}`} className="btn btn-primary btn-sm">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13 19.79 19.79 0 0 1 1.61 4.44a2 2 0 0 1 1.99-2.18h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.07 6.07l.92-.92a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                      Call Rider
                    </a>
                  )}
                </div>
              )}

              {/* QR Code / scan-to-track panel */}
              <div style={{ margin: '0 28px 20px', display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '16px 20px', background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)' }}>
                  <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>QR Code — Scan to Track</p>
                  <img
                    src={pkg.qrCodeUrl || `https://api.qrserver.com/v1/create-qr-code/?size=150x150&ecc=M&data=${encodeURIComponent(window.location.href)}`}
                    alt="QR Code" width="140" height="140"
                    style={{ border: '1px solid var(--border-color)', borderRadius: 6, background: '#fff', padding: 6 }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '16px 20px', background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', flex: 1, minWidth: 200 }}>
                  <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Code 128 Barcode</p>
                  <img
                    src={pkg.barcodeUrl || `https://barcodeapi.org/api/128/${pkg.trackingCode}`}
                    alt="Barcode" style={{ height: 60, width: '100%', objectFit: 'contain', background: '#fff', padding: '6px', border: '1px solid var(--border-color)', borderRadius: 6 }}
                  />
                  <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', textAlign: 'center' }}>
                    Scan with any handheld scanner or mobile camera
                  </p>
                </div>
              </div>

              {/* Timeline */}
              {pkg.timeline?.length > 0 && (
                <div style={{ padding: '20px 28px 28px' }}>
                  <h3 style={{ fontSize: 'var(--font-size-base)', marginBottom: 20 }}>Delivery Timeline</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                    {[...pkg.timeline].reverse().map((event, idx, arr) => (
                      <div key={idx} style={{ display: 'flex', gap: 16, paddingBottom: idx < arr.length - 1 ? 20 : 0 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                          <div style={{ width: 12, height: 12, borderRadius: '50%', background: idx === 0 ? 'var(--color-primary)' : 'var(--border-color)', border: '2px solid', borderColor: idx === 0 ? 'var(--color-primary)' : 'var(--text-muted)', marginTop: 3, flexShrink: 0 }} />
                          {idx < arr.length - 1 && <div style={{ width: 2, flex: 1, background: 'var(--border-color)', marginTop: 4 }} />}
                        </div>
                        <div style={{ flex: 1, paddingBottom: 4 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 4, marginBottom: 4 }}>
                            <span style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)' }}>{event.status}</span>
                            <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>{event.time}</span>
                          </div>
                          {event.message && <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', margin: '2px 0' }}>{event.message}</p>}
                          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
                            <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', margin: 0 }}>by {event.user}</p>
                            {event.role && (
                              <span style={{ fontSize: 10, padding: '1px 7px', borderRadius: 10, background: 'var(--color-primary-soft)', color: 'var(--color-primary)', fontWeight: 600 }}>
                                {event.role}
                              </span>
                            )}
                            {event.location && (
                              <span style={{ fontSize: 10, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 3 }}>
                                📍 {event.location}
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
            <div className="card" style={{ textAlign: 'center', padding: 64 }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: 'var(--text-muted)', margin: '0 auto 16px', display: 'block' }}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <h3>Enter a Tracking Code</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)', marginTop: 8 }}>Type your code above and press Track to see real-time delivery status.</p>
            </div>
          )}
        </div>
      </main>

      <footer style={{ background: '#0f172a', color: '#94a3b8', padding: '24px', textAlign: 'center', fontSize: 'var(--font-size-sm)' }}>
        <p>© {new Date().getFullYear()} exdexpress Logistics. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Tracking;
