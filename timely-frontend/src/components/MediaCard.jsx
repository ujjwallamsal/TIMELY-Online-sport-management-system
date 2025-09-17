/**
 * MediaCard component for displaying media items in gallery.
 * Shows thumbnails, metadata, and action menus for moderators/uploaders.
 */
import React, { useState } from 'react';
import { mediaAPI } from '../services/api';

const MediaCard = ({ 
  media, 
  onUpdate, 
  onDelete, 
  showActions = true,
  className = '' 
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);

  const handleAction = async (action, mediaId, data = {}) => {
    setActionLoading(action);
    try {
      let response;
      switch (action) {
        case 'approve':
          response = await mediaAPI.approveMedia(mediaId);
          break;
        case 'reject':
          response = await mediaAPI.rejectMedia(mediaId, data.reason || '');
          break;
        case 'hide':
          response = await mediaAPI.hideMedia(mediaId);
          break;
        case 'feature':
          response = await mediaAPI.featureMedia(mediaId);
          break;
        case 'delete':
          await mediaAPI.deleteMedia(mediaId);
          onDelete?.(mediaId);
          return;
        default:
          return;
      }
      onUpdate?.(response.data);
    } catch (error) {
      console.error(`${action} error:`, error);
      // Handle error (could show toast notification)
    } finally {
      setActionLoading(null);
      setShowMenu(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      hidden: 'bg-gray-100 text-gray-800'
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  };

  const getKindIcon = (kind) => {
    if (kind === 'video') {
      return (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
        </svg>
      );
    }
    return (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
      </svg>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow ${className}`}>
      {/* Media Preview */}
      <div className="relative aspect-video bg-gray-100">
        {media.thumbnail_url ? (
          <img
            src={media.thumbnail_url}
            alt={media.title || 'Media preview'}
            className="w-full h-full object-cover"
          />
        ) : media.kind === 'video' ? (
          <div className="w-full h-full flex items-center justify-center bg-gray-200">
            <svg className="w-12 h-12 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
            </svg>
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-200">
            <svg className="w-12 h-12 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
            </svg>
          </div>
        )}
        
        {/* Overlay badges */}
        <div className="absolute top-2 left-2 flex flex-wrap gap-1">
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(media.status)}`}>
            {media.status}
          </span>
          {media.featured && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
              Featured
            </span>
          )}
        </div>
        
        {/* Kind icon */}
        <div className="absolute top-2 right-2">
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-black bg-opacity-50 text-white">
            {getKindIcon(media.kind)}
          </span>
        </div>
        
        {/* Action menu */}
        {showActions && (media.can_edit || media.can_moderate || media.can_delete) && (
          <div className="absolute top-2 right-2">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-black bg-opacity-50 text-white hover:bg-opacity-70 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
              </svg>
            </button>
            
            {showMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                <div className="py-1">
                  {media.can_edit && (
                    <button
                      onClick={() => {/* Handle edit */}}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Edit
                    </button>
                  )}
                  
                  {media.can_moderate && media.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleAction('approve', media.id)}
                        disabled={actionLoading === 'approve'}
                        className="block w-full text-left px-4 py-2 text-sm text-green-700 hover:bg-green-50 disabled:opacity-50"
                      >
                        {actionLoading === 'approve' ? 'Approving...' : 'Approve'}
                      </button>
                      <button
                        onClick={() => handleAction('reject', media.id)}
                        disabled={actionLoading === 'reject'}
                        className="block w-full text-left px-4 py-2 text-sm text-red-700 hover:bg-red-50 disabled:opacity-50"
                      >
                        {actionLoading === 'reject' ? 'Rejecting...' : 'Reject'}
                      </button>
                    </>
                  )}
                  
                  {media.can_moderate && media.status === 'approved' && (
                    <>
                      <button
                        onClick={() => handleAction('hide', media.id)}
                        disabled={actionLoading === 'hide'}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                      >
                        {actionLoading === 'hide' ? 'Hiding...' : 'Hide'}
                      </button>
                      <button
                        onClick={() => handleAction('feature', media.id)}
                        disabled={actionLoading === 'feature'}
                        className="block w-full text-left px-4 py-2 text-sm text-purple-700 hover:bg-purple-50 disabled:opacity-50"
                      >
                        {actionLoading === 'feature' ? 'Updating...' : (media.featured ? 'Unfeature' : 'Feature')}
                      </button>
                    </>
                  )}
                  
                  {media.can_delete && (
                    <button
                      onClick={() => handleAction('delete', media.id)}
                      disabled={actionLoading === 'delete'}
                      className="block w-full text-left px-4 py-2 text-sm text-red-700 hover:bg-red-50 disabled:opacity-50"
                    >
                      {actionLoading === 'delete' ? 'Deleting...' : 'Delete'}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Content */}
      <div className="p-4">
        <div className="space-y-2">
          {media.title && (
            <h3 className="font-medium text-gray-900 line-clamp-2">
              {media.title}
            </h3>
          )}
          
          {media.description && (
            <p className="text-sm text-gray-600 line-clamp-2">
              {media.description}
            </p>
          )}
          
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>by {media.uploader_name}</span>
            <span>{formatDate(media.created_at)}</span>
          </div>
          
          {(media.event_name || media.fixture_name) && (
            <div className="text-xs text-gray-500">
              {media.event_name && <span>Event: {media.event_name}</span>}
              {media.fixture_name && <span>Match: {media.fixture_name}</span>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MediaCard;
