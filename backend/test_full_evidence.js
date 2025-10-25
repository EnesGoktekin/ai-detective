/**
 * Comprehensive Evidence Detection Test
 * Tests the entire evidence unlock flow end-to-end
 */

const {createClient} = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
const API_URL = 'http://localhost:3000';
const CASE_ID = 'ade8cb07-d233-405b-bc34-edaa39af4d80'; // The Silent Watchman

async function runFullTest() {
  console.log('🧪 COMPREHENSIVE EVIDENCE DETECTION TEST\n');
  console.log('=' .repeat(60));
  
  try {
    // Step 1: Verify Keywords in Database
    console.log('\n📊 Step 1: Verifying Database Keywords...');
    const {data: evidence} = await supabase
      .from('evidence_lookup')
      .select('display_name, unlock_keywords, is_required_for_accusation')
      .eq('case_id', CASE_ID);
    
    console.log(`✅ Found ${evidence.length} evidence items:`);
    evidence.forEach(e => {
      const required = e.is_required_for_accusation ? '⚠️  REQUIRED' : '  Optional';
      console.log(`  ${required} | ${e.display_name}`);
      console.log(`    Keywords: ${e.unlock_keywords.slice(0, 5).join(', ')}...`);
    });
    
    //Step 2: Create New Game
    console.log('\n🎮 Step 2: Creating New Game...');
    const gameRes = await fetch(`${API_URL}/api/games/start`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({case_id: CASE_ID})
    });
    const gameData = await gameRes.json();
    
    if (!gameData.success) {
      throw new Error('Failed to create game: ' + JSON.stringify(gameData));
    }
    
    const GAME_ID = gameData.game.game_id;  // Fixed: game_id is inside game object
    console.log(`✅ Game created: ${GAME_ID}`);
    
    // Step 3: Test Turkish Keywords
    console.log('\n🇹🇷 Step 3: Testing Turkish Keywords...');
    const testMessages = [
      'kayıt defteri demek',  // Should unlock "Blank Security Log"
      'dantel mendil var mı', // Should unlock "Lace Handkerchief"  
      'kırık saat buldum'     // Should unlock "Broken Wristwatch"
    ];
    
    for (const msg of testMessages) {
      console.log(`\n  Sending: "${msg}"`);
      const chatRes = await fetch(`${API_URL}/api/games/${GAME_ID}/chat`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({message: msg})
      });
      
      const chatData = await chatRes.json();
      if (chatData.success) {
        console.log(`  ✅ Response received`);
        console.log(`  📦 Evidence unlocked: ${chatData.new_evidence_unlocked.length}`);
        if (chatData.new_evidence_unlocked.length > 0) {
          console.log(`     IDs: ${chatData.new_evidence_unlocked.join(', ')}`);
        }
      } else {
        console.log(`  ❌ Error: ${chatData.error}`);
      }
      
      // Small delay
      await new Promise(r => setTimeout(r, 1000));
    }
    
    // Step 4: Check Final Evidence Stats
    console.log('\n📈 Step 4: Checking Final Evidence Stats...');
    const statsRes = await fetch(`${API_URL}/api/evidence/game/${GAME_ID}/stats`);
    const statsData = await statsRes.json();
    
    if (statsData.success && statsData.stats) {
      console.log(`  Total Evidence: ${statsData.stats.total_evidence}`);
      console.log(`  Unlocked: ${statsData.stats.unlocked_count}`);
      console.log(`  Required: ${statsData.stats.required_count}`);
      console.log(`  Required Unlocked: ${statsData.stats.required_unlocked}`);
      console.log(`  Can Accuse: ${statsData.stats.can_make_accusation ? '✅ YES' : '❌ NO'}`);
      console.log(`  Progress: ${statsData.stats.progress_percent}%`);
    } else {
      console.log(`  ❌ Error: ${statsData.error || 'Unknown error'}`);
    }
    
    // Step 5: Get Unlocked Evidence Details
    console.log('\n🔓 Step 5: Unlocked Evidence Details...');
    const unlockedRes = await fetch(`${API_URL}/api/evidence/game/${GAME_ID}/unlocked`);
    const unlockedData = await unlockedRes.json();
    
    if (unlockedData.success && unlockedData.unlocked_evidence && unlockedData.unlocked_evidence.length > 0) {
      console.log(`✅ ${unlockedData.unlocked_evidence.length} evidence unlocked:`);
      unlockedData.unlocked_evidence.forEach(e => {
        const evidenceName = e.evidence_lookup?.display_name || 'Unknown';
        const required = e.evidence_lookup?.is_required_for_accusation ? '⚠️  REQUIRED' : '  Optional';
        console.log(`  ${required} - ${evidenceName}`);
      });
    } else {
      console.log('❌ No evidence unlocked!');
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ TEST COMPLETE');
    console.log('='.repeat(60));
    
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ TEST FAILED:');
    console.error(error);
    process.exit(1);
  }
}

runFullTest();
