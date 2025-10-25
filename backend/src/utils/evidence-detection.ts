/**
 * Evidence Detection Utility
 * 
 * Scans messages for evidence unlock keywords
 * Auto-unlocks matching evidence based on conversation
 * 
 * Phase 4, Step 4.3
 */

interface Evidence {
  evidence_id: string;
  name: string;
  unlock_keywords: string[];
  is_required_for_accusation: boolean;
}

/**
 * Scan a message for evidence keywords
 * Returns array of evidence IDs that should be unlocked
 * 
 * @param message - The text to scan (user or AI message)
 * @param availableEvidence - All evidence for the case
 * @param alreadyUnlocked - Evidence IDs already unlocked (to avoid duplicates)
 * @returns Array of evidence IDs to unlock
 */
export function detectEvidenceInMessage(
  message: string,
  availableEvidence: Evidence[],
  alreadyUnlocked: string[]
): string[] {
  const newlyUnlocked: string[] = [];

  // Normalize message for comparison (lowercase, trim)
  const normalizedMessage = message.toLowerCase().trim();

  // Check each evidence item
  for (const evidence of availableEvidence) {
    // Skip if already unlocked
    if (alreadyUnlocked.includes(evidence.evidence_id)) {
      continue;
    }

    // Check if any keyword matches
    const hasMatch = evidence.unlock_keywords.some(keyword => {
      // Normalize keyword
      const normalizedKeyword = keyword.toLowerCase().trim();

      // Check for keyword match (case-insensitive, flexible)
      // Match plural forms: "fingerprint" matches "fingerprints"
      // Use word boundaries to avoid partial matches in unrelated words
      const escapedKeyword = escapeRegExp(normalizedKeyword);
      const regex = new RegExp(`\\b${escapedKeyword}s?\\b`, 'i');
      return regex.test(normalizedMessage);
    });

    if (hasMatch) {
      newlyUnlocked.push(evidence.evidence_id);
    }
  }

  return newlyUnlocked;
}

/**
 * Escape special regex characters in a string
 * Used to safely create regex patterns from user input
 */
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Scan multiple messages for evidence
 * Useful for scanning both user message and AI response
 * 
 * @param messages - Array of messages to scan
 * @param availableEvidence - All evidence for the case
 * @param alreadyUnlocked - Evidence IDs already unlocked
 * @returns Array of unique evidence IDs to unlock
 */
export function detectEvidenceInMessages(
  messages: string[],
  availableEvidence: Evidence[],
  alreadyUnlocked: string[]
): string[] {
  const allUnlocked: string[] = [];

  for (const message of messages) {
    const detected = detectEvidenceInMessage(message, availableEvidence, [
      ...alreadyUnlocked,
      ...allUnlocked, // Include newly found in this batch
    ]);
    allUnlocked.push(...detected);
  }

  // Return unique evidence IDs
  return [...new Set(allUnlocked)];
}

/**
 * Check if all required evidence has been unlocked
 * Used to determine if player can make an accusation
 * 
 * @param availableEvidence - All evidence for the case
 * @param unlockedEvidenceIds - Evidence IDs that have been unlocked
 * @returns True if all required evidence is unlocked
 */
export function canMakeAccusation(
  availableEvidence: Evidence[],
  unlockedEvidenceIds: string[]
): boolean {
  // Get all required evidence
  const requiredEvidence = availableEvidence.filter(ev => ev.is_required_for_accusation);

  // Check if all required evidence is unlocked
  return requiredEvidence.every(ev => unlockedEvidenceIds.includes(ev.evidence_id));
}

/**
 * Get statistics about evidence progress
 * 
 * @param availableEvidence - All evidence for the case
 * @param unlockedEvidenceIds - Evidence IDs that have been unlocked
 * @returns Evidence statistics
 */
export function getEvidenceStats(
  availableEvidence: Evidence[],
  unlockedEvidenceIds: string[]
) {
  const totalEvidence = availableEvidence.length;
  const unlockedCount = unlockedEvidenceIds.length;
  const requiredEvidence = availableEvidence.filter(ev => ev.is_required_for_accusation);
  const requiredCount = requiredEvidence.length;
  const requiredUnlocked = requiredEvidence.filter(ev => 
    unlockedEvidenceIds.includes(ev.evidence_id)
  ).length;

  return {
    total: totalEvidence,
    unlocked: unlockedCount,
    required: requiredCount,
    required_unlocked: requiredUnlocked,
    can_accuse: canMakeAccusation(availableEvidence, unlockedEvidenceIds),
    progress_percent: Math.round((unlockedCount / totalEvidence) * 100),
  };
}
