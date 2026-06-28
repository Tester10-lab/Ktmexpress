import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import PrivateRoute from './layouts/PrivateRoute';
import AppShell from './layouts/AppShell';
import ErrorBoundary from './components/ErrorBoundary';

import { AuthProvider } from './store/AuthContext';
import { ToastProvider } from './store/ToastContext';

// Public pages
const Login = lazy(() => import('./pages/auth/Login'));
const TrackPackage = lazy(() => import('./pages/public/Tracking'));
const Home = lazy(() => import('./pages/public/Home'));
const Pricing = lazy(() => import('./pages/public/Pricing'));
const Branches = lazy(() => import('./pages/public/Branches'));
const Contact = lazy(() => import('./pages/public/Contact'));
const NotFound = lazy(() => import('./pages/NotFound'));

// Role-based dashboards
const VendorDashboard = lazy(() => import('./pages/vendor/VendorDashboard'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const DispatcherDashboard = lazy(() => import('./pages/dispatcher/DispatcherDashboard'));
const RiderDashboard = lazy(() => import('./pages/rider/RiderDashboard'));

const Loader = () => (
  <div className="flex items-center justify-center h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <AuthProvider>
          <ToastProvider>
            <Suspense fallback={<Loader />}>
              <Routes>
            {/* Public */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/tracking" element={<TrackPackage />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/branches" element={<Branches />} />
            <Route path="/contact" element={<Contact />} />

            {/* Protected */}
            <Route element={<PrivateRoute allowedRoles={['vendor']} />}>
              <Route path="/vendor/*" element={<VendorDashboard />} />
            </Route>
            <Route element={<PrivateRoute allowedRoles={['admin']} />}>
              <Route path="/admin/*" element={<AdminDashboard />} />
            </Route>
            <Route element={<PrivateRoute allowedRoles={['dispatcher']} />}>
              <Route path="/dispatcher/*" element={<DispatcherDashboard />} />
            </Route>
            <Route element={<PrivateRoute allowedRoles={['rider']} />}>
              <Route path="/rider/*" element={<RiderDashboard />} />
            </Route>

            <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </ToastProvider>
        </AuthProvider>
      </ErrorBoundary>
    </BrowserRouter>
  );
}

export default App;
