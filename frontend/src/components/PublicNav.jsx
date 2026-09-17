import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Phone, Mail, MapPin, Search, Menu, X, User, ChevronRight, MessageCircle } from 'lucide-react';
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
      <div className="bg-[#002B49] text-white py-2 px-3 sm:px-6 text-xs border-b border-[#001f35]">
        <div className="max-w-7xl mx-auto flex justify-between items-center gap-2">
          
          {/* Left Contact Info */}
          <div className="flex items-center gap-4 sm:gap-6 text-slate-100">
            <a
              href="tel:+9779801081469"
              className="flex items-center gap-1.5 text-white hover:text-red-300 transition-colors font-medium"
            >
              <Phone className="w-3.5 h-3.5 text-[#E31837] shrink-0" />
              <span>
                <span className="hidden sm:inline font-bold">Call / WhatsApp: </span>
                +977 980-1081469
              </span>
            </a>

            <a
              href="mailto:info@kdmexpress.com"
              className="hidden md:flex items-center gap-1.5 text-slate-200 hover:text-white transition-colors"
            >
              <Mail className="w-3.5 h-3.5 text-[#E31837] shrink-0" />
              <span>info@kdmexpress.com</span>
            </a>

            <span className="hidden xl:flex items-center gap-1.5 text-slate-300">
              <MapPin className="w-3.5 h-3.5 text-[#E31837] shrink-0" />
              <span>Kathmandu Central Hub, Nepal</span>
            </span>
          </div>

          {/* Right Links & Portal */}
          <div className="flex items-center gap-3 sm:gap-4">
            <a
              href="https://wa.me/9779801081469"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#25D366] hover:text-[#34e077] font-bold flex items-center gap-1 transition-colors text-[11px] sm:text-xs"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">WhatsApp</span>
            </a>

            <span className="text-slate-600 hidden sm:inline">|</span>

            <Link
              to="/login"
              className="flex items-center gap-1.5 bg-[#E31837] hover:bg-[#c1122d] text-white px-2.5 sm:px-3 py-1 rounded font-bold text-[11px] sm:text-xs uppercase tracking-wider transition-colors shadow-sm"
            >
              <User className="w-3 h-3" />
              <span>Portal Login</span>
            </Link>
          </div>

        </div>
      </div>

      {/* Main Navbar */}
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
          
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 sm:gap-3 shrink-0">
            <img
              src="/cargohub/images/kdm-logo.png"
              alt="KDM Express"
              className="h-9 sm:h-12 w-auto object-contain"
              fetchpriority="high"
              decoding="async"
              onError={(e) => { e.currentTarget.src = brandLogo; }}
            />
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden lg:flex items-center gap-6 xl:gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className={`text-sm font-bold tracking-wide transition-colors py-1.5 border-b-2 ${
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
              className="bg-[#E31837] hover:bg-[#c1122d] text-white text-xs font-bold uppercase tracking-wider py-2.5 px-5 rounded-lg shadow-md hover:shadow-lg transition-all flex items-center gap-2 shrink-0"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Track Shipment</span>
            </Link>
          </nav>

          {/* Mobile Actions */}
          <div className="lg:hidden flex items-center gap-2">
            <Link
              to="/track"
              className="bg-[#E31837] hover:bg-[#c1122d] text-white text-xs font-bold px-3 py-2 rounded-lg flex items-center gap-1.5 shadow-sm"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Track</span>
            </Link>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-800 hover:bg-slate-100 border border-slate-200 transition-colors"
              aria-label="Toggle Navigation"
            >
              {mobileMenuOpen ? <X className="w-6 h-6 text-[#E31837]" /> : <Menu className="w-6 h-6 text-[#002B49]" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-b-2 border-[#002B49] px-4 pt-3 pb-6 space-y-1 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2">
            Navigation Menu
          </div>

          {navLinks.map((link) => (
            <Link
              key={link.name}
              to={link.path}
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center justify-between px-3.5 py-3 rounded-lg text-sm font-bold transition-colors ${
                isActive(link.path)
                  ? 'bg-red-50 text-[#E31837] border-l-4 border-[#E31837]'
                  : 'text-slate-800 hover:bg-slate-50'
              }`}
            >
              <span>{link.name}</span>
              <ChevronRight className={`w-4 h-4 ${isActive(link.path) ? 'text-[#E31837]' : 'text-slate-400'}`} />
            </Link>
          ))}

          <div className="pt-4 mt-2 border-t border-slate-100 flex flex-col gap-2.5">
            <Link
              to="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full text-center bg-[#002B49] hover:bg-[#001f35] text-white py-3 rounded-xl font-bold text-xs uppercase tracking-wider shadow"
            >
              Customer & Staff Portal Login
            </Link>

            <a
              href="https://wa.me/9779801081469"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full text-center bg-[#25D366] hover:bg-[#20bd5a] text-white py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Chat on WhatsApp (+977 980-1081469)</span>
            </a>
          </div>
        </div>
      )}
    </header>
  );
};

export default PublicNav;
