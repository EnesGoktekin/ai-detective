import React from 'react';

interface ChatMessageProps {
  sender: 'user' | 'ai';
  content: string;
  timestamp?: string;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ sender, content, timestamp }) => {
  const isUser = sender === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`max-w-[80%] ${isUser ? 'order-2' : 'order-1'}`}>
        {/* Message bubble */}
        <div
          className={`
            rounded-lg px-4 py-3 
            ${isUser 
              ? 'bg-gold-600 text-dark-bg' 
              : 'bg-dark-elevated text-gray-100 border border-dark-border'
            }
          `}
        >
          {/* Sender label */}
          <div className={`text-xs font-semibold mb-1 ${isUser ? 'text-dark-surface' : 'text-gold-500'}`}>
            {isUser ? 'You' : 'Detective AI'}
          </div>
          
          {/* Message content */}
          <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">
            {content}
          </div>
          
          {/* Timestamp */}
          {timestamp && (
            <div className={`text-xs mt-1 ${isUser ? 'text-dark-surface/70' : 'text-gray-500'}`}>
              {new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
