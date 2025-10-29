import React, { useState, useEffect } from 'react';

interface DetectiveXChatHeaderProps {
  isTyping?: boolean;
  onBack?: () => void;
  onOpenInvestigation?: () => void;
  profileImageUrl?: string | null;
  onHowToPlay?: () => void;
}

export const DetectiveXChatHeader: React.FC<DetectiveXChatHeaderProps> = ({ 
  isTyping = false,
  onBack,
  onOpenInvestigation,
  profileImageUrl = null,
  onHowToPlay
}) => {
  const [status, setStatus] = useState<'online' | 'typing' | 'last_seen'>('online');
  const [lastSeen, setLastSeen] = useState<string>('');

  useEffect(() => {
    if (isTyping) {
      setStatus('typing');
    } else {
      // Random delay before showing online again (2-6 seconds)
      const delay = Math.random() * 4000 + 2000;
      const timer = setTimeout(() => {
        setStatus('online');
      }, delay);
      return () => clearTimeout(timer);
    }
  }, [isTyping]);

  useEffect(() => {
    // Update last seen timestamp
    const updateLastSeen = () => {
      const now = new Date();
      const hours = now.getHours().toString().padStart(2, '0');
      const minutes = now.getMinutes().toString().padStart(2, '0');
      setLastSeen(`${hours}:${minutes}`);
    };
    
    updateLastSeen();
    const interval = setInterval(updateLastSeen, 60000); // Update every minute
    
    return () => clearInterval(interval);
  }, []);

  const getStatusText = () => {
    switch (status) {
      case 'typing':
        return 'typing...';
      case 'online':
        return 'online';
      case 'last_seen':
        return `last seen today at ${lastSeen}`;
      default:
        return 'online';
    }
  };

  return (
    <div className="bg-[#202C33] border-b border-[#2A3942] px-4 py-3 flex items-center gap-3">
      {/* Back/Exit Button - Left Arrow Icon */}
      {onBack && (
        <button
          onClick={onBack}
          className="text-gray-400 hover:text-white transition-colors"
          aria-label="Exit"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}

      {/* Profile Picture */}
      <div className="relative">
        {profileImageUrl ? (
          <img 
            src={profileImageUrl} 
            alt="Detective X" 
            className="w-10 h-10 rounded-full object-cover"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gold-500 to-gold-700 flex items-center justify-center text-white font-bold text-sm">
            DX
          </div>
        )}
        {status === 'online' && (
          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-[#202C33]" />
        )}
      </div>

      {/* Name and Status */}
      <div className="flex-1 min-w-0">
        <h3 className="text-white font-semibold text-base">Detective X</h3>
        <p className="text-gray-400 text-xs truncate">
          {getStatusText()}
        </p>
      </div>

      {/* Mobile How to Play Button */}
      {onHowToPlay && (
        <button
          onClick={onHowToPlay}
          className="md:hidden text-gray-400 hover:text-white transition-colors p-2"
          aria-label="How to Play"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
      )}

      {/* Mobile Investigation Info Button - Far Right */}
      {onOpenInvestigation && (
        <button
          onClick={onOpenInvestigation}
          className="investigation-info-button md:hidden text-gray-400 hover:text-white transition-colors p-2"
          aria-label="View Evidence and Suspects"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </button>
      )}
    </div>
  );
};
