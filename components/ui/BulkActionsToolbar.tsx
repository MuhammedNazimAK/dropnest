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
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-background shadow-lg rounded-lg p-2 flex items-center space-x-2 border border-border">
      <span className="text-sm font-medium px-2 text-foreground">{selectedCount} selected</span>
      <div className="h-6 w-px bg-border"></div>

      {isTrashView ? (
        // --- Actions available ONLY in the trash view ---
        <>
          <button title="Restore" onClick={onRestore} className="p-2 hover:bg-muted rounded-md">
            <RotateCcw className="w-4 h-4 text-foreground" />
          </button>
        </>
      ) : (
        // --- Actions available everywhere EXCEPT the trash view ---
        <>
          <button title="Star" onClick={onToggleStar} className="p-2 hover:bg-muted rounded-md">
            <Star className="w-4 h-4 text-foreground" />
          </button>
          <button title="Move" onClick={onMove} className="p-2 hover:bg-muted rounded-md">
            <Move className="w-4 h-4 text-foreground" />
          </button>
          <button
            title={disableCopy ? "Cannot copy folders" : "Make a copy"}
            onClick={onCopy}
            disabled={disableCopy}
            className="p-2 hover:bg-muted rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Copy className="w-4 h-4 text-foreground" />
          </button>
        </>
      )}

      {/* The Delete button is always available, but its action and title change */}
      <button
        title={isTrashView ? "Delete Permanently" : "Move to Trash"}
        onClick={onDelete}
        className="p-2 text-destructive hover:bg-destructive/20 rounded-md"
      >
        <Trash2 className="w-4 h-4" />
      </button>

      <div className="h-6 w-px bg-border"></div>
      <button onClick={onClearSelection} className="text-sm px-2 hover:underline text-foreground">Clear</button>
    </div>
  );
};