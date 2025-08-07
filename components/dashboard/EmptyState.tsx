'use client';

import React from 'react';
import { File } from 'lucide-react';

interface EmptyStateProps {
  searchQuery: string;
  activeFileView: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({ searchQuery, activeFileView }) => {
  return (
    <div className="text-center py-12">
      <File className="w-16 h-16 mx-auto mb-4 text-gray-400" />
      <h3 className="text-lg font-medium mb-2">No files found</h3>
      <p className="text-gray-500">
        {searchQuery 
          ? 'Try adjusting your search query' 
          : `No files in ${activeFileView}`
        }
      </p>
    </div>
  );
};

export default EmptyState;