'use client';

import { UploadCloud } from 'lucide-react';
import React from 'react';

interface EmptyStateProps {
  message: string;
  details: string;
  onUploadClick?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ message, details, onUploadClick }) => {
  return (
    <div className="flex flex-col items-center justify-center text-center h-full w-full bg-muted/50 rounded-xl p-12">
      <div className="p-5 bg-secondary rounded-full mb-6">
        <UploadCloud className="w-10 h-10 text-primary" />
      </div>
      <h3 className="text-xl font-semibold text-foreground">{message}</h3>
      <p className="mt-2 text-sm text-muted-foreground max-w-xs">{details}</p>
      {onUploadClick && (
        <button
          className="mt-6 flex items-center space-x-2 px-5 py-2.5 text-sm font-medium text-primary-foreground bg-primary rounded-lg hover:bg-primary/90 transition-colors shadow"
          onClick={onUploadClick}
        >
          <span>Upload a File</span>
        </button>
      )}
    </div>
  );
};