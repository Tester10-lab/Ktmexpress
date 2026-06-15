import React from 'react';
import { Link } from 'react-router-dom';

const PublicNav = ({ active }) => (
  <header style={{ background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(0,0,0,0.05)', position: 'sticky', top: 0, zIndex: 200, boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
    <div className="public-header-inner">
      <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--color-primary)' }}><line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
        <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.4rem', background: 'linear-gradient(135deg, var(--color-primary) 0%, #4f46e5 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>ktmexpress</span>
      </Link>
      <nav className="public-nav-links">
        {[{ label: 'Branches', path: '/branches' }, { label: 'Pricing', path: '/pricing' }, { label: 'Contact', path: '/contact' }].map(({ label, path }) => (
          <Link key={path} to={path} style={{ padding: '8px 16px', borderRadius: '12px', fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: '0.9rem', textDecoration: 'none', color: active === path ? 'var(--color-primary)' : 'var(--text-secondary)', background: active === path ? 'rgba(37,99,235,0.08)' : 'transparent', transition: 'all 0.2s ease' }}>{label}</Link>
        ))}
        <Link to="/login" className="btn btn-primary btn-sm" style={{ borderRadius: '12px', padding: '10px 20px', fontWeight: 700 }}>Login</Link>
      </nav>
    </div>
  </header>
);

const branches = [
  {
    name: 'Kathmandu Central Hub',
    type: 'Main Hub',
    address: 'Kuleshwor, Kathmandu',
    phone: '+977-9861252198',
    email: 'hub.ktm@ktmexpress.com',
    mapLink: 'https://maps.google.com/?q=Kuleshwor,+Kathmandu,+Nepal',
    features: ['Inbound Sorting', 'Dispatch Center', 'Vendor Drop-off', 'Customer Service'],
    color: 'var(--color-primary)',
  },
  {
    name: 'Lalitpur Branch',
    type: 'Regional Center',
    address: 'Jawalakhel, Lalitpur',
    phone: '+977-9800000000',
    email: 'hub.lalitpur@ktmexpress.com',
    mapLink: 'https://maps.google.com/?q=Jawalakhel,+Lalitpur,+Nepal',
    features: ['Local Dispatch', 'Vendor Drop-off'],
    color: '#6366f1',
  },
  {
    name: 'Bhaktapur Hub',
    type: 'Regional Center',
    address: 'Suryabinayak, Bhaktapur',
    phone: '+977-9800000001',
    email: 'hub.bkt@ktmexpress.com',
    mapLink: 'https://maps.google.com/?q=Suryabinayak,+Bhaktapur,+Nepal',
    features: ['Local Dispatch', 'Vendor Drop-off'],
    color: 'var(--color-success)',
  }
];

const Branches = () => {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f8fafc', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: -200, left: -100, width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(37,99,235,0.06) 0%, transparent 70%)', zIndex: 0 }} />
      <div style={{ position: 'absolute', bottom: -200, right: -150, width: 700, height: 700, borderRadius: '50%', background: 'radial-gradient(circle, rgba(16,185,129,0.05) 0%, transparent 70%)', zIndex: 0 }} />
      
      <PublicNav active="/branches" />

      <main style={{ flex: 1, padding: '80px 24px', position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(2.5rem, 5vw, 3.5rem)', fontWeight: 800, background: 'linear-gradient(135deg, #0f172a 0%, #3b82f6 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: 16 }}>Our Branches</h1>
          <p style={{ color: '#475569', fontSize: '1.1rem', maxWidth: 600, margin: '0 auto', lineHeight: 1.6 }}>Find a ktmexpress drop-off location or logistics hub near you.</p>
        </div>

        <div style={{ maxWidth: 1100, width: '100%', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
          {branches.map(b => (
            <div key={b.name} className="card" style={{ padding: '32px 28px', borderTop: `4px solid ${b.color}`, position: 'relative', overflow: 'hidden' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: b.color, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>{b.type}</div>
                  <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0f172a', marginBottom: 12 }}>{b.name}</h3>
                </div>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24, color: '#475569', fontSize: '0.95rem' }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, marginTop: 2, color: '#94a3b8' }}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  <span>{b.address}</span>
                </div>
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, marginTop: 2, color: '#94a3b8' }}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13 19.79 19.79 0 0 1 1.61 4.44a2 2 0 0 1 1.99-2.18h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.07 6.07l.92-.92a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                  <span>{b.phone}</span>
                </div>
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, marginTop: 2, color: '#94a3b8' }}><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                  <span>{b.email}</span>
                </div>
              </div>

              <div style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {b.features.map(f => (
                    <span key={f} style={{ background: '#f1f5f9', color: '#475569', fontSize: '0.8rem', fontWeight: 600, padding: '4px 10px', borderRadius: '20px' }}>{f}</span>
                  ))}
                </div>
              </div>

              <a href={b.mapLink} target="_blank" rel="noopener noreferrer" className="btn btn-outline btn-block" style={{ display: 'flex', justifyContent: 'center', gap: 8, fontWeight: 600 }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/></svg>
                View on Google Maps
              </a>
            </div>
          ))}
        </div>
      </main>

      <footer style={{ background: '#0f172a', color: '#94a3b8', padding: '32px 24px', textAlign: 'center', marginTop: 'auto' }}>
        <p style={{ fontSize: '0.9rem' }}>© {new Date().getFullYear()} ktmexpress Logistics. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Branches;
