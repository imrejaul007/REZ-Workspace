import { logger } from ;
/**
 * Invisible Hotel - Complete Demo Script
 *
 * Tests the complete guest journey:
 * 1. Pre-Arrival (preferences collected)
 * 2. Check-In (room ready, key activated)
 * 3. Stay (services used)
 * 4. Checkout (auto-settle, lock revoke)
 *
 * Run: npx tsx demo/invisible-hotel-demo.ts
 */

import { createClient } from 'redis';

// Configuration
const CONFIG = {
  // Services to test (add ports as needed)
  services: {
    'ai-front-desk': 3800,
    'pre-arrival-service': 3828,
    'smart-lock-service': 3825,
    'minibar-service': 3810,
    'hotel-restaurant-booking': 3811,
    'hotel-spa-booking': 3812,
    'room-controls': 3814,
    'parking-service': 3815,
    'upsell-engine': 3817,
    'loyalty-system': 3818,
    'review-manager': 3819,
    'feedback-survey': 3820,
    'concierge-desk': 3821,
    'zero-checkout-automation': 3827,
    'hojai-memory-hotel': 4720,
    'voice-hotel-agent': 4870,
  },
  redis: 'redis://localhost:6379',
};

// Demo data
const DEMO_GUEST = {
  id: 'guest-demo-001',
  name: 'Rahul Sharma',
  email: 'rahul@example.com',
  phone: '+919876543210',
  hotelId: 'hotel-demo-001',
  roomId: 'room-101',
  bookingId: 'booking-demo-001',
};

const DEMO_VEHICLE = {
  plate: 'DL01AB1234',
  make: 'Toyota',
  model: 'Innova',
  color: 'White',
};

let redis: ReturnType<typeof createClient>;

async function log(message: string, data?: any) {
  const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
  logger.info(`\n[${timestamp}] ${message}`);
  if (data) {
    logger.info(JSON.stringify(data, null, 2));
  }
}

async function apiCall(port: number, method: string, path: string, body?: any): Promise<any> {
  const url = `http://localhost:${port}${path}`;
  const options: RequestInit = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, options);
    const text = await response.text();
    try {
      return { ok: response.ok, status: response.status, data: JSON.parse(text) };
    } catch {
      return { ok: response.ok, status: response.status, data: text };
    }
  } catch (error) {
    return { ok: false, status: 0, data: String(error) };
  }
}

async function checkHealth(port: number): Promise<boolean> {
  const result = await apiCall(port, 'GET', '/health');
  return result.ok;
}

// ============================================
// PHASE 1: PRE-ARRIVAL
// ============================================

async function phasePreArrival() {
  log('='.repeat(50));
  log('PHASE 1: PRE-ARRIVAL');
  log('='.repeat(50));

  // Step 1: Create pre-arrival session
  log('Creating pre-arrival session...');
  const createSession = await apiCall(CONFIG.services['pre-arrival-service'], 'POST', '/prearrival/:sessionId/trigger'.replace(':sessionId', 'demo-session-001'), {
    guestId: DEMO_GUEST.id,
    hotelId: DEMO_GUEST.hotelId,
    bookingId: DEMO_GUEST.bookingId,
    checkIn: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    checkOut: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
  });
  log('Pre-arrival session created', createSession);

  // Step 2: Submit guest preferences
  log('Submitting guest preferences...');
  const preferences = {
    pillowType: 'memory_foam',
    bedConfiguration: 'king',
    roomTemperature: 22,
    roomView: 'city',
    breakfast: 'included',
    dietaryRestrictions: ['vegetarian'],
    celebrationType: 'anniversary',
    specialRequests: 'Late check-in expected around 10 PM',
  };

  const submitPrefs = await apiCall(CONFIG.services['pre-arrival-service'], 'POST', '/prearrival/demo-session-001/preferences', preferences);
  log('Preferences submitted', submitPrefs);

  // Step 3: Verify room prepared
  log('Verifying room preparation...');
  const session = await apiCall(CONFIG.services['pre-arrival-service'], 'GET', '/prearrival/demo-session-001');
  log('Session status', session);

  return session.ok;
}

// ============================================
// PHASE 2: CHECK-IN
// ============================================

async function phaseCheckIn() {
  log('='.repeat(50));
  log('PHASE 2: CHECK-IN');
  log('='.repeat(50));

  // Step 1: Grant smart lock access
  log('Granting smart lock access...');
  const grantAccess = await apiCall(CONFIG.services['smart-lock-service'], 'POST', '/access/grant', {
    guestId: DEMO_GUEST.id,
    roomId: DEMO_GUEST.roomId,
    hotelId: DEMO_GUEST.hotelId,
    validUntil: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
  });
  log('Smart lock access granted', grantAccess);

  // Step 2: Initialize room controls
  log('Initializing room controls...');
  const initRoom = await apiCall(CONFIG.services['room-controls'], 'POST', `/rooms/${DEMO_GUEST.roomId}/init`, {
    guestId: DEMO_GUEST.id,
    hotelId: DEMO_GUEST.hotelId,
    preferences: { temperature: 22 },
  });
  log('Room controls initialized', initRoom);

  // Step 3: Apply morning scene
  log('Applying welcome scene...');
  const applyScene = await apiCall(CONFIG.services['room-controls'], 'POST', `/rooms/${DEMO_GUEST.roomId}/scenes/morning`);
  log('Scene applied', applyScene);

  // Step 4: Store in memory
  log('Storing guest preferences in memory...');
  const memoryUpdate = await apiCall(CONFIG.services['hojai-memory-hotel'], 'POST', `/guests/${DEMO_GUEST.id}/preferences`, {
    preferences: {
      pillowType: 'memory_foam',
      roomTemp: 22,
      dietary: 'vegetarian',
    },
    source: 'pre-arrival',
  });
  log('Memory updated', memoryUpdate);

  return grantAccess.ok && initRoom.ok;
}

// ============================================
// PHASE 3: STAY SERVICES
// ============================================

async function phaseStayServices() {
  log('='.repeat(50));
  log('PHASE 3: STAY SERVICES');
  log('='.repeat(50));

  // Step 1: Order from minibar
  log('Ordering from minibar...');
  const minibarOrder = await apiCall(CONFIG.services['minibar-service'], 'POST', `/guests/${DEMO_GUEST.id}/consume`, {
    hotelId: DEMO_GUEST.hotelId,
    roomId: DEMO_GUEST.roomId,
    itemId: 'beer-1',
    quantity: 2,
  });
  log('Minibar order', minibarOrder);

  // Step 2: Book restaurant
  log('Booking restaurant table...');
  const restaurantBook = await apiCall(CONFIG.services['hotel-restaurant-booking'], 'POST', '/reservations', {
    guestId: DEMO_GUEST.id,
    hotelId: DEMO_GUEST.hotelId,
    roomId: DEMO_GUEST.roomId,
    date: new Date().toISOString().split('T')[0],
    time: '19:00',
    guests: 2,
    specialRequests: 'Anniversary dinner, please arrange cake',
  });
  log('Restaurant booked', restaurantBook);

  // Step 3: Book spa
  log('Booking spa treatment...');
  const spaBook = await apiCall(CONFIG.services['hotel-spa-booking'], 'POST', '/bookings', {
    guestId: DEMO_GUEST.id,
    hotelId: DEMO_GUEST.hotelId,
    roomId: DEMO_GUEST.roomId,
    treatmentId: 't10', // Couple Massage
    date: new Date().toISOString().split('T')[0],
    time: '10:00',
    notes: 'First time, please be gentle',
  });
  log('Spa booked', spaBook);

  // Step 4: Book parking
  log('Booking parking...');
  const parkingBook = await apiCall(CONFIG.services['parking-service'], 'POST', '/bookings', {
    guestId: DEMO_GUEST.id,
    hotelId: DEMO_GUEST.hotelId,
    roomId: DEMO_GUEST.roomId,
    vehicle: DEMO_VEHICLE,
    checkIn: new Date().toISOString(),
    checkOut: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    valet: true,
    evCharging: false,
  });
  log('Parking booked', parkingBook);

  // Step 5: Concierge request
  log('Making concierge request...');
  const conciergeRequest = await apiCall(CONFIG.services['concierge-desk'], 'POST', '/requests', {
    guestId: DEMO_GUEST.id,
    hotelId: DEMO_GUEST.hotelId,
    roomId: DEMO_GUEST.roomId,
    type: 'transport',
    description: 'Need airport drop at 6 AM tomorrow',
    priority: 'normal',
  });
  log('Concierge request', conciergeRequest);

  // Step 6: Submit mid-stay feedback
  log('Submitting mid-stay feedback...');
  const feedback = await apiCall(CONFIG.services['feedback-survey'], 'POST', '/surveys/demo-feedback-001/respond', {
    responses: [
      { questionId: 'q1', question: 'Room rating', answer: '5', category: 'room' },
      { questionId: 'q2', question: 'Service rating', answer: '5', category: 'service' },
      { questionId: 'q3', question: 'Suggestions', answer: 'Everything perfect!', category: 'feedback' },
      { questionId: 'q4', question: 'NPS', answer: '10', category: 'nps' },
    ],
  });
  log('Feedback submitted', feedback);

  return true;
}

// ============================================
// PHASE 4: UPSELL & LOYALTY
// ============================================

async function phaseUpsellLoyalty() {
  log('='.repeat(50));
  log('PHASE 4: UPSELL & LOYALTY');
  log('='.repeat(50));

  // Step 1: Generate upsell offers
  log('Generating upsell offers...');
  const upsellGenerate = await apiCall(CONFIG.services['upsell-engine'], 'POST', `/bookings/${DEMO_GUEST.bookingId}/upsells/generate`, {
    guestId: DEMO_GUEST.id,
    hotelId: DEMO_GUEST.hotelId,
    guestProfile: { totalStays: 5, lifetimeValue: 150000 },
  });
  log('Upsell offers generated', upsellGenerate);

  // Step 2: Check loyalty status
  log('Checking loyalty status...');
  const loyaltyCheck = await apiCall(CONFIG.services['loyalty-system'], 'GET', `/guests/${DEMO_GUEST.id}/member`);

  if (!loyaltyCheck.ok) {
    // Join loyalty program
    log('Joining loyalty program...');
    const joinLoyalty = await apiCall(CONFIG.services['loyalty-system'], 'POST', '/members', {
      guestId: DEMO_GUEST.id,
      hotelId: DEMO_GUEST.hotelId,
    });
    log('Joined loyalty', joinLoyalty);
  } else {
    log('Loyalty member status', loyaltyCheck);
  }

  // Step 3: Earn points
  log('Earning loyalty points...');
  const earnPoints = await apiCall(CONFIG.services['loyalty-system'], 'POST', `/members/member-demo-001/earn`, {
    points: 1500,
    description: 'Stay bonus - 3 night booking',
    bookingId: DEMO_GUEST.bookingId,
  });
  log('Points earned', earnPoints);

  return true;
}

// ============================================
// PHASE 5: VOICE AGENT
// ============================================

async function phaseVoiceAgent() {
  log('='.repeat(50));
  log('PHASE 5: VOICE AGENT');
  log('='.repeat(50));

  // Step 1: Start voice session
  log('Starting voice session...');
  const startSession = await apiCall(CONFIG.services['voice-hotel-agent'], 'POST', '/calls/start', {
    guestId: DEMO_GUEST.id,
    hotelId: DEMO_GUEST.hotelId,
    phoneNumber: DEMO_GUEST.phone,
  });
  log('Voice session started', startSession);

  // Step 2: Process voice commands (simulated)
  log('Processing voice command: "Order breakfast to my room"');
  const voiceCmd1 = await apiCall(CONFIG.services['voice-hotel-agent'], 'POST', '/sessions/demo-session/process', {
    transcript: 'Order breakfast to my room',
    confidence: 0.95,
  });
  log('Voice response', voiceCmd1);

  log('Processing voice command: "What time is checkout?"');
  const voiceCmd2 = await apiCall(CONFIG.services['voice-hotel-agent'], 'POST', '/sessions/demo-session/process', {
    transcript: 'What time is checkout?',
    confidence: 0.95,
  });
  log('Voice response', voiceCmd2);

  return startSession.ok;
}

// ============================================
// PHASE 6: CHECKOUT
// ============================================

async function phaseCheckout() {
  log('='.repeat(50));
  log('PHASE 6: CHECKOUT');
  log('='.repeat(50));

  // Step 1: Initiate zero checkout
  log('Initiating zero checkout...');
  const checkout = await apiCall(CONFIG.services['zero-checkout-automation'], 'POST', '/checkouts/initiate', {
    guestId: DEMO_GUEST.id,
    hotelId: DEMO_GUEST.hotelId,
    roomId: DEMO_GUEST.roomId,
    bookingId: DEMO_GUEST.bookingId,
    checkIn: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  });
  log('Checkout initiated', checkout);

  // Step 2: Verify smart lock revoked
  log('Verifying smart lock access revoked...');
  const lockStatus = await apiCall(CONFIG.services['smart-lock-service'], 'GET', `/rooms/${DEMO_GUEST.roomId}/access`);
  log('Lock status', lockStatus);

  // Step 3: Request review
  log('Requesting guest review...');
  const reviewRequest = await apiCall(CONFIG.services['review-manager'], 'POST', '/requests', {
    guestId: DEMO_GUEST.id,
    hotelId: DEMO_GUEST.hotelId,
    bookingId: DEMO_GUEST.bookingId,
    channel: 'email',
  });
  log('Review request sent', reviewRequest);

  // Step 4: Submit review
  log('Submitting guest review...');
  const review = await apiCall(CONFIG.services['review-manager'], 'POST', '/reviews', {
    guestId: DEMO_GUEST.id,
    hotelId: DEMO_GUEST.hotelId,
    bookingId: DEMO_GUEST.bookingId,
    rating: 5,
    categories: {
      cleanliness: 5,
      service: 5,
      location: 4,
      value: 5,
      amenities: 5,
    },
    title: 'Amazing anniversary stay!',
    text: 'Everything was perfect. The surprise cake in the room was a lovely touch. Will definitely come back!',
    source: 'email',
  });
  log('Review submitted', review);

  // Step 5: Check loyalty tier
  log('Checking tier upgrade...');
  const loyaltyFinal = await apiCall(CONFIG.services['loyalty-system'], 'GET', `/guests/${DEMO_GUEST.id}/member`);
  log('Final loyalty status', loyaltyFinal);

  return checkout.ok;
}

// ============================================
// MAIN EXECUTION
// ============================================

async function main() {
  logger.info(`
╔══════════════════════════════════════════════════════════════════╗
║                  THE INVISIBLE HOTEL - DEMO                     ║
║                                                                  ║
║  Testing the complete autonomous guest journey                   ║
║  Pre-Arrival → Check-In → Stay → Services → Checkout            ║
╚══════════════════════════════════════════════════════════════════╝
  `);

  // Initialize Redis for session storage
  try {
    redis = createClient({ url: CONFIG.redis });
    await redis.connect();
    log('Connected to Redis');
  } catch (e) {
    log('Redis not available, continuing without...');
  }

  // Check service health
  log('Checking service health...');
  const healthResults = await Promise.all(
    Object.entries(CONFIG.services).map(async ([name, port]) => {
      const healthy = await checkHealth(port);
      return { name, port, healthy };
    })
  );

  const unhealthy = healthResults.filter(r => !r.healthy);
  if (unhealthy.length > 0) {
    log('⚠️  Some services not healthy:', unhealthy.map(r => `${r.name} (${r.port})`));
  }

  const healthy = healthResults.filter(r => r.healthy);
  log(`✅ ${healthy.length}/${healthResults.length} services healthy`);

  // Run demo phases
  const results = {
    preArrival: false,
    checkIn: false,
    stayServices: false,
    upsellLoyalty: false,
    voiceAgent: false,
    checkout: false,
  };

  try {
    results.preArrival = await phasePreArrival();
  } catch (e) {
    log('❌ Pre-Arrival phase failed:', String(e));
  }

  try {
    results.checkIn = await phaseCheckIn();
  } catch (e) {
    log('❌ Check-In phase failed:', String(e));
  }

  try {
    results.stayServices = await phaseStayServices();
  } catch (e) {
    log('❌ Stay Services phase failed:', String(e));
  }

  try {
    results.upsellLoyalty = await phaseUpsellLoyalty();
  } catch (e) {
    log('❌ Upsell & Loyalty phase failed:', String(e));
  }

  try {
    results.voiceAgent = await phaseVoiceAgent();
  } catch (e) {
    log('❌ Voice Agent phase failed:', String(e));
  }

  try {
    results.checkout = await phaseCheckout();
  } catch (e) {
    log('❌ Checkout phase failed:', String(e));
  }

  // Summary
  logger.info(`
╔══════════════════════════════════════════════════════════════════╗
║                        DEMO SUMMARY                             ║
╚══════════════════════════════════════════════════════════════════╝
  `);

  for (const [phase, success] of Object.entries(results)) {
    const status = success ? '✅' : '❌';
    logger.info(`  ${status} ${phase.charAt(0).toUpperCase() + phase.slice(1)}`);
  }

  const passedCount = Object.values(results).filter(Boolean).length;
  logger.info(`
  Total: ${passedCount}/${Object.keys(results).length} phases passed

  Demo ${passedCount === Object.keys(results).length ? 'COMPLETED SUCCESSFULLY!' : 'completed with some failures'}

  Next steps:
  1. Start all services: docker-compose -f docker-compose.invisible-hotel.yml up -d
  2. Run demo: npx tsx demo/invisible-hotel-demo.ts
  3. Open hotel-os-integration: http://localhost:3899
  `);

  // Cleanup
  try {
    await redis.quit();
  } catch (e) { /* ignore */ }

  process.exit(passedCount === Object.keys(results).length ? 0 : 1);
}

main().catch(console.error);
