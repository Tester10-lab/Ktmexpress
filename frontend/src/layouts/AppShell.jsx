import React, { useState, useCallback, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Bell, LogOut, Menu, X } from 'lucide-react';
import brandLogo from '../assets/logo.png';
import { useAuth } from '../store/AuthContext';
import useNotificationSound from '../hooks/useNotificationSound';
import { useZoom } from '../hooks/useZoom';
import { useSwipeGesture } from '../hooks/useSwipeGesture';
import { useSocket } from '../hooks/useSocket';
import ZoomBar from '../components/ZoomBar';
import { useToast } from '../store/ToastContext';
import { useSettings } from '../store/SettingsContext';
import { Button } from '../components/ui/Button';
import { MobileBottomNav } from '../components/ui/MobileBottomNav';

const AppShell = ({ navLinks, currentTitle, children, roleBadge, notifications = [], onNotificationClick }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const { showToast } = useToast();
  const { logoUrl } = useSettings();

  const { playNotification, playAlert } = useNotificationSound();
  useZoom();
  useSocket();

  const openSidebar = useCallback(() => setMobileOpen(true), []);
  const closeSidebar = useCallback(() => setMobileOpen(false), []);
  const { ref: swipeRef } = useSwipeGesture({
    onSwipeRight: openSidebar,
    onSwipeLeft: closeSidebar,
  });

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = user?.name ? user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) : '??';
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="flex h-screen overflow-hidden bg-[#fafafa]" ref={swipeRef}>
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-[9999] px-4 py-2 bg-slate-900 text-white font-semibold rounded-lg">Skip to main content</a>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden" onClick={closeSidebar} aria-hidden="true" />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 flex flex-col ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        
        {/* Brand */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-100 flex-shrink-0 relative z-10">
          <div className="flex items-center gap-3 text-slate-900">
            {logoUrl ? (
              <img src={logoUrl} alt="Company Logo" className="h-8 object-contain" onError={(e) => { e.target.onerror = null; e.target.src = brandLogo; }} />
            ) : (
              <div className="flex flex-col">
                <img src={brandLogo} alt="ktmexpress Logo" className="h-10 object-contain" />
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mt-1">{roleBadge || 'Workspace'}</span>
              </div>
            )}
          </div>
          <button className="lg:hidden p-1 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-100 transition-colors" onClick={closeSidebar}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-1">
          {navLinks.map(link => (
            <NavLink
              key={link.path}
              to={link.path}
              end={link.exact}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) => 
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                  isActive 
                    ? 'bg-slate-100 text-slate-900' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className={`w-5 h-5 flex items-center justify-center transition-colors duration-150 ${isActive ? 'text-slate-900' : 'text-slate-500'}`}>
                    {React.cloneElement(link.icon, { className: 'w-4 h-4' })}
                  </div>
                  {link.name}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Footer / Profile */}
        <div className="p-4 border-t border-slate-100 bg-white">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-700 border border-slate-200 flex items-center justify-center font-medium text-sm">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-slate-900 truncate">{user?.name || 'User'}</h4>
              <p className="text-xs text-slate-500 truncate">{user?.email || ''}</p>
            </div>
          </div>
          <Button onClick={handleLogout} variant="secondary" className="w-full text-slate-600 hover:text-slate-900">
            <LogOut className="w-4 h-4" />
            Log Out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden" id="main-content">
        
        {/* Header */}
        <header className="h-16 flex items-center justify-between px-4 sm:px-8 bg-white/80 backdrop-blur-md z-30 sticky top-0 border-b border-slate-200">
          <div className="flex items-center gap-4">
            <button className="lg:hidden p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors" onClick={openSidebar}>
              <Menu className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-semibold text-slate-900 truncate">{currentTitle}</h2>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Notifications Dropdown */}
            <div className="relative">
              <button
                className="relative p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors focus:outline-none"
                onClick={() => setNotificationsOpen(!notificationsOpen)}
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white"></span>
                )}
              </button>

              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden origin-top-right animate-in fade-in zoom-in-95 duration-150 z-50">
                  <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                    <span className="font-semibold text-sm text-slate-900">Notifications</span>
                    {unreadCount > 0 && <span className="bg-slate-200 text-slate-800 text-[10px] font-medium px-2 py-0.5 rounded-full">{unreadCount} new</span>}
                  </div>
                  <div className="max-h-[300px] overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center text-slate-500 text-sm">No new notifications</div>
                    ) : (
                      <div className="divide-y divide-slate-100">
                        {notifications.map(n => (
                          <div
                            key={n.id}
                            className={`p-4 cursor-pointer transition-colors flex gap-4 ${n.read ? 'bg-white hover:bg-slate-50 opacity-70' : 'bg-slate-50 hover:bg-slate-100'}`}
                            onClick={() => { setNotificationsOpen(false); if (onNotificationClick) onNotificationClick(n); }}
                          >
                            <div className="text-xl shrink-0">{n.icon || '🔔'}</div>
                            <div>
                              <p className="text-sm font-medium text-slate-900 mb-0.5">{n.title}</p>
                              <p className="text-xs text-slate-500 line-clamp-2">{n.message}</p>
                              {n.time && <p className="text-[10px] text-slate-400 mt-1">{n.time}</p>}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Viewport */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 scroll-smooth pb-24">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>

      {/* Floating Zoom Bar (desktop only) */}
      <ZoomBar />

      {/* Bottom Navigation for Mobile (Rider & Customer only) */}
      {(user?.role === 'rider' || user?.role === 'customer') && (
        <MobileBottomNav links={navLinks} />
      )}
    </div>
  );
};

export default AppShell;
