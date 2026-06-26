import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Package, Search, Rocket, MapPin, Receipt, BarChart3, Bike, ShieldCheck, ArrowRight } from 'lucide-react';

const PublicNav = ({ active }) => (
  <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-slate-200 shadow-sm">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
      <Link to="/" className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-brand-600 text-white flex items-center justify-center">
          <Package className="w-5 h-5" />
        </div>
        <span className="font-bold text-xl tracking-tight text-slate-900">ktmexpress</span>
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
      {/* Mobile Nav Button */}
      <div className="md:hidden">
        <Link to="/login" className="btn-primary btn-sm">Login</Link>
      </div>
    </div>
  </header>
);

const PublicFooter = () => (
  <footer className="bg-slate-950 text-slate-400 py-12 px-6 text-center border-t border-slate-800">
    <div className="max-w-7xl mx-auto flex flex-col items-center">
      <div className="flex items-center gap-2 mb-4">
        <Package className="w-5 h-5 text-brand-500" />
        <span className="font-bold text-slate-200">ktmexpress Logistics</span>
      </div>
      <p className="text-sm">© {new Date().getFullYear()} ktmexpress Logistics SaaS. All rights reserved.</p>
    </div>
  </footer>
);

const Home = () => {
  const [code, setCode] = useState('');
  const navigate = useNavigate();

  const handleTrack = (e) => {
    e.preventDefault();
    if (code.trim()) navigate(`/track?code=${code.trim()}`);
  };

  const features = [
    { icon: <Rocket className="w-6 h-6" />, title: 'Same-Day Dispatch', desc: 'Lightning-fast pickup within Kathmandu valley. Your packages are always moving.' },
    { icon: <MapPin className="w-6 h-6" />, title: 'Real-Time Tracking', desc: 'Live status updates and rider contact info. Your customers always know where their package is.' },
    { icon: <Receipt className="w-6 h-6" />, title: 'COD Management', desc: 'Seamless cash-on-delivery collection, reconciliation, and vendor payouts — all automated.' },
    { icon: <BarChart3 className="w-6 h-6" />, title: 'Vendor Dashboard', desc: 'Full-featured vendor portal with bulk CSV upload, analytics, finance, and order history.' },
    { icon: <Bike className="w-6 h-6" />, title: 'Rider Management', desc: 'Track your fleet in real-time. Assign pickups and deliveries with one click.' },
    { icon: <ShieldCheck className="w-6 h-6" />, title: 'Role-Based Security', desc: 'Admin, Vendor, Dispatcher, and Rider roles — each with precisely scoped access.' },
  ];

  const stats = [
    { value: '15,000+', label: 'Deliveries Monthly' },
    { value: '99.2%', label: 'Delivery Success Rate' },
    { value: '150+', label: 'Vendor Partners' },
    { value: '4.9★', label: 'Vendor Rating' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <PublicNav active="/" />

      {/* Hero */}
      <section className="relative overflow-hidden bg-white py-24 sm:py-32">
        {/* Background Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-tr from-brand-100 to-indigo-50 blur-[100px] rounded-full pointer-events-none opacity-50" />
        
        <div className="relative max-w-7xl mx-auto px-6 lg:px-8 text-center z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-50 border border-brand-200 text-brand-700 text-xs font-bold uppercase tracking-wider mb-8 shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-500"></span>
            </span>
            Nepal's #1 Logistics SaaS Platform
          </div>
          
          <h1 className="text-4xl sm:text-6xl font-extrabold text-slate-900 tracking-tight mb-6 leading-tight">
            Fast, Reliable <br className="hidden sm:block"/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-indigo-600">Delivery Solutions</span>
          </h1>
          
          <p className="max-w-2xl mx-auto text-lg sm:text-xl text-slate-500 mb-10 leading-relaxed">
            Seamless delivery management for e-commerce vendors across Nepal. From order creation to cash reconciliation — all in one place.
          </p>

          <form onSubmit={handleTrack} className="max-w-2xl mx-auto bg-white p-2 rounded-2xl shadow-xl border border-slate-200 flex flex-col sm:flex-row gap-2">
            <div className="flex-1 flex items-center pl-4">
              <Search className="w-5 h-5 text-slate-400 shrink-0" />
              <input
                type="text" 
                value={code} 
                onChange={e => setCode(e.target.value)}
                placeholder="Enter tracking code (e.g. LOG-2026-ABC12)"
                className="w-full bg-transparent border-none focus:ring-0 text-slate-900 placeholder:text-slate-400 px-3 py-3 outline-none"
              />
            </div>
            <button type="submit" className="btn-primary py-3 px-8 rounded-xl shrink-0 h-12 text-base shadow-brand-500/20 shadow-lg">
              Track Package
            </button>
          </form>
          <p className="text-xs font-medium text-slate-400 mt-4">No account needed · Instant tracking</p>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-slate-900 py-16">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 divide-x divide-slate-800">
            {stats.map(s => (
              <div key={s.label} className="text-center px-4">
                <div className="text-3xl md:text-4xl font-extrabold text-white mb-2">{s.value}</div>
                <div className="text-sm font-semibold text-brand-400">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 bg-slate-50 flex-1">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16 max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight mb-4">Everything Your Business Needs</h2>
            <p className="text-lg text-slate-500">A complete logistics operating system — from first mile to last mile.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map(f => (
              <div key={f.title} className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200/60 hover:shadow-md transition-shadow group">
                <div className="w-12 h-12 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  {f.icon}
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{f.title}</h3>
                <p className="text-slate-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden bg-brand-600 py-20 px-6 text-center">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        <div className="relative max-w-3xl mx-auto z-10">
          <h2 className="text-3xl font-bold text-white mb-6">Ready to scale your deliveries?</h2>
          <p className="text-brand-100 text-lg mb-10">Join 150+ vendors already using ktmexpress to power their last-mile operations.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/login" className="bg-white text-brand-600 font-bold px-8 py-3.5 rounded-lg hover:bg-brand-50 transition-colors shadow-lg">Get Started Free</Link>
            <Link to="/contact" className="bg-brand-700/50 border border-brand-500 text-white font-bold px-8 py-3.5 rounded-lg hover:bg-brand-700 transition-colors">Talk to Sales</Link>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
};

export default Home;
