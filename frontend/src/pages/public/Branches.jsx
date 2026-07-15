import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Phone, Mail, Map } from 'lucide-react';
import PublicNav from '../../components/PublicNav';
import PublicFooter from '../../components/PublicFooter';
import { Button } from '../../components/ui/Button';

const branches = [
  {
    name: 'Kathmandu Central Hub',
    type: 'Main Hub',
    address: 'Kuleshwor, Kathmandu',
    phone: '+977-9861252198',
    email: 'hub.ktm@ktmexpress.com',
    mapLink: 'https://maps.google.com/?q=Kuleshwor,+Kathmandu,+Nepal',
    features: ['Inbound Sorting', 'Dispatch Center', 'Vendor Drop-off', 'Customer Service'],
  },
  {
    name: 'Lalitpur Branch',
    type: 'Regional Center',
    address: 'Jawalakhel, Lalitpur',
    phone: '+977-9800000000',
    email: 'hub.lalitpur@ktmexpress.com',
    mapLink: 'https://maps.google.com/?q=Jawalakhel,+Lalitpur,+Nepal',
    features: ['Local Dispatch', 'Vendor Drop-off'],
  },
  {
    name: 'Bhaktapur Hub',
    type: 'Regional Center',
    address: 'Suryabinayak, Bhaktapur',
    phone: '+977-9800000001',
    email: 'hub.bkt@ktmexpress.com',
    mapLink: 'https://maps.google.com/?q=Suryabinayak,+Bhaktapur,+Nepal',
    features: ['Local Dispatch', 'Vendor Drop-off'],
  }
];

const Branches = () => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 relative overflow-hidden">
      <PublicNav active="/branches" />

      <main className="flex-1 px-6 py-20 relative z-10 flex flex-col items-center">
        <div className="text-center mb-16">
          <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 tracking-tight mb-4">Our Branches</h1>
          <p className="text-slate-500 text-lg max-w-2xl mx-auto leading-relaxed">Find a ktmexpress drop-off location or logistics hub near you.</p>
        </div>

        <div className="w-full max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {branches.map(b => (
            <div key={b.name} className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm hover:shadow-md transition-shadow">
              <div className="mb-6">
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">{b.type}</div>
                <h3 className="text-xl font-bold text-slate-900">{b.name}</h3>
              </div>
              
              <div className="space-y-4 mb-8 text-sm text-slate-600">
                <div className="flex gap-3 items-start">
                  <MapPin className="w-4 h-4 mt-0.5 text-slate-400 shrink-0" />
                  <span>{b.address}</span>
                </div>
                <div className="flex gap-3 items-start">
                  <Phone className="w-4 h-4 mt-0.5 text-slate-400 shrink-0" />
                  <span>{b.phone}</span>
                </div>
                <div className="flex gap-3 items-start">
                  <Mail className="w-4 h-4 mt-0.5 text-slate-400 shrink-0" />
                  <span>{b.email}</span>
                </div>
              </div>

              <div className="mb-8">
                <div className="flex flex-wrap gap-2">
                  {b.features.map(f => (
                    <span key={f} className="bg-slate-50 border border-slate-200 text-slate-600 text-xs font-medium px-2.5 py-1 rounded-md">
                      {f}
                    </span>
                  ))}
                </div>
              </div>

              <a href={b.mapLink} target="_blank" rel="noopener noreferrer" className="block">
                <Button variant="secondary" className="w-full flex justify-center items-center gap-2">
                  <Map className="w-4 h-4" />
                  View on Google Maps
                </Button>
              </a>
            </div>
          ))}
        </div>
      </main>

      <PublicFooter />
    </div>
  );
};

export default Branches;
