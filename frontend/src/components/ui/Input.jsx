import React from 'react';

export const Input = React.forwardRef(({ 
  label, 
  error, 
  className = '', 
  id, 
  required,
  ...props 
}, ref) => {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
  
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-slate-700 mb-1.5">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        required={required}
        className={`w-full px-3 py-2 bg-white border rounded-lg shadow-sm text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 transition-all duration-150 disabled:bg-slate-50 disabled:text-slate-500 ${
          error 
            ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
            : 'border-slate-200 focus:border-slate-400 focus:ring-slate-400'
        } ${className}`}
        {...props}
      />
      {error && <p className="mt-1.5 text-xs text-red-600 font-medium">{error}</p>}
    </div>
  );
});

Input.displayName = 'Input';
