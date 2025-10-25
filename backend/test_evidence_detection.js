// Test evidence detection with actual API call

const GAME_ID = 'e90b3121-9da7-4e51-baaa-e0b79951f821'; // From screenshot
const API_URL = 'http://localhost:3000';

async function testEvidenceDetection() {
  console.log('🧪 Testing Evidence Detection...\n');
  
  // Test 1: Send message with Turkish keyword
  console.log('Test 1: Sending message with "kayıt defteri"');
  const response1 = await fetch(`${API_URL}/api/games/${GAME_ID}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: 'kayıt defteri demek' })
  });
  
  const result1 = await response1.json();
  console.log('Response:', result1.success ? '✅ Success' : '❌ Failed');
  console.log('AI Response:', result1.ai_response?.substring(0, 100) + '...');
  console.log('Evidence unlocked:', result1.new_evidence_unlocked);
  console.log('\n---\n');
  
  // Check unlocked evidence
  console.log('Checking unlocked evidence in database...');
  const response2 = await fetch(`${API_URL}/api/evidence/game/${GAME_ID}/unlocked`);
  const result2 = await response2.json();
  console.log('Total unlocked:', result2.evidence?.length || 0);
  if (result2.evidence) {
    result2.evidence.forEach(e => console.log('  -', e.name));
  }
}

testEvidenceDetection()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
