import React from 'react';
import { FileQuestion } from 'lucide-react';
import { Button } from './Button';

export function EmptyState({ 
  icon: Icon = FileQuestion, 
  title = "No data found", 
  description = "There is nothing to display at this moment.", 
  actionLabel, 
  onAction 
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="bg-slate-50 p-4 rounded-full mb-4">
        <Icon className="w-8 h-8 text-slate-400" />
      </div>
      <h3 className="text-sm font-semibold text-slate-900 mb-1">{title}</h3>
      <p className="text-sm text-slate-500 mb-6 max-w-sm">{description}</p>
      {actionLabel && onAction && (
        <Button onClick={onAction} variant="secondary">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
