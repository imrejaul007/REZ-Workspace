const express = require('express');
const router = express.Router();

// Digital Twins for Manufacturing OS

// GET all twins
router.get('/', (req, res) => {
  res.json({
    twins: ['ProductTwin', 'MachineTwin', 'ProductionTwin', 'InventoryTwin']
  });
});

// ProductTwin - product simulation
router.get('/product', (req, res) => {
  res.json({
    twinType: 'ProductTwin',
    description: 'Product lifecycle and quality simulation',
    state: {
      productId: 'P001',
      name: 'Industrial Motor',
      unitsProduced: 1000,
      qualityRate: 0.98,
      costBreakdown: { materials: 300, labor: 150, overhead: 50 },
      demandForecast: { nextMonth: 150, nextQuarter: 450 }
    },
    operations: ['predictQuality', 'optimizeCost', 'demandForecasting']
  });
});

// MachineTwin - machine simulation
router.get('/machine', (req, res) => {
  res.json({
    twinType: 'MachineTwin',
    description: 'Machine performance and maintenance simulation',
    state: {
      machineId: 'M001',
      name: 'CNC Lathe 1',
      status: 'operational',
      utilization: 0.85,
      cycleCount: 15000,
      temperature: 65,
      vibrationLevel: 'normal',
      nextMaintenance: '2024-07-15'
    },
    operations: ['predictFailure', 'optimizeUtilization', 'maintenancePlanning']
  });
});

// ProductionTwin - production simulation
router.get('/production', (req, res) => {
  res.json({
    twinType: 'ProductionTwin',
    description: 'Production line simulation',
    state: {
      productionLineId: 'PL001',
      status: 'running',
      currentOutput: 55,
      targetOutput: 60,
      efficiency: 0.92,
      bottlenecks: [],
      shift: 'morning'
    },
    operations: ['optimizeScheduling', 'identifyBottlenecks', 'predictThroughput']
  });
});

// InventoryTwin - inventory simulation
router.get('/inventory', (req, res) => {
  res.json({
    twinType: 'InventoryTwin',
    description: 'Inventory management simulation',
    state: {
      itemId: 'I001',
      name: 'Steel Sheets',
      currentStock: 500,
      minLevel: 100,
      reorderPoint: 150,
      consumptionRate: 50,
      daysUntilStockout: 10
    },
    operations: ['predictStockout', 'optimizeReorder', 'costMinimization']
  });
});

module.exports = router;