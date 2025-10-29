import React, { useState, useEffect } from 'react';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
  loading?: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({ 
  onSendMessage, 
  disabled = false,
  loading = false 
}) => {
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);

  const COOLDOWN_SECONDS = 5;

  // Cooldown timer effect
  useEffect(() => {
    if (cooldownRemaining > 0) {
      const timer = setTimeout(() => {
        setCooldownRemaining(cooldownRemaining - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldownRemaining]);

  // Validate message
  const validateMessage = (msg: string): string | null => {
    // Check if empty
    if (!msg.trim()) {
      return 'Message cannot be empty';
    }

    // Check minimum length (2 characters)
    if (msg.trim().length < 2) {
      return 'Message must be at least 2 characters';
    }

    // Check if contains at least one alphabetic character
    if (!/[a-zA-Z]/.test(msg)) {
      return 'Message must contain at least one letter';
    }

    return null;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Clear previous error
    setError(null);

    // Check cooldown
    if (cooldownRemaining > 0) {
      setError(`Please wait ${cooldownRemaining} second${cooldownRemaining > 1 ? 's' : ''} before sending another message`);
      return;
    }

    // Validate message
    const validationError = validateMessage(message);
    if (validationError) {
      setError(validationError);
      return;
    }

    // Send message
    onSendMessage(message.trim());
    setMessage('');
    setError(null);

    // Start cooldown
    setCooldownRemaining(COOLDOWN_SECONDS);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const isDisabled = disabled || loading || cooldownRemaining > 0;

  return (
    <form onSubmit={handleSubmit} className="chat-input-area bg-[#202C33] px-3 py-2">
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            disabled={isDisabled}
            className="w-full bg-[#2A3942] text-white placeholder-gray-500 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gold-500 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          />
          {error && (
            <p className="text-red-400 text-xs mt-1 ml-1">{error}</p>
          )}
        </div>
        <button
          id="send-button"
          type="submit"
          disabled={isDisabled}
          className="bg-gold-600 hover:bg-gold-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-full p-3 transition-colors flex items-center justify-center"
          aria-label="Send message"
        >
          {loading ? (
            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          ) : cooldownRemaining > 0 ? (
            <span className="text-xs font-bold">{cooldownRemaining}</span>
          ) : (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          )}
        </button>
      </div>
    </form>
  );
};
