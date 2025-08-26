'use client';

import { Trash2, Move, Copy, Star, RotateCcw } from 'lucide-react';

interface BulkActionsToolbarProps {
  selectedCount: number;
  activeFilter: 'all' | 'starred' | 'trash';
  disableCopy: boolean; // True if the selection contains a folder
  onDelete: () => void;
  onMove: () => void;
  onCopy: () => void;
  onRestore: () => void;
  onToggleStar: () => void; // For bulk starring
  onClearSelection: () => void;
}

export const BulkActionsToolbar: React.FC<BulkActionsToolbarProps> = ({
  selectedCount,
  activeFilter,
  disableCopy,
  onDelete,
  onMove,
  onCopy,
  onRestore,
  onToggleStar,
  onClearSelection
}) => {
  if (selectedCount === 0) return null;
  
  const isTrashView = activeFilter === 'trash';

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-white dark:bg-gray-800 shadow-lg rounded-lg p-2 flex items-center space-x-2 border dark:border-gray-700">
      <span className="text-sm font-medium px-2">{selectedCount} selected</span>
      <div className="h-6 w-px bg-gray-200 dark:bg-gray-700"></div>
      
      {isTrashView ? (
        // --- Actions available ONLY in the trash view ---
        <>
          <button title="Restore" onClick={onRestore} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md">
            <RotateCcw className="w-4 h-4" />
          </button>
        </>
      ) : (
        // --- Actions available everywhere EXCEPT the trash view ---
        <>
          <button title="Star" onClick={onToggleStar} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md">
            <Star className="w-4 h-4" />
          </button>
          <button title="Move" onClick={onMove} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md">
            <Move className="w-4 h-4" />
          </button>
          <button 
            title={disableCopy ? "Cannot copy folders" : "Make a copy"}
            onClick={onCopy} 
            disabled={disableCopy}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Copy className="w-4 h-4" />
          </button>
        </>
      )}

      {/* The Delete button is always available, but its action and title change */}
      <button 
        title={isTrashView ? "Delete Permanently" : "Move to Trash"}
        onClick={onDelete} 
        className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-md"
      >
        <Trash2 className="w-4 h-4" />
      </button>
      
      <div className="h-6 w-px bg-gray-200 dark:bg-gray-700"></div>
      <button onClick={onClearSelection} className="text-sm px-2 hover:underline">Clear</button>
    </div>
  );
};