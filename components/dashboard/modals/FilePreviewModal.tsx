'use client';

import React, { useState, useEffect } from 'react';
import type { File as DbFile } from '@/lib/db/schema';
import { X, Download, File as FileIcon, AlertTriangle } from 'lucide-react';
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";

interface FilePreviewModalProps {
  file: Required<DbFile> | null;
  onClose: () => void;
}

const getFileType = (mimeType: string | null): 'image' | 'pdf' | 'video' | 'audio' | 'text' | 'other' => {
  if (!mimeType) return 'other';

  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType === 'application/pdf') return 'pdf';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (mimeType.startsWith('text/')) return 'text';

  return 'other';
};


const TextPreview = ({ fileUrl }: { fileUrl: string }) => {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(fileUrl)
      .then(res => res.text())
      .then(text => {
        setContent(text);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch text content", err);
        setContent("Could not load file preview.");
        setLoading(false);
      });
  }, [fileUrl]);

  if (loading) {
    return <div className="p-4 text-muted-foreground">Loading preview...</div>;
  }

  // <pre> tag to preserve whitespace and line breaks from the text file
  return (
    <pre className="text-left p-4 bg-card text-foreground whitespace-pre-wrap break-words w-full h-full overflow-auto">
      {content}
    </pre>
  );
};

export const FilePreviewModal: React.FC<FilePreviewModalProps> = ({ file, onClose }) => {

  useEffect(() => {
    // When the modal opens with a file, ping endpoint to update the timestamp.
    if (file) {
      fetch(`/api/files/${file.id}/access`, {
        method: 'PUT',
      }).catch(console.error);
    }
  }, [file]);

  if (!file) {
    return null;
  }

  const fileType = getFileType(file.type);

  if (fileType === 'image') {
    return (
      <Lightbox
        open={true}
        close={onClose}
        slides={[{ src: file.fileUrl, alt: file.name }]}
      />
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-background rounded-lg shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex-shrink-0 p-3 border-b border-border flex justify-between items-center">
          <div className="flex items-center space-x-2 min-w-0">
            <FileIcon className="w-5 h-5 text-muted-foreground flex-shrink-0" />
            <p className="font-semibold truncate text-foreground" title={file.name}>{file.name}</p>
          </div>
          <div className="flex items-center space-x-2">
            <a href={file.fileUrl} download={file.name} target="_blank" rel="noopener noreferrer" className="p-2 rounded-full hover:bg-muted" title="Download">
              <Download className="w-5 h-5 text-foreground" />
            </a>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-muted" title="Close">
              <X className="w-5 h-5 text-foreground" />
            </button>
          </div>
        </header>

        {/* --- MODAL BODY (Conditional Viewer) --- */}
        <main className="flex-grow bg-muted/50 flex items-center justify-center overflow-hidden">
          {fileType === 'pdf' && (
            <embed src={file.fileUrl} type="application/pdf" className="w-full h-full" />
          )}
          {fileType === 'video' && (
            <video src={file.fileUrl} controls className="max-w-full max-h-full" />
          )}
          {fileType === 'audio' && (
            <audio src={file.fileUrl} controls />
          )}

          {fileType === 'text' && (
            <TextPreview fileUrl={file.fileUrl} />
          )}

          {fileType === 'other' && (
            <div className="text-center p-8">
              <AlertTriangle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground">No Preview Available</h3>
              <p className="text-muted-foreground mt-2">
                A preview is not available for this file type.
              </p>
              <a href={file.fileUrl} download={file.name} target="_blank" rel="noopener noreferrer" className="mt-6 inline-block bg-primary text-primary-foreground font-semibold px-6 py-2 rounded-lg hover:bg-primary/90">
                Download &quot;{file.name}&quot;
              </a>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};