'use client';

import React from 'react';
import type { NewFile } from '@/lib/db/schema';
import FileGrid from './FileGrid';
import FileList from './FileList';
import EmptyState from '@/components/dashboard/EmptyState';

interface FileDisplayProps {
  files: NewFile[];
  viewMode: string;
  activeFileView: string;
  isDarkMode: boolean;
  searchQuery: string;
  onToggleStar: (fileId: string) => void;
  onMoveToTrash: (fileId: string) => void;
  onRestoreFile: (fileId: string) => void;
}

const FileDisplay: React.FC<FileDisplayProps> = ({
  files,
  viewMode,
  activeFileView,
  isDarkMode,
  searchQuery,
  onToggleStar,
  onMoveToTrash,
  onRestoreFile
}) => {
  if (files.length === 0) {
    return <EmptyState searchQuery={searchQuery} activeFileView={activeFileView} />;
  }

  if (viewMode === 'grid') {
    return (
      <FileGrid
        files={files}
        activeFileView={activeFileView}
        isDarkMode={isDarkMode}
        onToggleStar={onToggleStar}
        onMoveToTrash={onMoveToTrash}
        onRestoreFile={onRestoreFile}
      />
    );
  }

  return (
    <FileList
      files={files}
      activeFileView={activeFileView}
      isDarkMode={isDarkMode}
      onToggleStar={onToggleStar}
      onMoveToTrash={onMoveToTrash}
      onRestoreFile={onRestoreFile}
    />
  );
};

export default FileDisplay;