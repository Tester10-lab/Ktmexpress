import React, { useState } from 'react';
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

const plans = [
  {
    name: 'Starter',
    badge: '',
    price: 'Free',
    sub: 'First 100 packages/month',
    color: 'var(--color-primary)',
    features: [
      '100 deliveries/month',
      'KTM Valley only',
      'Standard COD collection',
      'Vendor portal access',
      'Email support',
    ],
    cta: 'Get Started Free',
    highlight: false,
  },
  {
    name: 'Growth',
    badge: 'Most Popular',
    price: 'Rs. 2,500',
    sub: 'per month',
    color: '#6366f1',
    features: [
      'Unlimited deliveries',
      'Valley + Outside delivery',
      'Priority dispatch',
      'Bulk CSV upload',
      'Advanced analytics',
      'WhatsApp support',
    ],
    cta: 'Start Free Trial',
    highlight: true,
  },
  {
    name: 'Enterprise',
    badge: '',
    price: 'Custom',
    sub: 'Volume pricing available',
    color: 'var(--color-success)',
    features: [
      'Unlimited deliveries',
      'Dedicated rider team',
      'Custom API integration',
      'White-label option',
      'SLA guarantee',
      'Dedicated account manager',
    ],
    cta: 'Contact Sales',
    highlight: false,
  },
];

const Pricing = () => (
  <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f8fafc', position: 'relative', overflow: 'hidden' }}>
    <div style={{ position: 'absolute', top: -200, left: -100, width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(37,99,235,0.06) 0%, transparent 70%)', zIndex: 0 }} />
    <div style={{ position: 'absolute', bottom: -200, right: -150, width: 700, height: 700, borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.05) 0%, transparent 70%)', zIndex: 0 }} />

    <PublicNav active="/pricing" />

    <main style={{ flex: 1, padding: '80px 24px', position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ textAlign: 'center', marginBottom: 56 }}>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(2.5rem, 5vw, 3.5rem)', fontWeight: 800, background: 'linear-gradient(135deg, #0f172a 0%, #3b82f6 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: 16 }}>Simple, Transparent Pricing</h1>
        <p style={{ color: '#475569', fontSize: '1.1rem', maxWidth: 600, margin: '0 auto', lineHeight: 1.6 }}>No hidden fees. No contracts. Pay as you grow with the most reliable logistics network.</p>
      </div>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24, alignItems: 'start' }}>
          {plans.map(p => (
            <div 
              key={p.name} 
              className="card pricing-card" 
              style={{ 
                position: 'relative', 
                border: p.highlight ? `2px solid ${p.color}` : '1px solid var(--border-color)', 
                transform: p.highlight ? 'scale(1.04)' : 'scale(1)', 
                boxShadow: p.highlight ? '0 20px 40px rgba(99, 102, 241, 0.15)' : '0 4px 6px rgba(0,0,0,0.02)', 
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                background: p.highlight ? 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)' : '#ffffff',
                zIndex: p.highlight ? 10 : 1,
                padding: '40px 32px',
                borderRadius: '16px'
              }}
              onMouseEnter={(e) => {
                if(!p.highlight) e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = p.highlight ? '0 24px 48px rgba(99, 102, 241, 0.2)' : '0 12px 24px rgba(0,0,0,0.06)';
              }}
              onMouseLeave={(e) => {
                if(!p.highlight) e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = p.highlight ? '0 20px 40px rgba(99, 102, 241, 0.15)' : '0 4px 6px rgba(0,0,0,0.02)';
              }}
            >
              {p.badge && (
                <div style={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', background: `linear-gradient(135deg, ${p.color} 0%, #4f46e5 100%)`, color: '#fff', borderRadius: 'var(--radius-full)', padding: '6px 20px', fontSize: '13px', fontWeight: 800, whiteSpace: 'nowrap', letterSpacing: '0.05em', boxShadow: `0 4px 12px ${p.color}40` }}>{p.badge}</div>
              )}
              <div style={{ marginBottom: 32, textAlign: 'center' }}>
                <h3 style={{ fontSize: '1.25rem', color: p.color, marginBottom: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{p.name}</h3>
                <div style={{ fontFamily: 'var(--font-heading)', fontSize: '2.5rem', fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>{p.price}</div>
                <p style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 500 }}>{p.sub}</p>
              </div>
              <ul style={{ listStyle: 'none', padding: 0, marginBottom: 36, display: 'flex', flexDirection: 'column', gap: 16 }}>
                {p.features.map(f => (
                  <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, fontSize: '0.95rem', color: '#334155', fontWeight: 500, lineHeight: 1.4 }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{ color: p.color, flexShrink: 0, marginTop: 1 }}><polyline points="20 6 9 17 4 12"/></svg>
                    {f}
                  </li>
                ))}
              </ul>
              <Link to={p.name === 'Enterprise' ? '/contact' : '/login'} className="btn btn-block" style={{ 
                background: p.highlight ? `linear-gradient(135deg, ${p.color} 0%, #4f46e5 100%)` : 'transparent', 
                color: p.highlight ? '#fff' : p.color, 
                borderColor: p.color, 
                borderWidth: '2px',
                borderStyle: 'solid',
                justifyContent: 'center',
                padding: '12px 0',
                fontSize: '1rem',
                fontWeight: 700,
                borderRadius: '8px',
                boxShadow: p.highlight ? `0 8px 16px ${p.color}40` : 'none',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                if(!p.highlight) {
                  e.currentTarget.style.background = `${p.color}10`;
                } else {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = `0 12px 20px ${p.color}60`;
                }
              }}
              onMouseLeave={(e) => {
                if(!p.highlight) {
                  e.currentTarget.style.background = 'transparent';
                } else {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = `0 8px 16px ${p.color}40`;
                }
              }}
              >
                {p.cta}
              </Link>
            </div>
          ))}
        </div>

        <div className="card" style={{ marginTop: 40, textAlign: 'center', background: 'var(--color-primary-soft)', border: '1px solid rgba(37,99,235,0.2)' }}>
          <h3 style={{ marginBottom: 8 }}>Need a custom plan?</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)', marginBottom: 20 }}>We work with large e-commerce businesses to create tailored logistics solutions. Contact us and we'll design a package that fits your volume.</p>
          <Link to="/contact" className="btn btn-primary">Talk to Our Team</Link>
        </div>
      </div>
    </main>

    <footer style={{ background: '#0f172a', color: '#94a3b8', padding: '24px', textAlign: 'center', fontSize: 'var(--font-size-sm)' }}>
      <p>© {new Date().getFullYear()} ktmexpress Logistics. All rights reserved.</p>
    </footer>
  </div>
);

export default Pricing;
