'use client';

import React, { useRef, useState } from 'react';
import { Upload, File, X } from 'lucide-react';

interface FileUploadZoneProps {
  onFileUpload: (files: FileList) => void;
  isUploading: boolean;
  uploadProgress: number;
  isDarkMode: boolean;
  currentFolderId: string | null;
}

const FileUploadZone: React.FC<FileUploadZoneProps> = ({ 
  onFileUpload, 
  isUploading, 
  uploadProgress,
  isDarkMode 
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles.length > 0) {
      setSelectedFiles(Array.from(droppedFiles));
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files));
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(files => files.filter((_, i) => i !== index));
  };

  const uploadFiles = () => {
    if (selectedFiles.length > 0) {
      const fileList = new DataTransfer();
      selectedFiles.forEach(file => fileList.items.add(file));
      onFileUpload(fileList.files);
      setSelectedFiles([]);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="lg:w-1/2">
      {/* Drop Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200 ${
          dragActive
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
            : isDarkMode
            ? 'border-gray-600 hover:border-gray-500 hover:bg-gray-800'
            : 'border-gray-300 hover:border-gray-400 hover:bg-gray-100'
        } ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
      >
        <Upload className={`w-12 h-12 mx-auto mb-4 ${
          dragActive ? 'text-blue-500' : 'text-gray-400'
        }`} />
        <h3 className="text-lg font-medium mb-2">
          {isUploading ? `Uploading... ${uploadProgress}%` : 
           dragActive ? 'Drop files here' : 'Upload Files'}
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          {dragActive ? 'Release to upload' : 'Drag and drop files here or click to browse'}
        </p>
        
        {/* Upload Progress */}
        {isUploading && (
          <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
        )}

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
          onChange={handleFileSelect}
          className="hidden"
          accept="image/*,application/pdf,text/*,application/json,.zip,.mp4,.mp3,.docx,.xlsx"
        />
      </div>

      {/* Selected Files Preview */}
      {selectedFiles.length > 0 && !isUploading && (
        <div className={`mt-4 p-4 rounded-lg border ${
          isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium">Selected Files ({selectedFiles.length})</h4>
            <button
              onClick={uploadFiles}
              className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors"
            >
              Upload All
            </button>
          </div>
          
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {selectedFiles.map((file, index) => (
              <div key={index} className={`flex items-center justify-between p-2 rounded ${
                isDarkMode ? 'bg-gray-700' : 'bg-white'
              }`}>
                <div className="flex items-center space-x-2">
                  <File className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium truncate max-w-48">{file.name}</p>
                    <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(index);
                  }}
                  className="text-red-500 hover:text-red-700 p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUploadZone;