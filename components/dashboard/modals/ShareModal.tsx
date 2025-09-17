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
      <div className="w-full max-w-md bg-background rounded-lg shadow-xl" onClick={e => e.stopPropagation()}>
        <header className="p-4 border-b border-border flex justify-between items-center">
          <h2 className="text-lg font-semibold truncate text-foreground">Share &quot;{file.name}&quot;</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-accent">
            <X className="w-5 h-5 text-foreground" />
          </button>
        </header>
        <div className="p-6">
          <p className="text-sm text-muted-foreground mb-4">
            Anyone with the link can view this file.
          </p>
          {isLoading ? (
            <div className="flex items-center justify-center h-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <div className="relative flex-grow">
                <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  readOnly
                  value={shareUrl}
                  className="w-full bg-secondary border-transparent rounded-md pl-10 pr-4 py-2 text-sm text-foreground"
                />
              </div>
              <button
                onClick={handleCopy}
                className="flex-shrink-0 bg-primary text-primary-foreground font-semibold px-4 py-2 rounded-md hover:bg-primary/90 flex items-center cursor-pointer"
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