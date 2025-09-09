'use client';

import React, { useState, useMemo, useEffect } from 'react';
import type { File as DbFile } from '@/lib/db/schema';


import { Sidebar } from '@/components/dashboard/layout/Sidebar';
import { Header } from '@/components/dashboard/layout/Header';
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
import { useFileStore } from '@/lib/store/useFileStore';

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

interface DashboardClientProps {
  initialFiles: Required<DbFile>[];
  userId: string;
}

const DashboardClient: React.FC<DashboardClientProps> = ({ initialFiles, userId }) => {

  // --- ZUSTAND STORE STATE ---
  // This approach is clean and ensures the component re-renders only when these specific values change.
  const {
    files,
    currentFolderId,
    breadcrumbs,
    selectedIds,
    lastSelectedId,
    fileStatuses,
    activeFilter,
    initializeFiles,
    setActiveFilter,
    navigateToFolder,
    navigateToBreadcrumb,
    setSelectedIds,
    setLastSelectedId,
    clearSelection,
    moveFile,
    bulkMoveFiles,
    bulkCopyFiles,
    toggleStar,
    moveToTrash,
    restoreFile,
    deleteFilePermanently,
    createFolder,
    renameItem,
    refreshFiles,
    handleSelection: handleSelectionFromStore,
  } = useFileStore(state => ({
    files: state.files,
    currentFolderId: state.currentFolderId,
    breadcrumbs: state.breadcrumbs,
    selectedIds: state.selectedIds,
    lastSelectedId: state.lastSelectedId,
    fileStatuses: state.fileStatuses,
    activeFilter: state.activeFilter,
    initializeFiles: state.initializeFiles,
    setActiveFilter: state.setActiveFilter,
    navigateToFolder: state.navigateToFolder,
    navigateToBreadcrumb: state.navigateToBreadcrumb,
    setSelectedIds: state.setSelectedIds,
    setLastSelectedId: state.setLastSelectedId,
    clearSelection: state.clearSelection,
    moveFile: state.moveFile,
    bulkMoveFiles: state.bulkMoveFiles,
    bulkCopyFiles: state.bulkCopyFiles,
    toggleStar: state.toggleStar,
    moveToTrash: state.moveToTrash,
    restoreFile: state.restoreFile,
    deleteFilePermanently: state.deleteFilePermanently,
    createFolder: state.createFolder,
    renameItem: state.renameItem,
    refreshFiles: state.refreshFiles,
    handleSelection: state.handleSelection,
  }));

  // --- LOCAL UI STATE ---
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<DbFile[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [activeDragItem, setActiveDragItem] = useState<Active | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [recentFiles, setRecentFiles] = useState<Required<DbFile>[] | null>(null);

  // Modal Visibility State
  const [modalMode, setModalMode] = useState<'move' | 'copy' | null>(null);
  const [activeItem, setActiveItem] = useState<Required<DbFile> | null>(null);
  const [fileToPreview, setFileToPreview] = useState<Required<DbFile> | null>(null);
  const [fileToShare, setFileToShare] = useState<Required<DbFile> | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);

  // --- COMPUTED STATE ---
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
    return files.some(file => file.id && selectedIds.has(file.id) && file.isFolder);
  }, [files, selectedIds]);

  // --- EVENT HANDLERS ---
  const handleFileSelect = (fileId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    // Pass the necessary, simple values to our store action.
    handleSelectionFromStore(fileId, event.ctrlKey || event.metaKey, event.shiftKey);
  };

  const handleBulkDelete = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;

    try {
      if (activeFilter === 'trash') {
        toast.promise(
          deleteFilePermanently(ids),
          {
            loading: `Permanently deleting ${ids.length} item(s)...`,
            success: 'Items deleted permanently.',
            error: 'Failed to delete items.',
          }
        );
      } else {
        toast.promise(
          moveToTrash(ids),
          {
            loading: `Moving ${ids.length} item(s) to trash...`,
            success: 'Items moved to trash.',
            error: 'Failed to move items to trash.',
          }
        );
      }
      clearSelection();
    } catch (error) {
      console.error('Bulk delete failed:', error);
    }
  };

  const handleBulkRestore = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;

    try {
      toast.promise(
        restoreFile(ids),
        {
          loading: `Restoring ${ids.length} item(s)...`,
          success: 'Items restored.',
          error: 'Failed to restore items.',
        }
      );
      clearSelection();
    } catch (error) {
      console.error('Bulk restore failed:', error);
    }
  };

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

  const handleBulkToggleStar = async () => {
    if (selectedIds.size === 0) return;
    try {
      await toggleStar(Array.from(selectedIds));
      clearSelection();
    } catch (error) {
      console.error('Bulk toggle star failed:', error);
    }
  };

  const handleDoubleClick = (item: Required<DbFile>) => {
    clearSelection();

    if (item.isFolder) {
      navigateToFolder(item.id, item.name);
      if (searchQuery.length > 0) {
        setSearchQuery('');
        setSearchResults(null);
      }
    } else {
      setFileToPreview(item);
    }
  };

  const handleStartRename = (fileId: string) => {
    setRenamingId(fileId);
  };

  const handleConfirmRename = async (fileId: string, newName: string) => {
    try {
      await renameItem(fileId, newName);
      setRenamingId(null);
    } catch (error) {
      console.error('Rename failed:', error);
      toast.error('Failed to rename item');
    }
  };

  const handleCancelRename = () => {
    setRenamingId(null);
  };

  const handleFolderAction = async () => {
    try {
      await refreshFiles(currentFolderId);
    } catch (error) {
      console.error('Failed to refresh files:', error);
    }
  };

  const handleOpenModal = (item: Required<DbFile>, mode: 'move' | 'copy') => {
    setActiveItem(item);
    setModalMode(mode);
  };

  const handleCloseModal = () => {
    setModalMode(null);
    setActiveItem(null);
  };

  const handleConfirmOperation = async (fileId: string, targetFolderId: string | null) => {
    const idsToProcess = selectedIds.size > 0 ? Array.from(selectedIds) : [fileId];
    const isMove = modalMode === 'move';
    const actionText = isMove ? 'Moving' : 'Copying';

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
        const newFiles = await bulkCopyFiles(idsToProcess, targetFolderId);
        // Note: bulkCopyFiles in the store should handle updating the files state internally
        // if the copied files belong to the current folder
      }

      toast.success(`Items ${isMove ? 'moved' : 'copied'} successfully!`, { id: operationToast });
      clearSelection();
    } catch (error) {
      console.error(`Operation failed: ${actionText}`, error);
      toast.error(`Failed to ${actionText.toLowerCase()} items.`, { id: operationToast });
    }
  };

  // Drag and drop handlers
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 10,
      },
    }),
    useSensor(KeyboardSensor)
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveDragItem(null);

    const { active, over } = event;

    if (over && active.id !== over.id) {
      const fileIdToMove = String(active.id);
      const targetFolderId = String(over.id);

      try {
        await moveFile(fileIdToMove, targetFolderId);
      } catch (error) {
        console.error('Drag and drop move failed:', error);
        toast.error('Failed to move item');
      }
    }
  };

  // --- EFFECTS ---

  useEffect(() => {
    initializeFiles(initialFiles);
  }, [initialFiles, initializeFiles]);

  // Search effect
  useEffect(() => {
    const searchTimeout = setTimeout(async () => {
      if (searchQuery.length > 1) {
        setIsSearching(true);
        setSearchResults(null);
        try {
          const response = await fetch(`/api/files/search?q=${searchQuery}`);
          const data = await response.json();
          setSearchResults(data);
        } catch (error) {
          console.error("Failed to fetch search results:", error);
          setSearchResults([]);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults(null);
      }
    }, 400);

    return () => clearTimeout(searchTimeout);
  }, [searchQuery]);

  useEffect(() => {
    const body = window.document.body;
    if (isDarkMode) {
      body.classList.add('dark');
    } else {
      body.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Clear selection when navigation changes
  useEffect(() => {
    clearSelection();
  }, [currentFolderId, activeFilter, clearSelection]);

  // Refresh files when current folder changes
  useEffect(() => {
    refreshFiles(currentFolderId);
  }, [currentFolderId, refreshFiles]);

  // Initial loading and recent files fetch
  useEffect(() => {
    const timer = new Promise(resolve => setTimeout(resolve, 800));
    const dataFetch = fetch('/api/files/recent').then(res => res.json());

    Promise.all([dataFetch, timer]).then(([fetchedRecentFiles]) => {
      setRecentFiles(fetchedRecentFiles);
      setIsInitialLoading(false);
    });
  }, []);

  const isSearchActive = searchQuery.length > 1 && searchResults !== null;
  const isMainContentLoading = isInitialLoading;

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
                onDragEnd={handleDragEnd}
              >
                <BulkActionsToolbar
                  selectedCount={selectedIds.size}
                  activeFilter={activeFilter}
                  onDelete={handleBulkDelete}
                  onMove={handleBulkMove}
                  onCopy={handleBulkCopy}
                  onRestore={handleBulkRestore}
                  onClearSelection={clearSelection}
                  disableCopy={selectionContainsFolder}
                  onToggleStar={handleBulkToggleStar}
                />
                <FileView
                  selectedIds={selectedIds}
                  files={filteredFiles as Required<DbFile>[]}
                  fileStatuses={fileStatuses}
                  viewMode={viewMode}
                  activeFilter={activeFilter}
                  onToggleStar={handleBulkToggleStar}
                  onMoveToTrash={moveToTrash}
                  onFolderOpen={handleDoubleClick}
                  onRestoreFile={restoreFile}
                  onDeletePermanently={deleteFilePermanently}
                  onRename={renameItem}
                  onMove={(file) => handleOpenModal(file, 'move')}
                  onCopy={(file) => handleOpenModal(file, 'copy')}
                  onDownload={(file) => window.open(file.fileUrl, '_blank')}
                  onUploadClick={() => setIsUploadModalOpen(true)}
                  onFileSelect={handleFileSelect}
                  renamingId={renamingId}
                  onStartRename={handleStartRename}
                  onConfirmRename={handleConfirmRename}
                  onCancelRename={handleCancelRename}
                  onDoubleClick={handleDoubleClick}
                  onShare={(file) => setFileToShare(file)}
                />
                <DragOverlay>
                  {activeDragItem ? (
                    viewMode === 'grid' ? (
                      <FileCard
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
      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
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