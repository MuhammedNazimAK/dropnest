'use client';

import React from 'react';
import { useUser } from '@clerk/nextjs';
import { ChevronRight, Home, Grid, List } from 'lucide-react';
import ThemeToggle from '@/components/ui/ThemeToggle';
import SearchInput from '@/components/ui/SearchInput';
import { UserButton } from "@clerk/nextjs";
import { Skeleton } from '@/components/ui/skeleton';

interface HeaderProps {
  breadcrumbs: { id: string | null; name: string }[];
  onNavigateToBreadcrumb: (index: number) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  viewMode: 'grid' | 'list';
  setViewMode: (mode: 'grid' | 'list') => void;
  isDarkMode: boolean;
  setIsDarkMode: (isDark: boolean) => void;
}

export const Header: React.FC<HeaderProps> = ({
  breadcrumbs,
  onNavigateToBreadcrumb,
  searchQuery,
  setSearchQuery,
  viewMode,
  setViewMode,
  isDarkMode,
  setIsDarkMode
}) => {
  const { user, isLoaded } = useUser();

  return (
    <header className="flex-shrink-0 h-20 px-6 md:px-8 flex items-center justify-between border-b border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm sticky top-0 z-10">
      {/* Breadcrumbs */}
      <nav className="flex items-center text-sm font-medium text-gray-600 dark:text-gray-400">
        {breadcrumbs.map((crumb, index) => (
          <div key={crumb.id || 'root'} className="flex items-center">
            <button
              onClick={() => onNavigateToBreadcrumb(index)}
              disabled={index === breadcrumbs.length - 1}
              className={`flex items-center space-x-2 p-2 rounded-lg transition-colors ${index === breadcrumbs.length - 1
                ? 'text-gray-900 dark:text-white font-semibold cursor-default'
                : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
            >
              {index === 0 && <Home className="h-4 w-4" />}
              <span className="truncate max-w-28 md:max-w-48">{crumb.name}</span>
            </button>
            {index < breadcrumbs.length - 1 && (
              <ChevronRight className="h-4 w-4 text-gray-400 dark:text-gray-600 mx-1" />
            )}
          </div>
        ))}
      </nav>

      {/* Controls */}
      <div className="flex items-center space-x-2 md:space-x-4">
        <div className="w-48 md:w-64">
          <SearchInput
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            isDarkMode={isDarkMode}
            placeholder="Search files..."
          />
        </div>

        {/* View Toggle */}
        <div className="hidden sm:flex items-center p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
          <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-white dark:bg-gray-700 text-blue-600' : 'text-gray-500 hover:text-gray-800 dark:hover:text-white'}`}>
            <Grid className="h-5 w-5" />
          </button>
          <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-md transition-colors ${viewMode === 'list' ? 'bg-white dark:bg-gray-700 text-blue-600' : 'text-gray-500 hover:text-gray-800 dark:hover:text-white'}`}>
            <List className="h-5 w-5" />
          </button>
        </div>

        <ThemeToggle isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />



        {/* User Profile using Clerk's managed component */}
        <div className="h-9 w-9 flex items-center justify-center">
          {isLoaded ? (
            <UserButton
              afterSignOutUrl="/"
              appearance={{
                elements: {
                  // Make the avatar fill the wrapper perfectly
                  avatarBox: "h-full w-full"
                }
              }}
            />
          ) : (
            // 2. The skeleton fills the wrapper and uses a full border-radius
            <Skeleton className="h-full w-full rounded-full" />
          )}
        </div>
      </div>
    </header>
  );
};