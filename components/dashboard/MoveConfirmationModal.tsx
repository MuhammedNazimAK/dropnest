// File: components/dashboard/MoveConfirmationModal.tsx

'use client';

import { X, File, Folder } from 'lucide-react';

interface MoveConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  fileName: string;
  targetFolderName: string;
  isFolder?: boolean;
  isLoading?: boolean;
}

export function MoveConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  fileName,
  targetFolderName,
  isFolder = false,
  isLoading = false
}: MoveConfirmationModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">
            Confirm Move
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isLoading}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 mt-1">
              {isFolder ? (
                <Folder className="h-6 w-6 text-blue-500" />
              ) : (
                <File className="h-6 w-6 text-gray-500" />
              )}
            </div>
            <div>
              <p className="text-gray-800">
                Are you sure you want to move{' '}
                <span className="font-medium">"{fileName}"</span>
                {' '}to{' '}
                <span className="font-medium">"{targetFolderName}"</span>?
              </p>
              <p className="text-sm text-gray-500 mt-1">
                This action will update the {isFolder ? 'folder' : 'file'} location.
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex space-x-3 p-4 border-t border-gray-200">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Moving...' : 'Yes, Move'}
          </button>
        </div>
      </div>
    </div>
  );
}