/**
 * Unit Tests for Evidence Detection Logic
 * Tests keyword matching, case-insensitivity, and word boundaries
 */

import { 
  detectEvidenceInMessage, 
  detectEvidenceInMessages,
  canMakeAccusation,
  getEvidenceStats 
} from '../src/utils/evidence-detection';

// Mock evidence data
const mockEvidence = [
  {
    evidence_id: 'ev-1',
    name: 'Security Footage',
    unlock_keywords: ['security camera', 'footage', 'video recording'],
    is_required_for_accusation: true,
  },
  {
    evidence_id: 'ev-2',
    name: 'Fingerprints',
    unlock_keywords: ['fingerprint', 'prints', 'touch'],
    is_required_for_accusation: true,
  },
  {
    evidence_id: 'ev-3',
    name: 'Witness Statement',
    unlock_keywords: ['witness', 'testimony', 'saw'],
    is_required_for_accusation: false,
  },
];

console.log('Testing Evidence Detection Logic...\n');

// Test 1: Basic keyword matching
console.log('Test 1: Basic keyword matching');
const test1 = detectEvidenceInMessage(
  'Can you check the security camera footage?',
  mockEvidence,
  []
);
console.log(`  Input: "Can you check the security camera footage?"`);
console.log(`  Expected: ['ev-1']`);
console.log(`  Result: ${JSON.stringify(test1)}`);
console.log(`  ✅ ${test1.includes('ev-1') ? 'PASS' : 'FAIL'}\n`);

// Test 2: Case insensitivity
console.log('Test 2: Case insensitivity');
const test2 = detectEvidenceInMessage(
  'I found some FINGERPRINTS on the door.',
  mockEvidence,
  []
);
console.log(`  Input: "I found some FINGERPRINTS on the door."`);
console.log(`  Expected: ['ev-2']`);
console.log(`  Result: ${JSON.stringify(test2)}`);
console.log(`  ✅ ${test2.includes('ev-2') ? 'PASS' : 'FAIL'}\n`);

// Test 3: Multiple matches in one message
console.log('Test 3: Multiple matches in one message');
const test3 = detectEvidenceInMessage(
  'The witness testimony mentions fingerprints.',
  mockEvidence,
  []
);
console.log(`  Input: "The witness testimony mentions fingerprints."`);
console.log(`  Expected: ['ev-2', 'ev-3'] (both matched)`);
console.log(`  Result: ${JSON.stringify(test3)}`);
console.log(`  ✅ ${test3.length === 2 ? 'PASS' : 'FAIL'}\n`);

// Test 4: Already unlocked evidence (should skip)
console.log('Test 4: Already unlocked evidence');
const test4 = detectEvidenceInMessage(
  'Check the security camera.',
  mockEvidence,
  ['ev-1'] // already unlocked
);
console.log(`  Input: "Check the security camera." (ev-1 already unlocked)`);
console.log(`  Expected: []`);
console.log(`  Result: ${JSON.stringify(test4)}`);
console.log(`  ✅ ${test4.length === 0 ? 'PASS' : 'FAIL'}\n`);

// Test 5: No matches
console.log('Test 5: No matches');
const test5 = detectEvidenceInMessage(
  'This message has no keywords.',
  mockEvidence,
  []
);
console.log(`  Input: "This message has no keywords."`);
console.log(`  Expected: []`);
console.log(`  Result: ${JSON.stringify(test5)}`);
console.log(`  ✅ ${test5.length === 0 ? 'PASS' : 'FAIL'}\n`);

// Test 6: Multiple messages
console.log('Test 6: Multiple messages');
const test6 = detectEvidenceInMessages(
  [
    'Check the security camera.',
    'The AI responds about footage.',
    'User asks about witness.'
  ],
  mockEvidence,
  []
);
console.log(`  Input: 3 messages with different keywords`);
console.log(`  Expected: ['ev-1', 'ev-3']`);
console.log(`  Result: ${JSON.stringify(test6)}`);
console.log(`  ✅ ${test6.length === 2 ? 'PASS' : 'FAIL'}\n`);

// Test 7: Can make accusation (all required found)
console.log('Test 7: Can make accusation - all required');
const test7 = canMakeAccusation(mockEvidence, ['ev-1', 'ev-2', 'ev-3']);
console.log(`  Unlocked: all evidence`);
console.log(`  Expected: true`);
console.log(`  Result: ${test7}`);
console.log(`  ✅ ${test7 === true ? 'PASS' : 'FAIL'}\n`);

// Test 8: Can't make accusation (missing required)
console.log('Test 8: Can make accusation - missing required');
const test8 = canMakeAccusation(mockEvidence, ['ev-3']); // only non-required
console.log(`  Unlocked: only ev-3 (not required)`);
console.log(`  Expected: false`);
console.log(`  Result: ${test8}`);
console.log(`  ✅ ${test8 === false ? 'PASS' : 'FAIL'}\n`);

// Test 9: Evidence stats
console.log('Test 9: Evidence stats');
const test9 = getEvidenceStats(mockEvidence, ['ev-1', 'ev-3']);
console.log(`  Unlocked: ev-1, ev-3`);
console.log(`  Result:`, test9);
console.log(`  Expected: total=3, unlocked=2, required=2, required_unlocked=1, can_accuse=false`);
console.log(`  ✅ ${test9.unlocked === 2 && test9.can_accuse === false ? 'PASS' : 'FAIL'}\n`);

// Test 10: Word boundary (should not match partial words)
console.log('Test 10: Word boundary test');
const test10 = detectEvidenceInMessage(
  'The camera is not the same as cameraman.',
  mockEvidence,
  []
);
console.log(`  Input: "The camera is not the same as cameraman."`);
console.log(`  Expected: [] (should not match "security camera" from "cameraman")`);
console.log(`  Result: ${JSON.stringify(test10)}`);
console.log(`  ✅ ${test10.length === 0 ? 'PASS' : 'FAIL'}\n`);

console.log('=' . repeat(60));
console.log('All Evidence Detection Tests Complete!');
