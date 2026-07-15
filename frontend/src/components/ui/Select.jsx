import React from 'react';
import { ChevronDown } from 'lucide-react';

export const Select = React.forwardRef(({ 
  label, 
  error, 
  className = '', 
  id, 
  required,
  children,
  ...props 
}, ref) => {
  const selectId = id || label?.toLowerCase().replace(/\s+/g, '-');
  
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={selectId} className="block text-sm font-medium text-slate-700 mb-1.5">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <div className="relative">
        <select
          ref={ref}
          id={selectId}
          required={required}
          className={`appearance-none w-full px-3 py-2 pr-10 bg-white border rounded-lg shadow-sm text-sm text-slate-900 focus:outline-none focus:ring-1 transition-all duration-150 disabled:bg-slate-50 disabled:text-slate-500 ${
            error 
              ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
              : 'border-slate-200 focus:border-slate-400 focus:ring-slate-400'
          } ${className}`}
          {...props}
        >
          {children}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
      </div>
      {error && <p className="mt-1.5 text-xs text-red-600 font-medium">{error}</p>}
    </div>
  );
});

Select.displayName = 'Select';
