'use client';

import React from 'react';
import type { File as DbFile } from '@/lib/db/schema';
import { X, Download, File as FileIcon, AlertTriangle } from 'lucide-react';
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";

interface FilePreviewModalProps {
  file: Required<DbFile> | null;
  onClose: () => void;
}

// Helper function to categorize file types
const getFileType = (mimeType: string): 'image' | 'pdf' | 'video' | 'audio' | 'other' => {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType === 'application/pdf') return 'pdf';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  return 'other';
};

export const FilePreviewModal: React.FC<FilePreviewModalProps> = ({ file, onClose }) => {
  if (!file) {
    return null;
  }

  const fileType = getFileType(file.type);

  // For images, we use the lightbox which is a full-screen experience.
  // We don't render our custom modal chrome around it.
  if (fileType === 'image') {
    return (
      <Lightbox
        open={true} // The modal's existence is controlled by the `file` prop
        close={onClose}
        slides={[{ src: file.fileUrl, alt: file.name }]}
        // Add plugins for more features if you want (e.g., zoom, thumbnails)
      />
    );
  }

  // For all other file types, we render our custom modal with a header.
  return (
    <div 
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose} // Close modal on backdrop click
    >
      <div 
        className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside the modal
      >
        {/* --- MODAL HEADER --- */}
        <header className="flex-shrink-0 p-3 border-b dark:border-gray-700 flex justify-between items-center">
          <div className="flex items-center space-x-2 min-w-0">
            <FileIcon className="w-5 h-5 text-gray-500 flex-shrink-0" />
            <p className="font-semibold truncate" title={file.name}>{file.name}</p>
          </div>
          <div className="flex items-center space-x-2">
            <a
              href={file.fileUrl}
              download={file.name}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
              title="Download"
            >
              <Download className="w-5 h-5" />
            </a>
            <button 
              onClick={onClose} 
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* --- MODAL BODY (Conditional Viewer) --- */}
        <main className="flex-grow bg-gray-50 dark:bg-gray-900/50 flex items-center justify-center overflow-hidden">
          {fileType === 'pdf' && (
            <embed src={file.fileUrl} type="application/pdf" className="w-full h-full" />
          )}
          {fileType === 'video' && (
            <video src={file.fileUrl} controls className="max-w-full max-h-full" />
          )}
          {fileType === 'audio' && (
            <audio src={file.fileUrl} controls />
          )}
          {fileType === 'other' && (
            <div className="text-center p-8">
              <AlertTriangle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold">No Preview Available</h3>
              <p className="text-gray-500 mt-2">
                A preview is not available for this file type.
              </p>
              <a
                href={file.fileUrl}
                download={file.name}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-block bg-blue-600 text-white font-semibold px-6 py-2 rounded-lg hover:bg-blue-700"
              >
                Download "{file.name}"
              </a>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};