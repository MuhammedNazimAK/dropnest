'use client';

import React, { useState, useEffect, useRef } from 'react';

interface RenameInputProps {
    currentName: string;
    onConfirmRename: (newName: string) => void;
    onCancelRename: () => void;
}

export const RenameInput: React.FC<RenameInputProps> = ({ currentName, onConfirmRename, onCancelRename }) => {
    const [name, setName] = useState(currentName);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        // Focus the input and select its text when the component mounts
        inputRef.current?.focus();
        inputRef.current?.select();
    }, []);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {

        e.stopPropagation();

        if (e.key === 'Enter') {
            e.preventDefault();
            if (name.trim()) {
                onConfirmRename(name.trim());
            }
        } else if (e.key === 'Escape') {
            e.preventDefault();
            onCancelRename();
        }
    };

    return (
        <input
            id="rename-input"
            type="text"
            ref={inputRef}
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => onConfirmRename(name.trim())} // Save when clicking away
            onKeyDown={handleKeyDown}
            onClick={(e) => e.stopPropagation()}
            className="w-full text-sm font-semibold bg-primary/20 p-1 rounded-md border border-primary focus:outline-none focus:ring-2 focus:ring-primary"
        />
    );
};