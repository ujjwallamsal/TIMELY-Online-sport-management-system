/**
 * MediaUpload component for uploading photos and videos.
 * Supports drag & drop, file validation, and progress tracking.
 */
import React, { useState, useRef } from 'react';
import { mediaAPI } from '../lib/api';

const MediaUpload = ({ 
  onUploadSuccess, 
  onUploadError, 
  eventId = null, 
  fixtureId = null,
  className = '' 
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [preview, setPreview] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    event: eventId,
    fixture: fixtureId
  });
  
  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileSelect = (file) => {
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm'];
    if (!allowedTypes.includes(file.type)) {
      onUploadError?.('Please select a valid image (JPG, PNG, WebP) or video (MP4, WebM) file.');
      return;
    }

    // Validate file size
    const maxSize = file.type.startsWith('image/') ? 10 * 1024 * 1024 : 100 * 1024 * 1024; // 10MB for images, 100MB for videos
    if (file.size > maxSize) {
      const maxSizeMB = maxSize / (1024 * 1024);
      onUploadError?.(`File too large. Maximum size is ${maxSizeMB}MB.`);
      return;
    }

    setSelectedFile(file);
    
    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target.result);
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedFile) {
      onUploadError?.('Please select a file to upload.');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const uploadData = new FormData();
      uploadData.append('file', selectedFile);
      uploadData.append('title', formData.title);
      uploadData.append('description', formData.description);
      
      if (formData.event) {
        uploadData.append('event', formData.event);
      }
      if (formData.fixture) {
        uploadData.append('fixture', formData.fixture);
      }

      const response = await mediaAPI.createMedia(uploadData);
      
      setUploadProgress(100);
      onUploadSuccess?.(response.data);
      
      // Reset form
      setSelectedFile(null);
      setPreview(null);
      setFormData({
        title: '',
        description: '',
        event: eventId,
        fixture: fixtureId
      });
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
    } catch (error) {
      console.error('Upload error:', error);
      onUploadError?.(error.response?.data?.error || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={`bg-white rounded-lg border-2 border-dashed border-gray-300 p-6 ${className}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* File Drop Zone */}
        <div
          className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isDragging 
              ? 'border-blue-400 bg-blue-50' 
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,video/mp4,video/webm"
            onChange={handleFileInputChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={uploading}
          />
          
          {selectedFile ? (
            <div className="space-y-4">
              {preview && (
                <div className="mx-auto max-w-xs">
                  <img 
                    src={preview} 
                    alt="Preview" 
                    className="w-full h-32 object-cover rounded-lg"
                  />
                </div>
              )}
              <div className="text-sm text-gray-600">
                <p className="font-medium">{selectedFile.name}</p>
                <p className="text-gray-500">
                  {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>
              <button
                type="button"
                onClick={removeFile}
                className="text-red-600 hover:text-red-800 text-sm"
                disabled={uploading}
              >
                Remove file
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <div className="text-sm text-gray-600">
                <p className="font-medium">Drop files here or click to browse</p>
                <p className="text-gray-500">Images: JPG, PNG, WebP (max 10MB)</p>
                <p className="text-gray-500">Videos: MP4, WebM (max 100MB)</p>
              </div>
            </div>
          )}
        </div>

        {/* Upload Progress */}
        {uploading && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Uploading...</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Form Fields */}
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Title (optional)
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter a title for your media"
              disabled={uploading}
            />
          </div>
          
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description (optional)
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Describe your media"
              disabled={uploading}
            />
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={!selectedFile || uploading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {uploading ? 'Uploading...' : 'Upload Media'}
        </button>
      </form>
    </div>
  );
};

export default MediaUpload;
