/**
 * StayOwn Hospitality - Integration Test Script
 *
 * Tests the complete guest journey from check-in to check-out
 */

import fetch from 'node-fetch';

const BASE_URL = process.env.BASE_URL || 'http://localhost';
const SERVICES = {
  guestTwin: `${BASE_URL}:3810`,
  hotelTwin: `${BASE_URL}:3811`,
  eventBus: `${BASE_URL}:3812`,
  maintenance: `${BASE_URL}:3815`,
  checkout: `${BASE_URL}:3817`,
};

const testResults: { name: string; passed: boolean; error?: string }[] = [];

async function test(name: string, fn: () => Promise<boolean>): Promise<void> {
  try {
    const result = await fn();
    testResults.push({ name, passed: result });
    logger.info(result ? `✅ ${name}` : `❌ ${name}`);
  } catch (error: any) {
    testResults.push({ name, passed: false, error: error.message });
    logger.info(`❌ ${name}: ${error.message}`);
  }
}

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runTests(): Promise<void> {
  logger.info('🏨 StayOwn Hospitality - Integration Tests\n');
  logger.info('='.repeat(50));

  // Test 1: Health Checks
  logger.info('\n📋 Health Checks\n');

  await test('Guest Twin Service Health', async () => {
    const res = await fetch(`${SERVICES.guestTwin}/health`);
    return res.ok;
  });

  await test('Hotel Business Twin Service Health', async () => {
    const res = await fetch(`${SERVICES.hotelTwin}/health`);
    return res.ok;
  });

  await test('Event Bus Service Health', async () => {
    const res = await fetch(`${SERVICES.eventBus}/health`);
    return res.ok;
  });

  await test('Maintenance AI Service Health', async () => {
    const res = await fetch(`${SERVICES.maintenance}/health`);
    return res.ok;
  });

  await test('Zero Checkout Service Health', async () => {
    const res = await fetch(`${SERVICES.checkout}/health`);
    return res.ok;
  });

  // Test 2: Guest Twin Flow
  logger.info('\n📋 Guest Twin Flow\n');

  let guestSessionId: string;
  let guestId = `test_guest_${Date.now()}`;
  let hotelId = 'hotel_test_001';
  let roomId = 'room_101';

  await test('Create Guest Session', async () => {
    const res = await fetch(`${SERVICES.guestTwin}/guest-twin/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        guestId,
        hotelId,
        stayDetails: {
          checkIn: new Date().toISOString(),
          checkOut: new Date(Date.now() + 86400000 * 3).toISOString(),
          roomType: 'deluxe',
          roomId,
        },
      }),
    });
    const data = await res.json();
    guestSessionId = data.sessionId;
    return !!guestSessionId;
  });

  await test('Update Guest Preferences', async () => {
    const res = await fetch(`${SERVICES.guestTwin}/guest-twin/${guestId}/preferences`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        room: {
          temperature: 22,
          pillowType: 'firm',
          floorPreference: 'high',
          quietRoom: true,
        },
        service: {
          housekeepingTime: 'morning',
         早餐Preference: 'indian',
          newspaper: false,
        },
      }),
    });
    return res.ok;
  });

  await test('Get Guest Preferences', async () => {
    const res = await fetch(`${SERVICES.guestTwin}/guest-twin/${guestId}/preferences`);
    const data = await res.json();
    return data.preferences && data.preferences.room?.temperature === 22;
  });

  await test('Get Guest Recommendations', async () => {
    const res = await fetch(`${SERVICES.guestTwin}/guest-twin/${guestId}/recommendations`);
    return res.ok;
  });

  await test('Get Guest Insights', async () => {
    const res = await fetch(`${SERVICES.guestTwin}/guest-twin/${guestId}/insights`);
    return res.ok;
  });

  // Test 3: Hotel Business Twin
  logger.info('\n📋 Hotel Business Twin\n');

  await test('Get Hotel Dashboard', async () => {
    const res = await fetch(`${SERVICES.hotelTwin}/hotel-twin/${hotelId}/dashboard`);
    return res.ok;
  });

  await test('Get Hotel Predictions', async () => {
    const res = await fetch(`${SERVICES.hotelTwin}/hotel-twin/${hotelId}/predictions`);
    return res.ok;
  });

  await test('Get Hotel Recommendations', async () => {
    const res = await fetch(`${SERVICES.hotelTwin}/hotel-twin/${hotelId}/recommendations`);
    return res.ok;
  });

  await test('Record Stay Event', async () => {
    const res = await fetch(`${SERVICES.hotelTwin}/hotel-twin/${hotelId}/stay-event`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        guestId,
        roomId,
        eventType: 'check_in',
        timestamp: new Date().toISOString(),
      }),
    });
    return res.ok;
  });

  // Test 4: Event Bus
  logger.info('\n📋 Event Bus\n');

  let eventId: string;

  await test('Publish Event', async () => {
    const res = await fetch(`${SERVICES.eventBus}/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token',
      },
      body: JSON.stringify({
        type: 'guest.arrival.checked-in',
        source: 'integration-test',
        hotelId,
        guestId,
        roomId,
        payload: { test: true },
      }),
    });
    const data = await res.json();
    eventId = data.eventId;
    return !!eventId;
  });

  await test('Get Event History', async () => {
    const res = await fetch(`${SERVICES.eventBus}/events/history?limit=10`);
    return res.ok;
  });

  await test('Get Event Types', async () => {
    const res = await fetch(`${SERVICES.eventBus}/event-types`);
    const data = await res.json();
    return data.eventTypes && Object.keys(data.eventTypes).length > 0;
  });

  // Test 5: Maintenance AI
  logger.info('\n📋 Maintenance AI\n');

  let maintenanceRequestId: string;

  await test('Create Maintenance Request', async () => {
    const res = await fetch(`${SERVICES.maintenance}/requests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token',
      },
      body: JSON.stringify({
        roomId,
        category: 'electrical',
        title: 'Light not working',
        description: 'The bedside lamp is not turning on',
        reportedBy: 'test_user',
      }),
    });
    const data = await res.json();
    maintenanceRequestId = data.requestId;
    return !!maintenanceRequestId;
  });

  await test('Get Maintenance Requests', async () => {
    const res = await fetch(`${SERVICES.maintenance}/requests`);
    return res.ok;
  });

  await test('Get Maintenance Stats', async () => {
    const res = await fetch(`${SERVICES.maintenance}/stats`);
    return res.ok;
  });

  // Test 6: Zero Checkout
  logger.info('\n📋 Zero Checkout\n');

  let checkoutSessionId: string;
  let bookingId = `booking_${Date.now()}`;

  await test('Initialize Checkout', async () => {
    const res = await fetch(`${SERVICES.checkout}/checkout/init`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token',
      },
      body: JSON.stringify({
        bookingId,
        roomId,
      }),
    });
    const data = await res.json();
    checkoutSessionId = data.sessionId;
    return !!checkoutSessionId;
  });

  await test('Get Checkout Session', async () => {
    const res = await fetch(`${SERVICES.checkout}/checkout/session/${checkoutSessionId}`);
    return res.ok;
  });

  await test('Refresh Billing', async () => {
    const res = await fetch(`${SERVICES.checkout}/checkout/session/${checkoutSessionId}/refresh-billing`, {
      method: 'POST',
      headers: { 'Authorization': 'Bearer test-token' },
    });
    return res.ok;
  });

  // Summary
  logger.info('\n' + '='.repeat(50));
  logger.info('\n📊 Test Summary\n');

  const passed = testResults.filter(r => r.passed).length;
  const failed = testResults.filter(r => !r.passed).length;

  logger.info(`Total: ${testResults.length}`);
  logger.info(`Passed: ${passed}`);
  logger.info(`Failed: ${failed}`);

  if (failed > 0) {
    logger.info('\n❌ Failed Tests:');
    testResults
      .filter(r => !r.passed)
      .forEach(r => logger.info(`  - ${r.name}${r.error ? `: ${r.error}` : ''}`));
  }

  logger.info('\n' + '='.repeat(50));
  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(err => {
  logger.error('Test suite failed:', err);
  process.exit(1);
});
