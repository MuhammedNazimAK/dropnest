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
  } = useFolderManagement(); // Pass files to the hook if it needs them

  // --- DERIVED STATE & MEMOIZATION ---

  // Memoize the filtered files to prevent re-calculating on every render
  const filteredFiles = useMemo(() => {
    return files
      .filter(file => {
        // First, filter by the active folder
        const inCurrentFolder = file.parentId === currentFolderId;
        if (!inCurrentFolder) return false;

        // Then, apply the active filter ('all', 'starred', 'trash')
        switch (activeFilter) {
          case 'starred':
            return file.isStarred && !file.isTrash;
          case 'trash':
            return file.isTrash;
          case 'all':
          default:
            return !file.isTrash;
        }
      })
      // Finally, filter by the search query
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
    <div className={`flex h-screen transition-colors duration-200 ${
      isDarkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-800'
    }`}>
      {/* ===== PERSISTENT SIDEBAR ===== */}
      <Sidebar
        activeFilter={activeFilter}
        setActiveFilter={setActiveFilter}
        onFolderCreated={handleFolderAction}
        onUploadClick={() => setIsUploadModalOpen(true)}
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
            onMove={moveFile} 
            onDownload={(file) => window.open(file.fileUrl, '_blank')} // Simple download handler
          />
        </MainContent>
      </div>

      {/* ===== UPLOAD MODAL (Portal) ===== */}
      <UploadModal
          isOpen={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
          onFileUpload={handleModalFileUpload}
          isUploading={isUploading}
          uploadProgress={uploadProgress}
          currentFolderId={currentFolderId}
      />
    </div>
  );
};

export default DashboardClient;