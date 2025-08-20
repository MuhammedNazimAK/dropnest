import { useCallback, useState } from 'react';
import type { NewFile } from '@/lib/db/schema';
import { toast } from 'sonner';

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

  const handleFileUpload = async (uploadFiles: FileList, currentFolderId: string | null) => {
    
    const toastId = toast.loading(`Uploading ${uploadFiles.length} file(s)...`);
    
    setState(prev => ({ ...prev, isUploading: true, uploadProgress: 0 }));

    try {
      const formData = new FormData();
      Array.from(uploadFiles).forEach(file => {
        formData.append('files', file);
      });
      formData.append('userId', userId);

      if (currentFolderId) {
        formData.append('parentId', currentFolderId);
      } 
      
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
        toast.success(data.message, { id: toastId });

        // Show warnings if there were any errors
        if (data.errors && data.errors.length > 0) {
          toast.error(data.errors, { id: toastId });
        }
      }
    } catch (error) {
      console.error('Upload failed:', error);
      toast.error(error instanceof Error ? error.message : 'Upload failed', { id: toastId });
    } finally {
      setState(prev => ({ ...prev, isUploading: false }));
    }
  };

  const toggleStar = async (fileId: string) => {
    setState(prev => ({ ...prev, isOperating: true }));

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

      toast.success(data.message);

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

      toast.success(data.message);

      // Update with server response
      setFiles(prevFiles => prevFiles.map(file =>
        file.id === fileId ? data.file : file
      ));


    } catch (error) {
      // Revert optimistic update
      setFiles(previousFiles);
      console.error('Failed to move to trash:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to trash file');

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

      toast.success(data.message);

      // Update with server response
      setFiles(prevFiles => prevFiles.map(file =>
        file.id === fileId ? data.file : file
      ));


    } catch (error) {
      // Revert optimistic update
      setFiles(previousFiles);
      console.error('Failed to restore file:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to restore file');

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

      toast.success(data.message)

      setFiles(files.filter(file => !file.isTrash));

    } catch (error) {
      console.error('Failed to empty trash:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to empty trash');

    } finally {
      setState(prev => ({ ...prev, isOperating: false }));
    }
  };


  const deleteFilePermanently = async (fileId: string) => {
    setState(prev => ({ ...prev, isOperating: true }));

    // Optimistic update - remove file immediately
    const previousFiles = [...files];

    try {
      const response = await fetch(`/api/files/${fileId}/delete`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete file permanently');
      }

      if (data.deletedIds && data.deletedIds.length > 0) {

        setFiles(prevFiles => prevFiles.filter(file => !data.deletedIds.includes(file.id)));
      } else {

        // Fallback for single file deletion if API doesn't return array
        setFiles(prevFiles => prevFiles.filter(file => file.id !== fileId));
      }

      toast.success(data.message)

    } catch (error) {

      // Revert optimistic update on failure
      setFiles(previousFiles);
      console.error('Failed to delete file permanently:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete file');

    } finally {

      setState(prev => ({ ...prev, isOperating: false }));
    } 
  };


  const refreshFiles = useCallback(async (currentFolderId?: string | null) => {
    try {

      const parentIdQuery = currentFolderId || 'root';

      const response = await fetch(`/api/files?parentId=${parentIdQuery}&active=true`);
      if (response.ok) {
        const data = await response.json();
        setFiles(data.files || []);
      }

    } catch (error) {
      console.error('Failed to refresh files:', error);
      toast.error('Failed to refresh files');
    }
  }, []);


  const renameItem = async (fileId: string, newName: string) => {

    const fileToRename = files.find(f => f.id === fileId);
    if (!fileToRename) {
      toast.error('File not found');
      return;
    }

    let finalName = newName.trim();

    if (!fileToRename.isFolder && fileToRename.name.includes('.')) {
      const originalExtension = fileToRename.name.split('.').pop();

      // If the user's new name already has an extension, remove it first
      if (finalName.includes('.')) {
        finalName = finalName.substring(0, finalName.lastIndexOf('.'));
      }

      finalName = `${finalName}.${originalExtension}`;
    }

    // Prevent renaming to an empty string
    if (!finalName) {
      toast.error('Name cannot be empty');
      return;
    }

    setState(prev => ({ ...prev, isOperating: true }));

    const previousFiles = [...files];
    setFiles(prev => prev.map(f => (f.id === fileId ? { ...f, name: finalName }
    :f)));

    try {
      
      const response = await fetch(`/api/files/${fileId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: finalName })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to rename');

      setFiles(prev => prev.map(f => (f.id === fileId ? data.file : f)));
      toast.success(data.message)

    } catch (error) {
      setFiles(previousFiles);
      toast.error(error instanceof Error ? error.message : 'Rename failed');

    } finally {
      setState(prev => ({ ...prev, isOperating: true }));
    }
  };


  const moveItem = async (fileId: string, targetFolderId: string | null) => {
    setState(prev => ({ ...prev, isOperating: true }));

    // Optimistic Update: Immediately remove the file from the UI.
    const previousFiles = [...files];
    setFiles(prev => prev.filter(f => f.id !== fileId));

    try {
      const response = await fetch(`/api/files/${fileId}/move`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetFolderId }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to move item');
      }
      
      toast.success(data.message)
      
      // No need to add the file back manually. The parent component will
      // trigger a refresh of the folder contents.

    } catch (error) {
      // Revert on failure
      setFiles(previousFiles);
      toast.error(error instanceof Error ? error.message : 'Failed to move item');
    } finally {
      setState(prev => ({ ...prev, isOperating: false }));
    }
  };


  return {
    files,
    setFiles,
    ...state,
    handleFileUpload,
    toggleStar,
    moveToTrash,
    restoreFile,
    emptyTrash,
    deleteFilePermanently,
    refreshFiles,
    renameItem,
    moveItem
  };
};