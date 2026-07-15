import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Rocket, MapPin, Receipt, BarChart3, Bike, ShieldCheck } from 'lucide-react';
import PublicNav from '../../components/PublicNav';
import PublicFooter from '../../components/PublicFooter';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

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
    <div className="min-h-screen flex flex-col bg-white">
      <PublicNav active="/" />

      {/* Hero */}
      <section className="relative overflow-hidden bg-white py-24 sm:py-32">
        <div className="relative max-w-5xl mx-auto px-6 lg:px-8 text-center z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-50 border border-slate-200 text-slate-700 text-xs font-medium uppercase tracking-wider mb-8">
            <span className="relative flex h-2 w-2">
              <span className="relative inline-flex rounded-full h-2 w-2 bg-slate-900"></span>
            </span>
            Nepal's #1 Logistics SaaS Platform
          </div>
          
          <h1 className="text-4xl sm:text-6xl font-bold text-slate-900 tracking-tight mb-6 leading-tight">
            Fast, Reliable <br className="hidden sm:block"/>
            <span className="text-slate-500">Delivery Solutions</span>
          </h1>
          
          <p className="max-w-2xl mx-auto text-lg text-slate-600 mb-10 leading-relaxed">
            Seamless delivery management for e-commerce vendors across Nepal. From order creation to cash reconciliation — all in one place.
          </p>

          <form onSubmit={handleTrack} className="max-w-xl mx-auto bg-white p-2 rounded-xl shadow-sm border border-slate-200 flex flex-col sm:flex-row gap-2">
            <div className="flex-1 flex items-center pl-4">
              <Search className="w-5 h-5 text-slate-400 shrink-0" />
              <input
                type="text" 
                value={code} 
                onChange={e => setCode(e.target.value)}
                placeholder="Enter tracking code (e.g. LOG-2026-ABC12)"
                className="w-full bg-transparent border-none focus:ring-0 text-slate-900 placeholder:text-slate-400 px-3 py-2 outline-none"
              />
            </div>
            <Button type="submit" variant="primary" className="py-2.5 px-6 shrink-0 h-auto">
              Track Package
            </Button>
          </form>
          <p className="text-xs font-medium text-slate-400 mt-4">No account needed · Instant tracking</p>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-slate-50 border-y border-slate-100 py-16">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 divide-x divide-slate-200">
            {stats.map(s => (
              <div key={s.label} className="text-center px-4">
                <div className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">{s.value}</div>
                <div className="text-sm font-medium text-slate-500">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 bg-white flex-1">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16 max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight mb-4">Everything Your Business Needs</h2>
            <p className="text-lg text-slate-500">A complete logistics operating system — from first mile to last mile.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map(f => (
              <div key={f.title} className="bg-white p-8 rounded-xl border border-slate-200">
                <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-100 text-slate-900 flex items-center justify-center mb-6">
                  {React.cloneElement(f.icon, { className: 'w-5 h-5' })}
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">{f.title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-slate-900 py-20 px-6 text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-white mb-6">Ready to scale your deliveries?</h2>
          <p className="text-slate-400 text-lg mb-10">Join 150+ vendors already using ktmexpress to power their last-mile operations.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/login">
              <Button variant="secondary" className="px-8 py-2.5 h-auto text-base">Get Started Free</Button>
            </Link>
            <Link to="/contact">
              <Button variant="primary" className="px-8 py-2.5 h-auto text-base border-slate-700 bg-slate-800 hover:bg-slate-700">Talk to Sales</Button>
            </Link>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
};

export default Home;
