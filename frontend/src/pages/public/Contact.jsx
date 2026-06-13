import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const PublicNav = ({ active }) => (
  <header style={{ background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(12px)', borderBottom: '1px solid var(--border-color)', position: 'sticky', top: 0, zIndex: 200, boxShadow: 'var(--shadow-sm)' }}>
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--color-primary)' }}><line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
        <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.35rem', background: 'linear-gradient(135deg, var(--color-primary) 0%, #6366f1 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>ktmexpress</span>
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
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-base)' }}>
      <PublicNav active="/contact" />

      <section style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)', padding: '64px 24px', textAlign: 'center' }}>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', fontWeight: 700, color: '#fff', marginBottom: 12 }}>Get In Touch</h1>
        <p style={{ color: 'rgba(255,255,255,0.75)', maxWidth: 500, margin: '0 auto', fontSize: 'var(--font-size-base)' }}>We'd love to hear from you. Reach out for partnership inquiries, support, or just to say hello.</p>
      </section>

      <main style={{ flex: 1, padding: '48px 24px', marginTop: -32 }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 24 }}>
          {/* Contact Info */}
          <div style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)', borderRadius: 'var(--radius-lg)', padding: '36px 28px', color: '#fff' }}>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--font-size-lg)', marginBottom: 12 }}>Contact Information</h3>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 'var(--font-size-sm)', marginBottom: 32, lineHeight: 1.7 }}>Fill out the form and our team will get back to you within 24 hours.</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginBottom: 40 }}>
              {[
                { icon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13 19.79 19.79 0 0 1 1.61 4.44a2 2 0 0 1 1.99-2.18h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.07 6.07l.92-.92a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>, title: '9861252198', sub: 'Mon–Sun, 9am–6pm' },
                { icon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>, title: 'ishannpn@gmail.com', sub: 'Send us an email anytime!' },
                { icon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>, title: 'kuleshwor', sub: 'Kathmandu', link: 'https://maps.google.com/?q=Kuleshwor,+Kathmandu,+Nepal' },
              ].map((c, i) => (
                <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <div style={{ flexShrink: 0, marginTop: 2, color: 'rgba(255,255,255,0.7)' }}>{c.icon}</div>
                  <div>
                    <p style={{ fontWeight: 600, marginBottom: 2 }}>{c.title}</p>
                    <p style={{ fontSize: 'var(--font-size-xs)', color: 'rgba(255,255,255,0.55)' }}>
                      {c.sub}
                      {c.link && <span> &bull; <a href={c.link} target="_blank" rel="noopener noreferrer" style={{ color: 'rgba(255,255,255,0.9)', textDecoration: 'underline' }}>View on Map</a></span>}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <a href="https://wa.me/9779861252198" target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: '#25D366', color: '#fff', padding: '10px 16px', borderRadius: 'var(--radius-sm)', fontWeight: 600, fontSize: 'var(--font-size-sm)', textDecoration: 'none', fontFamily: 'var(--font-heading)' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                Chat on WhatsApp
              </a>
              <a href="viber://chat?number=9779861252198" target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: '#7360F2', color: '#fff', padding: '10px 16px', borderRadius: 'var(--radius-sm)', fontWeight: 600, fontSize: 'var(--font-size-sm)', textDecoration: 'none', fontFamily: 'var(--font-heading)' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                Chat on Viber
              </a>
            </div>
          </div>

          {/* Contact Form */}
          <div className="card">
            <div className="card-header border-b">
              <div className="header-title-group"><h3>Send us a Message</h3><p>We usually reply within 24 hours</p></div>
            </div>
            <div className="card-body">
              {sent && (
                <div style={{ background: 'var(--color-success-soft)', border: '1px solid rgba(16,185,129,0.2)', borderLeft: '4px solid var(--color-success)', borderRadius: 'var(--radius-sm)', padding: '14px 20px', color: 'var(--color-success)', marginBottom: 20, fontWeight: 600 }}>
                  ✓ Message sent! We'll get back to you shortly.
                </div>
              )}
              <form onSubmit={handleSubmit}>
                <div className="form-row">
                  <div className="form-group col-6">
                    <label>Your Name</label>
                    <input type="text" className="form-control" placeholder="John Doe" required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                  </div>
                  <div className="form-group col-6">
                    <label>Email Address</label>
                    <input type="email" className="form-control" placeholder="john@example.com" required value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                  </div>
                </div>
                <div className="form-group">
                  <label>Message</label>
                  <textarea className="form-control" rows="6" placeholder="How can we help you?" required value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} />
                </div>
                <button type="submit" className="btn btn-primary">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                  Send Message
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>

      <footer style={{ background: '#0f172a', color: '#94a3b8', padding: '24px', textAlign: 'center', fontSize: 'var(--font-size-sm)' }}>
        <p>© {new Date().getFullYear()} ktmexpress Logistics. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Contact;
