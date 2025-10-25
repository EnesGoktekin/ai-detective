import React, { useState, useEffect } from 'react';
import { Card } from './Card';
import { Modal } from './Modal';
import { buildApiUrl } from '@/config/api';

interface Suspect {
  suspect_id: string;
  name: string;
  role: string;
  backstory: string;
}

interface SuspectsListProps {
  caseId: string;
}

export const SuspectsList: React.FC<SuspectsListProps> = ({ caseId }) => {
  const [suspects, setSuspects] = useState<Suspect[]>([]);
  const [selectedSuspect, setSelectedSuspect] = useState<Suspect | null>(null);
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
      <div className="mb-4">
        <h2 className="text-xl font-bold text-gold-500 mb-3">Suspects</h2>
        <div className="space-y-2">
          {suspects.map((suspect) => (
            <Card
              key={suspect.suspect_id}
              onClick={() => setSelectedSuspect(suspect)}
              className="cursor-pointer hover:border-gold-500 transition-colors p-3"
            >
              <div className="flex items-start gap-2">
                <div className="text-xl">👤</div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-gold-400 mb-0.5">
                    {suspect.name}
                  </h3>
                  <p className="text-xs text-gray-500 truncate">{suspect.role}</p>
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
          title={selectedSuspect.name}
          size="md"
        >
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-semibold text-gold-500 mb-1">Role</h4>
              <p className="text-gray-300">{selectedSuspect.role}</p>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gold-500 mb-1">Backstory</h4>
              <p className="text-gray-300 whitespace-pre-wrap">{selectedSuspect.backstory}</p>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
};
