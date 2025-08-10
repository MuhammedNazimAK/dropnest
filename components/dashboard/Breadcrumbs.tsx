'use client';

import { Home, Folder, ChevronRight } from 'lucide-react';
import { useFolderManagement } from '@/hooks/useFolderManagement';

export function Breadcrumbs() {
  const { breadcrumbs, navigateToBreadcrumb } = useFolderManagement();

  if (breadcrumbs.length <= 1) {
    return null; // Don't show breadcrumbs for root level
  }

  return (
    <nav className="flex items-center space-x-1 mb-4 p-3 bg-white rounded-lg border border-gray-200">
      {breadcrumbs.map((crumb, index) => (
        <div key={crumb.id || 'root'} className="flex items-center">
          {index > 0 && <ChevronRight className="h-4 w-4 text-gray-400 mx-2" />}
          
          <button
            onClick={() => navigateToBreadcrumb(index)}
            className={`flex items-center space-x-1.5 px-2 py-1.5 rounded-md transition-colors ${
              index === breadcrumbs.length - 1
                ? 'text-blue-600 font-medium bg-blue-50'
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
            }`}
          >
            {index === 0 ? (
              <Home className="h-4 w-4" />
            ) : (
              <Folder className="h-4 w-4" />
            )}
            <span className="text-sm">{crumb.name}</span>
          </button>
        </div>
      ))}
    </nav>
  );
}