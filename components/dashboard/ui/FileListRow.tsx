'use client';

import React from 'react';
import type { File as FileType } from '@/lib/db/schema';
import { Folder, FileText, Star, MoreVertical, Trash2, Download, PenSquare, RefreshCw, Move, Copy, Share } from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { clsx } from 'clsx';
import { RenameInput } from './RenameInput';
import { useFileStore } from '@/lib/store/useFileStore';


// Assume DropdownMenu is available
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface FileListRowProps {
    file: Required<FileType>;
    activeFilter: 'all' | 'starred' | 'trash';
    isSelected: boolean;
    renamingId: string | null;
    onSelect: (event: React.MouseEvent) => void;
    onMove: (file: Required<FileType>) => void;
    onCopy: (file: Required<FileType>) => void;
    onDoubleClick: () => void;
    onToggleStar: (fileIds: string[]) => void;
    onMoveToTrash: (fileId: string[]) => void;
    onStartRename: (fileId: string) => void;
    onConfirmRename: (fileId: string, newName: string) => void;
    onCancelRename: () => void;
    onDownload: (file: FileType) => void;
    onRestoreFile: (fileId: string[]) => void;
    onDeletePermanently: (fileId: string[]) => void;
    onShare: (file: Required<FileType>) => void;
}

export const FileListRow: React.FC<FileListRowProps> = ({ renamingId, onShare, onStartRename, onConfirmRename, onCancelRename, file, isSelected, onSelect, onMove, onCopy, onDoubleClick, activeFilter, onToggleStar, onMoveToTrash, onDownload, onRestoreFile, onDeletePermanently }) => {

    const {
        attributes,
        listeners,
        setNodeRef: draggableRef,
        isDragging,
    } = useDraggable({
        id: file.id,
        data: { file },
    });

    const fileStatuses = useFileStore(state => state.fileStatuses);
    const status = fileStatuses[file.id];

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

    const formatFileSize = (bytes: number) => {
        if (isFolder || bytes === 0) return '—';
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
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className={clsx(
                "group grid grid-cols-12 gap-4 items-center w-full px-4 py-2 rounded-lg transition-colors duration-150 cursor-pointer",
                { "border-blue-500 ring-2 ring-blue-500": isSelected }, // Style for selected items
                { "border-gray-200 dark:border-gray-800": !isSelected },
                // Apply styles for dragging state
                { "opacity-40": isDragging },
                // Apply a ring for a valid drop target (folders only)
                { "ring-2 ring-blue-500": isOver && file.isFolder },
                // Only apply the hover effect when NOT dragging
                { "hover:bg-gray-100 dark:hover:bg-gray-800/80": !isDragging }
            )}
        >

            {status === 'loading' && (
                <div className="absolute inset-0 z-10 bg-white/70 dark:bg-gray-900/70 flex items-center justify-center rounded-lg backdrop-blur-sm">
                    {/* You can add a smaller spinner here if you like */}
                    <p className="text-sm font-semibold">Processing...</p>
                </div>
            )}

            {/* Name & Icon */}
            <div className="col-span-6 flex items-center space-x-4">
                {isFolder ? <Folder className="w-5 h-5 text-blue-500 flex-shrink-0" /> : <FileText className="w-5 h-5 text-gray-500 flex-shrink-0" />}
                {renamingId === file.id ? (
                    <RenameInput
                        currentName={file.name}
                        onConfirmRename={(newName) => onConfirmRename(file.id, newName)}
                        onCancelRename={onCancelRename}
                    />
                ) : (
                    <span className="font-medium text-sm text-gray-800 dark:text-gray-200 truncate" title={file.name}>
                        {file.name}
                    </span>
                )}
                {file.isStarred && <Star className="h-4 w-4 text-yellow-400 flex-shrink-0" />}
            </div>

            {/* Size */}
            <div className="col-span-2 text-sm text-gray-600 dark:text-gray-400">
                {formatFileSize(file.size)}
            </div>

            {/* Last Modified */}
            <div className="col-span-3 text-sm text-gray-600 dark:text-gray-400">
                {format(new Date(file.updatedAt), 'MMM d, yyyy')}
            </div>

            {/* Actions */}
            <div className="col-span-1 flex justify-end">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 opacity-0 group-hover:opacity-100 transition-opacity">
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
                                        <Copy className="w-4 h-4 mr-2" />
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
                            /* Show these actions only for the trash view */
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
        </motion.div>
    );
};