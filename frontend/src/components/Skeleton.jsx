import React from 'react';

const Skeleton = ({ className = '', variant = 'rectangular' }) => {
  const baseClass = 'animate-pulse bg-slate-200';
  
  let variantClass = '';
  if (variant === 'circular') variantClass = 'rounded-full';
  else if (variant === 'rounded') variantClass = 'rounded-lg';
  else if (variant === 'text') variantClass = 'rounded h-4';

  return (
    <div className={`${baseClass} ${variantClass} ${className}`} />
  );
};

export default Skeleton;
