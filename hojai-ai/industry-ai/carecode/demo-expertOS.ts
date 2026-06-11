/**
 * CareCode ExpertOS Demo
 *
 * This demonstrates the new ExpertOS features for individual doctors
 * that were integrated into CareCode.
 *
 * Run with: npx tsx demo-expertOS.ts
 */

const BASE_URL = 'http://localhost:4102';

async function demo() {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║   CareCode + ExpertOS - Individual Doctor Features            ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
  `);

  // 1. Health Check with ExpertOS
  console.log('\n1. Health Check (with ExpertOS)...');
  try {
    const health = await fetch(`${BASE_URL}/health`);
    const healthData = await health.json();
    console.log('   ✅ Service:', healthData.service);
    console.log('   ✅ Version:', healthData.version);
    console.log('   ✅ ExpertOS:', healthData.expertOS);
    console.log('   ✅ Expert Type:', healthData.expertType);
  } catch (e) {
    console.log('   ⚠️  CareCode not running. Start with: npx tsx src/index.ts');
    return simulateDemo();
  }

  // 2. Create Doctor Profile
  console.log('\n2. Create Doctor Profile...');
  const profileResponse = await fetch(`${BASE_URL}/api/carecode/expert/profile`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      displayName: 'Dr. Priya Sharma',
      title: 'Senior Cardiologist',
      email: 'priya@heartcare.com',
      phone: '+91 98765 43210',
      specializations: ['Cardiology', 'Heart Surgery', 'Preventive Care'],
      experience: 15,
      credentials: [
        {
          type: 'degree',
          name: 'MD Cardiology',
          issuer: 'AIIMS Delhi',
          year: 2008,
          verified: true,
        },
        {
          type: 'license',
          name: 'Medical Council of India',
          issuer: 'MCI',
          year: 2009,
          verified: true,
        },
      ],
      aiConfig: {
        autonomyLevel: 3,
        communicationStyle: 'professional',
      },
    }),
  });
  const profile = await profileResponse.json();
  if (profile.success) {
    console.log('   ✅ Created doctor profile:', profile.data.profileId);
    console.log('   📋 Name:', profile.data.displayName);
    console.log('   🏥 Specializations:', profile.data.specializations.join(', '));
    var doctorId = profile.data.profileId;
  } else {
    console.log('   ⚠️  Profile creation failed:', profile.error);
    return;
  }

  // 3. Get Doctor Profile
  console.log('\n3. Get Doctor Profile...');
  const getProfileResponse = await fetch(`${BASE_URL}/api/carecode/expert/profile/${doctorId}`);
  const getProfile = await getProfileResponse.json();
  console.log('   ✅ Profile retrieved');
  console.log('   📊 Stats:', JSON.stringify(getProfile.data.stats));

  // 4. Add Patient (as Client)
  console.log('\n4. Add Patient as Client...');
  const clientResponse = await fetch(`${BASE_URL}/api/carecode/expert/clients`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      professionalId: doctorId,
      name: 'Rahul Mehta',
      email: 'rahul@email.com',
      phone: '+91 98765 11111',
    }),
  });
  const client = await clientResponse.json();
  if (client.success) {
    console.log('   ✅ Added patient:', client.data.clientId);
    var patientId = client.data.clientId;
  }

  // 5. Get Availability
  console.log('\n5. Get Available Slots...');
  const availabilityResponse = await fetch(`${BASE_URL}/api/carecode/expert/availability/${doctorId}?date=2024-01-15`);
  const availability = await availabilityResponse.json();
  console.log('   ✅ Available slots:', availability.data.slots.length);
  availability.data.slots.forEach((slot: any) => {
    console.log('      • ' + slot.time + ' - ' + (slot.available ? 'Available' : 'Booked'));
  });

  // 6. Book Appointment
  console.log('\n6. Book Appointment...');
  const appointmentResponse = await fetch(`${BASE_URL}/api/carecode/expert/appointments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      professionalId: doctorId,
      clientId: patientId,
      date: '2024-01-15',
      time: '10:00',
      duration: 30,
      type: 'consultation',
    }),
  });
  const appointment = await appointmentResponse.json();
  if (appointment.success) {
    console.log('   ✅ Appointment booked:', appointment.data.appointmentId);
    console.log('   📅 Date:', appointment.data.date);
    console.log('   ⏰ Time:', appointment.data.time);
  }

  // 7. Create Engagement
  console.log('\n7. Create Engagement (Treatment)...');
  const engagementResponse = await fetch(`${BASE_URL}/api/carecode/expert/engagements`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      professionalId: doctorId,
      clientId: patientId,
      type: 'consultation',
      title: 'Cardiac Checkup - Q1 Review',
      value: 1500,
    }),
  });
  const engagement = await engagementResponse.json();
  if (engagement.success) {
    console.log('   ✅ Engagement created:', engagement.data.engagementId);
  }

  // 8. Add Review
  console.log('\n8. Add Patient Review...');
  const reviewResponse = await fetch(`${BASE_URL}/api/carecode/expert/reviews`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      professionalId: doctorId,
      clientId: patientId,
      clientName: 'Rahul Mehta',
      rating: 5,
      title: 'Excellent cardiac care!',
      content: 'Dr. Sharma explained my condition clearly and created a comprehensive treatment plan.',
      service: 'Cardiac Consultation',
    }),
  });
  const review = await reviewResponse.json();
  if (review.success) {
    console.log('   ✅ Review added:', review.data.reviewId);
    console.log('   ⭐ Rating:', review.data.rating + '/5');
  }

  // 9. Get AI Suggestions
  console.log('\n9. Get AI Suggestions...');
  const suggestionsResponse = await fetch(`${BASE_URL}/api/carecode/expert/suggestions/${doctorId}`);
  const suggestions = await suggestionsResponse.json();
  console.log('   💡 Follow-ups:', suggestions.data.suggestions.followUps.length);
  console.log('   📈 Improvements:', suggestions.data.suggestions.improvements.length);
  console.log('   🎯 Opportunities:', suggestions.data.suggestions.opportunities.length);

  // 10. Get Twin Level
  console.log('\n10. Get Twin Level...');
  const twinLevelResponse = await fetch(`${BASE_URL}/api/carecode/expert/twin-level/${doctorId}`);
  const twinLevel = await twinLevelResponse.json();
  console.log('   ⭐ Level:', twinLevel.data.level.name);
  console.log('   📝 Description:', twinLevel.data.level.description);

  // 11. Get Reviews
  console.log('\n11. Get All Reviews...');
  const reviewsResponse = await fetch(`${BASE_URL}/api/carecode/expert/reviews/${doctorId}`);
  const reviews = await reviewsResponse.json();
  console.log('   ✅ Total reviews:', reviews.data.count);
  reviews.data.reviews?.forEach((r: any) => {
    console.log('      ⭐ ' + r.rating + '/5 - ' + r.title);
  });

  // 12. Marketplace Search
  console.log('\n12. Search Marketplace...');
  const marketplaceResponse = await fetch(`${BASE_URL}/api/carecode/marketplace/experts?minRating=4`);
  const marketplace = await marketplaceResponse.json();
  console.log('   🔍 Found:', marketplace.data.count, 'doctors');

  // 13. ExpertOS Health
  console.log('\n13. ExpertOS Health Check...');
  const expertOSHealth = await fetch(`${BASE_URL}/api/expert-os/health`);
  const expertOSHealthData = await expertOSHealth.json();
  console.log('   ✅ Service:', expertOSHealthData.service);
  console.log('   ✅ Vertical:', expertOSHealthData.vertical);
  console.log('   ✅ Expert Type:', expertOSHealthData.expertType);
  console.log('   ✅ Capabilities:', expertOSHealthData.capabilities.join(', '));

  console.log('\n' + '='.repeat(50));
  console.log('\n✅ CareCode + ExpertOS Demo Complete!\n');
  console.log('New API Endpoints Available:');
  console.log('  POST /api/carecode/expert/profile     - Create doctor profile');
  console.log('  GET  /api/carecode/expert/profile/:id - Get doctor profile');
  console.log('  POST /api/carecode/expert/clients     - Add patient');
  console.log('  GET  /api/carecode/expert/clients/:id - List patients');
  console.log('  POST /api/carecode/expert/appointments - Book appointment');
  console.log('  POST /api/carecode/expert/reviews    - Add review');
  console.log('  GET  /api/carecode/expert/suggestions/:id - AI suggestions');
  console.log('  GET  /api/carecode/marketplace/experts - Search doctors\n');
}

function simulateDemo() {
  console.log('\n📋 CareCode + ExpertOS Simulation Demo\n');
  console.log('='.repeat(50));

  console.log('\n1. Doctor Profile (ExpertTwin)');
  console.log('   ┌─────────────────────────────────────────────┐');
  console.log('   │ 🏥 Dr. Priya Sharma                         │');
  console.log('   │    Senior Cardiologist                      │');
  console.log('   │    Specializations:                         │');
  console.log('   │    • Cardiology                             │');
  console.log('   │    • Heart Surgery                          │');
  console.log('   │    • Preventive Care                        │');
  console.log('   │                                              │');
  console.log('   │ Credentials:                                │');
  console.log('   │    ✅ MD Cardiology - AIIMS Delhi (2008)   │');
  console.log('   │    ✅ MCI License (2009)                   │');
  console.log('   │                                              │');
  console.log('   │ 🧠 Twin Level: 3 (Decision Twin)          │');
  console.log('   │ 📊 Rating: 4.8/5 (24 reviews)            │');
  console.log('   │ 👥 Patients: 156 active                    │');
  console.log('   └─────────────────────────────────────────────┘');

  console.log('\n2. Patient as Client (ClientTwin)');
  console.log('   ┌─────────────────────────────────────────────┐');
  console.log('   │ 👤 Rahul Mehta                              │');
  console.log('   │    Heart Patient since March 2023           │');
  console.log('   │                                              │');
  console.log('   │ 📊 Health:                                  │');
  console.log('   │    • Churn Risk: Low                        │');
  console.log('   │    • Satisfaction: 4.8/5                    │');
  console.log('   │    • Last Visit: 5 days ago                 │');
  console.log('   │    • Lifetime Value: ₹45,000              │');
  console.log('   │                                              │');
  console.log('   │ 🧠 AI Memory:                              │');
  console.log('   │    • Prefers morning appointments          │');
  console.log('   │    • diabetic - needs special consideration │');
  console.log('   │    • Anniversary: Feb 15                   │');
  console.log('   └─────────────────────────────────────────────┘');

  console.log('\n3. Available Slots');
  console.log('   ┌─────────────────────────────────────────────┐');
  console.log('   │ 📅 January 15, 2024                         │');
  console.log('   │    ✅ 09:00 - Available                     │');
  console.log('   │    ✅ 10:00 - Available                     │');
  console.log('   │    ✅ 11:00 - Available                     │');
  console.log('   │    ❌ 12:00 - Booked                        │');
  console.log('   │    ✅ 14:00 - Available                     │');
  console.log('   │    ✅ 15:00 - Available                     │');
  console.log('   │    ✅ 16:00 - Available                     │');
  console.log('   └─────────────────────────────────────────────┘');

  console.log('\n4. AI Suggestions');
  console.log('   ┌─────────────────────────────────────────────┐');
  console.log('   │ 💡 Follow-ups Needed:                       │');
  console.log('   │    • Follow up with Rahul Mehta             │');
  console.log('   │      (appointment 5 days ago)                │');
  console.log('   │                                              │');
  console.log('   │ 📈 Improvements:                             │');
  console.log('   │    • Collect more patient reviews           │');
  console.log('   │    • 3 pending inquiries - follow up        │');
  console.log('   │                                              │');
  console.log('   │ 🎯 Opportunities:                            │');
  console.log('   │    • Request testimonials (rating 4.8)       │');
  console.log('   │    • Add Tele-consultation service          │');
  console.log('   └─────────────────────────────────────────────┘');

  console.log('\n5. Marketplace Listing');
  console.log('   ┌─────────────────────────────────────────────┐');
  console.log('   │ 🔍 Search: "Cardiologist Mumbai"              │');
  console.log('   │                                              │');
  console.log('   │ Results:                                    │');
  console.log('   │   1. ⭐ Dr. Priya Sharma (4.8) - Featured   │');
  console.log('   │      💰 ₹1,500 per consultation            │');
  console.log('   │      📍 Mumbai | 15+ years exp              │');
  console.log('   │                                              │');
  console.log('   │   2. ⭐ Dr. Amit Patel (4.7)               │');
  console.log('   │   3.   Dr. Sneha Kumar (4.5)              │');
  console.log('   │                                              │');
  console.log('   │ 💬 "Excellent cardiac care!..."            │');
  console.log('   │    - Rahul M. (Verified Patient)           │');
  console.log('   └─────────────────────────────────────────────┘');

  console.log('\n6. Twin Level Evolution');
  console.log('   ┌─────────────────────────────────────────────┐');
  console.log('   │ LEVEL 1: Knowledge Twin ✅                 │');
  console.log('   │   Knows medical information                 │');
  console.log('   │                                              │');
  console.log('   │ LEVEL 2: Work Twin ✅                       │');
  console.log('   │   Knows appointment scheduling, intake     │');
  console.log('   │                                              │');
  console.log('   │ LEVEL 3: Decision Twin ⭐ CURRENT           │');
  console.log('   │   Knows diagnostic patterns, treatment rec  │');
  console.log('   │                                              │');
  console.log('   │ LEVEL 4: Relationship Twin                 │');
  console.log('   │   Knows patient history, preferences        │');
  console.log('   │                                              │');
  console.log('   │ LEVEL 5: Autonomous Twin                   │');
  console.log('   │   Handles routine cases independently        │');
  console.log('   └─────────────────────────────────────────────┘');

  console.log('\n' + '='.repeat(50));
  console.log('\n🚀 Next Steps:');
  console.log('  1. Start CareCode: npx tsx src/index.ts');
  console.log('  2. Test ExpertOS: curl http://localhost:4102/api/expert-os/health');
  console.log('  3. Create doctor: POST /api/carecode/expert/profile');
  console.log('\n  Same integration can be done for other verticals:');
  console.log('  • ledgerai - CA profiles');
  console.log('  • fitmind - Trainer profiles');
  console.log('  • glamai - Stylist profiles');
  console.log('  • And more...\n');
}

demo().catch(console.error);