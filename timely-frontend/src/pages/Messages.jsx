import React, { useState, useEffect } from 'react';
import { messagesAPI } from '../api';
import { useSocket } from '../hooks/useSocket';
import ThreadList from '../components/ThreadList';
import MessageBubble from '../components/MessageBubble';
import MessageComposer from '../components/MessageComposer';

/**
 * Messages page with two-pane layout: ThreadList + Active thread view
 * Subscribes to thread WebSocket with 30s polling fallback
 */
const Messages = () => {
  const [threads, setThreads] = useState([]);
  const [activeThread, setActiveThread] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sendingMessage, setSendingMessage] = useState(false);

  // WebSocket connection for realtime messages
  const { isConnected, lastMessage } = useSocket(
    activeThread ? `ws://127.0.0.1:8000/ws/messages/thread/${activeThread.id}/` : null,
    {
      onMessage: handleRealtimeMessage,
      enablePolling: true,
      pollingInterval: 30000, // 30 seconds
    }
  );

  function handleRealtimeMessage(data) {
    if (data.type === 'message.new') {
      // Add new message to current thread
      if (activeThread && data.data.thread_id === activeThread.id) {
        setMessages(prev => [...prev, data.data]);
      }
      
      // Update thread list with new last message
      setThreads(prev =>
        prev.map(thread =>
          thread.id === data.data.thread_id
            ? {
                ...thread,
                last_message: {
                  id: data.data.message_id,
                  body: data.data.body,
                  sender_email: data.data.sender.email,
                  created_at: data.data.created_at,
                },
                unread_count: thread.id === activeThread?.id ? 0 : (thread.unread_count || 0) + 1,
              }
            : thread
        )
      );
    } else if (data.type === 'thread.updated') {
      // Update thread info
      setThreads(prev =>
        prev.map(thread =>
          thread.id === data.data.thread_id
            ? { ...thread, ...data.data }
            : thread
        )
      );
    }
  }

  const loadThreads = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await messagesAPI.listThreads();
      setThreads(response.data.results || response.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (threadId) => {
    try {
      setMessagesLoading(true);
      setError(null);

      const response = await messagesAPI.listThreadMessages(threadId);
      setMessages(response.data.results || response.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load messages');
    } finally {
      setMessagesLoading(false);
    }
  };

  const handleThreadSelect = async (thread) => {
    setActiveThread(thread);
    await loadMessages(thread.id);
    
    // Mark thread as read
    try {
      await messagesAPI.markThreadRead(thread.id);
      
      // Update unread count in threads list
      setThreads(prev =>
        prev.map(t =>
          t.id === thread.id ? { ...t, unread_count: 0 } : t
        )
      );
    } catch (err) {
      console.error('Failed to mark thread as read:', err);
    }
  };

  const handleSendMessage = async (body) => {
    if (!activeThread || sendingMessage) return;

    try {
      setSendingMessage(true);
      await messagesAPI.sendMessage(activeThread.id, body);
      
      // Message will be added via WebSocket or we can reload
      await loadMessages(activeThread.id);
    } catch (err) {
      console.error('Failed to send message:', err);
      throw err; // Re-throw so MessageComposer can handle it
    } finally {
      setSendingMessage(false);
    }
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInDays = (now - date) / (1000 * 60 * 60 * 24);

    if (diffInDays < 1) {
      return 'Today';
    } else if (diffInDays < 2) {
      return 'Yesterday';
    } else if (diffInDays < 7) {
      return date.toLocaleDateString([], { weekday: 'long' });
    } else {
      return date.toLocaleDateString();
    }
  };

  const groupMessagesByDate = (messages) => {
    const groups = {};
    
    messages.forEach(message => {
      const date = formatDate(message.created_at);
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(message);
    });
    
    return groups;
  };

  useEffect(() => {
    loadThreads();
  }, []);

  return (
    <div className="h-screen bg-gray-50 flex">
      {/* Thread List */}
      <ThreadList
        threads={threads}
        activeThreadId={activeThread?.id}
        onThreadSelect={handleThreadSelect}
        loading={loading}
        error={error}
      />

      {/* Active Thread View */}
      <div className="flex-1 flex flex-col">
        {activeThread ? (
          <>
            {/* Thread Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    {activeThread.title || `${activeThread.scope} thread`}
                  </h2>
                  <p className="text-sm text-gray-600">
                    {activeThread.participant_count} participants • {isConnected ? 'Connected' : 'Disconnected'}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-500">
                    {activeThread.scope}
                  </span>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6">
              {messagesLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="text-gray-400 mb-2">
                      <svg className="w-8 h-8 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <p className="text-gray-600">No messages yet</p>
                    <p className="text-sm text-gray-500 mt-1">Start the conversation</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {Object.entries(groupMessagesByDate(messages)).map(([date, dateMessages]) => (
                    <div key={date}>
                      {/* Date separator */}
                      <div className="flex items-center my-4">
                        <div className="flex-1 border-t border-gray-200"></div>
                        <span className="px-3 text-xs text-gray-500 bg-gray-50 rounded-full">
                          {date}
                        </span>
                        <div className="flex-1 border-t border-gray-200"></div>
                      </div>
                      
                      {/* Messages for this date */}
                      <div className="space-y-4">
                        {dateMessages.map((message, index) => {
                          const isOwn = message.sender_email === localStorage.getItem('userEmail');
                          const showAvatar = index === 0 || 
                            dateMessages[index - 1].sender_email !== message.sender_email;
                          
                          return (
                            <MessageBubble
                              key={message.id}
                              message={message}
                              isOwn={isOwn}
                              showAvatar={showAvatar}
                            />
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Message Composer */}
            <MessageComposer
              onSend={handleSendMessage}
              disabled={sendingMessage}
              placeholder="Type a message..."
            />
          </>
        ) : (
          /* No thread selected */
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="text-gray-400 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Select a conversation</h3>
              <p className="text-gray-600">Choose a thread from the sidebar to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Messages;
