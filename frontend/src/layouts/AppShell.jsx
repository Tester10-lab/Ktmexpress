import React, { useState, useCallback, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Bell, LogOut, Menu, Package, X } from 'lucide-react';
import { useAuth } from '../store/AuthContext';
import useNotificationSound from '../hooks/useNotificationSound';
import { useZoom } from '../hooks/useZoom';
import { useSwipeGesture } from '../hooks/useSwipeGesture';
import ZoomBar from '../components/ZoomBar';
import { useToast } from '../store/ToastContext';

const AppShell = ({ navLinks, currentTitle, children, roleBadge, notifications = [], onNotificationClick }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const { showToast } = useToast();

  const { playNotification, playAlert } = useNotificationSound();
  useZoom();

  const openSidebar = useCallback(() => setMobileOpen(true), []);
  const closeSidebar = useCallback(() => setMobileOpen(false), []);
  const { ref: swipeRef } = useSwipeGesture({
    onSwipeRight: openSidebar,
    onSwipeLeft: closeSidebar,
  });

  useEffect(() => {
    let socket;
    if (user?.role) {
      import('socket.io-client').then(({ io }) => {
        const rawUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
        const socketUrl = rawUrl.replace(/\/api\/?$/, '');
        
        socket = io(socketUrl, {
          withCredentials: true,
          transports: ['websocket'],
          auth: { token: localStorage.getItem('token') }
        });
        
        socket.emit('join_role', user.role);
        if (user._id) socket.emit('join_user', user._id);
        
        socket.on('notification', (data) => {
          showToast(data.message || data.title || 'New Notification', 'info');
          if (data.type === 'alert') playAlert();
          else playNotification();
        });
      });
    }
    return () => { if (socket) socket.disconnect(); };
  }, [user, playNotification, playAlert, showToast]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = user?.name ? user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) : '??';
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50" ref={swipeRef}>
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-[9999] px-4 py-2 bg-brand-600 text-white font-semibold rounded-lg">Skip to main content</a>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden" onClick={closeSidebar} aria-hidden="true" />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 flex flex-col ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        
        {/* Brand */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-100 flex-shrink-0">
          <div className="flex items-center gap-3 text-brand-600">
            <Package className="w-7 h-7" />
            <div>
              <h1 className="font-bold text-lg leading-none text-slate-900 tracking-tight">ktmexpress</h1>
              <span className="text-[10px] font-bold uppercase tracking-wider text-brand-600">{roleBadge || 'Workspace'}</span>
            </div>
          </div>
          <button className="lg:hidden p-1 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-100" onClick={closeSidebar}>
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
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive 
                    ? 'bg-brand-50 text-brand-700' 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`
              }
            >
              <div className="w-5 h-5 flex items-center justify-center [&>svg]:w-5 [&>svg]:h-5">{link.icon}</div>
              {link.name}
            </NavLink>
          ))}
        </nav>

        {/* Footer / Profile */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-500 to-indigo-600 text-white flex items-center justify-center font-bold shadow-sm shadow-brand-200">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-slate-900 truncate">{user?.name || 'User'}</h4>
              <p className="text-xs text-slate-500 truncate">{user?.email || ''}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:text-slate-900 transition-colors">
            <LogOut className="w-4 h-4" />
            Log Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden" id="main-content">
        
        {/* Header */}
        <header className="h-16 flex items-center justify-between px-4 sm:px-8 bg-white/80 backdrop-blur-md border-b border-slate-200 z-30 sticky top-0">
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
                className="relative p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500"
                onClick={() => setNotificationsOpen(!notificationsOpen)}
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white"></span>
                )}
              </button>

              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden origin-top-right animate-in fade-in zoom-in duration-200 z-50">
                  <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                    <span className="font-semibold text-sm text-slate-900">Notifications</span>
                    {unreadCount > 0 && <span className="bg-brand-100 text-brand-700 text-[10px] font-bold px-2 py-0.5 rounded-full">{unreadCount} new</span>}
                  </div>
                  <div className="max-h-[300px] overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center text-slate-500 text-sm">No new notifications</div>
                    ) : (
                      <div className="divide-y divide-slate-100">
                        {notifications.map(n => (
                          <div
                            key={n.id}
                            className={`p-4 hover:bg-slate-50 cursor-pointer transition-colors flex gap-4 ${n.read ? 'opacity-70' : 'bg-brand-50/30'}`}
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
    </div>
  );
};

export default AppShell;
