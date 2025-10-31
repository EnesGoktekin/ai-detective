-- ============================================================================
-- FIX: Lace Handkerchief Evidence Path - Step 2 Description Update
-- ============================================================================
-- 
-- Problem: AI says "coat pocket is empty" at Step 2, preventing progression to Step 3
-- Root Cause: Step 2 description doesn't indicate there's something in the pocket
-- 
-- Solution: Update Step 2 (Coat Pocket) ai_description to clearly indicate 
--           a soft object is found, prompting user to investigate further
-- 
-- Evidence Path: Lace Handkerchief (23a27194-7e9c-45b6-b6c9-239f63e9b001)
-- Steps:
--   Step 1: Victim's Coat (keyword: "ceket", "coat")
--   Step 2: Coat Pocket (keyword: "cep", "pocket") ← FIXING THIS
--   Step 3: Lace Handkerchief (keyword: "mendil", "dantel", "handkerchief")
-- ============================================================================

-- Update Step 2: Coat Pocket description
-- New description clearly indicates something is found in the pocket
UPDATE public.evidence_discovery_paths
SET ai_description = 'I checked the coat pocket. It is not empty; I found a small, soft object tucked inside. What should I do with it?'
WHERE path_id = '23a27194-7e9c-45b6-b6c9-239f63e9b001' 
  AND step_number = 2;

-- Verify the update
SELECT 
    path_id,
    step_number,
    object_name,
    unlock_keyword,
    ai_description,
    is_unlock_trigger
FROM public.evidence_discovery_paths
WHERE path_id = '23a27194-7e9c-45b6-b6c9-239f63e9b001'
ORDER BY step_number;

-- Expected Result:
-- Step 1: Victim's Coat - "Examine the victim's coat more closely..."
-- Step 2: Coat Pocket - "I checked the coat pocket. It is not empty; I found a small, soft object..." ← UPDATED
-- Step 3: Lace Handkerchief - "You found a silk handkerchief..." (is_unlock_trigger = true)
