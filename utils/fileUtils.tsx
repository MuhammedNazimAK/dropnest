import React from 'react';
import { FileText, Image, Music, Video, Archive, File } from 'lucide-react';

export const getFileIcon = (type: string) => {
  const fileType = type.toLowerCase();
  if (fileType.includes('pdf') || fileType.includes('document')) {
    return <FileText className="w-8 h-8" />;
  }
  if (fileType.includes('image')) {
    return <Image className="w-8 h-8" />;
  }
  if (fileType.includes('audio')) {
    return <Music className="w-8 h-8" />;
  }
  if (fileType.includes('video')) {
    return <Video className="w-8 h-8" />;
  }
  if (fileType.includes('zip') || fileType.includes('archive')) {
    return <Archive className="w-8 h-8" />;
  }
  return <File className="w-8 h-8" />;
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const formatDate = (date: Date | string): string => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};