/**
 * Chat Routes
 * 
 * Main gameplay interaction endpoint with hierarchical evidence discovery
 * Handles user messages, AI responses, evidence unlocking
 * 
 * Phase 12: Hierarchical Evidence System Integration
 */

import { Router, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import { generateChatResponse } from '../services/gemini.service';
import { tracingMiddleware } from '../middleware/tracing.middleware';
import { logger } from '../services/logger.service';
import {
  getGamePathProgress,
  getAllNextStepsForCase,
  updatePathProgress,
} from '../services/database.service';
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
 * Mock unlockEvidence function
 * TODO: Replace with actual implementation
 */
async function unlockEvidence(gameId: string, pathId: string, traceId: string): Promise<void> {
  logger.info(`[MOCK] Unlocking evidence for game: ${gameId}, path: ${pathId}`, traceId);
  // Actual implementation will unlock evidence in evidence_unlocked table
}

/**
 * POST /api/games/:game_id/chat
 * 
 * Send a user message and get AI response with hierarchical evidence discovery
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
 *   "summary_triggered": true,
 *   "discovery_progress": {
 *     "step_completed": true,
 *     "description": "You discovered something important..."
 *   }
 * }
 */
router.post('/:game_id/chat', tracingMiddleware, async (req: Request, res: Response): Promise<void> => {
  const traceId = req.traceId;
  
  try {
    const { game_id } = req.params;
    const { message } = req.body;

    logger.info(`[Chat] New message for game: ${game_id}`, traceId);

    if (!game_id) {
      logger.debug('[Chat] Missing game_id parameter', traceId);
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
    // STEP 4: Hierarchical Evidence Discovery
    // ============================================

    logger.debug(`[Chat] Starting hierarchical evidence discovery for case: ${game.case_id}`, traceId);

    // Get current game path progress
    const progressList = await getGamePathProgress(game_id, traceId);
    
    // Get all next available steps for this case
    const availableNextSteps = await getAllNextStepsForCase(
      game.case_id,
      traceId,
      progressList
    );

    logger.debug(
      `[Chat] Found ${availableNextSteps.length} available next steps to check`,
      traceId
    );

    // Check user message against available steps
    let foundNextStep = null;
    let matchedKeyword = '';

    for (const step of availableNextSteps) {
      // Split unlock_keyword by comma and check each keyword
      const keywords = step.unlock_keyword.split(',').map(k => k.trim().toLowerCase());
      const userMessageLower = trimmedMessage.toLowerCase();

      for (const keyword of keywords) {
        if (userMessageLower.includes(keyword)) {
          foundNextStep = step;
          matchedKeyword = keyword;
          logger.info(
            `[Chat] Matched keyword "${keyword}" in step ${step.step_number} of path ${step.path_id}`,
            traceId
          );
          break;
        }
      }

      if (foundNextStep) break;
    }

    // Process matched step
    let newlyUnlockedEvidence: string[] = [];
    let discoveryProgress = null;

    if (foundNextStep) {
      // Update path progress
      await updatePathProgress(
        game_id,
        foundNextStep.path_id,
        foundNextStep.step_number,
        traceId
      );

      // Check if this step unlocks evidence
      if (foundNextStep.is_unlock_trigger) {
        logger.error(
          `[CRITICAL] Evidence unlock triggered! Path: ${foundNextStep.path_id}, Step: ${foundNextStep.step_number}`,
          new Error('Evidence unlock trigger'),
          traceId
        );

        // Call mock unlockEvidence function
        await unlockEvidence(game_id, foundNextStep.path_id, traceId);
        
        // TODO: Get actual evidence IDs from database
        newlyUnlockedEvidence = [foundNextStep.path_id]; // Placeholder
      }

      discoveryProgress = {
        step_completed: true,
        step_number: foundNextStep.step_number,
        path_id: foundNextStep.path_id,
        description: foundNextStep.ai_description,
        matched_keyword: matchedKeyword,
      };

      logger.info(
        `[Chat] Discovery progress updated for game ${game_id}`,
        traceId
      );
    }

    // ============================================
    // STEP 5: Assemble AI Context with Discovery Info
    // ============================================

    const aiContext = await assembleAIContext(game_id);

    // Get unlocked evidence for AI context
    const { data: unlockedEvidenceDetails } = await supabase
      .from('evidence_unlocked')
      .select(`
        evidence_id,
        evidence_lookup (
          display_name,
          description
        )
      `)
      .eq('game_id', game_id);

    const unlockedEvidenceForAI = (unlockedEvidenceDetails || []).map((item: any) => ({
      name: item.evidence_lookup?.display_name || 'Unknown',
      description: item.evidence_lookup?.description || 'No description',
      location: 'Unknown', // Placeholder for compatibility
    }));

    // ============================================
    // STEP 6: Generate AI Response with Discovery Context
    // ============================================

    // Prepare case context for AI
    const caseContext = {
      case_title: game.cases.title,
      case_description: game.cases.description,
      initial_prompt_data: game.cases.initial_prompt_data,
      suspects: game.cases.suspects || [],
      scene_objects: game.cases.scene_objects || [],
      evidence_lookup: (game.cases.evidence_lookup || []).map((ev: any) => ({
        name: ev.display_name,
        description: ev.description,
      })),
    };

    // Enhance AI context with discovery information
    const enhancedContext = {
      ...caseContext,
      discovery: foundNextStep ? foundNextStep.ai_description : null,
      isFinalEvidence: foundNextStep ? foundNextStep.is_unlock_trigger : false,
    };

    logger.debug('[Chat] Generating AI response with enhanced context', traceId);

    // Log AI prompt content for debugging (deployment verification)
    const promptPreview = {
      userMessage: trimmedMessage,
      caseTitle: enhancedContext.case_title,
      discovery: enhancedContext.discovery,
      isFinalEvidence: enhancedContext.isFinalEvidence,
      unlockedEvidenceCount: unlockedEvidenceForAI.length,
      recentMessagesCount: aiContext.recentMessages.length,
      hasSummary: !!aiContext.summary,
    };
    
    logger.debug(
      `[AI_PROMPT_PREVIEW] ${JSON.stringify(promptPreview)}`,
      traceId
    );

    const aiResponse = await generateChatResponse(
      enhancedContext,
      unlockedEvidenceForAI,
      aiContext.summary,
      aiContext.recentMessages,
      trimmedMessage
    );

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
      logger.error('[Chat] Failed to store AI message', aiMessageError, traceId);
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
    // STEP 9: Return Response with Discovery Progress
    // ============================================

    logger.info(`[Chat] Request completed successfully for game: ${game_id}`, traceId);

    res.status(200).json({
      success: true,
      ai_response: aiResponse,
      new_evidence_unlocked: newlyUnlockedEvidence,
      message_count: newMessageCount,
      summary_triggered: summaryTriggered,
      discovery_progress: discoveryProgress,
    });

  } catch (error) {
    logger.error('[Chat] Endpoint error', error as Error, traceId);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

export default router;
