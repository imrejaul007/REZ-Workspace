/**
 * REZ Go Database Seed Script
 *
 * Seeds the database with:
 * - Sample stores (premium grocery, pharmacy, campus stores)
 * - Product catalog with barcodes
 * - Cashback rules
 *
 * Usage: npx tsx scripts/seed.ts
 */

import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../src/config/index.js';

// Models
import { GoStore } from '../src/models/GoStore.js';
import { GoProduct } from '../src/models/GoProduct.js';

// Sample stores
const sampleStores = [
  {
    storeId: 'STORE-BB-KORA',
    merchantId: 'MERCHANT-001',
    name: 'BigBasket Koramangala',
    slug: 'bigbasket-koramangala',
    storeType: 'grocery' as const,
    status: 'active' as const,
    goEnabled: true,
    address: {
      street: '123, 5th Block, Koramangala',
      city: 'Bangalore',
      state: 'Karnataka',
      pincode: '560034',
      lat: 12.9352,
      lng: 77.6245,
    },
    taxRate: 18,
    cashback: {
      enabled: true,
      defaultPercent: 2,
      minAmount: 50,
      rules: [
        { type: 'product', value: 5, productIds: ['PROD-AMUL-BUTTER'] },
        { type: 'brand', value: 3, brandIds: ['Nestle', 'Haldiram'] },
        { type: 'time', value: 1, conditions: { startTime: '14:00', endTime: '17:00', days: [0, 1, 2, 3, 4, 5, 6] } },
      ],
    },
    settings: {
      requireExitVerification: true,
      allowGuestCheckout: false,
      maxSessionDuration: 120,
      maxItemsPerSession: 100,
      enableOfflineMode: true,
      enableSmartOffers: true,
      enableAiRecommendations: true,
    },
  },
  {
    storeId: 'STORE-APOLLO-HSR',
    merchantId: 'MERCHANT-002',
    name: 'Apollo Pharmacy HSR Layout',
    slug: 'apollo-pharmacy-hsr',
    storeType: 'pharmacy' as const,
    status: 'active' as const,
    goEnabled: true,
    address: {
      street: '45, HSR Layout Sector 2',
      city: 'Bangalore',
      state: 'Karnataka',
      pincode: '560102',
      lat: 12.9121,
      lng: 77.6446,
    },
    taxRate: 12,
    cashback: {
      enabled: true,
      defaultPercent: 3,
      minAmount: 100,
      rules: [
        { type: 'product', value: 10, productIds: ['PROD-VIT-D'] },
      ],
    },
    settings: {
      requireExitVerification: true,
      allowGuestCheckout: false,
      maxSessionDuration: 60,
      maxItemsPerSession: 50,
      enableOfflineMode: true,
      enableSmartOffers: true,
      enableAiRecommendations: false,
    },
  },
  {
    storeId: 'STORE-CAMPUS-IIM',
    merchantId: 'MERCHANT-003',
    name: 'Campus Store IIM Bangalore',
    slug: 'campus-store-iimb',
    storeType: 'campus' as const,
    status: 'active' as const,
    goEnabled: true,
    address: {
      street: 'IIM Bangalore Campus, Bommasandra',
      city: 'Bangalore',
      state: 'Karnataka',
      pincode: '560078',
      lat: 12.7932,
      lng: 77.6752,
    },
    taxRate: 0, // Campus exempt
    cashback: {
      enabled: true,
      defaultPercent: 5,
      minAmount: 0,
      rules: [
        { type: 'brand', value: 2, brandIds: ['Cadbury', 'Parle'] },
      ],
    },
    settings: {
      requireExitVerification: false,
      allowGuestCheckout: true,
      maxSessionDuration: 240,
      maxItemsPerSession: 200,
      enableOfflineMode: true,
      enableSmartOffers: true,
      enableAiRecommendations: true,
    },
  },
];

// Sample products with Indian barcodes
const sampleProducts = [
  // Dairy
  {
    productId: 'PROD-AMUL-BUTTER',
    barcode: '8901030673799',
    name: 'Amul Butter 500g',
    brand: 'Amul',
    category: 'Dairy',
    price: 275,
    mrp: 299,
    cashbackPercent: 5,
    stock: 50,
  },
  {
    productId: 'PROD-AMUL-MILK',
    barcode: '8901030673706',
    name: 'Amul Taaza Toned Milk 500ml',
    brand: 'Amul',
    category: 'Dairy',
    price: 30,
    mrp: 32,
    cashbackPercent: 2,
    stock: 100,
  },
  {
    productId: 'PROD-AMUL-PANEER',
    barcode: '8901030673805',
    name: 'Amul Fresh Paneer 200g',
    brand: 'Amul',
    category: 'Dairy',
    price: 85,
    mrp: 90,
    cashbackPercent: 3,
    stock: 40,
  },
  // Grocery
  {
    productId: 'PROD-TATA-SALT',
    barcode: '8901030708301',
    name: 'Tata Salt 1kg',
    brand: 'Tata',
    category: 'Grocery',
    price: 22,
    mrp: 25,
    cashbackPercent: 2,
    stock: 200,
  },
  {
    productId: 'PROD-TATA-TEA',
    barcode: '8901030708400',
    name: 'Tata Tea Gold 1kg',
    brand: 'Tata',
    category: 'Grocery',
    price: 485,
    mrp: 510,
    cashbackPercent: 3,
    stock: 30,
  },
  {
    productId: 'PROD-MAGGI-2MIN',
    barcode: '8901030123457',
    name: 'Maggi 2-Minute Noodles',
    brand: 'Nestle',
    category: 'Instant Food',
    price: 12,
    mrp: 14,
    cashbackPercent: 2,
    stock: 500,
  },
  {
    productId: 'PROD-PARLE-G',
    barcode: '8901030123464',
    name: 'Parle-G Biscuits 250g',
    brand: 'Parle',
    category: 'Biscuits',
    price: 30,
    mrp: 35,
    cashbackPercent: 2,
    stock: 300,
  },
  // Personal Care
  {
    productId: 'PROD-COLGATE-150',
    barcode: '8901030708509',
    name: 'Colgate Max Fresh 150g',
    brand: 'Colgate',
    category: 'Personal Care',
    price: 145,
    mrp: 160,
    cashbackPercent: 3,
    stock: 80,
  },
  {
    productId: 'PROD-DETTOL-500',
    barcode: '8901030708608',
    name: 'Dettol Antiseptic Liquid 500ml',
    brand: 'Reckitt',
    category: 'Personal Care',
    price: 195,
    mrp: 220,
    cashbackPercent: 4,
    stock: 45,
  },
  // Snacks
  {
    productId: 'PROD-LAYS-AMERICANA',
    barcode: '8901030123471',
    name: 'Lays American Style Cream & Onion 100g',
    brand: 'Frito-Lay',
    category: 'Snacks',
    price: 50,
    mrp: 60,
    cashbackPercent: 2,
    stock: 150,
  },
  {
    productId: 'PROD-KURKURE',
    barcode: '8901030123488',
    name: 'Kurkure Masala Munch 140g',
    brand: 'Haldiram',
    category: 'Snacks',
    price: 30,
    mrp: 35,
    cashbackPercent: 2,
    stock: 200,
  },
  {
    productId: 'PROD-CADBURY-DAIRY',
    barcode: '8901030123495',
    name: 'Cadbury Dairy Milk 60g',
    brand: 'Cadbury',
    category: 'Confectionery',
    price: 40,
    mrp: 45,
    cashbackPercent: 2,
    stock: 250,
  },
  // Beverages
  {
    productId: 'PROD-COCO-COLA-2L',
    barcode: '8901030123501',
    name: 'Coca-Cola 2L',
    brand: 'Coca-Cola',
    category: 'Beverages',
    price: 80,
    mrp: 85,
    cashbackPercent: 2,
    stock: 100,
  },
  {
    productId: 'PROD-THUMSUP-2L',
    barcode: '8901030123518',
    name: 'Thums Up 2L',
    brand: 'Coca-Cola',
    category: 'Beverages',
    price: 80,
    mrp: 85,
    cashbackPercent: 2,
    stock: 80,
  },
  // Fruits & Vegetables (by weight)
  {
    productId: 'PROD-BANANA-6',
    barcode: '8901030800001',
    name: 'Banana (6 pcs)',
    brand: 'Fresh',
    category: 'Fruits',
    price: 36,
    mrp: 40,
    cashbackPercent: 1,
    stock: 50,
  },
  {
    productId: 'PROD-APPLE-1KG',
    barcode: '8901030800002',
    name: 'Apple (1 kg)',
    brand: 'Fresh',
    category: 'Fruits',
    price: 180,
    mrp: 200,
    cashbackPercent: 2,
    stock: 30,
  },
  // Staples
  {
    productId: 'PROD-FORTUNE-OIL',
    barcode: '8901030708600',
    name: 'Fortune Sunflower Oil 1L',
    brand: 'Adani',
    category: 'Staples',
    price: 160,
    mrp: 175,
    cashbackPercent: 3,
    stock: 60,
  },
  {
    productId: 'PROD-BASMATI-5KG',
    barcode: '8901030708700',
    name: 'India Gate Basmati Rice 5kg',
    brand: 'India Gate',
    category: 'Staples',
    price: 420,
    mrp: 450,
    cashbackPercent: 4,
    stock: 25,
  },
  // Health supplements
  {
    productId: 'PROD-VIT-D',
    barcode: '8901030900100',
    name: 'Sunworld Vitamin D3 60k Capsule',
    brand: 'Sunworld',
    category: 'Health',
    price: 299,
    mrp: 350,
    cashbackPercent: 10,
    stock: 40,
  },
  {
    productId: 'PROD-PROT-BAR',
    barcode: '8901030900200',
    name: 'Optimum Nutrition Protein Bar',
    brand: 'Optimum Nutrition',
    category: 'Health',
    price: 149,
    mrp: 199,
    cashbackPercent: 5,
    stock: 35,
  },
];

// Combo suggestions
const comboSuggestions = [
  {
    storeId: 'STORE-BB-KORA',
    comboId: 'COMBO-BREAKFAST',
    name: 'Breakfast Combo',
    products: ['PROD-AMUL-MILK', 'PROD-PARLE-G', 'PROD-TATA-TEA'],
    comboPrice: 95,
    originalPrice: 102,
    active: true,
  },
  {
    storeId: 'STORE-BB-KORA',
    comboId: 'COMBO-SNACKS',
    name: 'Movie Snacks Pack',
    products: ['PROD-LAYS-AMERICANA', 'PROD-COCO-COLA-2L', 'PROD-CADBURY-DAIRY'],
    comboPrice: 150,
    originalPrice: 170,
    active: true,
  },
];

async function seed() {
  try {
    console.log('🌱 Starting REZ Go seed...\n');

    // Connect to MongoDB
    await mongoose.connect(config.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Clear existing data
    console.log('🧹 Clearing existing data...');
    await GoStore.deleteMany({});
    await GoProduct.deleteMany({});
    console.log('✅ Cleared existing stores and products\n');

    // Seed stores
    console.log('📦 Seeding stores...');
    for (const store of sampleStores) {
      await GoStore.create(store);
      console.log(`   ✓ ${store.name}`);
    }
    console.log(`✅ Seeded ${sampleStores.length} stores\n`);

    // Get all store IDs
    const stores = await GoStore.find({});
    const storeIds = stores.map(s => s.storeId);

    // Seed products with store associations
    console.log('📦 Seeding products...');
    for (const product of sampleProducts) {
      const productDoc = {
        ...product,
        storeIds,
        isAvailable: true,
        tags: [product.category, product.brand],
      };
      await GoProduct.create(productDoc);
      console.log(`   ✓ ${product.name}`);
    }
    console.log(`✅ Seeded ${sampleProducts.length} products\n`);

    // Summary
    console.log('═'.repeat(50));
    console.log('\n🎉 Seed completed successfully!\n');
    console.log('Summary:');
    console.log(`   • ${sampleStores.length} stores`);
    console.log(`   • ${sampleProducts.length} products`);
    console.log('\nTest QR payloads:');
    for (const store of sampleStores) {
      console.log(`\n   ${store.name}:`);
      console.log(`   {"intent":"go-session","v":1,"storeId":"${store.storeId}","action":"start"}`);
    }
    console.log('\n' + '═'.repeat(50));

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  }
}

seed();
