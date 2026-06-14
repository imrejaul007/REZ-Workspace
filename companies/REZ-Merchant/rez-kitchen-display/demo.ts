/**
 * Demo script to create sample orders for testing
 * Run with: npx ts-node demo.ts
 */

import axios from 'axios';

const BASE_URL = 'http://localhost:4080/api';

async function createSampleOrders() {
  console.log('Creating sample orders...\n');

  // Sample orders data
  const sampleOrders = [
    {
      orderNumber: 'ORD-001',
      tableNumber: 'T1',
      customerName: 'John Smith',
      priority: 'high' as const,
      estimatedTime: 10,
      items: [
        { name: 'Margherita Pizza', quantity: 1, notes: 'Extra cheese' },
        { name: 'Caesar Salad', quantity: 1 },
      ],
    },
    {
      orderNumber: 'ORD-002',
      tableNumber: 'T3',
      customerName: 'Sarah Johnson',
      priority: 'normal' as const,
      estimatedTime: 15,
      items: [
        { name: 'Grilled Salmon', quantity: 2 },
        { name: 'Mashed Potatoes', quantity: 2 },
        { name: 'House Wine', quantity: 1 },
      ],
    },
    {
      orderNumber: 'ORD-003',
      tableNumber: 'T5',
      priority: 'urgent' as const,
      estimatedTime: 8,
      items: [
        { name: 'Cheeseburger', quantity: 1, notes: 'No onions' },
        { name: 'French Fries', quantity: 1 },
        { name: 'Milkshake', quantity: 1 },
      ],
    },
    {
      orderNumber: 'ORD-004',
      tableNumber: 'T2',
      customerName: 'Mike Davis',
      priority: 'low' as const,
      estimatedTime: 20,
      items: [
        { name: 'Chicken Wings', quantity: 2, notes: 'Buffalo sauce' },
        { name: 'Nachos', quantity: 1 },
        { name: 'Draft Beer', quantity: 3 },
      ],
    },
    {
      orderNumber: 'ORD-005',
      tableNumber: 'T7',
      priority: 'normal' as const,
      estimatedTime: 12,
      items: [
        { name: 'Veggie Wrap', quantity: 2 },
        { name: 'Sweet Potato Fries', quantity: 1 },
        { name: 'Iced Tea', quantity: 2 },
      ],
    },
  ];

  for (const order of sampleOrders) {
    try {
      const response = await axios.post(`${BASE_URL}/orders`, order);
      console.log(`Created: ${response.data.data.orderNumber} (${response.data.data.status})`);
    } catch (error: any) {
      console.error(`Failed to create ${order.orderNumber}:`, error.message);
    }
  }

  console.log('\nSample orders created!');
}

async function getAllOrders() {
  console.log('\nFetching all active orders...\n');

  try {
    const response = await axios.get(`${BASE_URL}/orders`);
    const orders = response.data.data;

    console.log(`Found ${orders.length} active orders:\n`);
    console.log('-'.repeat(60));

    for (const order of orders) {
      console.log(`Order: ${order.orderNumber}`);
      console.log(`  Table: ${order.tableNumber || 'N/A'}`);
      console.log(`  Status: ${order.status}`);
      console.log(`  Priority: ${order.priority}`);
      console.log(`  Items: ${order.totalItems}`);
      console.log(`  Delayed: ${order.isDelayed ? 'YES' : 'No'}`);
      console.log('-'.repeat(60));
    }
  } catch (error: any) {
    console.error('Failed to fetch orders:', error.message);
  }
}

async function getStats() {
  console.log('\nFetching statistics...\n');

  try {
    const response = await axios.get(`${BASE_URL}/orders/stats`);
    const stats = response.data.data;

    console.log('Order Statistics:');
    console.log(`  Pending: ${stats.pending}`);
    console.log(`  Preparing: ${stats.preparing}`);
    console.log(`  Ready: ${stats.ready}`);
    console.log(`  Completed: ${stats.completed}`);
    console.log(`  Delayed: ${stats.delayed}`);
    console.log(`  Avg Prep Time: ${Math.round(stats.avgPrepTime / 60000)} min`);
  } catch (error: any) {
    console.error('Failed to fetch stats:', error.message);
  }
}

async function updateOrderStatus() {
  const orderId = 'test-order-id'; // Replace with actual order ID

  try {
    const response = await axios.patch(`${BASE_URL}/orders/${orderId}/status`, {
      status: 'preparing',
    });
    console.log('Order updated:', response.data.data.status);
  } catch (error: any) {
    console.error('Failed to update order:', error.message);
  }
}

async function main() {
  console.log('Kitchen Display System - Demo Script');
  console.log('====================================\n');

  const command = process.argv[2] || 'all';

  switch (command) {
    case 'create':
      await createSampleOrders();
      break;
    case 'list':
      await getAllOrders();
      break;
    case 'stats':
      await getStats();
      break;
    case 'all':
    default:
      await createSampleOrders();
      await getAllOrders();
      await getStats();
      break;
  }
}

main().catch(console.error);
