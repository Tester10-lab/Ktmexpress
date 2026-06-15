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
import { useState, useCallback } from 'react';
import useNotificationSound from '../hooks/useNotificationSound';
import { useTheme } from '../hooks/useTheme';
import { useZoom } from '../hooks/useZoom';
import { useSwipeGesture } from '../hooks/useSwipeGesture';
import ThemeToggle from '../components/ThemeToggle';
import ZoomBar from '../components/ZoomBar';
import { useToast } from '../store/ToastContext';

const AppShell = ({ navLinks, currentTitle, children, roleBadge, notifications = [], onNotificationClick }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { showToast } = useToast();

  // Initialize hooks
  const { playSound, soundEnabled, setSoundEnabled, volume, setVolume, playNotification, playAlert, playSuccess, playError } = useNotificationSound();
  
  // Theme and zoom (initialise so CSS vars and zoom apply globally)
  useTheme();
  useZoom();

  // Swipe gesture to open/close sidebar
  const openSidebar  = useCallback(() => setMobileOpen(true), []);
  const closeSidebar = useCallback(() => setMobileOpen(false), []);
  const { ref: swipeRef } = useSwipeGesture({
    onSwipeRight: openSidebar,
    onSwipeLeft:  closeSidebar,
  });

  React.useEffect(() => {

    // Socket.io setup
    let socket;
    if (user?.role) {
      import('socket.io-client').then(({ io }) => {
        // Strip /api from the end of the URL if it exists, as Socket.io needs the base domain
        const rawUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';
        const socketUrl = rawUrl.replace(/\/api\/?$/, '');
        
        socket = io(socketUrl, {
          withCredentials: true,
          transports: ['websocket'], // Force websocket to prevent 404s on load balancers (like Render) without sticky sessions
          auth: {
            token: localStorage.getItem('token')
          }
        });
        
        socket.emit('join_role', user.role);
        if (user._id) {
          socket.emit('join_user', user._id);
        }
        
        socket.on('connect', () => {
          // showToast('Real-time connection established', 'success');
        });
        
        socket.on('connect_error', (err) => {
          showToast(`Connection error: ${err.message}`, 'error');
        });
        
        socket.on('notification', (data) => {
          showToast(data.message || data.title || 'New Notification', 'info');
          if (data.type === 'pickup_request' || data.type === 'new_order' || data.type === 'package_delivered') {
            playNotification();
          } else if (data.type === 'alert') {
            playAlert();
          } else {
            playNotification();
          }
        });
      });
    }

    return () => {
      if (socket) socket.disconnect();
    };
  }, [user, playNotification, playAlert, showToast]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = user?.name
    ? user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : '??';

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="app-shell" ref={swipeRef}>
      {/* ── Skip to main content (accessibility) ── */}
      <a href="#main-content" className="skip-link">Skip to main content</a>

      {/* Sidebar Overlay (mobile) */}
      <div
        className={`sidebar-overlay ${mobileOpen ? 'active' : ''}`}
        onClick={closeSidebar}
        aria-hidden="true"
      />

      {/* Sidebar */}
      <aside
        className={`sidebar ${mobileOpen ? 'open' : ''}`}
        aria-label="Main navigation"
        role="navigation"
      >
        <div className="sidebar-brand">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Package icon */}
            <svg className="brand-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/>
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
              <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
              <line x1="12" y1="22.08" x2="12" y2="12"/>
            </svg>
            <div>
              <h1>ktmexpress</h1>
              <span>{roleBadge || 'Workspace'}</span>
            </div>
          </div>
          <button
            className="btn-ghost sidebar-close-btn"
            style={{ display: mobileOpen ? 'flex' : 'none', padding: 2 }}
            onClick={closeSidebar}
            aria-label="Close navigation menu"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <nav className="sidebar-nav" aria-label="Dashboard sections">
          <div className="nav-section">
            {navLinks.map(link => (
              <NavLink
                key={link.path}
                to={link.path}
                end={link.exact}
                className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
                onClick={closeSidebar}
                aria-current={undefined}
              >
                <span aria-hidden="true">{link.icon}</span>
                <span>{link.name}</span>
              </NavLink>
            ))}
          </div>
        </nav>

        <div className="sidebar-footer">
          <div className="user-profile">
            <div className="avatar" aria-label={`User avatar for ${user?.name || 'User'}`}>{initials}</div>
            <div className="user-info">
              <h4>{user?.name || 'User'}</h4>
              <p>{user?.email || ''}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="btn btn-outline btn-sm btn-logout" aria-label="Log out of your account">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            <span>Log Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content" id="main-content">
        {/* Header */}
        <header className="content-header" role="banner">
          <div className="header-left">
            <button
              className="header-icon-btn mobile-menu-btn"
              onClick={openSidebar}
              aria-label="Open navigation menu"
              aria-expanded={mobileOpen}
              aria-controls="sidebar"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            </button>
            <h2>{currentTitle}</h2>
          </div>
          <div className="header-right">

            {/* Notifications */}
            <div style={{ position: 'relative' }}>
              <button
                className="header-icon-btn"
                title="Notifications"
                aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
                aria-expanded={notificationsOpen}
                onClick={() => { setNotificationsOpen(!notificationsOpen); setSettingsOpen(false); }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                {unreadCount > 0 && (
                  <span style={{ position: 'absolute', top: 6, right: 6, background: '#ef4444', color: '#fff', fontSize: 9, fontWeight: 800, width: 14, height: 14, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }} aria-hidden="true">
                    {unreadCount}
                  </span>
                )}
              </button>
              {notificationsOpen && (
                <div
                  role="region"
                  aria-label="Notifications panel"
                  style={{ position: 'absolute', top: 48, right: 0, width: 'min(340px, calc(100vw - 16px))', background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-lg)', zIndex: 100, overflow: 'hidden' }}
                >
                  <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-color)', fontWeight: 600, fontSize: 'var(--font-size-sm)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Recent Notifications</span>
                    {unreadCount > 0 && <span style={{ fontSize: 11, background: '#eff6ff', color: '#2563eb', padding: '2px 8px', borderRadius: 10 }}>{unreadCount} new</span>}
                  </div>
                  <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                    {notifications.length === 0 ? (
                      <div style={{ padding: 16, textAlign: 'center', color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)' }}>
                        No new notifications right now.
                      </div>
                    ) : (
                      notifications.map(n => (
                        <div
                          key={n.id}
                          role="button"
                          tabIndex={0}
                          onClick={() => { setNotificationsOpen(false); if (onNotificationClick) onNotificationClick(n); }}
                          onKeyDown={e => e.key === 'Enter' && onNotificationClick && onNotificationClick(n)}
                          style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-color)', cursor: 'pointer', background: n.read ? 'transparent' : '#f0fdf4', transition: 'background 0.2s', display: 'flex', gap: 12 }}
                          onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
                          onMouseLeave={e => e.currentTarget.style.background = n.read ? 'transparent' : '#f0fdf4'}
                        >
                          <div style={{ fontSize: 18, marginTop: 2 }} aria-hidden="true">{n.icon || '🔔'}</div>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>{n.title}</div>
                            <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.4 }}>{n.message}</div>
                            {n.time && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{n.time}</div>}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* ── Theme Toggle ── */}
            <ThemeToggle />

          </div>
        </header>

        {/* Page content */}
        <div className="view-viewport" role="main">
          {children}
        </div>
      </main>

      {/* ── Floating Zoom Bar (desktop only) ── */}
      <ZoomBar />
    </div>
  );
};

export default AppShell;
