import { InventoryActions, StockLevel, ReorderRecommendation, InventoryMetrics } from '../actions/inventory.actions';

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: {
    name: string;
    type: string;
    description: string;
    required: boolean;
  }[];
}

export const inventoryTools: ToolDefinition[] = [
  {
    name: 'check_stock_levels',
    description: 'Check current stock levels for one or more products',
    parameters: [
      { name: 'productIds', type: 'array', description: 'Array of product IDs to check (optional)', required: false },
    ],
  },
  {
    name: 'identify_low_stock',
    description: 'Identify all products that are running low on stock',
    parameters: [],
  },
  {
    name: 'identify_out_of_stock',
    description: 'Identify all products that are out of stock',
    parameters: [],
  },
  {
    name: 'generate_reorder_recommendations',
    description: 'Generate reorder recommendations based on current stock levels and demand',
    parameters: [],
  },
  {
    name: 'adjust_inventory',
    description: 'Adjust inventory quantity for a product',
    parameters: [
      { name: 'productId', type: 'string', description: 'Product ID', required: true },
      { name: 'adjustment', type: 'number', description: 'Quantity adjustment (positive to add, negative to remove)', required: true },
      { name: 'warehouseId', type: 'string', description: 'Warehouse ID (optional)', required: false },
    ],
  },
  {
    name: 'set_warehouse_stock',
    description: 'Set stock quantity at a specific warehouse location',
    parameters: [
      { name: 'productId', type: 'string', description: 'Product ID', required: true },
      { name: 'warehouseId', type: 'string', description: 'Warehouse ID', required: true },
      { name: 'location', type: 'string', description: 'Location code within warehouse', required: true },
      { name: 'quantity', type: 'number', description: 'Stock quantity', required: true },
    ],
  },
  {
    name: 'get_inventory_metrics',
    description: 'Get overall inventory metrics and KPIs',
    parameters: [],
  },
  {
    name: 'analyze_demand',
    description: 'Analyze demand patterns for a product',
    parameters: [
      { name: 'productId', type: 'string', description: 'Product ID', required: true },
      { name: 'days', type: 'number', description: 'Number of days to analyze (default 30)', required: false },
    ],
  },
  {
    name: 'identify_slow_movers',
    description: 'Identify products with slow turnover',
    parameters: [
      { name: 'threshold', type: 'number', description: 'Days in stock threshold (default 30)', required: false },
    ],
  },
];

export class InventoryTools {
  private actions: InventoryActions;

  constructor() {
    this.actions = new InventoryActions();
  }

  async executeTool(toolName: string, params: Record<string, any>): Promise<any> {
    switch (toolName) {
      case 'check_stock_levels':
        return this.actions.checkStockLevels(params.productIds);

      case 'identify_low_stock':
        return this.actions.identifyLowStockProducts();

      case 'identify_out_of_stock':
        return this.actions.identifyOutOfStockProducts();

      case 'generate_reorder_recommendations':
        return this.actions.generateReorderRecommendations();

      case 'adjust_inventory':
        return this.actions.adjustInventory(params.productId, params.adjustment, params.warehouseId);

      case 'set_warehouse_stock':
        return this.actions.setWarehouseStock(params.productId, params.warehouseId, params.location, params.quantity);

      case 'get_inventory_metrics':
        return this.actions.getInventoryMetrics();

      case 'analyze_demand':
        return this.actions.analyzeDemandPatterns(params.productId, params.days);

      case 'identify_slow_movers':
        return this.actions.identifySlowMovers(params.threshold);

      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }
  }

  getToolDefinitions(): ToolDefinition[] {
    return inventoryTools;
  }
}
