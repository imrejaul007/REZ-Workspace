/**
 * REZ Go Extended Seed Script
 *
 * Seeds additional data:
 * - More products with product intelligence
 * - Sponsored campaigns
 * - Sample sessions for testing
 *
 * Usage: npx tsx scripts/seed-extended.ts
 */

import mongoose from 'mongoose';
import { ProductIntelligence } from '../src/models/ProductIntelligence.js';
import { SponsoredCampaign } from '../src/models/SponsoredCommerce.js';
import { config } from '../src/config/index.js';

// Extended products with intelligence data
const productsWithIntelligence = [
  {
    productId: 'PROD-AMUL-BUTTER',
    nutrition: {
      servingSize: '30g',
      calories: 100,
      protein: 1,
      carbs: 0,
      fat: 11,
      fiber: 0,
      sugar: 0,
      sodium: 150,
    },
    allergens: {
      contains: ['Milk'],
      mayContain: [],
      traces: [],
      dietary: { vegetarian: true, vegan: false, glutenFree: true, dairyFree: false, nutFree: true, halal: true, kosher: false, jain: false },
    },
    healthScore: 70,
    healthInsights: [
      { type: 'info', category: 'nutrition', message: 'High in saturated fat', severity: 'medium' },
      { type: 'tip', category: 'nutrition', message: 'Good source of Vitamin A', severity: 'low' },
    ],
    tutorials: [
      { type: 'recipe', title: 'Butter Recipes', url: 'https://example.com/butter-recipes', language: 'en' },
    ],
    howToUse: 'Spread on bread, use in cooking, or add to recipes for rich flavor.',
    storageInstructions: 'Refrigerate after opening. Use within 3 months.',
    shelfLife: '6 months from manufacturing date',
    countryOfOrigin: 'India',
  },
  {
    productId: 'PROD-MAGGI-2MIN',
    nutrition: {
      servingSize: '70g',
      calories: 180,
      protein: 5,
      carbs: 25,
      fat: 7,
      fiber: 1,
      sugar: 2,
      sodium: 980,
    },
    allergens: {
      contains: ['Wheat', 'Gluten'],
      mayContain: ['Milk', 'Soy'],
      traces: [],
      dietary: { vegetarian: true, vegan: false, glutenFree: false, dairyFree: true, nutFree: true, halal: true, kosher: false, jain: false },
    },
    healthScore: 45,
    healthInsights: [
      { type: 'warning', category: 'sodium', message: 'High sodium content (980mg)', severity: 'high' },
      { type: 'tip', category: 'nutrition', message: 'Add vegetables for better nutrition', severity: 'low' },
    ],
    tutorials: [
      { type: 'recipe', title: 'Quick Maggi Recipes', url: 'https://example.com/maggi-recipes', language: 'en' },
      { type: 'video', title: 'Maggi Cooking Tutorial', url: 'https://example.com/maggi-video', duration: 120, language: 'en' },
    ],
    howToUse: 'Boil 1½ cups water, add noodles and tastemaker, cook for 2 minutes.',
    storageInstructions: 'Store in a cool, dry place',
    shelfLife: '12 months from manufacturing date',
    countryOfOrigin: 'India',
  },
  {
    productId: 'PROD-PARLE-G',
    nutrition: {
      servingSize: '30g (3 biscuits)',
      calories: 120,
      protein: 2,
      carbs: 20,
      fat: 4,
      fiber: 0,
      sugar: 8,
      sodium: 80,
    },
    allergens: {
      contains: ['Wheat', 'Milk', 'Gluten'],
      mayContain: ['Soy', 'Egg'],
      traces: [],
      dietary: { vegetarian: true, vegan: false, glutenFree: false, dairyFree: false, nutFree: true, halal: false, kosher: false, jain: false },
    },
    healthScore: 55,
    healthInsights: [
      { type: 'info', category: 'sugar', message: 'Contains 8g sugar per serving', severity: 'medium' },
      { type: 'tip', category: 'nutrition', message: 'Good for quick energy', severity: 'low' },
    ],
    howToUse: 'Enjoy with tea, milk, or as a snack on the go.',
    storageInstructions: 'Store in a cool, dry place. Close pack tightly after opening.',
    shelfLife: '6 months from manufacturing date',
    countryOfOrigin: 'India',
  },
  {
    productId: 'PROD-TATA-TEA',
    nutrition: {
      servingSize: '2.5g (1 cup)',
      calories: 5,
      protein: 0,
      carbs: 1,
      fat: 0,
      fiber: 0,
      sugar: 0,
      sodium: 5,
    },
    allergens: {
      contains: [],
      mayContain: [],
      traces: [],
      dietary: { vegetarian: true, vegan: true, glutenFree: true, dairyFree: true, nutFree: true, halal: true, kosher: true, jain: true },
    },
    healthScore: 95,
    healthInsights: [
      { type: 'info', category: 'health', message: 'Rich in antioxidants', severity: 'low' },
      { type: 'tip', category: 'nutrition', message: 'Limit to 3-4 cups per day', severity: 'low' },
    ],
    howToUse: 'Boil water, add tea leaves, brew for 2-3 minutes. Add milk and sugar to taste.',
    storageInstructions: 'Store in an airtight container away from moisture and sunlight.',
    shelfLife: '24 months from manufacturing date',
    countryOfOrigin: 'India',
  },
  {
    productId: 'PROD-VIT-D',
    nutrition: {
      servingSize: '1 tablet',
      calories: 5,
      protein: 0,
      carbs: 1,
      fat: 0,
      vitamins: { 'Vitamin D3': 1000 },
    },
    allergens: {
      contains: [],
      mayContain: ['Soy'],
      traces: [],
      dietary: { vegetarian: true, vegan: false, glutenFree: true, dairyFree: true, nutFree: true, halal: true, kosher: true, jain: true },
    },
    healthScore: 98,
    healthInsights: [
      { type: 'info', category: 'health', message: 'Supports bone health and immune system', severity: 'low' },
      { type: 'tip', category: 'nutrition', message: 'Take with food for better absorption', severity: 'low' },
    ],
    howToUse: 'Take 1 tablet daily with food or as directed by healthcare professional.',
    storageInstructions: 'Store in a cool, dry place away from direct sunlight.',
    shelfLife: '24 months',
    countryOfOrigin: 'India',
    manufacturer: 'Sunworld Pharmaceuticals',
  },
];

// Sample sponsored campaigns
const sampleCampaigns = [
  {
    campaignId: 'CAMP-AMUL-001',
    merchantId: 'MERCHANT-001',
    storeId: 'STORE-BB-KORA',
    brandId: 'AMUL',
    brandName: 'Amul',
    name: 'Amul Butter Cashback Offer',
    description: 'Get 5% extra cashback on all Amul Butter products',
    type: 'cashback' as const,
    status: 'active' as const,
    budget: { total: 50000, spent: 0, remaining: 50000 },
    targeting: {
      categories: ['Dairy'],
      timeRange: {
        start: new Date(),
        end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    },
    reward: { type: 'percentage' as const, value: 5, maxReward: 50 },
    productIds: ['PROD-AMUL-BUTTER', 'PROD-AMUL-MILK', 'PROD-AMUL-PANEER'],
    metrics: {
      impressions: 0,
      scans: 0,
      redemptions: 0,
      revenue: 0,
      ctr: 0,
      roas: 0,
    },
  },
  {
    campaignId: 'CAMP-NESTLE-001',
    merchantId: 'MERCHANT-001',
    brandId: 'NESTLE',
    brandName: 'Nestle',
    name: 'Nestle Snacks Deal',
    description: 'Buy any Nestle snack, get 3% cashback',
    type: 'cashback' as const,
    status: 'active' as const,
    budget: { total: 30000, spent: 0, remaining: 30000 },
    targeting: {
      brands: ['Nestle'],
      timeRange: {
        start: new Date(),
        end: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      },
    },
    reward: { type: 'percentage' as const, value: 3, maxReward: 30 },
    productIds: ['PROD-MAGGI-2MIN'],
    metrics: {
      impressions: 0,
      scans: 0,
      redemptions: 0,
      revenue: 0,
      ctr: 0,
      roas: 0,
    },
  },
];

async function seedExtended() {
  try {
    console.log('🌱 Starting REZ Go extended seed...\n');

    // Connect to MongoDB
    await mongoose.connect(config.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Seed product intelligence
    console.log('📦 Seeding product intelligence...');
    for (const product of productsWithIntelligence) {
      await ProductIntelligence.findOneAndUpdate(
        { productId: product.productId },
        product,
        { upsert: true, new: true }
      );
      console.log(`   ✓ ${product.productId}`);
    }
    console.log(`✅ Seeded ${productsWithIntelligence.length} product intelligence records\n`);

    // Seed sponsored campaigns
    console.log('🎯 Seeding sponsored campaigns...');
    for (const campaign of sampleCampaigns) {
      await SponsoredCampaign.findOneAndUpdate(
        { campaignId: campaign.campaignId },
        campaign,
        { upsert: true, new: true }
      );
      console.log(`   ✓ ${campaign.name}`);
    }
    console.log(`✅ Seeded ${sampleCampaigns.length} campaigns\n`);

    // Summary
    console.log('═'.repeat(50));
    console.log('\n🎉 Extended seed completed!\n');
    console.log('Added:');
    console.log(`   • ${productsWithIntelligence.length} product intelligence records`);
    console.log(`   • ${sampleCampaigns.length} sponsored campaigns`);
    console.log('\n' + '═'.repeat(50));

    process.exit(0);
  } catch (error) {
    console.error('❌ Extended seed failed:', error);
    process.exit(1);
  }
}

seedExtended();
