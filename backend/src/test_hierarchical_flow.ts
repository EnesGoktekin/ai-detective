/**
 * Hierarchical Flow Test
 * 
 * Tests the hierarchical evidence discovery system without starting Express server
 * Simulates the chat.routes.ts logic using database.service functions
 * 
 * Phase 13.1 & 13.2: Hierarchical Flow Testing & Log Verification
 */

// Load environment variables FIRST
import * as dotenv from 'dotenv';
dotenv.config();

import { createClient } from '@supabase/supabase-js';
import { logger, generateTraceId } from './services/logger.service';
import {
  getGamePathProgress,
  getAllNextStepsForCase,
  updatePathProgress,
} from './services/database.service';

// Test constants
const MOCK_GAME_ID = '00000000-0000-0000-0000-000000000001';
const SMALL_VIAL_CAP_EVIDENCE_ID = '88df36a9-1127-4e17-b0c5-dc20b14da03a';

// Suspect IDs from "The Silent Watchman" case
const GUILTY_SUSPECT_ID = 'e6ac2a96-6d90-46c5-8819-f842ab38e653'; // Lisa Chen (is_guilty: true)
const INNOCENT_SUSPECT_ID = 'c67ea41e-be3d-4729-843b-4c1eba202e6b'; // Mark Bell (is_guilty: false)

// Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_ANON_KEY || ''
);

/**
 * Get first available case ID from database
 */
async function getFirstCaseId(traceId: string): Promise<string> {
  logger.info('[TEST] Fetching first available case ID from database...', traceId);

  try {
    const { data, error } = await supabase
      .from('cases')
      .select('case_id, title')
      .order('created_at', { ascending: true })
      .limit(1)
      .single();

    if (error || !data) {
      logger.error(
        '[TEST] Failed to fetch case ID from database',
        error || new Error('No cases found'),
        traceId
      );
      throw new Error('Could not fetch case ID from database');
    }

    logger.info(
      `[TEST] Using case: ${data.title} (${data.case_id})`,
      traceId
    );

    return data.case_id;
  } catch (error) {
    logger.error('[TEST] getFirstCaseId failed', error as Error, traceId);
    throw error;
  }
}

/**
 * Clean up test data from database
 */
async function cleanupTestData(traceId: string): Promise<void> {
  logger.info('[TEST] Cleaning up test data...', traceId);

  try {
    // Delete game_path_progress for mock game
    const { error: progressError } = await supabase
      .from('game_path_progress')
      .delete()
      .eq('game_id', MOCK_GAME_ID);

    if (progressError) {
      logger.error('[TEST] Failed to delete game_path_progress', progressError, traceId);
    }

    // Delete evidence_unlocked for mock game
    const { error: unlockError } = await supabase
      .from('evidence_unlocked')
      .delete()
      .eq('game_id', MOCK_GAME_ID);

    if (unlockError) {
      logger.error('[TEST] Failed to delete evidence_unlocked', unlockError, traceId);
    }

    // Delete mock game (must be before evidence_lookup due to FK)
    const { error: gameError } = await supabase
      .from('games')
      .delete()
      .eq('game_id', MOCK_GAME_ID);

    if (gameError) {
      logger.error('[TEST] Failed to delete mock game', gameError, traceId);
    }

    // Delete mock evidence from evidence_lookup
    const { error: evidenceError } = await supabase
      .from('evidence_lookup')
      .delete()
      .eq('evidence_id', SMALL_VIAL_CAP_EVIDENCE_ID);

    if (evidenceError) {
      logger.error('[TEST] Failed to delete mock evidence', evidenceError, traceId);
    }

    logger.info('[TEST] Cleanup completed successfully', traceId);
  } catch (error) {
    logger.error('[TEST] Cleanup failed', error as Error, traceId);
    throw error;
  }
}

/**
 * Create mock game and evidence for testing
 */
async function createMockGame(caseId: string, traceId: string): Promise<void> {
  logger.info('[TEST] Creating mock game and evidence...', traceId);

  try {
    // Use UPSERT for mock evidence (handles duplicate case)
    const { error: evidenceError } = await supabase
      .from('evidence_lookup')
      .upsert(
        {
          evidence_id: SMALL_VIAL_CAP_EVIDENCE_ID,
          case_id: caseId,
          display_name: 'Small Vial Cap',
          description: 'A small cap from a vial, found on the dining table surface.',
          is_required_for_accusation: true,
        },
        {
          onConflict: 'evidence_id',
        }
      );

    if (evidenceError) {
      logger.error('[TEST] Failed to create mock evidence', evidenceError, traceId);
      throw evidenceError;
    }

    // Use UPSERT for mock game (handles duplicate case)
    const { error: gameError } = await supabase
      .from('games')
      .upsert(
        {
          game_id: MOCK_GAME_ID,
          case_id: caseId,
          current_summary: 'Initial summary for test game - hierarchical flow test',
          message_count: 0,
          is_completed: false,
          final_outcome: null,
        },
        {
          onConflict: 'game_id',
        }
      );

    if (gameError) {
      logger.error('[TEST] Failed to create mock game', gameError, traceId);
      throw gameError;
    }

    logger.info('[TEST] Mock game and evidence created successfully', traceId);
  } catch (error) {
    logger.error('[TEST] Mock game/evidence creation failed', error as Error, traceId);
    throw error;
  }
}

/**
 * Verify game_path_progress is empty
 */
async function verifyEmptyProgress(traceId: string): Promise<void> {
  logger.info('[TEST] Step 0: Verifying empty progress...', traceId);

  const progress = await getGamePathProgress(MOCK_GAME_ID, traceId);

  if (progress.length === 0) {
    logger.info('[TEST] ✅ Step 0 PASSED: game_path_progress is empty', traceId);
  } else {
    logger.error(
      '[TEST] ❌ Step 0 FAILED: game_path_progress not empty',
      new Error(`Expected 0, got ${progress.length} records`),
      traceId
    );
    throw new Error('Step 0 verification failed');
  }
}

/**
 * Simulate user message and process hierarchical discovery
 */
async function simulateUserMessage(
  stepNumber: number,
  userMessage: string,
  expectedKeyword: string,
  expectedStepNumber: number,
  caseId: string,
  traceId: string
): Promise<void> {
  logger.info(
    `[TEST] Step ${stepNumber}: Simulating user message: "${userMessage}"`,
    traceId
  );

  // Get current progress
  const progressList = await getGamePathProgress(MOCK_GAME_ID, traceId);
  logger.debug(
    `[TEST] Current progress: ${progressList.length} path(s)`,
    traceId
  );

  // Get next available steps
  const availableNextSteps = await getAllNextStepsForCase(
    caseId,
    traceId,
    progressList
  );
  logger.debug(
    `[TEST] Available next steps: ${availableNextSteps.length}`,
    traceId
  );

  // Log available keywords for debugging
  availableNextSteps.forEach(step => {
    logger.debug(
      `[TEST] Path ${step.path_id}, Step ${step.step_number}: Keywords = "${step.unlock_keyword}"`,
      traceId
    );
  });

  // Check user message against available steps
  let foundNextStep = null;

  for (const step of availableNextSteps) {
    const keywords = step.unlock_keyword.split(',').map(k => k.trim().toLowerCase());
    const userMessageLower = userMessage.toLowerCase();

    for (const keyword of keywords) {
      if (userMessageLower.includes(keyword)) {
        foundNextStep = step;
        logger.info(
          `[TEST] Matched keyword "${keyword}" in step ${step.step_number} of path ${step.path_id}`,
          traceId
        );
        break;
      }
    }

    if (foundNextStep) break;
  }

  // Verify match
  if (!foundNextStep) {
    logger.error(
      `[TEST] ❌ Step ${stepNumber} FAILED: No keyword match found`,
      new Error(`Expected to match "${expectedKeyword}"`),
      traceId
    );
    throw new Error(`Step ${stepNumber} failed: No match`);
  }

  // Update progress
  await updatePathProgress(
    MOCK_GAME_ID,
    foundNextStep.path_id,
    foundNextStep.step_number,
    traceId
  );

  // Verify expected step number
  if (foundNextStep.step_number !== expectedStepNumber) {
    logger.error(
      `[TEST] ❌ Step ${stepNumber} FAILED: Wrong step number`,
      new Error(`Expected ${expectedStepNumber}, got ${foundNextStep.step_number}`),
      traceId
    );
    throw new Error(`Step ${stepNumber} failed: Wrong step number`);
  }

  // Check if evidence should be unlocked
  if (foundNextStep.is_unlock_trigger) {
    logger.error(
      `[CRITICAL] Evidence unlock triggered! Path: ${foundNextStep.path_id}, Step: ${foundNextStep.step_number}`,
      new Error('Evidence unlock trigger'),
      traceId
    );

    // Unlock evidence in database
    const { error: unlockError } = await supabase
      .from('evidence_unlocked')
      .insert({
        game_id: MOCK_GAME_ID,
        evidence_id: SMALL_VIAL_CAP_EVIDENCE_ID,
      });

    if (unlockError) {
      logger.error('[TEST] Failed to unlock evidence', unlockError, traceId);
      throw unlockError;
    }

    logger.info('[TEST] Evidence unlocked successfully', traceId);
  }

  // Verify database state
  const updatedProgress = await getGamePathProgress(MOCK_GAME_ID, traceId);
  const currentProgress = updatedProgress.find(p => p.path_id === foundNextStep!.path_id);

  if (!currentProgress || currentProgress.last_completed_step !== expectedStepNumber) {
    logger.error(
      `[TEST] ❌ Step ${stepNumber} FAILED: Database state incorrect`,
      new Error(`Expected last_completed_step=${expectedStepNumber}`),
      traceId
    );
    throw new Error(`Step ${stepNumber} failed: DB verification`);
  }

  logger.info(
    `[TEST] ✅ Step ${stepNumber} PASSED: last_completed_step = ${expectedStepNumber}`,
    traceId
  );
}

/**
 * Verify evidence was unlocked
 */
async function verifyEvidenceUnlocked(traceId: string): Promise<void> {
  logger.info('[TEST] Verifying evidence unlock...', traceId);

  const { data, error } = await supabase
    .from('evidence_unlocked')
    .select('evidence_id')
    .eq('game_id', MOCK_GAME_ID)
    .eq('evidence_id', SMALL_VIAL_CAP_EVIDENCE_ID)
    .single();

  if (error || !data) {
    logger.error(
      '[TEST] ❌ Evidence unlock verification FAILED',
      error || new Error('Evidence not found in evidence_unlocked'),
      traceId
    );
    throw new Error('Evidence unlock verification failed');
  }

  logger.error(
    '[CRITICAL] ✅ Evidence unlock verified: Small Vial Cap found in evidence_unlocked table',
    new Error('Evidence unlock verification - SUCCESS'),
    traceId
  );

  logger.info('[TEST] ✅ Evidence unlock verification PASSED', traceId);
}

/**
 * Get required evidence count for accusation
 */
async function getRequiredEvidenceCount(
  gameId: string,
  caseId: string,
  traceId: string
): Promise<{ requiredCount: number; currentUnlocked: number }> {
  logger.info('[TEST] Fetching required evidence count...', traceId);

  try {
    // Get required evidence from case
    const { data: evidenceData, error: evidenceError } = await supabase
      .from('evidence_lookup')
      .select('evidence_id, is_required_for_accusation')
      .eq('case_id', caseId);

    if (evidenceError || !evidenceData) {
      throw new Error('Failed to fetch evidence data');
    }

    const requiredCount = evidenceData.filter(
      (e: any) => e.is_required_for_accusation
    ).length;

    // Get unlocked evidence
    const { data: unlockedData, error: unlockedError } = await supabase
      .from('evidence_unlocked')
      .select('evidence_id')
      .eq('game_id', gameId);

    if (unlockedError) {
      throw new Error('Failed to fetch unlocked evidence');
    }

    const currentUnlocked = unlockedData?.length || 0;

    logger.info(
      `[TEST] Required evidence: ${requiredCount}, Unlocked: ${currentUnlocked}`,
      traceId
    );

    return { requiredCount, currentUnlocked };
  } catch (error) {
    logger.error('[TEST] getRequiredEvidenceCount failed', error as Error, traceId);
    throw error;
  }
}

/**
 * Mock accusation function (simulates accusation.routes.ts logic)
 */
async function accuseSuspect(
  gameId: string,
  _caseId: string,
  accusedId: string,
  traceId: string
): Promise<{
  success: boolean;
  isCorrect?: boolean;
  error?: string;
  missingCount?: number;
  totalRequired?: number;
}> {
  logger.info(
    `[TEST] Making accusation: gameId=${gameId}, accusedId=${accusedId}`,
    traceId
  );

  try {
    // Get game with case data
    const { data: game, error: gameError } = await supabase
      .from('games')
      .select(`
        *,
        cases (
          case_id,
          title,
          suspects (
            suspect_id,
            name,
            is_guilty
          ),
          evidence_lookup (
            evidence_id,
            is_required_for_accusation
          )
        )
      `)
      .eq('game_id', gameId)
      .single();

    if (gameError || !game) {
      return { success: false, error: 'Game session not found' };
    }

    // Check if game is already completed
    if (game.is_completed) {
      return { success: false, error: 'Game session is already completed' };
    }

    // Get unlocked evidence
    const { data: unlockedEvidence, error: evidenceError } = await supabase
      .from('evidence_unlocked')
      .select('evidence_id')
      .eq('game_id', gameId);

    if (evidenceError) {
      return { success: false, error: 'Failed to fetch unlocked evidence' };
    }

    const unlockedEvidenceIds = new Set(
      unlockedEvidence?.map((e: any) => e.evidence_id) || []
    );

    // Check required evidence
    const requiredEvidence = game.cases.evidence_lookup.filter(
      (e: any) => e.is_required_for_accusation
    );
    const requiredEvidenceIds = requiredEvidence.map((e: any) => e.evidence_id);
    const missingRequired = requiredEvidenceIds.filter(
      (id: string) => !unlockedEvidenceIds.has(id)
    );

    if (missingRequired.length > 0) {
      return {
        success: false,
        error: 'Cannot make accusation: missing required evidence',
        missingCount: missingRequired.length,
        totalRequired: requiredEvidenceIds.length
      };
    }

    // Find suspects
    const accusedSuspect = game.cases.suspects.find(
      (s: any) => s.suspect_id === accusedId
    );

    if (!accusedSuspect) {
      return { success: false, error: 'Invalid suspect_id: suspect not found' };
    }

    const guiltySuspect = game.cases.suspects.find(
      (s: any) => s.is_guilty === true
    );

    const isCorrect = accusedId === guiltySuspect?.suspect_id;

    // Update game to completed
    const finalOutcome = {
      accused_suspect_id: accusedId,
      accused_suspect_name: accusedSuspect.name,
      guilty_suspect_id: guiltySuspect?.suspect_id,
      guilty_suspect_name: guiltySuspect?.name || 'Unknown',
      is_correct: isCorrect,
      evidence_collected: unlockedEvidence?.length || 0,
      total_evidence: game.cases.evidence_lookup.length,
      completed_at: new Date().toISOString()
    };

    const { error: updateError } = await supabase
      .from('games')
      .update({
        is_completed: true,
        final_outcome: finalOutcome,
        last_updated: new Date().toISOString()
      })
      .eq('game_id', gameId);

    if (updateError) {
      return { success: false, error: 'Failed to update game session' };
    }

    logger.info(
      `[TEST] Accusation result: isCorrect=${isCorrect}, accused=${accusedSuspect.name}`,
      traceId
    );

    return { success: true, isCorrect };
  } catch (error) {
    logger.error('[TEST] accuseSuspect failed', error as Error, traceId);
    return { success: false, error: 'Internal server error' };
  }
}

/**
 * Run complete test flow
 */
async function runTestFlow(): Promise<void> {
  const traceId = generateTraceId();

  console.log('\n' + '='.repeat(80));
  console.log('🧪 HIERARCHICAL FLOW TEST - Phase 13.1 & 13.2');
  console.log('='.repeat(80));
  console.log(`Trace ID: ${traceId}`);
  console.log(`Mock Game ID: ${MOCK_GAME_ID}`);
  console.log('='.repeat(80) + '\n');

  try {
    // Get first available case from database
    const caseId = await getFirstCaseId(traceId);

    console.log(`Using Case ID: ${caseId}`);
    console.log('='.repeat(80) + '\n');

    // Step 0: Cleanup and create mock game
    await cleanupTestData(traceId);
    await createMockGame(caseId, traceId);
    await verifyEmptyProgress(traceId);

    console.log('\n' + '-'.repeat(80));
    console.log('📝 Testing Evidence Discovery Path');
    console.log('-'.repeat(80) + '\n');

    // Step 1: Check victim/coat (first available path)
    await simulateUserMessage(
      1,
      'Let me check victim carefully',
      'check victim',
      1,
      caseId,
      traceId
    );

    // Step 2: Check pocket (second step in path)
    await simulateUserMessage(
      2,
      'I want to check pocket thoroughly',
      'check pocket',
      2,
      caseId,
      traceId
    );

    // Step 3: Final discovery (should unlock evidence)
    await simulateUserMessage(
      3,
      'I will take handkerchief from pocket',
      'take handkerchief',
      3,
      caseId,
      traceId
    );

    // Verify evidence was unlocked
    await verifyEvidenceUnlocked(traceId);

    console.log('\n' + '-'.repeat(80));
    console.log('🎯 Testing Accusation Endpoint (Phase 13.3)');
    console.log('-'.repeat(80) + '\n');

    // Scenario A: Early Accusation Test (SHOULD FAIL - Missing Evidence)
    logger.info('[TEST] Scenario A: Testing early accusation (before required evidence)...', traceId);
    
    // First, let's check the current evidence count
    const { requiredCount, currentUnlocked } = await getRequiredEvidenceCount(
      MOCK_GAME_ID,
      caseId,
      traceId
    );

    logger.info(
      `[TEST] Evidence Status: ${currentUnlocked}/${requiredCount} required evidence unlocked`,
      traceId
    );

    // If we don't have all required evidence, test should fail
    if (currentUnlocked < requiredCount) {
      const earlyAccusationResult = await accuseSuspect(
        MOCK_GAME_ID,
        caseId,
        GUILTY_SUSPECT_ID,
        traceId
      );

      if (!earlyAccusationResult.success && earlyAccusationResult.error?.includes('missing required evidence')) {
        logger.info(
          `[TEST] ✅ Scenario A PASSED: Early accusation correctly rejected (missing ${earlyAccusationResult.missingCount}/${earlyAccusationResult.totalRequired} required evidence)`,
          traceId
        );
      } else {
        throw new Error('Scenario A FAILED: Early accusation should have been rejected');
      }
    } else {
      logger.info(
        '[TEST] ⚠️ Scenario A SKIPPED: All required evidence already unlocked',
        traceId
      );
    }

    // Scenario B: Successful Accusation Test (SHOULD WIN)
    // First, unlock all required evidence for successful accusation
    logger.info('[TEST] Scenario B: Unlocking all required evidence...', traceId);
    
    const { data: requiredEvidence, error: reqEvidenceError } = await supabase
      .from('evidence_lookup')
      .select('evidence_id')
      .eq('case_id', caseId)
      .eq('is_required_for_accusation', true);

    if (reqEvidenceError || !requiredEvidence) {
      throw new Error('Failed to fetch required evidence');
    }

    // Unlock all required evidence
    for (const evidence of requiredEvidence) {
      await supabase
        .from('evidence_unlocked')
        .upsert(
          {
            game_id: MOCK_GAME_ID,
            evidence_id: evidence.evidence_id,
            unlocked_at: new Date().toISOString()
          },
          { onConflict: 'game_id,evidence_id' }
        );
    }

    logger.info(
      `[TEST] Unlocked ${requiredEvidence.length} required evidence for testing`,
      traceId
    );

    logger.info('[TEST] Scenario B: Testing correct accusation (Lisa Chen - guilty)...', traceId);
    
    const correctAccusationResult = await accuseSuspect(
      MOCK_GAME_ID,
      caseId,
      GUILTY_SUSPECT_ID,
      traceId
    );

    if (correctAccusationResult.success && correctAccusationResult.isCorrect === true) {
      logger.info(
        '[TEST] ✅ Scenario B PASSED: Correct accusation accepted, game won!',
        traceId
      );
    } else {
      throw new Error(`Scenario B FAILED: Expected success with isCorrect=true, got: ${JSON.stringify(correctAccusationResult)}`);
    }

    // Verify game is now completed
    const { data: completedGame, error: gameCheckError } = await supabase
      .from('games')
      .select('is_completed, final_outcome')
      .eq('game_id', MOCK_GAME_ID)
      .single();

    if (gameCheckError || !completedGame || !completedGame.is_completed) {
      throw new Error('Game should be marked as completed after accusation');
    }

    logger.info(
      '[TEST] ✅ Game completion verified: is_completed=true',
      traceId
    );

    // Scenario C: Wrong Accusation Test (SHOULD LOSE)
    // Reset game for this test
    logger.info('[TEST] Scenario C: Resetting game for wrong accusation test...', traceId);
    
    await supabase
      .from('games')
      .update({
        is_completed: false,
        final_outcome: null
      })
      .eq('game_id', MOCK_GAME_ID);

    logger.info('[TEST] Scenario C: Testing wrong accusation (Mark Bell - innocent)...', traceId);
    
    const wrongAccusationResult = await accuseSuspect(
      MOCK_GAME_ID,
      caseId,
      INNOCENT_SUSPECT_ID,
      traceId
    );

    if (wrongAccusationResult.success && wrongAccusationResult.isCorrect === false) {
      logger.info(
        '[TEST] ✅ Scenario C PASSED: Wrong accusation accepted, game lost!',
        traceId
      );
    } else {
      throw new Error(`Scenario C FAILED: Expected success with isCorrect=false, got: ${JSON.stringify(wrongAccusationResult)}`);
    }

    console.log('\n' + '='.repeat(80));
    console.log('✅ ALL TESTS PASSED! (Including Accusation Tests)');
    console.log('='.repeat(80) + '\n');

    logger.info('[TEST] All tests completed successfully (Phase 13.1, 13.2, 13.3)', traceId);

  } catch (error) {
    console.log('\n' + '='.repeat(80));
    console.log('❌ TEST FAILED');
    console.log('='.repeat(80) + '\n');

    logger.error('[TEST] Test flow failed', error as Error, traceId);
    process.exit(1);
  }
}

// Run the test
runTestFlow()
  .then(() => {
    console.log('Test execution completed. Exiting...\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
