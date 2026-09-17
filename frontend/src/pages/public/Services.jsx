import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, Truck, ShieldCheck, MapPin, FileCheck, Building2, CheckCircle2, ArrowRight, PhoneCall, HelpCircle } from 'lucide-react';
import PublicNav from '../../components/PublicNav';
import PublicFooter from '../../components/PublicFooter';

const Services = () => {
  const serviceList = [
    {
      id: 'same-day',
      title: 'Same-Day Express Delivery',
      tag: 'Kathmandu Valley',
      icon: <Clock className="w-8 h-8 text-[#E31837]" />,
      shortDesc: 'Guaranteed rapid delivery within Kathmandu, Lalitpur, and Bhaktapur inside the same business day.',
      features: [
        'Pickup before 12:00 PM delivered by evening',
        'Direct rider assigned to urgent parcels',
        'Real-time status updates via SMS & portal',
        'Perfect for e-commerce rush orders & food/essentials'
      ]
    },
    {
      id: 'door-to-door',
      title: 'Door-to-Door Courier Delivery',
      tag: 'Nationwide Nepal',
      icon: <Truck className="w-8 h-8 text-[#E31837]" />,
      shortDesc: 'End-to-end delivery right from your shop, warehouse, or home directly to the recipient doorstep.',
      features: [
        'Free scheduled doorstep pickup for regular vendors',
        'Direct recipient verification and contact prior to delivery',
        'Multiple re-attempt protocols in case receiver is unreachable',
        'Tamper-evident packaging bags provided'
      ]
    },
    {
      id: 'cod-solutions',
      title: 'E-Commerce COD Management',
      tag: 'Merchant Solution',
      icon: <ShieldCheck className="w-8 h-8 text-[#E31837]" />,
      shortDesc: 'Complete Cash-on-Delivery collections with zero friction and guaranteed automated vendor disbursements.',
      features: [
        'Real-time COD collection tracking per order',
        'Weekly and bi-weekly automated bank remittances',
        'Transparent ledger with zero hidden deduction fees',
        'Integrated vendor portal to manage orders and returns'
      ]
    },
    {
      id: 'highway-trunk',
      title: 'Nationwide Highway Express',
      tag: 'Inter-City Routes',
      icon: <MapPin className="w-8 h-8 text-[#E31837]" />,
      shortDesc: 'Daily highway transit connecting Kathmandu sorting hub to Pokhara, Chitwan, Butwal, Biratnagar, and beyond.',
      features: [
        'Daily dedicated express vehicles running every evening',
        'Connecting over 90+ districts and major towns',
        'Inter-branch sorting with barcoded transit tracking',
        'Cost-effective per-kg rates for heavier consignments'
      ]
    },
    {
      id: 'document-dispatch',
      title: 'Confidential Document Courier',
      tag: 'Corporate & Legal',
      icon: <FileCheck className="w-8 h-8 text-[#E31837]" />,
      shortDesc: 'Secure handling of sensitive corporate files, bank instruments, contracts, and confidential parcels.',
      features: [
        'Special tamper-proof security envelope packing',
        'Mandatory signature and digital proof of delivery',
        'Priority handling through our express logistics chain',
        'Immediate delivery confirmation to sender'
      ]
    },
    {
      id: 'bulk-freight',
      title: 'Bulk Cargo & Warehousing',
      tag: 'B2B & Distribution',
      icon: <Building2 className="w-8 h-8 text-[#E31837]" />,
      shortDesc: 'Comprehensive logistics for wholesale distributors, factory consignments, and e-commerce inventory holding.',
      features: [
        'Central Kathmandu hub storage and sorting facility',
        'Palletized cargo and high-volume freight solutions',
        'Inventory fulfillment and pick-pack services',
        'Customized corporate SLA and tailored billing'
      ]
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans text-slate-800">
      <PublicNav />

      {/* Header Banner */}
      <section className="relative bg-[#002B49] text-white py-16 lg:py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[#002B49] via-[#002035] to-[#001422] opacity-95 pointer-events-none" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-10 text-center">
          <span className="inline-flex items-center gap-1.5 bg-[#E31837] text-white px-3.5 py-1 rounded-full text-xs font-extrabold uppercase tracking-widest mb-4">
            Our Solutions
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight mb-4">
            Comprehensive Courier & Logistics Services
          </h1>
          <p className="text-base sm:text-lg text-slate-200 max-w-2xl mx-auto">
            From same-day valley express to inter-city freight and e-commerce COD, KDM Express delivers with unmatched speed, transparency, and care.
          </p>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {serviceList.map((srv) => (
              <div
                key={srv.id}
                className="bg-slate-50 rounded-2xl border border-slate-200 p-8 flex flex-col justify-between hover:shadow-lg transition-all duration-200 group"
              >
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <div className="p-3.5 bg-white rounded-xl shadow-sm border border-slate-100 group-hover:bg-red-50 transition-colors">
                      {srv.icon}
                    </div>
                    <span className="text-xs font-bold text-[#E31837] bg-red-100/60 px-3 py-1 rounded-full uppercase tracking-wider">
                      {srv.tag}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-[#002B49] mb-3 group-hover:text-[#E31837] transition-colors">
                    {srv.title}
                  </h3>

                  <p className="text-slate-600 text-sm mb-6 leading-relaxed">
                    {srv.shortDesc}
                  </p>

                  <div className="border-t border-slate-200/80 pt-5 mb-6">
                    <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                      Key Highlights
                    </div>
                    <ul className="space-y-2.5">
                      {srv.features.map((feat, idx) => (
                        <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700">
                          <CheckCircle2 className="w-4 h-4 text-[#E31837] shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="pt-2">
                  <Link
                    to="/contact"
                    className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#002B49] group-hover:text-[#E31837] transition-colors"
                  >
                    <span>Inquire About This Service</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works 4-step workflow */}
      <section className="py-16 bg-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="text-[#E31837] font-bold text-xs uppercase tracking-widest block mb-2">Simple Process</span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-[#002B49]">How Shipping Works With Us</h2>
            <p className="text-slate-600 mt-2 text-sm sm:text-base">Seamless dispatch from your store to your customer's hands.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { num: '01', title: 'Order Booking', desc: 'Create delivery orders via our vendor portal or contact our dispatch team.' },
              { num: '02', title: 'Pickup & Sorting', desc: 'Our rider picks up items and transfers them to our Kathmandu central hub.' },
              { num: '03', title: 'Express Transit', desc: 'Sorted into local valley routes or highway line-haul night express.' },
              { num: '04', title: 'Delivery & Payment', desc: 'Delivered to recipient with COD collected and remitted to your bank.' }
            ].map((st, i) => (
              <div key={i} className="bg-white p-6 rounded-xl border border-slate-200 text-center relative">
                <div className="w-12 h-12 rounded-full bg-[#002B49] text-white font-extrabold text-base flex items-center justify-center mx-auto mb-4">
                  {st.num}
                </div>
                <h3 className="font-bold text-[#002B49] text-base mb-2">{st.title}</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{st.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Box */}
      <section className="bg-[#002B49] text-white py-14">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <h2 className="text-2xl sm:text-3xl font-extrabold">Need Custom Logistics for Your Business?</h2>
          <p className="text-slate-300 text-sm sm:text-base max-w-2xl mx-auto">
            Whether you ship 10 parcels a week or 500 packages a day, our team creates tailored delivery routes and volume pricing to boost your profitability.
          </p>
          <div className="flex flex-wrap justify-center gap-4 pt-2">
            <Link
              to="/contact"
              className="bg-[#E31837] hover:bg-[#c1122d] text-white font-bold px-8 py-3.5 rounded-lg text-sm transition-colors uppercase tracking-wider"
            >
              Get Custom Quote
            </Link>
            <a
              href="https://wa.me/9779801081469"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold px-8 py-3.5 rounded-lg text-sm transition-colors uppercase tracking-wider"
            >
              Talk on WhatsApp
            </a>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
};

export default Services;
