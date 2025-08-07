'use client';

import React from 'react';
import { File, Star, Trash2 } from 'lucide-react';
import type { NewFile } from '@/lib/db/schema';

interface FileCategoryTabsProps {
  activeFileView: string;
  setActiveFileView: (view: string) => void;
  files: NewFile[];
  isDarkMode: boolean;
}

const FileCategoryTabs: React.FC<FileCategoryTabsProps> = ({
  activeFileView,
  setActiveFileView,
  files,
  isDarkMode
}) => {
  const getFileCount = (view: string) => {
    if (view === 'all') return files.filter(f => !f.isTrash).length;
    if (view === 'starred') return files.filter(f => f.isStarred && !f.isTrash).length;
    if (view === 'trash') return files.filter(f => f.isTrash).length;
    return 0;
  };

  const categories = [
    { key: 'all', label: 'All Files', icon: File, count: getFileCount('all') },
    { key: 'starred', label: 'Starred', icon: Star, count: getFileCount('starred') },
    { key: 'trash', label: 'Trash', icon: Trash2, count: getFileCount('trash') }
  ];

  return (
    <div className="lg:w-1/2">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {categories.map(({ key, label, icon: Icon, count }) => (
          <button
            key={key}
            onClick={() => setActiveFileView(key)}
            className={`p-4 rounded-lg text-left transition-colors duration-200 ${
              activeFileView === key
                ? 'bg-blue-100 border border-blue-200 text-blue-900'
                : isDarkMode
                ? 'bg-gray-800 hover:bg-gray-700 border border-gray-700'
                : 'bg-white hover:bg-gray-50 border border-gray-200'
            }`}
          >
            <div className="flex items-center space-x-3">
              <Icon className="w-5 h-5" />
              <div>
                <p className="font-medium">{label}</p>
                <p className="text-sm text-gray-500">{count}</p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default FileCategoryTabs;