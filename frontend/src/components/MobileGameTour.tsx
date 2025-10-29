import React, { useState, useEffect, useCallback } from 'react';
import { Button } from './Button';

interface TourStep {
  id: number;
  target: string;
  title: string;
  description: string;
  position: 'top' | 'bottom' | 'left' | 'right';
  location: 'main' | 'modal';
  action?: 'click' | 'scroll';
}

const MOBILE_TOUR_STEPS: TourStep[] = [
  {
    id: 1,
    target: '.investigation-info-button',
    title: 'Case Info Panel',
    description: 'This button opens the \'Investigation Info\' panel, where you can view all Suspects, collected Evidence, and access the final \'Make Accusation\' button.',
    position: 'left',
    location: 'main'
  },
  {
    id: 2,
    target: '.chat-input-area',
    title: 'Communicate with AI',
    description: 'Type your questions, observations, and commands here to interact with the Detective AI and unlock new evidence. Click the Send button to submit your message.',
    position: 'top',
    location: 'main'
  }
];

interface MobileGameTourProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileGameTour: React.FC<MobileGameTourProps> = ({ 
  isOpen, 
  onClose
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const [originalZIndex, setOriginalZIndex] = useState<string>('');

  const completeTour = useCallback(() => {
    // Restore original z-index and remove spotlight class
    if (targetElement && originalZIndex !== null) {
      targetElement.style.zIndex = originalZIndex;
      targetElement.style.position = '';
      targetElement.classList.remove('is-spotlighted');
    }
    
    localStorage.setItem('hasCompletedMobileGameTour', 'true');
    onClose();
  }, [onClose, targetElement, originalZIndex]);

  const handleNext = () => {
    if (currentStep < MOBILE_TOUR_STEPS.length - 1) {
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

    const step = MOBILE_TOUR_STEPS[currentStep];
    const element = document.querySelector(step.target) as HTMLElement;
      
    if (element) {
      // Restore previous element's z-index and remove spotlight class
      if (targetElement && originalZIndex !== null) {
        targetElement.style.zIndex = originalZIndex;
        targetElement.style.position = '';
        targetElement.classList.remove('is-spotlighted');
      }

      // Save and modify current element's z-index
      const currentZIndex = window.getComputedStyle(element).zIndex;
      setOriginalZIndex(currentZIndex);
      
      // Ensure element has position context
      const currentPosition = window.getComputedStyle(element).position;
      if (currentPosition === 'static') {
        element.style.position = 'relative';
      }
      
      // Standard z-index for main screen elements
      element.style.zIndex = '1001';
      
      // Add spotlight class for brightness guarantee
      element.classList.add('is-spotlighted');
      
      setTargetElement(element);
      
      // Scroll element into view
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      
      // Wait for scroll to complete and layout to stabilize before calculating position
      const positionTimeout = setTimeout(() => {
        // Calculate tooltip position after scroll completes
        const rect = element.getBoundingClientRect();
        const tooltipWidth = 320;
        const tooltipHeight = 280;
        const margin = 20;

        let top = 0;
        let left = 0;

        switch (step.position) {
          case 'top':
            top = rect.top - tooltipHeight - 60;
            left = rect.left + (rect.width / 2) - (tooltipWidth / 2);
            break;
          case 'bottom':
            top = rect.bottom + margin;
            left = rect.left + (rect.width / 2) - (tooltipWidth / 2);
            break;
          case 'left':
            top = rect.top + (rect.height / 2) - (tooltipHeight / 2);
            left = rect.left - tooltipWidth - margin;
            break;
          case 'right':
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

  const step = MOBILE_TOUR_STEPS[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === MOBILE_TOUR_STEPS.length - 1;

  return (
    <>
      {/* Main overlay with cutout for spotlight */}
      {targetElement && (
        <svg
          className="fixed inset-0 pointer-events-none"
          style={{ zIndex: 1000 }}
          width="100%"
          height="100%"
        >
          <defs>
            <mask id="spotlight-mask">
              <rect x="0" y="0" width="100%" height="100%" fill="white" />
              <rect
                x={targetElement.getBoundingClientRect().left - 6}
                y={targetElement.getBoundingClientRect().top - 6}
                width={targetElement.getBoundingClientRect().width + 12}
                height={targetElement.getBoundingClientRect().height + 12}
                rx="8"
                fill="black"
              />
            </mask>
          </defs>
          <rect
            x="0"
            y="0"
            width="100%"
            height="100%"
            fill="rgba(0, 0, 0, 0.7)"
            mask="url(#spotlight-mask)"
            onClick={handleSkip}
            style={{ pointerEvents: 'auto' }}
          />
        </svg>
      )}

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
              
              /* Spotlight brightness guarantee */
              .is-spotlighted {
                /* Reset potential darkening inherited from parents */
                filter: none !important;
                opacity: 1 !important;
                /* Ensure the element is clearly visible over any potential inner overlay */
                isolation: isolate;
                /* Ensure background is visible */
                background-color: inherit !important;
                /* Ensure pointer events work */
                pointer-events: auto !important;
              }
              
              /* Extra brightness for button elements */
              .is-spotlighted button,
              button.is-spotlighted {
                filter: none !important;
                opacity: 1 !important;
                pointer-events: auto !important;
              }
              
              /* Ensure all children are visible */
              .is-spotlighted * {
                filter: none !important;
                opacity: 1 !important;
              }
            `}
          </style>
        </>
      )}

      {/* Tooltip */}
      {targetElement && (
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
            Step {step.id} of {MOBILE_TOUR_STEPS.length}
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
              // Step 1: Start Tour + Continue + Skip
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
                  onClick={handleNext}
                  variant="ghost"
                  size="sm"
                  className="whitespace-nowrap"
                >
                  Continue
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
              // Step 3: Back + Finish + Skip
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
              // Steps 2-6: Back + Continue + Skip
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
                  Skip
                </Button>
              </>
            )}
          </div>

          {/* ESC hint */}
          <div className="text-xs text-gray-500 text-center mt-3">
            Press ESC to skip
          </div>
        </div>
      )}
    </>
  );
};
