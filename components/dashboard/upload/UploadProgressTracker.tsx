'use client';

import React from 'react';
import { useUploadProgress } from '@/contexts/UploadProgressContext';
import { CheckCircle, AlertCircle, UploadCloud, Loader2 } from 'lucide-react';

export const UploadProgressTracker = () => {
  const { uploads, clearCompleted } = useUploadProgress();

  if (uploads.length === 0) {
    return null;
  }

  const completedCount = uploads.filter(u => u.status !== 'uploading').length;
  const showClearButton = completedCount > 0 && completedCount === uploads.length;

  return (
    <div className="fixed bottom-4 right-4 w-80 bg-white dark:bg-gray-800 shadow-2xl rounded-lg border dark:border-gray-700 z-50">
      <div className="p-3 border-b dark:border-gray-700 flex justify-between items-center">
        <h3 className="text-sm font-semibold">Uploading Files</h3>
        {showClearButton && (
          <button onClick={clearCompleted} className="text-xs text-blue-500 hover:underline">Clear</button>
        )}
      </div>
      <div className="p-3 space-y-3 max-h-64 overflow-y-auto">
        {uploads.map(upload => (
          <div key={upload.id} className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              {upload.status === 'uploading' && <UploadCloud className="w-5 h-5 text-gray-400" />}
              {upload.status === 'processing' && <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />}
              {upload.status === 'success' && <CheckCircle className="w-5 h-5 text-green-500" />}
              {upload.status === 'error' && <AlertCircle className="w-5 h-5 text-red-500" />}
            </div>
            <div className="flex-grow min-w-0">
              <p className="text-sm truncate">{upload.name}</p>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mt-1">
                <div 
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    upload.status === 'success' ? 'bg-green-500' : 
                    upload.status === 'error' ? 'bg-red-500' : 'bg-blue-600'
                  } ${upload.status === 'processing' ? 'animate-pulse' : ''}`}
                  style={{ width: `${upload.progress}%` }}
                ></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};