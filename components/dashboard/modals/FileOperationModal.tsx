'use client';

import React, { useState, useEffect, useMemo } from 'react';
import type { File as FileType } from '@/lib/db/schema';
import type { FolderTreeNode } from '@/app/api/folders/tree/route';
import { FolderTree } from '@/components/dashboard/ui/FolderTree';
import { Loader2 } from 'lucide-react';

interface FileOperationModalProps {
    isOpen: boolean;
    onClose: () => void;
    item: Required<FileType> | null;
    selectedCount: number;
    onConfirm: (fileId: string, targetFolderId: string | null) => void;
    title: 'Move' | 'Copy';
    confirmButtonText: string;
}

// Function to get all descendant IDs of a folder node
const getDescendantIds = (nodeId: string, tree: FolderTreeNode[]): Set<string> => {
    const ids = new Set<string>();
    const findNode = (id: string, nodes: FolderTreeNode[]): FolderTreeNode | null => {
        for (const node of nodes) {
            if (node.id === id) return node;
            const found = findNode(id, node.children);
            if (found) return found;
        }
        return null;
    };

    const startingNode = findNode(nodeId, tree);
    if (!startingNode) return ids;

    const stack = [...startingNode.children];
    while (stack.length > 0) {
        const current = stack.pop()!;
        ids.add(current.id);
        stack.push(...current.children);
    }
    return ids;
};

export const FileOperationModal: React.FC<FileOperationModalProps> = ({ isOpen, onClose, item, selectedCount, onConfirm, title, confirmButtonText }) => {
    const [folderTree, setFolderTree] = useState<FolderTreeNode[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            setIsLoading(true);
            fetch('/api/folders/tree')
                .then(res => res.json())
                .then(data => {
                    setFolderTree(data);
                    // Pre-select the item's current parent
                    setSelectedFolderId(item?.parentId ?? null);
                })
                .catch(err => console.error("Failed to load folder tree:", err))
                .finally(() => setIsLoading(false));
        }
    }, [isOpen, item]);

    const disabledIds = useMemo(() => {
        if (!item || !item.isFolder || title !== 'Move') return new Set<string>();
        // Disable the folder itself and all of its children
        const ids = getDescendantIds(item.id, folderTree);
        ids.add(item.id);
        return ids;
    }, [item, folderTree, title]);

    const handleConfirm = () => {
        onConfirm(item?.id ?? '', selectedFolderId);
        onClose();
    };

    const modalTitle = item
        ? `${title} "${item.name}"`
        : `${title} ${selectedCount} item(s)`;

    const isConfirmButtonDisabled = title === 'Move' && (item?.parentId === selectedFolderId || selectedFolderId === item?.id);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center" onClick={onClose}>
            <div className="w-full max-w-md bg-background rounded-lg shadow-xl p-6" onClick={e => e.stopPropagation()}>
                <h2 className="text-xl font-bold text-foreground">{modalTitle}</h2>
                <div className="mt-4 h-64 overflow-y-auto border border-border rounded-md p-2">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-full">
                            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : (
                        <FolderTree
                            nodes={folderTree}
                            selectedFolderId={selectedFolderId}
                            onSelectFolder={setSelectedFolderId}
                            disabledIds={disabledIds}
                        />
                    )}
                </div>
                <div className="mt-6 flex justify-end space-x-3">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-medium bg-secondary rounded-md hover:bg-muted text-foreground cursor-pointer">
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={isConfirmButtonDisabled || isLoading}
                        className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                        {confirmButtonText}
                    </button>
                </div>
            </div>
        </div>
    );
};