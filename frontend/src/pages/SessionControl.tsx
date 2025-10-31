import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Modal, Button } from '@/components';
import { buildApiUrl } from '@/config/api';

export const SessionControl: React.FC = () => {
  const { caseId } = useParams<{ caseId: string }>();
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);

  /**
   * Session Control Logic:
   * 
   * Fast Path (No Existing Session):
   * - Check localStorage for game_session_{caseId}
   * - If no valid session exists, skip modal
   * - Directly create new game via POST /api/games/start
   * - Navigate to /game/{new_game_id}
   * 
   * Modal Path (Existing Session Found):
   * - Show modal with Resume/Start New options
   * - Resume: Navigate to existing game
   * - Start New: Delete old session + Create new game with old_game_id cleanup
   */
  useEffect(() => {
    // Check localStorage for existing session for this case
    const sessionKey = `game_session_${caseId}`;
    const existingSession = localStorage.getItem(sessionKey);
    
    if (existingSession && existingSession !== 'undefined' && existingSession !== 'null') {
      // Existing session found - show modal
      setShowModal(true);
    } else {
      // No valid existing session - fast path to new game
      if (existingSession) {
        // Clean up invalid session data
        localStorage.removeItem(sessionKey);
      }
      handleNewGame();
    }
  }, [caseId]);

  const handleNewGame = async (oldGameId?: string) => {
    try {
      console.log('Creating new game for case:', caseId);
      
      // Prepare request body
      const requestBody: { case_id: string; old_game_id?: string } = {
        case_id: caseId!
      };
      
      // Include old_game_id for cleanup if provided
      if (oldGameId) {
        requestBody.old_game_id = oldGameId;
        console.log('Cleaning up old game:', oldGameId);
      }
      
      const response = await fetch(buildApiUrl('/api/games/start'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
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

      // Save new session to localStorage
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
    const sessionKey = `game_session_${caseId}`;
    const oldGameId = localStorage.getItem(sessionKey);
    
    // Remove old session from localStorage
    localStorage.removeItem(sessionKey);
    setShowModal(false);
    
    // Start new game and pass old_game_id for server-side cleanup
    handleNewGame(oldGameId || undefined);
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
