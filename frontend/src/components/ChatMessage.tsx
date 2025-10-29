import React from 'react';

interface ChatMessageProps {
  sender: 'user' | 'ai';
  content: string;
  timestamp?: string;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ sender, content, timestamp }) => {
  const isUser = sender === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-2`}>
      <div className={`max-w-[75%] ${isUser ? 'order-2' : 'order-1'}`}>
        {/* WhatsApp-style Message bubble */}
        <div
          className={`
            rounded-lg px-3 py-2 shadow-sm
            ${isUser 
              ? 'bg-[#005C4B] text-white rounded-br-none' 
              : 'bg-[#202C33] text-gray-100 rounded-bl-none'
            }
          `}
        >
          {/* Message content */}
          <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">
            {content}
          </div>
          
          {/* Timestamp - WhatsApp style (bottom right) */}
          {timestamp && (
            <div className={`text-[10px] mt-1 text-right ${isUser ? 'text-gray-300' : 'text-gray-500'}`}>
              {new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
