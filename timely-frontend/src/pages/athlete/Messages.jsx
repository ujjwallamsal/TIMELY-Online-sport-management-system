import React, { useState, useEffect } from 'react';
import { 
  ChatBubbleLeftRightIcon,
  PaperAirplaneIcon,
  UserGroupIcon,
  ClockIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { api } from '../../lib/api';
import useSocket from '../../hooks/useSocket';
import LiveIndicator from '../../components/ui/LiveIndicator';
import Skeleton, { SkeletonCard, SkeletonList } from '../../components/ui/Skeleton';
import EmptyState from '../../components/ui/EmptyState';
import ChatThread from '../../components/ui/ChatThread';

const AthleteMessages = () => {
  const [loading, setLoading] = useState(true);
  const [threads, setThreads] = useState([]);
  const [selectedThread, setSelectedThread] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);

  // WebSocket connection for real-time updates
  const { connectionStatus, lastMessage } = useSocket(
    `${import.meta.env.VITE_WS_URL}/ws/athlete/`,
    {
      onMessage: (message) => {
        console.log('Received message:', message);
        handleRealtimeUpdate(message);
      }
    }
  );

  const fetchThreads = async () => {
    try {
      setLoading(true);
      const response = await api.get('messages/threads/');
      setThreads(response.data.results || response.data);
    } catch (error) {
      console.error('Error fetching threads:', error);
      setError('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (threadId) => {
    try {
      const response = await api.get(`messages/threads/${threadId}/messages/`);
      setMessages(response.data.results || response.data);
    } catch (error) {
      console.error('Error fetching messages:', error);
      setError('Failed to load messages');
    }
  };

  const handleRealtimeUpdate = (message) => {
    switch (message.type) {
      case 'message_update':
        // Update messages in real-time
        if (selectedThread && message.data.thread_id === selectedThread.id) {
          setMessages(prev => [...prev, message.data]);
        }
        // Update thread list
        fetchThreads();
        break;
      default:
        break;
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedThread || sending) return;

    try {
      setSending(true);
      const response = await api.post(`messages/threads/${selectedThread.id}/send_message/`, {
        body: newMessage.trim()
      });
      
      setMessages(prev => [...prev, response.data]);
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleCreateThread = async (title, participants) => {
    try {
      const response = await api.post('messages/threads/', {
        title,
        participants
      });
      
      setThreads(prev => [response.data, ...prev]);
      setSelectedThread(response.data);
      setMessages([]);
    } catch (error) {
      console.error('Error creating thread:', error);
      setError('Failed to create thread');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } else if (diffInHours < 168) { // 7 days
      return date.toLocaleDateString('en-US', { 
        weekday: 'short',
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  const getThreadIcon = (thread) => {
    if (thread.participants && thread.participants.length > 2) {
      return <UserGroupIcon className="w-5 h-5" />;
    }
    return <ChatBubbleLeftRightIcon className="w-5 h-5" />;
  };

  useEffect(() => {
    fetchThreads();
  }, []);

  useEffect(() => {
    if (selectedThread) {
      fetchMessages(selectedThread.id);
    }
  }, [selectedThread]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <Skeleton className="h-8 w-48 mb-4" />
            <SkeletonList items={5} />
          </div>
          <div className="lg:col-span-2">
            <SkeletonCard />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Messages</h1>
            <p className="text-gray-600 mt-2">Communicate with organizers and other participants</p>
          </div>
          <LiveIndicator status={connectionStatus} />
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Threads List */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Conversations</h2>
                <button
                  onClick={() => handleCreateThread('New Conversation', [])}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  New
                </button>
              </div>
            </div>
            
            <div className="max-h-96 overflow-y-auto">
              {threads.length > 0 ? (
                <div className="divide-y divide-gray-200">
                  {threads.map((thread) => (
                    <button
                      key={thread.id}
                      onClick={() => setSelectedThread(thread)}
                      className={`w-full p-4 text-left hover:bg-gray-50 ${
                        selectedThread?.id === thread.id ? 'bg-blue-50 border-r-2 border-blue-500' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0">
                          {getThreadIcon(thread)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h3 className="text-sm font-medium text-gray-900 truncate">
                              {thread.title}
                            </h3>
                            <span className="text-xs text-gray-500">
                              {formatDate(thread.last_message_at || thread.created_at)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500 truncate mt-1">
                            {thread.last_message || 'No messages yet'}
                          </p>
                          {thread.unread_count > 0 && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mt-1">
                              {thread.unread_count} new
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-4">
                  <EmptyState 
                    title="No Conversations"
                    description="Start a conversation with organizers or other participants."
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="lg:col-span-2">
          {selectedThread ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-96 flex flex-col">
              {/* Thread Header */}
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  {getThreadIcon(selectedThread)}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{selectedThread.title}</h3>
                    <p className="text-sm text-gray-500">
                      {selectedThread.participants?.length || 0} participants
                    </p>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length > 0 ? (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.sender_id === 'me' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          message.sender_id === 'me'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        <p className="text-sm">{message.body}</p>
                        <div className={`flex items-center gap-1 mt-1 ${
                          message.sender_id === 'me' ? 'text-blue-100' : 'text-gray-500'
                        }`}>
                          <span className="text-xs">
                            {formatDate(message.created_at)}
                          </span>
                          {message.sender_id === 'me' && (
                            <CheckCircleIcon className="w-3 h-3" />
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <EmptyState 
                      title="No Messages"
                      description="Start the conversation by sending a message."
                    />
                  </div>
                )}
              </div>

              {/* Message Input */}
              <div className="p-4 border-t border-gray-200">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Type a message..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={sending}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() || sending}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {sending ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <PaperAirplaneIcon className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-96 flex items-center justify-center">
              <EmptyState 
                title="Select a Conversation"
                description="Choose a conversation from the list to start messaging."
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AthleteMessages;
