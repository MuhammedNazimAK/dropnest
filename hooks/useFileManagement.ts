import { useState } from 'react';
import type { NewFile } from '@/lib/db/schema';

export const useFileManagement = (initialFiles: NewFile[], userId: string) => {
  const [files, setFiles] = useState<NewFile[]>(initialFiles);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = async (uploadFiles: FileList) => {
    setIsUploading(true);
    
    try {
      const formData = new FormData();
      Array.from(uploadFiles).forEach(file => {
        formData.append('files', file);
      });
      formData.append('userId', userId);

      const response = await fetch('/api/files/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const newFiles = await response.json();
        setFiles(prev => [...prev, ...newFiles]);
      }
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const toggleStar = async (fileId: string) => {
    try {
      const response = await fetch('/api/files/star', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileId }),
      });

      if (response.ok) {
        setFiles(files.map(file => 
          file.id === fileId ? { ...file, isStarred: !file.isStarred } : file
        ));
      }
    } catch (error) {
      console.error('Failed to toggle star:', error);
    }
  };

  const moveToTrash = async (fileId: string) => {
    try {
      const response = await fetch('/api/files/trash', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileId }),
      });

      if (response.ok) {
        setFiles(files.map(file => 
          file.id === fileId ? { ...file, isTrash: true } : file
        ));
      }
    } catch (error) {
      console.error('Failed to move to trash:', error);
    }
  };

  const restoreFile = async (fileId: string) => {
    try {
      const response = await fetch('/api/files/restore', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileId }),
      });

      if (response.ok) {
        setFiles(files.map(file => 
          file.id === fileId ? { ...file, isTrash: false } : file
        ));
      }
    } catch (error) {
      console.error('Failed to restore file:', error);
    }
  };

  const emptyTrash = async () => {
    try {
      const response = await fetch('/api/files/empty-trash', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      if (response.ok) {
        setFiles(files.filter(file => !file.isTrash));
      }
    } catch (error) {
      console.error('Failed to empty trash:', error);
    }
  };

  return {
    files,
    isUploading,
    handleFileUpload,
    toggleStar,
    moveToTrash,
    restoreFile,
    emptyTrash
  };
};