/**
 * Quick script to check scene_objects data
 */

import * as dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_ANON_KEY || ''
);

async function checkSceneObjects() {
  console.log('Fetching scene_objects...\n');
  
  const { data, error } = await supabase
    .from('scene_objects')
    .select('name, main_location, initial_description')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('Scene Objects Data:');
  console.log('='.repeat(80));
  
  data?.forEach((obj, index) => {
    console.log(`\n${index + 1}. ${obj.name}`);
    console.log(`   Location: ${obj.main_location}`);
    console.log(`   Description: ${obj.initial_description}`);
    console.log('-'.repeat(80));
  });

  console.log(`\nTotal: ${data?.length} objects found`);
}

checkSceneObjects()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
