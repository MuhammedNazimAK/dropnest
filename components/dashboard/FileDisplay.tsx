'use client';

import React, { useState } from 'react';
import FileGrid from './FileGrid';
import FileList from './FileList';
import EmptyState from '@/components/dashboard/EmptyState';
import type { File } from '@/lib/db/schema';
import { useFolderManagement } from '@/hooks/useFolderManagement';
import { Loader } from 'lucide-react';

interface FileDisplayProps {
  files: File[];
  viewMode: string;
  activeFileView: string;
  isDarkMode: boolean;
  searchQuery: string;
  onToggleStar: (fileId: string) => void;
  onMoveToTrash: (fileId: string) => void;
  onRestoreFile: (fileId: string) => void;
  onDeletePermanently: (fileId: string) => void;
  onFolderOpen?: (folder: File) => void;
  onMoveFile?: (fileId: string, targetFolderId: string | null) => Promise<any>;
  refreshTrigger?: number;
  onRefresh?: () => void;
}

const FileDisplay: React.FC<FileDisplayProps> = ({
  files,
  viewMode,
  activeFileView,
  isDarkMode,
  searchQuery,
  onToggleStar,
  onMoveToTrash,
  onRestoreFile,
  onDeletePermanently,
  onFolderOpen,
  onMoveFile,
  refreshTrigger,
  onRefresh
}) => {
  const [loading, setLoading] = useState(false);
  const { isLoading: folderLoading } = useFolderManagement();

  // Show loading state
  if (loading || folderLoading) {
    return (
      <div className="flex-1 flex items-center justify-center py-12">
        <div className="flex items-center space-x-2 text-gray-500">
          <Loader className="h-5 w-5 animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1">
      {files.length === 0 ? (
        <EmptyState 
          searchQuery={searchQuery} 
          activeFileView={activeFileView}
        />
      ) : (
        <>
          {viewMode === 'grid' ? (
            <FileGrid
              files={files}
              activeFileView={activeFileView}
              isDarkMode={isDarkMode}
              onToggleStar={onToggleStar}
              onMoveToTrash={onMoveToTrash}
              onRestoreFile={onRestoreFile}
              onDeletePermanently={onDeletePermanently}
              onFolderOpen={onFolderOpen}
              onMoveFile={onMoveFile}
              onRefresh={onRefresh}
            />
          ) : (
            <FileList
              files={files}
              activeFileView={activeFileView}
              isDarkMode={isDarkMode}
              onToggleStar={onToggleStar}
              onMoveToTrash={onMoveToTrash}
              onRestoreFile={onRestoreFile}
              onDeletePermanently={onDeletePermanently}
              onFolderOpen={onFolderOpen}
              onMoveFile={onMoveFile}
              onRefresh={onRefresh}
            />
          )}
        </>
      )}
    </div>
  );
};

export default FileDisplay;