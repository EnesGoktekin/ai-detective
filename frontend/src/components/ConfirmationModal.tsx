import { Modal } from './Modal';
import { Button } from './Button';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: 'primary' | 'secondary' | 'ghost';
  isDangerous?: boolean;
}

/**
 * Confirmation Modal Component
 * Displays a confirmation dialog for critical actions
 */
export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmVariant = 'primary',
  isDangerous = false,
}) => {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className="space-y-6">
        {/* Icon */}
        <div className="text-center text-5xl">
          {isDangerous ? '⚠️' : '❓'}
        </div>

        {/* Message */}
        <p className="text-gray-300 text-center leading-relaxed">
          {message}
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3">
          <Button
            variant={confirmVariant}
            size="lg"
            fullWidth
            onClick={handleConfirm}
          >
            {confirmText}
          </Button>
          <Button
            variant="ghost"
            size="lg"
            fullWidth
            onClick={onClose}
          >
            {cancelText}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
