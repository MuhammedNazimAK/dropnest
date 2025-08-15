import { useState, useCallback } from 'react';
import { useNotification } from '@/contexts/NotificationContext';

interface FolderState {
  currentFolderId: string | null;
  breadcrumbs: Array<{ id: string | null; name: string }>;
  isLoading: boolean;
}

export function useFolderManagement() {
  const [folderState, setFolderState] = useState<FolderState>({
    currentFolderId: null,
    breadcrumbs: [{ id: null, name: 'Home' }],
    isLoading: false
  });

  const { showNotification } = useNotification();

  // Navigate to folder
  const navigateToFolder = useCallback(async (folderId: string | null, folderName?: string) => {
    setFolderState(prev => ({ ...prev, isLoading: true }));

    try {
      if (folderId === null) {
        // Navigate to root
        setFolderState({
          currentFolderId: null,
          breadcrumbs: [{ id: null, name: 'Home' }],
          isLoading: false
        });
        return;
      }

      // If folderName not provided, we might need to fetch it
      if (!folderName) {
        const response = await fetch(`/api/files?folderId=${folderId}`);
        const data = await response.json();
        if (data.folder) {
          folderName = data.folder.name;
        }
      }

      // Build breadcrumbs by traversing up the folder hierarchy
      const breadcrumbs = await buildBreadcrumbs(folderId);
      
      setFolderState({
        currentFolderId: folderId,
        breadcrumbs,
        isLoading: false
      });

    } catch (error) {
      console.error('Error navigating to folder:', error);
      showNotification('error', 'Failed to open folder');
      setFolderState(prev => ({ ...prev, isLoading: false }));
    }
  }, [showNotification]);

  // Build breadcrumb trail
  const buildBreadcrumbs = async (folderId: string): Promise<Array<{ id: string | null; name: string }>> => {
    const breadcrumbs = [{ id: null, name: 'Home' }];
    let currentId = folderId;

    const folderChain: Array<{ id: string; name: string }> = [];

    // Get folder hierarchy
    while (currentId) {
      try {
        const response = await fetch(`/api/files?folderId=${currentId}`);
        const data = await response.json();
        
        if (data.folder) {
          folderChain.unshift({ id: currentId, name: data.folder.name });
          currentId = data.folder.parentId;
        } else {
          break;
        }
      } catch {
        break;
      }
    }

    return [...breadcrumbs, ...folderChain];
  };

  // Create folder
  const createFolder = useCallback(async (name: string, parentId: string | null) => {
    try {
      const response = await fetch('/api/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name, 
          parentId: parentId 
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create folder');
      }

      showNotification('success', `Folder "${name}" created successfully`);
      return data.folder;

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create folder';
      showNotification('error', message);
      throw error;
    }
  }, [folderState.currentFolderId, showNotification]);


  // Delete folder
  const deleteFolder = useCallback(async (folderId: string) => {
    try {
      const response = await fetch(`/api/folders/${folderId}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete folder');
      }

      showNotification('success', 'Folder moved to trash');
      return data.folder;

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete folder';
      showNotification('error', message);
      throw error;
    }
  }, [showNotification]);


  // Move file to folder
  const moveFile = useCallback(async (fileId: string, targetFolderId: string | null) => {
    try {
      const response = await fetch(`/api/files/${fileId}/move`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetFolderId })
      });

      const contentType = response.headers.get("content-type");
      if (!response.ok) {
        // Try to parse error json, but fallback if it's not there
        let errorData = { error: `Failed to move file with status: ${response.status}` };
        if (contentType && contentType.indexOf("application/json") !== -1) {
            errorData = await response.json();
        }
        throw new Error(errorData.error);
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to move file');
      }

      const targetName = targetFolderId ? 'folder' : 'root';
      showNotification('success', `File moved to ${targetName}`);
      return data.file;

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to move file';
      showNotification('error', message);
      throw error;
    }
  }, [showNotification]);


   const copyFile = useCallback(async (fileId: string, targetFolderId: string | null) => {
    try {
      const response = await fetch(`/api/files/${fileId}/copy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetFolderId })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to copy file');
      }
      
      showNotification('success', data.message);
      // Return the new file data so the UI can add it to the state
      return data.file;

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to copy file';
      showNotification('error', message);
      throw error;
    }
  }, [showNotification]);


  // Navigate up in breadcrumbs
  const navigateToBreadcrumb = useCallback((index: number) => {
    const targetBreadcrumb = folderState.breadcrumbs[index];
    if (targetBreadcrumb) {
      navigateToFolder(targetBreadcrumb.id, targetBreadcrumb.name);
    }
  }, [folderState.breadcrumbs, navigateToFolder]);

  return {
    // State
    currentFolderId: folderState.currentFolderId,
    breadcrumbs: folderState.breadcrumbs,
    isLoading: folderState.isLoading,
    
    // Actions
    navigateToFolder,
    navigateToBreadcrumb,
    createFolder,
    deleteFolder,
    moveFile,
    copyFile
  };
}