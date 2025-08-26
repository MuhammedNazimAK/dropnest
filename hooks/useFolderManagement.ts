/**
 * @deprecated This hook has been deprecated and its logic has been merged into hooks/useFileManager.ts.
 * 
 * Reason for deprecation: The state and logic for file management (e.g., the `files` array) and
 * folder management (e.g., `currentFolderId`) were too tightly coupled. To simplify state
 * management, provide optimistic UI updates for move/copy operations, and create a single
 * source of truth, all functionality was consolidated into the `useFileManager` hook.
 * 
 * This file is kept for historical reference and should not be used in the application.
 * 
 * Date of deprecation: [August 25, 2025]
 */

// import { useState, useCallback } from 'react';
// import { toast } from 'sonner';


// interface FolderState {
//   currentFolderId: string | null;
//   breadcrumbs: Array<{ id: string | null; name: string }>;
//   isLoading: boolean;
// }

// export function useFolderManagement() {
//   const [folderState, setFolderState] = useState<FolderState>({
//     currentFolderId: null,
//     breadcrumbs: [{ id: null, name: 'Home' }],
//     isLoading: false
//   });

//   // Navigate to folder
//   const navigateToFolder = useCallback(async (folderId: string | null, folderName?: string) => {
//     setFolderState(prev => ({ ...prev, isLoading: true }));

//     try {
//       if (folderId === null) {
//         // Navigate to root
//         setFolderState({
//           currentFolderId: null,
//           breadcrumbs: [{ id: null, name: 'Home' }],
//           isLoading: false
//         });
//         return;
//       }

//       // If folderName not provided, we might need to fetch it
//       if (!folderName) {
//         const response = await fetch(`/api/files?folderId=${folderId}`);
//         const data = await response.json();
//         if (data.folder) {
//           folderName = data.folder.name;
//         }
//       }

//       // Build breadcrumbs by traversing up the folder hierarchy
//       const breadcrumbs = await buildBreadcrumbs(folderId);

//       setFolderState({
//         currentFolderId: folderId,
//         breadcrumbs,
//         isLoading: false
//       });

//     } catch (error) {
//       console.error('Error navigating to folder:', error);
//       setFolderState(prev => ({ ...prev, isLoading: false }));
//     }
//   }, []);

//   // Build breadcrumb trail
//   const buildBreadcrumbs = async (folderId: string): Promise<Array<{ id: string | null; name: string }>> => {
//     const breadcrumbs = [{ id: null, name: 'Home' }];
//     let currentId = folderId;

//     const folderChain: Array<{ id: string; name: string }> = [];

//     // Get folder hierarchy
//     while (currentId) {
//       try {
//         const response = await fetch(`/api/files?folderId=${currentId}`);
//         const data = await response.json();

//         if (data.folder) {
//           folderChain.unshift({ id: currentId, name: data.folder.name });
//           currentId = data.folder.parentId;
//         } else {
//           break;
//         }
//       } catch {
//         break;
//       }
//     }

//     return [...breadcrumbs, ...folderChain];
//   };

//   // Create folder
//   const createFolder = useCallback(async (name: string, parentId: string | null) => {

//     const toastId = toast.loading("Folder creating...")

//     try {
//       const response = await fetch('/api/folders', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({
//           name,
//           parentId: parentId
//         })
//       });

//       const data = await response.json();

//       if (!response.ok) {
//         throw new Error(data.error || 'Failed to create folder');
//       }

//       toast.success(data.message, { id: toastId });
//       return data.folder;

//     } catch (error) {
//       const message = error instanceof Error ? error.message : 'Failed to create folder';
//       toast.error(message, { id: toastId });
//       throw error;
//     }
//   }, [folderState.currentFolderId]);


//   // Delete folder
//   const deleteFolder = useCallback(async (folderId: string) => {

//     const toastId = toast.loading("deleting folder...");

//     try {
//       const response = await fetch(`/api/folders/${folderId}`, {
//         method: 'DELETE'
//       });

//       const data = await response.json();

//       if (!response.ok) {
//         throw new Error(data.error || 'Failed to delete folder');
//       }

//       toast.success(data.message, { id: toastId });
//       return data.folder;

//     } catch (error) {
//       const message = error instanceof Error ? error.message : 'Failed to delete folder';
//       toast.error(message, { id: toastId });
//       throw error;
//     }
//   }, []);


//   // Move file to folder
//   const moveFile = useCallback(async (fileId: string, targetFolderId: string | null) => {

//     const toastId = toast.loading("Moving item...");

//     try {
//       const response = await fetch(`/api/files/${fileId}/move`, {
//         method: 'PATCH',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ targetFolderId })
//       });

//       const contentType = response.headers.get("content-type");
//       if (!response.ok) {
//         // Try to parse error json, but fallback if it's not there
//         let errorData = { error: `Failed to move file with status: ${response.status}` };
//         if (contentType && contentType.indexOf("application/json") !== -1) {
//           errorData = await response.json();
//         }
//         throw new Error(errorData.error);
//       }

//       const data = await response.json();

//       if (!response.ok) {
//         throw new Error(data.error || 'Failed to move file');
//       }

//       toast.success(data.message, { id: toastId });
//       return data.file;

//     } catch (error) {
//       const message = error instanceof Error ? error.message : 'Failed to move file';
//       toast.error(message, { id: toastId });
//       throw error;
//     }
//   }, []);


//   const copyFile = useCallback(async (fileId: string, targetFolderId: string | null) => {

//     const toastId = toast.loading("Copying file...");

//     try {
//       const response = await fetch(`/api/files/${fileId}/copy`, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ targetFolderId })
//       });

//       const data = await response.json();
//       if (!response.ok) {
//         throw new Error(data.message || 'Failed to copy file');
//       }

//       toast.success(data.message, { id: toastId });
//       // Return the new file data so the UI can add it to the state
//       return data.file;

//     } catch (error) {
//       const message = error instanceof Error ? error.message : 'Failed to copy file';
//       toast.error(message, { id: toastId });
//       throw error;
//     }
//   }, []);


//   const bulkMoveFiles = useCallback(async (itemIds: string[], targetFolderId: string | null) => {

//     toast.promise(
//       fetch('/api/files/bulk-move', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ itemIds, targetFolderId }),

//       }).then(res => {
//         if (!res.ok) throw new Error('Failed to move items.');
//         return res.json();
//       }),
//       {
//         loading: `Moving ${itemIds.length} item(s)...`,
//         success: `Moved ${itemIds.length} item(s) successfully.`,
//         error: 'An error occurred while moving.',
//       }

//     );
//   }, []);


//   // Navigate up in breadcrumbs
//   const navigateToBreadcrumb = useCallback((index: number) => {
//     const targetBreadcrumb = folderState.breadcrumbs[index];
//     if (targetBreadcrumb) {
//       navigateToFolder(targetBreadcrumb.id, targetBreadcrumb.name);
//     }
//   }, [folderState.breadcrumbs, navigateToFolder]);

//   return {
//     // State
//     currentFolderId: folderState.currentFolderId,
//     breadcrumbs: folderState.breadcrumbs,
//     isLoading: folderState.isLoading,

//     // Actions
//     navigateToFolder,
//     navigateToBreadcrumb,
//     createFolder,
//     deleteFolder,
//     moveFile,
//     copyFile,
//     bulkMoveFiles
//   };
// }