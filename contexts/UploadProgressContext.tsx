'use client';

import React, { createContext, useState, useContext, ReactNode } from 'react';

interface UploadingFile {
  id: number;
  name: string;
  progress: number;
  status: 'uploading' | 'processing' | 'success' | 'error';
}

interface UploadProgressContextType {
  uploads: UploadingFile[];
  addUpload: (file: File) => number;
  updateUploadProgress: (id: number, progress: number) => void;
  finishUpload: (id: number, status: 'success' | 'error') => void;
  clearCompleted: () => void;
  setUploadStatus: (id: number, status: 'processing' | 'success' | 'error') => void;
}

const UploadProgressContext = createContext<UploadProgressContextType | undefined>(undefined);

let uploadIdCounter = 0;

export const UploadProgressProvider = ({ children }: { children: ReactNode }) => {
  const [uploads, setUploads] = useState<UploadingFile[]>([]);

  const addUpload = (file: File) => {
    const id = uploadIdCounter++;
    setUploads(prev => [...prev, { id, name: file.name, progress: 0, status: 'uploading' }]);
    return id;
  };

  const setUploadStatus = (id: number, status: 'processing' | 'success' | 'error') => {
    setUploads(prev => prev.map(u => u.id === id ? { ...u, status } : u));
  };

  const updateUploadProgress = (id: number, progress: number) => {
    setUploads(prev => prev.map(u => u.id === id ? { ...u, progress } : u));
  };

  const finishUpload = (id: number, status: 'success' | 'error') => {
    setUploads(prev => prev.map(u => u.id === id ? { ...u, status, progress: 100 } : u));
  };

  const clearCompleted = () => {
    setUploads(prev => prev.filter(u => u.status === 'uploading'));
  };

  return (
    <UploadProgressContext.Provider value={{ uploads, addUpload, updateUploadProgress, finishUpload, clearCompleted, setUploadStatus }}>
      {children}
    </UploadProgressContext.Provider>
  );
};

export const useUploadProgress = () => {
  const context = useContext(UploadProgressContext);
  if (!context) {
    throw new Error('useUploadProgress must be used within an UploadProgressProvider');
  }
  return context;
};