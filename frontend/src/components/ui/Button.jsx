import React from 'react';
import { Loader2 } from 'lucide-react';

export function Button({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  isLoading = false, 
  className = '', 
  disabled,
  type = 'button',
  ...props 
}) {
  const baseClasses = 'inline-flex items-center justify-center gap-2 font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-1 transition-all duration-150 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none';
  
  const variants = {
    primary: 'bg-slate-900 text-white shadow-sm hover:bg-slate-800 focus:ring-slate-900/20 border border-transparent',
    secondary: 'bg-white text-slate-700 shadow-sm border border-slate-200 hover:bg-slate-50 hover:border-slate-300 focus:ring-slate-900/10',
    danger: 'bg-white text-red-600 shadow-sm border border-slate-200 hover:bg-red-50 hover:border-red-200 hover:text-red-700 focus:ring-red-500/20',
    ghost: 'bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus:ring-slate-900/10'
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-5 py-2.5 text-base',
    icon: 'p-2'
  };

  return (
    <button 
      type={type}
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={isLoading || disabled}
      {...props}
    >
      {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
      {!isLoading && children}
    </button>
  );
}
