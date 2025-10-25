import React, { useEffect, useRef } from 'react';
import { ChatMessage } from './ChatMessage';
import { Loading } from './Loading';

interface Message {
  message_id: string;
  game_id: string;
  sender: 'user' | 'ai';
  content: string;
  sequence_number: number;
  created_at: string;
}

interface ChatInterfaceProps {
  messages: Message[];
  loading?: boolean;
  error?: string | null;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  messages, 
  loading = false,
  error = null 
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  return (
    <div 
      ref={containerRef}
      className="flex-1 overflow-y-auto p-4 scroll-smooth chat-scroll"
      role="log"
      aria-live="polite"
      aria-label="Chat conversation"
    >
      <div className="max-w-4xl mx-auto">
        {/* Error state */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-4" role="alert">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Empty state */}
        {messages.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="text-gold-500 text-4xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-gray-300 mb-2">
              Start Your Investigation
            </h3>
            <p className="text-gray-400 text-sm max-w-md mx-auto">
              Ask the Detective AI about the case, suspects, or crime scene. 
              Unlock evidence by asking the right questions.
            </p>
          </div>
        )}

        {/* Messages */}
        {messages.map((message) => (
          <ChatMessage
            key={message.message_id}
            sender={message.sender}
            content={message.content}
            timestamp={message.created_at}
          />
        ))}

        {/* Loading indicator */}
        {loading && (
          <div className="flex justify-start mb-4">
            <div className="bg-dark-elevated border border-dark-border rounded-lg px-4 py-3">
              <div className="flex items-center gap-2">
                <Loading size="sm" />
                <span className="text-gray-400 text-sm">Detective AI is thinking...</span>
              </div>
            </div>
          </div>
        )}

        {/* Scroll anchor */}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};
