'use client';

import React from 'react';
import { Star, Trash2, Download, Upload } from 'lucide-react';
import type { NewFile } from '@/lib/db/schema';
import { getFileIcon, formatFileSize, formatDate } from '@/utils/fileUtils';

interface FileListProps {
  files: NewFile[];
  activeFileView: string;
  isDarkMode: boolean;
  onToggleStar: (fileId: string) => void;
  onMoveToTrash: (fileId: string) => void;
  onRestoreFile: (fileId: string) => void;
}

const FileList: React.FC<FileListProps> = ({
  files,
  activeFileView,
  isDarkMode,
  onToggleStar,
  onMoveToTrash,
  onRestoreFile
}) => {
  return (
    <div className={`rounded-lg border overflow-hidden ${
      isDarkMode ? 'border-gray-700' : 'border-gray-200'
    }`}>
      {/* Table Header */}
      <div className={`px-6 py-3 border-b font-medium ${
        isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
      }`}>
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-5">Name</div>
          <div className="col-span-2 hidden sm:block">Size</div>
          <div className="col-span-2 hidden md:block">Date Added</div>
          <div className="col-span-3 md:col-span-3">Actions</div>
        </div>
      </div>

      {/* Table Body */}
      <div className={isDarkMode ? 'bg-gray-800' : 'bg-white'}>
        {files.map((file) => (
          <div
            key={file.id}
            className={`px-6 py-4 border-b last:border-b-0 hover:bg-opacity-50 transition-colors duration-200 ${
              isDarkMode ? 'border-gray-700 hover:bg-gray-700' : 'border-gray-200 hover:bg-gray-50'
            }`}
          >
            <div className="grid grid-cols-12 gap-4 items-center">
              {/* File Name with Icon */}
              <div className="col-span-5 flex items-center space-x-3">
                <div className="text-gray-400">
                  {getFileIcon(file.type)}
                </div>
                <span className="truncate font-medium" title={file.name}>
                  {file.name}
                </span>
              </div>

              {/* File Size */}
              <div className="col-span-2 hidden sm:block text-sm text-gray-500">
                {formatFileSize(file.size)}
              </div>

              {/* Date Added */}
              <div className="col-span-2 hidden md:block text-sm text-gray-500">
                {formatDate(file.createdAt!)}
              </div>

              {/* Actions */}
              <div className="col-span-5 md:col-span-3 flex items-center space-x-2">
                {activeFileView !== 'trash' && (
                  <>
                    <button
                      onClick={() => onToggleStar(file.id)}
                      className={`p-1 rounded transition-colors duration-200 ${
                        file.isStarred
                          ? 'text-yellow-500 hover:text-yellow-600'
                          : 'text-gray-400 hover:text-gray-600'
                      }`}
                      aria-label={file.isStarred ? 'Unstar file' : 'Star file'}
                    >
                      <Star className="w-4 h-4" fill={file.isStarred ? 'currentColor' : 'none'} />
                    </button>
                    <button
                      onClick={() => onMoveToTrash(file.id)}
                      className="p-1 rounded text-gray-400 hover:text-red-600 transition-colors duration-200"
                      aria-label="Move to trash"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                )}
                {activeFileView === 'trash' && (
                  <button
                    onClick={() => onRestoreFile(file.id)}
                    className="p-1 rounded text-gray-400 hover:text-green-600 transition-colors duration-200"
                    title="Restore"
                    aria-label="Restore file"
                  >
                    <Upload className="w-4 h-4" />
                  </button>
                )}
                <a
                  href={file.fileUrl}
                  download={file.name}
                  className="p-1 rounded text-gray-400 hover:text-blue-600 transition-colors duration-200"
                  aria-label="Download file"
                >
                  <Download className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FileList;