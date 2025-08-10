'use client';

import React from 'react';
import type { File } from '@/lib/db/schema';
import FileCard from './FileCard';

interface FileGridProps {
  files: File[];
  activeFileView: string;
  isDarkMode: boolean;
  onToggleStar: (fileId: string) => void;
  onMoveToTrash: (fileId: string) => void;
  onRestoreFile: (fileId: string) => void;
  onDeletePermanently: (fileId: string) => void;
  onFolderOpen?: (folder: File) => void;
  onMoveFile?: (fileId: string, targetFolderId: string | null) => Promise<any>;
  onRefresh?: () => void;
}

const FileGrid: React.FC<FileGridProps> = ({
  files,
  activeFileView,
  isDarkMode,
  onToggleStar,
  onMoveToTrash,
  onRestoreFile,
  onDeletePermanently,
  onFolderOpen,
  onMoveFile,
  onRefresh
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {files.map((file) => (
        <FileCard
          key={file.id}
          file={file}
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
      ))}
    </div>
  );
};

export default FileGrid;