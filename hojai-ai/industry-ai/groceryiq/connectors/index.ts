/**
 * GroceryIQ - Connectors Index
 *
 * Exports all connectors for GroceryIQ.
 */

export { groceryConnector } from './grocery-connector';

export const connectors = {
  grocery: {
    name: 'Grocery Connector',
    description: 'Connects GroceryIQ AI to REZ-Merchant grocery services',
    methods: [
      'syncProducts',
      'syncOrders',
      'syncInventoryAlerts',
      'syncPricingRecommendations',
      'fullSync',
      'getConnectionStatus'
    ]
  }
};

export const connectorCount = 1;