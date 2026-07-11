import React from 'react';
import { Package } from 'lucide-react';

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

export default PublicFooter;
