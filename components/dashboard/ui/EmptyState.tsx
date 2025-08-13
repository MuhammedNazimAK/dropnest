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
    <div className="flex flex-col items-center justify-center text-center h-full w-full bg-gray-50 dark:bg-gray-900/50 rounded-xl p-12">
      <div className="p-5 bg-gray-100 dark:bg-gray-800 rounded-full mb-6">
        <UploadCloud className="w-10 h-10 text-blue-500" />
      </div>
      <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">{message}</h3>
      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 max-w-xs">{details}</p>
      {onUploadClick && (
      <button 
        className="mt-6 flex items-center space-x-2 px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow"
        onClick={onUploadClick}
      >
        <span>Upload a File</span>
      </button>
      )}
    </div>
  );
};