import React from 'react';
import { Link } from 'react-router-dom';
import { useSettings } from '../store/SettingsContext';
import brandLogo from '../assets/logo.png';
import { Button } from './ui/Button';

const PublicNav = () => {
  const { logoUrl } = useSettings();

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="flex items-center py-1">
            <img src={brandLogo} alt="KDM Express Logo" className="h-11 max-w-[180px] object-contain" />
          </div>
        </Link>
        <div>
          <Link to="/login">
            <Button variant="primary" className="px-6 py-2 font-semibold">Login</Button>
          </Link>
        </div>
      </div>
    </header>
  );
};

export default PublicNav;
