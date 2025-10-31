-- Migration: Add current_progress_snapshot to games table
-- Date: 2025-10-31
-- Description: Adds JSONB column to store progress snapshot for quick access

-- Add current_progress_snapshot column to games table
ALTER TABLE public.games 
ADD COLUMN IF NOT EXISTS current_progress_snapshot JSONB NULL;

-- Add comment to explain the column
COMMENT ON COLUMN public.games.current_progress_snapshot IS 
'Stores current game progress snapshot including completed paths, unlocked evidence count, and last activity timestamp. Updated on each path progress.';

-- Example data structure:
-- {
--   "last_updated": "2025-10-31T10:30:00Z",
--   "unlocked_evidence_count": 3,
--   "completed_paths": 2,
--   "active_paths": [
--     {
--       "path_id": "uuid",
--       "last_completed_step": 2,
--       "total_steps": 5
--     }
--   ]
-- }
