'use client';

import React from 'react';
import { User } from 'lucide-react';
import { useUser } from '@clerk/nextjs';
import type { NewFile } from '@/lib/db/schema';
import { formatFileSize } from '@/utils/fileUtils';

interface UserProfileProps {
  files: NewFile[];
  isDarkMode: boolean;
}

const UserProfile: React.FC<UserProfileProps> = ({ files, isDarkMode }) => {
  const { user } = useUser();

  const totalStorageUsed = files.reduce((acc, file) => acc + file.size, 0);
  const storagePercentage = (totalStorageUsed / (5 * 1024 * 1024 * 1024)) * 100; // Assuming 5GB limit

  return (
    <div className={`max-w-2xl mx-auto rounded-lg border p-8 ${
      isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
    }`}>
      {/* Profile Header */}
      <div className="text-center mb-8">
        <div className={`w-24 h-24 rounded-full mx-auto mb-4 flex items-center justify-center ${
          isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
        }`}>
          <User className="w-12 h-12 text-gray-400" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Profile</h2>
        <p className="text-gray-500">Manage your account settings</p>
      </div>
      
      {/* Profile Details */}
      <div className="space-y-6">
        {/* Email */}
        <div>
          <label className="block text-sm font-medium mb-2">Email</label>
          <input
            type="email"
            value={user?.emailAddresses[0]?.emailAddress || ''}
            readOnly
            className={`w-full px-4 py-2 rounded-lg border ${
              isDarkMode
                ? 'bg-gray-700 border-gray-600 text-gray-300'
                : 'bg-gray-50 border-gray-300 text-gray-600'
            }`}
          />
        </div>
        
        {/* Storage Usage */}
        <div>
          <label className="block text-sm font-medium mb-2">Storage Used</label>
          <div className={`p-4 rounded-lg ${
            isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
          }`}>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm">Files</span>
              <span className="text-sm font-medium">
                {formatFileSize(totalStorageUsed)} used
              </span>
            </div>
            <div className={`w-full h-2 rounded-full ${
              isDarkMode ? 'bg-gray-600' : 'bg-gray-200'
            }`}>
              <div 
                className="h-2 bg-blue-600 rounded-full transition-all duration-300" 
                style={{ width: `${Math.min(storagePercentage, 100)}%` }}
              ></div>
            </div>
            <div className="flex justify-between items-center mt-1 text-xs text-gray-500">
              <span>0 GB</span>
              <span>5 GB</span>
            </div>
          </div>
        </div>

        {/* File Statistics */}
        <div>
          <label className="block text-sm font-medium mb-2">File Statistics</label>
          <div className={`p-4 rounded-lg ${
            isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
          }`}>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Total Files:</span>
                <span className="font-medium ml-2">{files.filter(f => !f.isTrash).length}</span>
              </div>
              <div>
                <span className="text-gray-500">Starred:</span>
                <span className="font-medium ml-2">{files.filter(f => f.isStarred && !f.isTrash).length}</span>
              </div>
              <div>
                <span className="text-gray-500">In Trash:</span>
                <span className="font-medium ml-2">{files.filter(f => f.isTrash).length}</span>
              </div>
              <div>
                <span className="text-gray-500">Storage:</span>
                <span className="font-medium ml-2">{storagePercentage.toFixed(1)}%</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Sign Out Button */}
        <div className="pt-4 border-t border-gray-200">
          <button className="w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors duration-200">
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;