// components/dashboard/upload/UploadProgressTracker.tsx
'use client';

import React from 'react';
import { useFileStore } from '@/lib/store/useFileStore';
import { CheckCircle, AlertCircle, UploadCloud, Loader2 } from 'lucide-react';

export const UploadProgressTracker = () => {
  const { tasks, clearCompleted } = useFileStore(state => ({
    tasks: state.uploadTasks,
    clearCompleted: state.clearCompletedUploads,
  }));

  if (tasks.length === 0) {
    return null;
  }
  
  const completedCount = tasks.filter(u => u.status === 'success' || u.status === 'error').length;
  const showClearButton = completedCount > 0 && completedCount === tasks.length;

  return (
    <div className="fixed bottom-4 right-4 w-80 ...">
      <div className="p-3 border-b ...">
        <h3 className="text-sm font-semibold">Uploading Files</h3>
        {showClearButton && (
          <button onClick={clearCompleted} className="text-xs text-blue-500 hover:underline">Clear</button>
        )}
      </div>
      <div className="p-3 space-y-3 max-h-64 overflow-y-auto">
        {tasks.map(task => (
          <div key={task.id} className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              {task.status === 'uploading' && <UploadCloud className="w-5 h-5 text-gray-400" />}
              {task.status === 'processing' && <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />}
              {task.status === 'success' && <CheckCircle className="w-5 h-5 text-green-500" />}
              {task.status === 'error' && <AlertCircle className="w-5 h-5 text-red-500" />}
            </div>
            <div className="flex-grow min-w-0">
              <p className="text-sm truncate">{task.file.name}</p>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mt-1">
                <div
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    task.status === 'success' ? 'bg-green-500' :
                    task.status === 'error' ? 'bg-red-500' : 'bg-blue-600'
                  } ${task.status === 'processing' ? 'animate-pulse' : ''}`}
                  style={{ width: `${task.progress}%` }}
                ></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};