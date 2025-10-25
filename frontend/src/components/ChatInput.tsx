import React, { useState, useEffect } from 'react';
import { Button } from './Button';
import { Input } from './Input';

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
    <form onSubmit={handleSubmit} className="space-y-2">
      <div className="flex gap-2">
        <div className="flex-1">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question about the case..."
            disabled={isDisabled}
            error={error || undefined}
          />
        </div>
        <Button
          type="submit"
          disabled={isDisabled}
          isLoading={loading}
          className="min-w-[100px]"
        >
          {cooldownRemaining > 0 ? `Wait ${cooldownRemaining}s` : 'Send'}
        </Button>
      </div>

      {/* Validation hints */}
      <div className="flex items-center justify-between text-xs">
        <div className="text-gray-500">
          {message.length > 0 && (
            <span className={message.length < 2 ? 'text-red-400' : 'text-gray-500'}>
              {message.trim().length} / 2 min
            </span>
          )}
        </div>
        {cooldownRemaining > 0 && (
          <div className="text-gold-500">
            Cooldown: {cooldownRemaining}s
          </div>
        )}
      </div>
    </form>
  );
};
