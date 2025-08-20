'use client';

import { UploadCloud } from 'lucide-react';
import React from 'react';

export interface UploadButtonProps {
    onUploadClick: () => void;
}

export const UploadButton: React.FC<UploadButtonProps> = ({ onUploadClick }) => {

    return (
        <button
            onClick={onUploadClick} 
            className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow"
        >
            <UploadCloud className="h-4 w-4" />
            <span>Upload File</span>
        </button>
    );
}