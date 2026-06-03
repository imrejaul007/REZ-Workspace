/**
 * HOJAI Industry AI - Integration Index
 *
 * Re-exports all connectors for easy importing
 */

export { RestaurantConnector, type RestaurantConnectorConfig } from './restaurant-connector';
export { SalonConnector, type SalonConnectorConfig } from './salon-connector';
export { HotelConnector, type HotelConnectorConfig } from './hotel-connector';
export { FitnessConnector, type FitnessConnectorConfig } from './fitness-connector';
export { RetailConnector, type RetailConnectorConfig } from './retail-connector';
export { HealthcareConnector, type HealthcareConnectorConfig } from './healthcare-connector';

/**
 * Factory function to create connector based on client type
 */
export function createConnector(
  industry: 'restaurant' | 'salon' | 'hotel' | 'fitness' | 'retail' | 'healthcare',
  config: {
    useREZServices: boolean;
    rezApiKey?: string;
    rezBaseUrl?: string;
  }
) {
  switch (industry) {
    case 'restaurant':
      return new RestaurantConnector(config);
    case 'salon':
      return new SalonConnector(config);
    case 'hotel':
      return new HotelConnector(config);
    case 'fitness':
      return new FitnessConnector(config);
    case 'retail':
      return new RetailConnector(config);
    case 'healthcare':
      return new HealthcareConnector(config);
    default:
      throw new Error(`Unknown industry: ${industry}`);
  }
}
