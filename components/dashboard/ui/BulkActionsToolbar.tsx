'use client';

import { Trash2, Move, Copy, Star } from 'lucide-react';

interface BulkActionsToolbarProps {
  selectedCount: number;
  onDelete: () => void;
  onMove: () => void;
  onCopy: () => void;
  onStar: () => void; // We can add this later
  onClearSelection: () => void;
}

export const BulkActionsToolbar: React.FC<BulkActionsToolbarProps> = ({
  selectedCount, onDelete, onMove, onCopy, onClearSelection
}) => {
  if (selectedCount === 0) return null;

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-white dark:bg-gray-800 shadow-lg rounded-lg p-2 flex items-center space-x-2 border dark:border-gray-700">
      <span className="text-sm font-medium px-2">{selectedCount} selected</span>
      <div className="h-6 w-px bg-gray-200 dark:bg-gray-700"></div>
      
      {/* Action Buttons */}
      <button onClick={onMove} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"><Move className="w-4 h-4" /></button>
      <button onClick={onCopy} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"><Copy className="w-4 h-4" /></button>
      <button onClick={onDelete} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-md"><Trash2 className="w-4 h-4" /></button>
      
      <div className="h-6 w-px bg-gray-200 dark:bg-gray-700"></div>
      <button onClick={onClearSelection} className="text-sm px-2 hover:underline">Clear</button>
    </div>
  );
};