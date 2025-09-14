import { create } from 'zustand';
import { type File as DbFile } from '@/lib/db/schema';
import { createId } from '@paralleldrive/cuid2';
import { StateCreator } from 'zustand';


export type FileStatus = 'loading' | 'success' | 'error';

export interface UploadTask {
    id: string;
    file: File;
    progress: number;
    status: 'uploading' | 'processing' | 'success' | 'error';
}

export interface OperationTask {
    id: string;
    type: 'move' | 'copy' | 'delete' | 'trash';
    status: 'in-progress' | 'success' | 'error';
    progress: number;
    itemCount: number;
    sourceNames: string[];
    createdAt: Date;
}

interface Breadcrumb {
    id: string | null;
    name: string;
}

interface FileStoreState {
    files: Required<DbFile>[];
    currentFolderId: string | null;
    breadcrumbs: Breadcrumb[];
    fileStatuses: Record<string, FileStatus>;
    uploadTasks: UploadTask[];
    operationTasks: OperationTask[];

    selectedIds: Set<string>;
    lastSelectedId: string | null;
    activeFilter: 'all' | 'starred' | 'trash';

    initializeFiles: (files: Required<DbFile>[]) => void;
    setFiles: (files: Required<DbFile>[] | ((prev: Required<DbFile>[]) => Required<DbFile>[])) => void;
    setFileStatus: (fileIds: string[], status: FileStatus | null) => void;

    navigateToFolder: (folderId: string | null, folderName?: string) => void;
    navigateToBreadcrumb: (index: number) => void;

    refreshFiles: (folderId?: string | null) => Promise<void>;

    toggleStar: (fileIds: string[]) => Promise<void>;
    moveToTrash: (fileIds: string[]) => Promise<void>;
    restoreFile: (fileIds: string[]) => Promise<void>;
    deleteFilePermanently: (fileIds: string[]) => Promise<void>;
    emptyTrash: () => Promise<void>;
    renameItem: (fileId: string, newName: string) => Promise<void>;
    moveFiles: (fileIds: string[], targetFolderId: string | null) => Promise<void>;
    copyFiles: (fileIds: string[], targetFolderId: string | null) => Promise<void>;
    createFolder: (name: string, parentId: string | null) => Promise<DbFile>;
    uploadFiles: (files: FileList, parentId: string | null) => void;

    setSelectedIds: (selectedIds: Set<string>) => void;
    setLastSelectedId: (id: string | null) => void;
    clearSelection: () => void;
    handleSelection: (fileId: string, isCtrlKeyPressed: boolean, isShiftKeyPressed: boolean) => void;

    setActiveFilter: (filter: 'all' | 'starred' | 'trash') => void;

    clearCompletedUploads: () => void;
    clearCompletedTasks: () => void;
}

const createFileSlice: StateCreator<FileStoreState> = (set, get) => ({

    files: [],
    currentFolderId: null,
    breadcrumbs: [{ id: null, name: 'Home' }],
    fileStatuses: {},
    uploadTasks: [],
    operationTasks: [],
    isOperating: false,
    selectedIds: new Set(),
    lastSelectedId: null,
    activeFilter: 'all',

    // --- CORE STATE MANAGEMENT ---
    initializeFiles: (files) => set({ files }),

    setFileStatus: (fileIds, status) => {
        set(state => {
            const newStatuses = { ...state.fileStatuses };
            if (status === null) {
                // Null status means we clear it from the map
                fileIds.forEach(id => delete newStatuses[id]);
            } else {
                fileIds.forEach(id => newStatuses[id] = status);
            }
            return { fileStatuses: newStatuses };
        });
    },

    setFiles: (filesOrUpdater) => {
        if (typeof filesOrUpdater === 'function') {
            set(state => ({ files: filesOrUpdater(state.files) }));
        } else {
            set({ files: filesOrUpdater });
        }
    },

    // --- NAVIGATION ---
    navigateToFolder: async (folderId, folderName = 'Folder') => {

        const { refreshFiles, currentFolderId } = get();

        if (currentFolderId === folderId) return;

        set(state => ({
            currentFolderId: folderId,
            breadcrumbs: [...state.breadcrumbs, { id: folderId, name: folderName }],
            selectedIds: new Set(),
            lastSelectedId: null,
        }));

        try {
            await refreshFiles(folderId);
        } catch (error) {
            console.error("Failed to load folder contents:", error);
        }
    },

    navigateToBreadcrumb: async (index) => {

        const { refreshFiles, breadcrumbs } = get();

        const newBreadcrumbs = breadcrumbs.slice(0, index + 1);
        const newFolderId = newBreadcrumbs[index].id;

        set({
            breadcrumbs: newBreadcrumbs,
            currentFolderId: newFolderId,
            selectedIds: new Set(),
            lastSelectedId: null,
        });

        try {
            await refreshFiles(newFolderId);
        } catch (error) {
            console.error("Failed to load folder contents:", error);
        }
    },

    buildBreadcrumbs: async (folderId: string) => {
        const breadcrumbs = [{ id: null, name: 'Home' }];
        let currentId = folderId;
        const folderChain: Array<{ id: string; name: string }> = [];

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
    },

    // --- DATA FETCHING ---
    refreshFiles: async (folderId) => {
        const { currentFolderId } = get();
        const targetFolderId = folderId !== undefined ? folderId : currentFolderId;

        try {
            const parentIdQuery = targetFolderId || 'root';
            const response = await fetch(`/api/files?parentId=${parentIdQuery}&active=true`);

            if (response.ok) {
                const data = await response.json();
                set({ files: data.files || [] });
            }
        } catch (error) {
            console.error('Failed to refresh files:', error);
            throw error;
        }
    },

    // --- FILE OPERATIONS ---
    toggleStar: async (fileIds: string[]) => {
        if (fileIds.length === 0) return;

        const { setFileStatus } = get();
        const originalFiles = get().files;
        const idsToToggle = new Set(fileIds);

        // Optimistic update
        set(state => ({
            files: state.files.map(f =>
                idsToToggle.has(f.id) ? { ...f, isStarred: !f.isStarred } : f
            ),
        }));

        const firstItem = originalFiles.find(f => fileIds.includes(f.id));
        if (!firstItem) return;
        const isStarring = !firstItem.isStarred;

        try {
            await Promise.all(
                fileIds.map(id =>
                    fetch(`/api/files/${id}/star`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ isStarred: isStarring }),
                    }).then(res => {
                        if (!res.ok) throw new Error('Failed to toggle star');
                        return res.json();
                    })
                )
            );
        } catch (error) {
            setFileStatus(fileIds, 'error');
            set({ files: originalFiles });
            setTimeout(() => setFileStatus(fileIds, null), 2000);
            throw error;
        }
    },

    moveToTrash: async (fileIds: string[]) => {
        if (fileIds.length === 0) return;

        const { setFileStatus } = get();
        setFileStatus(fileIds, 'loading');

        set(state => ({
            files: state.files.map(file =>
                fileIds.includes(file.id) ? { ...file, isTrash: true } : file
            ),
            selectedIds: new Set(),
            lastSelectedId: null,
        }));

        try {
            await Promise.all(
                fileIds.map(fileId =>
                    fetch(`/api/files/${fileId}/trash`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                    }).then(res => {
                        if (!res.ok) throw new Error('Failed to move to trash');
                    })
                )
            );

            setFileStatus(fileIds, null);

        } catch (error) {
            console.error("Move to trash failed, reverting state:", error);

            set(state => ({
                files: state.files.map(file =>
                    fileIds.includes(file.id) ? { ...file, isTrash: false } : file
                ),
            }));
            setFileStatus(fileIds, 'error');
            throw error;

        } finally {
            setTimeout(() => setFileStatus(fileIds, null), 2000);
        }
    },

    restoreFile: async (fileIds: string[]) => {
        if (fileIds.length === 0) return;

        const { setFileStatus } = get();
        setFileStatus(fileIds, 'loading');
        const originalFiles = get().files;
        const idsToRestore = new Set(fileIds);

        try {
            await Promise.all(
                fileIds.map(async (fileId) => {
                    const response = await fetch(`/api/files/${fileId}/restore`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ fileId }),
                    });

                    if (!response.ok) throw new Error('Failed to restore file');

                    set(state => ({ files: state.files.map(file => idsToRestore.has(file.id) ? { ...file, isTrash: false } : file) }));
                    setFileStatus(fileIds, 'success');

                    return response.json();
                })
            );
        } catch (error) {
            set({ files: originalFiles });
            setFileStatus(fileIds, 'error');
            throw error;
        } finally {
            setTimeout(() => setFileStatus(fileIds, null), 2000);
        }
    },

    deleteFilePermanently: async (fileIds: string[]) => {
        const { setFileStatus } = get();
        const originalFiles = get().files;

        setFileStatus(fileIds, 'loading');

        const filesToDelete = originalFiles.filter(f => fileIds.includes(f.id));
        if (filesToDelete.length === 0) {
            setFileStatus(fileIds, null);
            return;
        }

        const taskId = createId();
        const newTask: OperationTask = {
            id: taskId,
            type: 'delete',
            status: 'in-progress',
            progress: 0,
            itemCount: filesToDelete.length,
            sourceNames: filesToDelete.map(f => f.name),
            createdAt: new Date(),
        };

        set(state => ({ operationTasks: [...state.operationTasks, newTask] }));

        const updateTask = (updates: Partial<OperationTask>) => {
            set(state => ({
                operationTasks: state.operationTasks.map(t =>
                    t.id === taskId ? { ...t, ...updates } : t
                ),
            }));
        };

        set(state => ({ files: state.files.filter(f => !fileIds.includes(f.id)) }));

        try {
            let completedCount = 0;

            for (const file of filesToDelete) {
                const response = await fetch(`/api/files/${file.id}/delete`, {
                    method: 'DELETE',
                });

                if (!response.ok) {
                    throw new Error(`Failed to delete "${file.name}"`);
                }

                completedCount++;
                updateTask({ progress: (completedCount / filesToDelete.length) * 100 });
            }
            updateTask({ status: 'success' });
            setFileStatus(fileIds, null);

        } catch (error) {
            set({ files: originalFiles });
            updateTask({ status: 'error' });
            setFileStatus(fileIds, 'error');
            throw error;
        } finally {
            setTimeout(() => setFileStatus(fileIds, null), 2000);
        }
    },

    emptyTrash: async () => {
        const { refreshFiles } = get();

        const taskId = createId();
        const newTask: OperationTask = {
            id: taskId,
            type: 'delete',
            status: 'in-progress',
            progress: 0,
            itemCount: 1,
            sourceNames: ['All items in Trash'],
            createdAt: new Date(),
        };

        set(state => ({ operationTasks: [...state.operationTasks, newTask] }));

        const updateTask = (updates: Partial<OperationTask>) => {
            set(state => ({
                operationTasks: state.operationTasks.map(t =>
                    t.id === taskId ? { ...t, ...updates } : t
                ),
            }));
        };

        set({ files: [], selectedIds: new Set() });

        try {
            const response = await fetch('/api/files/empty-trash', {
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error('Failed to empty trash');
            }

            updateTask({ status: 'success', progress: 100 });

        } catch (error) {
            updateTask({ status: 'error' });
            await refreshFiles();

            throw error;
        }
    },

    renameItem: async (fileId: string, newName: string) => {
        const { files } = get();
        const { setFileStatus } = get();
        const fileToRename = files.find(f => f.id === fileId);

        if (!fileToRename) {
            throw new Error('File not found');
        }

        let finalName = newName.trim();

        // Handle file extension preservation
        if (!fileToRename.isFolder && fileToRename.name.includes('.')) {
            const originalExtension = fileToRename.name.split('.').pop();
            if (finalName.includes('.')) {
                finalName = finalName.substring(0, finalName.lastIndexOf('.'));
            }
            finalName = `${finalName}.${originalExtension}`;
        }

        if (!finalName) {
            throw new Error('Name cannot be empty');
        }

        const originalFiles = [...files];

        // Optimistic update
        set(state => ({
            isOperating: true,
            files: state.files.map(f =>
                f.id === fileId ? { ...f, name: finalName } : f
            ),
        }));

        try {
            const response = await fetch(`/api/files/${fileId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: finalName }),
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Failed to rename');
            }

            // Update with server response
            set(state => ({
                files: state.files.map(f => f.id === fileId ? data.file : f),
            }));

        } catch (error) {
            set({ files: originalFiles });
            setFileStatus([fileId], 'error');
            setTimeout(() => setFileStatus([fileId], null), 2000);
            throw error;
        }
    },

    moveFiles: async (fileIds: string[], targetFolderId: string | null) => {
        const { setFileStatus, refreshFiles } = get();
        const originalFiles = get().files;

        const taskId = createId();
        const filesToMove = originalFiles.filter(f => fileIds.includes(f.id));
        if (filesToMove.length === 0) return;
        setFileStatus(fileIds, 'loading');

        const newTask: OperationTask = {
            id: taskId,
            type: 'move',
            status: 'in-progress',
            progress: 0,
            itemCount: fileIds.length,
            sourceNames: filesToMove.map(f => f.name),
            createdAt: new Date(),
        };

        set(state => ({ operationTasks: [...state.operationTasks, newTask] }));

        const updateTask = (updates: Partial<OperationTask>) => {
            set(state => ({
                operationTasks: state.operationTasks.map(t =>
                    t.id === taskId ? { ...t, ...updates } : t
                ),
            }));
        };

        try {
            let completedCount = 0;
            for (const file of filesToMove) {
                const response = await fetch(`/api/files/${file.id}/move`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ targetFolderId }),
                });

                if (!response.ok) {
                    throw new Error(`Failed to move "${file.name}"`);
                }

                set(state => ({ files: state.files.filter(f => f.id !== file.id) }));

                completedCount++;
                updateTask({ progress: (completedCount / filesToMove.length) * 100 });
            }

            updateTask({ status: 'success' });
            setFileStatus(fileIds, null);

            if (get().currentFolderId === targetFolderId) {
                await refreshFiles();
            }

        } catch (error) {
            set({ files: originalFiles });
            updateTask({ status: 'error' });

            await refreshFiles();

            setFileStatus(fileIds, 'error');
            setTimeout(() => setFileStatus(fileIds, null), 2000);

            throw error;
        }
    },

    copyFiles: async (fileIds: string[], targetFolderId: string | null) => {
        const { setFileStatus, refreshFiles } = get();
        const originalFiles = get().files;

        setFileStatus(fileIds, 'loading');

        const filesToCopy = originalFiles.filter(f => fileIds.includes(f.id));
        if (filesToCopy.length === 0) {
            setFileStatus(fileIds, null);
            return;
        }

        const taskId = createId();
        const newTask: OperationTask = {
            id: taskId,
            type: 'copy',
            status: 'in-progress',
            progress: 0,
            itemCount: filesToCopy.length,
            sourceNames: filesToCopy.map(f => f.name),
            createdAt: new Date(),
        }

        set(state => ({ operationTasks: [...state.operationTasks, newTask] }));

        const updateTask = (updates: Partial<OperationTask>) => {
            set(state => ({
                operationTasks: state.operationTasks.map(t =>
                    t.id === taskId ? { ...t, ...updates } : t
                ),
            }));
        };

        try {

            let completedCount = 0;

            for (const file of filesToCopy) {
                const response = await fetch(`/api/files/${file.id}/copy`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ targetFolderId }),
                });

                if (!response.ok) {
                    throw new Error(`Failed to copy "${file.name}"`);
                }

                completedCount++;
                updateTask({ progress: (completedCount / filesToCopy.length) * 100 });
            }

            updateTask({ status: 'success' });
            if (get().currentFolderId === targetFolderId) {
                await refreshFiles();
            }

        } catch (error) {
            updateTask({ status: 'error' });
            setFileStatus(fileIds, 'error');
            throw error;
        } finally {
            setTimeout(() => setFileStatus(fileIds, null), 2000);
        }
    },

    uploadFiles: (filesToUpload: FileList, parentId) => {
        const filesArray = Array.from(filesToUpload);
        const newTasks: UploadTask[] = filesArray.map(file => ({
            id: createId(),
            file: file,
            status: 'uploading',
            progress: 0,
        }));

        // Add the new tasks to our global state. The Activity Center will see this immediately.
        set(state => ({ uploadTasks: [...state.uploadTasks, ...newTasks] }));

        // Now, process each task
        newTasks.forEach(task => {
            const xhr = new XMLHttpRequest();
            const formData = new FormData();
            formData.append('files', task.file);
            if (parentId) formData.append('parentId', parentId);

            // Function to update the progress of this specific task
            const updateTask = (updates: Partial<UploadTask>) => {
                set(state => ({
                    uploadTasks: state.uploadTasks.map(t => t.id === task.id ? { ...t, ...updates } : t)
                }));
            };

            xhr.upload.onprogress = (event) => {
                if (event.lengthComputable) {
                    updateTask({ progress: Math.round((event.loaded / event.total) * 95) });
                }
            };

            xhr.upload.onload = () => updateTask({ status: 'processing' });

            xhr.onload = () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    updateTask({ status: 'success', progress: 100 });
                    const response = JSON.parse(xhr.responseText);
                    const newFileFromServer = response.uploadedFiles[0] as Required<DbFile>;
                    // Add the newly created file to our main file list
                    set(state => ({ files: [...state.files, newFileFromServer] }));
                } else {
                    updateTask({ status: 'error' });
                }
            };

            xhr.onerror = () => updateTask({ status: 'error' });

            xhr.open('POST', '/api/files/upload', true);
            xhr.send(formData);
        });
    },

    clearCompletedUploads: () => {
        set(state => ({
            uploadTasks: state.uploadTasks.filter(task =>
                task.status === 'uploading' || task.status === 'processing'
            )
        }));
    },

    createFolder: async (name: string, parentId: string | null) => {

        const { setFileStatus } = get();

        const tempId = `temp_${createId()}`; // A unique ID for the placeholder
        const placeholderFolder: Required<DbFile> = {
            id: tempId,
            name: name,
            isFolder: true,
            userId: "current_user",
            parentId: parentId,
            thumbnailUrl: '',
            fileIdInImageKit: '',
            path: '',
            isTrash: false,
            isStarred: false,
            size: 0,
            type: 'folder',
            fileUrl: '',
            createdAt: new Date(),
            updatedAt: new Date(),
            lastAccessedAt: null,
        };

        set(state => ({
            files: [...state.files, placeholderFolder],
        }));
        setFileStatus([tempId], 'loading');

        try {

            const response = await fetch('/api/folders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, parentId }),
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Failed to create folder');

            const newFolderFromServer = data.folder as Required<DbFile>;
            set(state => ({
                files: state.files.map(f => f.id === tempId ? newFolderFromServer : f),
            }));

            setFileStatus([newFolderFromServer.id], 'success');
            return newFolderFromServer;

        } catch (error) {
            set(state => ({
                files: state.files.filter(f => f.id !== tempId),
            }));
            throw error;
        } finally {
            setTimeout(() => {
                const finalFolderId = get().files.find(f => f.name === name)?.id; // find the real id
                if (finalFolderId) setFileStatus([finalFolderId], null);
            }, 2000);
        }
    },

    deleteFolder: async (folderId: string) => {

        const { setFileStatus } = get();
        setFileStatus([folderId], 'loading');
        const originalFiles = get().files;

        try {
            const response = await fetch(`/api/folders/${folderId}`, {
                method: 'DELETE',
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Failed to delete folder');
            }

            set(state => ({
                files: state.files.filter(f => f.id !== folderId),
            }));

            return data.folder;

        } catch (error) {
            set({ files: originalFiles });
            setFileStatus([folderId], 'error');
            throw error;
        } finally {
            setTimeout(() => setFileStatus([folderId], null), 2000);
        }
    },

    clearCompletedTasks: () => {
        set(state => ({
            uploadTasks: state.uploadTasks.filter(t => t.status === 'uploading' || t.status === 'processing'),
            operationTasks: state.operationTasks.filter(t => t.status === 'in-progress'),
        }));
    },

    // --- SELECTION MANAGEMENT ---
    setSelectedIds: (selectedIds) => set({ selectedIds }),

    setLastSelectedId: (id) => set({ lastSelectedId: id }),

    clearSelection: () => set({
        selectedIds: new Set(),
        lastSelectedId: null
    }),

    handleSelection: (fileId, isCtrlKeyPressed, isShiftKeyPressed) => {
        // Get the current state we need to make decisions.
        const { files, selectedIds, lastSelectedId, activeFilter, currentFolderId } = get();
        const newSelectedIds = new Set(selectedIds);

        const filesToRender = files.filter(file => {
            if (activeFilter === 'trash') return file.isTrash;
            if (activeFilter === 'starred') return file.isStarred && !file.isTrash;
            return file.parentId === currentFolderId && !file.isTrash;
        });

        if (isCtrlKeyPressed) { // For Ctrl/Cmd+Click
            if (newSelectedIds.has(fileId)) {
                newSelectedIds.delete(fileId);
            } else {
                newSelectedIds.add(fileId);
            }
        } else if (isShiftKeyPressed && lastSelectedId) { // For Shift+Click
            const lastIndex = filesToRender.findIndex(f => f.id === lastSelectedId);
            const currentIndex = filesToRender.findIndex(f => f.id === fileId);
            if (lastIndex !== -1 && currentIndex !== -1) {
                const [start, end] = [lastIndex, currentIndex].sort((a, b) => a - b);
                for (let i = start; i <= end; i++) newSelectedIds.add(filesToRender[i].id);
            }

        } else { // For a simple click
            newSelectedIds.clear();
            newSelectedIds.add(fileId);
        }

        // Update the state in one go.
        set({ selectedIds: newSelectedIds, lastSelectedId: fileId });
    },

    setActiveFilter: (filter) => set({
        activeFilter: filter,
        selectedIds: new Set(),
        lastSelectedId: null
    }),
});

export const useFileStore = create<FileStoreState>()(createFileSlice);
