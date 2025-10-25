/**
 * Evidence Routes
 * 
 * Endpoints for retrieving evidence information
 * and managing evidence unlocking
 * 
 * Phase 5, Step 5.3
 */

import { Router, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_ANON_KEY || ''
);

const router = Router();

/**
 * GET /api/evidence/case/:case_id
 * 
 * Get all evidence for a specific case
 * 
 * Response:
 * {
 *   "success": true,
 *   "count": 3,
 *   "evidence": [
 *     {
 *       "evidence_id": "...",
 *       "name": "Security Footage",
 *       "description": "Camera recordings from the night",
 *       "location": "Security room",
 *       "unlock_keywords": ["camera", "footage", "recording"],
 *       "is_required_for_accusation": true
 *     }
 *   ]
 * }
 */
router.get('/case/:case_id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { case_id } = req.params;

    if (!case_id) {
      res.status(400).json({
        success: false,
        error: 'Case ID is required',
      });
      return;
    }

    // Get all evidence for the case
    const { data: evidence, error } = await supabase
      .from('evidence_lookup')
      .select('*')
      .eq('case_id', case_id)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching evidence:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch evidence',
      });
      return;
    }

    res.status(200).json({
      success: true,
      count: evidence?.length || 0,
      evidence: evidence || [],
    });

  } catch (error) {
    console.error('Evidence endpoint error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * GET /api/evidence/game/:game_id/unlocked
 * 
 * Get unlocked evidence for a game session
 * 
 * Response:
 * {
 *   "success": true,
 *   "count": 2,
 *   "unlocked_evidence": [
 *     {
 *       "evidence_id": "...",
 *       "name": "Security Footage",
 *       "unlocked_at": "2025-10-25T10:30:00Z"
 *     }
 *   ]
 * }
 */
router.get('/game/:game_id/unlocked', async (req: Request, res: Response): Promise<void> => {
  try {
    const { game_id } = req.params;

    if (!game_id) {
      res.status(400).json({
        success: false,
        error: 'Game ID is required',
      });
      return;
    }

    // Get unlocked evidence with details
    const { data: unlockedEvidence, error } = await supabase
      .from('evidence_unlocked')
      .select(`
        evidence_id,
        unlocked_at,
        evidence_lookup (
          display_name,
          description,
          is_required_for_accusation
        )
      `)
      .eq('game_id', game_id)
      .order('unlocked_at', { ascending: true });

    if (error) {
      console.error('Error fetching unlocked evidence:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch unlocked evidence',
      });
      return;
    }

    res.status(200).json({
      success: true,
      count: unlockedEvidence?.length || 0,
      unlocked_evidence: unlockedEvidence || [],
    });

  } catch (error) {
    console.error('Unlocked evidence endpoint error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * POST /api/evidence/game/:game_id/unlock
 * 
 * Manually unlock evidence (for testing/debugging)
 * 
 * Request body:
 * {
 *   "evidence_id": "uuid-here"
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "message": "Evidence unlocked successfully",
 *   "evidence_id": "..."
 * }
 */
router.post('/game/:game_id/unlock', async (req: Request, res: Response): Promise<void> => {
  try {
    const { game_id } = req.params;
    const { evidence_id } = req.body;

    if (!game_id) {
      res.status(400).json({
        success: false,
        error: 'Game ID is required',
      });
      return;
    }

    if (!evidence_id) {
      res.status(400).json({
        success: false,
        error: 'Evidence ID is required',
      });
      return;
    }

    // Check if evidence already unlocked
    const { data: existing } = await supabase
      .from('evidence_unlocked')
      .select('*')
      .eq('game_id', game_id)
      .eq('evidence_id', evidence_id)
      .single();

    if (existing) {
      res.status(400).json({
        success: false,
        error: 'Evidence already unlocked',
      });
      return;
    }

    // Unlock evidence
    const { error } = await supabase
      .from('evidence_unlocked')
      .insert({
        game_id,
        evidence_id,
      });

    if (error) {
      console.error('Error unlocking evidence:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to unlock evidence',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Evidence unlocked successfully',
      evidence_id,
    });

  } catch (error) {
    console.error('Unlock evidence endpoint error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * GET /api/evidence/game/:game_id/stats
 * 
 * Get evidence collection statistics
 * 
 * Response:
 * {
 *   "success": true,
 *   "stats": {
 *     "total_evidence": 5,
 *     "unlocked_count": 3,
 *     "required_count": 3,
 *     "required_unlocked": 2,
 *     "can_make_accusation": false,
 *     "progress_percent": 60
 *   }
 * }
 */
router.get('/game/:game_id/stats', async (req: Request, res: Response): Promise<void> => {
  try {
    const { game_id } = req.params;

    if (!game_id) {
      res.status(400).json({
        success: false,
        error: 'Game ID is required',
      });
      return;
    }

    // Get game to find case_id
    const { data: game, error: gameError } = await supabase
      .from('games')
      .select('case_id')
      .eq('game_id', game_id)
      .single();

    if (gameError || !game) {
      res.status(404).json({
        success: false,
        error: 'Game not found',
      });
      return;
    }

    // Get all evidence for case
    const { data: allEvidence } = await supabase
      .from('evidence_lookup')
      .select('evidence_id, is_required_for_accusation')
      .eq('case_id', game.case_id);

    // Get unlocked evidence
    const { data: unlockedEvidence } = await supabase
      .from('evidence_unlocked')
      .select('evidence_id')
      .eq('game_id', game_id);

    const totalEvidence = allEvidence?.length || 0;
    const unlockedCount = unlockedEvidence?.length || 0;
    const requiredEvidence = allEvidence?.filter(e => e.is_required_for_accusation) || [];
    const requiredCount = requiredEvidence.length;

    const unlockedIds = unlockedEvidence?.map(e => e.evidence_id) || [];
    const requiredUnlocked = requiredEvidence.filter(e => 
      unlockedIds.includes(e.evidence_id)
    ).length;

    const canMakeAccusation = requiredUnlocked === requiredCount && requiredCount > 0;
    const progressPercent = totalEvidence > 0 
      ? Math.round((unlockedCount / totalEvidence) * 100)
      : 0;

    res.status(200).json({
      success: true,
      stats: {
        total_evidence: totalEvidence,
        unlocked_count: unlockedCount,
        required_count: requiredCount,
        required_unlocked: requiredUnlocked,
        can_make_accusation: canMakeAccusation,
        progress_percent: progressPercent,
      },
    });

  } catch (error) {
    console.error('Evidence stats endpoint error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

export default router;
