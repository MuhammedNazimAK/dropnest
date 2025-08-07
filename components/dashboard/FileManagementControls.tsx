'use client';

import React from 'react';
import type { NewFile } from '@/lib/db/schema';
import SearchInput from '@/components/ui/SearchInput';
import ViewToggle from '@/components/ui/ViewToggle';

interface FileManagementControlsProps {
  activeFileView: string;
  files: NewFile[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  viewMode: string;
  setViewMode: (mode: string) => void;
  isDarkMode: boolean;
  onEmptyTrash: () => void;
}

const FileManagementControls: React.FC<FileManagementControlsProps> = ({
  activeFileView,
  files,
  searchQuery,
  setSearchQuery,
  viewMode,
  setViewMode,
  isDarkMode,
  onEmptyTrash
}) => {
  const getFileCount = (view: string) => {
    if (view === 'all') return files.filter(f => !f.isTrash).length;
    if (view === 'starred') return files.filter(f => f.isStarred && !f.isTrash).length;
    if (view === 'trash') return files.filter(f => f.isTrash).length;
    return 0;
  };

  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
      <div className="flex items-center space-x-4">
        <h2 className="text-xl font-semibold capitalize">{activeFileView} Files</h2>
        {activeFileView === 'trash' && getFileCount('trash') > 0 && (
          <button
            onClick={onEmptyTrash}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 text-sm"
          >
            Empty Trash
          </button>
        )}
      </div>
      
      <div className="flex items-center space-x-4">
        <SearchInput
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          isDarkMode={isDarkMode}
          placeholder="Search files..."
        />
        
        <ViewToggle
          viewMode={viewMode}
          setViewMode={setViewMode}
          isDarkMode={isDarkMode}
        />
      </div>
    </div>
  );
};

export default FileManagementControls;