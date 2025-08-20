    'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Upload, File, X, CheckCircle } from 'lucide-react';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFileUpload: (files: FileList) => void;
  isUploading: boolean;
  uploadProgress: number;
  currentFolderId: string | null;
}

export const UploadModal: React.FC<UploadModalProps> = ({ isOpen, onClose, onFileUpload, isUploading, uploadProgress }) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFiles(Array.from(e.dataTransfer.files));
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFiles(Array.from(e.target.files));
    }
  };

  useEffect(() => {
    if (!isOpen) {
      // Small delay to prevent a visual flash while the modal closes
      const timer = setTimeout(() => {
        setSelectedFiles([]);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleUploadClick = () => {
    if (selectedFiles.length > 0) {
      const dataTransfer = new DataTransfer();
      selectedFiles.forEach(file => dataTransfer.items.add(file));
      onFileUpload(dataTransfer.files);
      setSelectedFiles([]);
    }
  };

  if (!isOpen) return null;


  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center" onClick={onClose}>
      <div className="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 transform transition-all" onClick={e => e.stopPropagation()}>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Upload Files</h2>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Upload files to the current folder.</p>
        
        <div 
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            className={`mt-6 border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-colors
            ${dragActive ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300 dark:border-gray-600 hover:border-blue-400'}`}
        >
            <Upload className="w-12 h-12 text-gray-400 dark:text-gray-500 mb-3" />
            <p className="font-semibold text-gray-700 dark:text-gray-300">Drag & drop files here</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">or click to browse</p>
            <input ref={inputRef} type="file" multiple className="hidden" onChange={handleChange} />
        </div>

        {selectedFiles.length > 0 && (
            <div className="mt-6">
                <h3 className="font-semibold text-sm">Selected Files ({selectedFiles.length})</h3>
                <div className="mt-2 space-y-2 max-h-40 overflow-y-auto pr-2">
                    {selectedFiles.map((file, i) => (
                        <div key={i} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 p-2 rounded-lg">
                            <div className="flex items-center space-x-3">
                                <File className="w-5 h-5 text-gray-500" />
                                <p className="text-sm font-medium truncate">{file.name}</p>
                            </div>
                            <button onClick={() => setSelectedFiles(files => files.filter((_, idx) => idx !== i))}>
                                <X className="w-4 h-4 text-gray-400" />
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        )}
        
        {isUploading && (
            <div className="mt-6">
                 <h3 className="font-semibold text-sm mb-2">Uploading...</h3>
                 <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{width: `${uploadProgress}%`}}></div>
                 </div>
            </div>
        )}

        <div className="mt-8 flex justify-end space-x-3">
            <button onClick={onClose} className="px-5 py-2 text-sm font-medium bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600">Cancel</button>
            <button onClick={handleUploadClick} disabled={selectedFiles.length === 0 || isUploading} className="px-5 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed flex items-center">
                {isUploading ? 'Uploading...' : 'Upload'}
            </button>
        </div>
      </div>
    </div>
  );
};