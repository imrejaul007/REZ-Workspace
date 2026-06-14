/**
 * Production Seed - Demo Data for testing
 */

const PROPERTIES = [
  // Dubai - Sale
  { title: 'Luxury Marina 2BHK', propertyType: 'apartment', listingType: 'sale', country: 'AE', city: 'Dubai', locality: 'Dubai Marina', price: { amount: 2500000, currency: 'AED' }, bedrooms: 2, bathrooms: 2, carpetArea: 1450, status: 'active', featured: true },
  { title: 'Palm Jumeirah 5BR Villa', propertyType: 'villa', listingType: 'sale', country: 'AE', city: 'Dubai', locality: 'Palm Jumeirah', price: { amount: 45000000, currency: 'AED' }, bedrooms: 5, bathrooms: 6, carpetArea: 8500, status: 'active', featured: true },
  { title: 'Downtown Dubai Penthouse', propertyType: 'penthouse', listingType: 'sale', country: 'AE', city: 'Dubai', locality: 'Downtown', price: { amount: 18000000, currency: 'AED' }, bedrooms: 3, bathrooms: 4, carpetArea: 4200, status: 'active', featured: true },
  { title: 'Business Bay 1BHK Investment', propertyType: 'apartment', listingType: 'sale', country: 'AE', city: 'Dubai', locality: 'Business Bay', price: { amount: 1200000, currency: 'AED' }, bedrooms: 1, bathrooms: 1, carpetArea: 850, status: 'active' },
  { title: 'JVC Studio Apartment', propertyType: 'apartment', listingType: 'rent', country: 'AE', city: 'Dubai', locality: 'JVC', price: { amount: 55000, currency: 'AED' }, bedrooms: 1, bathrooms: 1, carpetArea: 650, status: 'active' },
  { title: 'Jumeirah Family Villa', propertyType: 'villa', listingType: 'rent', country: 'AE', city: 'Dubai', locality: 'Jumeirah', price: { amount: 280000, currency: 'AED' }, bedrooms: 3, bathrooms: 4, carpetArea: 3500, status: 'active' },
  // India - Sale
  { title: 'Whitefield 3BHK Modern', propertyType: 'apartment', listingType: 'sale', country: 'IN', city: 'Bangalore', locality: 'Whitefield', price: { amount: 9500000, currency: 'INR' }, bedrooms: 3, bathrooms: 3, carpetArea: 1800, status: 'active', featured: true },
  { title: 'Mumbai Worli Sea Face', propertyType: 'apartment', listingType: 'sale', country: 'IN', city: 'Mumbai', locality: 'Worli', price: { amount: 28000000, currency: 'INR' }, bedrooms: 2, bathrooms: 2, carpetArea: 1200, status: 'active' },
  { title: 'Goa Anjuna Villa', propertyType: 'villa', listingType: 'sale', country: 'IN', city: 'Goa', locality: 'Anjuna', price: { amount: 6500000, currency: 'INR' }, bedrooms: 4, bathrooms: 4, carpetArea: 3200, status: 'active' },
];

const LEADS = [
  { name: 'Rajesh Sharma', phone: '+919876543210', email: 'rajesh.sharma@gmail.com', source: 'website', segment: 'hni', preferences: { budget: { min: 20000000, max: 50000000, currency: 'INR' }, timeline: '3-6months', purpose: 'buy' },
  { name: 'Priya Patel', phone: '+919876543211', email: 'priya.patel@outlook.com', source: 'whatsapp', segment: 'nri', preferences: { budget: { min: 2000000, max: 5000000, currency: 'AED' }, timeline: 'immediate', purpose: 'invest' },
  { name: 'Sarah Johnson', phone: '+971501234567', email: 'sarah.j@email.ae', source: 'ad', segment: 'nri', preferences: { budget: { min: 30000000, max: 50000000, currency: 'AED' }, timeline: 'immediate', purpose: 'buy' },
  { name: 'Amit Kumar', phone: '+919876543212', email: 'amit.kumar@tech.com', source: 'referral', segment: 'investor', preferences: { budget: { min: 10000000, max: 20000000, currency: 'AED' }, timeline: '1-3months', purpose: 'invest' },
  { name: 'Vikram Singh', phone: '+919876543213', source: 'organic', segment: 'mid_segment', preferences: { budget: { min: 3000000, max: 7000000, currency: 'INR' }, timeline: '6-12months', purpose: 'buy' },
];

const BROKERS = [
  { name: 'Ahmed Al Maktoum', phone: '+971501234001', email: 'ahmed@primeproperties.ae', company: 'Prime Properties LLC', license: 'BRN-12345', city: 'Dubai', country: 'AE', status: 'active' },
  { name: 'Priya Sharma', phone: '+919876543200', email: 'priya@bangalorerelty.in', company: 'Bangalore Realty', license: 'RERA/KA/2024/1234', city: 'Bangalore', country: 'IN', status: 'active' },
  { name: 'Vikram Mehta', phone: '+919876543300', email: 'vikram@mumbaiproperty.in', company: 'Mumbai Property Hub', license: 'MahaRERA-5678', city: 'Mumbai', country: 'IN', status: 'active' },
];

const VISA_PROGRAMS = [
  { id: 'uae_golden_visa', name: 'UAE Golden Visa', country: 'AE', minInvestment: 2000000, currency: 'AED', validity: '10 years', benefits: ['residency', 'family_sponsorship', 'multi_entry'] },
  { id: 'uae_investor_visa', name: 'UAE Investor Visa', country: 'AE', minInvestment: 545000, currency: 'AED', validity: '3 years', benefits: ['residency'] },
];

const REFERRAL_TIERS = [
  { level: 1, rewardType: 'cash', rewardValue: 5000, currency: 'AED' },
  { level: 2, rewardType: 'cash', rewardValue: 2000, currency: 'AED' },
];

console.log('Production Seed Data Ready');
console.log(`- Properties: ${PROPERTIES.length}`);
console.log(`- Leads: ${LEADS.length}`);
console.log(`- Brokers: ${BROKERS.length}`);
console.log(`- Visa Programs: ${VISA_PROGRAMS.length}`);

module.exports = { PROPERTIES, LEADS, BROKERS, VISA_PROGRAMS, REFERRAL_TIERS };
