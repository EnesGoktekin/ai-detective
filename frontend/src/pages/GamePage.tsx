import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Loading } from '../components/Loading';
import { HowToPlayModal } from '../components/HowToPlayModal';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { MobileEvidenceSheet } from '../components/MobileEvidenceSheet';
import { ChatInterface } from '../components/ChatInterface';
import { ChatInput } from '../components/ChatInput';
import { EvidenceList } from '../components/EvidenceList';
import { SuspectsList } from '../components/SuspectsList';
import { GameTour } from '../components/GameTour';
import { MobileGameTour } from '../components/MobileGameTour';
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
  const [showMobileEvidence, setShowMobileEvidence] = useState(false);
  const [showTour, setShowTour] = useState(false);
  const [showMobileTour, setShowMobileTour] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [canAccuse, setCanAccuse] = useState(false);
  const [detectiveProfileUrl, setDetectiveProfileUrl] = useState<string | null>(null);

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

  // Fetch Detective X profile image from case API
  useEffect(() => {
    if (!gameData?.case_id) return;

    const fetchDetectiveProfile = async () => {
      try {
        const response = await fetch(buildApiUrl(`/api/cases/${gameData.case_id}`));
        if (response.ok) {
          const data = await response.json();
          if (data.detective_x_profile_url) {
            setDetectiveProfileUrl(data.detective_x_profile_url);
          }
        }
      } catch (err) {
        console.error('Failed to fetch detective profile:', err);
      }
    };

    fetchDetectiveProfile();
  }, [gameData?.case_id]);

  // Device detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Check if user has completed the tour (device-specific)
  useEffect(() => {
    if (!loading && gameData) {
      if (isMobile) {
        // Mobile tour
        const hasCompletedMobileTour = localStorage.getItem('hasCompletedMobileGameTour');
        if (!hasCompletedMobileTour) {
          setTimeout(() => setShowMobileTour(true), 500);
        }
      } else {
        // Desktop tour
        const hasCompletedTour = localStorage.getItem('hasCompletedGameTour');
        if (!hasCompletedTour) {
          setTimeout(() => setShowTour(true), 500);
        }
      }
    }
  }, [loading, gameData, isMobile]);

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
      const response = await fetch(buildApiUrl(`/api/games/${gameId}/chat`), {
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
    <div className="min-h-screen max-h-screen bg-dark-bg flex flex-col md:flex-row overflow-hidden">
      {/* Main Content - Full height, no global header */}
      {/* Chat Area - Main section (70% width on desktop) */}
      <main className="flex-1 flex flex-col min-h-0 md:w-[70%]">
        <ChatInterface 
          messages={messages}
          loading={messagesLoading}
          error={error}
          onExit={() => setShowExitConfirm(true)}
          onOpenInvestigation={() => setShowMobileEvidence(true)}
          detectiveProfileUrl={detectiveProfileUrl}
          onHowToPlay={() => isMobile ? setShowMobileTour(true) : setShowTour(true)}
        />

        {/* Chat Input Area - WhatsApp style (no extra padding/border) */}
        <ChatInput 
          onSendMessage={handleSendMessage}
          disabled={!gameData || gameData.status === 'completed'}
          loading={messagesLoading}
        />
      </main>

      {/* Right Panel - Tablet & Desktop (30% width, hidden on mobile) */}
      <aside className="hidden md:flex md:flex-col md:w-[30%] border-l border-dark-border bg-dark-surface">
        <div className="p-3 md:p-4 lg:p-5 space-y-4 md:space-y-6 overflow-y-auto">
          {/* Case Title & ID - Desktop Only */}
          <div className="border-b border-dark-border pb-4">
            <h1 className="text-xl lg:text-2xl font-bold text-gold-500 mb-1">{gameData?.case_title}</h1>
            <p className="text-sm text-gray-400">ID: {gameData?.game_id?.slice(0, 8)}...</p>
          </div>
          
          {/* Action Buttons - Desktop Only */}
          <div className="flex gap-2">
            <Button 
              variant="secondary" 
              size="sm"
              onClick={() => setShowTour(true)}
              className="flex-1"
            >
              How to Play
            </Button>
            <Button 
              id="make-accusation-button"
              variant="primary" 
              size="sm"
              onClick={handleMakeAccusation}
              disabled={!canAccuse}
              className="flex-1"
            >
              Make Accusation
            </Button>
          </div>
          
          {/* Suspects Section */}
          {gameData?.case_id && (
            <SuspectsList caseId={gameData.case_id} />
          )}

          {/* Evidence Section */}
          <div id="evidence-collected">
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

      {/* How to Play Modal */}
      <HowToPlayModal 
        isOpen={showHowToPlay} 
        onClose={() => setShowHowToPlay(false)} 
      />

      {/* Guided Tour */}
      <GameTour 
        isOpen={showTour} 
        onClose={() => setShowTour(false)} 
      />

      {/* Mobile Guided Tour */}
      <MobileGameTour
        isOpen={showMobileTour}
        onClose={() => setShowMobileTour(false)}
      />

      {/* Mobile Evidence Sheet - Only visible on mobile/tablet */}
      <MobileEvidenceSheet
        isOpen={showMobileEvidence}
        onClose={() => setShowMobileEvidence(false)}
        caseId={gameData?.case_id}
        gameId={gameId}
        caseTitle={gameData?.case_title}
        onEvidenceUpdate={handleEvidenceUpdate}
        onMakeAccusation={handleMakeAccusation}
        canAccuse={canAccuse}
        disableBackdrop={showMobileTour}
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
