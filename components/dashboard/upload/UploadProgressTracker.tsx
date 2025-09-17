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
    <div className="fixed bottom-4 right-4 w-80 bg-background border border-border rounded-lg shadow-lg">
      <div className="p-3 border-b border-border flex justify-between items-center">
        <h3 className="text-sm font-semibold text-foreground">Uploading Files</h3>
        {showClearButton && (
          <button onClick={clearCompleted} className="text-xs text-primary hover:underline">Clear</button>
        )}
      </div>
      <div className="p-3 space-y-3 max-h-64 overflow-y-auto">
        {tasks.map(task => (
          <div key={task.id} className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              {task.status === 'uploading' && <UploadCloud className="w-5 h-5 text-muted-foreground" />}
              {task.status === 'processing' && <Loader2 className="w-5 h-5 text-primary animate-spin" />}
              {task.status === 'success' && <CheckCircle className="w-5 h-5 text-green-500" />}
              {task.status === 'error' && <AlertCircle className="w-5 h-5 text-destructive" />}
            </div>
            <div className="flex-grow min-w-0">
              <p className="text-sm truncate text-foreground">{task.file.name}</p>
              <div className="w-full bg-muted rounded-full h-1.5 mt-1">
                <div
                  className={`h-1.5 rounded-full transition-all duration-300 ${task.status === 'success' ? 'bg-green-500' :
                      task.status === 'error' ? 'bg-destructive' : 'bg-primary'
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