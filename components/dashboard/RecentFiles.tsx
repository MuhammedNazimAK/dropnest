'use client';

import React, { useState, useEffect } from 'react';
import type { File as DbFile } from '@/lib/db/schema';
import { Skeleton } from '@/components/ui/skeleton';
import { FileCard } from './ui/FileCard';
import { EmptyState } from './ui/EmptyState';

interface RecentFilesProps {
  onFilePreview: (file: Required<DbFile>) => void;
}

export const RecentFiles = ({ onFilePreview }: RecentFilesProps) => {
    const [files, setFiles] = useState<Required<DbFile>[] | null>(null);

    useEffect(() => {
        fetch('/api/files/recent')
            .then(res => res.json())
            .then(data => setFiles(data))
            .catch(() => setFiles([])); // On error, show empty state
    }, []);

    // --- Loading State ---
    if (files === null) {
        return (
            <div className='mt-8'>
                <h2 className="text-lg font-semibold mb-4">Recent</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <Skeleton key={i} className="h-52 w-full rounded-xl" />
                    ))}
                </div>
                <hr className="my-8" />
            </div>
        );
    }

    // --- Empty State ---
    if (files.length === 0) {
        return (
            <div className="mt-8">
                <h2 className="text-lg font-semibold mb-4">Suggested for you</h2>
                <div className="text-center p-8 bg-gray-50 dark:bg-gray-800/20 rounded-xl">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        As you use DropNest, recently viewed files will automatically show up here.
                    </p>
                </div>
                <hr className="my-8" />
            </div>
        );
    }

    // --- Content State ---
    return (
        <div className="mt-8">
            <h2 className="text-lg font-semibold mb-4">Recent</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {files.map(file => (
                    <div key={file.id} onClick={() => onFilePreview(file)}>
                        <FileCard
                            file={file}
                            isSelected={false}
                            onSelect={() => onFilePreview(file)}
                            onDoubleClick={() => onFilePreview(file)}
                            activeFilter={'all'}
                            onMove={() => {}}
                            onCopy={() => {}}
                            onToggleStar={() => {}}
                            onMoveToTrash={() => {}}
                            onDownload={() => {}}
                            onRestoreFile={() => {}}
                            onDeletePermanently={() => {}}
                            renamingId={null}
                            onStartRename={() => {}}
                            onConfirmRename={() => {}}
                            onCancelRename={() => {}}
                            onShare={() => {}}
                        />
                    </div>
                ))}
            </div>
            <hr className="my-8" />
        </div>
    );
};