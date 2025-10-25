/**
 * Chat Routes
 * 
 * Main gameplay interaction endpoint
 * Handles user messages, AI responses, evidence unlocking
 * 
 * Phase 5, Step 5.2
 */

import { Router, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import { generateChatResponse } from '../services/gemini.service';
import { detectEvidenceInMessage } from '../utils/evidence-detection';
import {
  assembleAIContext,
  incrementMessageCount,
  shouldTriggerSummarization,
} from '../utils/context-manager';

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_ANON_KEY || ''
);

const router = Router();

/**
 * POST /api/games/:game_id/chat
 * 
 * Send a user message and get AI response
 * 
 * Request body:
 * {
 *   "message": "Who are the suspects?"
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "ai_response": "There are three main suspects...",
 *   "new_evidence_unlocked": ["ev-123", "ev-456"],
 *   "message_count": 6,
 *   "summary_triggered": true
 * }
 */
router.post('/:game_id/chat', async (req: Request, res: Response): Promise<void> => {
  try {
    const { game_id } = req.params;
    const { message } = req.body;

    if (!game_id) {
      res.status(400).json({
        success: false,
        error: 'Game ID is required',
      });
      return;
    }

    // ============================================
    // STEP 1: Input Validation
    // ============================================

    if (!message || typeof message !== 'string') {
      res.status(400).json({
        success: false,
        error: 'Message is required and must be a string',
      });
      return;
    }

    const trimmedMessage = message.trim();

    // Check for empty message
    if (trimmedMessage.length === 0) {
      res.status(400).json({
        success: false,
        error: 'Message cannot be empty',
      });
      return;
    }

    // Check for single character (MVP requirement: no single characters)
    if (trimmedMessage.length === 1) {
      res.status(400).json({
        success: false,
        error: 'Message must be at least 2 characters long',
      });
      return;
    }

    // Check for alphabetic characters (MVP requirement: no non-alphabetic messages)
    // Allow letters, spaces, and basic punctuation
    const hasAlphabetic = /[a-zA-Z]/.test(trimmedMessage);
    if (!hasAlphabetic) {
      res.status(400).json({
        success: false,
        error: 'Message must contain at least one alphabetic character',
      });
      return;
    }

    // ============================================
    // STEP 2: Get Game Session
    // ============================================

    const { data: game, error: gameError } = await supabase
      .from('games')
      .select(`
        *,
        cases (
          case_id,
          title,
          description,
          initial_prompt_data,
          suspects(*),
          scene_objects(*),
          evidence_lookup(*)
        )
      `)
      .eq('game_id', game_id)
      .single();

    if (gameError || !game) {
      res.status(404).json({
        success: false,
        error: 'Game session not found',
      });
      return;
    }

    // Check if game already completed
    if (game.is_completed) {
      res.status(400).json({
        success: false,
        error: 'This game has already been completed',
      });
      return;
    }

    // ============================================
    // STEP 3: Store User Message
    // ============================================

    // Get current message count for sequence number
    const { data: messageCountData } = await supabase
      .from('messages')
      .select('sequence_number')
      .eq('game_id', game_id)
      .order('sequence_number', { ascending: false })
      .limit(1);

    const nextSequenceNumber = messageCountData && messageCountData.length > 0 && messageCountData[0]
      ? messageCountData[0].sequence_number + 1
      : 1;

    const { error: userMessageError } = await supabase
      .from('messages')
      .insert({
        game_id,
        sequence_number: nextSequenceNumber,
        sender: 'user',
        content: trimmedMessage,
      });

    if (userMessageError) {
      console.error('Error storing user message:', userMessageError);
      res.status(500).json({
        success: false,
        error: 'Failed to store user message',
      });
      return;
    }

    // ============================================
    // STEP 4: Evidence Detection
    // ============================================

    // Get all evidence for this case
    const { data: caseEvidence, error: evidenceError } = await supabase
      .from('evidence_lookup')
      .select('*')
      .eq('case_id', game.case_id);

    if (evidenceError) {
      console.error('Error fetching evidence:', evidenceError);
    }

    // Get already unlocked evidence
    const { data: unlockedEvidence } = await supabase
      .from('evidence_unlocked')
      .select('evidence_id')
      .eq('game_id', game_id);

    const alreadyUnlocked = unlockedEvidence?.map(e => e.evidence_id) || [];

    // Detect new evidence in user message
    const newlyDetectedEvidence = caseEvidence
      ? detectEvidenceInMessage(trimmedMessage, caseEvidence, alreadyUnlocked)
      : [];

    // Unlock newly detected evidence
    if (newlyDetectedEvidence.length > 0) {
      const evidenceToInsert = newlyDetectedEvidence.map(evidenceId => ({
        game_id,
        evidence_id: evidenceId,
      }));

      const { error: unlockError } = await supabase
        .from('evidence_unlocked')
        .insert(evidenceToInsert);

      if (unlockError) {
        console.error('Error unlocking evidence:', unlockError);
      }
    }

    // ============================================
    // STEP 5: Assemble AI Context
    // ============================================

    const aiContext = await assembleAIContext(game_id);

    // ============================================
    // STEP 6: Generate AI Response
    // ============================================

    // Prepare case context for AI
    const caseContext = {
      case_title: game.cases.title,
      case_description: game.cases.description,
      initial_prompt_data: game.cases.initial_prompt_data,
      suspects: game.cases.suspects || [],
      scene_objects: game.cases.scene_objects || [],
      evidence_lookup: game.cases.evidence_lookup || [],
    };

    const aiResponse = await generateChatResponse(
      caseContext,
      aiContext.summary,
      aiContext.recentMessages,
      trimmedMessage
    );

    // ============================================
    // STEP 6.5: Detect Evidence in AI Response
    // ============================================

    // Check AI response for evidence keywords too
    const evidenceInAIResponse = caseEvidence
      ? detectEvidenceInMessage(
          aiResponse, 
          caseEvidence, 
          [...alreadyUnlocked, ...newlyDetectedEvidence] // Don't re-unlock what we just unlocked
        )
      : [];

    // Unlock evidence detected in AI response
    if (evidenceInAIResponse.length > 0) {
      const aiEvidenceToInsert = evidenceInAIResponse.map(evidenceId => ({
        game_id,
        evidence_id: evidenceId,
      }));

      const { error: aiUnlockError } = await supabase
        .from('evidence_unlocked')
        .insert(aiEvidenceToInsert);

      if (aiUnlockError) {
        console.error('Error unlocking evidence from AI response:', aiUnlockError);
      }
    }

    // Combine all newly unlocked evidence
    const allNewlyUnlocked = [...newlyDetectedEvidence, ...evidenceInAIResponse];

    // ============================================
    // STEP 7: Store AI Response
    // ============================================

    const { error: aiMessageError } = await supabase
      .from('messages')
      .insert({
        game_id,
        sequence_number: nextSequenceNumber + 1,
        sender: 'ai',
        content: aiResponse,
      });

    if (aiMessageError) {
      console.error('Error storing AI message:', aiMessageError);
      res.status(500).json({
        success: false,
        error: 'Failed to store AI response',
      });
      return;
    }

    // ============================================
    // STEP 8: Increment Message Count & Check for Summarization
    // ============================================

    const newMessageCount = await incrementMessageCount(game_id);
    const summaryTriggered = shouldTriggerSummarization(newMessageCount);

    // Note: Actual summarization will happen in background or next request
    // For MVP, we'll just flag it

    // ============================================
    // STEP 9: Return Response
    // ============================================

    res.status(200).json({
      success: true,
      ai_response: aiResponse,
      new_evidence_unlocked: allNewlyUnlocked,
      message_count: newMessageCount,
      summary_triggered: summaryTriggered,
    });

  } catch (error) {
    console.error('Chat endpoint error:', error);
    console.error('Error details:', JSON.stringify(error, null, 2));
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

export default router;
