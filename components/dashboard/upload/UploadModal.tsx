'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Upload, File, X } from 'lucide-react';
import { useFileStore } from '@/lib/store/useFileStore';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({ isOpen, onClose }) => {

  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const uploadFiles = useFileStore(state => state.uploadFiles);
  const currentFolderId = useFileStore(state => state.currentFolderId);
  const uploadTasks = useFileStore(state => state.uploadTasks);

  const isUploading = uploadTasks.some(task => task.status === 'uploading' || task.status === 'processing');

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


  const handleUploadClick = () => {
    if (selectedFiles.length > 0) {
      const dataTransfer = new DataTransfer();
      selectedFiles.forEach(file => dataTransfer.items.add(file));

      uploadFiles(dataTransfer.files, currentFolderId);
    }
    onClose();
  };

  useEffect(() => {
    if (!isOpen) {
      const timer = setTimeout(() => {
        setSelectedFiles([]);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen) return null;


  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center" onClick={onClose}>
      <div className="w-full max-w-2xl bg-background rounded-2xl shadow-2xl p-8 transform transition-all" onClick={e => e.stopPropagation()}>
        <h2 className="text-2xl font-bold text-foreground">Upload Files</h2>
        <p className="text-muted-foreground mt-1">Upload files to the current folder.</p>

        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`mt-6 border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-colors
            ${dragActive ? 'border-primary bg-primary/20' : 'border-border hover:border-primary'}`}
        >
          <Upload className="w-12 h-12 text-muted-foreground mb-3" />
          <p className="font-semibold text-foreground">Drag & drop files here</p>
          <p className="text-sm text-muted-foreground">or click to browse</p>
          <input ref={inputRef} type="file" multiple className="hidden" onChange={handleChange} />
        </div>

        {selectedFiles.length > 0 && (
          <div className="mt-6">
            <h3 className="font-semibold text-sm text-foreground">Selected Files ({selectedFiles.length})</h3>
            <div className="mt-2 space-y-2 max-h-40 overflow-y-auto pr-2">
              {selectedFiles.map((file, i) => (
                <div key={i} className="flex items-center justify-between bg-secondary p-2 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <File className="w-5 h-5 text-muted-foreground" />
                    <p className="text-sm font-medium truncate text-foreground">{file.name}</p>
                  </div>
                  <button onClick={() => setSelectedFiles(files => files.filter((_, idx) => idx !== i))}>
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-8 flex justify-end space-x-3">
          <button onClick={onClose} className="px-5 py-2 text-sm font-medium bg-secondary rounded-lg hover:bg-muted text-foreground cursor-pointer">Cancel</button>
          <button onClick={handleUploadClick} disabled={selectedFiles.length === 0 || isUploading} className="px-5 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-lg hover:bg-primary/90 disabled:bg-primary/50 disabled:cursor-not-allowed flex items-center cursor-pointer">
            {isUploading ? 'Uploading...' : 'Upload'}
          </button>
        </div>
      </div>
    </div>
  );
};