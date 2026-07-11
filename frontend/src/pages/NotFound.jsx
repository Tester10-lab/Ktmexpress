import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, AlertTriangle } from 'lucide-react';
import { useAuth } from '../store/AuthContext';

const NotFound = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleGoHome = () => {
    if (user?.role === 'admin') navigate('/admin');
    else if (user?.role === 'vendor') navigate('/vendor');
    else if (user?.role === 'rider') navigate('/rider');
    else if (user?.role === 'dispatcher') navigate('/dispatcher');
    else navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden p-8 text-center animate-scaleIn border border-slate-100">
        <div className="w-24 h-24 bg-brand-50 text-brand-500 rounded-full flex items-center justify-center mx-auto mb-6 border-8 border-brand-100/50">
          <AlertTriangle className="w-10 h-10" />
        </div>
        
        <h1 className="text-5xl font-black text-slate-900 mb-2 tracking-tight">404</h1>
        <h2 className="text-xl font-bold text-slate-700 mb-4">Page Not Found</h2>
        
        <p className="text-slate-500 mb-8 leading-relaxed">
          The page you are looking for doesn't exist, has been moved, or you don't have permission to access it.
        </p>
        
        <button 
          onClick={handleGoHome}
          className="btn-primary w-full flex items-center justify-center gap-2 py-3 rounded-xl text-lg shadow-lg shadow-brand-500/20"
        >
          <Home className="w-5 h-5" />
          Go to Dashboard
        </button>
      </div>
    </div>
  );
};

export default NotFound;
