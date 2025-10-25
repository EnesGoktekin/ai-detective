import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Loading } from '../components/Loading';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { buildApiUrl } from '@/config/api';

interface Suspect {
  suspect_id: string;
  name: string;
  role: string;
  backstory: string;
}

interface AccusationResult {
  success: boolean;
  correct: boolean;
  accused_suspect: string;
  guilty_suspect: string;
  message: string;
}

export default function AccusationPage() {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const [suspects, setSuspects] = useState<Suspect[]>([]);
  const [selectedSuspect, setSelectedSuspect] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AccusationResult | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);

  useEffect(() => {
    const fetchSuspects = async () => {
      try {
        setLoading(true);
        
        // First get game to get case_id
        const gameResponse = await fetch(buildApiUrl(`/api/games/${gameId}`));
        if (!gameResponse.ok) {
          throw new Error('Game not found');
        }
        const gameData = await gameResponse.json();

        // Then fetch case to get suspects
        const caseResponse = await fetch(buildApiUrl(`/api/cases/${gameData.case_id}`));
        if (!caseResponse.ok) {
          throw new Error('Case not found');
        }
        const caseData = await caseResponse.json();
        
        setSuspects(caseData.suspects || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load suspects');
      } finally {
        setLoading(false);
      }
    };

    if (gameId) {
      fetchSuspects();
    }
  }, [gameId]);

  const handleAccuseClick = () => {
    if (!selectedSuspect) return;
    setShowConfirmation(true);
  };

  const handleConfirmAccusation = async () => {
    if (!selectedSuspect || !gameId) return;

    try {
      setSubmitting(true);
      setError(null);

      const response = await fetch(buildApiUrl(`/api/accusation/${gameId}`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ accused_suspect_id: selectedSuspect }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit accusation');
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit accusation');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <Loading fullScreen />;
  }

  if (error && !result) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center p-3 sm:p-4">
        <Card className="max-w-md w-full text-center">
          <h2 className="text-xl sm:text-2xl font-bold text-red-500 mb-4">Error</h2>
          <p className="text-sm sm:text-base text-gray-300 mb-6">{error}</p>
          <Button onClick={() => navigate(`/game/${gameId}`)} fullWidth>
            Back to Game
          </Button>
        </Card>
      </div>
    );
  }

  // Show result
  if (result) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center p-3 sm:p-4">
        <Card className="max-w-2xl w-full">
          <div className="text-center">
            {/* Result Icon */}
            <div className={`text-4xl sm:text-6xl mb-4 ${result.correct ? 'animate-bounce' : ''}`}>
              {result.correct ? '🎉' : '❌'}
            </div>

            {/* Result Title */}
            <h1 className={`text-2xl sm:text-3xl font-bold mb-4 ${result.correct ? 'text-green-400' : 'text-red-400'}`}>
              {result.correct ? 'Case Solved!' : 'Wrong Suspect'}
            </h1>

            {/* Result Message */}
            <p className="text-gray-300 text-base sm:text-lg mb-6 leading-relaxed">
              {result.message}
            </p>

            {/* Suspect Info */}
            <div className="bg-dark-elevated rounded-lg p-3 sm:p-4 mb-6">
              <div className="grid grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
                <div>
                  <span className="text-gray-500">You accused:</span>
                  <p className="text-gold-500 font-semibold">{result.accused_suspect}</p>
                </div>
                <div>
                  <span className="text-gray-500">Guilty party:</span>
                  <p className="text-green-400 font-semibold">{result.guilty_suspect}</p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                variant="secondary"
                onClick={() => navigate('/')}
                fullWidth
              >
                Main Menu
              </Button>
              <Button 
                variant="primary"
                onClick={() => navigate('/cases')}
                fullWidth
              >
                New Case
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // Show accusation form
  return (
    <div className="min-h-screen bg-dark-bg flex items-center justify-center p-3 sm:p-4">
      <Card className="max-w-4xl w-full">
        <div className="text-center mb-4 sm:mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gold-500 mb-2">
            Make Your Accusation
          </h1>
          <p className="text-sm sm:text-base text-gray-400">
            Choose the suspect you believe is guilty
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
            <p className="text-red-400 text-xs sm:text-sm">{error}</p>
          </div>
        )}

        {/* Suspects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
          {suspects.map((suspect) => (
            <Card
              key={suspect.suspect_id}
              onClick={() => setSelectedSuspect(suspect.suspect_id)}
              className={`cursor-pointer transition-all ${
                selectedSuspect === suspect.suspect_id
                  ? 'border-gold-500 bg-gold-500/10'
                  : 'hover:border-gold-500/50'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${
                    selectedSuspect === suspect.suspect_id
                      ? 'bg-gold-500 text-dark-bg'
                      : 'bg-dark-elevated text-gray-400'
                  }`}>
                    {selectedSuspect === suspect.suspect_id ? '✓' : '👤'}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-gold-500 mb-1">
                    {suspect.name}
                  </h3>
                  <p className="text-sm text-gray-400 mb-2">{suspect.role}</p>
                  <p className="text-sm text-gray-500 line-clamp-3">
                    {suspect.backstory}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            variant="secondary"
            onClick={() => navigate(`/game/${gameId}`)}
            fullWidth
          >
            Back to Investigation
          </Button>
          <Button
            variant="primary"
            onClick={handleAccuseClick}
            disabled={!selectedSuspect || submitting}
            isLoading={submitting}
            fullWidth
          >
            {submitting ? 'Submitting...' : 'Accuse Suspect'}
          </Button>
        </div>

        <p className="text-center text-gray-500 text-xs mt-4">
          ⚠️ Once you make an accusation, the game will end
        </p>

        {/* Accusation Confirmation Modal */}
        <ConfirmationModal
          isOpen={showConfirmation}
          onClose={() => setShowConfirmation(false)}
          onConfirm={handleConfirmAccusation}
          title="Confirm Accusation"
          message={`Are you sure you want to accuse ${suspects.find(s => s.suspect_id === selectedSuspect)?.name}? This will end the game and cannot be undone.`}
          confirmText="Yes, Accuse"
          cancelText="No, Go Back"
          confirmVariant="primary"
          isDangerous={true}
        />
      </Card>
    </div>
  );
}
