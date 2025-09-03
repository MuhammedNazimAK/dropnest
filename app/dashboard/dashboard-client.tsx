'use client';

import React, { useState, useMemo, useEffect } from 'react';
import type { File as DbFile } from '@/lib/db/schema';

import { useFileManager } from '@/hooks/useFileManager';

import { Sidebar } from '@/components/dashboard/layout/Sidebar';
import { Header } from '@/components/dashboard/layout/Header';
import { MainContent } from '@/components/dashboard/layout/MainContent';
import { FileView } from '@/components/dashboard/views/FileView';
import { UploadModal } from '@/components/dashboard/upload/UploadModal';
import { FileOperationModal } from '@/components/dashboard/modals/FileOperationModal';
import { FileCard } from '@/components/dashboard/ui/FileCard';
import { FileListRow } from '@/components/dashboard/ui/FileListRow';
import { BulkActionsToolbar } from '@/components/ui/BulkActionsToolbar';
import { UploadProgressTracker } from '@/components/dashboard/upload/UploadProgressTracker';
import { FilePreviewModal } from '@/components/dashboard/modals/FilePreviewModal';
import { ShareModal } from '@/components/dashboard/modals/ShareModal';
import { RecentFiles } from '@/components/dashboard/RecentFiles';
import { FileViewLoader } from '@/components/dashboard/views/FileViewLoader';
import { Skeleton } from '@/components/ui/skeleton';


import {
  DndContext,
  DragOverlay,
  type DragEndEvent,
  type Active,
  useSensor,
  useSensors,
  PointerSensor,
  KeyboardSensor
} from '@dnd-kit/core';
import { toast } from 'sonner';
import { fi } from 'zod/v4/locales';

interface DashboardClientProps {
  initialFiles: DbFile[];
  userId: string;
}

const DashboardClient: React.FC<DashboardClientProps> = ({ initialFiles, userId }) => {
  // --- STATE MANAGEMENT ---

  // UI State
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<DbFile[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'starred' | 'trash'>('all');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [activeDragItem, setActiveDragItem] = useState<Active | null>(null);
  const [modalMode, setModalMode] = useState<'move' | 'copy' | null>(null);
  const [activeItem, setActiveItem] = useState<Required<DbFile> | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [lastselectedId, setLastSelectedId] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [fileToPreview, setFileToPreview] = useState<Required<DbFile> | null>(null);
  const [fileToShare, setFileToShare] = useState<Required<DbFile> | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [recentFiles, setRecentFiles] = useState<Required<DbFile>[] | null>(null);
  const [fileStatuses, setFileStatuses] = useState<{ [fileId: string]: 'loading' }>({});


  // --- DATA HOOKS ---

  // File Management Hook
  const {
    files,
    setFiles,
    isUploading,
    uploadProgress,
    handleFileUpload,
    toggleStar,
    moveToTrash,
    restoreFile,
    deleteFilePermanently,
    renameItem,
    refreshFiles,
    currentFolderId,
    breadcrumbs,
    navigateToFolder,
    navigateToBreadcrumb,
    createFolder,
    bulkMoveFiles,
    bulkCopyFiles,
    moveFile,
  } = useFileManager(initialFiles, userId);

  // --- STATE & MEMOIZATION ---

  // Memoize the filtered files to prevent re-calculating on every render
  const filteredFiles = useMemo(() => {
    return files
      .filter(file => {
        if (activeFilter === 'trash') {
          return file.isTrash;
        }
        if (activeFilter === 'starred') {
          return file.isStarred && !file.isTrash;
        }
        // For 'all', filter by current folder and ensure not in trash
        return file.parentId === currentFolderId && !file.isTrash;
      })
      .filter(file => file.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [files, currentFolderId, activeFilter, searchQuery]);

  const selectionContainsFolder = useMemo(() => {
    if (selectedIds.size === 0) return false;
    // Find any file in the main `files` list that is selected AND is a folder.
    return files.some(file => file.id && selectedIds.has(file.id) && file.isFolder);
  }, [files, selectedIds]);

  const handleSelection = (fileId: string, event: React.MouseEvent) => {
    event.stopPropagation();

    const newSelectedIds = new Set(selectedIds);

    if (event.ctrlKey || event.metaKey) { // For Ctrl/Cmd+Click
      // Toggle selection for the clicked item
      if (newSelectedIds.has(fileId)) {
        newSelectedIds.delete(fileId);
      } else {
        newSelectedIds.add(fileId);
      }
      setLastSelectedId(fileId);
    } else if (event.shiftKey && lastselectedId) { // For Shift+Click
      // Select a range of items
      const lastIndex = filteredFiles.findIndex(f => f.id === lastselectedId);
      const currentIndex = filteredFiles.findIndex(f => f.id === fileId);
      const start = Math.min(lastIndex, currentIndex);
      const end = Math.max(lastIndex, currentIndex);

      if (start !== -1 && end !== -1) {
        for (let i = start; i <= end; i++) {
          const fileToAdd = filteredFiles[i]
          if (fileToAdd && fileToAdd.id) {
            newSelectedIds.add(fileToAdd.id);
          }
        }
      }
    } else { // For a simple click
      // Select only the clicked item
      newSelectedIds.clear();
      newSelectedIds.add(fileId);
      setLastSelectedId(fileId);
    }

    setSelectedIds(newSelectedIds);
  };

  const handleBulkDelete = async () => {

    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;

    if (activeFilter === 'trash') {

      toast.promise(Promise.all(ids.map(id => deleteFilePermanently(id))),
        {
          loading: `Permanently deleting ${ids.length} item(s)...`,
          success: 'Items deleted permanently.',
          error: 'Failed to delete items.',
        }
      );
    } else {
      // Otherwise, just move the items to the trash
      toast.promise(
        Promise.all(ids.map(id => moveToTrash(id))),
        {
          loading: `Moving ${ids.length} item(s) to trash...`,
          success: 'Items moved to trash.',
          error: 'Failed to move items to trash.',
        }
      );
    }

    setSelectedIds(new Set()); // Clear selection
    // The hooks will optimistically update, but to ensures refresh consistency
    await refreshFiles(currentFolderId);
  };

  const handleBulkRestore = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;

    toast.promise(
      Promise.all(ids.map(id => restoreFile(id))), // Assuming `restoreFile` is from your hook
      {
        loading: `Restoring ${ids.length} item(s)...`,
        success: 'Items restored.',
        error: 'Failed to restore items.',
      }
    );
    setSelectedIds(new Set());
    await refreshFiles(currentFolderId);
  };


  // --- EVENT HANDLERS ---
  const handleBulkMove = () => {
    if (selectedIds.size === 0) return;

    setActiveItem(null);
    setModalMode('move');
  };

  const handleBulkCopy = () => {
    if (selectedIds.size === 0) return;
    setActiveItem(null);
    setModalMode('copy');
  };

  const handleBulkToggleStar = () => {
    if (selectedIds.size === 0) return;
    toggleStar(Array.from(selectedIds));
    setSelectedIds(new Set());
  };

  // Handler for opening a folder
  const handleDoubleClick = (item: Required<DbFile>) => {
    // ALWAYS clear selection on a double-click action
    setSelectedIds(new Set());
    setLastSelectedId(null);

    if (item.isFolder) {
      // If it's a folder, navigate
      navigateToFolder(item.id, item.name);
      if (searchQuery.length > 0) {
        setSearchQuery('');
        setSearchResults(null);
      }
    } else {
      // --- FIX: If it's a file, open the preview modal ---
      setFileToPreview(item);
    }
  };

  // Handlers for starting and finishing the rename process
  const handleStartRename = (fileId: string) => {
    setRenamingId(fileId);
  };

  const handleConfirmRename = async (fileId: string, newName: string) => {
    await renameItem(fileId, newName);
    setRenamingId(null);
  };

  const handleCancelRename = () => {
    setRenamingId(null);
  };

  // Handler for refreshing files after a folder operation
  const handleFolderAction = async () => {
    await refreshFiles(currentFolderId);
  };

  // Handler for file uploads from the modal
  const handleModalFileUpload = (filesToUpload: FileList) => {
    handleFileUpload(filesToUpload, currentFolderId);
    // Close the modal after upload starts
    setIsUploadModalOpen(false);
  }

  const handleOpenModal = (item: Required<DbFile>, mode: 'move' | 'copy') => {
    setActiveItem(item);
    setModalMode(mode);
  };

  const handleCloseModal = () => {
    setModalMode(null);
    setActiveItem(null);
  };

  useEffect(() => {
    // When the component mounts, set the initial files
    setFiles(initialFiles);
  }, [initialFiles, setFiles]);

  const handleConfirmOperation = async (fileId: string, targetFolderId: string | null) => {

    const idsToProcess = selectedIds.size > 0 ? Array.from(selectedIds) : [fileId];
    const isMove = modalMode === 'move';
    const actionText = isMove ? 'Moving' : 'Copying';

    const newStatuses: Record<string, string> = {};
    idsToProcess.forEach(id => {
      newStatuses[id] = 'loading';
    });

    const operationToast = toast.loading(`${actionText} ${idsToProcess.length} item(s)...`);
    handleCloseModal();

    try {
      if (isMove) {
        if (idsToProcess.length > 1) {
          await bulkMoveFiles(idsToProcess, targetFolderId);
        } else {
          await moveFile(idsToProcess[0], targetFolderId);
        }

      } else {

        // This is the 'copy' operation
        const newFiles = await bulkCopyFiles(idsToProcess, targetFolderId);
        if (newFiles && newFiles.length > 0) {
          // If the copy was made into the folder we're currently looking at,
          // add the new files to the view.
          const filesForCurrentFolder = newFiles.filter(f => f.parentId === currentFolderId);
          if (filesForCurrentFolder.length > 0) {
            setFiles(prev => [...prev, ...filesForCurrentFolder]);
          }
        }
      }

      // 2. On success, update the toast to a success message.
      toast.success(`Items ${isMove ? 'moved' : 'copied'} successfully!`, { id: operationToast });

    } catch (error) {
      // 3. If any of the async operations fail, catch the error.
      console.error(`Operation failed: ${actionText}`, error);
      toast.error(`Failed to ${actionText.toLowerCase()} items.`, { id: operationToast });

      // 4. IMPORTANT: If an operation fails, refresh the files to ensure the UI
      // is in sync with the actual database state.
      await refreshFiles(currentFolderId);

    } finally {
      // 5. No matter what, clear the selection.
      setSelectedIds(new Set());
      setTimeout(() => {
        setFileStatuses({});
      }, 1000);
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      // This is the activation constraint.
      // Require the mouse to move by 10 pixels before activating a drag.
      // This allows for simple clicks and double-clicks to work.
      activationConstraint: {
        distance: 10,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: (event) => {
        // ... keyboard sensor configuration ...
        return { x: 0, y: 0 };
      },
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {

    setActiveDragItem(null);

    const { active, over } = event;

    // `active` is the item that was dragged (its id is active.id)
    // `over` is the droppable target it was dropped on (its id is over.id)

    // Check if the item was dropped on a valid target
    if (over && active.id !== over.id) {
      const fileIdToMove = String(active.id);
      const targetFolderId = String(over.id);

      console.log(`User wants to move file ${fileIdToMove} to folder ${targetFolderId}`);

      // Optimistically update the UI by calling the move function.
      // The hook handles the API call and notifications.
      await moveFile(fileIdToMove, targetFolderId);

      await refreshFiles(currentFolderId);
    }
  };

  // Effect to trigger the search API call
  useEffect(() => {
    // Use a timeout to "debounce" the input. Don't fire an API call on every single keystroke.
    const searchTimeout = setTimeout(async () => {
      if (searchQuery.length > 1) { // Only search if query is > 1 character
        setIsSearching(true);
        setSearchResults(null);
        try {
          const response = await fetch(`/api/files/search?q=${searchQuery}`);
          const data = await response.json();
          setSearchResults(data);

        } catch (error) {
          console.error("Failed to fetch search results:", error);
          setSearchResults([]); // Show empty on error
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults(null); // Clear results if search query is empty
      }
    }, 400); // Wait 300ms after the user stops typing

    return () => clearTimeout(searchTimeout); // Cleanup on unmount or if query changes
  }, [searchQuery]);

  // --- Logic to decide which files to display ---
  const isSearchActive = searchQuery.length > 1 && searchResults !== null;
  const filesToDisplay = isSearchActive ? searchResults : files;

  // Effect to apply dark mode class to the body
  useEffect(() => {
    const body = window.document.body;
    if (isDarkMode) {
      body.classList.add('dark');
    } else {
      body.classList.remove('dark');
    }
  }, [isDarkMode]);

  useEffect(() => {
    setSelectedIds(new Set());
    setLastSelectedId(null);
  }, [currentFolderId, activeFilter]);

  useEffect(() => {
    refreshFiles(currentFolderId);
  }, [currentFolderId, refreshFiles]);

  useEffect(() => {
    // Will wait for two things to complete:
    // 1. A minimum timer of 800ms (0.8 seconds).
    // 2. The fetch request for recent files.
    const timer = new Promise(resolve => setTimeout(resolve, 800));
    const dataFetch = fetch('/api/files/recent').then(res => res.json());

    // Promise.all ensures both are finished before stop loading.
    Promise.all([dataFetch, timer]).then(([fetchedRecentFiles]) => {
      setRecentFiles(fetchedRecentFiles);
      setIsInitialLoading(false); // Stop loading ONLY after both are done.
    });
  }, []);

  const isMainContentLoading = isInitialLoading;

  // --- RENDER ---

  return (
    <div className={`flex h-screen transition-colors duration-200 ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-800'
      }`}>
      {/* ===== PERSISTENT SIDEBAR ===== */}
      <Sidebar
        activeFilter={activeFilter}
        setActiveFilter={setActiveFilter}
        onFolderCreated={handleFolderAction}
        onUploadClick={() => setIsUploadModalOpen(true)}
        createFolder={createFolder}
        currentFolderId={currentFolderId}
      />

      <div className="flex flex-col flex-1 w-full overflow-hidden">
        {/* ===== TOP HEADER ===== */}
        <Header
          breadcrumbs={isSearchActive ? [{ id: null, name: `Search results for "${searchQuery}"` }] : breadcrumbs}
          onNavigateToBreadcrumb={navigateToBreadcrumb}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          viewMode={viewMode}
          setViewMode={setViewMode}
          isDarkMode={isDarkMode}
          setIsDarkMode={setIsDarkMode}
        />

        <main className="flex-1 overflow-y-auto p-6 max-w-8xl mx-auto w-full">
          {isMainContentLoading ? (
            <>
              <div className='mt-8'>
                <h2 className="text-lg font-semibold mb-4">Recent</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-52 w-full rounded-xl" />
                  ))}
                </div>
                <hr className="my-8" />
              </div>
              <FileViewLoader />
            </>
          ) : (
            <>
              {breadcrumbs.length === 1 && activeFilter === 'all' && (
                <RecentFiles
                  files={recentFiles}
                  onFilePreview={setFileToPreview}
                />
              )}
              <DndContext
                sensors={sensors}
                onDragStart={(event) => setActiveDragItem(event.active)}
                onDragEnd={handleDragEnd}>
                {/* ===== MAIN CONTENT AREA ===== */}
                <BulkActionsToolbar
                  selectedCount={selectedIds.size}
                  activeFilter={activeFilter}
                  onDelete={handleBulkDelete}
                  onMove={handleBulkMove}
                  onCopy={handleBulkCopy}
                  onRestore={handleBulkRestore}
                  onClearSelection={() => setSelectedIds(new Set())}
                  disableCopy={selectionContainsFolder}
                  onToggleStar={handleBulkToggleStar}
                />
                <FileView
                  selectedIds={selectedIds}
                  files={filesToDisplay as Required<DbFile>[]}
                  fileStatuses={fileStatuses}
                  viewMode={viewMode}
                  activeFilter={activeFilter}
                  onToggleStar={toggleStar}
                  onMoveToTrash={moveToTrash}
                  onFolderOpen={handleDoubleClick}
                  onRestoreFile={restoreFile}
                  onDeletePermanently={deleteFilePermanently}
                  onRename={renameItem}
                  onMove={(file) => handleOpenModal(file, 'move')}
                  onCopy={(file) => handleOpenModal(file, 'copy')}
                  onDownload={(file) => window.open(file.fileUrl, '_blank')} // Simple download handler
                  onUploadClick={() => setIsUploadModalOpen(true)}
                  onFileSelect={handleSelection}
                  renamingId={renamingId}
                  onStartRename={handleStartRename}
                  onConfirmRename={handleConfirmRename}
                  onCancelRename={handleCancelRename}
                  onDoubleClick={handleDoubleClick}
                  onShare={(file) => setFileToShare(file)}
                />
                <DragOverlay>
                  {activeDragItem ? (
                    // When an item is being dragged, render a FileCard here
                    viewMode === 'grid' ? (
                      <FileCard
                        file={activeDragItem.data.current?.file}
                        // dummy functions for props that aren't used in the overlay's appearance
                        onMove={() => { }}
                        onCopy={() => { }}
                        onDoubleClick={() => { }}
                        activeFilter={'all'}
                        onDownload={() => { }}
                        onToggleStar={() => { }}
                        onMoveToTrash={() => { }}
                        onRestoreFile={() => { }}
                        onDeletePermanently={() => { }}
                        isSelected={false}
                        onSelect={() => { }}
                        renamingId={null}
                        onStartRename={() => { }}
                        onConfirmRename={() => { }}
                        onCancelRename={() => { }}
                        onShare={() => { }}
                      />
                    ) : (
                      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg">
                        <FileListRow
                          file={activeDragItem.data.current?.file}
                          onMove={() => { }}
                          onCopy={() => { }}
                          onDoubleClick={() => { }}
                          activeFilter={'all'}
                          onDownload={() => { }}
                          onToggleStar={() => { }}
                          onMoveToTrash={() => { }}
                          onRestoreFile={() => { }}
                          onDeletePermanently={() => { }}
                          isSelected={false}
                          onSelect={() => { }}
                          renamingId={null}
                          onStartRename={() => { }}
                          onConfirmRename={() => { }}
                          onCancelRename={() => { }}
                          onShare={() => { }}
                        />
                      </div>
                    )
                  ) : null}
                </DragOverlay>
              </DndContext>
            </>
          )}
        </main>
      </div>

      {/* ===== MODALS ===== */}
      {/* ===== UPLOAD MODAL (Portal) ===== */}
      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onFileUpload={handleModalFileUpload}
        isUploading={isUploading}
        uploadProgress={uploadProgress}
        currentFolderId={currentFolderId}
      />
      <FileOperationModal
        isOpen={modalMode !== null}
        onClose={handleCloseModal}
        item={activeItem}
        onConfirm={handleConfirmOperation}
        title={modalMode === 'move' ? 'Move' : 'Copy'}
        confirmButtonText={modalMode === 'move' ? 'Move Here' : 'Copy Here'}
        selectedCount={selectedIds.size}
      />
      <FilePreviewModal
        file={fileToPreview}
        onClose={() => setFileToPreview(null)}
      />
      <UploadProgressTracker />
      <ShareModal
        file={fileToShare}
        onClose={() => setFileToShare(null)}
      />
    </div>
  );
};

export default DashboardClient;