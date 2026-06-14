/**
 * Inventory Classifier Service - Main Entry Point
 *
 * Port: 4515
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { inventoryService, INVENTORY_CATALOG } from './services/inventoryService';
import { InventoryCategory, Platform, TenantType } from '@rez/tenant-middleware';

const app = express();
const PORT = parseInt(process.env.PORT || '4515', 10);

app.use(helmet());
app.use(cors());
app.use(express.json());

// Health
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'inventory-classifier', version: '1.0.0' });
});

// Get all inventory
app.get('/api/inventory', (_req, res) => {
  const all = inventoryService.getAllInventory();
  res.json({ success: true, data: all });
});

// Get inventory by platform
app.get('/api/inventory/platform/:platform', (req, res) => {
  const platform = req.params.platform as Platform;
  const inventory = inventoryService.getInventoryByPlatform(platform);
  res.json({ success: true, data: inventory });
});

// Get internal inventory (for internal tenant queries)
app.get('/api/inventory/internal', (req, res) => {
  const tenantType = req.headers['x-tenant-type'] as TenantType;

  if (tenantType !== TenantType.REZ_INTERNAL) {
    res.status(403).json({
      success: false,
      error: 'INTERNAL_ONLY',
      message: 'Internal inventory is only available to REZ internal tenants',
    });
    return;
  }

  const internal = inventoryService.getInternalInventory();
  res.json({ success: true, data: internal });
});

// Get marketplace inventory
app.get('/api/inventory/marketplace', (_req, res) => {
  const marketplace = inventoryService.getMarketplaceInventory();
  res.json({ success: true, data: marketplace });
});

// Get inventory for tenant type
app.get('/api/inventory/available/:tenantType', (req, res) => {
  const tenantType = req.params.tenantType as TenantType;
  const inventory = inventoryService.getInventoryForTenant(tenantType);
  res.json({ success: true, data: inventory });
});

// Get summary
app.get('/api/inventory/summary', (_req, res) => {
  const summary = inventoryService.getSummary();
  res.json({ success: true, data: summary });
});

// Get platforms
app.get('/api/platforms', (_req, res) => {
  res.json({ success: true, data: inventoryService.getPlatforms() });
});

// Get categories
app.get('/api/categories', (_req, res) => {
  res.json({ success: true, data: inventoryService.getCategories() });
});

app.listen(PORT, () => {
  logger.info(`Inventory Classifier running on port ${PORT}`);
});

export default app;
