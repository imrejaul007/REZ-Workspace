#!/usr/bin/env node

/**
 * Hojai Unified Platform - Seed Demo Data
 *
 * Run this to populate the database with sample data
 */

import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/hojai_unified_demo';
const TENANT_ID = 'demo_tenant';

console.log(`
╔══════════════════════════════════════════════════════════════════╗
║       SEEDING DEMO DATA                                       ║
╚══════════════════════════════════════════════════════════════════╝
`);

async function seed() {
  try {
    console.log('\n📦 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected!\n');

    // Seed collections
    await seedConversations();
    await seedOrders();
    await seedCampaigns();

    console.log(`
╔══════════════════════════════════════════════════════════════════╗
║                    SEED COMPLETE                               ║
╠══════════════════════════════════════════════════════════════════╣
║  ✅ Conversations seeded                                       ║
║  ✅ Orders seeded                                            ║
║  ✅ Campaigns seeded                                        ║
╚══════════════════════════════════════════════════════════════════╝
`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

async function seedConversations() {
  console.log('📝 Seeding conversations...');

  const conversations = [
    {
      conversationId: uuidv4(),
      tenantId: TENANT_ID,
      channel: 'whatsapp',
      state: 'active',
      customer: { id: 'user_001', name: 'Priya Patel', phone: '+919876543210', tier: 'premium' },
      lastMessage: 'Hi, I want to order a pizza',
      lastMessageAt: new Date(),
      messageCount: 5,
      priority: 'normal',
      aiHandled: true,
      aiConfidence: 0.85
    },
    {
      conversationId: uuidv4(),
      tenantId: TENANT_ID,
      channel: 'whatsapp',
      state: 'active',
      customer: { id: 'user_002', name: 'Amit Kumar', phone: '+919876543211', tier: 'standard' },
      lastMessage: 'Where is my order?',
      lastMessageAt: new Date(Date.now() - 3600000),
      messageCount: 12,
      priority: 'high',
      assignedAgentId: 'agent_001',
      assignedAgentName: 'Support Team'
    },
    {
      conversationId: uuidv4(),
      tenantId: TENANT_ID,
      channel: 'instagram',
      state: 'resolved',
      customer: { id: 'user_003', name: 'Sneha Reddy', phone: '+919876543212', tier: 'vip' },
      lastMessage: 'Thank you for the quick delivery!',
      lastMessageAt: new Date(Date.now() - 86400000),
      messageCount: 8,
      priority: 'normal',
      resolvedAt: new Date(Date.now() - 86400000)
    }
  ];

  // Use direct MongoDB insert
  const db = mongoose.connection.db;
  if (db) {
    await db.collection('unified_conversations').deleteMany({ tenantId: TENANT_ID });
    await db.collection('unified_conversations').insertMany(conversations);
  }

  console.log(`   ✅ ${conversations.length} conversations seeded`);
}

async function seedOrders() {
  console.log('📦 Seeding orders...');

  const orders = [
    {
      orderId: uuidv4(),
      orderNumber: 'ORD-20260601-001',
      tenantId: TENANT_ID,
      customer: { id: 'user_001', name: 'Priya Patel', phone: '+919876543210', address: '123 MG Road, Bangalore' },
      items: [
        { productId: 'pizza_margherita', name: 'Margherita Pizza', price: 299, quantity: 2, total: 598 },
        { productId: 'coke_500ml', name: 'Coke 500ml', price: 49, quantity: 2, total: 98 }
      ],
      subtotal: 696,
      tax: 62,
      deliveryFee: 50,
      discount: 0,
      total: 808,
      payment: { method: 'upi', status: 'paid', transactionId: 'txn_demo_001' },
      channel: 'whatsapp',
      status: 'confirmed'
    },
    {
      orderId: uuidv4(),
      orderNumber: 'ORD-20260601-002',
      tenantId: TENANT_ID,
      customer: { id: 'user_002', name: 'Amit Kumar', phone: '+919876543211', address: '456 Brigade Road, Bangalore' },
      items: [
        { productId: 'pizza_pepperoni', name: 'Pepperoni Pizza', price: 399, quantity: 1, total: 399 }
      ],
      subtotal: 399,
      tax: 36,
      deliveryFee: 50,
      discount: 50,
      total: 435,
      payment: { method: 'cod', status: 'pending' },
      channel: 'whatsapp',
      status: 'pending'
    }
  ];

  const db = mongoose.connection.db;
  if (db) {
    await db.collection('unified_orders').deleteMany({ tenantId: TENANT_ID });
    await db.collection('unified_orders').insertMany(orders);
  }

  console.log(`   ✅ ${orders.length} orders seeded`);
}

async function seedCampaigns() {
  console.log('📣 Seeding campaigns...');

  const campaigns = [
    {
      campaignId: uuidv4(),
      tenantId: TENANT_ID,
      name: 'Summer Sale 2026',
      description: '20% off on all pizzas',
      channel: 'whatsapp',
      type: 'promotional',
      content: { text: '🎉 Summer Sale! Get 20% off on all pizzas. Use code SUMMER20!' },
      estimatedReach: 10000,
      status: 'scheduled',
      scheduledAt: new Date(Date.now() + 86400000),
      stats: { sent: 0, delivered: 0, opened: 0, clicked: 0, converted: 0, failed: 0, unsubscribed: 0 }
    },
    {
      campaignId: uuidv4(),
      tenantId: TENANT_ID,
      name: 'New Menu Launch',
      description: 'Announcing our new menu items',
      channel: 'whatsapp',
      type: 'marketing',
      content: { text: '🍕 New menu items! Try our BBQ Chicken and Tandoori Paneer pizzas.' },
      estimatedReach: 5000,
      status: 'draft',
      stats: { sent: 0, delivered: 0, opened: 0, clicked: 0, converted: 0, failed: 0, unsubscribed: 0 }
    }
  ];

  const db = mongoose.connection.db;
  if (db) {
    await db.collection('unified_campaigns').deleteMany({ tenantId: TENANT_ID });
    await db.collection('unified_campaigns').insertMany(campaigns);
  }

  console.log(`   ✅ ${campaigns.length} campaigns seeded`);
}

seed();
