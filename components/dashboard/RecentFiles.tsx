'use client';

import type { File as DbFile } from '@/lib/db/schema';
import { FileCard } from './ui/FileCard';

interface RecentFilesProps {
    files: Required<DbFile>[] | null;
    onFilePreview: (file: Required<DbFile>) => void;
}

export const RecentFiles = ({ files, onFilePreview }: RecentFilesProps) => {

    if (!files || files.length === 0) {
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
                            isReadOnly={true}
                            isSelected={false}
                            onSelect={() => onFilePreview(file)}
                            onDoubleClick={() => onFilePreview(file)}
                            activeFilter={'all'}
                            onMove={() => { }}
                            onCopy={() => { }}
                            onToggleStar={() => { }}
                            onMoveToTrash={() => { }}
                            onDownload={() => { }}
                            onRestoreFile={() => { }}
                            onDeletePermanently={() => { }}
                            renamingId={null}
                            onStartRename={() => { }}
                            onConfirmRename={() => { }}
                            onCancelRename={() => { }}
                            onShare={() => { }}
                        />
                    </div>
                ))}
            </div>
            <hr className="my-8" />
        </div>
    );
};