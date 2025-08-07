'use client';

import React from 'react';
import { User } from 'lucide-react';
import { useUser } from '@clerk/nextjs';
import Logo from '@/components/ui/logo';
import ThemeToggle from '@/components/ui/ThemeToggle';

interface DashboardHeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isDarkMode: boolean;
  setIsDarkMode: (isDark: boolean) => void;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  activeTab,
  setActiveTab,
  isDarkMode,
  setIsDarkMode
}) => {
  const { user } = useUser();

  return (
    <header className={`border-b transition-colors duration-200 ${
      isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Header Row */}
        <div className="flex items-center justify-between h-16">
          <Logo size="md" showText={true} />
          
          <div className="flex items-center space-x-4">
            <ThemeToggle isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />
            
            <div className="flex items-center space-x-2">
              <User className="w-5 h-5 text-gray-500" />
              <span className="text-sm font-medium hidden sm:inline">
                {user?.emailAddresses[0]?.emailAddress}
              </span>
            </div>
          </div>
        </div>
        
        {/* Navigation Tabs */}
        <div className="flex space-x-8 -mb-px">
          <button
            onClick={() => setActiveTab('files')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
              activeTab === 'files'
                ? 'border-blue-500 text-blue-600'
                : isDarkMode
                ? 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            My Files
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
              activeTab === 'profile'
                ? 'border-blue-500 text-blue-600'
                : isDarkMode
                ? 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Profile
          </button>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;