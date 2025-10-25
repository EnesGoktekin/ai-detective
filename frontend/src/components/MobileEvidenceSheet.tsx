import { Modal } from './Modal';
import { SuspectsList } from './SuspectsList';
import { EvidenceList } from './EvidenceList';

interface MobileEvidenceSheetProps {
  isOpen: boolean;
  onClose: () => void;
  caseId?: string;
  gameId?: string;
  onEvidenceUpdate?: (unlockedCount: number, totalCount: number) => void;
}

/**
 * Mobile-only sheet/modal for viewing Evidence & Suspects
 * Shows on small screens when user taps "Evidence" button in header
 */
export const MobileEvidenceSheet: React.FC<MobileEvidenceSheetProps> = ({
  isOpen,
  onClose,
  caseId,
  gameId,
  onEvidenceUpdate,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <div className="flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-dark-border">
          <h2 className="text-xl font-bold text-gold-500">Investigation Info</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gold-500 text-2xl leading-none p-2"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto space-y-6 -mx-2 px-2">
          {/* Suspects Section */}
          {caseId && (
            <div>
              <SuspectsList caseId={caseId} />
            </div>
          )}

          {/* Evidence Section */}
          {gameId && (
            <div>
              <h3 className="text-lg font-bold text-gold-500 mb-3">Evidence Collected</h3>
              <EvidenceList 
                gameId={gameId} 
                onEvidenceUpdate={onEvidenceUpdate}
              />
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
