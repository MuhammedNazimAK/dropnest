'use client';

import React from 'react';
import { useFileStore, type UploadTask, type OperationTask } from '@/lib/store/useFileStore';
import { CheckCircle, AlertCircle, UploadCloud, Loader2, Move, Trash2, Copy, DeleteIcon, } from 'lucide-react';

const UploadItem: React.FC<{ task: UploadTask }> = ({ task }) => {
    let statusIcon;
    let statusColor;

    switch (task.status) {
        case 'uploading':
            statusIcon = <UploadCloud className="w-5 h-5 text-gray-400" />;
            statusColor = 'bg-blue-600';
            break;
        case 'processing':
            statusIcon = <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
            statusColor = 'bg-blue-600';
            break;
        case 'success':
            statusIcon = <CheckCircle className="w-5 h-5 text-green-500" />;
            statusColor = 'bg-green-500';
            break;
        case 'error':
            statusIcon = <AlertCircle className="w-5 h-5 text-red-500" />;
            statusColor = 'bg-red-500';
            break;
    }

    return (
        <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">{statusIcon}</div>
            <div className="flex-grow min-w-0">
                <div className="flex justify-between items-center">
                    <p className="text-sm font-semibold truncate">{task.file.name}</p>
                    <div className="flex-shrink-0">{statusIcon}</div>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mt-1">
                    <div className={`h-1.5 rounded-full ${statusColor}`} style={{ width: `${task.progress}%` }} />
                </div>
            </div>
        </div>
    );
}

const OperationItem: React.FC<{ task: OperationTask }> = ({ task }) => {
    let statusIcon, statusColor, operationIcon, operationText;

    switch (task.type) {
        case 'move': operationIcon = <Move className="w-5 h-5 text-gray-500" />; operationText = `Moving ${task.itemCount} items`; break;
        case 'trash': operationIcon = <Trash2 className="w-5 h-5 text-gray-500" />; operationText = `Trashing ${task.itemCount} items`; break;
        case 'copy': operationIcon = <Copy className="w-5 h-5 text-gray-500" />; operationText = `Copying ${task.itemCount} items`; break;
        case 'delete': operationIcon = <DeleteIcon className="w-5 h-5 text-gray-500" />; operationText = `Deleting ${task.itemCount} items`; break;
    }

    switch (task.status) {
        case 'in-progress': statusIcon = <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />; statusColor = 'bg-blue-600'; break;
        case 'success': statusIcon = <CheckCircle className="w-5 h-5 text-green-500" />; statusColor = 'bg-green-500'; break;
        case 'error': statusIcon = <AlertCircle className="w-5 h-5 text-red-500" />; statusColor = 'bg-red-500'; break;
    }

    return (
        <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">{operationIcon}</div>
            <div className="flex-grow min-w-0">
                <div className="flex justify-between items-center">
                    <p className="text-sm font-semibold truncate">{operationText}</p>
                    <div className="flex-shrink-0">{statusIcon}</div>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mt-1">
                    <div className={`h-1.5 rounded-full ${statusColor}`} style={{ width: `${task.progress}%` }} />
                </div>
            </div>
        </div>
    );
};

export const ActivityCenter = () => {


    const uploadTasks = useFileStore(state => state.uploadTasks);
    const operationTasks = useFileStore(state => state.operationTasks);
    const clearCompletedTasks = useFileStore(state => state.clearCompletedTasks)


    const allTasks = [
        ...uploadTasks.map(t => ({ ...t, type: 'upload' as const, createdAt: new Date() })),
        ...operationTasks,
    ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    if (allTasks.length === 0) {
        return null;
    }

    // Determine if the "Clear" button should be shown.
    const completedCount = allTasks.filter(t => t.status === 'success' || t.status === 'error').length;
    const allTasksAreComplete = completedCount > 0 && completedCount === allTasks.length;

    return (
        <div className="fixed bottom-4 right-4 w-80 bg-white dark:bg-gray-800 shadow-2xl rounded-lg border dark:border-gray-700 z-50">
            <div className="p-3 border-b dark:border-gray-700 flex justify-between items-center">
                <h3 className="text-sm font-semibold">Activity</h3>
                {allTasksAreComplete && (
                    <button onClick={clearCompletedTasks} className="text-xs text-blue-500 hover:underline">Clear Completed</button>
                )}
            </div>
            <div className="p-3 space-y-3 max-h-64 overflow-y-auto">
                {allTasks.map(task =>
                    task.type === 'upload'
                        ? <UploadItem key={task.id} task={task as UploadTask} />
                        : <OperationItem key={task.id} task={task as OperationTask} />
                )}
            </div>
        </div>
    );
};