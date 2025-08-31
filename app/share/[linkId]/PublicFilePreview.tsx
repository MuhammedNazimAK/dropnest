'use client';

import React, { useEffect, useState } from 'react';
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import { AlertTriangle } from 'lucide-react';

interface PublicFilePreviewProps {
  // Only pass data that is safe to be public
  file: {
    name: string;
    type: string;
    size: number;
    fileUrl: string;
  }
}

const getFileType = (mimeType: string): 'image' | 'pdf' | 'video' | 'audio' | 'text' | 'other' => {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType === 'application/pdf') return 'pdf';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (mimeType === 'text/plain') return 'text';
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
    return <p className="text-gray-400">Loading preview...</p>;
  }

  // <pre> tag to preserve whitespace and line breaks from the text file
  return (
    <pre className="text-left p-4 bg-gray-900 text-white whitespace-pre-wrap break-words w-full h-full overflow-auto">
      {content}
    </pre>
  );
};

export const PublicFilePreview: React.FC<PublicFilePreviewProps> = ({ file }) => {
  const fileType = getFileType(file.type);

  if (fileType === 'image') {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-800">
        <img src={file.fileUrl} alt={file.name} className="max-w-full max-h-full object-contain" />
      </div>
    );
  }

  if (fileType === 'text') {
    return <TextPreview fileUrl={file.fileUrl} />;
  }

  if (fileType === 'pdf') {
    return <embed src={file.fileUrl} type="application/pdf" className="w-full h-full" />;
  }

  if (fileType === 'video') {
    return (
      <div className="w-full h-full flex items-center justify-center bg-black">
        <video src={file.fileUrl} controls className="max-w-full max-h-full" />
      </div>
    );
  }
  
  if (fileType === 'audio') {
    return (
       <div className="w-full h-full flex items-center justify-center">
         <audio src={file.fileUrl} controls />
       </div>
    );
  }

  // Fallback for other file types
  return (
    <div className="w-full h-full flex items-center justify-center">
      <div className="text-center p-8 bg-white rounded-lg shadow-md">
        <AlertTriangle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold">No Preview Available</h3>
        <p className="text-gray-500 mt-2">You can download the file to view it.</p>
      </div>
    </div>
  );
};