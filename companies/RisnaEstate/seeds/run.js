/**
 * RisnaEstate - Production Seed Script
 * Run with: node seeds/run.js
 */

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/risna';

const SEED_DATA = {
  properties: [
    // Dubai - Sale
    { title: 'Luxury Marina 2BHK', type: 'apartment', listingType: 'sale', country: 'AE', city: 'Dubai', locality: 'Dubai Marina', price: { amount: 2500000, currency: 'AED' }, bedrooms: 2, bathrooms: 2, area: 1450, status: 'active', featured: true },
    { title: 'Palm Jumeirah 5BR Villa', type: 'villa', listingType: 'sale', country: 'AE', city: 'Dubai', locality: 'Palm Jumeirah', price: { amount: 45000000, currency: 'AED' }, bedrooms: 5, bathrooms: 6, area: 8500, status: 'active', featured: true },
    { title: 'Downtown Dubai Penthouse', type: 'penthouse', listingType: 'sale', country: 'AE', city: 'Dubai', locality: 'Downtown', price: { amount: 18000000, currency: 'AED' }, bedrooms: 3, bathrooms: 4, area: 4200, status: 'active', featured: true },
    { title: 'Business Bay 1BHK', type: 'apartment', listingType: 'sale', country: 'AE', city: 'Dubai', locality: 'Business Bay', price: { amount: 1200000, currency: 'AED' }, bedrooms: 1, bathrooms: 1, area: 850, status: 'active' },
    { title: 'JVC Studio', type: 'studio', listingType: 'rent', country: 'AE', city: 'Dubai', locality: 'JVC', price: { amount: 55000, currency: 'AED' }, bedrooms: 0, bathrooms: 1, area: 650, status: 'active' },
    { title: 'Jumeirah Family Villa', type: 'villa', listingType: 'rent', country: 'AE', city: 'Dubai', locality: 'Jumeirah', price: { amount: 280000, currency: 'AED' }, bedrooms: 3, bathrooms: 4, area: 3500, status: 'active' },
    // India - Sale
    { title: 'Whitefield 3BHK Modern', type: 'apartment', listingType: 'sale', country: 'IN', city: 'Bangalore', locality: 'Whitefield', price: { amount: 9500000, currency: 'INR' }, bedrooms: 3, bathrooms: 3, area: 1800, status: 'active', featured: true },
    { title: 'Mumbai Worli Sea Face', type: 'apartment', listingType: 'sale', country: 'IN', city: 'Mumbai', locality: 'Worli', price: { amount: 28000000, currency: 'INR' }, bedrooms: 2, bathrooms: 2, area: 1200, status: 'active' },
    { title: 'Goa Anjuna Villa', type: 'villa', listingType: 'sale', country: 'IN', city: 'Goa', locality: 'Anjuna', price: { amount: 6500000, currency: 'INR' }, bedrooms: 4, bathrooms: 4, area: 3200, status: 'active' },
    { title: 'Gurgaon Golf Course 4BHK', type: 'apartment', listingType: 'sale', country: 'IN', city: 'Gurgaon', locality: 'Golf Course Road', price: { amount: 15000000, currency: 'INR' }, bedrooms: 4, bathrooms: 4, area: 3200, status: 'active' },
  ],

  leads: [
    { name: 'Rajesh Sharma', phone: '+919876543210', email: 'rajesh.sharma@gmail.com', source: 'website', segment: 'hni', budget: { min: 20000000, max: 50000000, currency: 'INR' }, timeline: '3-6months', purpose: 'buy' },
    { name: 'Priya Patel', phone: '+919876543211', email: 'priya.patel@outlook.com', source: 'whatsapp', segment: 'nri', budget: { min: 2000000, max: 5000000, currency: 'AED' }, timeline: 'immediate', purpose: 'invest' },
    { name: 'Sarah Johnson', phone: '+971501234567', email: 'sarah.j@email.ae', source: 'ad', segment: 'nri', budget: { min: 30000000, max: 50000000, currency: 'AED' }, timeline: 'immediate', purpose: 'buy' },
    { name: 'Amit Kumar', phone: '+919876543212', email: 'amit.kumar@tech.com', source: 'referral', segment: 'investor', budget: { min: 10000000, max: 20000000, currency: 'AED' }, timeline: '1-3months', purpose: 'invest' },
    { name: 'Vikram Singh', phone: '+919876543213', source: 'organic', segment: 'mid', budget: { min: 3000000, max: 7000000, currency: 'INR' }, timeline: '6-12months', purpose: 'buy' },
  ],

  brokers: [
    { name: 'Ahmed Al Maktoum', phone: '+971501234001', email: 'ahmed@primeproperties.ae', company: 'Prime Properties LLC', license: 'BRN-12345', city: 'Dubai', country: 'AE', status: 'active' },
    { name: 'Priya Sharma', phone: '+919876543200', email: 'priya@bangalorerelty.in', company: 'Bangalore Realty', license: 'RERA/KA/2024/1234', city: 'Bangalore', country: 'IN', status: 'active' },
    { name: 'Vikram Mehta', phone: '+919876543300', email: 'vikram@mumbaiproperty.in', company: 'Mumbai Property Hub', license: 'MahaRERA-5678', city: 'Mumbai', country: 'IN', status: 'active' },
  ],

  visaPrograms: [
    { id: 'uae_golden_visa', name: 'UAE Golden Visa', country: 'AE', minInvestment: 2000000, currency: 'AED', validity: '10 years', benefits: ['residency', 'family_sponsorship', 'multi_entry'] },
    { id: 'uae_investor_visa', name: 'UAE Investor Visa', country: 'AE', minInvestment: 545000, currency: 'AED', validity: '3 years', benefits: ['residency'] },
  ],

  referralTiers: [
    { level: 1, rewardType: 'cash', rewardValue: 5000, currency: 'AED' },
    { level: 2, rewardType: 'cash', rewardValue: 2000, currency: 'AED' },
  ]
};

async function seed() {
  console.log('🔄 Seeding RisnaEstate database...\n');

  try {
    // For MongoDB native driver
    const { MongoClient } = require('mongodb');
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    const db = client.db();

    // Seed Properties
    console.log('📦 Seeding properties...');
    const properties = db.collection('properties');
    await properties.deleteMany({});
    const propertyResult = await properties.insertMany(SEED_DATA.properties.map(p => ({
      ...p,
      createdAt: new Date(),
      updatedAt: new Date()
    })));
    console.log(`   ✅ ${propertyResult.insertedCount} properties\n`);

    // Seed Leads
    console.log('📦 Seeding leads...');
    const leads = db.collection('leads');
    await leads.deleteMany({});
    const leadResult = await leads.insertMany(SEED_DATA.leads.map(l => ({
      ...l,
      score: Math.floor(Math.random() * 40) + 60,
      status: 'new',
      createdAt: new Date(),
      updatedAt: new Date()
    })));
    console.log(`   ✅ ${leadResult.insertedCount} leads\n`);

    // Seed Brokers
    console.log('📦 Seeding brokers...');
    const brokers = db.collection('brokers');
    await brokers.deleteMany({});
    const brokerResult = await brokers.insertMany(SEED_DATA.brokers.map(b => ({
      ...b,
      verifiedAt: new Date(),
      createdAt: new Date()
    })));
    console.log(`   ✅ ${brokerResult.insertedCount} brokers\n`);

    // Seed Visa Programs
    console.log('📦 Seeding visa programs...');
    const visaPrograms = db.collection('visaprograms');
    await visaPrograms.deleteMany({});
    const visaResult = await visaPrograms.insertMany(SEED_DATA.visaPrograms);
    console.log(`   ✅ ${visaResult.insertedCount} visa programs\n`);

    // Create indexes
    console.log('🔍 Creating indexes...');
    await properties.createIndex({ locality: 1, country: 1 });
    await properties.createIndex({ price: 1 });
    await leads.createIndex({ phone: 1 });
    await leads.createIndex({ segment: 1 });
    await brokers.createIndex({ city: 1 });
    console.log('   ✅ Indexes created\n');

    await client.close();

    console.log('🎉 Seed complete!\n');
    console.log('Summary:');
    console.log(`  Properties: ${SEED_DATA.properties.length}`);
    console.log(`  Leads: ${SEED_DATA.leads.length}`);
    console.log(`  Brokers: ${SEED_DATA.brokers.length}`);
    console.log(`  Visa Programs: ${SEED_DATA.visaPrograms.length}`);
    console.log('\n🚀 Run `npm run dev` to start the app');

  } catch (error) {
    console.error('❌ Seed failed:', error.message);
    process.exit(1);
  }
}

seed();
