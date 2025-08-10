'use client';

import React, { useState } from 'react';
import { Star, Trash2, Download, Upload, Folder, FolderOpen } from 'lucide-react';
import type { File } from '@/lib/db/schema';
import { getFileIcon, formatFileSize, formatDate } from '@/utils/fileUtils';

interface FileListProps {
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

const FileList: React.FC<FileListProps> = ({
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
  const [dragOverFolderId, setDragOverFolderId] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, file: File) => {
    if (file.isFolder) return; // Don't allow dragging folders
    e.dataTransfer.setData('text/plain', file.id);
  };

  const handleDragOver = (e: React.DragEvent, targetFile: File) => {
    if (!targetFile.isFolder) return;
    e.preventDefault();
    setDragOverFolderId(targetFile.id);
  };

  const handleDragLeave = () => {
    setDragOverFolderId(null);
  };

  const handleDrop = async (e: React.DragEvent, targetFolder: File) => {
    e.preventDefault();
    setDragOverFolderId(null);
    
    if (!targetFolder.isFolder) return;
    
    const fileId = e.dataTransfer.getData('text/plain');
    if (fileId && onMoveFile) {
      try {
        await onMoveFile(fileId, targetFolder.id);
        onRefresh?.();
      } catch (error) {
        console.error('Failed to move file:', error);
      }
    }
  };

  const handleFileDoubleClick = (file: File) => {
    if (file.isFolder && onFolderOpen) {
      onFolderOpen(file);
    }
  };

  return (
    <div className={`rounded-lg border overflow-hidden ${
      isDarkMode ? 'border-gray-700' : 'border-gray-200'
    }`}>
      {/* Table Header */}
      <div className={`px-6 py-3 border-b font-medium ${
        isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
      }`}>
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-5">Name</div>
          <div className="col-span-2 hidden sm:block">Size</div>
          <div className="col-span-2 hidden md:block">Date Added</div>
          <div className="col-span-3 md:col-span-3">Actions</div>
        </div>
      </div>

      {/* Table Body */}
      <div className={isDarkMode ? 'bg-gray-800' : 'bg-white'}>
        {files.map((file) => (
          <div
            key={file.id}
            draggable={!file.isFolder}
            onDragStart={(e) => handleDragStart(e, file)}
            onDragOver={(e) => handleDragOver(e, file)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, file)}
            onDoubleClick={() => handleFileDoubleClick(file)}
            className={`px-6 py-4 border-b last:border-b-0 transition-colors duration-200 ${
              isDarkMode ? 'border-gray-700 hover:bg-gray-700' : 'border-gray-200 hover:bg-gray-50'
            } ${
              file.isFolder && dragOverFolderId === file.id 
                ? 'bg-blue-100 border-blue-300' 
                : ''
            } ${
              file.isFolder 
                ? 'cursor-pointer' 
                : !file.isFolder 
                  ? 'cursor-move' 
                  : 'cursor-default'
            }`}
          >
            <div className="grid grid-cols-12 gap-4 items-center">
              {/* File Name with Icon */}
              <div className="col-span-5 flex items-center space-x-3">
                <div className={`text-gray-400 ${file.isFolder ? 'text-blue-500' : ''}`}>
                  {file.isFolder ? (
                    dragOverFolderId === file.id ? (
                      <FolderOpen className="w-5 h-5" />
                    ) : (
                      <Folder className="w-5 h-5" />
                    )
                  ) : (
                    getFileIcon(file.type)
                  )}
                </div>
                <span className="truncate font-medium" title={file.name}>
                  {file.name}
                </span>
                {file.isFolder && (
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    Folder
                  </span>
                )}
              </div>

              {/* File Size */}
              <div className="col-span-2 hidden sm:block text-sm text-gray-500">
                {file.isFolder ? '-' : formatFileSize(file.size)}
              </div>

              {/* Date Added */}
              <div className="col-span-2 hidden md:block text-sm text-gray-500">
                {formatDate(file.createdAt!)}
              </div>

              {/* Actions */}
              <div className="col-span-5 md:col-span-3 flex items-center space-x-2">
                {activeFileView !== 'trash' && (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleStar(file.id);
                      }}
                      className={`p-1 rounded transition-colors duration-200 ${
                        file.isStarred
                          ? 'text-yellow-500 hover:text-yellow-600'
                          : 'text-gray-400 hover:text-gray-600'
                      }`}
                      aria-label={file.isStarred ? 'Unstar file' : 'Star file'}
                    >
                      <Star className="w-4 h-4" fill={file.isStarred ? 'currentColor' : 'none'} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onMoveToTrash(file.id);
                      }}
                      className="p-1 rounded text-gray-400 hover:text-red-600 transition-colors duration-200"
                      aria-label="Move to trash"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                )}
                {activeFileView === 'trash' && (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRestoreFile(file.id);
                      }}
                      className="p-1 rounded text-gray-400 hover:text-green-600 transition-colors duration-200"
                      title="Restore"
                      aria-label="Restore file"
                    >
                      <Upload className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm(`Permanently delete "${file.name}"?`)) {
                          onDeletePermanently(file.id);
                        }
                      }}
                      className="p-1 rounded text-gray-400 hover:text-red-600 transition-colors duration-200"
                      title="Delete Permanently"
                      aria-label="Delete Permanently"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                )}
                {!file.isFolder && (
                  <a
                    href={file.fileUrl}
                    download={file.name}
                    onClick={(e) => e.stopPropagation()}
                    className="p-1 rounded text-gray-400 hover:text-blue-600 transition-colors duration-200"
                    title='Download file'
                    aria-label="Download file"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FileList;