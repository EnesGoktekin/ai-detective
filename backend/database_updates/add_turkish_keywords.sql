-- Add Turkish keywords to evidence_lookup table
-- This improves evidence detection for Turkish conversations
-- Run this in Supabase SQL Editor

-- Case 1: The Museum Murder - Turkish Keywords

-- Lace Handkerchief - Add Turkish keywords
UPDATE evidence_lookup
SET unlock_keywords = array_cat(unlock_keywords, ARRAY[
  'mendil',
  'dantel',
  'ipek',
  'cep',
  'kumaş'
])
WHERE display_name = 'Lace Handkerchief';

-- Blank Security Log - Add Turkish keywords  
UPDATE evidence_lookup
SET unlock_keywords = array_cat(unlock_keywords, ARRAY[
  'kayıt',
  'günlük',
  'güvenlik',
  'defter',
  'boş'
])
WHERE display_name = 'Blank Security Log';

-- Broken Wristwatch - Add Turkish keywords
UPDATE evidence_lookup
SET unlock_keywords = array_cat(unlock_keywords, ARRAY[
  'saat',
  'kol saati',
  'kırık',
  'altın',
  'parçalanmış',
  'kırılmış'
])
WHERE display_name = 'Broken Wristwatch';

-- Verify updates
SELECT 
  display_name,
  unlock_keywords
FROM evidence_lookup
WHERE case_id = 'ade8cb07-d233-405b-bc34-edaa39af4d80'
ORDER BY display_name;
