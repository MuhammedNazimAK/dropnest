'use client';

import React from 'react';
import type { File as DbFile } from '@/lib/db/schema';
import { EmptyState } from '@/components/dashboard/ui/EmptyState';
import { FileCard } from '@/components/dashboard/ui/FileCard';
import { FileListRow } from '@/components/dashboard/ui/FileListRow';
import { FileStatus } from '@/lib/store/useFileStore';


interface FileViewProps {
  files: Required<DbFile>[];
  viewMode: 'grid' | 'list';
  activeFilter: 'all' | 'starred' | 'trash';
  onFolderOpen: (folder: DbFile) => void;
  onToggleStar: (fileId: string[]) => void;
  onRestoreFile: (fileIds: string[]) => void;
  onDeletePermanently: (fileId: string[]) => void;
  onRename: (fileId: string, newName: string) => void;
  onMove: (file: Required<DbFile>) => void;
  onCopy: (file: Required<DbFile>) => void;
  onDownload: (file: DbFile) => void;
  onUploadClick: () => void;
  selectedIds: Set<string>;
  onFileSelect: (fileId: string, event: React.MouseEvent) => void;
  renamingId: string | null;
  onStartRename: (fileId: string) => void;
  onConfirmRename: (fileId: string, newName: string) => void;
  onCancelRename: () => void;
  onDoubleClick: (item: Required<DbFile>) => void;
  onShare: (file: Required<DbFile>) => void;
  fileStatuses: Record<string, FileStatus>;
  onMoveToTrash: (fileIds: string[]) => void;
}


export const FileView: React.FC<FileViewProps> = (props) => {
  const { files, viewMode, activeFilter, onFolderOpen, onUploadClick, selectedIds, onFileSelect, onDoubleClick, fileStatuses } = props;

  if (files.length === 0) {
    const messages = {
      all: { message: "Your space is empty", details: "Upload a file or create a folder to get started." },
      starred: { message: "No starred files", details: "Star a file to see it appear here." },
      trash: { message: "Trash is empty", details: "Items moved to the trash will appear here." },
    };

    // If the trash is empty, show the specific trash message but without an upload button.
    if (activeFilter === 'trash') {
      return <EmptyState {...messages.trash} />;
    }

    // For all other empty views, show the message WITH the upload button.
    return <EmptyState {...messages[activeFilter]} onUploadClick={onUploadClick} />;
  }

  // Pass all props down to the children
  const childProps = { ...props };

  if (viewMode === 'grid') {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {files.map(file => (
          <FileCard
            key={file.id}
            file={file}
            {...childProps}
            isSelected={selectedIds.has(file.id)}
            onSelect={(event) => onFileSelect(file.id, event)}
            onDoubleClick={() => onDoubleClick(file)}
          />
        ))}
      </div>
    );
  }

  if (viewMode === 'list') {
    return (
      <div className="space-y-1">
        {/* Header Row */}
        <div className="grid grid-cols-12 gap-4 px-4 py-2 text-xs font-semibold text-gray-500 uppercase border-b border-gray-200 dark:border-gray-800">
          <div className="col-span-5 md:col-span-6">Name</div>
          <div className="col-span-3 md:col-span-2">Size</div>
          <div className="col-span-4 md:col-span-3">Last Modified</div>
        </div>
        {/* File Rows */}
        {files.map(file => (
          <FileListRow
            key={file.id}
            file={file}
            {...childProps}
            isSelected={selectedIds.has(file.id)}
            onSelect={(event) => onFileSelect(file.id, event)}
            onDoubleClick={() => onDoubleClick(file)}
          />
        ))}
      </div>
    );
  }

  return null;
};