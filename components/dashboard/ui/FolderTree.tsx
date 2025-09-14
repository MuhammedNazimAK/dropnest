'use client';

import React, { useState } from 'react';
import type { FolderTreeNode } from '@/app/api/folders/tree/route';
import { ChevronRight, Folder } from 'lucide-react';
import { clsx } from 'clsx'; // A utility for constructing class names conditionally

interface FolderTreeProps {
  nodes: FolderTreeNode[];
  selectedFolderId: string | null;
  onSelectFolder: (folderId: string | null) => void;
  disabledIds: Set<string>;
  level?: number;
}

export const FolderTree: React.FC<FolderTreeProps> = ({ nodes, selectedFolderId, onSelectFolder, disabledIds, level = 0 }) => {
  return (
    <div className="space-y-1">
      {nodes.map(node => (
        <FolderNode 
          key={node.id} 
          node={node} 
          selectedFolderId={selectedFolderId} 
          onSelectFolder={onSelectFolder} 
          disabledIds={disabledIds}
          level={level}
        />
      ))}
    </div>
  );
};

const FolderNode: React.FC<{ node: FolderTreeNode } & Omit<FolderTreeProps, 'nodes'>> = ({ node, selectedFolderId, onSelectFolder, disabledIds, level = 0 }) => {
    const [isOpen, setIsOpen] = useState(true); // Default to open
    const isRoot = node.id === 'root';
    const isDisabled = disabledIds.has(node.id);

    const handleSelect = () => {
        if (isDisabled) return;
        onSelectFolder(isRoot ? null : node.id);
    };

    return (
        <div>
            <div 
                onClick={handleSelect}
                style={{ paddingLeft: `${level * 1.5}rem` }}
                className={clsx(
                    "flex items-center space-x-2 p-2 rounded-md transition-colors",
                    { "bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300": selectedFolderId === (isRoot ? null : node.id) },
                    { "hover:bg-gray-100 dark:hover:bg-gray-700": !isDisabled },
                    { "cursor-pointer": !isDisabled },
                    { "opacity-50 cursor-not-allowed": isDisabled }
                )}
            >
                {node.children.length > 0 ? (
                    <ChevronRight 
                        className={clsx("w-4 h-4 transform transition-transform", { "rotate-90": isOpen })}
                        onClick={(e) => {
                            e.stopPropagation(); // Prevent folder selection when toggling
                            setIsOpen(!isOpen);
                        }}
                    />
                ) : (
                    <div className="w-4"></div> // Placeholder for alignment
                )}
                <Folder className="w-5 h-5 text-yellow-500" />
                <span className="font-medium truncate">{node.name}</span>
            </div>
            {isOpen && node.children.length > 0 && (
                <FolderTree
                    nodes={node.children}
                    selectedFolderId={selectedFolderId}
                    onSelectFolder={onSelectFolder}
                    disabledIds={disabledIds}
                    level={level + 1}
                />
            )}
        </div>
    );
};