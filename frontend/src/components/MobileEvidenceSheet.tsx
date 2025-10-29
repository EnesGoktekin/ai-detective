import { Modal } from './Modal';
import { SuspectsList } from './SuspectsList';
import { EvidenceList } from './EvidenceList';
import { Button } from './Button';

interface MobileEvidenceSheetProps {
  isOpen: boolean;
  onClose: () => void;
  caseId?: string;
  gameId?: string;
  caseTitle?: string;
  onEvidenceUpdate?: (unlockedCount: number, totalCount: number) => void;
  onMakeAccusation?: () => void;
  canAccuse?: boolean;
  disableBackdrop?: boolean;
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
  caseTitle,
  onEvidenceUpdate,
  onMakeAccusation,
  canAccuse = false,
  disableBackdrop = false,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" disableBackdrop={disableBackdrop}>
      <div className="flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-dark-border">
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gold-500">Investigation Info</h2>
            {caseTitle && gameId && (
              <div className="mt-1">
                <p className="text-sm font-semibold text-gray-300">{caseTitle}</p>
                <p className="text-xs text-gray-500">ID: {gameId.slice(0, 8)}...</p>
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="close-modal-button text-gray-400 hover:text-gold-500 text-2xl leading-none p-2"
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

        {/* Make Accusation Button - Bottom */}
        {onMakeAccusation && (
          <div className="mt-4 pt-4 border-t border-dark-border">
            <Button
              id="make-accusation-button-modal"
              variant="primary"
              size="lg"
              fullWidth
              onClick={() => {
                onMakeAccusation();
                onClose();
              }}
              disabled={!canAccuse}
            >
              Make Accusation
            </Button>
            {!canAccuse && (
              <p className="text-xs text-gray-500 text-center mt-2">
                Collect all required evidence to make an accusation
              </p>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};
