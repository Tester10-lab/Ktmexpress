import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Truck, Clock, Award, Target, Eye, Users, ChevronRight, PhoneCall, CheckCircle2, Building2 } from 'lucide-react';
import PublicNav from '../../components/PublicNav';
import PublicFooter from '../../components/PublicFooter';

const About = () => {
  const values = [
    {
      title: 'Speed & Reliability',
      desc: 'Committed to guaranteed delivery windows with time-definite express logistics and same-day valley dispatches.',
      icon: <Clock className="w-7 h-7 text-[#E31837]" />
    },
    {
      title: 'Integrity & Security',
      desc: 'Transparent handling, tamper-proof packaging, and 100% secure Cash-on-Delivery (COD) collection and reconciliation.',
      icon: <ShieldCheck className="w-7 h-7 text-[#E31837]" />
    },
    {
      title: 'Customer First',
      desc: 'Dedicated support for individual senders and e-commerce enterprises with direct phone and WhatsApp assistance.',
      icon: <Users className="w-7 h-7 text-[#E31837]" />
    },
    {
      title: 'Nationwide Reach',
      desc: 'Bridging Kathmandu Valley to Terai plains and mountain valleys through our reliable highway trunk network.',
      icon: <Truck className="w-7 h-7 text-[#E31837]" />
    }
  ];

  const stats = [
    { value: '100K+', label: 'Parcels Delivered' },
    { value: '98.8%', label: 'On-Time Success' },
    { value: '9+', label: 'Regional Hubs' },
    { value: '500+', label: 'Active Merchants' }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans text-slate-800">
      <PublicNav />

      {/* Page Header */}
      <section className="relative bg-[#002B49] text-white py-16 lg:py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[#002B49] via-[#002035] to-[#001422] opacity-95 pointer-events-none" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-10 text-center">
          <span className="inline-flex items-center gap-1.5 bg-[#E31837] text-white px-3.5 py-1 rounded-full text-xs font-extrabold uppercase tracking-widest mb-4">
            About Us
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight mb-4">
            Powering Nepal's Modern Logistics
          </h1>
          <p className="text-base sm:text-lg text-slate-200 max-w-2xl mx-auto">
            KDM Express is Nepal's premier express delivery partner, connecting online merchants, businesses, and individuals with fast, secure, and transparent shipping.
          </p>
        </div>
      </section>

      {/* Company Story & Mission */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            <div className="lg:col-span-6 space-y-6">
              <div className="text-[#E31837] font-bold text-xs uppercase tracking-widest">
                Who We Are
              </div>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-[#002B49] leading-snug">
                Building the backbone of fast commerce across Nepal
              </h2>
              <p className="text-slate-600 leading-relaxed">
                Founded with a mission to eliminate delivery delays and bring transparency to domestic logistics, <strong>KDM Express</strong> provides end-to-end courier and freight solutions across Kathmandu Valley and nationwide districts.
              </p>
              <p className="text-slate-600 leading-relaxed">
                Whether you are an e-commerce brand seeking reliable Cash-on-Delivery collections with fast automated vendor disbursements, or a corporate entity needing secure document courier services, our specialized fleet and central sorting facilities ensure your shipments arrive safely and on time.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                <div className="p-5 rounded-xl border border-slate-200 bg-slate-50 flex items-start gap-4">
                  <Target className="w-8 h-8 text-[#E31837] shrink-0" />
                  <div>
                    <h3 className="font-bold text-[#002B49] text-base mb-1">Our Mission</h3>
                    <p className="text-xs text-slate-600">To simplify domestic shipping with speed, real-time visibility, and dependable doorstep service.</p>
                  </div>
                </div>
                <div className="p-5 rounded-xl border border-slate-200 bg-slate-50 flex items-start gap-4">
                  <Eye className="w-8 h-8 text-[#E31837] shrink-0" />
                  <div>
                    <h3 className="font-bold text-[#002B49] text-base mb-1">Our Vision</h3>
                    <p className="text-xs text-slate-600">To be the most trusted and technologically integrated express logistics network in Nepal.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Card / Stats showcase */}
            <div className="lg:col-span-6">
              <div className="bg-[#002B49] text-white rounded-2xl p-8 sm:p-10 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 -mr-12 -mt-12 w-48 h-48 bg-[#E31837]/20 rounded-full blur-2xl pointer-events-none" />
                
                <h3 className="text-xl sm:text-2xl font-bold mb-6 text-white border-b border-white/10 pb-4">
                  Why Thousands Trust KDM Express
                </h3>

                <ul className="space-y-4 mb-8">
                  {[
                    'Same-Day delivery coverage across Kathmandu, Lalitpur, and Bhaktapur',
                    'Daily highway express connections to all major hubs across 7 provinces',
                    'Zero hassle Cash on Delivery (COD) collection with reliable payouts',
                    'Online portal with live tracking, parcel history, and delivery proof',
                    'Tamper-proof packaging and trained delivery personnel',
                  ].map((feat, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-sm text-slate-200">
                      <CheckCircle2 className="w-5 h-5 text-[#E31837] shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 border-t border-white/10 text-center">
                  {stats.map((st, i) => (
                    <div key={i} className="p-2">
                      <div className="text-2xl sm:text-3xl font-extrabold text-[#E31837] mb-1">{st.value}</div>
                      <div className="text-xs text-slate-300 font-medium">{st.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="py-16 lg:py-20 bg-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="text-[#E31837] font-bold text-xs uppercase tracking-widest block mb-2">Our Foundation</span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-[#002B49]">The Principles Driving Our Fleet</h2>
            <p className="text-slate-600 mt-3 text-sm sm:text-base">Every parcel we handle carries a promise of accountability and care.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((v, idx) => (
              <div key={idx} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-14 h-14 bg-red-50 rounded-xl flex items-center justify-center mb-5">
                  {v.icon}
                </div>
                <h3 className="text-lg font-bold text-[#002B49] mb-2">{v.title}</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="bg-gradient-to-r from-[#002B49] to-[#001829] text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          <div>
            <h3 className="text-xl sm:text-2xl font-bold mb-1">Ready to ship with KDM Express?</h3>
            <p className="text-slate-300 text-sm">Join hundreds of merchants who rely on us every single day.</p>
          </div>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              to="/contact"
              className="bg-[#E31837] hover:bg-[#c1122d] text-white font-bold px-6 py-3 rounded-lg text-sm transition-colors"
            >
              Contact Our Team
            </Link>
            <Link
              to="/track"
              className="bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold px-6 py-3 rounded-lg text-sm transition-colors"
            >
              Track a Parcel
            </Link>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
};

export default About;
