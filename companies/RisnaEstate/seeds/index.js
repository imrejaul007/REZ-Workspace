/**
 * RisnaEstate Seed Data
 * Run: npm run seed:all
 */

const axios = require('axios');

const BASE_URL = process.env.GATEWAY_URL || 'http://localhost:3000';
const INTERNAL_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || 'risna-internal-token';

const headers = {
  'X-Internal-Token': INTERNAL_TOKEN,
  'Content-Type': 'application/json'
};

async function seedProperty() {
  console.log('Seeding properties...');

  const properties = [
    // Dubai Properties
    {
      title: 'Luxury 2BHK in Marina Heights',
      titleAr: 'شقة فاخرة 2 غرفة نوم في مارينا هايتس',
      description: 'Stunning 2-bedroom apartment in Dubai Marina with panoramic views of the Arabian Gulf. Features include modern amenities, infinity pool, and direct beach access.',
      propertyType: 'apartment',
      listingType: 'sale',
      country: 'AE',
      city: 'Dubai',
      locality: 'Dubai Marina',
      price: { amount: 2500000, currency: 'AED' },
      bedrooms: 2,
      bathrooms: 2,
      carpetArea: 1450,
      furnishedStatus: 'furnished',
      amenities: ['Pool', 'Gym', 'Beach Access', 'Concierge', 'Parking'],
      status: 'active'
    },
    {
      title: 'Palm Jumeirah Villa - 5 Bed',
      titleAr: 'فيلا في نخلة جميرا - 5 غرف نوم',
      description: 'Magnificent 5-bedroom villa on the Palm Jumeirah with private beach, pool, and garden. Direct sea views.',
      propertyType: 'villa',
      listingType: 'sale',
      country: 'AE',
      city: 'Dubai',
      locality: 'Palm Jumeirah',
      price: { amount: 45000000, currency: 'AED' },
      bedrooms: 5,
      bathrooms: 6,
      carpetArea: 8500,
      furnishedStatus: 'furnished',
      amenities: ['Private Beach', 'Pool', 'Garden', 'Smart Home', 'Gym'],
      status: 'active'
    },
    {
      title: 'Business Bay 1BHK - Investment',
      titleAr: 'شقة 1 غرفة نوم في بيزنس باي - استثمار',
      description: 'Prime 1-bedroom apartment in Business Bay, perfect for investment with 8% rental yield. Walking distance to metro.',
      propertyType: 'apartment',
      listingType: 'sale',
      country: 'AE',
      city: 'Dubai',
      locality: 'Business Bay',
      price: { amount: 1200000, currency: 'AED' },
      bedrooms: 1,
      bathrooms: 1,
      carpetArea: 850,
      furnishedStatus: 'semi-furnished',
      amenities: ['Pool', 'Gym', 'Metro Access', 'Security'],
      status: 'active'
    },
    {
      title: 'Downtown Dubai 3BHK Penthouse',
      titleAr: 'بنتهاوس 3 غرف نوم في وسط دبي',
      description: 'Exclusive penthouse in Downtown Dubai with Burj Khalifa views. Premium finishes throughout.',
      propertyType: 'penthouse',
      listingType: 'sale',
      country: 'AE',
      city: 'Dubai',
      locality: 'Downtown Dubai',
      price: { amount: 18000000, currency: 'AED' },
      bedrooms: 3,
      bathrooms: 4,
      carpetArea: 4200,
      furnishedStatus: 'furnished',
      amenities: ['Burj Khalifa View', 'Private Lift', 'Terrace', 'Concierge'],
      status: 'active'
    },
    // India Properties
    {
      title: 'Modern 3BHK in Whitefield',
      titleAr: 'شقة 3 غرف نوم حديثة في وايتفيلد',
      description: 'Spacious 3-bedroom apartment in Whitefield, Bangalore. Close to IT parks, schools, and malls.',
      propertyType: 'apartment',
      listingType: 'sale',
      country: 'IN',
      city: 'Bangalore',
      locality: 'Whitefield',
      price: { amount: 9500000, currency: 'INR' },
      bedrooms: 3,
      bathrooms: 3,
      carpetArea: 1800,
      furnishedStatus: 'semi-furnished',
      amenities: ['Club House', 'Swimming Pool', 'Gym', 'Children Play Area', '24/7 Security'],
      RERARegistered: true,
      reraId: 'PRM/KA/RERA/1234/2025',
      status: 'active'
    },
    {
      title: 'Luxury Villa in Goa',
      titleAr: 'فيلا فاخرة في غوا',
      description: 'Beautiful 4-bedroom villa in North Goa with private pool and garden. Perfect for vacation home.',
      propertyType: 'villa',
      listingType: 'sale',
      country: 'IN',
      city: 'Goa',
      locality: 'Anjuna',
      price: { amount: 6500000, currency: 'INR' },
      bedrooms: 4,
      bathrooms: 4,
      carpetArea: 3200,
      furnishedStatus: 'furnished',
      amenities: ['Private Pool', 'Garden', 'Parking', 'Security'],
      status: 'active'
    },
    {
      title: 'Waterfront 2BHK in Mumbai',
      titleAr: 'شقة 2 غرفة نوم على الواجهة المائية في مومباي',
      description: 'Premium 2-bedroom apartment in Worli with sea views. Modern amenities and excellent connectivity.',
      propertyType: 'apartment',
      listingType: 'sale',
      country: 'IN',
      city: 'Mumbai',
      locality: 'Worli',
      price: { amount: 28000000, currency: 'INR' },
      bedrooms: 2,
      bathrooms: 2,
      carpetArea: 1200,
      furnishedStatus: 'unfurnished',
      amenities: ['Sea View', 'Gym', 'Pool', 'Security', 'Parking'],
      RERARegistered: true,
      reraId: 'PRM/KA/RERA/5678/2025',
      status: 'active'
    },
    // Rental Properties
    {
      title: 'Cozy 1BHK in JVC',
      titleAr: 'شقة 1 غرفة نوم مريحة في جي في سي',
      description: 'Affordable 1-bedroom apartment in Jumeirah Village Circle. Great for young professionals.',
      propertyType: 'apartment',
      listingType: 'rent',
      country: 'AE',
      city: 'Dubai',
      locality: 'JVC',
      price: { amount: 55000, currency: 'AED' },
      bedrooms: 1,
      bathrooms: 1,
      carpetArea: 650,
      furnishedStatus: 'furnished',
      amenities: ['Pool', 'Gym', 'Parking', 'Security'],
      status: 'active'
    },
    {
      title: 'Family 3BHK in Jumeirah',
      titleAr: 'شقة 3 غرف نوم عائلية في الجميرا',
      description: 'Spacious 3-bedroom villa in Jumeirah 1. Perfect for families. Private garden and parking.',
      propertyType: 'villa',
      listingType: 'rent',
      country: 'AE',
      city: 'Dubai',
      locality: 'Jumeirah',
      price: { amount: 280000, currency: 'AED' },
      bedrooms: 3,
      bathrooms: 4,
      carpetArea: 3500,
      furnishedStatus: 'furnished',
      amenities: ['Garden', 'Parking', 'Maid Room', 'Security'],
      status: 'active'
    }
  ];

  const results = [];
  for (const property of properties) {
    try {
      const res = await axios.post(`${BASE_URL}/api/v1/properties`, property, { headers });
      results.push({ success: true, title: property.title, id: res.data.data._id });
      console.log('  ✓ Created:', property.title);
    } catch (err) {
      console.log('  ✗ Failed:', property.title, err.message);
      results.push({ success: false, title: property.title });
    }
  }

  return results;
}

async function seedLead() {
  console.log('\nSeeding leads...');

  const leads = [
    {
      name: 'Rajesh Sharma',
      phone: '+919876543210',
      email: 'rajesh.sharma@gmail.com',
      source: 'website',
      segment: 'hni',
      preferences: {
        propertyTypes: ['apartment', 'villa'],
        budget: { min: 20000000, max: 50000000, currency: 'INR' },
        timeline: '3-6months',
        purpose: 'buy'
      }
    },
    {
      name: 'Priya Patel',
      phone: '+919876543211',
      email: 'priya.patel@outlook.com',
      source: 'whatsapp',
      segment: 'nri',
      preferences: {
        propertyTypes: ['apartment'],
        budget: { min: 2000000, max: 5000000, currency: 'AED' },
        timeline: 'immediate',
        purpose: 'invest'
      }
    },
    {
      name: 'Amit Kumar',
      phone: '+919876543212',
      email: 'amit.kumar@tech.com',
      source: 'referral',
      segment: 'investor',
      preferences: {
        propertyTypes: ['apartment', 'penthouse'],
        budget: { min: 10000000, max: 20000000, currency: 'AED' },
        timeline: '1-3months',
        purpose: 'invest'
      }
    },
    {
      name: 'Sarah Johnson',
      phone: '+971501234567',
      email: 'sarah.j@email.ae',
      source: 'ad',
      segment: 'nri',
      preferences: {
        propertyTypes: ['villa'],
        budget: { min: 30000000, max: 50000000, currency: 'AED' },
        timeline: 'immediate',
        purpose: 'buy'
      }
    },
    {
      name: 'Vikram Singh',
      phone: '+919876543213',
      source: 'organic',
      segment: 'mid_segment',
      preferences: {
        propertyTypes: ['apartment'],
        budget: { min: 5000000, max: 10000000, currency: 'INR' },
        timeline: '6-12months',
        purpose: 'buy'
      }
    }
  ];

  const results = [];
  for (const lead of leads) {
    try {
      const res = await axios.post(`${BASE_URL}/api/v1/leads`, lead, { headers });
      results.push({ success: true, name: lead.name, id: res.data.data._id });
      console.log('  ✓ Created:', lead.name);
    } catch (err) {
      console.log('  ✗ Failed:', lead.name);
      results.push({ success: false, name: lead.name });
    }
  }

  return results;
}

async function seedBroker() {
  console.log('\nSeeding brokers...');

  const brokers = [
    {
      userId: 'broker_001',
      name: 'Ahmed Al Maktoum',
      phone: '+971501234001',
      email: 'ahmed@primeproperties.ae',
      companyName: 'Prime Properties LLC',
      license: {
        number: 'BRN-12345',
        type: 'broker',
        state: 'Dubai',
        verified: true
      },
      coverage: {
        countries: ['AE'],
        cities: ['Dubai']
      },
      specializations: ['Luxury', 'Investment', 'Off-Plan'],
      languages: ['English', 'Arabic', 'Hindi']
    },
    {
      userId: 'broker_002',
      name: 'Priya Sharma',
      phone: '+919876543200',
      email: 'priya@bangalorerelty.in',
      companyName: 'Bangalore Realty',
      license: {
        number: 'RERA/KA/2024/1234',
        type: 'agent',
        state: 'Karnataka',
        reraNumber: 'RERA-PRM/KA/RERA/1234/2024',
        verified: true
      },
      coverage: {
        countries: ['IN'],
        cities: ['Bangalore', 'Mumbai', 'Pune']
      },
      specializations: ['Residential', 'Commercial', 'Luxury'],
      languages: ['English', 'Hindi', 'Kannada']
    }
  ];

  const results = [];
  for (const broker of brokers) {
    try {
      const res = await axios.post(`${BASE_URL}/api/v1/brokers`, broker, { headers });
      results.push({ success: true, name: broker.name, id: res.data.data._id });
      console.log('  ✓ Created:', broker.name);
    } catch (err) {
      console.log('  ✗ Failed:', broker.name);
      results.push({ success: false, name: broker.name });
    }
  }

  return results;
}

async function seedReferral() {
  console.log('\nSeeding referral programs...');

  const programs = [
    {
      name: 'Dubai Property Referral',
      description: 'Earn commission for referring buyers to Dubai properties',
      country: 'AE',
      levels: [
        { level: 1, rewardType: 'cash', rewardValue: 5000, currency: 'AED' },
        { level: 2, rewardType: 'cash', rewardValue: 2000, currency: 'AED' }
      ],
      maxLevels: 2,
      active: true
    },
    {
      name: 'India Property Referral',
      description: 'Earn commission for referring buyers to Indian properties',
      country: 'IN',
      levels: [
        { level: 1, rewardType: 'cash', rewardValue: 25000, currency: 'INR' }
      ],
      maxLevels: 1,
      active: true
    }
  ];

  const results = [];
  for (const program of programs) {
    try {
      const res = await axios.post(`${BASE_URL}/api/v1/referrals/programs`, program, { headers });
      results.push({ success: true, name: program.name, id: res.data.data._id });
      console.log('  ✓ Created:', program.name);
    } catch (err) {
      console.log('  ✗ Failed:', program.name);
      results.push({ success: false, name: program.name });
    }
  }

  return results;
}

async function seedVisa() {
  console.log('\nSeeding visa eligibility data...');

  const visaPrograms = [
    {
      id: 'golden_visa',
      name: 'UAE Golden Visa',
      description: '10-year renewable visa for property investors',
      minimumInvestment: 2000000,
      currency: 'AED',
      investmentTypes: ['property', 'fund'],
      passingPoints: 70
    },
    {
      id: 'investor_visa',
      name: 'UAE Investor Visa',
      description: '3-year renewable visa for property investors',
      minimumInvestment: 545000,
      currency: 'AED',
      investmentTypes: ['property'],
      passingPoints: 60
    }
  ];

  console.log('  ✓ Visa programs configured');
  return visaPrograms;
}

async function main() {
  console.log('======================================');
  console.log('  RisnaEstate Seed Data');
  console.log('======================================\n');

  try {
    await seedProperty();
    await seedLead();
    await seedBroker();
    await seedReferral();
    await seedVisa();

    console.log('\n======================================');
    console.log('  Seed complete!');
    console.log('======================================');
  } catch (err) {
    console.error('Seed failed:', err.message);
  }
}

main();


// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'seeds',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Liveness probe
app.get('/health/live', (req, res) => {
  res.json({ status: 'alive' });
});

// Readiness probe
app.get('/health/ready', (req, res) => {
  res.json({ status: 'ready' });
});
