'use client';

import React from 'react';
import { Search } from 'lucide-react';

interface SearchInputProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isDarkMode: boolean;
  placeholder?: string;
}

const SearchInput: React.FC<SearchInputProps> = ({
  searchQuery,
  setSearchQuery,
  isDarkMode,
  placeholder = "Search files..."
}) => {
  return (
    <div className="relative">
      <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
      <input
        type="text"
        placeholder={placeholder}
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className={`pl-10 pr-4 py-2 rounded-lg border transition-colors duration-200 ${
          isDarkMode
            ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400'
            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
        }`}
      />
    </div>
  );
};

export default SearchInput;