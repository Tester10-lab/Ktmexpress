import React from 'react';
import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';
import PublicNav from '../../components/PublicNav';
import PublicFooter from '../../components/PublicFooter';
import { Button } from '../../components/ui/Button';

const plans = [
  {
    name: 'Starter',
    badge: '',
    price: 'Free',
    sub: 'First 100 packages/month',
    features: [
      '100 deliveries/month',
      'KTM Valley only',
      'Standard COD collection',
      'Vendor portal access',
      'Email support',
    ],
    cta: 'Get Started Free',
    highlight: false,
  },
  {
    name: 'Growth',
    badge: 'Most Popular',
    price: 'Rs. 2,500',
    sub: 'per month',
    features: [
      'Unlimited deliveries',
      'Valley + Outside delivery',
      'Priority dispatch',
      'Bulk CSV upload',
      'Advanced analytics',
      'WhatsApp support',
    ],
    cta: 'Start Free Trial',
    highlight: true,
  },
  {
    name: 'Enterprise',
    badge: '',
    price: 'Custom',
    sub: 'Volume pricing available',
    features: [
      'Unlimited deliveries',
      'Dedicated rider team',
      'Custom API integration',
      'White-label option',
      'SLA guarantee',
      'Dedicated account manager',
    ],
    cta: 'Contact Sales',
    highlight: false,
  },
];

const Pricing = () => (
  <div className="min-h-screen flex flex-col bg-slate-50 relative overflow-hidden">
    <PublicNav active="/pricing" />

    <main className="flex-1 px-6 py-20 relative z-10 flex flex-col items-center">
      <div className="text-center mb-16">
        <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 tracking-tight mb-4">Simple, Transparent Pricing</h1>
        <p className="text-slate-500 text-lg max-w-2xl mx-auto leading-relaxed">No hidden fees. No contracts. Pay as you grow with the most reliable logistics network.</p>
      </div>
      
      <div className="w-full max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
          {plans.map(p => (
            <div 
              key={p.name} 
              className={`relative bg-white rounded-2xl p-8 transition-transform duration-300 ${
                p.highlight 
                  ? 'border-2 border-slate-900 shadow-xl scale-100 md:scale-105 z-10' 
                  : 'border border-slate-200 shadow-sm hover:-translate-y-1 hover:shadow-md'
              }`}
            >
              {p.badge && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-slate-900 text-white rounded-full px-4 py-1 text-xs font-semibold tracking-wide shadow-sm">
                  {p.badge}
                </div>
              )}
              
              <div className="text-center mb-8">
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">{p.name}</h3>
                <div className="text-4xl font-bold text-slate-900 mb-2">{p.price}</div>
                <p className="text-sm font-medium text-slate-500">{p.sub}</p>
              </div>
              
              <ul className="space-y-4 mb-8">
                {p.features.map(f => (
                  <li key={f} className="flex items-start gap-3 text-sm font-medium text-slate-700">
                    <Check className={`w-5 h-5 shrink-0 ${p.highlight ? 'text-slate-900' : 'text-slate-400'}`} />
                    {f}
                  </li>
                ))}
              </ul>
              
              <Link to={p.name === 'Enterprise' ? '/contact' : '/login'} className="block">
                <Button 
                  variant={p.highlight ? 'primary' : 'secondary'} 
                  className={`w-full py-2.5 h-auto ${p.highlight ? 'bg-slate-900 hover:bg-slate-800 text-white' : ''}`}
                >
                  {p.cta}
                </Button>
              </Link>
            </div>
          ))}
        </div>

        <div className="mt-16 bg-white border border-slate-200 rounded-xl p-8 text-center shadow-sm">
          <h3 className="text-xl font-bold text-slate-900 mb-3">Need a custom plan?</h3>
          <p className="text-slate-500 text-sm mb-6 max-w-2xl mx-auto">We work with large e-commerce businesses to create tailored logistics solutions. Contact us and we'll design a package that fits your volume.</p>
          <Link to="/contact">
            <Button variant="secondary">Talk to Our Team</Button>
          </Link>
        </div>
      </div>
    </main>

    <PublicFooter />
  </div>
);

export default Pricing;
