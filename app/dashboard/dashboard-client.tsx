'use client';

import React, { useState, useMemo, useEffect } from 'react';
import type { File as DbFile } from '@/lib/db/schema';

import { useFileStore } from '@/lib/store/useFileStore';
import { Sidebar } from '@/components/dashboard/layout/Sidebar';
import { Header } from '@/components/dashboard/layout/Header';
import { FileView } from '@/components/dashboard/views/FileView';
import { UploadModal } from '@/components/dashboard/upload/UploadModal';
import { FileOperationModal } from '@/components/dashboard/modals/FileOperationModal';
import { FileCard } from '@/components/dashboard/ui/FileCard';
import { FileListRow } from '@/components/dashboard/ui/FileListRow';
import { BulkActionsToolbar } from '@/components/ui/BulkActionsToolbar';
import { FilePreviewModal } from '@/components/dashboard/modals/FilePreviewModal';
import { ShareModal } from '@/components/dashboard/modals/ShareModal';
import { RecentFiles } from '@/components/dashboard/RecentFiles';
import { FileViewLoader } from '@/components/dashboard/views/FileViewLoader';
import { ActivityCenter } from '@/components/dashboard/ActivityCenter';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

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

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface DashboardClientProps {
  initialFiles: Required<DbFile>[];
  initialRecentFiles: Required<DbFile>[];
  userId: string;
}

const DashboardClient: React.FC<DashboardClientProps> = ({ initialFiles, initialRecentFiles }) => {
  // --- ZUSTAND STORE STATE ---
  const files = useFileStore(state => state.files);
  const currentFolderId = useFileStore(state => state.currentFolderId);
  const breadcrumbs = useFileStore(state => state.breadcrumbs);
  const activeFilter = useFileStore(state => state.activeFilter);
  const refreshFiles = useFileStore(state => state.refreshFiles);
  const handleSelectionFromStore = useFileStore(state => state.handleSelection);
  const initializeFiles = useFileStore(state => state.initializeFiles);
  const setActiveFilter = useFileStore(state => state.setActiveFilter);
  const navigateToFolder = useFileStore(state => state.navigateToFolder);
  const selectedIds = useFileStore(state => state.selectedIds);
  const navigateToBreadcrumb = useFileStore(state => state.navigateToBreadcrumb);
  const clearSelection = useFileStore(state => state.clearSelection);
  const moveFiles = useFileStore(state => state.moveFiles);
  const copyFiles = useFileStore(state => state.copyFiles);
  const toggleStar = useFileStore(state => state.toggleStar);
  const moveToTrash = useFileStore(state => state.moveToTrash);
  const restoreFile = useFileStore(state => state.restoreFile);
  const deleteFilePermanently = useFileStore(state => state.deleteFilePermanently);
  const createFolder = useFileStore(state => state.createFolder);
  const renameItem = useFileStore(state => state.renameItem);
  const emptyTrash = useFileStore(state => state.emptyTrash);
  const isLoading = useFileStore(state => state.isLoading);

  // --- LOCAL UI STATE ---
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<DbFile[] | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [activeDragItem, setActiveDragItem] = useState<Active | null>(null);
  const [recentFiles, setRecentFiles] = useState<Required<DbFile>[] | null>(null);
  const [isDeleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [isEmptyTrashConfirmOpen, setEmptyTrashConfirmOpen] = useState(false);

  // Modal Visibility State
  const [modalMode, setModalMode] = useState<'move' | 'copy' | null>(null);
  const [activeItem, setActiveItem] = useState<Required<DbFile> | null>(null);
  const [fileToPreview, setFileToPreview] = useState<Required<DbFile> | null>(null);
  const [fileToShare, setFileToShare] = useState<Required<DbFile> | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);

  useEffect(() => {
    const storedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    const initialTheme = storedTheme === 'dark' || (!storedTheme && systemPrefersDark);
    setIsDarkMode(initialTheme);

    if (initialTheme) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  // --- COMPUTED STATE ---
  const filteredFiles = useMemo(() => {
    return files
      .filter(file => {
        if (activeFilter === 'trash') {
          return file.isTrash;
        }
        if (activeFilter === 'starred') {
          return file.isStarred && !file.isTrash;
        }
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
    handleSelectionFromStore(fileId, event.ctrlKey || event.metaKey, event.shiftKey);
  };

  const handleBulkDelete = () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;

    if (activeFilter === 'trash') {
      setDeleteConfirmOpen(true);
    } else {
      toast.promise(
        moveToTrash(ids),
        {
          loading: `Moving ${ids.length} item(s) to trash...`,
          success: 'Items moved to trash.',
          error: 'Failed to move items to trash.',
        }
      );
      clearSelection();
    }
  };

  const handleConfirmPermanentDelete = () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;

    toast.promise(
      deleteFilePermanently(ids),
      {
        loading: `Permanently deleting ${ids.length} item(s)...`,
        success: 'Items deleted permanently.',
        error: 'Failed to delete items.',
      }
    );
    clearSelection();
  };

  const handleConfirmEmptyTrash = () => {
    toast.promise(
      emptyTrash(),
      {
        loading: 'Emptying Trash...',
        success: 'Trash emptied successfully.',
        error: 'Failed to empty Trash.',
      }
    );
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

  const handleItemActivate = (item: Required<DbFile>) => {
    clearSelection();

    if (item.isFolder) {
      navigateToFolder(item.id, item.name);
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
    const action = isMove ? moveFiles : copyFiles;
    const actionText = isMove ? 'move' : 'copy';

    handleCloseModal();

    toast.promise(
      action(idsToProcess, targetFolderId),
      {
        loading: `Processing ${idsToProcess.length} item(s)...`,
        success: `Items ${actionText}d successfully!`,
        error: `Failed to ${actionText} items.`
      }
    );
    clearSelection();
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
        await moveFiles([fileIdToMove], targetFolderId);
      } catch (error) {
        console.error('Drag and drop move failed:', error);
        toast.error('Failed to move item');
      }
    }
  };

  useEffect(() => {

    initializeFiles(initialFiles);
    setRecentFiles(initialRecentFiles);

  }, [initialFiles, initializeFiles, initialRecentFiles]);

  useEffect(() => {
    const searchTimeout = setTimeout(async () => {
      if (searchQuery.length > 1) {
        setSearchResults(null);
        try {
          const response = await fetch(`/api/files/search?q=${searchQuery}`);
          setSearchResults(await response.json());
        } catch (error) {
          console.log(error);
          setSearchResults([]);
        }
      } else {
        setSearchResults(null);
      }
    }, 400);
    return () => clearTimeout(searchTimeout);
  }, [searchQuery]);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const isSearchActive = searchQuery.length > 1 && searchResults !== null;
  const hasFiles = filteredFiles.length > 0;

  return (
    <div className="flex h-screen transition-colors duration-300 bg-background text-foreground">
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
          activeFilter={activeFilter}
          onEmptyTrash={() => setEmptyTrashConfirmOpen(true)}
          disableEmptyTrash={activeFilter === 'trash' && !hasFiles}
        />

        <main className="flex-1 overflow-y-auto p-6 max-w-8xl mx-auto w-full">
          {isLoading ? (
            breadcrumbs.length <= 1 ? (
              <>
                <div className='mt-8'>
                  <h2 className="text-lg font-semibold mb-4">Recent</h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Skeleton key={i} className="h-52 w-full rounded-xl" />
                    ))}
                  </div>
                  <hr className="my-8 border-border" />
                </div>
                <FileViewLoader />
              </>
            ) : (
              <FileViewLoader />
            )
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
                  viewMode={viewMode}
                  activeFilter={activeFilter}
                  onToggleStar={handleBulkToggleStar}
                  onMoveToTrash={moveToTrash}
                  onFolderOpen={handleItemActivate}
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
                  onShare={(file) => setFileToShare(file)}
                  onDoubleClick={handleItemActivate}
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
                      <div className="bg-background rounded-lg shadow-lg">
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

      <ShareModal
        file={fileToShare}
        onClose={() => setFileToShare(null)}
      />

      <ActivityCenter />

      <AlertDialog open={isDeleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {selectedIds.size} item(s). This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmPermanentDelete}>
              Delete Permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isEmptyTrashConfirmOpen} onOpenChange={setEmptyTrashConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Empty Trash?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete ALL items in your trash.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmEmptyTrash}>
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default DashboardClient;