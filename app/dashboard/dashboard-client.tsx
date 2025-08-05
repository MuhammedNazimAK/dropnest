'use client';

import React, { useState, useRef } from 'react';
import { useUser } from '@clerk/nextjs';
import { Upload, Download, Star, Trash2, Sun, Moon, User, Search, Grid, List, FileText, Image, Music, Video, Archive, File } from 'lucide-react';
import type { NewFile } from '@/lib/db/schema';

interface DashboardClientProps {
  initialFiles: NewFile[];
  userId: string;
}

const DashboardClient = ({ initialFiles, userId }: DashboardClientProps) => {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState('files');
  const [activeFileView, setActiveFileView] = useState('all');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [files, setFiles] = useState<NewFile[]>(initialFiles);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getFileIcon = (type: string) => {
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

  const filteredFiles = files.filter(file => {
    // Filter by view type
    if (activeFileView === 'starred') return file.isStarred && !file.isTrash;
    if (activeFileView === 'trash') return file.isTrash;
    if (activeFileView === 'all') return !file.isTrash;
    
    return true;
  }).filter(file => 
    // Filter by search query
    file.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getFileCount = (view: string) => {
    if (view === 'all') return files.filter(f => !f.isTrash).length;
    if (view === 'starred') return files.filter(f => f.isStarred && !f.isTrash).length;
    if (view === 'trash') return files.filter(f => f.isTrash).length;
    return 0;
  };

  const handleFileUpload = async (uploadFiles: FileList) => {
    setIsUploading(true);
    
    try {
      const formData = new FormData();
      Array.from(uploadFiles).forEach(file => {
        formData.append('files', file);
      });
      formData.append('userId', userId);

      const response = await fetch('/api/files/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const newFiles = await response.json();
        setFiles(prev => [...prev, ...newFiles]);
      }
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles.length > 0) {
      handleFileUpload(droppedFiles);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const toggleStar = async (fileId: string) => {
    try {
      const response = await fetch('/api/files/star', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileId }),
      });

      if (response.ok) {
        setFiles(files.map(file => 
          file.id === fileId ? { ...file, isStarred: !file.isStarred } : file
        ));
      }
    } catch (error) {
      console.error('Failed to toggle star:', error);
    }
  };

  const moveToTrash = async (fileId: string) => {
    try {
      const response = await fetch('/api/files/trash', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileId }),
      });

      if (response.ok) {
        setFiles(files.map(file => 
          file.id === fileId ? { ...file, isTrash: true } : file
        ));
      }
    } catch (error) {
      console.error('Failed to move to trash:', error);
    }
  };

  const restoreFile = async (fileId: string) => {
    try {
      const response = await fetch('/api/files/restore', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileId }),
      });

      if (response.ok) {
        setFiles(files.map(file => 
          file.id === fileId ? { ...file, isTrash: false } : file
        ));
      }
    } catch (error) {
      console.error('Failed to restore file:', error);
    }
  };

  const emptyTrash = async () => {
    try {
      const response = await fetch('/api/files/empty-trash', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      if (response.ok) {
        setFiles(files.filter(file => !file.isTrash));
      }
    } catch (error) {
      console.error('Failed to empty trash:', error);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className={`min-h-screen transition-colors duration-200 ${
      isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'
    }`}>
      {/* Header */}
      <header className={`border-b transition-colors duration-200 ${
        isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Top Header Row */}
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-blue-600">DropNest</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className={`p-2 rounded-lg transition-colors duration-200 ${
                  isDarkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'
                }`}
              >
                {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              
              <div className="flex items-center space-x-2">
                <User className="w-5 h-5 text-gray-500" />
                <span className="text-sm font-medium hidden sm:inline">
                  {user?.emailAddresses[0]?.emailAddress}
                </span>
              </div>
            </div>
          </div>
          
          {/* Navigation Tabs */}
          <div className="flex space-x-8 -mb-px">
            <button
              onClick={() => setActiveTab('files')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                activeTab === 'files'
                  ? 'border-blue-500 text-blue-600'
                  : isDarkMode
                  ? 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              My Files
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                activeTab === 'profile'
                  ? 'border-blue-500 text-blue-600'
                  : isDarkMode
                  ? 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Profile
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'files' ? (
          <>
            {/* Top Section - Drop Zone and File Categories */}
            <div className="flex flex-col lg:flex-row gap-6 mb-8">
              {/* Drop Zone */}
              <div className="lg:w-1/2">
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200 ${
                    isDarkMode
                      ? 'border-gray-600 hover:border-gray-500 hover:bg-gray-800'
                      : 'border-gray-300 hover:border-gray-400 hover:bg-gray-100'
                  } ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
                >
                  <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-medium mb-2">
                    {isUploading ? 'Uploading...' : 'Upload Files'}
                  </h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Drag and drop files here or click to browse
                  </p>
                  <button 
                    disabled={isUploading}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50"
                  >
                    {isUploading ? 'Uploading...' : 'Choose Files'}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                    className="hidden"
                  />
                </div>
              </div>

              {/* File Categories */}
              <div className="lg:w-1/2">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <button
                    onClick={() => setActiveFileView('all')}
                    className={`p-4 rounded-lg text-left transition-colors duration-200 ${
                      activeFileView === 'all'
                        ? 'bg-blue-100 border border-blue-200 text-blue-900'
                        : isDarkMode
                        ? 'bg-gray-800 hover:bg-gray-700 border border-gray-700'
                        : 'bg-white hover:bg-gray-50 border border-gray-200'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <File className="w-5 h-5" />
                      <div>
                        <p className="font-medium">All Files</p>
                        <p className="text-sm text-gray-500">{getFileCount('all')}</p>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => setActiveFileView('starred')}
                    className={`p-4 rounded-lg text-left transition-colors duration-200 ${
                      activeFileView === 'starred'
                        ? 'bg-blue-100 border border-blue-200 text-blue-900'
                        : isDarkMode
                        ? 'bg-gray-800 hover:bg-gray-700 border border-gray-700'
                        : 'bg-white hover:bg-gray-50 border border-gray-200'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Star className="w-5 h-5" />
                      <div>
                        <p className="font-medium">Starred</p>
                        <p className="text-sm text-gray-500">{getFileCount('starred')}</p>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => setActiveFileView('trash')}
                    className={`p-4 rounded-lg text-left transition-colors duration-200 ${
                      activeFileView === 'trash'
                        ? 'bg-blue-100 border border-blue-200 text-blue-900'
                        : isDarkMode
                        ? 'bg-gray-800 hover:bg-gray-700 border border-gray-700'
                        : 'bg-white hover:bg-gray-50 border border-gray-200'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Trash2 className="w-5 h-5" />
                      <div>
                        <p className="font-medium">Trash</p>
                        <p className="text-sm text-gray-500">{getFileCount('trash')}</p>
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            </div>

            {/* File Management Controls */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div className="flex items-center space-x-4">
                <h2 className="text-xl font-semibold capitalize">{activeFileView} Files</h2>
                {activeFileView === 'trash' && getFileCount('trash') > 0 && (
                  <button
                    onClick={emptyTrash}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 text-sm"
                  >
                    Empty Trash
                  </button>
                )}
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search files..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`pl-10 pr-4 py-2 rounded-lg border transition-colors duration-200 ${
                      isDarkMode
                        ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400'
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                  />
                </div>
                
                <div className={`flex rounded-lg border ${
                  isDarkMode ? 'border-gray-600' : 'border-gray-300'
                }`}>
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-l-lg transition-colors duration-200 ${
                      viewMode === 'grid'
                        ? 'bg-blue-600 text-white'
                        : isDarkMode
                        ? 'hover:bg-gray-700 text-gray-400'
                        : 'hover:bg-gray-100 text-gray-600'
                    }`}
                  >
                    <Grid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-r-lg transition-colors duration-200 ${
                      viewMode === 'list'
                        ? 'bg-blue-600 text-white'
                        : isDarkMode
                        ? 'hover:bg-gray-700 text-gray-400'
                        : 'hover:bg-gray-100 text-gray-600'
                    }`}
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Files Display */}
            {filteredFiles.length === 0 ? (
              <div className="text-center py-12">
                <File className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium mb-2">No files found</h3>
                <p className="text-gray-500">
                  {searchQuery ? 'Try adjusting your search query' : `No files in ${activeFileView}`}
                </p>
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredFiles.map((file) => (
                  <div
                    key={file.id}
                    className={`rounded-lg border p-4 transition-all duration-200 hover:shadow-lg ${
                      isDarkMode
                        ? 'bg-gray-800 border-gray-700 hover:border-gray-600'
                        : 'bg-white border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-gray-400">
                        {getFileIcon(file.type)}
                      </div>
                      <div className="flex space-x-1">
                        {activeFileView !== 'trash' && (
                          <>
                            <button
                              onClick={() => toggleStar(file.id)}
                              className={`p-1 rounded transition-colors duration-200 ${
                                file.isStarred
                                  ? 'text-yellow-500 hover:text-yellow-600'
                                  : 'text-gray-400 hover:text-gray-600'
                              }`}
                            >
                              <Star className="w-4 h-4" fill={file.isStarred ? 'currentColor' : 'none'} />
                            </button>
                            <button
                              onClick={() => moveToTrash(file.id)}
                              className="p-1 rounded text-gray-400 hover:text-red-600 transition-colors duration-200"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {activeFileView === 'trash' && (
                          <button
                            onClick={() => restoreFile(file.id)}
                            className="p-1 rounded text-gray-400 hover:text-green-600 transition-colors duration-200"
                          >
                            <Upload className="w-4 h-4" />
                          </button>
                        )}
                        <a
                          href={file.fileUrl}
                          download={file.name}
                          className="p-1 rounded text-gray-400 hover:text-blue-600 transition-colors duration-200"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                      </div>
                    </div>
                    <h3 className="font-medium truncate mb-2" title={file.name}>
                      {file.name}
                    </h3>
                    <div className="text-sm text-gray-500 space-y-1">
                      <p>{formatFileSize(file.size)}</p>
                      <p>{formatDate(file.createdAt!)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={`rounded-lg border overflow-hidden ${
                isDarkMode ? 'border-gray-700' : 'border-gray-200'
              }`}>
                <div className={`px-6 py-3 border-b font-medium ${
                  isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
                }`}>
                  <div className="grid grid-cols-12 gap-4">
                    <div className="col-span-5">Name</div>
                    <div className="col-span-2 hidden sm:block">Size</div>
                    <div className="col-span-2 hidden md:block">Date Added</div>
                    <div className="col-span-3 md:col-span-3">Actions</div>
                  </div>
                </div>
                <div className={isDarkMode ? 'bg-gray-800' : 'bg-white'}>
                  {filteredFiles.map((file) => (
                    <div
                      key={file.id}
                      className={`px-6 py-4 border-b last:border-b-0 hover:bg-opacity-50 transition-colors duration-200 ${
                        isDarkMode ? 'border-gray-700 hover:bg-gray-700' : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <div className="grid grid-cols-12 gap-4 items-center">
                        <div className="col-span-5 flex items-center space-x-3">
                          <div className="text-gray-400">
                            {getFileIcon(file.type)}
                          </div>
                          <span className="truncate font-medium" title={file.name}>
                            {file.name}
                          </span>
                        </div>
                        <div className="col-span-2 hidden sm:block text-sm text-gray-500">
                          {formatFileSize(file.size)}
                        </div>
                        <div className="col-span-2 hidden md:block text-sm text-gray-500">
                          {formatDate(file.createdAt!)}
                        </div>
                        <div className="col-span-5 md:col-span-3 flex items-center space-x-2">
                          {activeFileView !== 'trash' && (
                            <>
                              <button
                                onClick={() => toggleStar(file.id)}
                                className={`p-1 rounded transition-colors duration-200 ${
                                  file.isStarred
                                    ? 'text-yellow-500 hover:text-yellow-600'
                                    : 'text-gray-400 hover:text-gray-600'
                                }`}
                              >
                                <Star className="w-4 h-4" fill={file.isStarred ? 'currentColor' : 'none'} />
                              </button>
                              <button
                                onClick={() => moveToTrash(file.id)}
                                className="p-1 rounded text-gray-400 hover:text-red-600 transition-colors duration-200"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          {activeFileView === 'trash' && (
                            <button
                              onClick={() => restoreFile(file.id)}
                              className="p-1 rounded text-gray-400 hover:text-green-600 transition-colors duration-200"
                              title="Restore"
                            >
                              <Upload className="w-4 h-4" />
                            </button>
                          )}
                          <a
                            href={file.fileUrl}
                            download={file.name}
                            className="p-1 rounded text-gray-400 hover:text-blue-600 transition-colors duration-200"
                          >
                            <Download className="w-4 h-4" />
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          /* Profile Section */
          <div className={`max-w-2xl mx-auto rounded-lg border p-8 ${
            isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}>
            <div className="text-center mb-8">
              <div className={`w-24 h-24 rounded-full mx-auto mb-4 flex items-center justify-center ${
                isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
              }`}>
                <User className="w-12 h-12 text-gray-400" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Profile</h2>
              <p className="text-gray-500">Manage your account settings</p>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <input
                  type="email"
                  value={user?.emailAddresses[0]?.emailAddress || ''}
                  readOnly
                  className={`w-full px-4 py-2 rounded-lg border ${
                    isDarkMode
                      ? 'bg-gray-700 border-gray-600 text-gray-300'
                      : 'bg-gray-50 border-gray-300 text-gray-600'
                  }`}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Storage Used</label>
                <div className={`p-4 rounded-lg ${
                  isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
                }`}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm">Files</span>
                    <span className="text-sm font-medium">
                      {formatFileSize(files.reduce((acc, file) => acc + file.size, 0))} used
                    </span>
                  </div>
                  <div className={`w-full h-2 rounded-full ${
                    isDarkMode ? 'bg-gray-600' : 'bg-gray-200'
                  }`}>
                    <div className="h-2 bg-blue-600 rounded-full" style={{ width: '3.7%' }}></div>
                  </div>
                </div>
              </div>
              
              <div className="pt-4 border-t border-gray-200">
                <button className="w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors duration-200">
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default DashboardClient;