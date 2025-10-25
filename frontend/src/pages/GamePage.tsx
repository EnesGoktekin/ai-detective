import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Loading } from '../components/Loading';
import { HowToPlayModal } from '../components/HowToPlayModal';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { ChatInterface } from '../components/ChatInterface';
import { ChatInput } from '../components/ChatInput';
import { EvidenceList } from '../components/EvidenceList';
import { SuspectsList } from '../components/SuspectsList';
import { buildApiUrl } from '@/config/api';

interface GameData {
  game_id: string;
  case_id: string;
  case_title: string;
  status: string;
  created_at: string;
}

interface Message {
  message_id: string;
  game_id: string;
  sender: 'user' | 'ai';
  content: string;
  sequence_number: number;
  created_at: string;
}

export default function GamePage() {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const [gameData, setGameData] = useState<GameData | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [canAccuse, setCanAccuse] = useState(false);

  useEffect(() => {
    if (!gameId) {
      navigate('/');
      return;
    }

    // Fetch game data and messages
    const fetchGameData = async () => {
      try {
        setLoading(true);
        const response = await fetch(buildApiUrl(`/api/games/${gameId}`));
        
        if (!response.ok) {
          throw new Error('Game not found');
        }

        const data = await response.json();
        // API returns { success: true, game: {...}, messages: [...] }
        setGameData(data.game || data);

        // Use messages from the game data response if available
        if (data.messages) {
          setMessages(data.messages);
        } else {
          // Fetch message history separately if not included
          const messagesResponse = await fetch(buildApiUrl(`/api/messages/${gameId}`));
          if (messagesResponse.ok) {
            const messagesData = await messagesResponse.json();
            setMessages(messagesData.messages || []);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load game');
      } finally {
        setLoading(false);
      }
    };

    fetchGameData();
  }, [gameId, navigate]);

  const handleMakeAccusation = () => {
    // Navigate to accusation page (to be implemented in Phase 6.13)
    navigate(`/game/${gameId}/accuse`);
  };

  const handleSendMessage = async (message: string) => {
    if (!gameId) return;

    // Immediately add user message to UI
    const userMessage: Message = {
      message_id: `user-${Date.now()}`,
      game_id: gameId,
      sender: 'user' as const,
      content: message,
      sequence_number: messages.length + 1,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);

    try {
      setMessagesLoading(true);
      setError(null);

      // Send message to backend
      const response = await fetch(buildApiUrl(`/api/chat/${gameId}/chat`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();

      // Add only AI response to messages
      const aiMessage: Message = {
        message_id: data.message_id || `ai-${Date.now()}`,
        game_id: gameId,
        sender: 'ai' as const,
        content: data.ai_response || data.response || 'No response',
        sequence_number: messages.length + 2,
        created_at: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
      // Remove user message if sending failed
      setMessages((prev) => prev.filter(m => m.message_id !== userMessage.message_id));
    } finally {
      setMessagesLoading(false);
    }
  };

  const handleEvidenceUpdate = (unlockedCount: number, requiredCount: number) => {
    // Enable accusation only if all REQUIRED evidence is unlocked
    // unlockedCount = how many evidence collected
    // requiredCount = how many are required for accusation
    setCanAccuse(unlockedCount >= requiredCount && requiredCount > 0);
  };

  if (loading) {
    return <Loading fullScreen />;
  }

  if (error || !gameData) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <h2 className="text-2xl font-bold text-red-500 mb-4">Error</h2>
          <p className="text-gray-300 mb-6">{error || 'Game not found'}</p>
          <Button onClick={() => navigate('/')} fullWidth>
            Return to Main Menu
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen max-h-screen bg-dark-bg flex flex-col overflow-hidden">
      {/* Header */}
      <header className="bg-dark-surface border-b border-dark-border px-4 py-3 flex items-center justify-between">
        <div className="flex-1 flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setShowExitConfirm(true)}
            className="text-gray-400 hover:text-gold-500"
          >
            ← Exit
          </Button>
          <div>
            <h1 className="text-xl font-bold text-gold-500">{gameData?.case_title}</h1>
            <p className="text-sm text-gray-400">Game ID: {gameData?.game_id?.slice(0, 8)}...</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="secondary" 
            size="sm"
            onClick={() => setShowHowToPlay(true)}
          >
            How to Play
          </Button>
          <Button 
            variant="primary" 
            size="sm"
            onClick={handleMakeAccusation}
            disabled={!canAccuse}
          >
            Make Accusation
          </Button>
        </div>
      </header>

      {/* Main Content - Responsive Layout */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Chat Area - Main section */}
        <main className="flex-1 flex flex-col min-h-0">
          <ChatInterface 
            messages={messages}
            loading={messagesLoading}
            error={error}
          />

          {/* Chat Input Area */}
          <div className="border-t border-dark-border p-4 bg-dark-surface">
            <div className="max-w-4xl mx-auto">
              <ChatInput 
                onSendMessage={handleSendMessage}
                disabled={!gameData || gameData.status === 'completed'}
                loading={messagesLoading}
              />
            </div>
          </div>
        </main>

        {/* Evidence Sidebar */}
        <aside className="w-full lg:w-80 border-t lg:border-t-0 lg:border-l border-dark-border bg-dark-surface overflow-y-auto evidence-scroll">
          <div className="p-4 space-y-6">
            {/* Suspects Section */}
            {gameData?.case_id && (
              <SuspectsList caseId={gameData.case_id} />
            )}

            {/* Evidence Section */}
            <div>
              <h2 className="text-xl font-bold text-gold-500 mb-3">Evidence Collected</h2>
              {gameId && (
                <EvidenceList 
                  gameId={gameId} 
                  onEvidenceUpdate={handleEvidenceUpdate}
                />
              )}
            </div>
          </div>
        </aside>
      </div>

      {/* How to Play Modal */}
      <HowToPlayModal 
        isOpen={showHowToPlay} 
        onClose={() => setShowHowToPlay(false)} 
      />

      {/* Exit Game Confirmation */}
      <ConfirmationModal
        isOpen={showExitConfirm}
        onClose={() => setShowExitConfirm(false)}
        onConfirm={() => navigate('/')}
        title="Exit Game"
        message="Are you sure you want to exit? Your progress will be saved and you can resume later."
        confirmText="Exit Game"
        cancelText="Stay"
        confirmVariant="secondary"
      />
    </div>
  );
}
