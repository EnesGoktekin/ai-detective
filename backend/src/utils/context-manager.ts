/**
 * AI Context Manager
 * 
 * Manages what context the Chat AI receives
 * Handles message retrieval, summary management, and context assembly
 * 
 * Phase 4, Step 4.4
 */

import { supabase } from './database';

interface Message {
  message_id: string;
  game_id: string;
  sequence_number: number;
  sender: 'user' | 'ai';
  content: string;
  created_at: string;
}

interface AIContext {
  summary: string | null;
  recentMessages: Array<{
    sender: 'user' | 'ai';
    content: string;
  }>;
}

/**
 * Get last N messages for a game session
 * Retrieves messages in order (oldest to newest)
 * 
 * @param gameId - Game session ID
 * @param limit - Number of messages to retrieve (default: 10 for last 5 user + 5 AI)
 * @returns Array of messages
 */
export async function getRecentMessages(
  gameId: string,
  limit: number = 10
): Promise<Message[]> {
  try {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('game_id', gameId)
      .order('sequence_number', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching recent messages:', error);
      throw new Error('Failed to fetch recent messages');
    }

    // Reverse to get chronological order (oldest first)
    return (data || []).reverse();
  } catch (error) {
    console.error('Context Manager - getRecentMessages error:', error);
    throw error;
  }
}

/**
 * Get current conversation summary
 * 
 * @param gameId - Game session ID
 * @returns Summary text or null if no summary yet
 */
export async function getCurrentSummary(gameId: string): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('games')
      .select('current_summary')
      .eq('game_id', gameId)
      .single();

    if (error) {
      console.error('Error fetching summary:', error);
      throw new Error('Failed to fetch summary');
    }

    return data?.current_summary || null;
  } catch (error) {
    console.error('Context Manager - getCurrentSummary error:', error);
    throw error;
  }
}

/**
 * Assemble complete AI context
 * Combines summary + recent messages
 * This is what gets sent to Chat AI
 * 
 * @param gameId - Game session ID
 * @returns AI context object
 */
export async function assembleAIContext(gameId: string): Promise<AIContext> {
  try {
    // Get summary and recent messages in parallel
    const [summary, messages] = await Promise.all([
      getCurrentSummary(gameId),
      getRecentMessages(gameId, 10), // Last 10 messages (5 user + 5 AI typically)
    ]);

    // Format messages for AI
    const recentMessages = messages.map(msg => ({
      sender: msg.sender,
      content: msg.content,
    }));

    return {
      summary,
      recentMessages,
    };
  } catch (error) {
    console.error('Context Manager - assembleAIContext error:', error);
    throw error;
  }
}

/**
 * Get message count for a game session
 * Used to determine when to trigger summarization
 * 
 * @param gameId - Game session ID
 * @returns Current message count
 */
export async function getMessageCount(gameId: string): Promise<number> {
  try {
    const { data, error } = await supabase
      .from('games')
      .select('message_count')
      .eq('game_id', gameId)
      .single();

    if (error) {
      console.error('Error fetching message count:', error);
      throw new Error('Failed to fetch message count');
    }

    return data?.message_count || 0;
  } catch (error) {
    console.error('Context Manager - getMessageCount error:', error);
    throw error;
  }
}

/**
 * Update conversation summary in database
 * 
 * @param gameId - Game session ID
 * @param newSummary - New summary text
 */
export async function updateSummary(
  gameId: string,
  newSummary: string
): Promise<void> {
  try {
    const { error } = await supabase
      .from('games')
      .update({
        current_summary: newSummary,
        last_updated: new Date().toISOString(),
      })
      .eq('game_id', gameId);

    if (error) {
      console.error('Error updating summary:', error);
      throw new Error('Failed to update summary');
    }
  } catch (error) {
    console.error('Context Manager - updateSummary error:', error);
    throw error;
  }
}

/**
 * Increment message count
 * Called after each user message is saved
 * 
 * @param gameId - Game session ID
 * @returns New message count
 */
export async function incrementMessageCount(gameId: string): Promise<number> {
  try {
    // Get current count
    const currentCount = await getMessageCount(gameId);
    const newCount = currentCount + 1;

    // Update count
    const { error } = await supabase
      .from('games')
      .update({
        message_count: newCount,
        last_updated: new Date().toISOString(),
      })
      .eq('game_id', gameId);

    if (error) {
      console.error('Error incrementing message count:', error);
      throw new Error('Failed to increment message count');
    }

    return newCount;
  } catch (error) {
    console.error('Context Manager - incrementMessageCount error:', error);
    throw error;
  }
}

/**
 * Check if summarization should be triggered
 * Per project spec: Every 5 user messages
 * 
 * @param messageCount - Current message count
 * @returns True if summarization should trigger
 */
export function shouldTriggerSummarization(messageCount: number): boolean {
  // Trigger every 5 user messages
  // Note: message_count increments on EACH user message
  return messageCount > 0 && messageCount % 5 === 0;
}
