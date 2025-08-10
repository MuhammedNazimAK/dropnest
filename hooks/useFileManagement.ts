import { useCallback, useState } from 'react';
import { useNotification } from '@/contexts/NotificationContext';
import type { NewFile } from '@/lib/db/schema';
import { fi } from 'zod/v4/locales';


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
}

export const useFileManagement = (initialFiles: NewFile[], userId: string) => {
  const [files, setFiles] = useState<NewFile[]>(initialFiles);
  const [state, setState] = useState<FileManagementState>({
    isUploading: false,
    isOperating: false,
    uploadProgress: 0,
  });

  const { showNotification } = useNotification();

  const handleFileUpload = async (uploadFiles: FileList) => {
    setState(prev => ({ ...prev, isUploading: true, uploadProgress: 0 }));

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
        setState(prev => ({ ...prev, uploadProgress: 100 }));

        const uploadedCount = data.uploadedFiles.length;
        showNotification('success', `Successfully uploaded ${uploadedCount} file${uploadedCount !== 1 ? 's' : ''}`);

        // Show warnings if there were any errors
        if (data.errors && data.errors.length > 0) {
          showNotification('warning', `Some files failed to upload: ${data.errors.join(', ')}`);
        }
      }
    } catch (error) {
      console.error('Upload failed:', error);
      showNotification('error', error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setState(prev => ({ ...prev, isUploading: false }));
    }
  };

  const toggleStar = async (fileId: string) => {
    setState(prev => ({ ...prev, isOperating: true }));

    console.log("came to toggle")

    // Optimistic update
    const previousFiles = [...files];
    const targetFile = files.find(file => file.id === fileId);
    const isStarring = !targetFile?.isStarred;

    setFiles(prevFiles => prevFiles.map(file =>
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

      showNotification('success', isStarring ? 'File starred' : 'File unstarred');

      // Update with server response
      setFiles(prevFiles => prevFiles.map(file =>
        file.id === fileId ? data.file : file
      ));

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
    }
  };

  const moveToTrash = async (fileId: string) => {
    setState(prev => ({ ...prev, isOperating: true }));

    // Optimistic update
    const previousFiles = [...files];
    setFiles(prevFiles => prevFiles.map(file =>
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

      showNotification('success', 'File trashed');

      // Update with server response
      setFiles(prevFiles => prevFiles.map(file =>
        file.id === fileId ? data.file : file
      ));


    } catch (error) {
      // Revert optimistic update
      setFiles(previousFiles);
      console.error('Failed to move to trash:', error);
      showNotification('error', error instanceof Error ? error.message : 'Failed to trash file');

    } finally {
      setState(prev => ({ ...prev, isOperating: false }));
    }
  };

  const restoreFile = async (fileId: string) => {
    setState(prev => ({ ...prev, isOperating: true }));

    // Optimistic update
    const previousFiles = [...files];
    setFiles(prevFiles => prevFiles.map(file =>
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

      showNotification('success', 'File restored');

      // Update with server response
      setFiles(prevFiles => prevFiles.map(file =>
        file.id === fileId ? data.file : file
      ));


    } catch (error) {
      // Revert optimistic update
      setFiles(previousFiles);
      console.error('Failed to restore file:', error);
      showNotification('error', error instanceof Error ? error.message : 'Failed to restore file');

    } finally {
      setState(prev => ({ ...prev, isOperating: false }));
    }
  };

  const emptyTrash = async () => {
    setState(prev => ({ ...prev, isOperating: true }));

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

      showNotification('success', 'Trash emptied successfully');

      setFiles(files.filter(file => !file.isTrash));

    } catch (error) {
      console.error('Failed to empty trash:', error);
      showNotification('error', error instanceof Error ? error.message : 'Failed to empty trash');

    } finally {
      setState(prev => ({ ...prev, isOperating: false }));
    }
  };


  const deleteFilePermanently = async (fileId: string) => {
    setState(prev => ({ ...prev, isOperating: true }));

    // Optimistic update - remove file immediately
    const previousFiles = [...files];
    setFiles(prevFiles => prevFiles.filter(file => file.id !== fileId));

    console.log("file id for delete", fileId)

    try {
      const response = await fetch(`/api/files/${fileId}/delete`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();

      console.log("deleted data", data)

      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete file permanently');
      }

      showNotification('success', 'File deleted permanently');

      // File is already removed from optimistic update, no need to update again

    } catch (error) {
      // Revert optimistic update
      setFiles(previousFiles);
      console.error('Failed to delete file permanently:', error);
      showNotification('error', error instanceof Error ? error.message : 'Failed to delete file');

    } finally {
      setState(prev => ({ ...prev, isOperating: false }));
    }
  };


  const refreshFiles = useCallback(async (folderId?: string | null) => {
    try {

      const response = await fetch(`/api/files?folderId=${folderId || ''}`);
      if (response.ok) {
        const data = await response.json();
        setFiles(data.files || []);
      }

    } catch (error) {
      console.error('Failed to refresh files:', error);
      showNotification('error', 'Failed to refresh files');
    }
  }, [showNotification]);

  

  return {
    files,
    ...state,
    handleFileUpload,
    toggleStar,
    moveToTrash,
    restoreFile,
    emptyTrash,
    deleteFilePermanently,
    refreshFiles
  };
};