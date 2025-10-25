import { Modal } from '@/components';

interface HowToPlayModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * How to Play Modal - Explains game mechanics and instructions
 */
export const HowToPlayModal: React.FC<HowToPlayModalProps> = ({ isOpen, onClose }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" title="How to Play">
      <div className="space-y-6 text-gray-300">
        {/* Introduction */}
        <div>
          <h3 className="text-xl font-semibold text-gold-500 mb-2">Welcome, Detective</h3>
          <p>
            You are a detective working with your partner who is at the crime scene. 
            Solve the mystery by chatting with them naturally, just like texting a colleague.
          </p>
        </div>

        {/* How It Works */}
        <div>
          <h3 className="text-xl font-semibold text-gold-500 mb-2">How It Works</h3>
          <ul className="space-y-2 list-disc list-inside">
            <li>Ask your partner questions about the crime scene</li>
            <li>Request them to examine objects, interview suspects, or gather evidence</li>
            <li>Evidence will be automatically unlocked as you discover it</li>
            <li>Once you find all required evidence, you can make an accusation</li>
          </ul>
        </div>

        {/* Tips */}
        <div>
          <h3 className="text-xl font-semibold text-gold-500 mb-2">Tips</h3>
          <ul className="space-y-2 list-disc list-inside">
            <li>Be thorough - examine everything carefully</li>
            <li>Ask follow-up questions to get more details</li>
            <li>Pay attention to inconsistencies in statements</li>
            <li>Think like a detective - every detail matters</li>
          </ul>
        </div>

        {/* Rules */}
        <div>
          <h3 className="text-xl font-semibold text-gold-500 mb-2">Rules</h3>
          <ul className="space-y-2 list-disc list-inside">
            <li>Messages must contain at least 2 alphabetic characters</li>
            <li>5-second cooldown between messages</li>
            <li>You can save and resume your game at any time</li>
            <li>Make an accusation only when you're confident</li>
          </ul>
        </div>

        {/* Call to Action */}
        <div className="pt-4 border-t border-dark-border">
          <p className="text-center text-lg font-medium text-gold-500">
            Good luck, Detective! 🔍
          </p>
        </div>
      </div>
    </Modal>
  );
};
