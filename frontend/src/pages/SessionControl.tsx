import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Modal, Button } from '@/components';
import { buildApiUrl } from '@/config/api';

export const SessionControl: React.FC = () => {
  const { caseId } = useParams<{ caseId: string }>();
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    // Check localStorage for existing session for this case
    const sessionKey = `game_session_${caseId}`;
    const existingSession = localStorage.getItem(sessionKey);
    
    if (existingSession && existingSession !== 'undefined' && existingSession !== 'null') {
      setShowModal(true);
    } else {
      // No valid existing session, clear invalid one and create new game
      if (existingSession) {
        localStorage.removeItem(sessionKey);
      }
      handleNewGame();
    }
  }, [caseId]);

  const handleNewGame = async () => {
    try {
      console.log('Creating new game for case:', caseId);
      const response = await fetch(buildApiUrl('/api/games/start'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ case_id: caseId }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Failed to create game:', errorData);
        throw new Error('Failed to create game');
      }
      
      const data = await response.json();
      console.log('Game created successfully:', data);
      const gameId = data.game?.game_id || data.game_id;

      if (!gameId) {
        console.error('No game_id in response:', data);
        throw new Error('Invalid response: missing game_id');
      }

      // Save session to localStorage
      localStorage.setItem(`game_session_${caseId}`, gameId);
      console.log('Navigating to game:', gameId);

      // Navigate to game page
      navigate(`/game/${gameId}`);
    } catch (error) {
      console.error('Error creating game:', error);
      alert('Failed to create game. Please try again.');
      navigate('/cases');
    }
  };

  const handleResumeGame = () => {
    const sessionKey = `game_session_${caseId}`;
    const gameId = localStorage.getItem(sessionKey);
    
    if (gameId) {
      navigate(`/game/${gameId}`);
    } else {
      handleNewGame();
    }
  };

  const handleOverwriteSession = () => {
    // Delete old session
    localStorage.removeItem(`game_session_${caseId}`);
    setShowModal(false);
    handleNewGame();
  };

  return (
    <div className="min-h-screen bg-dark-bg flex items-center justify-center">
      <Modal
        isOpen={showModal}
        onClose={() => navigate('/cases')}
        size="md"
        title="Existing Session Found"
      >
        <div className="space-y-6">
          <p className="text-gray-300">
            You have an existing game session for this case. Would you like to resume or start a new game?
          </p>

          <div className="flex flex-col gap-3">
            <Button
              variant="primary"
              size="lg"
              fullWidth
              onClick={handleResumeGame}
            >
              Resume Game
            </Button>

            <Button
              variant="secondary"
              size="lg"
              fullWidth
              onClick={handleOverwriteSession}
            >
              Start New Game
            </Button>

            <Button
              variant="ghost"
              size="md"
              fullWidth
              onClick={() => navigate('/cases')}
            >
              Back to Cases
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
