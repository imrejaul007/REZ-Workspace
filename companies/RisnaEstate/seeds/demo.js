/**
 * RisnaEstate - Demo/Seed Data
 * Run: node seeds/demo.js
 */

const properties = [
  // Dubai Properties
  {
    title: 'Luxury 2BHK in Marina Heights',
    titleAr: 'شقة فاخرة 2 غرفة نوم في مارينا هايتس',
    description: 'Stunning 2-bedroom apartment with panoramic marina views. Premium finishes, built-in wardrobes, modular kitchen.',
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
    amenities: ['Pool', 'Gym', 'Beach Access', 'Concierge', 'Parking', 'Security'],
    images: ['https://images.unsplash.com/photo-1560448204-e02f11c3d0e2'],
    status: 'active',
    featured: true
  },
  {
    title: 'Palm Jumeirah 5BR Villa',
    titleAr: 'فيلا 5 غرف نوم في نخلة جميرا',
    description: 'Magnificent beachfront villa on Palm Jumeirah. Private pool, garden, direct beach access.',
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
    amenities: ['Private Beach', 'Pool', 'Garden', 'Smart Home', 'Gym', 'Maid Room'],
    images: ['https://images.unsplash.com/photo-1613490493576-7fde63acd811'],
    status: 'active',
    featured: true
  },
  {
    title: 'Downtown Dubai 3BR Penthouse',
    description: 'Exclusive penthouse with Burj Khalifa views. Premium finishes throughout.',
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
  {
    title: 'Business Bay 1BR Investment',
    description: 'Prime 1-bedroom for investment. 8% rental yield. Walking distance to metro.',
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
  // India Properties
  {
    title: 'Modern 3BHK in Whitefield',
    description: 'Spacious 3-bedroom apartment in Bangalore tech hub. Close to IT parks, schools, malls.',
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
    reraRegistered: true,
    reraId: 'PRM/KA/RERA/1234/2025',
    status: 'active'
  },
  {
    title: 'Waterfront 2BHK in Mumbai',
    description: 'Premium 2-bedroom in Worli with sea views. Excellent connectivity.',
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
    reraRegistered: true,
    reraId: 'PRM/KA/RERA/5678/2025',
    status: 'active'
  },
  // Rental Properties
  {
    title: 'Cozy 1BHK in JVC',
    description: 'Affordable 1-bedroom for young professionals. Great community.',
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
  }
];

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
    },
    aiScore: { overall: 92, intent: 95, budgetMatch: 90, timeline: 85, engagement: 98 }
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
    },
    aiScore: { overall: 88, intent: 90, budgetMatch: 85, timeline: 95, engagement: 82 }
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
    },
    aiScore: { overall: 85, intent: 88, budgetMatch: 92, timeline: 90, engagement: 70 }
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
    },
    aiScore: { overall: 75, intent: 70, budgetMatch: 85, timeline: 75, engagement: 70 }
  }
];

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
    languages: ['English', 'Arabic', 'Hindi'],
    status: 'active',
    stats: {
      totalListings: 45,
      activeListings: 32,
      totalLeads: 120,
      convertedLeads: 28,
      totalDeals: 35,
      totalVolume: 85000000,
      rating: 4.8
    }
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
    languages: ['English', 'Hindi', 'Kannada'],
    status: 'active',
    stats: {
      totalListings: 28,
      activeListings: 22,
      totalLeads: 85,
      convertedLeads: 18,
      totalDeals: 22,
      totalVolume: 35000000,
      rating: 4.6
    }
  }
];

const visaPrograms = [
  {
    id: 'uae_golden_visa',
    name: 'UAE Golden Visa',
    country: 'AE',
    description: '10-year renewable visa for property investors',
    minimumInvestment: 2000000,
    currency: 'AED',
    investmentTypes: ['property', 'fund'],
    passingPoints: 70,
    validity: '10 years',
    benefits: ['Long-term residency', '100% ownership', 'Family sponsorship', 'Multi-entry']
  },
  {
    id: 'uae_investor_visa',
    name: 'UAE Investor Visa',
    country: 'AE',
    description: '3-year renewable visa',
    minimumInvestment: 545000,
    currency: 'AED',
    investmentTypes: ['property'],
    passingPoints: 60,
    validity: '3 years',
    benefits: [' residency', 'Family sponsorship']
  }
];

console.log('Demo Data Summary:');
console.log('- Properties:', properties.length);
console.log('- Leads:', leads.length);
console.log('- Brokers:', brokers.length);
console.log('- Visa Programs:', visaPrograms.length);

console.log('\nSample Property:');
console.log(JSON.stringify(properties[0], null, 2));

console.log('\nSample Lead:');
console.log(JSON.stringify(leads[0], null, 2));

module.exports = { properties, leads, brokers, visaPrograms };
