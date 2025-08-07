'use client';

import React, { useRef } from 'react';
import { Upload } from 'lucide-react';

interface FileUploadZoneProps {
  onFileUpload: (files: FileList) => void;
  isUploading: boolean;
  isDarkMode: boolean;
}

const FileUploadZone: React.FC<FileUploadZoneProps> = ({ 
  onFileUpload, 
  isUploading, 
  isDarkMode 
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles.length > 0) {
      onFileUpload(droppedFiles);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <div className="lg:w-1/2">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200 ${
          isDarkMode
            ? 'border-gray-600 hover:border-gray-500 hover:bg-gray-800'
            : 'border-gray-300 hover:border-gray-400 hover:bg-gray-100'
        } ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
      >
        <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
        <h3 className="text-lg font-medium mb-2">
          {isUploading ? 'Uploading...' : 'Upload Files'}
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          Drag and drop files here or click to browse
        </p>
        <button 
          disabled={isUploading}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50"
        >
          {isUploading ? 'Uploading...' : 'Choose Files'}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={(e) => e.target.files && onFileUpload(e.target.files)}
          className="hidden"
        />
      </div>
    </div>
  );
};

export default FileUploadZone;