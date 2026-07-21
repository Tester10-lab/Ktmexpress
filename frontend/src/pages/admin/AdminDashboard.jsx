import React, { useState, useEffect } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import AppShell from '../../layouts/AppShell';
import api from '../../api/axios';
import { 
  LayoutDashboard, Wallet, Receipt, Users, Settings2, Activity, 
  Package, LayoutGrid, BarChart3, CheckCircle2
} from 'lucide-react';

import AnalyticsDashboard from './sections/AnalyticsDashboard';
import SettlementPanel from './sections/SettlementPanel';
import ExpenseLog from './sections/ExpenseLog';
import UserManagement from './sections/UserManagement';
import PricingEngine from './PricingEngine';
import AuditLogViewer from './sections/AuditLogViewer';
import PackageManagement from './sections/PackageManagement';
import DispatcherPanel from './sections/DispatcherPanel';
import CodReconciliation from './sections/CodReconciliation';
import FinancialAnalytics from './sections/FinancialAnalytics';
// Nav icons
const navLinks = [
  { name: 'Dashboard', path: '/admin', exact: true, icon: <LayoutDashboard className="w-5 h-5" /> },
  { name: 'Settlements', path: '/admin/settlements', icon: <Wallet className="w-5 h-5" /> },
  { name: 'Rider Expenses', path: '/admin/expenses', icon: <Receipt className="w-5 h-5" /> },
  { name: 'Manage Users', path: '/admin/users', icon: <Users className="w-5 h-5" /> },
  { name: 'Pricing Engine', path: '/admin/pricing-engine', icon: <Settings2 className="w-5 h-5" /> },
  { name: 'Global Scan History', path: '/admin/scan-history', icon: <Activity className="w-5 h-5" /> },
  { name: 'All Packages', path: '/admin/packages', icon: <Package className="w-5 h-5" /> },
  { name: 'Dispatcher Panel', path: '/admin/dispatcher', icon: <LayoutGrid className="w-5 h-5" /> },
  { name: 'COD Handovers', path: '/admin/handovers', icon: <Wallet className="w-5 h-5" /> },
  { name: 'Reports', path: '/admin/reports', icon: <BarChart3 className="w-5 h-5" /> }
];

const titleMap = {
  '/admin': 'Global Dashboard',
  '/admin/settlements': 'Vendor Settlements',
  '/admin/expenses': 'Rider Expenses',
  '/admin/users': 'User Management',
  '/admin/pricing-engine': 'Pricing Engine',
  '/admin/scan-history': 'Global Scan History',
  '/admin/packages': 'All Packages',
  '/admin/dispatcher': 'Dispatcher Panel',
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

        // Fetch Pending Expenses
        const expRes = await api.get('/admin/expenses?limit=50');
        const pendingExpenses = (expRes.data.data || []).filter(e => e.status === 'Pending');
        pendingExpenses.forEach(e => {
          notifs.push({
            id: `exp_${e._id}`,
            title: 'Rider Expense',
            message: `${e.riderId?.name || 'A rider'} logged Rs. ${e.amount} for ${e.category}`,
            time: new Date(e.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            read: false,
            icon: '🏍️',
            path: '/admin/expenses'
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
      <Routes>
        <Route path="/" element={<AnalyticsDashboard />} />
        <Route path="/settlements" element={<SettlementPanel />} />
        <Route path="/expenses" element={<ExpenseLog />} />
        <Route path="/users" element={<UserManagement />} />
        <Route path="/pricing-engine" element={<PricingEngine />} />
        <Route path="/pricing" element={<PricingEngine />} />
        <Route path="/scan-history" element={<AuditLogViewer />} />
        <Route path="/packages" element={<PackageManagement />} />
        <Route path="/dispatcher" element={<DispatcherPanel />} />
        <Route path="/handovers" element={<CodReconciliation />} />
        <Route path="/reports" element={<FinancialAnalytics />} />
      </Routes>
    </AppShell>
  );
};

export default AdminDashboard;
