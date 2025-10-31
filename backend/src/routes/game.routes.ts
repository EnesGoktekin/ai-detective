import { Router, Request, Response } from 'express';
import { supabase } from '../utils/database';
import { logger } from '../services/logger.service';
import { tracingMiddleware } from '../middleware/tracing.middleware';

const router = Router();

/**
 * POST /api/games/start
 * Start a new game session
 * 
 * Request body:
 * {
 *   "case_id": "uuid",
 *   "old_game_id": "uuid" (optional - for cleanup)
 * }
 * 
 * Cleanup Logic:
 * - If old_game_id is provided, deletes the old game session
 * - CASCADE deletes: messages, evidence_unlocked, game_path_progress
 * - Useful for anonymous users who store game_id in localStorage
 */
router.post('/start', tracingMiddleware, async (req: Request, res: Response) => {
  const traceId = req.traceId;
  
  try {
    const { case_id, old_game_id } = req.body;

    logger.info('[Game] Starting new game session', traceId);

    if (!case_id) {
      logger.debug('[Game] Missing case_id in request', traceId);
      return res.status(400).json({
        error: 'case_id is required',
      });
    }

    // ============================================
    // STEP 1: Cleanup old game session (if provided)
    // ============================================
    
    if (old_game_id) {
      logger.info(`[Game] Cleaning up old game session: ${old_game_id}`, traceId);
      
      try {
        // Delete old game (CASCADE will auto-delete related records)
        const { error: deleteError } = await supabase
          .from('games')
          .delete()
          .eq('game_id', old_game_id);

        if (deleteError) {
          logger.error(
            `[Game] Failed to delete old game: ${old_game_id}`,
            deleteError,
            traceId
          );
          // Continue anyway - don't block new game creation
        } else {
          logger.info(
            `[Game] Successfully cleaned up old game: ${old_game_id}`,
            traceId
          );
        }
      } catch (cleanupError) {
        logger.error(
          '[Game] Unexpected error during cleanup',
          cleanupError as Error,
          traceId
        );
        // Continue anyway - don't block new game creation
      }
    }

    // ============================================
    // STEP 2: Verify case exists
    // ============================================

    const { data: caseData, error: caseError } = await supabase
      .from('cases')
      .select('case_id, title')
      .eq('case_id', case_id)
      .single();

    if (caseError || !caseData) {
      logger.error('[Game] Case not found', caseError || new Error('Case not found'), traceId);
      return res.status(404).json({
        error: 'Case not found',
        details: caseError?.message,
      });
    }

    logger.debug(`[Game] Case found: ${caseData.title}`, traceId);

    // ============================================
    // STEP 3: Create new game session
    // ============================================

    const { data: game, error: gameError } = await supabase
      .from('games')
      .insert({
        case_id,
        current_summary: null,
        message_count: 0,
        is_completed: false,
        last_updated: new Date().toISOString(),
      })
      .select()
      .single();

    if (gameError || !game) {
      logger.error('[Game] Failed to create game session', gameError || new Error('Game creation failed'), traceId);
      return res.status(500).json({
        error: 'Failed to create game session',
        details: gameError?.message,
      });
    }

    logger.info(`[Game] New game session created: ${game.game_id}`, traceId);

    return res.status(201).json({
      success: true,
      game: {
        game_id: game.game_id,
        case_id: game.case_id,
        case_title: caseData.title,
        is_completed: game.is_completed,
        created_at: game.created_at,
      },
    });
  } catch (error) {
    logger.error('[Game] Error starting game', error as Error, traceId);
    return res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/games/:game_id
 * Get game session details with chat history and unlocked evidence
 */
router.get('/:game_id', async (req: Request, res: Response) => {
  try {
    const { game_id } = req.params;

    // Fetch game session
    const { data: game, error: gameError } = await supabase
      .from('games')
      .select('*')
      .eq('game_id', game_id)
      .single();

    if (gameError || !game) {
      return res.status(404).json({
        error: 'Game session not found',
        details: gameError?.message,
      });
    }

    // Fetch case info
    const { data: caseData } = await supabase
      .from('cases')
      .select('case_id, title, description')
      .eq('case_id', game.case_id)
      .single();

    // Fetch messages
    const { data: messages } = await supabase
      .from('messages')
      .select('*')
      .eq('game_id', game_id)
      .order('created_at', { ascending: true });

    // Fetch unlocked evidence
    const { data: unlockedEvidence } = await supabase
      .from('evidence_unlocked')
      .select(`
        evidence_id,
        unlocked_at,
        evidence_lookup (
          evidence_id,
          name,
          description,
          location,
          is_required_for_accusation
        )
      `)
      .eq('game_id', game_id)
      .order('unlocked_at', { ascending: true });

    return res.json({
      success: true,
      game: {
        game_id: game.game_id,
        case_id: game.case_id,
        case_title: caseData?.title,
        is_completed: game.is_completed,
        message_count: game.message_count,
        current_summary: game.current_summary,
        final_outcome: game.final_outcome,
        created_at: game.created_at,
        last_updated: game.last_updated,
      },
      messages: messages || [],
      unlocked_evidence: unlockedEvidence || [],
      stats: {
        total_messages: messages?.length || 0,
        evidence_found: unlockedEvidence?.length || 0,
      },
    });
  } catch (error) {
    console.error('Error fetching game:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * DELETE /api/games/:game_id
 * End game session (mark as completed)
 */
router.delete('/:game_id', async (req: Request, res: Response) => {
  try {
    const { game_id } = req.params;

    const { data: game, error } = await supabase
      .from('games')
      .update({
        is_completed: true,
        last_updated: new Date().toISOString(),
      })
      .eq('game_id', game_id)
      .select()
      .single();

    if (error || !game) {
      return res.status(404).json({
        error: 'Game session not found',
        details: error?.message,
      });
    }

    return res.json({
      success: true,
      message: 'Game session ended',
      game_id: game.game_id,
    });
  } catch (error) {
    console.error('Error ending game:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
