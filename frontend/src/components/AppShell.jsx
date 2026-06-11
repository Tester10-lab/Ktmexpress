import React from 'react';

/**
 * AppShell - Shared layout: fixed sidebar + header + scrollable content
 * Props:
 *  - navLinks: [{ name, path, icon: <SVG/> }]
 *  - currentTitle: string
 *  - user: { name, role }
 *  - onLogout: fn
 *  - children: page content
 */
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useState } from 'react';

const AppShell = ({ navLinks, currentTitle, children, roleBadge }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [liveClock, setLiveClock] = useState('');

  React.useEffect(() => {
    const tick = () => {
      const now = new Date();
      setLiveClock(now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = user?.name
    ? user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : '??';

  return (
    <div className="app-shell">
      {/* Sidebar Overlay (mobile) */}
      <div
        className={`sidebar-overlay ${mobileOpen ? 'active' : ''}`}
        onClick={() => setMobileOpen(false)}
      />

      {/* Sidebar */}
      <aside className={`sidebar ${mobileOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Package icon */}
            <svg className="brand-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/>
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
              <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
              <line x1="12" y1="22.08" x2="12" y2="12"/>
            </svg>
            <div>
              <h1>exdexpress</h1>
              <span>{roleBadge || 'Workspace'}</span>
            </div>
          </div>
          <button
            className="btn-ghost"
            style={{ display: mobileOpen ? 'flex' : 'none', padding: 2 }}
            onClick={() => setMobileOpen(false)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section">
            {navLinks.map(link => (
              <NavLink
                key={link.path}
                to={link.path}
                end={link.exact}
                className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
                onClick={() => setMobileOpen(false)}
              >
                {link.icon}
                <span>{link.name}</span>
              </NavLink>
            ))}
          </div>
        </nav>

        <div className="sidebar-footer">
          <div className="user-profile">
            <div className="avatar">{initials}</div>
            <div className="user-info">
              <h4>{user?.name || 'User'}</h4>
              <p>{user?.email || ''}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="btn btn-outline btn-sm btn-logout">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            <span>Log Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {/* Header */}
        <header className="content-header">
          <div className="header-left">
            <button
              className="header-icon-btn mobile-menu-btn"
              onClick={() => setMobileOpen(true)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            </button>
            <h2>{currentTitle}</h2>
          </div>
          <div className="header-right">
            <div style={{ position: 'relative' }}>
              <button className="header-icon-btn" title="Notifications" onClick={() => setNotificationsOpen(!notificationsOpen)}>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                <span className="notification-dot" />
              </button>
              {notificationsOpen && (
                <div style={{ position: 'absolute', top: 48, right: 0, width: 320, background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-lg)', zIndex: 100, overflow: 'hidden' }}>
                  <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-color)', fontWeight: 600, fontSize: 'var(--font-size-sm)' }}>Recent Notifications</div>
                  <div style={{ padding: 16, textAlign: 'center', color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)' }}>
                    No new notifications right now.
                  </div>
                </div>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: 'var(--font-size-xs)', fontFamily: 'Inter, monospace' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              <span>{liveClock}</span>
            </div>
            <div className="header-badge">
              <span className="pulse-dot" />
              <span>Online</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <div className="view-viewport">
          {children}
        </div>
      </main>
    </div>
  );
};

export default AppShell;
