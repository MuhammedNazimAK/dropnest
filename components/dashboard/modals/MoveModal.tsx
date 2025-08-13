'use client';

import React, { useState, useEffect, useMemo } from 'react';
import type { File as FileType } from '@/lib/db/schema';
import type { FolderTreeNode } from '@/app/api/folders/tree/route';
import { FolderTree } from '@/components/dashboard/ui/FolderTree';
import { Loader2 } from 'lucide-react';

interface MoveModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemToMove: Required<FileType> | null;
  onConfirmMove: (fileId: string, targetFolderId: string | null) => void;
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

export const MoveModal: React.FC<MoveModalProps> = ({ isOpen, onClose, itemToMove, onConfirmMove }) => {
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
                    setSelectedFolderId(itemToMove?.parentId ?? null);
                })
                .catch(err => console.error("Failed to load folder tree:", err))
                .finally(() => setIsLoading(false));
        }
    }, [isOpen, itemToMove]);

    const disabledIds = useMemo(() => {
        if (!itemToMove || !itemToMove.isFolder) return new Set<string>();
        // Disable the folder itself and all of its children
        const ids = getDescendantIds(itemToMove.id, folderTree);
        ids.add(itemToMove.id);
        return ids;
    }, [itemToMove, folderTree]);
    
    const handleConfirm = () => {
        if (!itemToMove) return;
        onConfirmMove(itemToMove.id, selectedFolderId);
        onClose();
    };

    const isMoveButtonDisabled = itemToMove?.parentId === selectedFolderId || selectedFolderId === itemToMove?.id;

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center" onClick={onClose}>
            <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6" onClick={e => e.stopPropagation()}>
                <h2 className="text-xl font-bold">Move "{itemToMove?.name}"</h2>
                <div className="mt-4 h-64 overflow-y-auto border dark:border-gray-700 rounded-md p-2">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-full">
                            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
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
                    <button onClick={onClose} className="px-4 py-2 text-sm font-medium bg-gray-200 dark:bg-gray-700 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600">
                        Cancel
                    </button>
                    <button onClick={handleConfirm} disabled={isMoveButtonDisabled || isLoading} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed">
                        Move Here
                    </button>
                </div>
            </div>
        </div>
    );
};