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
 * Get all next steps for a case from evidence_discovery_paths
 * 
 * This function fetches ALL steps for the case (no filtering)
 * Filtering will be done in Task 3
 * 
 * @param caseId - The case ID
 * @param traceId - Trace ID for request tracking
 * @param progressList - Current game progress (not used for filtering in this function)
 * @returns Array of all evidence discovery path steps for the case
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
    const { data, error } = await supabase
      .from('evidence_discovery_paths')
      .select('path_id, step_number, object_name, unlock_keyword, is_unlock_trigger, ai_description, case_id')
      .eq('case_id', caseId);

    if (error) {
      logger.error(
        `[DB] Failed to fetch discovery paths for case: ${caseId}`,
        error,
        traceId
      );
      throw error;
    }

    logger.info(
      `[DB] Successfully fetched ${data?.length || 0} discovery path steps for case: ${caseId}`,
      traceId
    );

    return (data || []) as EvidenceDiscoveryPath[];
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
    const { error } = await supabase
      .from('game_path_progress')
      .upsert(
        {
          game_id: gameId,
          path_id: pathId,
          last_completed_step: newStep,
          updated_at: new Date().toISOString(),
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
  } catch (error) {
    logger.error(
      `[DB] Unexpected error updating path progress - Game: ${gameId}, Path: ${pathId}`,
      error as Error,
      traceId
    );
    throw error;
  }
}
