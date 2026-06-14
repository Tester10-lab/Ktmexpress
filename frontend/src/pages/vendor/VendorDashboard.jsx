import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AppShell from '../../components/AppShell';
import { LayoutDashboard, Package, UploadCloud, DollarSign, RotateCcw } from 'lucide-react';

// Lazy loaded page modules
const DashboardOverview = lazy(() => import('./modules/DashboardOverview'));
const OrderManagement = lazy(() => import('./modules/OrderManagement'));
const PackageCreate = lazy(() => import('./modules/PackageCreate'));
const BulkUpload = lazy(() => import('./modules/BulkUpload'));
const PackageDetails = lazy(() => import('./modules/PackageDetails'));
const FinanceModule = lazy(() => import('./modules/FinanceModule'));
const ReturnsModule = lazy(() => import('./modules/ReturnsModule'));

const navLinks = [
  { name: 'Dashboard', path: '/vendor', exact: true, icon: <LayoutDashboard size={18}/> },
  { name: 'My Orders', path: '/vendor/packages', icon: <Package size={18}/> },
  { name: 'Bulk Upload', path: '/vendor/packages/bulk', icon: <UploadCloud size={18}/> },
  { name: 'Finance & Payouts', path: '/vendor/finance', icon: <DollarSign size={18}/> },
  { name: 'Returns', path: '/vendor/returns', icon: <RotateCcw size={18}/> },
];

const titleMap = {
  '/vendor': 'Dashboard Overview',
  '/vendor/packages': 'Order Management',
  '/vendor/packages/new': 'Create New Order',
  '/vendor/packages/bulk': 'Bulk Upload Orders',
  '/vendor/finance': 'Finance & Settlements',
  '/vendor/returns': 'Returns Management',
};

const FallbackLoader = () => (
  <div className="flex items-center justify-center h-full min-h-[400px]">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
  </div>
);

const VendorDashboard = () => {
  // Try to match the exact pathname to titleMap, if not it might be a detail page
  const currentTitle = titleMap[window.location.pathname] || 'Package Details';

  return (
    <AppShell navLinks={navLinks} currentTitle={currentTitle} roleBadge="Vendor Portal">
      <div className="animate-in fade-in duration-300">
        <Suspense fallback={<FallbackLoader />}>
          <Routes>
            <Route path="/" element={<DashboardOverview />} />
            <Route path="packages" element={<OrderManagement />} />
            <Route path="packages/new" element={<PackageCreate />} />
            <Route path="packages/bulk" element={<BulkUpload />} />
            <Route path="packages/:id" element={<PackageDetails />} />
            <Route path="finance" element={<FinanceModule />} />
            <Route path="returns" element={<ReturnsModule />} />
            <Route path="*" element={<Navigate to="/vendor" replace />} />
          </Routes>
        </Suspense>
      </div>
    </AppShell>
  );
};

export default VendorDashboard;
