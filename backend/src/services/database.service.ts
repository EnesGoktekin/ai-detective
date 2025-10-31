/**
 * Database Service
 * 
 * Centralized database operations for hierarchical evidence discovery system
 * All functions include traceId for distributed tracing
 * 
 * Task 1.3: Database Services
 */

import { createClient } from '@supabase/supabase-js';
import { logger } from './logger.service';
import { GamePathProgress, EvidenceDiscoveryPath } from '../types/database.types';

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_ANON_KEY || ''
);

/**
 * Get game path progress for a specific game
 * 
 * @param gameId - The game session ID
 * @param traceId - Trace ID for request tracking
 * @returns Array of path progress records
 */
export async function getGamePathProgress(
  gameId: string,
  traceId: string
): Promise<GamePathProgress[]> {
  logger.debug(`[DB] Fetching game path progress for game: ${gameId}`, traceId);

  try {
    const { data, error } = await supabase
      .from('game_path_progress')
      .select('path_id, last_completed_step')
      .eq('game_id', gameId);

    if (error) {
      logger.error(
        `[DB] Failed to fetch game path progress for game: ${gameId}`,
        error,
        traceId
      );
      throw error;
    }

    logger.info(
      `[DB] Successfully fetched ${data?.length || 0} path progress records for game: ${gameId}`,
      traceId
    );

    return (data || []) as GamePathProgress[];
  } catch (error) {
    logger.error(
      `[DB] Unexpected error fetching game path progress for game: ${gameId}`,
      error as Error,
      traceId
    );
    throw error;
  }
}

/**
 * Get all next available steps for a case from evidence_discovery_paths
 * 
 * Fetches all discovery paths for the case and filters in TypeScript to return
 * only the next available steps based on current game progress.
 * 
 * Filtering Logic:
 * - Returns steps where step_number === (last_completed_step + 1) for each path
 * - If no progress exists for a path, returns step_number === 1 (first steps)
 * 
 * @param caseId - The case ID
 * @param traceId - Trace ID for request tracking
 * @param progressList - Current game progress for filtering
 * @returns Array of next available evidence discovery path steps
 */
export async function getAllNextStepsForCase(
  caseId: string,
  traceId: string,
  progressList: GamePathProgress[]
): Promise<EvidenceDiscoveryPath[]> {
  logger.debug(
    `[DB] Fetching all discovery paths for case: ${caseId} (progress records: ${progressList.length})`,
    traceId
  );

  try {
    // Fetch all steps for this case
    const { data, error } = await supabase
      .from('evidence_discovery_paths')
      .select('path_id, step_number, object_name, unlock_keyword, is_unlock_trigger, ai_description, case_id, parent_step_number')
      .eq('case_id', caseId);

    if (error) {
      logger.error(
        `[DB] Failed to fetch discovery paths for case: ${caseId}`,
        error,
        traceId
      );
      throw error;
    }

    const allSteps = (data || []) as EvidenceDiscoveryPath[];
    
    logger.debug(
      `[DB] Fetched ${allSteps.length} total steps, now filtering for next available steps`,
      traceId
    );

    // Create a map of path_id to last_completed_step for quick lookup
    const progressMap = new Map<string, number>();
    progressList.forEach((progress) => {
      progressMap.set(progress.path_id, progress.last_completed_step);
    });

    // Filter to get only next available steps
    const nextSteps = allSteps.filter((step) => {
      const currentProgress = progressMap.get(step.path_id);
      
      // If no progress for this path, return first step (step_number === 1)
      if (currentProgress === undefined) {
        return step.step_number === 1;
      }
      
      // Return next step (step_number === last_completed_step + 1)
      return step.step_number === currentProgress + 1;
    });

    logger.info(
      `[DB] Filtered to ${nextSteps.length} next available steps for case: ${caseId}`,
      traceId
    );

    return nextSteps;
  } catch (error) {
    logger.error(
      `[DB] Unexpected error fetching discovery paths for case: ${caseId}`,
      error as Error,
      traceId
    );
    throw error;
  }
}

/**
 * Update path progress for a game (UPSERT operation)
 * Also updates games table with progress snapshot
 * 
 * @param gameId - The game session ID
 * @param pathId - The path ID to update
 * @param newStep - The new step number to set
 * @param traceId - Trace ID for request tracking
 */
export async function updatePathProgress(
  gameId: string,
  pathId: string,
  newStep: number,
  traceId: string
): Promise<void> {
  logger.debug(
    `[DB] Updating path progress - Game: ${gameId}, Path: ${pathId}, Step: ${newStep}`,
    traceId
  );

  try {
    // Update game_path_progress
    const { error } = await supabase
      .from('game_path_progress')
      .upsert(
        {
          game_id: gameId,
          path_id: pathId,
          last_completed_step: newStep,
        },
        {
          onConflict: 'game_id,path_id', // Composite key
        }
      );

    if (error) {
      logger.error(
        `[DB] Failed to update path progress - Game: ${gameId}, Path: ${pathId}`,
        error,
        traceId
      );
      throw error;
    }

    logger.info(
      `[DB] Successfully updated path progress - Game: ${gameId}, Path: ${pathId}, Step: ${newStep}`,
      traceId
    );

    // Update progress snapshot in games table
    await updateProgressSnapshot(gameId, traceId);

  } catch (error) {
    logger.error(
      `[DB] Unexpected error updating path progress - Game: ${gameId}, Path: ${pathId}`,
      error as Error,
      traceId
    );
    throw error;
  }
}

/**
 * Update game's last_updated timestamp
 * Called after each successful message exchange
 * 
 * @param gameId - The game session ID
 * @param traceId - Trace ID for request tracking
 */
export async function updateGameLastUpdated(
  gameId: string,
  traceId: string
): Promise<void> {
  logger.debug(
    `[DB] Updating game last_updated timestamp - Game: ${gameId}`,
    traceId
  );

  try {
    const { error } = await supabase
      .from('games')
      .update({
        last_updated: new Date().toISOString()
      })
      .eq('game_id', gameId);

    if (error) {
      logger.error(
        `[DB] Failed to update game timestamp - Game: ${gameId}`,
        error,
        traceId
      );
      throw error;
    }

    logger.debug(
      `[DB] Successfully updated game timestamp - Game: ${gameId}`,
      traceId
    );
  } catch (error) {
    logger.error(
      `[DB] Unexpected error updating game timestamp - Game: ${gameId}`,
      error as Error,
      traceId
    );
    throw error;
  }
}

/**
 * Update game progress snapshot in games table
 * Creates a JSONB snapshot of current progress for quick access
 * 
 * @param gameId - The game session ID
 * @param traceId - Trace ID for request tracking
 */
export async function updateProgressSnapshot(
  gameId: string,
  traceId: string
): Promise<void> {
  logger.debug(
    `[DB] Updating progress snapshot - Game: ${gameId}`,
    traceId
  );

  try {
    // Get current path progress
    const pathProgress = await getGamePathProgress(gameId, traceId);

    // Get unlocked evidence count
    const { data: unlockedEvidence, error: evidenceError } = await supabase
      .from('evidence_unlocked')
      .select('evidence_id')
      .eq('game_id', gameId);

    if (evidenceError) {
      logger.error(
        `[DB] Failed to fetch unlocked evidence for snapshot - Game: ${gameId}`,
        evidenceError,
        traceId
      );
    }

    const unlockedCount = unlockedEvidence?.length || 0;

    // Build active paths summary
    const activePaths = pathProgress.map(progress => ({
      path_id: progress.path_id,
      last_completed_step: progress.last_completed_step,
    }));

    // Create snapshot
    const snapshot = {
      last_updated: new Date().toISOString(),
      unlocked_evidence_count: unlockedCount,
      completed_paths: pathProgress.length,
      active_paths: activePaths,
    };

    // Update games table
    const { error: updateError } = await supabase
      .from('games')
      .update({
        current_progress_snapshot: snapshot,
        last_updated: new Date().toISOString()
      })
      .eq('game_id', gameId);

    if (updateError) {
      logger.error(
        `[DB] Failed to update progress snapshot - Game: ${gameId}`,
        updateError,
        traceId
      );
      throw updateError;
    }

    logger.debug(
      `[DB] Successfully updated progress snapshot - Game: ${gameId}, Paths: ${pathProgress.length}, Evidence: ${unlockedCount}`,
      traceId
    );
  } catch (error) {
    logger.error(
      `[DB] Unexpected error updating progress snapshot - Game: ${gameId}`,
      error as Error,
      traceId
    );
    // Don't throw - snapshot update is non-critical
    // Main path progress update already succeeded
  }
}
