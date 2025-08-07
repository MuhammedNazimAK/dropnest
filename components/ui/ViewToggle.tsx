'use client';

import React from 'react';
import { Grid, List } from 'lucide-react';

interface ViewToggleProps {
  viewMode: string;
  setViewMode: (mode: string) => void;
  isDarkMode: boolean;
}

const ViewToggle: React.FC<ViewToggleProps> = ({ 
  viewMode, 
  setViewMode, 
  isDarkMode 
}) => {
  return (
    <div className={`flex rounded-lg border ${
      isDarkMode ? 'border-gray-600' : 'border-gray-300'
    }`}>
      <button
        onClick={() => setViewMode('grid')}
        className={`p-2 rounded-l-lg transition-colors duration-200 ${
          viewMode === 'grid'
            ? 'bg-blue-600 text-white'
            : isDarkMode
            ? 'hover:bg-gray-700 text-gray-400'
            : 'hover:bg-gray-100 text-gray-600'
        }`}
        aria-label="Grid view"
      >
        <Grid className="w-4 h-4" />
      </button>
      <button
        onClick={() => setViewMode('list')}
        className={`p-2 rounded-r-lg transition-colors duration-200 ${
          viewMode === 'list'
            ? 'bg-blue-600 text-white'
            : isDarkMode
            ? 'hover:bg-gray-700 text-gray-400'
            : 'hover:bg-gray-100 text-gray-600'
        }`}
        aria-label="List view"
      >
        <List className="w-4 h-4" />
      </button>
    </div>
  );
};

export default ViewToggle;