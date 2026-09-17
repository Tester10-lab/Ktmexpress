import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Phone, Mail, MapPin, Search, Menu, X, User } from 'lucide-react';
import brandLogo from '../assets/logo.png';

const PublicNav = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Services', path: '/services' },
    { name: 'Track Shipment', path: '/track' },
    { name: 'Pricing', path: '/pricing' },
    { name: 'Branches', path: '/branches' },
    { name: 'About Us', path: '/about' },
    { name: 'Contact', path: '/contact' },
  ];

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <header className="sticky top-0 z-50 shadow-md bg-white">
      {/* Topbar */}
      <div className="bg-[#002B49] text-white py-2 px-4 text-xs font-medium border-b border-[#001f35]">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-between items-center gap-2">
          <div className="flex flex-wrap items-center gap-4 sm:gap-6">
            <a href="tel:+9779801081469" className="flex items-center gap-1.5 hover:text-red-400 transition-colors">
              <Phone className="w-3.5 h-3.5 text-[#E31837]" />
              <span><strong>Call / WhatsApp:</strong> +977 980-1081469</span>
            </a>
            <a href="mailto:info@kdmexpress.com" className="hidden md:flex items-center gap-1.5 hover:text-red-400 transition-colors">
              <Mail className="w-3.5 h-3.5 text-[#E31837]" />
              <span>info@kdmexpress.com</span>
            </a>
            <span className="hidden lg:flex items-center gap-1.5 text-slate-300">
              <MapPin className="w-3.5 h-3.5 text-[#E31837]" />
              <span>Kathmandu Central Hub, Nepal</span>
            </span>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="https://wa.me/9779801081469"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#25D366] font-bold hover:underline flex items-center gap-1"
            >
              <span>WhatsApp Support</span>
            </a>
            <span className="text-slate-600">|</span>
            <Link
              to="/login"
              className="flex items-center gap-1.5 bg-[#E31837] hover:bg-[#c1122d] text-white px-3 py-1 rounded font-bold transition-colors"
            >
              <User className="w-3 h-3" />
              <span>Portal Login</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3">
            <img
              src="/cargohub/images/kdm-logo.png"
              alt="KDM Express"
              className="h-12 w-auto object-contain"
              onError={(e) => { e.currentTarget.src = brandLogo; }}
            />
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-7">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className={`text-sm font-bold tracking-wide transition-colors py-1 border-b-2 ${
                  isActive(link.path)
                    ? 'text-[#E31837] border-[#E31837]'
                    : 'text-slate-700 border-transparent hover:text-[#002B49] hover:border-slate-300'
                }`}
              >
                {link.name}
              </Link>
            ))}

            <Link
              to="/track"
              className="bg-[#E31837] hover:bg-[#c1122d] text-white text-xs font-bold uppercase tracking-wider py-2.5 px-5 rounded shadow hover:shadow-lg transition-all flex items-center gap-2"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Track Shipment</span>
            </Link>
          </nav>

          {/* Mobile menu button */}
          <div className="lg:hidden flex items-center gap-2">
            <Link
              to="/track"
              className="bg-[#E31837] text-white text-xs font-bold px-3 py-2 rounded flex items-center gap-1"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Track</span>
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-700 hover:bg-slate-100 transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-slate-200 px-4 pt-3 pb-6 space-y-2 animate-fadeIn">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              to={link.path}
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-3 py-2.5 rounded-lg text-base font-bold transition-colors ${
                isActive(link.path)
                  ? 'bg-red-50 text-[#E31837]'
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              {link.name}
            </Link>
          ))}
          <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
            <Link
              to="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full text-center bg-[#002B49] text-white py-3 rounded-lg font-bold text-sm"
            >
              Customer & Staff Portal Login
            </Link>
            <a
              href="https://wa.me/9779801081469"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full text-center bg-[#25D366] text-white py-2.5 rounded-lg font-bold text-sm"
            >
              WhatsApp Support (+977 980-1081469)
            </a>
          </div>
        </div>
      )}
    </header>
  );
};

export default PublicNav;
