// import { useCallback, useState, useMemo } from 'react';
// import type { NewFile } from '@/lib/db/schema';
// import { File } from '@/lib/db/schema';
// import { useUploadProgress } from '@/contexts/UploadProgressContext';

// interface FileOperationResponse {
//   success: boolean;
//   file: NewFile;
//   message: string;
// }

// interface FileManagementState {
//   isUploading: boolean;
//   isOperating: boolean;
//   uploadProgress: number;
// }

// interface FolderState {
//   currentFolderId: string | null;
//   breadcrumbs: Array<{ id: string | null; name: string }>;
//   isLoading: boolean;
// }

// export const useFileManager = (initialFiles: NewFile[], userId: string) => {
//   const { addUpload, updateUploadProgress, finishUpload, setUploadStatus } = useUploadProgress();

//   const [files, setFiles] = useState<NewFile[]>(initialFiles);
//   const [state, setState] = useState<FileManagementState>({
//     isUploading: false,
//     isOperating: false,
//     uploadProgress: 0,
//   });

//   const [folderState, setFolderState] = useState<FolderState>({
//     currentFolderId: null,
//     breadcrumbs: [{ id: null, name: 'Home' }],
//     isLoading: false
//   });

//   const handleFileUpload = useCallback(async (uploadFiles: FileList, currentFolderId: string | null) => {
//     const filesToUpload = Array.from(uploadFiles);

//     const uploadPromises = filesToUpload.map(file => {
//       return new Promise<File>((resolve, reject) => {
//         const uploadId = addUpload(file);
//         const xhr = new XMLHttpRequest();
//         const formData = new FormData();
//         formData.append('files', file);
//         if (currentFolderId) {
//           formData.append('parentId', currentFolderId);
//         }

//         xhr.upload.onprogress = (event) => {
//           if (event.lengthComputable) {
//             const progress = Math.round((event.loaded / event.total) * 95);
//             updateUploadProgress(uploadId, progress);
//           }
//         };

//         xhr.upload.onload = () => {
//           // The browser is done sending. Now the server is processing.
//           setUploadStatus(uploadId, 'processing');
//         };

//         xhr.onload = () => {
//           if (xhr.status >= 200 && xhr.status < 300) {

//             finishUpload(uploadId, 'success');
//             const response = JSON.parse(xhr.responseText);
//             const newFile = response.uploadedFiles[0];
//             resolve(newFile);
//           } else {

//             finishUpload(uploadId, 'error');
//             try {

//               const errorResponse = JSON.parse(xhr.responseText);
//               reject(new Error(errorResponse.error || `Upload failed with status: ${xhr.status}`));
//             } catch {
//               reject(new Error(`Upload failed with status: ${xhr.status}`));
//             }
//           }
//         };

//         xhr.onerror = () => {
//           finishUpload(uploadId, 'error');
//           reject(new Error('Network error during upload.'));
//         };

//         xhr.open('POST', '/api/files/upload', true);
//         xhr.send(formData);
//       });
//     });

//     try {
//       // Use Promise.allSettled to ensure we process every result, even failures
//       const results = await Promise.allSettled(uploadPromises);

//       const successfulUploads: File[] = [];

//       results.forEach((result, index) => {
//         console.log(`--- Ground Truth for Upload #${index + 1} ---`);
//         if (result.status === 'fulfilled') {
//           const newFile = result.value;
//           console.log("API Response Data (Fulfilled):", JSON.stringify(newFile, null, 2));

//           // Validate the object received from the API before adding it
//           if (newFile && typeof newFile === 'object' && 'id' in newFile && 'parentId' in newFile) {
//             successfulUploads.push(newFile);
//           } else {
//             console.error("INVALID DATA RECEIVED: The server response was not a valid file object. File will be skipped.", newFile);
//           }
//         } else {
//           // This will now log the specific error message from the server
//           console.error("UPLOAD PROMISE REJECTED:", result.reason.message);
//         }
//         console.log("------------------------------------");
//       });

//       // Only add valid, successful uploads to the state
//       if (successfulUploads.length > 0) {
//         setFiles(prev => [...prev, ...successfulUploads]);
//       }

//     } catch (error) {
//       throw error;
//     }
//   }, [addUpload, updateUploadProgress, finishUpload, setUploadStatus, setFiles]);


//   const toggleStar = useCallback(async (fileIds: string[]) => {
//     if (fileIds.length === 0) return;

//     const originalFiles = files;
//     const idsToToggle = new Set(fileIds);

//     setState(prev => ({ ...prev, isOperating: true }));

//     setFiles(prev =>
//       prev.map(f => f.id &&
//         idsToToggle.has(f.id) ? { ...f, isStarred: !f.isStarred } : f
//       )
//     );

//     const firstItem = files.find(f => f.id === fileIds[0]);
//     if (!firstItem) return;
//     const isStarring = !firstItem.isStarred;

//     try {

//       await Promise.all(fileIds.map(id =>
//         fetch(`/api/files/${id}/star`, {
//           method: 'PATCH',
//           headers: { 'Content-Type': 'application/json' },
//           body: JSON.stringify({ isStarred: isStarring }),
//         }).then(res => {
//           if (!res.ok) throw new Error(`Failed to update star status for file ${id}.`);
//         })
//       )
//       );
//     } catch (error) {
//       console.error("Failed to toggle star:", error);

//       // 4. REVERT: Change the files state back to what it was before the optimistic update.
//       setFiles(originalFiles);
//       throw error;
//     }
//   }, [files, setFiles]);



//   const moveToTrash = async (fileId: string) => {
//     setState(prev => ({ ...prev, isOperating: true }));

//     // Optimistic update
//     const previousFiles = [...files];
//     setFiles(prevFiles => prevFiles.map(file =>
//       file.id === fileId ? { ...file, isTrash: true } : file
//     ));

//     try {
//       const response = await fetch(`/api/files/${fileId}/trash`, {
//         method: 'PATCH',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ fileId }),
//       });

//       const data: FileOperationResponse = await response.json();

//       if (!response.ok) {
//         throw new Error(data.message || 'Failed to move to trash');
//       }

//       toast.success(data.message);

//       // Update with server response
//       setFiles(prevFiles => prevFiles.map(file =>
//         file.id === fileId ? data.file : file
//       ));


//     } catch (error) {
//       // Revert optimistic update
//       setFiles(previousFiles);
//       console.error('Failed to move to trash:', error);
//       toast.error(error instanceof Error ? error.message : 'Failed to trash file');

//     } finally {
//       setState(prev => ({ ...prev, isOperating: false }));
//     }
//   };

//   const restoreFile = async (fileId: string) => {
//     setState(prev => ({ ...prev, isOperating: true }));

//     // Optimistic update
//     const previousFiles = [...files];
//     setFiles(prevFiles => prevFiles.map(file =>
//       file.id === fileId ? { ...file, isTrash: false } : file
//     ));

//     try {
//       const response = await fetch(`/api/files/${fileId}/restore`, {
//         method: 'PATCH',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ fileId }),
//       });

//       const data: FileOperationResponse = await response.json();

//       if (!response.ok) {
//         throw new Error(data.message || 'Failed to restore file');
//       }

//       toast.success(data.message);

//       // Update with server response
//       setFiles(prevFiles => prevFiles.map(file =>
//         file.id === fileId ? data.file : file
//       ));


//     } catch (error) {
//       // Revert optimistic update
//       setFiles(previousFiles);
//       console.error('Failed to restore file:', error);
//       toast.error(error instanceof Error ? error.message : 'Failed to restore file');

//     } finally {
//       setState(prev => ({ ...prev, isOperating: false }));
//     }
//   };

//   const emptyTrash = async () => {
//     setState(prev => ({ ...prev, isOperating: true }));

//     try {
//       const response = await fetch('/api/files/empty-trash', {
//         method: 'DELETE',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ userId }),
//       });

//       const data = await response.json();

//       if (!response.ok) {
//         throw new Error(data.message || 'Failed to empty trash');
//       }

//       toast.success(data.message)

//       setFiles(files.filter(file => !file.isTrash));

//     } catch (error) {
//       console.error('Failed to empty trash:', error);
//       toast.error(error instanceof Error ? error.message : 'Failed to empty trash');

//     } finally {
//       setState(prev => ({ ...prev, isOperating: false }));
//     }
//   };


//   const deleteFilePermanently = async (fileId: string) => {
//     setState(prev => ({ ...prev, isOperating: true }));

//     // Optimistic update - remove file immediately
//     const previousFiles = [...files];

//     try {
//       const response = await fetch(`/api/files/${fileId}/delete`, {
//         method: 'DELETE',
//         headers: { 'Content-Type': 'application/json' },
//       });

//       const data = await response.json();

//       if (!response.ok) {
//         throw new Error(data.message || 'Failed to delete file permanently');
//       }

//       if (data.deletedIds && data.deletedIds.length > 0) {

//         setFiles(prevFiles => prevFiles.filter(file => !data.deletedIds.includes(file.id)));
//       } else {

//         // Fallback for single file deletion if API doesn't return array
//         setFiles(prevFiles => prevFiles.filter(file => file.id !== fileId));
//       }

//       toast.success(data.message)

//     } catch (error) {

//       // Revert optimistic update on failure
//       setFiles(previousFiles);
//       console.error('Failed to delete file permanently:', error);
//       toast.error(error instanceof Error ? error.message : 'Failed to delete file');

//     } finally {

//       setState(prev => ({ ...prev, isOperating: false }));
//     }
//   };


//   const refreshFiles = useCallback(async (currentFolderId?: string | null) => {
//     try {

//       const parentIdQuery = currentFolderId || 'root';

//       const response = await fetch(`/api/files?parentId=${parentIdQuery}&active=true`);
//       if (response.ok) {
//         const data = await response.json();
//         setFiles(data.files || []);
//       }

//     } catch (error) {
//       console.error('Failed to refresh files:', error);
//       toast.error('Failed to refresh files');
//     }
//   }, []);


//   const renameItem = async (fileId: string, newName: string) => {

//     const fileToRename = files.find(f => f.id === fileId);
//     if (!fileToRename) {
//       toast.error('File not found');
//       return;
//     }

//     let finalName = newName.trim();

//     if (!fileToRename.isFolder && fileToRename.name.includes('.')) {
//       const originalExtension = fileToRename.name.split('.').pop();

//       // If the user's new name already has an extension, remove it first
//       if (finalName.includes('.')) {
//         finalName = finalName.substring(0, finalName.lastIndexOf('.'));
//       }

//       finalName = `${finalName}.${originalExtension}`;
//     }

//     // Prevent renaming to an empty string
//     if (!finalName) {
//       toast.error('Name cannot be empty');
//       return;
//     }

//     setState(prev => ({ ...prev, isOperating: true }));

//     const previousFiles = [...files];
//     setFiles(prev => prev.map(f => (f.id === fileId ? { ...f, name: finalName }
//       : f)));

//     try {

//       const response = await fetch(`/api/files/${fileId}`, {
//         method: 'PATCH',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ name: finalName })
//       });

//       const data = await response.json();
//       if (!response.ok) throw new Error(data.message || 'Failed to rename');

//       setFiles(prev => prev.map(f => (f.id === fileId ? data.file : f)));
//       toast.success(data.message)

//     } catch (error) {
//       setFiles(previousFiles);
//       toast.error(error instanceof Error ? error.message : 'Rename failed');

//     } finally {
//       setState(prev => ({ ...prev, isOperating: true }));
//     }
//   };


//   const moveItem = async (fileId: string, targetFolderId: string | null) => {
//     setState(prev => ({ ...prev, isOperating: true }));

//     // Optimistic Update: Immediately remove the file from the UI.
//     const previousFiles = [...files];
//     setFiles(prev => prev.filter(f => f.id !== fileId));

//     try {
//       const response = await fetch(`/api/files/${fileId}/move`, {
//         method: 'PATCH',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ targetFolderId }),
//       });

//       const data = await response.json();
//       if (!response.ok) {
//         throw new Error(data.error || 'Failed to move item');
//       }

//       toast.success(data.message)

//       // No need to add the file back manually. The parent component will
//       // trigger a refresh of the folder contents.

//     } catch (error) {
//       // Revert on failure
//       setFiles(previousFiles);
//       toast.error(error instanceof Error ? error.message : 'Failed to move item');
//     } finally {
//       setState(prev => ({ ...prev, isOperating: false }));
//     }
//   };

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

//     setFiles(prev => prev.filter(f => f.id !== fileId));

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
//   }, [setFiles]);


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

//     const idsToMove = new Set(itemIds);
//     setFiles(prev => prev.filter(f => f.id && !idsToMove.has(f.id)));

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
//   }, [setFiles]);


//   const bulkCopyFiles = useCallback(async (itemIds: string[], targetFolderId: string | null): Promise<File[]> => {

//     const fetchPromise = fetch('/api/files/bulk-copy', {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({ itemIds, targetFolderId }),
//     }).then(async (res) => {
//       const data = await res.json();
//       if (!res.ok) throw new Error(data.message || 'Failed to copy items.');
//       return data.files;
//     });

//     toast.promise(fetchPromise, {
//       loading: `Copying ${itemIds.length} item(s)...`,
//       success: `Copied ${itemIds.length} item(s) successfully.`,
//       error: (err: Error) => err.message || 'An error occurred while copying.',
//     });

//     return fetchPromise;
//   }, []);


//   // Navigate up in breadcrumbs
//   const navigateToBreadcrumb = useCallback((index: number) => {
//     const targetBreadcrumb = folderState.breadcrumbs[index];
//     if (targetBreadcrumb) {
//       navigateToFolder(targetBreadcrumb.id, targetBreadcrumb.name);
//     }
//   }, [folderState.breadcrumbs, navigateToFolder]);


//   return {
//     // File state
//     files,
//     setFiles,
//     isUploading: state.isUploading,
//     isOperating: state.isOperating,
//     uploadProgress: state.uploadProgress,

//     // Folder state
//     currentFolderId: folderState.currentFolderId,
//     breadcrumbs: folderState.breadcrumbs,
//     isLoading: folderState.isLoading,

//     // Functions
//     handleFileUpload,
//     toggleStar,
//     moveFile,
//     copyFile,
//     createFolder,
//     navigateToFolder,
//     moveToTrash,
//     restoreFile,
//     emptyTrash,
//     deleteFilePermanently,
//     refreshFiles,
//     renameItem,
//     moveItem,
//     deleteFolder,
//     bulkMoveFiles,
//     bulkCopyFiles,
//     navigateToBreadcrumb
//   };
// };