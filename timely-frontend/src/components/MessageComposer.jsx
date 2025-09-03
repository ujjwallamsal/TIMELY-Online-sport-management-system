import React, { useState, useRef, useEffect } from 'react';

/**
 * MessageComposer component for sending messages
 * Simple text box with send button, disabled when empty
 */
const MessageComposer = ({ onSend, disabled = false, placeholder = "Type a message..." }) => {
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const textareaRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!message.trim() || isSending || disabled) {
      return;
    }

    setIsSending(true);
    try {
      await onSend(message.trim());
      setMessage('');
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleInput = (e) => {
    setMessage(e.target.value);
    
    // Auto-resize textarea
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
  };

  const canSend = message.trim().length > 0 && !isSending && !disabled;

  return (
    <div className="border-t border-gray-200 bg-white p-4">
      <form onSubmit={handleSubmit} className="flex items-end space-x-3">
        <div className="flex-1">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled || isSending}
            className={`
              w-full px-3 py-2 border border-gray-300 rounded-lg
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
              resize-none overflow-hidden
              ${disabled || isSending 
                ? 'bg-gray-100 cursor-not-allowed' 
                : 'bg-white'
              }
            `}
            style={{ minHeight: '40px', maxHeight: '120px' }}
            rows={1}
          />
        </div>
        
        <button
          type="submit"
          disabled={!canSend}
          className={`
            px-4 py-2 rounded-lg font-medium text-sm
            transition-colors duration-200
            focus:outline-none focus:ring-2 focus:ring-offset-2
            ${canSend
              ? 'bg-blue-500 text-white hover:bg-blue-600 focus:ring-blue-500'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }
          `}
        >
          {isSending ? (
            <div className="flex items-center space-x-2">
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Sending...</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
              <span>Send</span>
            </div>
          )}
        </button>
      </form>
      
      {/* Character count */}
      <div className="mt-2 text-xs text-gray-500 text-right">
        {message.length}/2000
      </div>
    </div>
  );
};

export default MessageComposer;
