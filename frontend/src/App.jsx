import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import PrivateRoute from './components/PrivateRoute';

import Login from './pages/auth/Login';
import Home from './pages/public/Home';
import Tracking from './pages/public/Tracking';
import Pricing from './pages/public/Pricing';
import Contact from './pages/public/Contact';

// Lazy loaded modules
const AdminDashboard = React.lazy(() => import('./pages/admin/AdminDashboard'));
const VendorDashboard = React.lazy(() => import('./pages/vendor/VendorDashboard'));
const DispatcherDashboard = React.lazy(() => import('./pages/dispatcher/DispatcherDashboard'));
const RiderDashboard = React.lazy(() => import('./pages/rider/RiderDashboard'));

// Lightweight Spinner component
const PageSpinner = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f8fafc' }}>
    <div style={{ width: '40px', height: '40px', border: '4px solid #e2e8f0', borderTop: '4px solid #3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
    <style>
      {`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}
    </style>
  </div>
);

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Suspense fallback={<PageSpinner />}>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/track" element={<Tracking />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/login" element={<Login />} />

              {/* Admin */}
              <Route path="/admin/*" element={
                <PrivateRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </PrivateRoute>
              } />

              {/* Vendor */}
              <Route path="/vendor/*" element={
                <PrivateRoute allowedRoles={['vendor']}>
                  <VendorDashboard />
                </PrivateRoute>
              } />

              {/* Dispatcher */}
              <Route path="/dispatcher/*" element={
                <PrivateRoute allowedRoles={['dispatcher']}>
                  <DispatcherDashboard />
                </PrivateRoute>
              } />

              {/* Rider */}
              <Route path="/rider/*" element={
                <PrivateRoute allowedRoles={['rider']}>
                  <RiderDashboard />
                </PrivateRoute>
              } />

              {/* Fallbacks */}
              <Route path="/unauthorized" element={<div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',fontFamily:'Inter,sans-serif',color:'#64748b'}}><div style={{textAlign:'center'}}><h1 style={{fontSize:'3rem',fontWeight:800,color:'#ef4444'}}>403</h1><p style={{fontSize:'1.1rem'}}>You don't have permission to access this page.</p><a href="/login" style={{color:'#2563eb',marginTop:16,display:'inline-block'}}>← Back to Login</a></div></div>} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
