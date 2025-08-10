'use client';

import { useState } from 'react';
import { Plus, Folder, Home, ChevronRight } from 'lucide-react';
import { useFolderManagement } from '@/hooks/useFolderManagement';

interface FolderOperationsPanelProps {
  onFolderCreated?: () => void;
}

export function FolderOperationsPanel({ onFolderCreated }: FolderOperationsPanelProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const { 
    currentFolderId, 
    breadcrumbs, 
    createFolder, 
    navigateToBreadcrumb 
  } = useFolderManagement();

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newFolderName.trim()) return;

    try {
      await createFolder(newFolderName.trim());
      setNewFolderName('');
      setIsCreating(false);
      onFolderCreated?.();
    } catch (error) {
      // Error handled in hook
    }
  };

  const cancelCreate = () => {
    setIsCreating(false);
    setNewFolderName('');
  };

  return (
    <div className="w-64 p-4 border-l border-gray-200 bg-gray-50">
      {/* Breadcrumbs */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Location</h3>
        <nav className="flex items-center space-x-1 text-sm">
          {breadcrumbs.map((crumb, index) => (
            <div key={crumb.id || 'root'} className="flex items-center">
              {index > 0 && <ChevronRight className="h-4 w-4 text-gray-400 mx-1" />}
              <button
                onClick={() => navigateToBreadcrumb(index)}
                className={`flex items-center space-x-1 px-2 py-1 rounded hover:bg-gray-200 transition-colors ${
                  index === breadcrumbs.length - 1 
                    ? 'text-blue-600 font-medium' 
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                {index === 0 ? (
                  <Home className="h-4 w-4" />
                ) : (
                  <Folder className="h-4 w-4" />
                )}
                <span>{crumb.name}</span>
              </button>
            </div>
          ))}
        </nav>
      </div>

      {/* Folder Operations */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-gray-700">Folder Operations</h3>
        
        {!isCreating ? (
          <button
            onClick={() => setIsCreating(true)}
            className="w-full flex items-center space-x-2 px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Create Folder</span>
          </button>
        ) : (
          <form onSubmit={handleCreateFolder} className="space-y-2">
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Folder name..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoFocus
            />
            <div className="flex space-x-2">
              <button
                type="submit"
                disabled={!newFolderName.trim()}
                className="flex-1 px-3 py-1.5 text-sm font-medium text-white bg-green-600 rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                Create
              </button>
              <button
                type="button"
                onClick={cancelCreate}
                className="flex-1 px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-200 rounded hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Current Folder Info */}
        {currentFolderId && (
          <div className="pt-4 border-t border-gray-200">
            <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
              Current Folder
            </h4>
            <div className="flex items-center space-x-2 text-sm text-gray-700">
              <Folder className="h-4 w-4 text-blue-500" />
              <span>{breadcrumbs[breadcrumbs.length - 1]?.name}</span>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="pt-4 border-t border-gray-200">
          <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
            Quick Actions
          </h4>
          <div className="space-y-1">
            <button
              onClick={() => navigateToBreadcrumb(0)}
              className="w-full text-left px-2 py-1.5 text-sm text-gray-600 hover:bg-gray-200 rounded transition-colors"
            >
              Go to Root
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}