import React from 'react';
import { useTrackingDrawer } from '../store/TrackingDrawerContext';
import { PackageSearch } from 'lucide-react';

const TrackingLink = ({ code, className = '' }) => {
  const { openTracking } = useTrackingDrawer();

  if (!code) return <span className="text-slate-400">—</span>;

  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        openTracking(code);
      }}
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-brand-700 bg-brand-50 hover:bg-brand-100 border border-brand-200 transition-colors font-mono font-bold whitespace-nowrap ${className}`}
      title="View full tracking details"
    >
      <PackageSearch className="w-3.5 h-3.5" />
      {code}
    </button>
  );
};

export default TrackingLink;
