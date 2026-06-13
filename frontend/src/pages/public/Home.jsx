import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const PublicNav = ({ active }) => (
  <header style={{ background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(0,0,0,0.05)', position: 'sticky', top: 0, zIndex: 200, boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
    <div className="public-header-inner">
      <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--color-primary)' }}>
          <line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>
        </svg>
        <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.4rem', background: 'linear-gradient(135deg, var(--color-primary) 0%, #4f46e5 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>ktmexpress</span>
      </Link>
      <nav className="public-nav-links">
        {[
          { label: 'Pricing', path: '/pricing' },
          { label: 'Contact', path: '/contact' },
        ].map(({ label, path }) => (
          <Link key={path} to={path} style={{
            padding: '8px 16px', borderRadius: '12px', fontFamily: 'var(--font-heading)',
            fontWeight: 600, fontSize: '0.9rem', textDecoration: 'none',
            color: active === path ? 'var(--color-primary)' : 'var(--text-secondary)',
            background: active === path ? 'rgba(37,99,235,0.08)' : 'transparent',
            transition: 'all 0.2s ease'
          }}>{label}</Link>
        ))}
        <Link to="/login" className="btn btn-primary btn-sm" style={{ borderRadius: '12px', padding: '10px 20px', fontWeight: 700 }}>Login</Link>
      </nav>
    </div>
  </header>
);

const PublicFooter = () => (
  <footer style={{ background: '#0f172a', color: '#94a3b8', padding: '32px 24px', textAlign: 'center' }}>
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 16 }}>
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2"><line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
        <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: '0.9rem', color: '#f1f5f9' }}>ktmexpress Logistics</span>
      </div>
      <p style={{ fontSize: 'var(--font-size-sm)' }}>© {new Date().getFullYear()} ktmexpress Logistics SaaS. All rights reserved.</p>
    </div>
  </footer>
);

const Home = () => {
  const [code, setCode] = useState('');
  const navigate = useNavigate();

  const handleTrack = (e) => {
    e.preventDefault();
    if (code.trim()) navigate(`/track?code=${code.trim()}`);
  };

  const features = [
    { emoji: '🚀', title: 'Same-Day Dispatch', desc: 'Lightning-fast pickup within Kathmandu valley. Your packages are always moving.' },
    { emoji: '📍', title: 'Real-Time Tracking', desc: 'Live status updates and rider contact info. Your customers always know where their package is.' },
    { emoji: '🧾', title: 'COD Management', desc: 'Seamless cash-on-delivery collection, reconciliation, and vendor payouts — all automated.' },
    { emoji: '📊', title: 'Vendor Dashboard', desc: 'Full-featured vendor portal with bulk CSV upload, analytics, finance, and order history.' },
    { emoji: '🏍️', title: 'Rider Management', desc: 'Track your fleet in real-time. Assign pickups and deliveries with one click.' },
    { emoji: '🔒', title: 'Role-Based Security', desc: 'Admin, Vendor, Dispatcher, and Rider roles — each with precisely scoped access.' },
  ];

  const stats = [
    { value: '15,000+', label: 'Deliveries Monthly' },
    { value: '99.2%', label: 'Delivery Success Rate' },
    { value: '150+', label: 'Vendor Partners' },
    { value: '4.9★', label: 'Vendor Rating' },
  ];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-base)' }}>
      <PublicNav active="/" />

      {/* Hero */}
      <section style={{
        background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 50%, #4f46e5 100%)',
        padding: '80px 24px', textAlign: 'center', position: 'relative', overflow: 'hidden'
      }}>
        <div style={{ position: 'absolute', top: '-100px', right: '-100px', width: 400, height: 400, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', zIndex: 0 }} />
        <div style={{ position: 'absolute', bottom: '-80px', left: '-80px', width: 300, height: 300, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', zIndex: 0 }} />
        <div style={{ maxWidth: 900, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 'var(--radius-full)', padding: '6px 16px', marginBottom: 24 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#34d399', animation: 'pulse 2s infinite', display: 'inline-block' }}></span>
            <span style={{ color: 'rgba(255,255,255,0.9)', fontSize: 'var(--font-size-xs)', fontWeight: 600, letterSpacing: '0.04em' }}>NEPAL'S #1 LOGISTICS SAAS PLATFORM</span>
          </div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 800, color: '#fff', marginBottom: 20, letterSpacing: '-0.03em', lineHeight: 1.2 }}>
            Fast, Reliable<br />Delivery Solutions
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 'clamp(1rem, 2vw, 1.2rem)', marginBottom: 40, maxWidth: 600, margin: '0 auto 40px' }}>
            Seamless delivery management for e-commerce vendors across Nepal. From order creation to cash reconciliation — all in one place.
          </p>
          <form onSubmit={handleTrack} style={{ display: 'flex', maxWidth: 560, margin: '0 auto', background: 'rgba(255,255,255,0.95)', borderRadius: 'var(--radius-md)', padding: 6, boxShadow: '0 20px 60px rgba(0,0,0,0.3)', gap: 8 }}>
            <input
              type="text" value={code} onChange={e => setCode(e.target.value)}
              placeholder="Enter tracking code (e.g. LOG-2026-ABC12)"
              style={{ flex: 1, border: 'none', outline: 'none', padding: '10px 16px', borderRadius: 'var(--radius-sm)', fontSize: 'var(--font-size-sm)', fontFamily: 'var(--font-body)', background: 'transparent', color: 'var(--text-primary)' }}
            />
            <button type="submit" className="btn btn-primary" style={{ whiteSpace: 'nowrap' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              Track
            </button>
          </form>
          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 'var(--font-size-xs)', marginTop: 12 }}>No account needed · Instant tracking</p>
        </div>
      </section>

      {/* Stats */}
      <section style={{ background: 'var(--bg-surface-elevated)', borderBottom: '1px solid var(--border-color)', padding: '32px 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 24, textAlign: 'center' }}>
          {stats.map(s => (
            <div key={s.label}>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--font-size-2xl)', fontWeight: 800, color: 'var(--color-primary)', marginBottom: 4 }}>{s.value}</div>
              <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)', fontWeight: 500 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: '80px 24px', flex: 1 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--font-size-2xl)', fontWeight: 700, marginBottom: 12 }}>Everything Your Business Needs</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-lg)', maxWidth: 600, margin: '0 auto' }}>A complete logistics operating system — from first mile to last mile.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
            {features.map(f => (
              <div key={f.title} className="card" style={{ gap: 0 }}>
                <div style={{ fontSize: '2rem', marginBottom: 16 }}>{f.emoji}</div>
                <h3 style={{ fontSize: 'var(--font-size-base)', marginBottom: 8 }}>{f.title}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)', lineHeight: 1.7 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: 'linear-gradient(135deg, var(--color-primary) 0%, #4f46e5 100%)', padding: '60px 24px', textAlign: 'center' }}>
        <h2 style={{ color: '#fff', fontFamily: 'var(--font-heading)', fontSize: 'var(--font-size-2xl)', fontWeight: 700, marginBottom: 12 }}>Ready to scale your deliveries?</h2>
        <p style={{ color: 'rgba(255,255,255,0.8)', marginBottom: 28, fontSize: 'var(--font-size-base)' }}>Join 150+ vendors already using ktmexpress to power their last-mile operations.</p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/login" className="btn" style={{ background: '#fff', color: 'var(--color-primary)', fontWeight: 700 }}>Get Started Free</Link>
          <Link to="/contact" className="btn btn-outline" style={{ borderColor: 'rgba(255,255,255,0.5)', color: '#fff' }}>Talk to Sales</Link>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
};

export default Home;
