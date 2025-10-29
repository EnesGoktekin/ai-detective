import React, { useState, useEffect } from 'react';
import { Card } from './Card';
import { Modal } from './Modal';
import { buildApiUrl } from '@/config/api';

interface Suspect {
  suspect_id: string;
  name: string;
  backstory: string;
  profile_image_url?: string;
}

interface SuspectsListProps {
  caseId: string;
}

export const SuspectsList: React.FC<SuspectsListProps> = ({ caseId }) => {
  const [suspects, setSuspects] = useState<Suspect[]>([]);
  const [selectedSuspect, setSelectedSuspect] = useState<Suspect | null>(null);
  const [isBackstoryVisible, setIsBackstoryVisible] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSuspects = async () => {
      try {
        setLoading(true);
        const response = await fetch(buildApiUrl(`/api/cases/${caseId}`));
        if (!response.ok) throw new Error('Failed to fetch case');
        
        const data = await response.json();
        setSuspects(data.suspects || []);
      } catch (err) {
        console.error('Error fetching suspects:', err);
      } finally {
        setLoading(false);
      }
    };

    if (caseId) {
      fetchSuspects();
    }
  }, [caseId]);

  if (loading) {
    return (
      <Card className="text-center py-4">
        <div className="animate-pulse">
          <p className="text-gray-400 text-sm">Loading suspects...</p>
        </div>
      </Card>
    );
  }

  if (suspects.length === 0) {
    return null;
  }

  return (
    <>
      <div id="suspects-list" className="mb-4">
        <h2 className="text-xl font-bold text-gold-500 mb-3">Suspects</h2>
        <div className="space-y-2">
          {suspects.map((suspect) => (
            <Card
              key={suspect.suspect_id}
              onClick={() => {
                setSelectedSuspect(suspect);
                setIsBackstoryVisible(true); // Reset to visible when opening new suspect
              }}
              className="cursor-pointer hover:border-gold-500 transition-colors p-3"
            >
              <div className="flex items-start gap-3">
                {/* Circular Profile Image */}
                {suspect.profile_image_url ? (
                  <img
                    src={suspect.profile_image_url}
                    alt={suspect.name}
                    className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                    onError={(e) => {
                      // Fallback to emoji if image fails to load
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                ) : null}
                {/* Fallback emoji (hidden if image exists) */}
                <div className={`text-xl flex-shrink-0 ${suspect.profile_image_url ? 'hidden' : ''}`}>
                  👤
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-gold-400 mb-0.5">
                    {suspect.name}
                  </h3>
                  <p className="text-xs text-gray-500 truncate">Suspect</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {selectedSuspect && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedSuspect(null)}
          title=""
          size="lg"
        >
          {/* Clear Background Container - NO BLUR OR DARK OVERLAY */}
          <div 
            className="relative min-h-[600px] -m-6 rounded-lg overflow-hidden"
            style={{
              backgroundImage: selectedSuspect.profile_image_url 
                ? `url(${selectedSuspect.profile_image_url})` 
                : 'none',
              backgroundSize: 'cover',
              backgroundPosition: 'center center',
            }}
          >
            {/* Close button - Top right */}
            <button
              onClick={() => setSelectedSuspect(null)}
              className="absolute top-6 right-6 z-20 text-white/90 hover:text-gold-400 transition-colors drop-shadow-lg"
              aria-label="Close"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Show Backstory Button - Bottom center when hidden */}
            {!isBackstoryVisible && (
              <button
                onClick={() => setIsBackstoryVisible(true)}
                className="absolute bottom-5 left-1/2 -translate-x-1/2 z-30 bg-transparent border-none text-white/60 hover:text-white transition-all duration-300 p-0"
                style={{
                  textShadow: '0 0 10px rgba(255, 255, 255, 0.6), 0 0 20px rgba(255, 255, 255, 0.3)',
                }}
                aria-label="Show backstory"
              >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 15l-7 7-7-7" />
                </svg>
              </button>
            )}

            {/* Backstory Container - Animated with toggle */}
            <div 
              className={`absolute bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-3rem)] max-w-xl transition-all duration-300 ease-out ${
                isBackstoryVisible ? 'translate-y-0 opacity-100' : 'translate-y-[100vh] opacity-0 pointer-events-none'
              }`}
            >
              {/* Toggle Button - Straddling the top edge of blur box */}
              <button
                onClick={() => setIsBackstoryVisible(!isBackstoryVisible)}
                className="absolute left-1/2 top-0 z-10 bg-transparent border-none text-white p-0"
                style={{
                  transform: 'translateX(-50%) translateY(calc(-50% - 16px))',
                  textShadow: '0 0 10px rgba(255, 255, 255, 0.8), 0 0 20px rgba(255, 255, 255, 0.5)',
                }}
                aria-label="Hide backstory"
              >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7-7-7 7" />
                </svg>
              </button>

              <div 
                className="rounded-lg p-4"
                style={{
                  backgroundColor: 'rgba(0, 0, 0, 0.4)',
                  backdropFilter: 'blur(4px)',
                  WebkitBackdropFilter: 'blur(4px)',
                }}
              >
                {/* Name as Heading (replaces "Backstory") */}
                <h4 className="text-lg font-semibold text-gold-400 mb-3 drop-shadow-md">
                  {selectedSuspect.name}
                </h4>
                
                {/* Backstory Text - Scrollable with smaller font */}
                <div className="max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                  <p className="text-gray-50 whitespace-pre-wrap leading-relaxed text-sm">
                    {selectedSuspect.backstory}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
};
