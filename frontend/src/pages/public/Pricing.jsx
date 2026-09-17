import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Calculator, ArrowRight, Truck, Sparkles, HelpCircle, PhoneCall, ShieldCheck } from 'lucide-react';
import PublicNav from '../../components/PublicNav';
import PublicFooter from '../../components/PublicFooter';

const plans = [
  {
    name: 'Standard Merchant',
    badge: 'Pay Per Parcel',
    price: 'Rs. 0',
    sub: 'No monthly subscription fee',
    desc: 'Ideal for small online sellers, Instagram shops, and occasional shippers.',
    features: [
      'Standard Kathmandu Valley delivery (Rs. 80–100/kg)',
      'Nationwide inter-city shipping',
      'Free merchant portal access',
      'Secure Cash-on-Delivery (COD) collection',
      'Weekly automated bank payout',
      'Standard email & WhatsApp support',
    ],
    cta: 'Register as Merchant',
    ctaLink: '/login',
    highlight: false,
  },
  {
    name: 'Growth Seller',
    badge: 'Most Popular',
    price: 'Rs. 2,499',
    sub: 'per month + discounted parcel rates',
    desc: 'Designed for scaling e-commerce brands with 150+ monthly orders.',
    features: [
      'Discounted parcel rates across all routes',
      'Guaranteed daily scheduled doorstep pickup',
      'Twice-weekly express COD remittances',
      'Bulk CSV order upload & barcode label printing',
      'Priority rider assignment for rush orders',
      'Dedicated merchant relationship officer',
    ],
    cta: 'Start Growth Account',
    ctaLink: '/contact',
    highlight: true,
  },
  {
    name: 'Enterprise & B2B',
    badge: 'Custom Volume',
    price: 'Custom SLA',
    sub: 'Tailored contract pricing',
    desc: 'For high-volume retail chains, corporate distribution, and nationwide manufacturers.',
    features: [
      'Custom per-kg bulk rate agreement',
      'Dedicated pickup vehicle & scheduled line-hauls',
      'API integration for ERP / Shopify / WooCommerce',
      'Custom COD disbursement schedule (daily / weekly)',
      'Transit insurance & damage compensation',
      '24/7 dedicated support & executive SLA',
    ],
    cta: 'Contact Enterprise Sales',
    ctaLink: '/contact',
    highlight: false,
  },
];

const Pricing = () => {
  // Shipping cost calculator state
  const [destination, setDestination] = useState('ktm');
  const [weight, setWeight] = useState(1);
  const [serviceType, setServiceType] = useState('standard');

  const calculateEstimate = () => {
    let baseRate = 90;
    let perKgExtra = 40;

    if (destination === 'ktm') {
      baseRate = serviceType === 'same-day' ? 140 : 90;
      perKgExtra = 35;
    } else if (destination === 'major') {
      baseRate = 180;
      perKgExtra = 60;
    } else if (destination === 'remote') {
      baseRate = 280;
      perKgExtra = 90;
    }

    const extraWeight = Math.max(0, weight - 1);
    return Math.round(baseRate + extraWeight * perKgExtra);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans text-slate-800">
      <PublicNav />

      {/* Header Banner */}
      <section className="relative bg-[#002B49] text-white py-12 sm:py-16 lg:py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[#002B49] via-[#002035] to-[#001422] opacity-95 pointer-events-none" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-10 text-center">
          <span className="inline-flex items-center gap-1.5 bg-[#E31837] text-white px-3.5 py-1 rounded-full text-xs font-extrabold uppercase tracking-widest mb-3">
            Transparent Pricing
          </span>
          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight mb-3">
            Simple Rates. Zero Hidden Costs.
          </h1>
          <p className="text-sm sm:text-base lg:text-lg text-slate-200 max-w-2xl mx-auto">
            Affordable delivery rates tailored for individuals, growing online businesses, and high-volume corporate enterprises.
          </p>
        </div>
      </section>

      {/* Interactive Shipping Cost Calculator */}
      <section className="py-8 sm:py-12 -mt-6 sm:-mt-10 relative z-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-5 sm:p-10">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
              <div className="p-3 bg-red-50 text-[#E31837] rounded-xl shrink-0">
                <Calculator className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-[#002B49]">Instant Shipping Rate Estimator</h2>
                <p className="text-xs text-slate-500">Calculate estimated delivery charges across Nepal based on destination & weight.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6 items-end">
              {/* Destination */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Destination Region
                </label>
                <select
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="w-full px-3.5 py-2.5 sm:py-3 bg-slate-50 border border-slate-300 rounded-lg text-sm sm:text-base text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#002B49] focus:bg-white transition-all"
                >
                  <option value="ktm">Kathmandu Valley (KTM/Lalitpur/Bhaktapur)</option>
                  <option value="major">Major Highway Hubs (Pokhara, Chitwan, Butwal, Biratnagar)</option>
                  <option value="remote">Hilly & Remote Districts</option>
                </select>
              </div>

              {/* Weight */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Parcel Weight (Kg): <span className="text-[#E31837] font-extrabold">{weight} kg</span>
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="20"
                  step="0.5"
                  value={weight}
                  onChange={(e) => setWeight(parseFloat(e.target.value))}
                  className="w-full accent-[#E31837] cursor-pointer mt-2"
                />
                <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                  <span>0.5 kg</span>
                  <span>10 kg</span>
                  <span>20 kg</span>
                </div>
              </div>

              {/* Service Type */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Delivery Speed
                </label>
                <select
                  disabled={destination !== 'ktm'}
                  value={destination === 'ktm' ? serviceType : 'standard'}
                  onChange={(e) => setServiceType(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#002B49] focus:bg-white transition-all disabled:opacity-50"
                >
                  <option value="standard">Standard Next-Day / 24-48h</option>
                  {destination === 'ktm' && <option value="same-day">Express Same-Day (Within KTM)</option>}
                </select>
              </div>
            </div>

            {/* Calculated Result Card */}
            <div className="mt-8 p-5 bg-[#002B49] text-white rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <span className="text-xs uppercase text-slate-300 font-semibold tracking-wider">Estimated Shipping Cost</span>
                <div className="text-3xl font-extrabold text-white mt-0.5">
                  Rs. {calculateEstimate()}{' '}
                  <span className="text-xs text-slate-300 font-normal">NPR (inclusive of pickup & handling)</span>
                </div>
              </div>
              <Link
                to="/contact"
                className="bg-[#E31837] hover:bg-[#c1122d] text-white px-6 py-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors shadow flex items-center gap-2"
              >
                <span>Book This Dispatch</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-[#E31837] font-bold text-xs uppercase tracking-widest block mb-2">Merchant Partnerships</span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-[#002B49]">Choose the Right Plan for Your Business</h2>
            <p className="text-slate-600 mt-2 text-sm sm:text-base">Scale effortlessly with transparent accounting and regular COD remittances.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
            {plans.map((p) => (
              <div
                key={p.name}
                className={`relative bg-white rounded-2xl p-8 flex flex-col justify-between transition-all duration-200 ${
                  p.highlight
                    ? 'border-2 border-[#002B49] shadow-xl ring-4 ring-[#002B49]/5'
                    : 'border border-slate-200 shadow-sm hover:shadow-md'
                }`}
              >
                {p.badge && (
                  <div className={`absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 text-xs font-bold rounded-full uppercase tracking-wider shadow-sm ${
                    p.highlight ? 'bg-[#E31837] text-white' : 'bg-[#002B49] text-white'
                  }`}>
                    {p.badge}
                  </div>
                )}

                <div>
                  <div className="text-center mb-6 pt-2">
                    <h3 className="text-lg font-bold text-[#002B49] mb-1">{p.name}</h3>
                    <p className="text-xs text-slate-500 mb-4">{p.desc}</p>
                    <div className="text-3xl sm:text-4xl font-extrabold text-[#002B49]">{p.price}</div>
                    <div className="text-xs text-slate-500 font-medium mt-1">{p.sub}</div>
                  </div>

                  <div className="border-t border-slate-100 pt-6 mb-8">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Included Features</div>
                    <ul className="space-y-3">
                      {p.features.map((feat) => (
                        <li key={feat} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700">
                          <Check className={`w-4 h-4 mt-0.5 shrink-0 ${p.highlight ? 'text-[#E31837]' : 'text-slate-500'}`} />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <Link
                  to={p.ctaLink}
                  className={`w-full text-center py-3 px-4 rounded-lg font-bold text-xs uppercase tracking-wider transition-all block ${
                    p.highlight
                      ? 'bg-[#E31837] hover:bg-[#c1122d] text-white shadow-md hover:shadow-lg'
                      : 'bg-slate-100 hover:bg-[#002B49] hover:text-white text-[#002B49]'
                  }`}
                >
                  {p.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Rate Sheet Overview Table */}
      <section className="py-16 bg-white border-t border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h3 className="text-xl sm:text-2xl font-bold text-[#002B49]">Standard Parcel Rate Reference</h3>
            <p className="text-slate-500 text-xs sm:text-sm mt-1">Indicative weight-based charges for retail & merchant parcels.</p>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-[#002B49] text-white uppercase text-[11px] tracking-wider">
                <tr>
                  <th className="py-3.5 px-4 font-bold">Route / Corridor</th>
                  <th className="py-3.5 px-4 font-bold">Delivery Time</th>
                  <th className="py-3.5 px-4 font-bold">First 1 Kg</th>
                  <th className="py-3.5 px-4 font-bold">Each Add'l Kg</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-700">
                <tr className="hover:bg-slate-50">
                  <td className="py-3.5 px-4 font-semibold text-[#002B49]">Kathmandu Valley (Standard)</td>
                  <td className="py-3.5 px-4">Next Day (24 hrs)</td>
                  <td className="py-3.5 px-4 font-bold">Rs. 80 - 100</td>
                  <td className="py-3.5 px-4">Rs. 35 / kg</td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="py-3.5 px-4 font-semibold text-[#002B49]">Kathmandu Valley (Same-Day Express)</td>
                  <td className="py-3.5 px-4">Within 4-6 hrs</td>
                  <td className="py-3.5 px-4 font-bold">Rs. 140 - 160</td>
                  <td className="py-3.5 px-4">Rs. 40 / kg</td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="py-3.5 px-4 font-semibold text-[#002B49]">Pokhara / Chitwan / Butwal</td>
                  <td className="py-3.5 px-4">24 - 48 hrs</td>
                  <td className="py-3.5 px-4 font-bold">Rs. 160 - 190</td>
                  <td className="py-3.5 px-4">Rs. 50 / kg</td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="py-3.5 px-4 font-semibold text-[#002B49]">Biratnagar / Dharan / Nepalgunj</td>
                  <td className="py-3.5 px-4">24 - 48 hrs</td>
                  <td className="py-3.5 px-4 font-bold">Rs. 190 - 220</td>
                  <td className="py-3.5 px-4">Rs. 60 / kg</td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="py-3.5 px-4 font-semibold text-[#002B49]">Hilly & Remote Destinations</td>
                  <td className="py-3.5 px-4">2 - 4 Days</td>
                  <td className="py-3.5 px-4 font-bold">Rs. 250 - 320</td>
                  <td className="py-3.5 px-4">Rs. 80 / kg</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-[11px] text-slate-400 mt-2 text-center">
            * Rates may vary based on volumetric weight (L x W x H / 5000) for bulky parcels. Bulk discounts apply for high monthly volume.
          </p>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
};

export default Pricing;
