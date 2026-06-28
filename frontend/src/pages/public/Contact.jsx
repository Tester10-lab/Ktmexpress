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

const Contact = () => {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [sent, setSent] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSent(true);
    setForm({ name: '', email: '', message: '' });
    setTimeout(() => setSent(false), 5000);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f8fafc', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: -200, left: -100, width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(37,99,235,0.06) 0%, transparent 70%)', zIndex: 0 }} />
      <div style={{ position: 'absolute', bottom: -200, right: -150, width: 700, height: 700, borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.05) 0%, transparent 70%)', zIndex: 0 }} />
      
      <PublicNav active="/contact" />

      <main style={{ flex: 1, padding: '80px 24px', position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(2.5rem, 5vw, 3.5rem)', fontWeight: 800, background: 'linear-gradient(135deg, #0f172a 0%, #3b82f6 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: 16 }}>Let's Connect</h1>
          <p style={{ color: '#475569', fontSize: '1.1rem', maxWidth: 500, margin: '0 auto', lineHeight: 1.6 }}>We're here to help you scale your logistics. Drop us a line and our experts will get back to you.</p>
        </div>

        <div style={{ maxWidth: 1100, width: '100%', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 32, alignItems: 'stretch' }}>
          {/* Premium Contact Info Card */}
          <div style={{ 
            background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)', 
            borderRadius: '24px', 
            padding: '48px 40px', 
            color: '#fff',
            boxShadow: '0 25px 50px -12px rgba(30, 58, 138, 0.4)',
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{ position: 'absolute', bottom: -50, right: -50, width: 250, height: 250, background: 'rgba(255,255,255,0.08)', borderRadius: '50%', filter: 'blur(30px)' }} />
            <div style={{ position: 'absolute', top: -30, left: -30, width: 150, height: 150, background: 'rgba(59,130,246,0.3)', borderRadius: '50%', filter: 'blur(40px)' }} />
            
            <div style={{ position: 'relative', zIndex: 1, flex: 1 }}>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.75rem', marginBottom: 12, fontWeight: 700 }}>Contact Information</h3>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1rem', marginBottom: 40, lineHeight: 1.6 }}>Fill out the form and our team will get back to you within 24 hours.</p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 28, marginBottom: 48 }}>
                {[
                  { icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13 19.79 19.79 0 0 1 1.61 4.44a2 2 0 0 1 1.99-2.18h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.07 6.07l.92-.92a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>, title: '9861252198', sub: 'Mon–Sun, 9am–6pm' },
                  { icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>, title: 'ishannpn@gmail.com', sub: 'Send us an email anytime!' },
                  { icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>, title: 'kuleshwor', sub: 'Kathmandu', link: 'https://maps.google.com/?q=Kuleshwor,+Kathmandu,+Nepal' },
                ].map((c, i) => (
                  <div key={i} style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                    <div style={{ flexShrink: 0, marginTop: 2, padding: 12, background: 'rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }}>{c.icon}</div>
                    <div>
                      <p style={{ fontWeight: 600, fontSize: '1.05rem', marginBottom: 4 }}>{c.title}</p>
                      <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.6)' }}>
                        {c.sub}
                        {c.link && <span> &bull; <a href={c.link} target="_blank" rel="noopener noreferrer" style={{ color: '#fff', textDecoration: 'underline' }}>View on Map</a></span>}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, position: 'relative', zIndex: 1 }}>
              <a href="https://wa.me/9779861252198" target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, background: '#25D366', color: '#fff', padding: '14px 20px', borderRadius: '12px', fontWeight: 700, fontSize: '1rem', textDecoration: 'none', fontFamily: 'var(--font-heading)', transition: 'all 0.2s ease', boxShadow: '0 8px 16px rgba(37, 211, 102, 0.2)' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                Chat on WhatsApp
              </a>
              <a href="viber://chat?number=9779861252198" target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, background: '#7360F2', color: '#fff', padding: '14px 20px', borderRadius: '12px', fontWeight: 700, fontSize: '1rem', textDecoration: 'none', fontFamily: 'var(--font-heading)', transition: 'all 0.2s ease', boxShadow: '0 8px 16px rgba(115, 96, 242, 0.2)' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                Chat on Viber
              </a>
            </div>
          </div>

          {/* Premium Contact Form */}
          <div style={{ 
            background: 'rgba(255, 255, 255, 0.8)', 
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 1)',
            borderRadius: '24px', 
            padding: '48px 40px', 
            boxShadow: '0 20px 40px rgba(0,0,0,0.04)' 
          }}>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', marginBottom: 8, fontWeight: 700, color: '#0f172a' }}>Send us a Message</h3>
            <p style={{ color: '#64748b', fontSize: '0.95rem', marginBottom: 32 }}>We usually reply within 24 hours.</p>
            
            {sent && (
              <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', borderLeft: '4px solid #10b981', borderRadius: '12px', padding: '16px 20px', color: '#059669', marginBottom: 24, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 12 }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                Message sent successfully!
              </div>
            )}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                <div style={{ flex: '1 1 200px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#334155' }}>Your Name</label>
                  <input type="text" style={{ padding: '14px 16px', borderRadius: '12px', border: '1px solid #cbd5e1', background: '#fff', fontSize: '1rem', outline: 'none', transition: 'all 0.2s' }} placeholder="John Doe" required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} onFocus={e => e.target.style.borderColor = '#3b82f6'} onBlur={e => e.target.style.borderColor = '#cbd5e1'} />
                </div>
                <div style={{ flex: '1 1 200px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#334155' }}>Email Address</label>
                  <input type="email" style={{ padding: '14px 16px', borderRadius: '12px', border: '1px solid #cbd5e1', background: '#fff', fontSize: '1rem', outline: 'none', transition: 'all 0.2s' }} placeholder="john@example.com" required value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} onFocus={e => e.target.style.borderColor = '#3b82f6'} onBlur={e => e.target.style.borderColor = '#cbd5e1'} />
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#334155' }}>Message</label>
                <textarea rows="5" style={{ padding: '16px', borderRadius: '12px', border: '1px solid #cbd5e1', background: '#fff', fontSize: '1rem', outline: 'none', resize: 'vertical', transition: 'all 0.2s' }} placeholder="How can we help you?" required value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} onFocus={e => e.target.style.borderColor = '#3b82f6'} onBlur={e => e.target.style.borderColor = '#cbd5e1'} />
              </div>
              <button type="submit" style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #4f46e5 100%)', color: '#fff', border: 'none', padding: '16px', borderRadius: '12px', fontSize: '1.05rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 8, boxShadow: '0 10px 20px rgba(59, 130, 246, 0.25)', transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                Send Message
              </button>
            </form>
          </div>
        </div>
      </main>

      <footer style={{ background: '#0f172a', color: '#94a3b8', padding: '32px 24px', textAlign: 'center', marginTop: 'auto' }}>
        <p style={{ fontSize: '0.9rem' }}>© {new Date().getFullYear()} ktmexpress Logistics. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Contact;

