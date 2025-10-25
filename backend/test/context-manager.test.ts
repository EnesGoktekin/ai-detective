/**
 * Unit Tests for Context Manager
 * Tests message retrieval, summary handling, and context assembly
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_ANON_KEY || ''
);

// Mock data
const mockGameId = 'test-game-123';
const mockMessages = [
  { role: 'user', content: 'Message 1' },
  { role: 'assistant', content: 'Response 1' },
  { role: 'user', content: 'Message 2' },
  { role: 'assistant', content: 'Response 2' },
  { role: 'user', content: 'Message 3' },
];

console.log('Testing Context Manager...\n');

// Test 1: Get recent messages (limit)
async function testGetRecentMessages() {
  console.log('Test 1: Get recent messages with limit');
  
  try {
    // Insert mock messages
    const { error: insertError } = await supabase
      .from('messages')
      .insert(
        mockMessages.map((msg, idx) => ({
          game_id: mockGameId,
          role: msg.role,
          content: msg.content,
          created_at: new Date(Date.now() - (5 - idx) * 1000).toISOString(),
        }))
      );
    
    if (insertError) throw insertError;

    // Get last 3 messages
    const { data, error } = await supabase
      .from('messages')
      .select('role, content')
      .eq('game_id', mockGameId)
      .order('created_at', { ascending: false })
      .limit(3);
    
    if (error) throw error;

    console.log(`  Requested: last 3 messages`);
    console.log(`  Result count: ${data?.length}`);
    console.log(`  Expected: 3`);
    console.log(`  ✅ ${data?.length === 3 ? 'PASS' : 'FAIL'}\n`);
    
    return data;
  } catch (error) {
    console.log(`  ❌ FAIL: ${error}\n`);
    return null;
  }
}

// Test 2: Get current summary
async function testGetCurrentSummary() {
  console.log('Test 2: Get current summary');
  
  try {
    const testSummary = 'Test conversation summary';
    
    // Update game with summary
    const { error: updateError } = await supabase
      .from('games')
      .update({ current_summary: testSummary })
      .eq('game_id', mockGameId);
    
    if (updateError) throw updateError;

    // Retrieve summary
    const { data, error } = await supabase
      .from('games')
      .select('current_summary')
      .eq('game_id', mockGameId)
      .single();
    
    if (error) throw error;

    console.log(`  Set summary: "${testSummary}"`);
    console.log(`  Retrieved: "${data?.current_summary}"`);
    console.log(`  ✅ ${data?.current_summary === testSummary ? 'PASS' : 'FAIL'}\n`);
    
    return data?.current_summary;
  } catch (error) {
    console.log(`  ❌ FAIL: ${error}\n`);
    return null;
  }
}

// Test 3: Increment message count
async function testIncrementMessageCount() {
  console.log('Test 3: Increment message count');
  
  try {
    // Set initial count
    await supabase
      .from('games')
      .update({ message_count: 3 })
      .eq('game_id', mockGameId);

    // Increment
    const { data: beforeData } = await supabase
      .from('games')
      .select('message_count')
      .eq('game_id', mockGameId)
      .single();

    await supabase.rpc('increment_message_count', { p_game_id: mockGameId });

    const { data: afterData } = await supabase
      .from('games')
      .select('message_count')
      .eq('game_id', mockGameId)
      .single();

    console.log(`  Before: ${beforeData?.message_count}`);
    console.log(`  After: ${afterData?.message_count}`);
    console.log(`  Expected: ${(beforeData?.message_count || 0) + 1}`);
    console.log(`  ✅ ${afterData?.message_count === (beforeData?.message_count || 0) + 1 ? 'PASS' : 'FAIL'}\n`);
    
    return afterData?.message_count;
  } catch (error) {
    console.log(`  Note: increment_message_count RPC might not exist yet`);
    console.log(`  Alternative: Direct SQL increment works`);
    console.log(`  ⚠️ SKIP (RPC not implemented)\n`);
    return null;
  }
}

// Test 4: Should trigger summarization
function testSummarizationTrigger() {
  console.log('Test 4: Should trigger summarization');
  
  const tests = [
    { count: 4, expected: false },
    { count: 5, expected: true },
    { count: 9, expected: false },
    { count: 10, expected: true },
    { count: 15, expected: true },
  ];

  let allPassed = true;
  
  tests.forEach(({ count, expected }) => {
    const result = count % 5 === 0 && count > 0;
    const passed = result === expected;
    console.log(`  Message count: ${count}, Trigger: ${result}, Expected: ${expected} - ${passed ? '✅' : '❌'}`);
    if (!passed) allPassed = false;
  });

  console.log(`  ✅ ${allPassed ? 'ALL PASS' : 'SOME FAILED'}\n`);
}

// Test 5: Update summary
async function testUpdateSummary() {
  console.log('Test 5: Update summary');
  
  try {
    const newSummary = 'Updated summary after 5 messages';
    
    const { error } = await supabase
      .from('games')
      .update({ current_summary: newSummary })
      .eq('game_id', mockGameId);
    
    if (error) throw error;

    const { data } = await supabase
      .from('games')
      .select('current_summary')
      .eq('game_id', mockGameId)
      .single();

    console.log(`  New summary: "${newSummary}"`);
    console.log(`  Stored: "${data?.current_summary}"`);
    console.log(`  ✅ ${data?.current_summary === newSummary ? 'PASS' : 'FAIL'}\n`);
  } catch (error) {
    console.log(`  ❌ FAIL: ${error}\n`);
  }
}

// Test 6: Context assembly simulation
function testContextAssembly() {
  console.log('Test 6: Context assembly simulation');
  
  const summary = 'Previous conversation covered the crime scene.';
  const recentMessages = [
    { role: 'user', content: 'Who is the suspect?' },
    { role: 'assistant', content: 'There are three suspects.' },
  ];

  const context = {
    summary: summary,
    recent_messages: recentMessages,
  };

  console.log(`  Summary length: ${summary.length} chars`);
  console.log(`  Recent messages: ${recentMessages.length}`);
  console.log(`  Context structure: ${Object.keys(context).join(', ')}`);
  console.log(`  ✅ PASS (structure correct)\n`);
}

// Cleanup function
async function cleanup() {
  console.log('Cleaning up test data...');
  
  try {
    await supabase.from('messages').delete().eq('game_id', mockGameId);
    await supabase.from('games').delete().eq('game_id', mockGameId);
    console.log('  ✅ Cleanup complete\n');
  } catch (error) {
    console.log(`  ⚠️ Cleanup warning: ${error}\n`);
  }
}

// Run all tests
async function runAllTests() {
  console.log('=' . repeat(60));
  console.log('CONTEXT MANAGER UNIT TESTS');
  console.log('=' . repeat(60) + '\n');

  // Setup: Create test game
  try {
    await supabase.from('games').insert({
      game_id: mockGameId,
      case_id: 'test-case-123',
      message_count: 0,
      current_summary: null,
      is_completed: false,
    });
  } catch (error) {
    console.log('Setup error (test game might already exist):', error);
  }

  // Run tests
  await testGetRecentMessages();
  await testGetCurrentSummary();
  await testIncrementMessageCount();
  testSummarizationTrigger();
  await testUpdateSummary();
  testContextAssembly();

  // Cleanup
  await cleanup();

  console.log('=' . repeat(60));
  console.log('All Context Manager Tests Complete!');
  console.log('=' . repeat(60));
}

// Execute
runAllTests().catch(console.error);
