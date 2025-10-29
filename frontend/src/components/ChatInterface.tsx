import React, { useEffect, useRef } from 'react';
import { ChatMessage } from './ChatMessage';
import { DetectiveXChatHeader } from './DetectiveXChatHeader';

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
  onExit?: () => void;
  onOpenInvestigation?: () => void;
  detectiveProfileUrl?: string | null;
  onHowToPlay?: () => void;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  messages, 
  loading = false,
  error = null,
  onExit,
  onOpenInvestigation,
  detectiveProfileUrl = null,
  onHowToPlay
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current && containerRef.current) {
      messagesEndRef.current.scrollIntoView({ 
        behavior: 'smooth',
        block: 'end',
        inline: 'nearest'
      });
    }
  }, [messages]);

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#0B141A]">
      {/* Detective X Header - WhatsApp Style */}
      <DetectiveXChatHeader 
        isTyping={loading} 
        onBack={onExit}
        onOpenInvestigation={onOpenInvestigation}
        profileImageUrl={detectiveProfileUrl}
        onHowToPlay={onHowToPlay}
      />
      
      {/* Chat Messages Area with WhatsApp background pattern */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-y-auto p-4 scroll-smooth chat-scroll"
        style={{
          backgroundImage: `repeating-linear-gradient(
            45deg,
            rgba(255, 255, 255, 0.02) 0px,
            rgba(255, 255, 255, 0.02) 2px,
            transparent 2px,
            transparent 4px
          )`
        }}
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
                Ask Detective X about the case, suspects, or crime scene. 
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

          {/* Loading indicator - WhatsApp style */}
          {loading && (
            <div className="flex justify-start mb-4">
              <div className="bg-[#202C33] rounded-lg px-4 py-3 max-w-[75%]">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Scroll anchor */}
          <div ref={messagesEndRef} />
        </div>
      </div>
    </div>
  );
};
