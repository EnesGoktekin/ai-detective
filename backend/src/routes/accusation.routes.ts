import express, { Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_ANON_KEY || ''
);

const router = express.Router();

/**
 * POST /api/accusation/:game_id
 * Make an accusation against a suspect to end the game
 * 
 * Request body:
 * {
 *   "accused_suspect_id": "uuid"
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "result": {
 *     "is_correct": boolean,
 *     "game_over": true,
 *     "message": string,
 *     "guilty_suspect": {...},
 *     "accused_suspect": {...},
 *     "evidence_collected": number,
 *     "total_evidence": number
 *   }
 * }
 */
router.post('/:game_id', async (req: Request, res: Response) => {
  try {
    const { game_id } = req.params;
    const { accused_suspect_id } = req.body;

    // Validate request body
    if (!accused_suspect_id) {
      return res.status(400).json({
        error: 'Missing required field: accused_suspect_id'
      });
    }

    // Get game session with case data
    const { data: game, error: gameError } = await supabase
      .from('games')
      .select(`
        *,
        cases (
          case_id,
          title,
          description,
          suspects (
            suspect_id,
            name,
            backstory,
            is_guilty
          ),
          evidence_lookup (
            evidence_id,
            display_name,
            is_required_for_accusation
          )
        )
      `)
      .eq('game_id', game_id)
      .single();

    if (gameError || !game) {
      console.error('Game fetch error:', gameError);
      return res.status(404).json({
        error: 'Game session not found'
      });
    }

    // Check if game is already completed
    if (game.is_completed) {
      return res.status(400).json({
        error: 'Game session is already completed'
      });
    }

    // Get unlocked evidence count
    const { data: unlockedEvidence, error: evidenceError } = await supabase
      .from('evidence_unlocked')
      .select('evidence_id')
      .eq('game_id', game_id);

    if (evidenceError) {
      console.error('Evidence fetch error:', evidenceError);
      return res.status(500).json({
        error: 'Failed to fetch unlocked evidence'
      });
    }

    const unlockedEvidenceIds = new Set(
      unlockedEvidence?.map((e: any) => e.evidence_id) || []
    );

    // Check if all required evidence is unlocked
    const requiredEvidence = game.cases.evidence_lookup.filter(
      (e: any) => e.is_required_for_accusation
    );
    const requiredEvidenceIds = requiredEvidence.map((e: any) => e.evidence_id);
    const missingRequired = requiredEvidenceIds.filter(
      (id: string) => !unlockedEvidenceIds.has(id)
    );

    if (missingRequired.length > 0) {
      return res.status(400).json({
        error: 'Cannot make accusation: missing required evidence',
        missing_count: missingRequired.length,
        total_required: requiredEvidenceIds.length
      });
    }

    // Find the accused suspect
    const accusedSuspect = game.cases.suspects.find(
      (s: any) => s.suspect_id === accused_suspect_id
    );

    if (!accusedSuspect) {
      return res.status(400).json({
        error: 'Invalid suspect_id: suspect not found in this case'
      });
    }

    // Find the guilty suspect
    const guiltySuspect = game.cases.suspects.find(
      (s: any) => s.is_guilty === true
    );

    // Determine if accusation is correct
    const isCorrect = accused_suspect_id === guiltySuspect?.suspect_id;

    // Prepare final outcome
    const finalOutcome = {
      accused_suspect_id,
      accused_suspect_name: accusedSuspect.name,
      guilty_suspect_id: guiltySuspect?.suspect_id,
      guilty_suspect_name: guiltySuspect?.name || 'Unknown',
      is_correct: isCorrect,
      evidence_collected: unlockedEvidence?.length || 0,
      total_evidence: game.cases.evidence_lookup.length,
      required_evidence_collected: requiredEvidenceIds.length,
      completed_at: new Date().toISOString()
    };

    // Update game session to completed
    const { error: updateError } = await supabase
      .from('games')
      .update({
        is_completed: true,
        final_outcome: finalOutcome,
        last_updated: new Date().toISOString()
      })
      .eq('game_id', game_id);

    if (updateError) {
      console.error('Game update error:', updateError);
      return res.status(500).json({
        error: 'Failed to update game session'
      });
    }

    // Prepare response message
    const message = isCorrect
      ? `Congratulations! You correctly identified ${accusedSuspect.name} as the guilty party. The case is solved!`
      : `Incorrect! You accused ${accusedSuspect.name}, but ${guiltySuspect?.name} was actually guilty. Case closed, but the real culprit remains at large.`;

    return res.json({
      success: true,
      result: {
        is_correct: isCorrect,
        game_over: true,
        message,
        guilty_suspect: {
          suspect_id: guiltySuspect?.suspect_id,
          name: guiltySuspect?.name,
          backstory: guiltySuspect?.backstory
        },
        accused_suspect: {
          suspect_id: accusedSuspect.suspect_id,
          name: accusedSuspect.name,
          backstory: accusedSuspect.backstory
        },
        evidence_collected: unlockedEvidence?.length || 0,
        total_evidence: game.cases.evidence_lookup.length,
        required_evidence_collected: requiredEvidenceIds.length
      }
    });

  } catch (error) {
    console.error('Accusation error:', error);
    return res.status(500).json({
      error: 'Internal server error during accusation'
    });
  }
});

export default router;
