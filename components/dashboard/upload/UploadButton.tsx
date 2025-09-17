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
            className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 text-sm font-medium text-primary-foreground bg-primary rounded-lg hover:bg-primary/90 transition-colors shadow cursor-pointer"
        >
            <UploadCloud className="h-4 w-4" />
            <span>Upload File</span>
        </button>
    );
}