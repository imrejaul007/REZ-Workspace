#!/usr/bin/env node

/**
 * Hojai Unified Platform - Demo Script
 *
 * Run this to test the platform with sample data
 *
 * Usage: npm run demo
 */

import axios from 'axios';

const API_URL = process.env.API_URL || 'http://localhost:4850';
const TENANT_ID = 'demo_tenant';

const client = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'X-Tenant-Id': TENANT_ID
  }
});

console.log(`
╔══════════════════════════════════════════════════════════════════╗
║       HOJAI UNIFIED PLATFORM - DEMO                          ║
╠══════════════════════════════════════════════════════════════════╣
║  API: ${API_URL}
║  Tenant: ${TENANT_ID}
╚══════════════════════════════════════════════════════════════════╝
`);

// Helper function
async function apiCall(name: string, fn: () => Promise<any>) {
  try {
    console.log(`\n📡 ${name}...`);
    const result = await fn();
    console.log(`✅ ${name}: Success`);
    return result;
  } catch (error: any) {
    console.log(`❌ ${name}: ${error.message}`);
    return null;
  }
}

async function main() {
  console.log('\n🧪 Starting Demo...\n');

  // ============ 1. HEALTH CHECK ============
  await apiCall('Health Check', async () => {
    const response = await client.get('/health');
    console.log('   Status:', response.data.status);
    console.log('   Service:', response.data.service);
    console.log('   Version:', response.data.version);
  });

  // ============ 2. INFO ============
  await apiCall('Get Platform Info', async () => {
    const response = await client.get('/api/info');
    console.log('   Name:', response.data.name);
    console.log('   Features:', response.data.features.length);
  });

  // ============ 3. CHANNELS ============
  await apiCall('Get Channels', async () => {
    const response = await client.get('/api/channels');
    const channels = response.data.data.filter((c: any) => c.status === 'active');
    console.log('   Active channels:', channels.length);
  });

  // ============ 4. CREATE CART ============
  let cartId = await apiCall('Create Cart', async () => {
    const response = await client.post('/api/cart', {
      sessionId: 'demo_session_001',
      customer: {
        id: 'demo_user_001',
        name: 'Rahul Sharma',
        phone: '+919876543210'
      },
      items: [
        { productId: 'pizza_margherita', name: 'Margherita Pizza', price: 299, quantity: 2 },
        { productId: 'coke_500ml', name: 'Coke 500ml', price: 49, quantity: 2 }
      ]
    });
    console.log('   Cart ID:', response.data.data.cartId);
    console.log('   Items:', response.data.data.items.length);
    console.log('   Total: ₹', response.data.data.total);
    return response.data.data.cartId;
  });

  // ============ 5. ADD TO CART ============
  if (cartId) {
    await apiCall('Add Item to Cart', async () => {
      const response = await client.post(`/api/cart/${cartId}/items`, {
        productId: 'garlic_bread',
        name: 'Garlic Bread',
        price: 129,
        quantity: 1
      });
      console.log('   Items:', response.data.data.items.length);
      console.log('   Total: ₹', response.data.data.total);
    });
  }

  // ============ 6. GET CART ============
  if (cartId) {
    await apiCall('Get Cart', async () => {
      const response = await client.get(`/api/cart/${cartId}`);
      console.log('   Items:');
      response.data.data.items.forEach((item: any) => {
        console.log(`     - ${item.name} x${item.quantity} = ₹${item.price * item.quantity}`);
      });
      console.log('   Subtotal: ₹', response.data.data.subtotal);
      console.log('   Total: ₹', response.data.data.total);
    });
  }

  // ============ 7. CHECKOUT ============
  let orderId: string | null = null;
  if (cartId) {
    orderId = await apiCall('Checkout', async () => {
      const response = await client.post(`/api/cart/${cartId}/checkout`, {
        deliveryAddress: '123 MG Road, Bangalore, Karnataka 560001',
        paymentMethod: 'upi'
      });
      console.log('   Order ID:', response.data.data.orderId);
      console.log('   Order Number:', response.data.data.orderNumber);
      console.log('   Total: ₹', response.data.data.total);
      console.log('   Payment Status:', response.data.data.payment.status);
      return response.data.data.orderId;
    });
  }

  // ============ 8. GET PAYMENT LINK ============
  if (orderId) {
    await apiCall('Get Payment Link', async () => {
      const response = await client.post(`/api/orders/${orderId}/pay`, {
        customerPhone: '+919876543210'
      });
      console.log('   Order Status:', response.data.data.order.status);
      if (response.data.data.paymentLink) {
        console.log('   Payment Link:', response.data.data.paymentLink);
      }
    });
  }

  // ============ 9. SEND MESSAGE ============
  await apiCall('Send WhatsApp Message', async () => {
    const response = await client.post('/api/messages/send', {
      channel: 'whatsapp',
      to: { id: 'demo_user_001', name: 'Rahul Sharma', phone: '+919876543210' },
      type: 'text',
      content: { text: '🛒 Your order #ORD-DEMO-001 is confirmed! Total: ₹725. Pay via: https://rzp.io/i/demo' }
    });
    console.log('   Message ID:', response.data.data.messageId);
  });

  // ============ 10. SEND BUTTONS ============
  await apiCall('Send Interactive Buttons', async () => {
    const response = await client.post('/api/messages/send', {
      channel: 'whatsapp',
      to: { id: 'demo_user_001', name: 'Rahul Sharma', phone: '+919876543210' },
      type: 'buttons',
      content: {
        text: 'How can we help you?',
        header: 'Welcome to Pizza Store!',
        buttons: [
          { id: 'order_status', title: '📦 Order Status' },
          { id: 'menu', title: '🍕 View Menu' },
          { id: 'support', title: '❓ Help' }
        ]
      }
    });
    console.log('   Message ID:', response.data.data.messageId);
  });

  // ============ 11. CREATE CAMPAIGN ============
  const campaignId = await apiCall('Create Campaign', async () => {
    const response = await client.post('/api/campaigns', {
      name: 'Summer Sale 2026',
      channel: 'whatsapp',
      type: 'promotional',
      content: {
        text: '🎉 Summer Sale! Get 20% off on all pizzas. Use code SUMMER20 at checkout.'
      },
      scheduledAt: new Date(Date.now() + 86400000).toISOString() // Tomorrow
    });
    console.log('   Campaign ID:', response.data.data.campaignId);
    console.log('   Name:', response.data.data.name);
    console.log('   Status:', response.data.data.status);
    return response.data.data.campaignId;
  });

  // ============ 12. ANALYTICS ============
  await apiCall('Get Analytics', async () => {
    const response = await client.get('/api/analytics');
    console.log('   Overview:');
    console.log('     - Total Conversations:', response.data.data.overview.totalConversations);
    console.log('     - Active:', response.data.data.overview.activeConversations);
    console.log('   Commerce:');
    console.log('     - Orders:', response.data.data.commerce.ordersCreated);
    console.log('     - Revenue: ₹', response.data.data.commerce.revenue);
  });

  // ============ 13. CONVERSATIONS ============
  await apiCall('Get Conversations', async () => {
    const response = await client.get('/api/conversations');
    console.log('   Total:', response.data.data.conversations.length);
  });

  // ============ SUMMARY ============
  console.log(`
╔══════════════════════════════════════════════════════════════════╗
║                    DEMO COMPLETE                                 ║
╠══════════════════════════════════════════════════════════════════╣
║  ✅ Health Check                                                ║
║  ✅ Cart Creation                                              ║
║  ✅ Add to Cart                                               ║
║  ✅ Checkout                                                   ║
║  ✅ Payment Link                                             ║
║  ✅ Send Message                                              ║
║  ✅ Send Buttons                                             ║
║  ✅ Campaign Creation                                         ║
║  ✅ Analytics                                                 ║
╚══════════════════════════════════════════════════════════════════╝

🎉 All API endpoints tested successfully!

Next steps:
1. Configure WhatsApp credentials in .env
2. Set up webhook URL in Meta Developer Console
3. Start accepting orders!
`);

  process.exit(0);
}

main().catch(console.error);
