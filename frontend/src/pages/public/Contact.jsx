import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin, Send, MessageCircle, Info } from 'lucide-react';
import PublicNav from '../../components/PublicNav';
import PublicFooter from '../../components/PublicFooter';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

const Contact = () => {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [sent, setSent] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSent(true);
    setForm({ name: '', email: '', message: '' });
    setTimeout(() => setSent(false), 5000);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 relative overflow-hidden">
      <PublicNav active="/contact" />

      <main className="flex-1 px-6 py-20 relative z-10 flex flex-col items-center">
        <div className="text-center mb-16">
          <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 tracking-tight mb-4">Let's Connect</h1>
          <p className="text-slate-500 text-lg max-w-2xl mx-auto leading-relaxed">We're here to help you scale your logistics. Drop us a line and our experts will get back to you.</p>
        </div>

        <div className="w-full max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
          {/* Contact Info Card */}
          <div className="bg-slate-900 text-white rounded-2xl p-10 flex flex-col relative overflow-hidden shadow-xl">
            <div className="relative z-10 flex-1">
              <h3 className="text-2xl font-bold mb-3">Contact Information</h3>
              <p className="text-slate-400 mb-10 leading-relaxed">Fill out the form and our team will get back to you within 24 hours.</p>

              <div className="space-y-8 mb-12">
                {[
                  { icon: <Phone className="w-5 h-5" />, title: '9861252198', sub: 'Mon–Sun, 9am–6pm' },
                  { icon: <Mail className="w-5 h-5" />, title: 'ishannpn@gmail.com', sub: 'Send us an email anytime!' },
                  { icon: <MapPin className="w-5 h-5" />, title: 'kuleshwor', sub: 'Kathmandu', link: 'https://maps.google.com/?q=Kuleshwor,+Kathmandu,+Nepal' },
                ].map((c, i) => (
                  <div key={i} className="flex gap-4 items-start">
                    <div className="shrink-0 p-3 bg-white/10 rounded-xl text-white">
                      {c.icon}
                    </div>
                    <div>
                      <p className="font-semibold text-lg mb-1">{c.title}</p>
                      <p className="text-sm text-slate-400">
                        {c.sub}
                        {c.link && <span> &bull; <a href={c.link} target="_blank" rel="noopener noreferrer" className="text-white hover:underline">View on Map</a></span>}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-3 relative z-10">
              <a href="https://wa.me/9779861252198" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 bg-[#25D366] text-white py-3 px-5 rounded-xl font-bold hover:bg-[#20bd5a] transition-colors">
                <MessageCircle className="w-5 h-5" />
                Chat on WhatsApp
              </a>
              <a href="viber://chat?number=9779861252198" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 bg-[#7360F2] text-white py-3 px-5 rounded-xl font-bold hover:bg-[#6452d9] transition-colors">
                <MessageCircle className="w-5 h-5" />
                Chat on Viber
              </a>
            </div>
          </div>

          {/* Contact Form */}
          <div className="bg-white border border-slate-200 rounded-2xl p-10 shadow-sm">
            <h3 className="text-2xl font-bold text-slate-900 mb-2">Send us a Message</h3>
            <p className="text-slate-500 text-sm mb-8">We usually reply within 24 hours.</p>
            
            {sent && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl p-4 mb-6 font-medium flex items-center gap-3">
                <Send className="w-5 h-5" />
                Message sent successfully!
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <Input
                  label="Your Name"
                  type="text"
                  placeholder="John Doe"
                  required
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                />
                <Input
                  label="Email Address"
                  type="email"
                  placeholder="john@example.com"
                  required
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Message <span className="text-red-500">*</span></label>
                <textarea 
                  rows="5" 
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg shadow-sm text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:border-slate-400 focus:ring-slate-400 transition-all duration-150 resize-y"
                  placeholder="How can we help you?" 
                  required 
                  value={form.message} 
                  onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                />
              </div>
              <Button type="submit" variant="primary" className="w-full py-3 h-auto">
                <Send className="w-4 h-4 mr-2" />
                Send Message
              </Button>
            </form>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
};

export default Contact;

