'use client';

import React, { useState, useEffect } from 'react';
import type { File as DbFile } from '@/lib/db/schema';
import { X, Copy, Check, Link as LinkIcon, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface ShareModalProps {
  file: Required<DbFile> | null;
  onClose: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({ file, onClose }) => {
  const [shareUrl, setShareUrl] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [hasCopied, setHasCopied] = useState(false);

  useEffect(() => {
    if (file) {
      setIsLoading(true);
      setHasCopied(false); // Reset copy status when file changes
      
      // Fetch the shareable link from API
      fetch(`/api/files/${file.id}/share`, { method: 'POST' })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setShareUrl(data.url);
          } else {
            toast.error(data.error || "Failed to create share link.");
          }
        })
        .catch(() => toast.error("An unexpected error occurred."))
        .finally(() => setIsLoading(false));
    }
  }, [file]);

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setHasCopied(true);
      toast.success("Link copied to clipboard!");
      setTimeout(() => setHasCopied(false), 2000); // Reset icon after 2 seconds
    });
  };

  if (!file) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center" onClick={onClose}>
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-xl" onClick={e => e.stopPropagation()}>
        <header className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-lg font-semibold truncate">Share "{file.name}"</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
            <X className="w-5 h-5" />
          </button>
        </header>
        <div className="p-6">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Anyone with the link can view this file.
          </p>
          {isLoading ? (
            <div className="flex items-center justify-center h-12">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <div className="relative flex-grow">
                <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  readOnly
                  value={shareUrl}
                  className="w-full bg-gray-100 dark:bg-gray-700 border-transparent rounded-md pl-10 pr-4 py-2 text-sm"
                />
              </div>
              <button
                onClick={handleCopy}
                className="flex-shrink-0 bg-blue-600 text-white font-semibold px-4 py-2 rounded-md hover:bg-blue-700 flex items-center"
              >
                {hasCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span className="ml-2">{hasCopied ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>
          )}
          {/* Add a "Revoke Link" button here later */}
        </div>
      </div>
    </div>
  );
};