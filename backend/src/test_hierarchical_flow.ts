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

    console.log('\n' + '='.repeat(80));
    console.log('✅ ALL TESTS PASSED!');
    console.log('='.repeat(80) + '\n');

    logger.info('[TEST] All tests completed successfully', traceId);

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
