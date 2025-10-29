import React, { useState } from 'react';
import { Card } from './Card';
import { Modal } from './Modal';
import { buildApiUrl } from '@/config/api';

interface Evidence {
  evidence_id: string;
  name: string;
  description: string;
  significance: string;
  object_name?: string;
  unlocked_at: string;
}

interface EvidenceItemProps {
  evidence: Evidence;
}

const EvidenceItem: React.FC<EvidenceItemProps> = ({ evidence }) => {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <>
      <Card 
        onClick={() => setShowDetails(true)}
        className="mb-3 cursor-pointer hover:border-gold-500 transition-colors"
      >
        <div className="flex items-start gap-3">
          <div className="text-2xl">🔍</div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-gold-500 mb-1 truncate">
              {evidence.name}
            </h3>
            {evidence.object_name && (
              <p className="text-xs text-gray-400 mb-1">
                Found in: {evidence.object_name}
              </p>
            )}
            <p className="text-xs text-gray-500 line-clamp-2">
              {evidence.description}
            </p>
          </div>
        </div>
      </Card>

      {/* Evidence Details Modal */}
      <Modal
        isOpen={showDetails}
        onClose={() => setShowDetails(false)}
        title={evidence.name}
        size="md"
      >
        <div className="space-y-4">
          {evidence.object_name && (
            <div>
              <h4 className="text-xs font-semibold text-gold-500 uppercase mb-1">
                Location
              </h4>
              <p className="text-sm text-gray-300">{evidence.object_name}</p>
            </div>
          )}

          <div>
            <h4 className="text-xs font-semibold text-gold-500 uppercase mb-1">
              Description
            </h4>
            <p className="text-sm text-gray-300 leading-relaxed">
              {evidence.description}
            </p>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-gold-500 uppercase mb-1">
              Significance
            </h4>
            <p className="text-sm text-gray-300 leading-relaxed">
              {evidence.significance}
            </p>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-gold-500 uppercase mb-1">
              Discovered
            </h4>
            <p className="text-sm text-gray-400">
              {new Date(evidence.unlocked_at).toLocaleString()}
            </p>
          </div>
        </div>
      </Modal>
    </>
  );
};

interface EvidenceListProps {
  gameId: string;
  onEvidenceUpdate?: (unlockedCount: number, totalCount: number) => void;
}

export const EvidenceList: React.FC<EvidenceListProps> = ({ 
  gameId,
  onEvidenceUpdate 
}) => {
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [stats, setStats] = useState<{ 
    unlocked: number; 
    total: number; 
    required: number;
    requiredUnlocked: number;
    canAccuse: boolean;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  React.useEffect(() => {
    const fetchEvidence = async () => {
      try {
        setError(null);

        // Fetch unlocked evidence
        const evidenceResponse = await fetch(buildApiUrl(`/api/evidence/game/${gameId}/unlocked`));
        if (!evidenceResponse.ok) {
          throw new Error('Failed to fetch evidence');
        }
        const evidenceData = await evidenceResponse.json();
        
        // Transform backend response to match frontend interface
        const newEvidence = (evidenceData.unlocked_evidence || []).map((item: any) => ({
          evidence_id: item.evidence_id,
          name: item.evidence_lookup?.display_name || 'Unknown Evidence',
          description: item.evidence_lookup?.description || 'No description available',
          significance: item.evidence_lookup?.is_required_for_accusation ? 'Required for accusation' : 'Optional',
          unlocked_at: item.unlocked_at,
        }));
        
        // Only update if evidence count changed
        if (newEvidence.length !== evidence.length) {
          setEvidence(newEvidence);
        }

        // Fetch evidence stats
        const statsResponse = await fetch(buildApiUrl(`/api/evidence/game/${gameId}/stats`));
        if (!statsResponse.ok) {
          throw new Error('Failed to fetch stats');
        }
        const statsData = await statsResponse.json();
        const newStats = {
          unlocked: statsData.stats?.unlocked_count || 0,
          total: statsData.stats?.total_evidence || 0,
          required: statsData.stats?.required_count || 0,
          requiredUnlocked: statsData.stats?.required_unlocked || 0,
          canAccuse: statsData.stats?.can_make_accusation || false,
        };
        
        // Only update stats if changed
        if (!stats || 
            stats.unlocked !== newStats.unlocked || 
            stats.total !== newStats.total || 
            stats.required !== newStats.required ||
            stats.canAccuse !== newStats.canAccuse) {
          setStats(newStats);
          
          // Notify parent component only when stats change
          if (onEvidenceUpdate) {
            onEvidenceUpdate(newStats.unlocked, newStats.required);
          }
        }
        
        // Mark initial load as complete
        if (isInitialLoad) {
          setIsInitialLoad(false);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load evidence');
        if (isInitialLoad) {
          setIsInitialLoad(false);
        }
      }
    };

    fetchEvidence();

    // Poll for updates every 5 seconds (increased from 3)
    const interval = setInterval(fetchEvidence, 5000);
    return () => clearInterval(interval);
  }, [gameId]);

  // Show loading only on very first load
  if (isInitialLoad && !stats) {
    return (
      <Card className="text-center py-8">
        <div className="animate-pulse">
          <div className="text-gold-500 text-2xl mb-2">🔍</div>
          <p className="text-gray-400 text-sm">Loading evidence...</p>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="text-center py-8 border-red-500/30 bg-red-500/5">
        <p className="text-red-400 text-sm">{error}</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Evidence List */}
      {evidence.length === 0 ? (
        <Card className="text-center py-8">
          <div className="text-gray-500 text-3xl mb-3">🔒</div>
          <p className="text-gray-400 text-sm mb-1">
            No evidence collected yet
          </p>
          <p className="text-gray-500 text-xs">
            Ask questions to unlock clues
          </p>
        </Card>
      ) : (
        <div className="space-y-0 max-h-96 overflow-y-auto evidence-scroll pr-1">
          {evidence.map((item) => (
            <EvidenceItem key={item.evidence_id} evidence={item} />
          ))}
        </div>
      )}
    </div>
  );
};
