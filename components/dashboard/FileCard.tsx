'use client';

import React, { useState } from 'react';
import { Star, Trash2, Download, Upload, XCircle, Folder, Edit3 } from 'lucide-react';
import type { File } from '@/lib/db/schema';
import { getFileIcon, formatFileSize, formatDate } from '@/utils/fileUtils';
import { useFolderManagement } from '@/hooks/useFolderManagement';
import { MoveConfirmationModal } from './MoveConfirmationModal';

interface FileCardProps {
  file: File;
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

const FileCard: React.FC<FileCardProps> = ({
  file,
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
  // Folder-specific state
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState(file.name);
  const [dragTarget, setDragTarget] = useState<{folderId: string, folderName: string} | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  
  const { renameFolder } = useFolderManagement();

  const handlePermanentDelete = () => {
    if (window.confirm(`Are you sure want to permanently delete "${file.name}"? This action cannot be undone`)) {
      onDeletePermanently(file.id);
    }
  };

  // Folder-specific handlers
  const handleFolderOpen = () => {
    if (file.isFolder && onFolderOpen) {
      onFolderOpen(file);
    }
  };

  const handleFolderRename = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || newName.trim() === file.name) {
      setIsRenaming(false);
      setNewName(file.name);
      return;
    }

    try {
      await renameFolder(file.id, newName.trim());
      setIsRenaming(false);
      onRefresh?.();
    } catch (error) {
      setNewName(file.name); // Reset on error
      setIsRenaming(false);
    }
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent) => {
    if (file.isFolder || activeFileView === 'trash') {
      e.preventDefault();
      return;
    }

    e.dataTransfer.setData('application/json', JSON.stringify({
      fileId: file.id,
      fileName: file.name,
      isFolder: file.isFolder
    }));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (!file.isFolder || activeFileView === 'trash') return;
    
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    if (!file.isFolder || activeFileView === 'trash') return;

    try {
      const dragData = JSON.parse(e.dataTransfer.getData('application/json'));
      
      // Prevent dropping folder into itself
      if (dragData.fileId === file.id) return;
      
      setDragTarget({
        folderId: file.id,
        folderName: file.name
      });

      // Store drag data for confirmation
      sessionStorage.setItem('dragData', JSON.stringify(dragData));
    } catch (error) {
      console.error('Error handling drop:', error);
    }
  };

  // Confirm move operation
  const handleConfirmMove = async () => {
    if (!dragTarget || !onMoveFile) return;

    try {
      const dragData = JSON.parse(sessionStorage.getItem('dragData') || '{}');
      await onMoveFile(dragData.fileId, dragTarget.folderId);
      onRefresh?.();
    } catch (error) {
      // Error handled in hook
    } finally {
      setDragTarget(null);
      sessionStorage.removeItem('dragData');
    }
  };

  return (
    <>
      <div
        className={`rounded-lg border p-4 transition-all duration-200 hover:shadow-lg relative ${
          isDarkMode
            ? 'bg-gray-800 border-gray-700 hover:border-gray-600'
            : 'bg-white border-gray-200 hover:border-gray-300'
        } ${
          isDragOver ? 'ring-2 ring-blue-500 bg-blue-50' : ''
        } ${
          file.isFolder ? 'cursor-pointer' : !file.isFolder && activeFileView !== 'trash' ? 'cursor-move' : 'cursor-default'
        }`}
        draggable={!file.isFolder && activeFileView !== 'trash'}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onDoubleClick={file.isFolder ? handleFolderOpen : undefined}
      >
        {/* File Icon and Actions */}
        <div className="flex items-center justify-between mb-3">
          <div className="text-gray-400">
            {file.isFolder ? (
              <Folder className="w-8 h-8 text-blue-500" />
            ) : (
              getFileIcon(file.type)
            )}
          </div>
          <div className="flex space-x-1">
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

                {/* Folder-specific actions */}
                {file.isFolder && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsRenaming(true);
                    }}
                    className="p-1 rounded text-gray-400 hover:text-blue-600 transition-colors duration-200"
                    aria-label="Rename folder"
                    title="Rename folder"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                )}

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
                  aria-label="Restore file"
                  title="Restore file"
                >
                  <Upload className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePermanentDelete();
                  }}
                  className="p-1 rounded text-gray-400 hover:text-red-600 transition-colors duration-200"
                  aria-label="Delete permanently"
                  title="Delete permanently"
                >
                  <XCircle className="w-4 h-4" />
                </button>
              </>
            )}

            {/* Download only for files, not folders */}
            {!file.isFolder && (
              <a
                href={file.fileUrl}
                download={file.name}
                onClick={(e) => e.stopPropagation()}
                className="p-1 rounded text-gray-400 hover:text-blue-600 transition-colors duration-200"
                aria-label="Download file"
                title="Download file"
              >
                <Download className="w-4 h-4" />
              </a>
            )}
          </div>
        </div>

        {/* File Details */}
        {isRenaming ? (
          <form onSubmit={handleFolderRename} className="mb-2">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className={`w-full px-2 py-1 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                isDarkMode 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
              autoFocus
              onBlur={(e) => {
                // Don't close if clicking submit (form will handle it)
                if (!e.relatedTarget || (e.relatedTarget as HTMLButtonElement).type !== 'submit') {
                  setIsRenaming(false);
                  setNewName(file.name);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setIsRenaming(false);
                  setNewName(file.name);
                }
              }}
            />
          </form>
        ) : (
          <h3 
            className={`font-medium truncate mb-2 ${
              file.isFolder ? 'hover:text-blue-600' : ''
            }`} 
            title={file.name}
            onClick={file.isFolder ? handleFolderOpen : undefined}
          >
            {file.name}
          </h3>
        )}

        <div className={`text-sm space-y-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          <p>{file.isFolder ? 'Folder' : formatFileSize(file.size)}</p>
          <p>{formatDate(file.createdAt!)}</p>
        </div>

        {/* Drag Over Overlay */}
        {isDragOver && file.isFolder && (
          <div className="absolute inset-0 bg-blue-500/20 border-2 border-blue-500 border-dashed rounded-lg flex items-center justify-center">
            <div className="text-blue-700 font-medium text-sm">
              Drop to move here
            </div>
          </div>
        )}
      </div>

      {/* Move Confirmation Modal */}
      <MoveConfirmationModal
        isOpen={!!dragTarget}
        onClose={() => setDragTarget(null)}
        onConfirm={handleConfirmMove}
        fileName={sessionStorage.getItem('dragData') ? JSON.parse(sessionStorage.getItem('dragData') || '{}').fileName : ''}
        targetFolderName={dragTarget?.folderName || ''}
        isFolder={sessionStorage.getItem('dragData') ? JSON.parse(sessionStorage.getItem('dragData') || '{}').isFolder : false}
      />
    </>
  );
};

export default FileCard;