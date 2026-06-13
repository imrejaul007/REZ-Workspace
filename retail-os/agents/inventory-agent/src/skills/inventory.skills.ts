export interface InventorySkill {
  name: string;
  description: string;
  actions: string[];
  confidence: number;
}

export const inventorySkills: InventorySkill[] = [
  {
    name: 'stock_level_analysis',
    description: 'Analyze current stock levels and identify items needing attention',
    actions: ['check_stock_levels', 'identify_low_stock', 'identify_out_of_stock', 'generate_stock_report'],
    confidence: 0.95,
  },
  {
    name: 'reorder_management',
    description: 'Manage reorder triggers and supplier communication',
    actions: ['calculate_reorder_quantity', 'generate_purchase_order', 'check_supplier_lead_times', 'update_reorder_thresholds'],
    confidence: 0.90,
  },
  {
    name: 'inventory_optimization',
    description: 'Optimize inventory levels based on demand patterns',
    actions: ['analyze_demand_patterns', 'calculate_optimal_stock', 'identify_slow_movers', 'suggest_inventory_adjustments'],
    confidence: 0.85,
  },
  {
    name: 'stock_transfer_planning',
    description: 'Plan and execute stock transfers between locations',
    actions: ['identify_transfer_needs', 'calculate_transfer_quantities', 'generate_transfer_orders', 'track_transfer_status'],
    confidence: 0.88,
  },
  {
    name: 'inventory_forecasting',
    description: 'Forecast future inventory needs based on historical data',
    actions: ['analyze_sales_history', 'calculate_demand_forecast', 'identify_seasonal_patterns', 'generate_forecast_report'],
    confidence: 0.82,
  },
  {
    name: 'shrinkage_management',
    description: 'Track and manage inventory shrinkage and losses',
    actions: ['track_shrinkage', 'identify_shrinkage_causes', 'calculate_shrinkage_rate', 'suggest_prevention_measures'],
    confidence: 0.80,
  },
];

export const skillDescriptions: Record<string, string> = {
  stock_level_analysis: 'I can analyze your current inventory levels, identify products that are running low or out of stock, and generate comprehensive stock reports.',
  reorder_management: 'I can help manage your reordering process by calculating optimal reorder quantities, generating purchase orders, and tracking supplier lead times.',
  inventory_optimization: 'I can analyze your inventory turnover and suggest optimizations to reduce carrying costs while maintaining adequate stock levels.',
  stock_transfer_planning: 'I can help plan stock transfers between your store locations to balance inventory and meet regional demand.',
  inventory_forecasting: 'I can forecast your future inventory needs based on historical sales data and seasonal patterns.',
  shrinkage_management: 'I can track inventory shrinkage and help identify causes and prevention measures.',
};
