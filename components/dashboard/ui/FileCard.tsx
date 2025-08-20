'use client';

import React from 'react';
import type { File as FileType } from '@/lib/db/schema';
import { Folder, FileText, Star, MoreVertical, Trash2, Download, PenSquare, RefreshCw, Move, Copy } from 'lucide-react';
import { motion } from 'framer-motion';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { clsx } from 'clsx';

// DropdownMenu components from a UI library Shadcn/UI
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface FileCardProps {
  file: Required<FileType>;
  activeFilter: 'all' | 'starred' | 'trash';
  onMove: (file: Required<FileType>) => void;
  onCopy: (file: Required<FileType>) => void;
  onDoubleClick: () => void;
  onToggleStar: (fileId: string, isStarred: boolean) => void;
  onMoveToTrash: (fileId: string) => void;
  onRename: (fileId: string, newName: string) => void;
  onDownload: (file: FileType) => void;
  onRestoreFile: (fileId: string) => void;
  onDeletePermanently: (fileId: string) => void;
  isSelected: boolean;
  onSelect: (event: React.MouseEvent) => void;
}

export const FileCard: React.FC<FileCardProps> = ({ file, isSelected, onSelect, onMove, onCopy, onDoubleClick, activeFilter, onDownload, onToggleStar, onRename, onMoveToTrash, onRestoreFile, onDeletePermanently }) => {

  const {
    attributes,
    listeners,
    setNodeRef: draggableRef,
    isDragging,
  } = useDraggable({
    id: file.id,
    data: { file },
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

  // Simple signature that onSelect can use.
  const handleRename = () => {
    // 1. Prompt the user for the new name
    const newName = prompt("Enter new name:", file.name);

    // 2. Validate the input and call the prop function if valid
    if (newName && newName.trim() !== "" && newName !== file.name) {
      onRename(file.id, newName.trim());
    }
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
        "group relative rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800/50",
        "transition-all duration-200 cursor-pointer",
        "h-60 w-full",
        { "border-blue-500 ring-2 ring-blue-500": isSelected }, // Style for selected items
        { "border-gray-200 dark:border-gray-800": !isSelected },
        { "cursor-grab": !isDragging },
        { "opacity-30": isDragging },
        // The ring effect is a great indicator, let's keep it.
        { "ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-gray-900": isOver && file.isFolder },
      )}
    >
      <div className="p-4 flex flex-col h-full">
        {/* Icon and Actions */}
        <div className="flex justify-between items-start mb-4">
          <div className="w-10 h-10 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded-lg">
            {isFolder ? (
              <Folder className="w-6 h-6 text-blue-500" />
            ) : (
              <FileText className="w-6 h-6 text-gray-500" />
            )}
          </div>
          <div className="absolute top-2 right-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 opacity-0 group-hover:opacity-100 transition-opacity">
                  <MoreVertical className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                {/* Show these actions for normal and starred views */}
                {activeFilter !== 'trash' ? (
                  <>
                    {!file.isFolder && (
                      <DropdownMenuItem onSelect={() => onDownload(file)}>
                        <Download className="mr-2 h-4 w-4" />
                        <span>Download</span>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onSelect={() => onToggleStar(file.id, file.isStarred)}>
                      <Star className={`mr-2 h-4 w-4 ${file.isStarred ? 'text-yellow-400 fill-yellow-400' : ''}`} />
                      <span>{file.isStarred ? 'Unstar' : 'Star'}</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onMove(file)}>
                      <Move className="w-4 h-4 mr-2" />
                      <span>Move</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onCopy(file)}>
                      <Copy className="w-4 h-4 mr-2" /> {/* You'll need to import the Copy icon from lucide-react */}
                      <span>Make a copy</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={handleRename}>
                      <PenSquare className="mr-2 h-4 w-4" />
                      <span>Rename</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onSelect={() => onMoveToTrash(file.id)} className="text-red-500 focus:bg-red-500 focus:text-white">
                      <Trash2 className="mr-2 h-4 w-4" />
                      <span>Move to Trash</span>
                    </DropdownMenuItem>
                  </>
                ) : (
                  /* Show these actions only for the trash view */
                  <>
                    <DropdownMenuItem onSelect={() => onRestoreFile(file.id)}>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      <span>Restore</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => onDeletePermanently(file.id)} className="text-red-500 focus:bg-red-500 focus:text-white">
                      <Trash2 className="mr-2 h-4 w-4" />
                      <span>Delete Permanently</span>
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Thumbnail for image files */}
        {!isFolder && file.thumbnailUrl && (
          <div className="flex-grow mb-4 flex items-center justify-center">
            <img
              src={file.thumbnailUrl}
              alt={file.name}
              className="max-h-24 object-contain rounded-md"
            />
          </div>
        )}

        {/* Spacer for non-image files to maintain height */}
        {(!isFolder || (!isFolder && !file.thumbnailUrl)) && <div className="flex-grow"></div>}


        {/* File Name and Size */}
        <div className="mt-auto">
          <p className="font-semibold text-sm text-gray-800 dark:text-gray-200 truncate" title={file.name}>
            {file.name}
          </p>
          {!isFolder && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {formatFileSize(file.size)}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
};