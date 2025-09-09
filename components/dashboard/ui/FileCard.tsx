'use client';

import React from 'react';
import type { File as FileType } from '@/lib/db/schema';
import { Folder, FileText, Star, MoreVertical, Trash2, Download, PenSquare, RefreshCw, Move, Copy, Share } from 'lucide-react';
import { motion } from 'framer-motion';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { clsx } from 'clsx';
import { RenameInput } from './RenameInput';

// DropdownMenu components from a UI library Shadcn/UI
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Spinner = () => (
  <svg className="animate-spin h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

interface FileCardProps {
  file: Required<FileType>;
  activeFilter: 'all' | 'starred' | 'trash';
  onMove: (file: Required<FileType>) => void;
  onCopy: (file: Required<FileType>) => void;
  onDoubleClick: () => void;
  onToggleStar: (fileId: string[]) => void;
  onMoveToTrash: (fileId: string[]) => void;
  onDownload: (file: FileType) => void;
  onRestoreFile: (fileId: string[]) => void;
  onDeletePermanently: (fileId: string[]) => void;
  isSelected: boolean;
  onSelect: (event: React.MouseEvent) => void;
  renamingId: string | null;
  onStartRename: (fileId: string) => void;
  onConfirmRename: (fileId: string, newName: string) => void;
  onCancelRename: () => void;
  onShare: (file: Required<FileType>) => void;
  isReadOnly?: boolean;
  status?: 'loading';
}

export const FileCard: React.FC<FileCardProps> = ({ file, status, isReadOnly, onShare, isSelected, onSelect, onMove, onCopy, onDoubleClick, activeFilter, onDownload, onToggleStar, onMoveToTrash, onRestoreFile, onDeletePermanently, onStartRename, renamingId, onConfirmRename, onCancelRename }) => {

  const {
    attributes,
    listeners,
    setNodeRef: draggableRef,
    isDragging,
  } = useDraggable({
    id: file.id,
    data: { file },
    disabled: renamingId === file.id,
  });


  const {
    setNodeRef: droppableRef, // A separate ref for the droppable target
    isOver,
  } = useDroppable({
    id: file.id, // The folder's ID is also its droppable ID
    disabled: !file.isFolder, // Disable dropping on anything that isn't a folder
  });

  // Combine refs since one element can't have two `ref` props
  const setRefs = (node: HTMLElement | null) => {
    draggableRef(node);
    if (file.isFolder) {
      droppableRef(node);
    }
  };

  const isFolder = file.isFolder;

  const cardVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const handleStartRename = () => {
    onStartRename(file.id);
  };

  return (
    <motion.div
      ref={setRefs}
      {...listeners}
      {...attributes}
      onClick={onSelect}
      onDoubleClick={onDoubleClick}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      transition={{ duration: 0.2 }}
      className={clsx(
        "group relative rounded-xl border bg-white dark:bg-gray-800/50",
        "transition-all duration-200 cursor-pointer h-52 w-full",
        "p-4 flex flex-col", // Make the root element the flex container
        {
          "border-blue-500 ring-2 ring-blue-500": isSelected,
          "ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-gray-900": !isSelected && isOver && file.isFolder,
          "border-gray-200 dark:border-gray-800": !isSelected && !(isOver && file.isFolder),
          "cursor-grab": !isDragging,
          "opacity-40": isDragging,
        }
      )}
    >

      {/* It's the first child of the relative parent, ensuring it covers everything below it. */}
      {status === 'loading' && (
        <div className="absolute inset-0 z-10 bg-white/70 dark:bg-gray-900/70 flex items-center justify-center rounded-xl backdrop-blur-sm">
          <Spinner />
        </div>
      )}

      {/* Star Icon (absolutely positioned) */}
      {file.isStarred && (
        <div className="absolute top-2 left-2 text-yellow-400">
          <Star className="w-4 h-4 fill-current" />
        </div>
      )}

      {/* Header Section (Icon and Actions) */}
      <div className="flex-shrink-0">
        <div className="flex justify-between items-start mb-4">
          <div className="w-10 h-10 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded-lg">
            {isFolder ? (
              <Folder className="w-6 h-6 text-blue-500" />
            ) : (
              <FileText className="w-6 h-6 text-gray-500" />
            )}
          </div>
          {!isReadOnly && (
            <div className="absolute top-2 right-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 opacity-0 group-hover:opacity-100 transition-opacity">
                    <MoreVertical className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                  {activeFilter !== 'trash' ? (
                    <>
                      {!file.isFolder && (
                        <DropdownMenuItem onSelect={() => onDownload(file)}>
                          <Download className="mr-2 h-4 w-4" />
                          <span>Download</span>
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onSelect={() => onToggleStar([file.id])}>
                        <Star className={`mr-2 h-4 w-4 ${file.isStarred ? 'text-yellow-400 fill-yellow-400' : ''}`} />
                        <span>{file.isStarred ? 'Unstar' : 'Star'}</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onMove(file)}>
                        <Move className="w-4 h-4 mr-2" />
                        <span>Move</span>
                      </DropdownMenuItem>
                      {!file.isFolder && (
                        <DropdownMenuItem onClick={() => onCopy(file)}>
                          <Copy className="mr-2 h-4 w-4" />
                          <span>Make a copy</span>
                        </DropdownMenuItem>
                      )}
                      {!file.isFolder && (
                        <DropdownMenuItem onSelect={() => onShare(file)}>
                          <Share className="mr-2 h-4 w-4" />
                          <span>Share</span>
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onSelect={handleStartRename}>
                        <PenSquare className="mr-2 h-4 w-4" />
                        <span>Rename</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onSelect={() => onMoveToTrash([file.id])} className="text-red-500 focus:bg-red-500 focus:text-white">
                        <Trash2 className="mr-2 h-4 w-4" />
                        <span>Move to Trash</span>
                      </DropdownMenuItem>
                    </>
                  ) : (
                    <>
                      <DropdownMenuItem onSelect={() => onRestoreFile([file.id])}>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        <span>Restore</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => onDeletePermanently([file.id])} className="text-red-500 focus:bg-red-500 focus:text-white">
                        <Trash2 className="mr-2 h-4 w-4" />
                        <span>Delete Permanently</span>
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
      </div>

      {/* Middle Section (Thumbnail or Spacer) - This will grow to fill space */}
      <div className="flex-grow w-full flex items-center justify-center mb-2 min-h-0">
        {!isFolder && file.thumbnailUrl && (
          <img
            src={file.thumbnailUrl}
            alt={file.name}
            className="max-h-full max-w-full object-contain"
          />
        )}
      </div>

      {/* Footer Section (Name, Size) - This will always be at the bottom */}
      <div className="flex-shrink-0">
        {renamingId === file.id ? (
          <RenameInput
            currentName={file.name}
            onConfirmRename={(newName) => onConfirmRename(file.id, newName)}
            onCancelRename={onCancelRename}
          />
        ) : (
          <p className="font-semibold text-sm text-gray-800 dark:text-gray-200 truncate" title={file.name}>
            {file.name}
          </p>
        )}
        {!isFolder && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {formatFileSize(file.size)}
          </p>
        )}
      </div>
    </motion.div>
  );
};