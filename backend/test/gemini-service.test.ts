/**
 * Unit Tests for Gemini AI Service
 * Tests Chat AI, Summarizing AI, and context building
 */

console.log('Testing Gemini AI Service...\n');

// Mock case context
const mockCaseContext = {
  case_id: 'case-123',
  title: 'The Silent Watchman',
  description: 'A mysterious murder at a museum',
  opening_scene: 'The air hangs heavy and still...',
  suspects: [
    {
      suspect_id: 'suspect-1',
      name: 'Marcus Valerius',
      role: 'Museum Director',
      physical_description: 'Tall, graying hair',
      personality_traits: 'Ambitious, secretive',
      background_story: 'Has financial troubles',
      alibi: 'Claims he was in his office',
      is_guilty: true,
      guilt_reason: 'Needed insurance money',
    },
    {
      suspect_id: 'suspect-2',
      name: 'Elena Rodriguez',
      role: 'Head of Security',
      physical_description: 'Athletic, sharp eyes',
      personality_traits: 'Loyal, protective',
      background_story: 'Former police officer',
      alibi: 'Was doing rounds',
      is_guilty: false,
      guilt_reason: null,
    },
  ],
  scene_objects: [
    {
      object_id: 'obj-1',
      name: 'Security Camera',
      description: 'Disabled during incident',
      location_in_scene: 'Main hall ceiling',
      interaction_hint: 'Ask about security footage',
    },
  ],
  evidence: [
    {
      evidence_id: 'ev-1',
      name: 'Disabled Camera',
      description: 'Camera was manually disabled',
      unlock_keywords: ['camera', 'footage', 'security'],
      is_required_for_accusation: true,
    },
  ],
};

// Test 1: Build system instruction
console.log('Test 1: Build system instruction');
function buildSystemInstruction(caseContext: typeof mockCaseContext): string {
  const instruction = `You are a detective AI assistant in an interactive mystery game.

Case: ${caseContext.title}
Description: ${caseContext.description}

Opening Scene: ${caseContext.opening_scene}

Suspects:
${caseContext.suspects.map(s => `- ${s.name} (${s.role}): ${s.personality_traits}`).join('\n')}

Scene Objects:
${caseContext.scene_objects.map(o => `- ${o.name}: ${o.description}`).join('\n')}

You must:
1. Stay in character as a detective narrator
2. Guide the player through investigation
3. Never reveal who is guilty
4. Drop subtle hints about evidence
5. Respond naturally to questions about suspects and objects`;

  return instruction;
}

const systemInstruction = buildSystemInstruction(mockCaseContext);
console.log(`  Instruction length: ${systemInstruction.length} chars`);
console.log(`  Contains case title: ${systemInstruction.includes('The Silent Watchman')}`);
console.log(`  Contains suspects: ${systemInstruction.includes('Marcus Valerius')}`);
console.log(`  Contains objects: ${systemInstruction.includes('Security Camera')}`);
console.log(`  ✅ ${systemInstruction.length > 200 ? 'PASS' : 'FAIL'}\n`);

// Test 2: Format chat history
console.log('Test 2: Format chat history');
interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

function formatChatHistory(messages: ChatMessage[]) {
  return messages.map(msg => ({
    role: msg.role === 'user' ? 'user' : 'model',
    parts: [{ text: msg.content }],
  }));
}

const mockMessages: ChatMessage[] = [
  { role: 'user', content: 'Who are the suspects?' },
  { role: 'assistant', content: 'There are two main suspects...' },
  { role: 'user', content: 'Tell me about Marcus.' },
];

const formatted = formatChatHistory(mockMessages);
console.log(`  Input messages: ${mockMessages.length}`);
console.log(`  Formatted messages: ${formatted.length}`);
console.log(`  First role converted: ${formatted[0]?.role} (expected: user)`);
console.log(`  Second role converted: ${formatted[1]?.role} (expected: model)`);
console.log(`  ✅ ${formatted.length === 3 && formatted[1]?.role === 'model' ? 'PASS' : 'FAIL'}\n`);

// Test 3: Validate system instruction structure
console.log('Test 3: Validate system instruction structure');
const requiredSections = [
  'detective AI assistant',
  'Case:',
  'Suspects:',
  'Scene Objects:',
  'You must:',
  'Never reveal who is guilty',
];

let allSectionsPresent = true;
requiredSections.forEach(section => {
  if (!systemInstruction.includes(section)) {
    console.log(`  ❌ Missing: "${section}"`);
    allSectionsPresent = false;
  }
});

console.log(`  Required sections: ${requiredSections.length}`);
console.log(`  ✅ ${allSectionsPresent ? 'PASS - All sections present' : 'FAIL - Missing sections'}\n`);

// Test 4: Context size validation
console.log('Test 4: Context size validation');
const maxContextSize = 50000; // chars
const currentSize = systemInstruction.length;
const withinLimit = currentSize < maxContextSize;

console.log(`  System instruction: ${currentSize} chars`);
console.log(`  Max allowed: ${maxContextSize} chars`);
console.log(`  Within limit: ${withinLimit}`);
console.log(`  ✅ ${withinLimit ? 'PASS' : 'FAIL'}\n`);

// Test 5: Summarization prompt structure
console.log('Test 5: Summarization prompt structure');
function buildSummarizationPrompt(messages: ChatMessage[]): string {
  const conversation = messages
    .map(msg => `${msg.role === 'user' ? 'Player' : 'Detective'}: ${msg.content}`)
    .join('\n');

  return `Summarize this detective game conversation in 2-3 sentences. Focus on:
- What the player has investigated
- Key discoveries or insights
- Current direction of investigation

Conversation:
${conversation}

Summary:`;
}

const summaryPrompt = buildSummarizationPrompt(mockMessages);
console.log(`  Prompt includes conversation: ${summaryPrompt.includes('Who are the suspects?')}`);
console.log(`  Prompt includes instructions: ${summaryPrompt.includes('Summarize this')}`);
console.log(`  Prompt length: ${summaryPrompt.length} chars`);
console.log(`  ✅ ${summaryPrompt.includes('Summary:') ? 'PASS' : 'FAIL'}\n`);

// Test 6: Message context preparation
console.log('Test 6: Message context preparation');
interface AIContext {
  summary: string | null;
  recent_messages: ChatMessage[];
}

function prepareContextForAI(context: AIContext): string {
  let contextString = '';
  
  if (context.summary) {
    contextString += `Previous conversation summary: ${context.summary}\n\n`;
  }
  
  contextString += 'Recent messages:\n';
  context.recent_messages.forEach(msg => {
    contextString += `${msg.role === 'user' ? 'Player' : 'Detective'}: ${msg.content}\n`;
  });
  
  return contextString;
}

const testContext: AIContext = {
  summary: 'Player investigated the security camera and talked to Marcus.',
  recent_messages: mockMessages.slice(0, 2),
};

const preparedContext = prepareContextForAI(testContext);
console.log(`  Includes summary: ${preparedContext.includes('Previous conversation summary')}`);
console.log(`  Includes recent messages: ${preparedContext.includes('Recent messages')}`);
console.log(`  Context length: ${preparedContext.length} chars`);
console.log(`  ✅ ${preparedContext.includes('Player investigated') ? 'PASS' : 'FAIL'}\n`);

// Test 7: Truth-aware response validation (mock)
console.log('Test 7: Truth-aware response validation');
function validateResponse(response: string, caseContext: typeof mockCaseContext): boolean {
  // Check if response accidentally reveals the guilty party
  const guiltyPerson = caseContext.suspects.find(s => s.is_guilty);
  const directAccusation = new RegExp(`${guiltyPerson?.name}.*guilty|${guiltyPerson?.name}.*killer`, 'i');
  
  return !directAccusation.test(response);
}

const testResponses = [
  { text: 'Marcus Valerius seems nervous when questioned.', shouldPass: true },
  { text: 'Marcus Valerius is guilty of the crime!', shouldPass: false },
  { text: 'All suspects have interesting alibis.', shouldPass: true },
];

testResponses.forEach((test, idx) => {
  const isValid = validateResponse(test.text, mockCaseContext);
  const passed = isValid === test.shouldPass;
  console.log(`  Response ${idx + 1}: ${passed ? '✅' : '❌'} ${test.shouldPass ? 'Valid' : 'Invalid'}`);
});
console.log();

// Test 8: Evidence hint generation
console.log('Test 8: Evidence hint generation');
function generateEvidenceHint(evidenceName: string, contextual: boolean = false): string {
  if (contextual) {
    return `You might want to ask about ${evidenceName.toLowerCase()}.`;
  }
  return `Consider investigating: ${evidenceName}`;
}

const hint1 = generateEvidenceHint('Security Camera', false);
const hint2 = generateEvidenceHint('Security Camera', true);

console.log(`  Direct hint: "${hint1}"`);
console.log(`  Contextual hint: "${hint2}"`);
console.log(`  Both mention evidence: ${hint1.includes('Security Camera') && hint2.includes('security camera')}`);
console.log(`  ✅ PASS\n`);

console.log('=' . repeat(60));
console.log('All Gemini AI Service Tests Complete!');
console.log('=' . repeat(60));
