'use client';

import React from 'react';
import type { NewFile } from '@/lib/db/schema';
import FileCard from './FileCard';

interface FileGridProps {
  files: NewFile[];
  activeFileView: string;
  isDarkMode: boolean;
  onToggleStar: (fileId: string) => void;
  onMoveToTrash: (fileId: string) => void;
  onRestoreFile: (fileId: string) => void;
}

const FileGrid: React.FC<FileGridProps> = ({
  files,
  activeFileView,
  isDarkMode,
  onToggleStar,
  onMoveToTrash,
  onRestoreFile
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
        />
      ))}
    </div>
  );
};

export default FileGrid;