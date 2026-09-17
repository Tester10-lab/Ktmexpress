import React from 'react';

/**
 * Basic animated pulse Skeleton block
 */
export const Skeleton = ({ className = '', ...props }) => {
  return (
    <div
      className={`animate-pulse bg-slate-200 rounded-md ${className}`}
      {...props}
    />
  );
};

/**
 * Skeleton loader for Metric Summary Cards (Dashboard)
 */
export const MetricCardSkeleton = () => {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm animate-pulse space-y-3">
      <div className="flex justify-between items-center">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-10 w-10 rounded-xl" />
      </div>
      <Skeleton className="h-8 w-32" />
      <Skeleton className="h-3 w-40" />
    </div>
  );
};

/**
 * Skeleton loader for Table Rows
 */
export const TableRowSkeleton = ({ columns = 5 }) => {
  return (
    <tr className="border-b border-slate-100 animate-pulse">
      {Array.from({ length: columns }).map((_, idx) => (
        <td key={idx} className="py-3.5 px-4">
          <Skeleton className="h-4 w-full max-w-[120px]" />
        </td>
      ))}
    </tr>
  );
};

/**
 * Skeleton loader for Tracking results
 */
export const TrackingSkeleton = () => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6 animate-pulse">
      <div className="flex justify-between items-center border-b border-slate-100 pb-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-6 w-36" />
        </div>
        <Skeleton className="h-8 w-28 rounded-full" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Skeleton className="h-16 rounded-xl" />
        <Skeleton className="h-16 rounded-xl" />
        <Skeleton className="h-16 rounded-xl" />
      </div>
      <div className="space-y-3 pt-4">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-12 w-full rounded-xl" />
        <Skeleton className="h-12 w-full rounded-xl" />
      </div>
    </div>
  );
};

export default Skeleton;
