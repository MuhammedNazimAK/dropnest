import { useState } from 'react';
import type { NewFile } from '@/lib/db/schema';

interface FileUploadResponse {
  success: boolean;
  uploadedFiles: NewFile[];
  errors?: string[];
  message: string;
}

interface FileOperationResponse {
  success: boolean;
  file: NewFile;
  message: string;
}

interface FileManagementState {
  isUploading: boolean;
  isOperating: boolean;
  uploadProgress: number;
  error: string | null;
  success: string | null;
}

export const useFileManagement = (initialFiles: NewFile[], userId: string) => {
  const [files, setFiles] = useState<NewFile[]>(initialFiles);
  const [state, setState] = useState<FileManagementState>({
    isUploading: false,
    isOperating: false,
    uploadProgress: 0,
    error: null,
    success: null
  });

  // Clear messages after timeout
  const clearMessages = () => {
    setTimeout(() => {
      setState(prev => ({ ...prev, error: null, success: null }));
    }, 5000);
  };

  const handleFileUpload = async (uploadFiles: FileList) => {
    setState(prev => ({ ...prev, isUploading: true, error: null, success: null, uploadProgress: 0 }));
    
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

      const data: FileUploadResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Upload failed');
      }

      if (data.success && data.uploadedFiles) {
        setFiles(prev => [...prev, ...data.uploadedFiles]);
        setState(prev => ({ 
          ...prev, 
          success: data.message,
          uploadProgress: 100 
        }));

        // Show warnings if there were any errors
        if (data.errors && data.errors.length > 0) {
          setState(prev => ({ 
            ...prev, 
            error: `Some files failed: ${data.errors?.join(', ')}` 
          }));
        }
      }
    } catch (error) {
      console.error('Upload failed:', error);
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Upload failed' 
      }));
    } finally {
      setState(prev => ({ ...prev, isUploading: false }));
      clearMessages();
    }
  };

  const toggleStar = async (fileId: string) => {
    setState(prev => ({ ...prev, isOperating: true, error: null }));

    console.log("came to toggle")

    // Optimistic update
    const previousFiles = [...files];
    setFiles(files.map(file => 
      file.id === fileId ? { ...file, isStarred: !file.isStarred } : file
    ));

    try {
      const response = await fetch(`/api/files/${fileId}/star`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileId }),
      });

      const data: FileOperationResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update file');
      }

      // Update with server response
      setFiles(files.map(file => 
        file.id === fileId ? data.file : file
      ));

      setState(prev => ({ ...prev, success: data.message }));
    } catch (error) {
      // Revert optimistic update
      setFiles(previousFiles);
      console.error('Failed to toggle star:', error);
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Failed to update file' 
      }));
    } finally {
      setState(prev => ({ ...prev, isOperating: false }));
      clearMessages();
    }
  };

  const moveToTrash = async (fileId: string) => {
    setState(prev => ({ ...prev, isOperating: true, error: null }));

    // Optimistic update
    const previousFiles = [...files];
    setFiles(files.map(file => 
      file.id === fileId ? { ...file, isTrash: true } : file
    ));

    try {
      const response = await fetch(`/api/files/${fileId}/trash`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileId }),
      });

      const data: FileOperationResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to move to trash');
      }

      // Update with server response
      setFiles(files.map(file => 
        file.id === fileId ? data.file : file
      ));

      setState(prev => ({ ...prev, success: data.message }));
    } catch (error) {
      // Revert optimistic update
      setFiles(previousFiles);
      console.error('Failed to move to trash:', error);
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Failed to move to trash' 
      }));
    } finally {
      setState(prev => ({ ...prev, isOperating: false }));
      clearMessages();
    }
  };

  const restoreFile = async (fileId: string) => {
    setState(prev => ({ ...prev, isOperating: true, error: null }));

    // Optimistic update
    const previousFiles = [...files];
    setFiles(files.map(file => 
      file.id === fileId ? { ...file, isTrash: false } : file
    ));

    try {
      const response = await fetch(`/api/files/${fileId}/restore`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileId }),
      });

      const data: FileOperationResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to restore file');
      }

      // Update with server response
      setFiles(files.map(file => 
        file.id === fileId ? data.file : file
      ));

      setState(prev => ({ ...prev, success: data.message }));
    } catch (error) {
      // Revert optimistic update
      setFiles(previousFiles);
      console.error('Failed to restore file:', error);
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Failed to restore file' 
      }));
    } finally {
      setState(prev => ({ ...prev, isOperating: false }));
      clearMessages();
    }
  };

  const emptyTrash = async () => {
    setState(prev => ({ ...prev, isOperating: true, error: null }));

    try {
      const response = await fetch('/api/files/empty-trash', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to empty trash');
      }

      setFiles(files.filter(file => !file.isTrash));
      setState(prev => ({ ...prev, success: data.message || 'Trash emptied successfully' }));
    } catch (error) {
      console.error('Failed to empty trash:', error);
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Failed to empty trash' 
      }));
    } finally {
      setState(prev => ({ ...prev, isOperating: false }));
      clearMessages();
    }
  };

  return {
    files,
    ...state,
    handleFileUpload,
    toggleStar,
    moveToTrash,
    restoreFile,
    emptyTrash
  };
};