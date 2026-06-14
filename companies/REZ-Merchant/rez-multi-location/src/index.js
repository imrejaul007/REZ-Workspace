/**
 * REZ Multi-Location Service
 * Comprehensive franchise/multi-store management with consolidated reporting
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { v4 as uuidv4 } from 'uuid';

const app = express();

// Middleware
app.use(cors());
app.use(helmet());
app.use(express.json());

// In-memory data stores
const locations = new Map();
const inventories = new Map();
const orders = new Map();
const transfers = new Map();
const managers = new Map();

// Mock data seeding
const seedData = () => {
  const mockLocations = [
    { id: 'LOC001', name: 'Downtown Store', address: '123 Main St', city: 'Mumbai', managerId: 'MGR001', status: 'active', revenue: 125000 },
    { id: 'LOC002', name: 'Mall Location', address: '456 Shoppers Plaza', city: 'Delhi', managerId: 'MGR002', status: 'active', revenue: 98000 },
    { id: 'LOC003', name: 'Airport Branch', address: '789 Terminal 2', city: 'Bangalore', managerId: 'MGR003', status: 'active', revenue: 156000 },
  ];

  mockLocations.forEach(loc => {
    locations.set(loc.id, { ...loc, createdAt: new Date(), updatedAt: new Date() });
    managers.set(loc.managerId, { id: loc.managerId, name: `Manager ${loc.id}`, email: `mgr${loc.id}@rez.com` });
  });
};

seedData();

// ============================================================================
// Health Endpoint
// ============================================================================

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'rez-multi-location',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    locations: locations.size
  });
});

// ============================================================================
// Location Management
// ============================================================================

/**
 * Create a new location
 * POST /api/locations
 */
app.post('/api/locations', (req, res) => {
  try {
    const { name, address, city, managerId, parentId, merchantId } = req.body;

    if (!name || !address || !city) {
      return res.status(400).json({ error: 'Missing required fields: name, address, city' });
    }

    const locationId = `LOC-${uuidv4().slice(0, 8).toUpperCase()}`;

    const location = {
      id: locationId,
      name,
      address,
      city,
      managerId: managerId || null,
      parentId: parentId || null,
      merchantId: merchantId || 'DEFAULT',
      status: 'active',
      revenue: 0,
      ordersCount: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    locations.set(locationId, location);

    res.status(201).json({
      success: true,
      locationId,
      location
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create location' });
  }
});

/**
 * Get all locations
 * GET /api/locations
 */
app.get('/api/locations', (req, res) => {
  try {
    const { merchantId, city, status } = req.query;
    let result = Array.from(locations.values());

    if (merchantId) {
      result = result.filter(loc => loc.merchantId === merchantId);
    }
    if (city) {
      result = result.filter(loc => loc.city.toLowerCase() === city.toLowerCase());
    }
    if (status) {
      result = result.filter(loc => loc.status === status);
    }

    res.json({ locations: result, total: result.length });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch locations' });
  }
});

/**
 * Get location by ID
 * GET /api/locations/:locationId
 */
app.get('/api/locations/:locationId', (req, res) => {
  try {
    const { locationId } = req.params;
    const location = locations.get(locationId);

    if (!location) {
      return res.status(404).json({ error: 'Location not found' });
    }

    res.json(location);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch location' });
  }
});

/**
 * Update location
 * PUT /api/locations/:locationId
 */
app.put('/api/locations/:locationId', (req, res) => {
  try {
    const { locationId } = req.params;
    const location = locations.get(locationId);

    if (!location) {
      return res.status(404).json({ error: 'Location not found' });
    }

    const { name, address, city, managerId, status } = req.body;

    if (name) location.name = name;
    if (address) location.address = address;
    if (city) location.city = city;
    if (managerId) location.managerId = managerId;
    if (status) location.status = status;
    location.updatedAt = new Date();

    locations.set(locationId, location);

    res.json({ success: true, location });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update location' });
  }
});

/**
 * Delete location
 * DELETE /api/locations/:locationId
 */
app.delete('/api/locations/:locationId', (req, res) => {
  try {
    const { locationId } = req.params;

    if (!locations.has(locationId)) {
      return res.status(404).json({ error: 'Location not found' });
    }

    locations.delete(locationId);

    res.json({ success: true, message: 'Location deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete location' });
  }
});

// ============================================================================
// Inventory Management
// ============================================================================

/**
 * Get inventory for a location
 * GET /api/inventory/:locationId
 */
app.get('/api/inventory/:locationId', (req, res) => {
  try {
    const { locationId } = req.params;
    const key = `${locationId}`;
    const inventory = inventories.get(key) || [];

    res.json({ locationId, inventory });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch inventory' });
  }
});

/**
 * Update inventory item
 * POST /api/inventory/:locationId
 */
app.post('/api/inventory/:locationId', (req, res) => {
  try {
    const { locationId } = req.params;
    const { productId, productName, quantity, minStock } = req.body;

    const key = `${locationId}`;
    let inventory = inventories.get(key) || [];

    const existingIndex = inventory.findIndex(item => item.productId === productId);

    if (existingIndex >= 0) {
      inventory[existingIndex].quantity = quantity;
      inventory[existingIndex].updatedAt = new Date();
    } else {
      inventory.push({
        productId,
        productName,
        quantity,
        minStock: minStock || 10,
        updatedAt: new Date()
      });
    }

    inventories.set(key, inventory);

    res.json({ success: true, inventory });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update inventory' });
  }
});

/**
 * Transfer inventory between locations
 * POST /api/inventory/transfer
 */
app.post('/api/inventory/transfer', (req, res) => {
  try {
    const { fromLocationId, toLocationId, productId, quantity } = req.body;

    if (!fromLocationId || !toLocationId || !productId || !quantity) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const fromKey = `${fromLocationId}`;
    const toKey = `${toLocationId}`;

    const fromInventory = inventories.get(fromKey) || [];
    const productIndex = fromInventory.findIndex(item => item.productId === productId);

    if (productIndex < 0) {
      return res.status(404).json({ error: 'Product not found in source location' });
    }

    if (fromInventory[productIndex].quantity < quantity) {
      return res.status(400).json({ error: 'Insufficient stock for transfer' });
    }

    // Update source
    fromInventory[productIndex].quantity -= quantity;
    inventories.set(fromKey, fromInventory);

    // Update destination
    let toInventory = inventories.get(toKey) || [];
    const toProductIndex = toInventory.findIndex(item => item.productId === productId);

    if (toProductIndex >= 0) {
      toInventory[toProductIndex].quantity += quantity;
    } else {
      toInventory.push({
        ...fromInventory[productIndex],
        quantity
      });
    }
    inventories.set(toKey, toInventory);

    // Record transfer
    const transferId = `TRF-${uuidv4().slice(0, 8).toUpperCase()}`;
    const transfer = {
      id: transferId,
      fromLocationId,
      toLocationId,
      productId,
      quantity,
      status: 'completed',
      createdAt: new Date()
    };
    transfers.set(transferId, transfer);

    res.json({ success: true, transfer });
  } catch (error) {
    res.status(500).json({ error: 'Failed to transfer inventory' });
  }
});

/**
 * Get transfers
 * GET /api/inventory/transfers
 */
app.get('/api/inventory/transfers', (req, res) => {
  try {
    const { fromLocationId, toLocationId } = req.query;
    let result = Array.from(transfers.values());

    if (fromLocationId) {
      result = result.filter(t => t.fromLocationId === fromLocationId);
    }
    if (toLocationId) {
      result = result.filter(t => t.toLocationId === toLocationId);
    }

    res.json({ transfers: result, total: result.length });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch transfers' });
  }
});

// ============================================================================
// Order Management
// ============================================================================

/**
 * Create order for location
 * POST /api/orders
 */
app.post('/api/orders', (req, res) => {
  try {
    const { locationId, customerId, items, total, status } = req.body;

    if (!locationId || !items) {
      return res.status(400).json({ error: 'Missing required fields: locationId, items' });
    }

    const orderId = `ORD-${uuidv4().slice(0, 8).toUpperCase()}`;

    const order = {
      id: orderId,
      locationId,
      customerId: customerId || null,
      items,
      total: total || items.reduce((sum, item) => sum + (item.price * item.quantity), 0),
      status: status || 'pending',
      createdAt: new Date()
    };

    orders.set(orderId, order);

    // Update location stats
    const location = locations.get(locationId);
    if (location) {
      location.ordersCount = (location.ordersCount || 0) + 1;
      location.revenue = (location.revenue || 0) + order.total;
      locations.set(locationId, location);
    }

    res.status(201).json({ success: true, orderId, order });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create order' });
  }
});

/**
 * Get orders
 * GET /api/orders
 */
app.get('/api/orders', (req, res) => {
  try {
    const { locationId, status, date } = req.query;
    let result = Array.from(orders.values());

    if (locationId) {
      result = result.filter(o => o.locationId === locationId);
    }
    if (status) {
      result = result.filter(o => o.status === status);
    }
    if (date) {
      result = result.filter(o => o.createdAt.startsWith(date));
    }

    res.json({ orders: result, total: result.length });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

/**
 * Get order by ID
 * GET /api/orders/:orderId
 */
app.get('/api/orders/:orderId', (req, res) => {
  try {
    const { orderId } = req.params;
    const order = orders.get(orderId);

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

// ============================================================================
// Analytics & Reports
// ============================================================================

/**
 * Get consolidated report for all locations
 * GET /api/reports/consolidated
 */
app.get('/api/reports/consolidated', (req, res) => {
  try {
    const { merchantId } = req.query;

    let locationList = Array.from(locations.values());
    if (merchantId) {
      locationList = locationList.filter(loc => loc.merchantId === merchantId);
    }

    let totalRevenue = 0;
    let totalOrders = 0;

    locationList.forEach(loc => {
      totalRevenue += loc.revenue || 0;
      totalOrders += loc.ordersCount || 0;
    });

    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    res.json({
      merchantId: merchantId || 'ALL',
      totalLocations: locationList.length,
      activeLocations: locationList.filter(l => l.status === 'active').length,
      totalRevenue,
      totalOrders,
      avgOrderValue: Math.round(avgOrderValue * 100) / 100,
      topLocation: locationList.sort((a, b) => (b.revenue || 0) - (a.revenue || 0))[0]?.name || null,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

/**
 * Get location analytics
 * GET /api/locations/:locationId/analytics
 */
app.get('/api/locations/:locationId/analytics', (req, res) => {
  try {
    const { locationId } = req.params;
    const location = locations.get(locationId);

    if (!location) {
      return res.status(404).json({ error: 'Location not found' });
    }

    const locationOrders = Array.from(orders.values()).filter(o => o.locationId === locationId);

    res.json({
      locationId,
      locationName: location.name,
      revenue: location.revenue || 0,
      orders: location.ordersCount || 0,
      avgOrderValue: locationOrders.length > 0
        ? (location.revenue || 0) / locationOrders.length
        : 0,
      inventoryItems: (inventories.get(locationId) || []).length,
      lowStockItems: (inventories.get(locationId) || []).filter(i => i.quantity <= i.minStock).length,
      status: location.status,
      period: 'monthly'
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

/**
 * Get comparison report between locations
 * GET /api/reports/comparison
 */
app.get('/api/reports/comparison', (req, res) => {
  try {
    const { city } = req.query;
    let locationList = Array.from(locations.values());

    if (city) {
      locationList = locationList.filter(loc => loc.city.toLowerCase() === city.toLowerCase());
    }

    const sorted = [...locationList].sort((a, b) => (b.revenue || 0) - (a.revenue || 0));

    res.json({
      locations: sorted.map((loc, index) => ({
        rank: index + 1,
        id: loc.id,
        name: loc.name,
        city: loc.city,
        revenue: loc.revenue || 0,
        orders: loc.ordersCount || 0,
        revenuePerOrder: loc.ordersCount > 0 ? (loc.revenue || 0) / loc.ordersCount : 0
      })),
      total: locationList.length
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate comparison' });
  }
});

// ============================================================================
// Manager Operations
// ============================================================================

/**
 * Assign manager to location
 * POST /api/locations/:locationId/manager
 */
app.post('/api/locations/:locationId/manager', (req, res) => {
  try {
    const { locationId } = req.params;
    const { managerId, name, email } = req.body;

    const location = locations.get(locationId);
    if (!location) {
      return res.status(404).json({ error: 'Location not found' });
    }

    const manager = {
      id: managerId || `MGR-${uuidv4().slice(0, 8).toUpperCase()}`,
      name,
      email,
      locationId,
      assignedAt: new Date()
    };

    managers.set(manager.id, manager);
    location.managerId = manager.id;
    locations.set(locationId, location);

    res.json({ success: true, manager });
  } catch (error) {
    res.status(500).json({ error: 'Failed to assign manager' });
  }
});

/**
 * Get manager details
 * GET /api/managers/:managerId
 */
app.get('/api/managers/:managerId', (req, res) => {
  try {
    const { managerId } = req.params;
    const manager = managers.get(managerId);

    if (!manager) {
      return res.status(404).json({ error: 'Manager not found' });
    }

    // Get locations managed
    const managedLocations = Array.from(locations.values())
      .filter(loc => loc.managerId === managerId);

    res.json({
      ...manager,
      locationsCount: managedLocations.length,
      locations: managedLocations
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch manager' });
  }
});

// ============================================================================
// Start Server
// ============================================================================

const PORT = process.env.PORT || 4601;

const server = app.listen(PORT, () => {
  console.log(`REZ Multi-Location Service running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});

export default app;
export { server };