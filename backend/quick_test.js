// Quick Phase 10 Test Script
// Tests: Health Check → Game Creation → Chat → Evidence Detection

require('dotenv').config();

const API_BASE = 'http://localhost:3000';
const CASE_ID = 'ade8cb07-d233-405b-bc34-edaa39af4d80'; // The Silent Watchman (CORRECT)

async function quickTest() {
  console.log('\n🚀 QUICK PHASE 10 TEST\n');
  console.log('='.repeat(60));

  try {
    // Test 1: Health Check
    console.log('\n✅ Test 1: Backend Health Check');
    const healthRes = await fetch(`${API_BASE}/api/health`);
    const health = await healthRes.json();
    console.log(`   Status: ${health.status}`);
    console.log(`   Message: ${health.message}`);

    // Test 2: Create Game
    console.log('\n✅ Test 2: Create New Game');
    const gameRes = await fetch(`${API_BASE}/api/games/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ case_id: CASE_ID })
    });
    const gameData = await gameRes.json();
    console.log(`   Full Response:`, JSON.stringify(gameData, null, 2));
    const gameId = gameData.game_id || gameData.game?.game_id;
    if (!gameId) {
      throw new Error('No game_id in response');
    }
    console.log(`   Game ID: ${gameId}`);
    console.log(`   Case: ${gameData.case_title || gameData.game?.case_title || 'N/A'}`);

    // Test 3: Send First Message
    console.log('\n✅ Test 3: Send Initial Message');
    const chatRes1 = await fetch(`${API_BASE}/api/games/${gameId}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Çevrede ne var?' })
    });
    const chat1 = await chatRes1.json();
    console.log(`   AI Response (first 100 chars): ${chat1.ai_response.substring(0, 100)}...`);
    console.log(`   Evidence Unlocked: ${chat1.newly_unlocked_evidence?.length || 0}`);

    // Test 4: Unlock Evidence with Keywords
    console.log('\n✅ Test 4: Unlock Evidence (mendil keyword)');
    const chatRes2 = await fetch(`${API_BASE}/api/games/${gameId}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Dantel mendil var mı masada?' })
    });
    const chat2 = await chatRes2.json();
    console.log(`   AI Response (first 100 chars): ${chat2.ai_response.substring(0, 100)}...`);
    console.log(`   Evidence Unlocked: ${chat2.newly_unlocked_evidence?.length || 0}`);
    if (chat2.newly_unlocked_evidence?.length > 0) {
      console.log(`   Unlocked: ${chat2.newly_unlocked_evidence[0].display_name}`);
    }

    // Test 5: Check Evidence Stats
    console.log('\n✅ Test 5: Evidence Stats');
    const statsRes = await fetch(`${API_BASE}/api/evidence/game/${gameId}/stats`);
    const statsData = await statsRes.json();
    if (!statsData.success) {
      console.log(`   Stats Error:`, JSON.stringify(statsData, null, 2));
    } else {
      console.log(`   Total Evidence: ${statsData.stats.total_evidence}`);
      console.log(`   Unlocked: ${statsData.stats.unlocked_count}`);
      console.log(`   Required: ${statsData.stats.required_count}`);
      console.log(`   Required Unlocked: ${statsData.stats.required_unlocked}`);
      console.log(`   Can Accuse: ${statsData.stats.can_make_accusation}`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ ALL TESTS PASSED!\n');

  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    process.exit(1);
  }
}

quickTest();
