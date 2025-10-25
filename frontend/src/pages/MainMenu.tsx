import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, HowToPlayModal } from '@/components';

/**
 * Main Menu Page - Landing page for Detective AI game
 * Features: New Game, Resume Game (if session exists), How to Play
 */
export const MainMenu: React.FC = () => {
  const navigate = useNavigate();
  const [showHowToPlay, setShowHowToPlay] = useState(false);

  // TODO: Check localStorage for existing session
  const hasExistingSession = false; // Placeholder

  const handleNewGame = () => {
    // TODO: Navigate to case selection
    navigate('/cases');
  };

  const handleResumeGame = () => {
    // TODO: Load existing session and navigate to game
    navigate('/game');
  };

  const handleHowToPlay = () => {
    setShowHowToPlay(true);
  };

  return (
    <div className="min-h-screen bg-dark-bg flex flex-col items-center justify-center p-4 sm:p-6 md:p-8">
      {/* Title Section */}
      <div className="text-center mb-8 sm:mb-10 md:mb-12 animate-fade-in">
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-gold-500 mb-3 sm:mb-4 tracking-tight">
          Detective AI
        </h1>
        <p className="text-lg sm:text-xl md:text-2xl text-gray-400 font-light">
          Solve mysteries through conversation
        </p>
      </div>

      {/* Menu Buttons */}
      <div className="flex flex-col gap-3 sm:gap-4 w-full max-w-md animate-fade-in">
        {/* New Game Button */}
        <Button
          variant="primary"
          size="lg"
          fullWidth
          onClick={handleNewGame}
        >
          New Game
        </Button>

        {/* Resume Game Button - Only show if session exists */}
        {hasExistingSession && (
          <Button
            variant="secondary"
            size="lg"
            fullWidth
            onClick={handleResumeGame}
          >
            Resume Game
          </Button>
        )}

        {/* How to Play Button */}
        <Button
          variant="ghost"
          size="lg"
          fullWidth
          onClick={handleHowToPlay}
        >
          How to Play
        </Button>
      </div>

      {/* Footer */}
      <div className="absolute bottom-4 sm:bottom-6 md:bottom-8 text-center">
        <p className="text-xs sm:text-sm text-gray-600">
          A chat-based detective game powered by AI
        </p>
      </div>

      {/* How to Play Modal */}
      <HowToPlayModal 
        isOpen={showHowToPlay} 
        onClose={() => setShowHowToPlay(false)} 
      />
    </div>
  );
};
