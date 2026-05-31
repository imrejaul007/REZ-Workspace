# Hojai Unified Platform SDK

TypeScript/JavaScript SDK for Hojai Unified Platform.

## Install

```bash
npm install @hojai/unified-sdk
```

## Usage

```typescript
import { HojaiUnifiedSDK } from '@hojai/unified-sdk';

// Initialize
const hojai = new HojaiUnifiedSDK({
  baseUrl: 'http://localhost:4850',
  tenantId: 'your_tenant_id'
});

// ============ CART & CHECKOUT ============

// Create cart
const cart = await hojai.createCart({
  sessionId: 'user_123_session',
  customer: { id: 'user_123', name: 'John', phone: '+919876543210' },
  items: [
    { productId: 'pizza_1', name: 'Pizza', price: 299, quantity: 2 }
  ]
});

// Add item
await hojai.addToCart(cart.cartId, {
  productId: 'coke_1', name: 'Coke', price: 49, quantity: 1
});

// Checkout
const order = await hojai.checkout(cart.cartId, {
  paymentMethod: 'upi',
  deliveryAddress: '123 Main St'
});

// Get payment link
const { paymentLink } = await hojai.initiatePayment(order.orderId, '+919876543210');
console.log('Pay here:', paymentLink);

// ============ SEND MESSAGE ============

await hojai.sendMessage({
  channel: 'whatsapp',
  to: { id: 'user_123', name: 'John', phone: '+919876543210' },
  type: 'text',
  content: { text: 'Your order is confirmed! 🍕' }
});

// ============ CONVERSATIONS ============

const { conversations } = await hojai.getConversations({ state: 'active' });

// ============ CAMPAIGNS ============

const campaign = await hojai.createCampaign({
  name: 'Summer Sale',
  channel: 'whatsapp',
  type: 'promotional',
  content: { text: '🎉 20% off! Code: SUMMER20' }
});

await hojai.startCampaign(campaign.campaignId);

// ============ ANALYTICS ============

const analytics = await hojai.getAnalytics();
console.log('Revenue:', analytics.commerce.revenue);
console.log('Orders:', analytics.commerce.ordersCreated);
```

## API Reference

### Cart
- `createCart(data)` - Create cart
- `getCart(cartId)` - Get cart
- `addToCart(cartId, item)` - Add item
- `updateCartItem(cartId, productId, quantity)` - Update quantity
- `removeFromCart(cartId, productId)` - Remove item

### Checkout
- `checkout(cartId, options)` - Create order
- `initiatePayment(orderId, phone)` - Get payment link
- `getOrder(orderId)` - Get order
- `getCustomerOrders(customerId)` - List orders

### Messages
- `sendMessage(data)` - Send message
- `sendTemplate(to, templateId, variables)` - Send template

### Conversations
- `getConversations(options)` - List conversations
- `getConversationMessages(id)` - Get messages
- `assignConversation(id, agentId, name)` - Assign
- `resolveConversation(id)` - Resolve

### Campaigns
- `createCampaign(data)` - Create campaign
- `startCampaign(id)` - Start
- `getCampaign(id)` - Get status

### Analytics
- `getAnalytics()` - Get analytics
- `getChannels()` - List channels
- `healthCheck()` - Health check
