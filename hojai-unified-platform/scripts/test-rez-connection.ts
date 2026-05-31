/**
 * Test script for REZ Intelligence connection
 * Tests connectivity to all three REZ services
 */

import { serviceConnector } from '../src/services/serviceConnector.js';

async function testREZConnection() {
  console.log('='.repeat(60));
  console.log('HOJAI -> REZ INTELLIGENCE CONNECTION TEST');
  console.log('='.repeat(60));
  console.log();

  // Initialize the service connector
  console.log('[TEST] Initializing ServiceConnector...');
  try {
    await serviceConnector.initialize();
    console.log('[TEST] ServiceConnector initialized successfully\n');
  } catch (error) {
    console.error('[TEST] Failed to initialize ServiceConnector:', error);
    process.exit(1);
  }

  // Test 1: Check REZ Intelligence connection status
  console.log('[TEST 1] Checking REZ Intelligence connection status...');
  console.log('-'.repeat(40));
  try {
    const rezStatus = await serviceConnector.connectToRezIntelligence();
    console.log('Intent Predictor (4018):', rezStatus.intentPredictor.connected ? 'CONNECTED' : 'NOT AVAILABLE');
    console.log('  URL:', rezStatus.intentPredictor.url);
    console.log('Predictive Engine (4123):', rezStatus.predictiveEngine.connected ? 'CONNECTED' : 'NOT AVAILABLE');
    console.log('  URL:', rezStatus.predictiveEngine.url);
    console.log('Memory Layer (4201):', rezStatus.memoryLayer.connected ? 'CONNECTED' : 'NOT AVAILABLE');
    console.log('  URL:', rezStatus.memoryLayer.url);
    console.log();
  } catch (error) {
    console.error('[TEST 1] Failed:', error);
  }

  // Test 2: Get all service health
  console.log('[TEST 2] Checking all service health...');
  console.log('-'.repeat(40));
  try {
    const health = await serviceConnector.getAllServiceHealth();
    health.forEach((h) => {
      const statusIcon = h.status === 'healthy' ? '✓' : '✗';
      const latency = h.latencyMs ? `(${h.latencyMs}ms)` : '';
      console.log(`${statusIcon} ${h.service}: ${h.status} ${latency}`);
      if (h.error) {
        console.log(`  Error: ${h.error}`);
      }
    });
    console.log();
  } catch (error) {
    console.error('[TEST 2] Failed:', error);
  }

  // Test 3: Check if REZ is available
  console.log('[TEST 3] Checking REZ Intelligence availability...');
  console.log('-'.repeat(40));
  try {
    const isAvailable = await serviceConnector.isRezIntelligenceAvailable();
    console.log('REZ Intelligence available:', isAvailable ? 'YES' : 'NO (services not running)');
    console.log();
  } catch (error) {
    console.error('[TEST 3] Failed:', error);
  }

  // Test 4: Try to fetch intent prediction (if service is running)
  console.log('[TEST 4] Testing Intent Prediction API...');
  console.log('-'.repeat(40));
  try {
    const testUserId = 'test_user_123';
    const intent = await serviceConnector.fetchIntentPrediction(testUserId, {
      search_queries: ['test query'],
      device_type: 'mobile'
    });

    if (intent) {
      console.log('Intent prediction fetched successfully!');
      console.log('  User ID:', intent.user_id);
      console.log('  Session ID:', intent.session_id);
      console.log('  Current Intent:', intent.current_intent?.category, `(${intent.current_intent?.confidence})`);
      console.log('  Mood:', intent.mood?.label, `(${intent.mood?.score})`);
    } else {
      console.log('Intent prediction returned null (service may not be running)');
    }
    console.log();
  } catch (error) {
    console.log('Intent prediction test skipped (service not available)');
  }

  // Test 5: Try to fetch user predictions (if service is running)
  console.log('[TEST 5] Testing Predictive Engine API...');
  console.log('-'.repeat(40));
  try {
    const testUserId = 'test_user_123';
    const predictions = await serviceConnector.fetchUserPredictions(testUserId);

    if (predictions) {
      console.log('User predictions fetched successfully!');
      console.log('  Churn Probability:', predictions.churn?.probability);
      console.log('  Churn Risk Level:', predictions.churn?.risk_level);
      console.log('  Predicted LTV:', predictions.ltv?.predicted_ltv);
      console.log('  LTV Confidence:', predictions.ltv?.confidence);
    } else {
      console.log('User predictions returned null (service may not be running)');
    }
    console.log();
  } catch (error) {
    console.log('User predictions test skipped (service not available)');
  }

  // Test 6: Try to fetch user timeline (if service is running)
  console.log('[TEST 6] Testing Memory Layer API...');
  console.log('-'.repeat(40));
  try {
    const testUserId = 'test_user_123';
    const timeline = await serviceConnector.fetchUserTimeline(testUserId);

    if (timeline) {
      console.log('User timeline fetched successfully!');
      console.log('  User ID:', timeline.userId);
      console.log('  Total Events:', timeline.totalEvents);
      console.log('  Last Activity:', timeline.lastActivity || 'N/A');
    } else {
      console.log('User timeline returned null (service may not be running)');
    }
    console.log();
  } catch (error) {
    console.log('User timeline test skipped (service not available)');
  }

  // Summary
  console.log('='.repeat(60));
  console.log('TEST SUMMARY');
  console.log('='.repeat(60));
  console.log();
  console.log('REZ Intelligence services are designed to run on:');
  console.log('  - Intent Predictor:  http://localhost:4018');
  console.log('  - Predictive Engine: http://localhost:4123');
  console.log('  - Memory Layer:      http://localhost:4201');
  console.log();
  console.log('If services show as "NOT AVAILABLE", start them with:');
  console.log('  cd REZ-Intelligence/rez-intent-predictor && npm run dev');
  console.log('  cd REZ-Intelligence/REZ-predictive-engine && npm run dev');
  console.log('  cd REZ-Intelligence/REZ-memory-layer && npm run dev');
  console.log();
  console.log('The ServiceConnector will automatically retry connections');
  console.log('when services become available.');
  console.log();

  // Shutdown
  await serviceConnector.shutdown();
  console.log('[TEST] Test complete. Shutting down...');
}

// Run tests
testREZConnection().catch((error) => {
  console.error('Test failed:', error);
  process.exit(1);
});
