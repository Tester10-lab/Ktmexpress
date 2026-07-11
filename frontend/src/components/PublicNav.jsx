import React from 'react';
import { Link } from 'react-router-dom';

import { useSettings } from '../store/SettingsContext';
import brandLogo from '../assets/logo.png';

const PublicNav = ({ active }) => {
  const { logoUrl } = useSettings();

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          {logoUrl ? (
            <img src={logoUrl} alt="Logo" className="h-8 object-contain" onError={(e) => { e.target.onerror = null; e.target.src = brandLogo; }} />
            ) : (
              <img src={brandLogo} alt="ktmexpress Logo" className="h-10 object-contain" />
            )}
        </Link>
        <nav className="hidden md:flex items-center gap-1">
          {[
            { label: 'Branches', path: '/branches' },
            { label: 'Pricing', path: '/pricing' },
            { label: 'Contact', path: '/contact' },
          ].map(({ label, path }) => (
            <Link 
              key={path} 
              to={path} 
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                active === path ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              {label}
            </Link>
          ))}
          <div className="w-px h-6 bg-slate-200 mx-2" />
          <Link to="/login" className="btn-primary ml-2">Login</Link>
        </nav>
        <div className="md:hidden">
          <Link to="/login" className="btn-primary btn-sm">Login</Link>
        </div>
      </div>
    </header>
  );
};

export default PublicNav;
