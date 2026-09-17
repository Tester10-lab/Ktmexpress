import React from 'react';
import { Link } from 'react-router-dom';
import { Phone, Mail, Globe, MapPin } from 'lucide-react';
import brandLogo from '../assets/logo.png';

const PublicFooter = () => (
  <>
    <footer className="bg-[#002B49] text-white pt-16 pb-8 border-t border-[#001f35] text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          {/* Company Brief */}
          <div className="space-y-4">
            <Link to="/" className="inline-block">
              <img
                src="/cargohub/images/kdm-logo-light.svg"
                alt="KDM Express"
                className="h-12 w-auto object-contain"
                onError={(e) => { e.currentTarget.src = brandLogo; }}
              />
            </Link>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              KDM Express is Nepal's premier courier and logistics partner offering fast, reliable door-to-door delivery, nationwide parcel shipping, e-commerce COD services, and express document dispatch across Nepal.
            </p>
            <div className="pt-2">
              <span className="inline-block bg-[#E31837] text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                Nationwide Nepal Network
              </span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-bold text-sm uppercase tracking-wider mb-5 border-b border-slate-700 pb-2">
              Quick Navigation
            </h4>
            <ul className="space-y-2.5 text-xs sm:text-sm text-slate-300">
              <li><Link to="/" className="hover:text-red-400 transition-colors">Home</Link></li>
              <li><Link to="/services" className="hover:text-red-400 transition-colors">Logistics Services</Link></li>
              <li><Link to="/track" className="hover:text-red-400 transition-colors">Track Shipment</Link></li>
              <li><Link to="/pricing" className="hover:text-red-400 transition-colors">Rate Calculator</Link></li>
              <li><Link to="/branches" className="hover:text-red-400 transition-colors">Nepal Hub Branches</Link></li>
              <li><Link to="/about" className="hover:text-red-400 transition-colors">About KDM Express</Link></li>
              <li><Link to="/contact" className="hover:text-red-400 transition-colors">Contact & Support</Link></li>
            </ul>
          </div>

          {/* Core Services */}
          <div>
            <h4 className="text-white font-bold text-sm uppercase tracking-wider mb-5 border-b border-slate-700 pb-2">
              Core Offerings
            </h4>
            <ul className="space-y-2.5 text-xs sm:text-sm text-slate-300">
              <li><Link to="/services" className="hover:text-red-400 transition-colors">Same-Day Kathmandu Valley</Link></li>
              <li><Link to="/services" className="hover:text-red-400 transition-colors">Door-to-Door Delivery</Link></li>
              <li><Link to="/services" className="hover:text-red-400 transition-colors">E-Commerce COD Collections</Link></li>
              <li><Link to="/services" className="hover:text-red-400 transition-colors">Nationwide Highway Express</Link></li>
              <li><Link to="/services" className="hover:text-red-400 transition-colors">Secure Document Dispatch</Link></li>
              <li><Link to="/services" className="hover:text-red-400 transition-colors">Bulk Freight & Cargo</Link></li>
            </ul>
          </div>

          {/* Contact Details */}
          <div>
            <h4 className="text-white font-bold text-sm uppercase tracking-wider mb-5 border-b border-slate-700 pb-2">
              Contact & Central Hub
            </h4>
            <ul className="space-y-3.5 text-xs sm:text-sm text-slate-300">
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[#E31837] shrink-0 mt-0.5" />
                <span>Kathmandu Central Office & Sorting Center, Nepal</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Phone className="w-4 h-4 text-[#E31837] shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-white">Call / WhatsApp:</div>
                  <a href="tel:+9779801081469" className="hover:text-red-400">+977 980-1081469</a>
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <Mail className="w-4 h-4 text-[#E31837] shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-white">Official Email:</div>
                  <a href="mailto:info@kdmexpress.com" className="hover:text-red-400">info@kdmexpress.com</a>
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <Globe className="w-4 h-4 text-[#E31837] shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-white">Website:</div>
                  <a href="https://kdmexpress.com" className="hover:text-red-400">kdmexpress.com</a>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-slate-800 pt-6 mt-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-slate-400">
          <p>© {new Date().getFullYear()} <strong>KDM Express</strong> (kdmexpress.com). All rights reserved. Nepal Courier & Logistics Network.</p>
          <div className="flex items-center gap-4">
            <Link to="/pricing" className="hover:text-white transition-colors">Pricing</Link>
            <span>•</span>
            <Link to="/branches" className="hover:text-white transition-colors">Branches</Link>
            <span>•</span>
            <Link to="/login" className="text-[#E31837] font-bold hover:underline">Portal Login</Link>
          </div>
        </div>
      </div>
    </footer>

    {/* Floating WhatsApp Support Button */}
    <a
      href="https://wa.me/9779801081469"
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 bg-[#25D366] hover:bg-[#20ba5a] text-white p-3.5 rounded-full shadow-2xl hover:scale-110 transition-transform flex items-center justify-center"
      title="Chat with KDM Express on WhatsApp"
      aria-label="WhatsApp Support"
    >
      <svg className="w-7 h-7 fill-current" viewBox="0 0 24 24">
        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
      </svg>
    </a>
  </>
);

export default PublicFooter;
