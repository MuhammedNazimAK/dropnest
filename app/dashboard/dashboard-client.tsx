'use client';

import React, { useState } from 'react';
import type { NewFile } from '@/lib/db/schema';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import FileUploadZone from '@/components/dashboard/FileUploadZone';
import FileCategoryTabs from '@/components/dashboard/FileCategoryTabs';
import FileManagementControls from '@/components/dashboard/FileManagementControls';
import FileDisplay from '@/components/dashboard/FileDisplay';
import UserProfile from '@/components/dashboard/UserProfile';
import { useFileManagement } from '@/hooks/useFileManagement';

interface DashboardClientProps {
  initialFiles: NewFile[];
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
    emptyTrash
  } = useFileManagement(initialFiles, userId);

  // Filter files based on view and search
  const filteredFiles = files.filter(file => {

    if (activeFileView === 'starred') return file.isStarred && !file.isTrash;
    if (activeFileView === 'trash') return file.isTrash;
    if (activeFileView === 'all') return !file.isTrash;
    return true;
  }).filter(file =>

    file.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className={`min-h-screen transition-colors duration-200 ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'
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
          <>
            {/* Top Section - Drop Zone and File Categories */}
            <div className="flex flex-col lg:flex-row gap-6 mb-8">
              <FileUploadZone
                onFileUpload={handleFileUpload}
                isUploading={isUploading}
                uploadProgress={uploadProgress}
                isDarkMode={isDarkMode}
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
              files={filteredFiles}
              viewMode={viewMode}
              activeFileView={activeFileView}
              isDarkMode={isDarkMode}
              searchQuery={searchQuery}
              onToggleStar={toggleStar}
              onMoveToTrash={moveToTrash}
              onRestoreFile={restoreFile}
            />
          </>
        ) : (
          <UserProfile files={files} isDarkMode={isDarkMode} />
        )}
      </main>
    </div>
  );
};

export default DashboardClient;