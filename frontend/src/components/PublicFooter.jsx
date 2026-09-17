import React from 'react';
import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin, Globe, MessageCircle, ShieldCheck, Truck, ChevronRight } from 'lucide-react';
import brandLogo from '../assets/logo.png';

const PublicFooter = () => {
  return (
    <footer className="bg-[#002B49] text-white pt-14 pb-8 border-t-4 border-[#E31837] relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main 4-Column Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-10 pb-12 border-b border-white/15">
          
          {/* Col 1: Brand & Summary */}
          <div className="lg:col-span-4 space-y-4">
            <Link to="/" className="inline-block bg-white p-2.5 rounded-xl shadow-md">
              <img
                src="/cargohub/images/kdm-logo.png"
                alt="KDM Express"
                className="h-10 w-auto object-contain"
                loading="lazy"
                decoding="async"
                onError={(e) => { e.currentTarget.src = brandLogo; }}
              />
            </Link>

            <p className="text-slate-200 text-xs sm:text-sm leading-relaxed">
              KDM Express is Nepal's premier courier and logistics partner offering fast, reliable door-to-door delivery, nationwide parcel shipping, e-commerce COD services, and express document dispatch across Nepal.
            </p>

            <div className="pt-2">
              <span className="inline-block bg-[#E31837] text-white text-[11px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
                Nationwide Nepal Network
              </span>
            </div>
          </div>

          {/* Col 2: Quick Links */}
          <div className="lg:col-span-2 space-y-3">
            <h4 className="text-white font-bold text-sm uppercase tracking-wider border-b border-white/20 pb-2.5">
              Quick Navigation
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm">
              <li>
                <Link to="/" className="text-slate-200 hover:text-white hover:underline transition-colors flex items-center gap-1.5 py-0.5">
                  <ChevronRight className="w-3.5 h-3.5 text-[#E31837]" />
                  <span>Home</span>
                </Link>
              </li>
              <li>
                <Link to="/services" className="text-slate-200 hover:text-white hover:underline transition-colors flex items-center gap-1.5 py-0.5">
                  <ChevronRight className="w-3.5 h-3.5 text-[#E31837]" />
                  <span>Logistics Services</span>
                </Link>
              </li>
              <li>
                <Link to="/track" className="text-slate-200 hover:text-white hover:underline transition-colors flex items-center gap-1.5 py-0.5">
                  <ChevronRight className="w-3.5 h-3.5 text-[#E31837]" />
                  <span>Track Shipment</span>
                </Link>
              </li>
              <li>
                <Link to="/pricing" className="text-slate-200 hover:text-white hover:underline transition-colors flex items-center gap-1.5 py-0.5">
                  <ChevronRight className="w-3.5 h-3.5 text-[#E31837]" />
                  <span>Rate Calculator</span>
                </Link>
              </li>
              <li>
                <Link to="/branches" className="text-slate-200 hover:text-white hover:underline transition-colors flex items-center gap-1.5 py-0.5">
                  <ChevronRight className="w-3.5 h-3.5 text-[#E31837]" />
                  <span>Nepal Hub Branches</span>
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-slate-200 hover:text-white hover:underline transition-colors flex items-center gap-1.5 py-0.5">
                  <ChevronRight className="w-3.5 h-3.5 text-[#E31837]" />
                  <span>About KDM Express</span>
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-slate-200 hover:text-white hover:underline transition-colors flex items-center gap-1.5 py-0.5">
                  <ChevronRight className="w-3.5 h-3.5 text-[#E31837]" />
                  <span>Contact & Support</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Core Offerings */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="text-white font-bold text-sm uppercase tracking-wider border-b border-white/20 pb-2.5">
              Core Offerings
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm">
              <li>
                <Link to="/services" className="text-slate-200 hover:text-white hover:underline transition-colors flex items-center gap-1.5 py-0.5">
                  <ChevronRight className="w-3.5 h-3.5 text-[#E31837]" />
                  <span>Same-Day Kathmandu Valley</span>
                </Link>
              </li>
              <li>
                <Link to="/services" className="text-slate-200 hover:text-white hover:underline transition-colors flex items-center gap-1.5 py-0.5">
                  <ChevronRight className="w-3.5 h-3.5 text-[#E31837]" />
                  <span>Door-to-Door Delivery</span>
                </Link>
              </li>
              <li>
                <Link to="/services" className="text-slate-200 hover:text-white hover:underline transition-colors flex items-center gap-1.5 py-0.5">
                  <ChevronRight className="w-3.5 h-3.5 text-[#E31837]" />
                  <span>E-Commerce COD Collections</span>
                </Link>
              </li>
              <li>
                <Link to="/services" className="text-slate-200 hover:text-white hover:underline transition-colors flex items-center gap-1.5 py-0.5">
                  <ChevronRight className="w-3.5 h-3.5 text-[#E31837]" />
                  <span>Nationwide Highway Express</span>
                </Link>
              </li>
              <li>
                <Link to="/services" className="text-slate-200 hover:text-white hover:underline transition-colors flex items-center gap-1.5 py-0.5">
                  <ChevronRight className="w-3.5 h-3.5 text-[#E31837]" />
                  <span>Secure Document Dispatch</span>
                </Link>
              </li>
              <li>
                <Link to="/services" className="text-slate-200 hover:text-white hover:underline transition-colors flex items-center gap-1.5 py-0.5">
                  <ChevronRight className="w-3.5 h-3.5 text-[#E31837]" />
                  <span>Bulk Freight & Cargo</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Contact & Central Hub */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="text-white font-bold text-sm uppercase tracking-wider border-b border-white/20 pb-2.5">
              Contact & Central Hub
            </h4>
            <ul className="space-y-3 text-xs sm:text-sm text-slate-200">
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[#E31837] shrink-0 mt-1" />
                <span>Kathmandu Central Office & Sorting Center, Kuleshwor, Nepal</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Phone className="w-4 h-4 text-[#E31837] shrink-0 mt-1" />
                <div>
                  <div className="font-bold text-white text-xs">Call / WhatsApp:</div>
                  <a href="tel:+9779801081469" className="text-slate-100 hover:text-white hover:underline font-medium">
                    +977 980-1081469
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <Mail className="w-4 h-4 text-[#E31837] shrink-0 mt-1" />
                <div>
                  <div className="font-bold text-white text-xs">Official Email:</div>
                  <a href="mailto:info@kdmexpress.com" className="text-slate-100 hover:text-white hover:underline font-medium">
                    info@kdmexpress.com
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <Globe className="w-4 h-4 text-[#E31837] shrink-0 mt-1" />
                <div>
                  <div className="font-bold text-white text-xs">Website:</div>
                  <a href="https://kdmexpress.com" className="text-slate-100 hover:text-white hover:underline font-medium">
                    kdmexpress.com
                  </a>
                </div>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-slate-300 text-center sm:text-left">
          <p>© {new Date().getFullYear()} <strong className="text-white">KDM Express</strong> (kdmexpress.com). All rights reserved. Nepal Courier & Logistics Network.</p>
          
          <div className="flex flex-wrap justify-center items-center gap-4 text-slate-300">
            <Link to="/pricing" className="hover:text-white hover:underline transition-colors">Pricing</Link>
            <span className="text-white/20">•</span>
            <Link to="/branches" className="hover:text-white hover:underline transition-colors">Branches</Link>
            <span className="text-white/20">•</span>
            <Link to="/login" className="hover:text-white hover:underline transition-colors font-bold text-[#E31837]">
              Portal Login
            </Link>
          </div>
        </div>

      </div>

      {/* Floating WhatsApp Action Widget */}
      <a
        href="https://wa.me/9779801081469"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Direct WhatsApp Support"
        className="fixed bottom-6 right-6 z-40 bg-[#25D366] hover:bg-[#20bd5a] text-white p-3.5 sm:p-4 rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all flex items-center justify-center group"
      >
        <MessageCircle className="w-6 h-6 sm:w-7 sm:h-7" />
        <span className="max-w-0 overflow-hidden whitespace-nowrap group-hover:max-w-xs transition-all duration-300 ease-in-out font-bold text-xs pl-0 group-hover:pl-2">
          Chat with us
        </span>
      </a>
    </footer>
  );
};

export default PublicFooter;
