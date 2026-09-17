import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Search, Truck, MapPin, ShieldCheck, Clock, ArrowRight, CheckCircle2, PhoneCall, Sparkles, Building2 } from 'lucide-react';
import PublicNav from '../../components/PublicNav';
import PublicFooter from '../../components/PublicFooter';

const Home = () => {
  const [code, setCode] = useState('');
  const navigate = useNavigate();

  const handleTrack = (e) => {
    e.preventDefault();
    if (code.trim()) {
      navigate(`/track?code=${encodeURIComponent(code.trim())}`);
    }
  };

  const services = [
    {
      title: 'Same-Day Express',
      desc: 'Ultra-fast same-day parcel and document delivery within Kathmandu Valley (Kathmandu, Lalitpur, Bhaktapur).',
      icon: <Clock className="w-7 h-7 text-[#E31837]" />,
      badge: 'Kathmandu Valley'
    },
    {
      title: 'Door-to-Door Delivery',
      desc: 'Convenient doorstep pickup from your warehouse/shop and guaranteed direct doorstep delivery to recipients across Nepal.',
      icon: <Truck className="w-7 h-7 text-[#E31837]" />,
      badge: 'Nationwide'
    },
    {
      title: 'E-Commerce COD Solutions',
      desc: 'Reliable Cash on Delivery collection for online sellers with fast automated vendor payouts and clear reconciliation.',
      icon: <ShieldCheck className="w-7 h-7 text-[#E31837]" />,
      badge: 'Merchant Friendly'
    },
    {
      title: 'Nationwide Trunk Express',
      desc: 'Daily logistics routes connecting Kathmandu hub to Pokhara, Biratnagar, Chitwan, Butwal, and 90+ Nepal destinations.',
      icon: <MapPin className="w-7 h-7 text-[#E31837]" />,
      badge: 'Highway Network'
    },
    {
      title: 'Document & Parcel Dispatch',
      desc: 'Confidential handling, tamper-evident security bags, and proof-of-delivery for corporate and individual shipments.',
      icon: <CheckCircle2 className="w-7 h-7 text-[#E31837]" />,
      badge: 'Secure'
    },
    {
      title: 'Bulk Cargo & Warehousing',
      desc: 'Secure central hub sorting, transit warehousing, and bulk commercial freight handling for commercial distributors.',
      icon: <Building2 className="w-7 h-7 text-[#E31837]" />,
      badge: 'Commercial'
    },
  ];

  const steps = [
    { num: '01', title: 'Book or Request Pickup', desc: 'Enter order details or book instant pickup via merchant portal.' },
    { num: '02', title: 'Hub Sorting & Inbound', desc: 'Barcoded, weighed, and securely bagged at Kathmandu sorting hub.' },
    { num: '03', title: 'Highway & Valley Transit', desc: 'Dispatched via dedicated logistics line or local city route.' },
    { num: '04', title: 'Doorstep Delivery & COD', desc: 'Delivered to customer doorstep with digital proof of delivery.' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans text-slate-800">
      <PublicNav />

      {/* Hero Banner */}
      <section className="relative bg-[#002B49] text-white py-12 sm:py-20 lg:py-28 overflow-hidden">
        {/* Subtle Background Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#002B49] via-[#002035] to-[#001422] opacity-95 pointer-events-none" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            
            {/* Left Hero Headline */}
            <div className="lg:col-span-7 space-y-4 sm:space-y-6 text-center lg:text-left">
              <span className="inline-flex items-center gap-2 bg-[#E31837] text-white px-3.5 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-widest shadow-sm">
                <Sparkles className="w-3.5 h-3.5" /> Nepal Premier Courier & Logistics
              </span>
              
              <h1 className="text-2xl sm:text-4xl lg:text-6xl font-extrabold text-white leading-tight tracking-tight">
                Fast & Reliable Delivery Across Nepal
              </h1>
              
              <p className="text-sm sm:text-base lg:text-lg text-slate-200 leading-relaxed max-w-2xl mx-auto lg:mx-0 font-normal">
                Send parcels, documents, and business shipments with confidence. KDM Express connects Kathmandu Valley and nationwide districts with speed, safety, and guaranteed Cash on Delivery.
              </p>
              
              <div className="flex flex-col sm:flex-row justify-center lg:justify-start gap-3 sm:gap-4 pt-2">
                <a
                  href="#track-card"
                  className="bg-[#E31837] hover:bg-[#c1122d] text-white font-bold px-7 py-3.5 rounded-xl shadow-lg hover:shadow-xl transition-all uppercase tracking-wide text-xs sm:text-sm flex items-center justify-center gap-2"
                >
                  <Search className="w-4 h-4" />
                  <span>Track Your Shipment</span>
                </a>
                <Link
                  to="/contact"
                  className="bg-white/10 hover:bg-white/20 border border-white/30 text-white font-bold px-6 py-3.5 rounded-xl transition-all uppercase tracking-wide text-xs sm:text-sm flex items-center justify-center gap-2"
                >
                  <PhoneCall className="w-4 h-4" />
                  <span>Book Delivery</span>
                </Link>
              </div>
            </div>

            {/* Right Quick Shipment Tracker Card */}
            <div id="track-card" className="lg:col-span-5 w-full">
              <div className="bg-white rounded-2xl shadow-2xl p-5 sm:p-8 border-t-8 border-[#E31837] text-slate-900">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-[#E31837] shrink-0">
                    <Search className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-extrabold text-[#002B49]">Quick Shipment Tracker</h3>
                    <p className="text-xs text-slate-500">Live parcel status across Nepal</p>
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-slate-600 mb-5 leading-relaxed">
                  Enter your tracking code or invoice number below for instant live status updates:
                </p>

                <form onSubmit={handleTrack} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#002B49] mb-1.5">
                      Tracking Code / Invoice ID
                    </label>
                    <input
                      type="text"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      placeholder="e.g. SI2MXEL or KDM-1656"
                      required
                      className="w-full px-4 py-3.5 text-slate-900 border-2 border-slate-200 rounded-xl focus:border-[#E31837] focus:ring-0 outline-none font-semibold text-sm transition-colors"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-[#002B49] hover:bg-[#001f35] text-white font-extrabold py-3.5 rounded-xl uppercase tracking-wider text-xs sm:text-sm shadow hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Search className="w-4 h-4 text-[#E31837]" />
                    <span>Track Package Now</span>
                  </button>
                </form>

                <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span>No login required</span>
                  <Link to="/pricing" className="text-[#E31837] font-bold hover:underline">
                    View Rate Calculator &rarr;
                  </Link>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-14 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-16">
            <span className="text-xs font-extrabold text-[#E31837] uppercase tracking-widest">Our Core Offerings</span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-[#002B49] mt-2 mb-3">
              Courier & Logistics Services in Nepal
            </h2>
            <p className="text-slate-600 text-xs sm:text-base leading-relaxed">
              Tailored delivery solutions designed for individuals, e-commerce sellers, and corporate enterprises across Nepal.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {services.map((s, idx) => (
              <div
                key={idx}
                className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1.5 flex flex-col justify-between border-b-4 hover:border-b-[#E31837]"
              >
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-red-50 rounded-xl">{s.icon}</div>
                    <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full uppercase tracking-wider">
                      {s.badge}
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-[#002B49] mb-2">{s.title}</h3>
                  <p className="text-slate-600 text-xs sm:text-sm leading-relaxed mb-5">{s.desc}</p>
                </div>
                <Link
                  to="/services"
                  className="text-xs font-bold text-[#E31837] hover:text-[#c1122d] flex items-center gap-1.5 mt-auto uppercase tracking-wide group"
                >
                  <span>Learn More</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-14 sm:py-20 bg-slate-50 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-16">
            <span className="text-xs font-extrabold text-[#E31837] uppercase tracking-widest">Seamless Flow</span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-[#002B49] mt-2 mb-3">
              How KDM Express Works
            </h2>
            <p className="text-slate-600 text-xs sm:text-sm">
              From doorstep pickup to final delivery confirmation in 4 simple steps.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {steps.map((st, i) => (
              <div key={i} className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-200 text-center relative">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#E31837] text-white text-lg sm:text-xl font-extrabold flex items-center justify-center mx-auto mb-4 shadow-md">
                  {st.num}
                </div>
                <h3 className="text-sm sm:text-base font-bold text-[#002B49] mb-1.5">{st.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{st.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Nepal Coverage Metrics */}
      <section className="py-12 sm:py-16 bg-[#002B49] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 text-center">
            <div className="p-3 sm:p-4">
              <div className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-1.5">94+</div>
              <div className="text-[11px] sm:text-xs text-slate-300 font-semibold uppercase tracking-wider">Outside Valley Cities</div>
            </div>
            <div className="p-3 sm:p-4">
              <div className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-[#E31837] mb-1.5">24 - 48h</div>
              <div className="text-[11px] sm:text-xs text-slate-300 font-semibold uppercase tracking-wider">Highway Trunk Transit</div>
            </div>
            <div className="p-3 sm:p-4">
              <div className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-1.5">99.8%</div>
              <div className="text-[11px] sm:text-xs text-slate-300 font-semibold uppercase tracking-wider">Package Safety Rate</div>
            </div>
            <div className="p-3 sm:p-4">
              <div className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-[#E31837] mb-1.5">Live</div>
              <div className="text-[11px] sm:text-xs text-slate-300 font-semibold uppercase tracking-wider">Real-Time GPS Tracking</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-gradient-to-br from-[#002B49] to-[#001f35] rounded-3xl p-6 sm:p-12 text-white shadow-2xl space-y-5">
            <h2 className="text-xl sm:text-3xl lg:text-4xl font-extrabold">Ready to Ship with KDM Express?</h2>
            <p className="text-slate-300 text-xs sm:text-sm lg:text-base max-w-2xl mx-auto leading-relaxed">
              Join hundreds of online vendors and merchants across Nepal trusting KDM Express for reliable delivery, prompt COD reconciliation, and unmatched customer support.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 pt-3">
              <Link
                to="/login"
                className="bg-[#E31837] hover:bg-[#c1122d] text-white font-extrabold px-7 py-3.5 rounded-xl shadow hover:shadow-xl transition-all uppercase tracking-wider text-xs sm:text-sm"
              >
                Register as Merchant
              </Link>
              <Link
                to="/branches"
                className="bg-white/15 hover:bg-white/25 border border-white/30 text-white font-bold px-6 py-3.5 rounded-xl transition-all uppercase tracking-wider text-xs sm:text-sm"
              >
                Explore Nepal Branches
              </Link>
            </div>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
};

export default Home;
