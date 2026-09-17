import React, { useState } from 'react';
import { Phone, Mail, MapPin, Send, MessageCircle, Clock, CheckCircle2, Building2 } from 'lucide-react';
import PublicNav from '../../components/PublicNav';
import PublicFooter from '../../components/PublicFooter';

const Contact = () => {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    subject: 'General Inquiry',
    message: ''
  });
  const [sent, setSent] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSent(true);
    setForm({ name: '', email: '', phone: '', subject: 'General Inquiry', message: '' });
    setTimeout(() => setSent(false), 6000);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans text-slate-800">
      <PublicNav />

      {/* Header Banner */}
      <section className="relative bg-[#002B49] text-white py-16 lg:py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[#002B49] via-[#002035] to-[#001422] opacity-95 pointer-events-none" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-10 text-center">
          <span className="inline-flex items-center gap-1.5 bg-[#E31837] text-white px-3.5 py-1 rounded-full text-xs font-extrabold uppercase tracking-widest mb-4">
            Contact Us
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight mb-4">
            Get in Touch With Our Team
          </h1>
          <p className="text-base sm:text-lg text-slate-200 max-w-2xl mx-auto">
            Have questions about shipments, merchant onboarding, bulk freight, or branch pickups? We are here to assist you 7 days a week.
          </p>
        </div>
      </section>

      <main className="flex-1 py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            
            {/* Left Contact Details Card */}
            <div className="lg:col-span-5 bg-[#002B49] text-white rounded-2xl p-8 sm:p-10 shadow-xl relative overflow-hidden space-y-8">
              <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 bg-[#E31837]/20 rounded-full blur-2xl pointer-events-none" />

              <div>
                <h3 className="text-2xl font-bold mb-2">Central Headquarters</h3>
                <p className="text-slate-300 text-sm leading-relaxed">
                  Our main logistics hub and administrative team are located at Kuleshwor, Kathmandu. Reach out through any of the channels below.
                </p>
              </div>

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-white/10 rounded-xl text-[#E31837] shrink-0">
                    <MapPin className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="text-xs uppercase text-slate-400 font-bold tracking-wider mb-0.5">Physical Address</div>
                    <p className="text-sm font-semibold text-white">KDM Express Pvt. Ltd.</p>
                    <p className="text-xs text-slate-300">Kuleshwor, Kathmandu, Nepal</p>
                    <a
                      href="https://maps.google.com/?q=Kuleshwor,+Kathmandu,+Nepal"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-red-300 hover:text-white underline mt-1 inline-block"
                    >
                      View on Google Maps &rarr;
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="p-3 bg-white/10 rounded-xl text-white shrink-0">
                    <Phone className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="text-xs uppercase text-slate-400 font-bold tracking-wider mb-0.5">Direct Helpline</div>
                    <a href="tel:+9779801081469" className="text-sm font-semibold text-white hover:text-red-300 block">
                      +977 980-1081469
                    </a>
                    <a href="tel:+9779861252198" className="text-xs text-slate-300 hover:text-white block mt-0.5">
                      +977 986-1252198 (Operations)
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="p-3 bg-white/10 rounded-xl text-white shrink-0">
                    <Mail className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="text-xs uppercase text-slate-400 font-bold tracking-wider mb-0.5">Email Inquiries</div>
                    <a href="mailto:info@kdmexpress.com" className="text-sm font-semibold text-white hover:text-red-300 block">
                      info@kdmexpress.com
                    </a>
                    <a href="mailto:support@kdmexpress.com" className="text-xs text-slate-300 hover:text-white block mt-0.5">
                      support@kdmexpress.com
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="p-3 bg-white/10 rounded-xl text-white shrink-0">
                    <Clock className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="text-xs uppercase text-slate-400 font-bold tracking-wider mb-0.5">Hub & Support Hours</div>
                    <p className="text-sm font-semibold text-white">Mon – Sun: 7:00 AM – 9:00 PM</p>
                    <p className="text-xs text-slate-300">Dispatch active 7 days a week</p>
                  </div>
                </div>
              </div>

              {/* WhatsApp & Viber Buttons */}
              <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row gap-3">
                <a
                  href="https://wa.me/9779801081469"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-white py-3 px-4 rounded-xl text-xs font-bold transition-colors shadow"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Chat on WhatsApp</span>
                </a>
                <a
                  href="viber://chat?number=9779801081469"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 bg-[#7360F2] hover:bg-[#6452d9] text-white py-3 px-4 rounded-xl text-xs font-bold transition-colors shadow"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Chat on Viber</span>
                </a>
              </div>
            </div>

            {/* Right Contact Form */}
            <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-8 sm:p-10 shadow-sm">
              <div className="mb-8">
                <span className="text-[#E31837] font-bold text-xs uppercase tracking-widest block mb-1">Message Us</span>
                <h3 className="text-2xl font-bold text-[#002B49]">Send an Inquiry</h3>
                <p className="text-slate-500 text-sm mt-1">Our customer experience team typically responds within 1–2 hours.</p>
              </div>

              {sent && (
                <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl p-4 mb-6 text-sm font-medium flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>Thank you! Your message has been received. Our team will contact you shortly.</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ramesh Thapa"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#002B49] focus:bg-white transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="ramesh@example.com"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#002B49] focus:bg-white transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Phone Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="+977 98XXXXXXXX"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#002B49] focus:bg-white transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Topic / Service
                    </label>
                    <select
                      value={form.subject}
                      onChange={(e) => setForm({ ...form, subject: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#002B49] focus:bg-white transition-all"
                    >
                      <option value="General Inquiry">General Inquiry</option>
                      <option value="Merchant Onboarding / E-Commerce">Merchant Onboarding / E-Commerce</option>
                      <option value="Shipment Status / Tracking">Shipment Status / Tracking</option>
                      <option value="Corporate / Bulk Freight">Corporate / Bulk Freight</option>
                      <option value="Branch Drop-off">Branch Drop-off</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Your Message <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows="5"
                    required
                    placeholder="Tell us what you need help with, pickup locations, or parcel details..."
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#002B49] focus:bg-white transition-all resize-y"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#E31837] hover:bg-[#c1122d] text-white font-bold py-3.5 px-6 rounded-lg text-sm transition-all flex items-center justify-center gap-2 uppercase tracking-wide shadow"
                >
                  <Send className="w-4 h-4" />
                  <span>Send Message</span>
                </button>
              </form>
            </div>

          </div>

          {/* Embedded Google Map */}
          <div className="mt-16 rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-slate-100">
            <div className="p-4 bg-white border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#E31837]" />
                <span className="text-sm font-bold text-[#002B49]">KDM Express Central Hub — Kuleshwor, Kathmandu</span>
              </div>
              <a
                href="https://maps.google.com/?q=Kuleshwor,+Kathmandu,+Nepal"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-bold text-[#E31837] hover:underline"
              >
                Open in Full Google Maps &rarr;
              </a>
            </div>
            <iframe
              title="KDM Express Location"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d14131.625373809618!2d85.293677!3d27.697089!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39eb185a49806b0d%3A0x6b4f738b4c2b95fa!2sKuleshwor%2C%20Kathmandu%2044600!5e0!3m2!1sen!2snp!4v1690000000000!5m2!1sen!2snp"
              width="100%"
              height="380"
              style={{ border: 0 }}
              allowFullScreen=""
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>

        </div>
      </main>

      <PublicFooter />
    </div>
  );
};

export default Contact;
