import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import PrivateRoute from './components/PrivateRoute';

import Login from './pages/auth/Login';
import AdminDashboard from './pages/admin/AdminDashboard';
import VendorDashboard from './pages/vendor/VendorDashboard';
import DispatcherDashboard from './pages/dispatcher/DispatcherDashboard';
import RiderDashboard from './pages/rider/RiderDashboard';

import Home from './pages/public/Home';
import Tracking from './pages/public/Tracking';
import Pricing from './pages/public/Pricing';
import Contact from './pages/public/Contact';

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
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
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
