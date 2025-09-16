import React, { useState, useRef, useEffect } from 'react';
import { 
  PaperAirplaneIcon, 
  UserIcon, 
  EllipsisVerticalIcon,
  CheckIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

const ChatThread = ({ 
  messages = [], 
  onSendMessage,
  currentUser,
  isLoading = false,
  className = ''
}) => {
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (newMessage.trim() && onSendMessage) {
      onSendMessage(newMessage.trim());
      setNewMessage('');
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
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
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
    }
  };

  const groupMessagesByDate = (messages) => {
    const groups = {};
    messages.forEach(message => {
      const date = new Date(message.created_at).toDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(message);
    });
    return groups;
  };

  const messageGroups = groupMessagesByDate(messages);

  return (
    <div className={`flex flex-col h-full bg-white border border-gray-200 rounded-lg ${className}`}>
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {Object.entries(messageGroups).map(([date, dateMessages]) => (
          <div key={date}>
            {/* Date separator */}
            <div className="flex items-center justify-center my-4">
              <div className="bg-gray-100 text-gray-500 text-xs px-3 py-1 rounded-full">
                {formatDate(dateMessages[0].created_at)}
              </div>
            </div>
            
            {/* Messages for this date */}
            <div className="space-y-3">
              {dateMessages.map((message, index) => {
                const isOwn = message.sender.id === currentUser?.id;
                const prevMessage = index > 0 ? dateMessages[index - 1] : null;
                const showAvatar = !prevMessage || prevMessage.sender.id !== message.sender.id;
                
                return (
                  <div
                    key={message.id}
                    className={`flex ${isOwn ? 'justify-end' : 'justify-start'} ${
                      showAvatar ? 'mt-4' : 'mt-1'
                    }`}
                  >
                    <div className={`flex max-w-xs lg:max-w-md ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
                      {/* Avatar */}
                      {!isOwn && showAvatar && (
                        <div className="flex-shrink-0 mr-3">
                          <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                            <UserIcon className="w-5 h-5 text-gray-600" />
                          </div>
                        </div>
                      )}
                      
                      {/* Message bubble */}
                      <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
                        {!isOwn && showAvatar && (
                          <div className="text-xs text-gray-500 mb-1">
                            {message.sender.first_name} {message.sender.last_name}
                          </div>
                        )}
                        
                        <div
                          className={`px-4 py-2 rounded-lg ${
                            isOwn
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-900'
                          }`}
                        >
                          <p className="text-sm">{message.body}</p>
                        </div>
                        
                        <div className={`flex items-center mt-1 text-xs text-gray-500 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
                          <span>{formatTime(message.created_at)}</span>
                          {isOwn && (
                            <div className="ml-1">
                              {message.read_at ? (
                                <CheckCircleIcon className="w-3 h-3 text-blue-500" />
                              ) : (
                                <CheckIcon className="w-3 h-3" />
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg px-4 py-2">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Message input */}
      <div className="border-t border-gray-200 p-4">
        <form onSubmit={handleSubmit} className="flex items-center space-x-2">
          <input
            ref={inputRef}
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || isLoading}
            className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <PaperAirplaneIcon className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatThread;
