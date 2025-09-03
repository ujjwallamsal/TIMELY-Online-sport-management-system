import React from 'react';

/**
 * MessageBubble component for displaying individual messages
 * Shows different styles for own vs others' messages
 */
const MessageBubble = ({ message, isOwn, showAvatar = true }) => {
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`flex max-w-xs lg:max-w-md ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
        {/* Avatar */}
        {showAvatar && !isOwn && (
          <div className="flex-shrink-0 mr-3">
            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-gray-600">
                {message.sender_name?.charAt(0) || message.sender_email?.charAt(0) || '?'}
              </span>
            </div>
          </div>
        )}

        {/* Message content */}
        <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
          {/* Sender name and timestamp */}
          {!isOwn && (
            <div className="flex items-center space-x-2 mb-1">
              <span className="text-xs font-medium text-gray-600">
                {message.sender_name || message.sender_email}
              </span>
              <span className="text-xs text-gray-400">
                {formatTime(message.created_at)}
              </span>
            </div>
          )}

          {/* Message bubble */}
          <div
            className={`
              px-4 py-2 rounded-lg shadow-sm
              ${isOwn 
                ? 'bg-blue-500 text-white rounded-br-sm' 
                : 'bg-white border border-gray-200 text-gray-900 rounded-bl-sm'
              }
            `}
          >
            <p className="text-sm whitespace-pre-wrap break-words">
              {message.body}
            </p>
          </div>

          {/* Own message timestamp */}
          {isOwn && (
            <span className="text-xs text-gray-400 mt-1">
              {formatTime(message.created_at)}
            </span>
          )}

          {/* Edit indicator */}
          {message.edited_at && (
            <span className="text-xs text-gray-400 mt-1">
              (edited)
            </span>
          )}
        </div>

        {/* Own message avatar */}
        {showAvatar && isOwn && (
          <div className="flex-shrink-0 ml-3">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-white">
                You
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageBubble;
