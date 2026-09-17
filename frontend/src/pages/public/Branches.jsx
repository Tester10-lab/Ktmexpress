import React, { useState } from 'react';
import { MapPin, Phone, Mail, Map, Search, Building2, CheckCircle2, Clock } from 'lucide-react';
import PublicNav from '../../components/PublicNav';
import PublicFooter from '../../components/PublicFooter';

const branchesData = [
  {
    name: 'Kathmandu Central Sorting Hub',
    region: 'Kathmandu Valley',
    type: 'Central Headquarters & Sorting Hub',
    address: 'Kuleshwor, Kathmandu, Bagmati Province',
    phone: '+977 980-1081469',
    email: 'hub.ktm@kdmexpress.com',
    hours: 'Mon - Sun: 7:00 AM - 9:00 PM',
    mapLink: 'https://maps.google.com/?q=Kuleshwor,+Kathmandu,+Nepal',
    features: ['Central Sorting', 'Highway Dispatch', 'Merchant Drop-off', 'Cash Counter', 'Support Center'],
  },
  {
    name: 'Lalitpur Branch Office',
    region: 'Kathmandu Valley',
    type: 'Regional Dispatch Branch',
    address: 'Jawalakhel (Near Zoo Road), Lalitpur',
    phone: '+977 980-1081469',
    email: 'hub.lalitpur@kdmexpress.com',
    hours: 'Mon - Sun: 8:00 AM - 8:00 PM',
    mapLink: 'https://maps.google.com/?q=Jawalakhel,+Lalitpur,+Nepal',
    features: ['Local Doorstep Dispatch', 'Vendor Drop-off', 'COD Collection'],
  },
  {
    name: 'Bhaktapur Express Center',
    region: 'Kathmandu Valley',
    type: 'Regional Dispatch Branch',
    address: 'Suryabinayak, Bhaktapur',
    phone: '+977 980-1081469',
    email: 'hub.bhaktapur@kdmexpress.com',
    hours: 'Mon - Sun: 8:00 AM - 8:00 PM',
    mapLink: 'https://maps.google.com/?q=Suryabinayak,+Bhaktapur,+Nepal',
    features: ['Local Doorstep Dispatch', 'Drop-off Point', 'COD Collection'],
  },
  {
    name: 'Pokhara Regional Hub',
    region: 'Gandaki & Lumbini',
    type: 'Gandaki Province Hub',
    address: 'Prithvi Chowk / New Road, Pokhara',
    phone: '+977 980-1081469',
    email: 'pokhara@kdmexpress.com',
    hours: 'Mon - Sun: 8:00 AM - 7:30 PM',
    mapLink: 'https://maps.google.com/?q=Prithvi+Chowk,+Pokhara,+Nepal',
    features: ['Province Hub', 'Highway Cargo Unloading', 'Lakeside Express', 'Same-Day City Dispatch'],
  },
  {
    name: 'Chitwan Transit Hub',
    region: 'Gandaki & Lumbini',
    type: 'Central Terai Transit Center',
    address: 'Narayangarh / Bharatpur-10, Chitwan',
    phone: '+977 980-1081469',
    email: 'chitwan@kdmexpress.com',
    hours: 'Mon - Sun: 8:00 AM - 8:00 PM',
    mapLink: 'https://maps.google.com/?q=Narayangarh,+Chitwan,+Nepal',
    features: ['Cross-Dock Transit', 'Drop-off Point', 'Doorstep Delivery', 'COD Collection'],
  },
  {
    name: 'Butwal Logistics Hub',
    region: 'Gandaki & Lumbini',
    type: 'Lumbini Province Hub',
    address: 'Traffic Chowk, Butwal',
    phone: '+977 980-1081469',
    email: 'butwal@kdmexpress.com',
    hours: 'Mon - Sun: 8:00 AM - 7:30 PM',
    mapLink: 'https://maps.google.com/?q=Traffic+Chowk,+Butwal,+Nepal',
    features: ['Lumbini Gateway', 'Bhairahawa Feeder Line', 'Doorstep Dispatch', 'COD Remittance'],
  },
  {
    name: 'Biratnagar Regional Hub',
    region: 'Koshi & Eastern',
    type: 'Koshi Province Hub',
    address: 'Main Road, Biratnagar-7',
    phone: '+977 980-1081469',
    email: 'biratnagar@kdmexpress.com',
    hours: 'Mon - Sun: 8:00 AM - 7:30 PM',
    mapLink: 'https://maps.google.com/?q=Biratnagar,+Nepal',
    features: ['Eastern Province Hub', 'Cross-Border Freight', 'Local Doorstep Delivery', 'Merchant Center'],
  },
  {
    name: 'Dharan Branch Office',
    region: 'Koshi & Eastern',
    type: 'Eastern Sub-Hub',
    address: 'Bhanu Chowk, Dharan',
    phone: '+977 980-1081469',
    email: 'dharan@kdmexpress.com',
    hours: 'Mon - Sun: 8:30 AM - 7:00 PM',
    mapLink: 'https://maps.google.com/?q=Bhanu+Chowk,+Dharan,+Nepal',
    features: ['Hill Highway Line', 'Local Parcel Dispatch', 'COD Handling'],
  },
  {
    name: 'Nepalgunj Gateway Center',
    region: 'Western Nepal',
    type: 'Western Nepal Gateway',
    address: 'Surkhet Road, Nepalgunj-2',
    phone: '+977 980-1081469',
    email: 'nepalgunj@kdmexpress.com',
    hours: 'Mon - Sun: 8:30 AM - 7:00 PM',
    mapLink: 'https://maps.google.com/?q=Surkhet+Road,+Nepalgunj,+Nepal',
    features: ['Mid-Western Logistics', 'Karnali Feeder Network', 'Doorstep Delivery', 'Vendor Drop-off'],
  },
];

const regions = ['All Branches', 'Kathmandu Valley', 'Gandaki & Lumbini', 'Koshi & Eastern', 'Western Nepal'];

const Branches = () => {
  const [selectedRegion, setSelectedRegion] = useState('All Branches');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredBranches = branchesData.filter((b) => {
    const matchesRegion = selectedRegion === 'All Branches' || b.region === selectedRegion;
    const matchesSearch =
      b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.region.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesRegion && matchesSearch;
  });

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans text-slate-800">
      <PublicNav />

      {/* Header Banner */}
      <section className="relative bg-[#002B49] text-white py-12 sm:py-16 lg:py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[#002B49] via-[#002035] to-[#001422] opacity-95 pointer-events-none" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-10 text-center">
          <span className="inline-flex items-center gap-1.5 bg-[#E31837] text-white px-3.5 py-1 rounded-full text-xs font-extrabold uppercase tracking-widest mb-3">
            Our Network
          </span>
          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight mb-3">
            Nationwide Hubs & Branches
          </h1>
          <p className="text-sm sm:text-base lg:text-lg text-slate-200 max-w-2xl mx-auto">
            Locate your nearest KDM Express drop-off station, regional sorting hub, or pickup counter across Nepal.
          </p>
        </div>
      </section>

      {/* Search & Region Filter Bar */}
      <section className="py-4 sm:py-6 bg-white border-b border-slate-200 sticky top-[64px] sm:top-[80px] z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row gap-3 sm:gap-4 items-center justify-between">
          
          {/* Search Box */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search branch, city, or district..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm sm:text-base text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#002B49] focus:bg-white transition-all"
            />
          </div>

          {/* Region Tabs (scrollable on mobile) */}
          <div className="flex overflow-x-auto no-scrollbar w-full md:w-auto gap-2 pb-1 sm:pb-0 items-center">
            {regions.map((reg) => (
              <button
                key={reg}
                onClick={() => setSelectedRegion(reg)}
                className={`px-3.5 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold whitespace-nowrap transition-all shrink-0 ${
                  selectedRegion === reg
                    ? 'bg-[#002B49] text-white shadow'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {reg}
              </button>
            ))}
          </div>

        </div>
      </section>

      {/* Branches Grid */}
      <main className="flex-1 py-12 lg:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-bold text-[#002B49]">
              Showing {filteredBranches.length} {filteredBranches.length === 1 ? 'Location' : 'Locations'}
            </h2>
            <span className="text-xs text-slate-500">
              {selectedRegion !== 'All Branches' ? `Filtered by ${selectedRegion}` : 'All Regions'}
            </span>
          </div>

          {filteredBranches.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl border border-slate-200 p-8">
              <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-slate-800">No branches match your search</h3>
              <p className="text-sm text-slate-500 mt-1">Try a different keyword or reset the region filter.</p>
              <button
                onClick={() => { setSelectedRegion('All Branches'); setSearchTerm(''); }}
                className="mt-4 px-4 py-2 bg-[#002B49] text-white rounded-lg text-xs font-bold"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredBranches.map((b) => (
                <div
                  key={b.name}
                  className="bg-white rounded-2xl border border-slate-200 p-7 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    {/* Badge */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="text-[11px] font-bold text-[#E31837] bg-red-50 border border-red-100 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                        {b.type}
                      </span>
                      <span className="text-[11px] font-medium text-slate-400">
                        {b.region}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-[#002B49] mb-4">
                      {b.name}
                    </h3>

                    {/* Contact Details */}
                    <div className="space-y-3 mb-6 text-xs sm:text-sm text-slate-600">
                      <div className="flex gap-3 items-start">
                        <MapPin className="w-4 h-4 mt-0.5 text-[#E31837] shrink-0" />
                        <span>{b.address}</span>
                      </div>
                      <div className="flex gap-3 items-center">
                        <Phone className="w-4 h-4 text-[#002B49] shrink-0" />
                        <a href={`tel:${b.phone.replace(/[^0-9+]/g, '')}`} className="hover:text-[#E31837] font-medium">
                          {b.phone}
                        </a>
                      </div>
                      <div className="flex gap-3 items-center">
                        <Mail className="w-4 h-4 text-[#002B49] shrink-0" />
                        <a href={`mailto:${b.email}`} className="hover:text-[#E31837]">
                          {b.email}
                        </a>
                      </div>
                      <div className="flex gap-3 items-center text-slate-500">
                        <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                        <span>{b.hours}</span>
                      </div>
                    </div>

                    {/* Features Badges */}
                    <div className="mb-6 pt-4 border-t border-slate-100">
                      <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Available Services</div>
                      <div className="flex flex-wrap gap-1.5">
                        {b.features.map((f) => (
                          <span
                            key={f}
                            className="bg-slate-50 border border-slate-200 text-slate-600 text-[11px] font-medium px-2 py-0.5 rounded"
                          >
                            {f}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <a
                    href={b.mapLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2 bg-slate-100 hover:bg-[#002B49] hover:text-white text-[#002B49] font-bold py-2.5 px-4 rounded-lg text-xs transition-colors"
                  >
                    <Map className="w-4 h-4" />
                    <span>Open in Google Maps</span>
                  </a>
                </div>
              ))}
            </div>
          )}

        </div>
      </main>

      <PublicFooter />
    </div>
  );
};

export default Branches;
