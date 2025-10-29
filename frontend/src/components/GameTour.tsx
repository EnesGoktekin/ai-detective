import React, { useState, useEffect, useCallback } from 'react';
import { Button } from './Button';

interface TourStep {
  id: number;
  target: string;
  title: string;
  description: string;
  position: 'top' | 'bottom' | 'left' | 'right';
}

const TOUR_STEPS: TourStep[] = [
  {
    id: 1,
    target: '#suspects-list',
    title: 'The Suspects',
    description: 'These are the persons of interest in the case. As you gather evidence, you will narrow this list down.',
    position: 'left' // Right side element -> tooltip on left
  },
  {
    id: 2,
    target: '#evidence-collected',
    title: 'Evidence Collected',
    description: 'All clues, logs, and information you acquire will be cataloged here. Use this to form your theory.',
    position: 'left' // Right side element -> tooltip on left
  },
  {
    id: 3,
    target: '.chat-input-area',
    title: 'Communicate with AI',
    description: 'Type your questions, observations, and commands here. The Detective AI will respond based on the data it has.',
    position: 'top' // Bottom element -> tooltip above
  },
  {
    id: 4,
    target: '#send-button',
    title: 'Send Command',
    description: 'Send your message to the Detective AI. Be concise and precise to get the best results.',
    position: 'top' // Bottom element -> tooltip above
  },
  {
    id: 5,
    target: '#make-accusation-button',
    title: 'Make Accusation',
    description: 'When you are certain you know the culprit, click here. Be warned: a false accusation ends the game!',
    position: 'bottom' // Top right element -> tooltip below
  }
];

interface GameTourProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GameTour: React.FC<GameTourProps> = ({ isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const [originalZIndex, setOriginalZIndex] = useState<string>('');

  const completeTour = useCallback(() => {
    // Restore original z-index
    if (targetElement && originalZIndex !== null) {
      targetElement.style.zIndex = originalZIndex;
    }
    localStorage.setItem('hasCompletedGameTour', 'true');
    onClose();
  }, [onClose, targetElement, originalZIndex]);

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeTour();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    completeTour();
  };

  const handleEscape = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape' && isOpen) {
      completeTour();
    }
  }, [isOpen, completeTour]);

  useEffect(() => {
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [handleEscape]);

  useEffect(() => {
    if (!isOpen) return;

    const step = TOUR_STEPS[currentStep];
    const element = document.querySelector(step.target) as HTMLElement;
    
    if (element) {
      // Restore previous element's z-index
      if (targetElement && originalZIndex !== null) {
        targetElement.style.zIndex = originalZIndex;
        targetElement.style.position = '';
        targetElement.style.background = '';
      }

      // Save and modify current element's z-index
      const currentZIndex = window.getComputedStyle(element).zIndex;
      setOriginalZIndex(currentZIndex);
      
      // Ensure element has position context
      const currentPosition = window.getComputedStyle(element).position;
      if (currentPosition === 'static') {
        element.style.position = 'relative';
      }
      
      // Lift element above overlay
      element.style.zIndex = '1001';
      
      // Make element bright (not darkened)
      element.style.background = window.getComputedStyle(element).background || 'inherit';
      
      setTargetElement(element);
      
      // Scroll element into view
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      
      // Wait for scroll to complete and layout to stabilize before calculating position
      const positionTimeout = setTimeout(() => {
        // Calculate tooltip position with 20px margin
        const rect = element.getBoundingClientRect();
        const tooltipWidth = 320;
        const tooltipHeight = 250; // Increased for Back button
        const margin = 20;

        let top = 0;
        let left = 0;

        switch (step.position) {
          case 'top':
            // Tooltip above element - increased margin to 30px for better separation
            top = rect.top - tooltipHeight - 50;
            left = rect.left + (rect.width / 2) - (tooltipWidth / 2);
            break;
          case 'bottom':
            // Tooltip below element
            top = rect.bottom + margin;
            left = rect.left + (rect.width / 2) - (tooltipWidth / 2);
            break;
          case 'left':
            // Tooltip to the left of element
            top = rect.top + (rect.height / 2) - (tooltipHeight / 2);
            left = rect.left - tooltipWidth - margin;
            break;
          case 'right':
            // Tooltip to the right of element
            top = rect.top + (rect.height / 2) - (tooltipHeight / 2);
            left = rect.right + margin;
            break;
        }

        // Ensure tooltip stays within viewport
        const maxLeft = window.innerWidth - tooltipWidth - 20;
        const maxTop = window.innerHeight - tooltipHeight - 20;
        
        left = Math.max(20, Math.min(left, maxLeft));
        top = Math.max(20, Math.min(top, maxTop));

        setTooltipPosition({ top, left });
      }, 300); // 300ms delay for scroll and layout stabilization

      return () => clearTimeout(positionTimeout);
    }
  }, [isOpen, currentStep, targetElement, originalZIndex]);

  if (!isOpen) return null;

  const step = TOUR_STEPS[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === TOUR_STEPS.length - 1;

  return (
    <>
      {/* Dark Overlay */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-70 transition-opacity duration-200"
        style={{ zIndex: 1000 }}
        onClick={handleSkip}
      />

      {/* Spotlight Effect on Target Element */}
      {targetElement && (
        <>
          <div
            className="fixed pointer-events-none transition-all duration-200"
            style={{
              zIndex: 1002,
              top: targetElement.getBoundingClientRect().top - 6,
              left: targetElement.getBoundingClientRect().left - 6,
              width: targetElement.getBoundingClientRect().width + 12,
              height: targetElement.getBoundingClientRect().height + 12,
              border: '4px solid rgba(234, 179, 8, 1)',
              boxShadow: '0 0 30px 10px rgba(234, 179, 8, 0.6), inset 0 0 20px rgba(234, 179, 8, 0.3)',
              borderRadius: '8px',
              animation: 'pulseGlow 2s ease-in-out infinite',
            }}
          />
          <style>
            {`
              @keyframes pulseGlow {
                0%, 100% { 
                  box-shadow: 0 0 30px 10px rgba(234, 179, 8, 0.6), inset 0 0 20px rgba(234, 179, 8, 0.3);
                  border-color: rgba(234, 179, 8, 1);
                }
                50% { 
                  box-shadow: 0 0 50px 20px rgba(234, 179, 8, 0.9), inset 0 0 30px rgba(234, 179, 8, 0.5);
                  border-color: rgba(234, 179, 8, 1);
                }
              }
            `}
          </style>
        </>
      )}

      {/* Tooltip */}
      <div
        className="fixed bg-dark-surface border-2 border-gold-500 rounded-lg shadow-2xl p-6 transition-all duration-200"
        style={{
          zIndex: 1003,
          top: tooltipPosition.top,
          left: tooltipPosition.left,
          width: '320px',
          maxWidth: 'calc(100vw - 40px)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Step Counter */}
        <div className="text-xs text-gold-500 font-semibold mb-2">
          Step {step.id} of {TOUR_STEPS.length}
        </div>

        {/* Title */}
        <h3 className="text-xl font-bold text-gold-500 mb-3">
          {step.title}
        </h3>

        {/* Description */}
        <p className="text-sm text-gray-300 mb-6 leading-relaxed">
          {step.description}
        </p>

        {/* Navigation Buttons */}
        <div className="flex gap-2">
          {isFirstStep ? (
            // Step 1: Start Tour + Skip
            <>
              <Button
                onClick={handleNext}
                variant="primary"
                size="sm"
                fullWidth
              >
                Start Tour
              </Button>
              <Button
                onClick={handleSkip}
                variant="ghost"
                size="sm"
                className="whitespace-nowrap"
              >
                Skip
              </Button>
            </>
          ) : isLastStep ? (
            // Step 5: Back + Finish + Skip
            <>
              <Button
                onClick={handleBack}
                variant="ghost"
                size="sm"
                className="whitespace-nowrap"
              >
                Back
              </Button>
              <Button
                onClick={completeTour}
                variant="primary"
                size="sm"
                fullWidth
              >
                Finish
              </Button>
              <Button
                onClick={handleSkip}
                variant="ghost"
                size="sm"
                className="whitespace-nowrap"
              >
                Skip
              </Button>
            </>
          ) : (
            // Steps 2-4: Back + Continue + Skip Tour
            <>
              <Button
                onClick={handleBack}
                variant="ghost"
                size="sm"
                className="whitespace-nowrap"
              >
                Back
              </Button>
              <Button
                onClick={handleNext}
                variant="primary"
                size="sm"
                fullWidth
              >
                Continue
              </Button>
              <Button
                onClick={handleSkip}
                variant="ghost"
                size="sm"
                className="whitespace-nowrap"
              >
                Skip Tour
              </Button>
            </>
          )}
        </div>

        {/* ESC hint */}
        <div className="text-xs text-gray-500 text-center mt-3">
          Press ESC to skip
        </div>
      </div>
    </>
  );
};
