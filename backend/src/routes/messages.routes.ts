import { Router, Request, Response } from 'express';
import { supabase } from '../utils/database';

const router = Router();

/**
 * GET /api/messages/:game_id
 * Get all messages for a game session
 */
router.get('/:game_id', async (req: Request, res: Response) => {
  try {
    const { game_id } = req.params;

    // Fetch messages ordered by sequence number
    const { data: messages, error } = await supabase
      .from('messages')
      .select('*')
      .eq('game_id', game_id)
      .order('sequence_number', { ascending: true });

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      messages: messages || [],
      count: messages?.length || 0,
    });
  } catch (error: any) {
    console.error('Error fetching messages:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch messages',
      details: error.message,
    });
  }
});

export default router;
