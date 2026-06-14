import logger from './utils/logger';

/**
 * Order Integration Test Script
 * Tests all order-related API endpoints
 */

const BASE_URL = 'http://localhost:5001/api';
const TOKEN = '<JWT_TOKEN_REDACTED>';

interface TestResult {
  name: string;
  success: boolean;
  data?;
  error?: string;
}

const results: TestResult[] = [];

async function makeRequest(
  endpoint: string,
  method: string = 'GET',
  body?: unknown
): Promise<unknown> {
  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${TOKEN}`
    }
  };

  if (body && method !== 'GET') {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, options);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || `HTTP ${response.status}`);
  }

  return data;
}

async function testCreateOrder() {
  logger.info('\n🧪 Testing: Create Order from Cart');
  try {
    const orderData = {
      deliveryAddress: {
        name: 'John Doe',
        phone: '+919876543210',
        email: 'john@example.com',
        addressLine1: '123 Test Street',
        addressLine2: 'Near Test Park',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400001',
        country: 'India',
        landmark: 'Opposite City Mall',
        addressType: 'home' as const
      },
      paymentMethod: 'cod' as const,
      specialInstructions: 'Please deliver between 10 AM - 2 PM',
      couponCode: 'FIRST50'
    };

    const response = await makeRequest('/orders', 'POST', orderData);
    logger.info('✅ Order created successfully!');
    console.log('Order ID:', response.data._id);
    console.log('Order Number:', response.data.orderNumber);
    console.log('Status:', response.data.status);
    console.log('Total:', response.data.pricing?.total || response.data.totals?.total);

    results.push({
      name: 'Create Order',
      success: true,
      data: {
        orderId: response.data._id,
        orderNumber: response.data.orderNumber,
        total: response.data.pricing?.total || response.data.totals?.total
      }
    });

    return response.data._id;
  } catch (error) {
    logger.error('❌ Failed:', error.message);
    results.push({
      name: 'Create Order',
      success: false,
      error: error.message
    });
    return null;
  }
}

async function testGetOrders() {
  logger.info('\n🧪 Testing: Get User Orders');
  try {
    const response = await makeRequest('/orders');
    logger.info('✅ Orders retrieved successfully!');
    console.log('Total orders:', response.data.orders?.length || response.data.length);

    results.push({
      name: 'Get User Orders',
      success: true,
      data: { count: response.data.orders?.length || response.data.length }
    });

    return true;
  } catch (error) {
    logger.error('❌ Failed:', error.message);
    results.push({
      name: 'Get User Orders',
      success: false,
      error: error.message
    });
    return false;
  }
}

async function testGetOrderById(orderId: string) {
  logger.info('\n🧪 Testing: Get Order by ID');
  try {
    const response = await makeRequest(`/orders/${orderId}`);
    logger.info('✅ Order retrieved successfully!');
    console.log('Order Number:', response.data.orderNumber);
    console.log('Status:', response.data.status);
    console.log('Items:', response.data.items.length);

    results.push({
      name: 'Get Order by ID',
      success: true,
      data: {
        orderNumber: response.data.orderNumber,
        status: response.data.status
      }
    });

    return true;
  } catch (error) {
    logger.error('❌ Failed:', error.message);
    results.push({
      name: 'Get Order by ID',
      success: false,
      error: error.message
    });
    return false;
  }
}

async function testGetOrderTracking(orderId: string) {
  logger.info('\n🧪 Testing: Get Order Tracking');
  try {
    const response = await makeRequest(`/orders/${orderId}/tracking`);
    logger.info('✅ Tracking retrieved successfully!');
    console.log('Current Status:', response.data.currentStatus);
    console.log('Timeline entries:', response.data.timeline?.length || 0);

    results.push({
      name: 'Get Order Tracking',
      success: true,
      data: {
        status: response.data.currentStatus,
        timelineSteps: response.data.timeline?.length || 0
      }
    });

    return true;
  } catch (error) {
    logger.error('❌ Failed:', error.message);
    results.push({
      name: 'Get Order Tracking',
      success: false,
      error: error.message
    });
    return false;
  }
}

async function testGetOrderStats() {
  logger.info('\n🧪 Testing: Get Order Statistics');
  try {
    const response = await makeRequest('/orders/stats');
    logger.info('✅ Statistics retrieved successfully!');
    console.log('Total Orders:', response.data.stats?.totalOrders || 0);
    console.log('Total Spent:', response.data.stats?.totalSpent || 0);
    console.log('Recent Orders:', response.data.recentOrders?.length || 0);

    results.push({
      name: 'Get Order Statistics',
      success: true,
      data: response.data.stats
    });

    return true;
  } catch (error) {
    logger.error('❌ Failed:', error.message);
    results.push({
      name: 'Get Order Statistics',
      success: false,
      error: error.message
    });
    return false;
  }
}

async function testCancelOrder(orderId: string) {
  logger.info('\n🧪 Testing: Cancel Order');
  try {
    const response = await makeRequest(
      `/orders/${orderId}/cancel`,
      'PATCH',
      { reason: 'Changed my mind - testing cancellation' }
    );
    logger.info('✅ Order cancelled successfully!');
    console.log('Status:', response.data.status);
    console.log('Cancellation reason:', response.data.cancellation?.reason);

    results.push({
      name: 'Cancel Order',
      success: true,
      data: {
        status: response.data.status,
        reason: response.data.cancellation?.reason
      }
    });

    return true;
  } catch (error) {
    logger.error('❌ Failed:', error.message);
    results.push({
      name: 'Cancel Order',
      success: false,
      error: error.message
    });
    return false;
  }
}

async function testRateOrder(orderId: string) {
  logger.info('\n🧪 Testing: Rate Order');
  try {
    const response = await makeRequest(
      `/orders/${orderId}/rate`,
      'POST',
      {
        rating: 5,
        review: 'Excellent service! Fast delivery and great products.'
      }
    );
    logger.info('✅ Order rated successfully!');
    console.log('Rating:', response.data.rating?.score);
    console.log('Review:', response.data.rating?.review);

    results.push({
      name: 'Rate Order',
      success: true,
      data: response.data.rating
    });

    return true;
  } catch (error) {
    logger.error('❌ Failed:', error.message);
    results.push({
      name: 'Rate Order',
      success: false,
      error: error.message
    });
    return false;
  }
}

function printSummary() {
  logger.info('\n' + '='.repeat(60));
  logger.info('📊 TEST SUMMARY');
  console.log('='.repeat(60));

  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  logger.info(`\n✅ Passed: ${passed}`);
  logger.info(`❌ Failed: ${failed}`);
  logger.info(`📝 Total: ${results.length}\n`);

  if (failed > 0) {
    logger.info('Failed tests:');
    results
      .filter(r => !r.success)
      .forEach(r => logger.info(`  - ${r.name}: ${r.error}`));
  }

  logger.info('\n' + '='.repeat(60));
}

async function runTests() {
  logger.info('🚀 Starting Order Integration Tests...');
  console.log('Backend URL:', BASE_URL);
  console.log('='.repeat(60));

  // First, ensure we have items in cart
  logger.info('\n📋 Pre-test: Adding items to cart for order creation...');
  try {
    await makeRequest('/cart/add', 'POST', {
      productId: '67239af25ed7b12d8c6e0123',
      quantity: 2
    });
    await makeRequest('/cart/add', 'POST', {
      productId: '67239af25ed7b12d8c6e0124',
      quantity: 1
    });
    logger.info('✅ Cart prepared with test items');
  } catch (error) {
    console.log('⚠️  Warning: Could not add items to cart:', error.message);
    logger.info('Continuing with tests...');
  }

  // Test 1: Create Order
  const orderId = await testCreateOrder();

  if (orderId) {
    // Test 2: Get Orders List
    await testGetOrders();

    // Test 3: Get Order by ID
    await testGetOrderById(orderId);

    // Test 4: Get Order Tracking
    await testGetOrderTracking(orderId);

    // Test 5: Get Order Statistics
    await testGetOrderStats();

    // Test 6: Cancel Order (will fail if order status doesn't allow cancellation)
    await testCancelOrder(orderId);

    // Test 7: Rate Order (will fail if order is not delivered)
    // Skip this as it requires order to be delivered
    logger.info('\n⏭️  Skipping: Rate Order (requires delivered order)');
  }

  printSummary();
}

// Run tests
runTests().catch(logger.error);
