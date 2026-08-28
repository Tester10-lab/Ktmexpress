import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Routes, Route, useLocation, useNavigate, Navigate } from 'react-router-dom';
import AppShell from '../../layouts/AppShell';
import api from '../../api/axios';
import { 
  LayoutDashboard, Wallet, Users, Settings2, BarChart3, Package
} from 'lucide-react';

const AnalyticsDashboard = lazy(() => import('./sections/AnalyticsDashboard'));
const PackageManagement = lazy(() => import('./sections/PackageManagement'));
const SettlementPanel = lazy(() => import('./sections/SettlementPanel'));
const UserManagement = lazy(() => import('./sections/UserManagement'));
const PricingEngine = lazy(() => import('./PricingEngine'));
const CodReconciliation = lazy(() => import('./sections/CodReconciliation'));
const FinancialAnalytics = lazy(() => import('./sections/FinancialAnalytics'));

const SectionLoader = () => (
  <div className="flex items-center justify-center p-16">
    <div className="w-8 h-8 border-2 border-slate-200 border-t-slate-900 rounded-full animate-spin"></div>
  </div>
);

// Nav icons
const navLinks = [
  { name: 'Dashboard', path: '/admin', exact: true, icon: <LayoutDashboard className="w-5 h-5" /> },
  { name: 'All Packages', path: '/admin/packages', icon: <Package className="w-5 h-5" /> },
  { name: 'Settlements', path: '/admin/settlements', icon: <Wallet className="w-5 h-5" /> },
  { name: 'Manage Users', path: '/admin/users', icon: <Users className="w-5 h-5" /> },
  { name: 'Pricing Engine', path: '/admin/pricing-engine', icon: <Settings2 className="w-5 h-5" /> },
  { name: 'COD Handovers', path: '/admin/handovers', icon: <Wallet className="w-5 h-5" /> },
  { name: 'Reports', path: '/admin/reports', icon: <BarChart3 className="w-5 h-5" /> }
];

const titleMap = {
  '/admin': 'Global Dashboard',
  '/admin/packages': 'All Packages Management',
  '/admin/settlements': 'Vendor Settlements',
  '/admin/users': 'User Management',
  '/admin/pricing-engine': 'Pricing Engine',
  '/admin/handovers': 'COD Handovers Verification',
  '/admin/reports': 'Reports & Analytics',
};

const AdminDashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const notifs = [];
        
        // Fetch Pending Settlements
        const settleRes = await api.get('/admin/settlements?limit=50');
        const pendingSettlements = (settleRes.data.data || []).filter(s => s.status === 'Pending');
        pendingSettlements.forEach(s => {
          notifs.push({
            id: `settle_${s._id}`,
            title: 'Settlement Request',
            message: `${(s.vendorId?.vendorMeta?.shopName || s.vendorId?.name) || 'A vendor'} requested Rs. ${s.requestedAmount}`,
            time: new Date(s.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            read: false,
            icon: '💰',
            path: '/admin/settlements'
          });
        });

        // Fetch Packages Pending Verification (excluding Delivered packages)
        const pkgRes = await api.get('/admin/packages?limit=50&deliveryVerificationStatus=Pending');
        const rawPkgs = pkgRes.data.data || [];
        const pendingVerifications = rawPkgs.filter(p => 
          p.status !== 'Delivered' && 
          p.riderSubmission?.status !== 'Delivered'
        );
        pendingVerifications.forEach(p => {
          notifs.push({
            id: `verify_${p._id}`,
            title: 'Verification Pending',
            message: `Package ${p.trackingCode} (${p.riderSubmission?.status || p.status}) requires verification.`,
            time: p.riderSubmission?.submittedAt ? new Date(p.riderSubmission.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            read: false,
            icon: '⏳',
            path: '/admin/packages'
          });
        });

        setNotifications(notifs);
      } catch (err) {
        console.error('Failed to fetch admin notifications', err);
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);

    const handleNewNotif = (e) => {
      if (e.detail) {
        setNotifications(prev => [e.detail, ...prev]);
      }
    };
    window.addEventListener('app_notification', handleNewNotif);

    return () => {
      clearInterval(interval);
      window.removeEventListener('app_notification', handleNewNotif);
    };
  }, []);

  const handleNotificationClick = (n) => {
    if (n.path) navigate(n.path);
  };

  const title = Object.entries(titleMap).sort((a, b) => b[0].length - a[0].length).find(([p]) => location.pathname.startsWith(p))?.[1] || 'Admin';

  return (
    <AppShell 
      navLinks={navLinks} 
      currentTitle={title} 
      roleBadge="Admin Workspace"
      notifications={notifications}
      onNotificationClick={handleNotificationClick}
    >
      <Suspense fallback={<SectionLoader />}>
        <Routes>
          <Route path="/" element={<AnalyticsDashboard />} />
          <Route path="/packages" element={<PackageManagement />} />
          <Route path="/settlements" element={<SettlementPanel />} />
          <Route path="/expenses" element={<Navigate to="/admin" replace />} />
          <Route path="/users" element={<UserManagement />} />
          <Route path="/pricing-engine" element={<PricingEngine />} />
          <Route path="/pricing" element={<PricingEngine />} />
          <Route path="/handovers" element={<CodReconciliation />} />
          <Route path="/reports" element={<FinancialAnalytics />} />
        </Routes>
      </Suspense>
    </AppShell>
  );
};

export default AdminDashboard;
