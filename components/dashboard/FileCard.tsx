'use client';

import React from 'react';
import { Star, Trash2, Download, Upload } from 'lucide-react';
import type { NewFile } from '@/lib/db/schema';
import { getFileIcon, formatFileSize, formatDate } from '@/utils/fileUtils';

interface FileCardProps {
  file: NewFile;
  activeFileView: string;
  isDarkMode: boolean;
  onToggleStar: (fileId: string) => void;
  onMoveToTrash: (fileId: string) => void;
  onRestoreFile: (fileId: string) => void;
}

const FileCard: React.FC<FileCardProps> = ({
  file,
  activeFileView,
  isDarkMode,
  onToggleStar,
  onMoveToTrash,
  onRestoreFile
}) => {
  return (
    <div
      className={`rounded-lg border p-4 transition-all duration-200 hover:shadow-lg ${
        isDarkMode
          ? 'bg-gray-800 border-gray-700 hover:border-gray-600'
          : 'bg-white border-gray-200 hover:border-gray-300'
      }`}
    >
      {/* File Icon and Actions */}
      <div className="flex items-center justify-between mb-3">
        <div className="text-gray-400">
          {getFileIcon(file.type)}
        </div>
        <div className="flex space-x-1">
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

      {/* File Details */}
      <h3 className="font-medium truncate mb-2" title={file.name}>
        {file.name}
      </h3>
      <div className="text-sm text-gray-500 space-y-1">
        <p>{formatFileSize(file.size)}</p>
        <p>{formatDate(file.createdAt!)}</p>
      </div>
    </div>
  );
};

export default FileCard;