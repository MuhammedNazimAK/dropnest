'use client';

import React, { useState } from 'react';
import type { File } from '@/lib/db/schema';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import FileUploadZone from '@/components/dashboard/FileUploadZone';
import FileCategoryTabs from '@/components/dashboard/FileCategoryTabs';
import FileManagementControls from '@/components/dashboard/FileManagementControls';
import UserProfile from '@/components/dashboard/UserProfile';
import { useFileManagement } from '@/hooks/useFileManagement';
import { useFolderManagement } from '@/hooks/useFolderManagement';
import FileDisplay from '@/components/dashboard/FileDisplay';
import { FolderOperationsPanel } from '@/components/dashboard/FolderOperationsPanel';


interface DashboardClientProps {
  initialFiles: File[];
  userId: string;
}

const DashboardClient: React.FC<DashboardClientProps> = ({
  initialFiles,
  userId
}) => {
  // UI State
  const [activeTab, setActiveTab] = useState('files');
  const [activeFileView, setActiveFileView] = useState('all');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const [searchQuery, setSearchQuery] = useState('');

  // File Management
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
    refreshFiles
  } = useFileManagement(initialFiles, userId);

  // Folder Management
  const {
    currentFolderId,
    breadcrumbs,
    navigateToFolder,
    navigateToBreadcrumb,
    createFolder,
    renameFolder,
    deleteFolder,
    moveFile
  } = useFolderManagement();

  // Filter files based on current folder, view and search
  const filteredFiles = files.filter(file => {
    // Filter by current folder first
    if (file.parentId !== currentFolderId) return false;
    
    // Then apply view filters
    if (activeFileView === 'starred') return file.isStarred && !file.isTrash;
    if (activeFileView === 'trash') return file.isTrash;
    if (activeFileView === 'all') return !file.isTrash;
    return true;
  }).filter(file =>
    file.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle folder double-click navigation
  const handleFolderOpen = (folder: File) => {
    if (folder.isFolder) {
      navigateToFolder(folder.id, folder.name);
    }
  };

  // Handle file refresh after folder operations
  const handleFolderCreated = () => {
    refreshFiles(currentFolderId);
  };

  return (
    <div className={`min-h-screen transition-colors duration-200 ${
      isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'
    }`}>
      {/* Header */}
      <DashboardHeader
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode}
      />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'files' ? (
          <div className="flex gap-6">
            {/* Main Content Area */}
            <div className="flex-1">

              {/* Top Section - Drop Zone and File Categories */}
              <div className="flex flex-col lg:flex-row gap-6 mb-8">
                <FileUploadZone
                  onFileUpload={handleFileUpload}
                  isUploading={isUploading}
                  uploadProgress={uploadProgress}
                  isDarkMode={isDarkMode}
                  currentFolderId={currentFolderId}
                />
                <FileCategoryTabs
                  activeFileView={activeFileView}
                  setActiveFileView={setActiveFileView}
                  files={files}
                  isDarkMode={isDarkMode}
                />
              </div>

              {/* File Management Controls */}
              <FileManagementControls
                activeFileView={activeFileView}
                files={files}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                viewMode={viewMode}
                setViewMode={setViewMode}
                isDarkMode={isDarkMode}
                onEmptyTrash={emptyTrash}
              />

              {/* Files Display */}
              <FileDisplay
                files={filteredFiles as Required<File>[]}
                viewMode={viewMode}
                activeFileView={activeFileView}
                isDarkMode={isDarkMode}
                searchQuery={searchQuery}
                onToggleStar={toggleStar}
                onMoveToTrash={moveToTrash}
                onRestoreFile={restoreFile}
                onDeletePermanently={deleteFilePermanently}
                onFolderOpen={handleFolderOpen}
                onMoveFile={moveFile}
                onRefresh={() => refreshFiles(currentFolderId)}
              />
            </div>

            {/* Folder Operations Panel */}
            <FolderOperationsPanel
              onFolderCreated={handleFolderCreated}
            />
          </div>
        ) : (
          <UserProfile files={files} isDarkMode={isDarkMode} />
        )}
      </main>
    </div>
  );
};

export default DashboardClient;