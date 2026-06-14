import logger from './utils/logger';

/**
 * Seed Script - Populate initial aggregated data
 * Run: npx ts-node scripts/seed.ts
 */

import mongoose from 'mongoose';
import { MerchantData } from '../src/models/MerchantData';
import { AggregatedMetrics } from '../src/models/AggregatedData';
import dotenv from 'dotenv';

dotenv.config();

const SAMPLE_DATA = [
  {
    merchantId: 'sample-merchant-001',
    businessName: 'Spice Garden',
    locality: 'Koramangala',
    pincode: '560034',
    city: 'Bangalore',
    state: 'Karnataka',
    industry: 'restaurant' as const,
    category: 'biryani',
    dailyMetrics: generateSampleMetrics(150, 350),
    dataSharingConsent: true,
    consentGivenAt: new Date()
  },
  {
    merchantId: 'sample-merchant-002',
    businessName: 'Pizza Hub',
    locality: 'Koramangala',
    pincode: '560034',
    city: 'Bangalore',
    state: 'Karnataka',
    industry: 'restaurant' as const,
    category: 'pizza',
    dailyMetrics: generateSampleMetrics(80, 450),
    dataSharingConsent: true,
    consentGivenAt: new Date()
  },
  {
    merchantId: 'sample-merchant-003',
    businessName: 'Cafe Coffee Day',
    locality: 'Koramangala',
    pincode: '560034',
    city: 'Bangalore',
    state: 'Karnataka',
    industry: 'restaurant' as const,
    category: 'cafe',
    dailyMetrics: generateSampleMetrics(120, 280),
    dataSharingConsent: true,
    consentGivenAt: new Date()
  },
  {
    merchantId: 'sample-merchant-004',
    businessName: 'Biryani Palace',
    locality: 'Indiranagar',
    pincode: '560038',
    city: 'Bangalore',
    state: 'Karnataka',
    industry: 'restaurant' as const,
    category: 'biryani',
    dailyMetrics: generateSampleMetrics(200, 420),
    dataSharingConsent: true,
    consentGivenAt: new Date()
  },
  {
    merchantId: 'sample-merchant-005',
    businessName: 'Healthy Bowl',
    locality: 'Indiranagar',
    pincode: '560038',
    city: 'Bangalore',
    state: 'Karnataka',
    industry: 'restaurant' as const,
    category: 'healthy',
    dailyMetrics: generateSampleMetrics(60, 520),
    dataSharingConsent: true,
    consentGivenAt: new Date()
  },
  {
    merchantId: 'sample-merchant-006',
    businessName: 'Hotel Sunrise',
    locality: 'MG Road',
    pincode: '560001',
    city: 'Bangalore',
    state: 'Karnataka',
    industry: 'hotel' as const,
    category: 'budget',
    dailyMetrics: generateSampleMetrics(15, 2500),
    dataSharingConsent: true,
    consentGivenAt: new Date()
  },
  {
    merchantId: 'sample-merchant-007',
    businessName: 'Glow Studio',
    locality: 'Indiranagar',
    pincode: '560038',
    city: 'Bangalore',
    state: 'Karnataka',
    industry: 'salon' as const,
    category: 'unisex',
    dailyMetrics: generateSampleMetrics(25, 800),
    dataSharingConsent: true,
    consentGivenAt: new Date()
  },
  {
    merchantId: 'sample-merchant-008',
    businessName: 'FitZone Gym',
    locality: 'Koramangala',
    pincode: '560034',
    city: 'Bangalore',
    state: 'Karnataka',
    industry: 'fitness' as const,
    category: 'gym',
    dailyMetrics: generateSampleMetrics(40, 1500),
    dataSharingConsent: true,
    consentGivenAt: new Date()
  }
];

function generateSampleMetrics(avgOrders: number, avgOrderValue: number) {
  const metrics = [];
  const today = new Date();

  for (let i = 0; i < 30; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);

    // Add some variance
    const variance = 0.3;
    const orders = Math.round(avgOrders * (1 + (Math.random() - 0.5) * variance));
    const revenue = orders * avgOrderValue * (1 + (Math.random() - 0.5) * 0.1);
    const customers = Math.round(orders * 0.8);

    // Peak hours: lunch (12-2) and dinner (7-9)
    const peakHours = [12, 13, 19, 20, 21];

    metrics.push({
      date,
      orders,
      revenue,
      customers,
      avgOrderValue: revenue / orders,
      repeatCustomers: Math.round(customers * 0.35),
      newCustomers: Math.round(customers * 0.65),
      peakHours
    });
  }

  return metrics;
}

async function seed() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/rez_merchant_intelligence';
    await mongoose.connect(mongoUri);
    logger.info('Connected to MongoDB');

    // Clear existing data
    await MerchantData.deleteMany({});
    await AggregatedMetrics.deleteMany({});
    logger.info('Cleared existing data');

    // Insert sample merchants
    await MerchantData.insertMany(SAMPLE_DATA);
    logger.info(`Inserted ${SAMPLE_DATA.length} sample merchants`);

    // Create aggregated metrics for each locality
    const localities = new Map<string, typeof SAMPLE_DATA>();

    for (const merchant of SAMPLE_DATA) {
      const key = `${merchant.locality}-${merchant.industry}`;
      if (!localities.has(key)) {
        localities.set(key, []);
      }
      localities.get(key)!.push(merchant);
    }

    for (const [key, merchants] of localities) {
      const [locality, industry] = key.split('-');
      const [firstMerchant] = merchants;

      // Calculate aggregates
      const allMetrics = merchants.flatMap(m => m.dailyMetrics);
      const totalOrders = allMetrics.reduce((sum, m) => sum + m.orders, 0);
      const totalRevenue = allMetrics.reduce((sum, m) => sum + m.revenue, 0);
      const avgOrderValue = totalRevenue / totalOrders;

      // Peak hours
      const allPeakHours: number[][] = merchants.map(m => {
        const recent = m.dailyMetrics.slice(0, 7);
        return recent.flatMap(d => d.peakHours || []);
      });
      const flatPeakHours = allPeakHours.flat();
      const hourCounts: Record<number, number> = {};
      for (const hour of flatPeakHours) {
        hourCounts[hour] = (hourCounts[hour] || 0) + 1;
      }
      const peakHours = Object.entries(hourCounts)
        .filter(([, count]) => count >= merchants.length * 0.3)
        .map(([hour]) => parseInt(hour))
        .sort((a, b) => a - b);

      // Growth (simulated - some growing, some stable)
      const orderGrowth30d = (Math.random() - 0.3) * 30;
      const revenueGrowth30d = (Math.random() - 0.3) * 25;

      await AggregatedMetrics.create({
        locality,
        pincode: firstMerchant.pincode,
        city: firstMerchant.city,
        state: firstMerchant.state,
        country: 'India',
        industry: industry as unknown,
        category: 'all',
        merchantCount: merchants.length,
        avgOrderValue: Math.round(avgOrderValue),
        avgOrdersPerDay: Math.round(totalOrders / 30 / merchants.length),
        avgOrdersPerMerchant: Math.round(totalOrders / merchants.length),
        totalOrders30d: totalOrders,
        totalRevenue30d: Math.round(totalRevenue),
        peakHours,
        peakDays: [0, 6], // weekends
        topCategories: [
          { category: merchants[0].category, percentage: 60 },
          { category: 'other', percentage: 40 }
        ],
        avgRetentionRate: 35,
        avgRepeatRate: 30,
        orderGrowth30d: Math.round(orderGrowth30d * 10) / 10,
        revenueGrowth30d: Math.round(revenueGrowth30d * 10) / 10,
        merchantGrowth30d: Math.round(Math.random() * 10),
        avgCustomerAge: 45,
        avgOrdersPerCustomer: 2.5,
        periodStart: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        periodEnd: new Date()
      });

      logger.info(`Created aggregated metrics for ${locality} (${industry})`);
    }

    logger.info('\n✅ Seed completed successfully!');
    logger.info(`- ${SAMPLE_DATA.length} merchants`);
    logger.info(`- ${localities.size} localities`);
    logger.info(`- Aggregated metrics created`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  }
}

seed();
