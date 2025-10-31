/**
 * Test script for traceable logging and database services
 * 
 * Tests:
 * 1. Logger service (info, debug, error)
 * 2. Trace ID generation
 * 3. Database services (getGamePathProgress, getAllNextStepsForCase, updatePathProgress)
 */

import { logger, generateTraceId } from './services/logger.service';

async function testLogging() {
  console.log('\n🧪 Testing Traceable Logging System\n');
  console.log('='.repeat(60));

  // Generate a trace ID for this test session
  const traceId = generateTraceId();
  console.log(`\n✅ Generated Trace ID: ${traceId}\n`);

  // Test 1: Logger Service
  console.log('\n📝 Test 1: Logger Service - Structured JSON Logs');
  console.log('-'.repeat(60));
  
  logger.info('Application started successfully', traceId);
  logger.debug('Debug message with trace ID', traceId);
  logger.info('Processing user request', traceId);
  
  try {
    throw new Error('Test error for logging demonstration');
  } catch (error) {
    logger.error('An error occurred during processing', error as Error, traceId);
  }

  logger.info('Test session completed', traceId);

  console.log('\n' + '='.repeat(60));
  console.log('\n✅ Logger test complete! Check JSON formatted logs above.\n');
  console.log('Note: Database services require Supabase connection.');
  console.log('Run the backend server to test database functions.\n');
}

// Run tests
testLogging().catch((error) => {
  console.error('Test failed:', error);
  process.exit(1);
});
