'use client';

import React, { useState } from 'react';
import Logo from '@/components/ui/logo';
import { File, Star, Trash2, Plus, HardDrive } from 'lucide-react';
import { UploadButton } from '../upload/UploadButton';


interface SidebarProps {
  activeFilter: 'all' | 'starred' | 'trash';
  setActiveFilter: (filter: 'all' | 'starred' | 'trash') => void;
  /**
   * A callback function to be invoked after a new folder is successfully created.
   * This is used to trigger a data refresh.
   */
  onFolderCreated: () => void;
  onUploadClick: () => void;
  /**
   * The complete list of all files to be used for calculating storage space.
   */
  files: Array<{ size: number }>;
  createFolder: (name: string, parentId: string | null) => Promise<any>;
  currentFolderId: string | null;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeFilter, setActiveFilter, onFolderCreated, onUploadClick, files, createFolder, currentFolderId }) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    await createFolder(newFolderName.trim(), currentFolderId);
    
    setNewFolderName('');
    setIsCreating(false);
    onFolderCreated?.();
  };

  const navItems = [
    { key: 'all', label: 'My Files', icon: File },
    { key: 'starred', label: 'Starred', icon: Star },
    { key: 'trash', label: 'Trash', icon: Trash2 },
  ];
  
  const totalStorage = 5 * 1024 * 1024 * 1024; // 5GB in bytes
  const usedStorage = files.reduce((acc, file) => acc + file.size, 0);
  const storagePercentage = (usedStorage / totalStorage) * 100;

  return (
    <aside className="w-72 flex-shrink-0 bg-gray-100 dark:bg-gray-900/50 p-6 flex flex-col justify-between border-r border-gray-200 dark:border-gray-800">
      <div>
        <div className="mb-10">
          <Logo size="md" />
        </div>
        
        <div className="flex flex-col space-y-4">
          <UploadButton onUploadClick={onUploadClick}/>
          
          <button
            onClick={() => setIsCreating(true)}
            className="w-full flex items-center space-x-2 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-800 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Create Folder</span>
          </button>
        </div>

        {isCreating && (
          <form onSubmit={handleCreateFolder} className="mt-4 space-y-2">
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Folder name"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-transparent rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
            <div className="flex space-x-2">
              <button type="submit" className="w-full bg-blue-600 text-white py-1.5 rounded-md text-sm hover:bg-blue-700">Create</button>
              <button type="button" onClick={() => setIsCreating(false)} className="w-full bg-gray-200 dark:bg-gray-700 py-1.5 rounded-md text-sm">Cancel</button>
            </div>
          </form>
        )}

        <nav className="mt-10">
          <p className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Filters</p>
          <ul className="space-y-1">
            {navItems.map(item => (
              <li key={item.key}>
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setActiveFilter(item.key as 'all' | 'starred' | 'trash');
                  }}
                  className={`flex items-center space-x-3 px-4 py-2.5 rounded-lg font-medium text-sm transition-colors ${
                    activeFilter === item.key
                      ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800'
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      
      {/* Storage Meter */}
      <div className="px-4">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Storage</h4>
          <p className="text-xs text-gray-500 mt-1">{(usedStorage / (1024*1024)).toFixed(2)} MB of 5 GB used</p>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mt-2">
            <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: `${storagePercentage}%` }}></div>
          </div>
      </div>
    </aside>
  );
};