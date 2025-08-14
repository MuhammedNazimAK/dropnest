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
import { MoveModal } from '@/components/dashboard/modals/MoveModal';
import { FileCard } from '@/components/dashboard/ui/FileCard';
import { FileListRow } from '@/components/dashboard/ui/FileListRow';

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
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
  const [itemToMove, setItemToMove] = useState<Required<File> | null>(null);
  const [activeDragItem, setActiveDragItem] = useState<Active | null>(null);


  // --- DATA HOOKS ---

  // File Management Hook
  const {
    files,
    isUploading,
    uploadProgress,
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
  } = useFolderManagement();

  // --- DERIVED STATE & MEMOIZATION ---

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

  const handleOpenMoveModal = (file: Required<File>) => {
    setItemToMove(file);
    setIsMoveModalOpen(true);
  };

  const handleConfirmMove = async (fileId: string, targetFolderId: string | null) => {
    await moveFile(fileId, targetFolderId);
    // Refresh the view after the move is complete
    await refreshFiles(currentFolderId);
    setIsMoveModalOpen(false);
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      // This is the activation constraint we wanted.
      // Require the mouse to move by 10 pixels before activating a drag.
      // This allows for simple clicks and double-clicks to work.
      activationConstraint: {
        distance: 10,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: (event) => {
        // ... keyboard sensor configuration ...
        return { x: 0, y: 0 }; // Example, adjust as needed for accessibility
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
        allUserFiles={initialFiles}
        createFolder={createFolder}
        currentFolderId={currentFolderId}
        files={files}
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
            <FileView
              files={filteredFiles as Required<File>[]}
              viewMode={viewMode}
              activeFilter={activeFilter}
              onToggleStar={toggleStar}
              onMoveToTrash={moveToTrash}
              onFolderOpen={handleFolderOpen}
              onRestoreFile={restoreFile}
              onDeletePermanently={deleteFilePermanently}
              onRename={renameItem}
              onMove={handleOpenMoveModal}
              onDownload={(file) => window.open(file.fileUrl, '_blank')} // Simple download handler
              onUploadClick={() => setIsUploadModalOpen(true)}
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
                  onDoubleClick={() => { }}
                  activeFilter={'all'}
                  onDownload={() => { }}
                  onToggleStar={() => { }}
                  onRename={() => { }}
                  onMoveToTrash={() => { }}
                  onRestoreFile={() => { }}
                  onDeletePermanently={() => { }}
                />
              ) : (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg">
                  <FileListRow
                    file={activeDragItem.data.current?.file}
                    onMove={() => { }}
                    onDoubleClick={() => { }}
                    activeFilter={'all'}
                    onDownload={() => { }}
                    onToggleStar={() => { }}
                    onRename={() => { }}
                    onMoveToTrash={() => { }}
                    onRestoreFile={() => { }}
                    onDeletePermanently={() => { }}
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
      <MoveModal
        isOpen={isMoveModalOpen}
        onClose={() => setIsMoveModalOpen(false)}
        itemToMove={itemToMove}
        onConfirmMove={handleConfirmMove}
      />
    </div>
  );
};

export default DashboardClient;