'use client';

import React, { useState, useMemo, useEffect } from 'react';
import type { File } from '@/lib/db/schema';

import { useFileManagement } from '@/hooks/useFileManagement';
import { useFolderManagement } from '@/hooks/useFolderManagement';

import { Sidebar } from '@/components/dashboard/layout/Sidebar';
import { Header } from '@/components/dashboard/layout/Header';
import { MainContent } from '@/components/dashboard/layout/MainContent';
import { FileView } from '@/components/dashboard/views/FileView';
import { UploadModal } from '@/components/dashboard/upload/UploadModal';
import { FileOperationModal } from '@/components/dashboard/modals/FileOperationModal';
import { FileCard } from '@/components/dashboard/ui/FileCard';
import { FileListRow } from '@/components/dashboard/ui/FileListRow';
import { BulkActionsToolbar } from '@/components/ui/BulkActionsToolbar';

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
  initialFiles: File[];
  userId: string;
}

const DashboardClient: React.FC<DashboardClientProps> = ({ initialFiles, userId }) => {
  // --- STATE MANAGEMENT ---

  // UI State
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'starred' | 'trash'>('all');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [activeDragItem, setActiveDragItem] = useState<Active | null>(null);
  const [modalMode, setModalMode] = useState<'move' | 'copy' | null>(null);
  const [activeItem, setActiveItem] = useState<Required<File> | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [lastselectedId, setLastSelectedId] = useState<string | null>(null);


  // --- DATA HOOKS ---

  // File Management Hook
  const {
    files,
    isUploading,
    uploadProgress,
    setFiles,
    handleFileUpload,
    toggleStar,
    moveToTrash,
    restoreFile,
    emptyTrash,
    deleteFilePermanently,
    renameItem,
    refreshFiles
  } = useFileManagement(initialFiles, userId);

  // Folder Management Hook
  const {
    currentFolderId,
    breadcrumbs,
    navigateToFolder,
    navigateToBreadcrumb,
    createFolder,
    deleteFolder,
    moveFile,
    copyFile
  } = useFolderManagement();

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

  // --- EVENT HANDLERS ---

  // Handler for opening a folder
  const handleFolderOpen = (folder: File) => {
    if (folder.isFolder) {
      navigateToFolder(folder.id, folder.name);
    }
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

  const handleOpenModal = (item: Required<File>, mode: 'move' | 'copy') => {
    setActiveItem(item);
    setModalMode(mode);
  };

  const handleCloseModal = () => {
    setModalMode(null);
    setActiveItem(null);
  };

  const handleConfirmOperation = async (fileId: string, targetFolderId: string | null) => {
    const idsToProcess = selectedIds.size > 0 ? Array.from(selectedIds) : [fileId];

    if (modalMode === 'move') {
      toast.promise(
        Promise.all(idsToProcess.map(id => moveFile(id, targetFolderId))),
        {
          loading: `Moving ${idsToProcess.length} item(s)...`,
          success: 'Items moved successfully.',
          error: 'Failed to move items.',
        }
      );
    }
    else if (modalMode === 'copy') {
      toast.promise(
        Promise.all(idsToProcess.map(id => copyFile(id, targetFolderId))),
        {
          loading: `Copying ${idsToProcess.length} item(s)...`,
          success: 'Items copied successfully.',
          error: 'Failed to copy items.',
        }
      );
    }

    setSelectedIds(new Set()); // Clear selection after the operation starts
    await refreshFiles(currentFolderId);
    handleCloseModal();
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
          breadcrumbs={breadcrumbs}
          onNavigateToBreadcrumb={navigateToBreadcrumb}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          viewMode={viewMode}
          setViewMode={setViewMode}
          isDarkMode={isDarkMode}
          setIsDarkMode={setIsDarkMode}
        />

        <DndContext
          sensors={sensors}
          onDragStart={(event) => setActiveDragItem(event.active)}
          onDragEnd={handleDragEnd}>
          {/* ===== MAIN CONTENT AREA ===== */}
          <MainContent>
            <BulkActionsToolbar
              selectedCount={selectedIds.size}
              activeFilter={activeFilter}
              onDelete={handleBulkDelete}
              onMove={handleBulkMove}
              onCopy={handleBulkCopy}
              onRestore={handleBulkRestore}
              onClearSelection={() => setSelectedIds(new Set())}
            />
            <FileView
              selectedIds={selectedIds}
              files={filteredFiles as Required<File>[]}
              viewMode={viewMode}
              activeFilter={activeFilter}
              onToggleStar={toggleStar}
              onMoveToTrash={moveToTrash}
              onFolderOpen={handleFolderOpen}
              onRestoreFile={restoreFile}
              onDeletePermanently={deleteFilePermanently}
              onRename={renameItem}
              onMove={(file) => handleOpenModal(file, 'move')}
              onCopy={(file) => handleOpenModal(file, 'copy')}
              onDownload={(file) => window.open(file.fileUrl, '_blank')} // Simple download handler
              onUploadClick={() => setIsUploadModalOpen(true)}
              onFileSelect={handleSelection}
            />
          </MainContent>

          {/* --- ADD THE DRAG OVERLAY --- */}
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
                  onRename={() => { }}
                  onMoveToTrash={() => { }}
                  onRestoreFile={() => { }}
                  onDeletePermanently={() => { }}
                  isSelected={false}
                  onSelect={() => { }}
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
                    onRename={() => { }}
                    onMoveToTrash={() => { }}
                    onRestoreFile={() => { }}
                    onDeletePermanently={() => { }}
                    isSelected={false}
                    onSelect={() => { }}
                  />
                </div>
              )
            ) : null}
          </DragOverlay>
        </DndContext>
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
    </div>
  );
};

export default DashboardClient;