import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import PublicNav from '../../components/PublicNav';
import PublicFooter from '../../components/PublicFooter';
import { Button } from '../../components/ui/Button';

const Home = () => {
  const [code, setCode] = useState('');
  const navigate = useNavigate();

  const handleTrack = (e) => {
    e.preventDefault();
    if (code.trim()) navigate(`/track?code=${encodeURIComponent(code.trim())}`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <PublicNav />

      {/* Main Customer Tracking Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-20 sm:py-32 relative overflow-hidden bg-white">
        <div className="relative max-w-4xl mx-auto text-center z-10 w-full">
          <h1 className="text-4xl sm:text-6xl font-bold text-slate-900 tracking-tight mb-6 leading-tight">
            Fast, Reliable <br className="hidden sm:block"/>
            <span className="text-slate-500">Delivery Solutions</span>
          </h1>
          
          <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-600 mb-10 leading-relaxed">
            Seamless delivery management for e-commerce vendors across Nepal. From order creation to cash reconciliation — all in one place.
          </p>

          <form onSubmit={handleTrack} className="max-w-xl mx-auto bg-white p-2 rounded-2xl shadow-lg border border-slate-200 flex flex-col sm:flex-row gap-2">
            <div className="flex-1 flex items-center pl-4">
              <Search className="w-5 h-5 text-slate-400 shrink-0" />
              <input
                type="text" 
                value={code} 
                onChange={e => setCode(e.target.value)}
                placeholder="Enter tracking code (e.g. LOG-2026-ABC12)"
                className="w-full bg-transparent border-none focus:ring-0 text-slate-900 placeholder:text-slate-400 px-3 py-2.5 outline-none text-sm sm:text-base font-medium"
              />
            </div>
            <Button type="submit" variant="primary" className="py-3 px-7 shrink-0 h-auto font-bold rounded-xl">
              Track Package
            </Button>
          </form>
          <p className="text-xs font-medium text-slate-400 mt-4">No account needed · Instant tracking</p>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
};

export default Home;
