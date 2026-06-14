// Driver App API Configuration - Environment-based URLs
import Constants from 'expo-constants';

const getApiUrl = (): string => {
  if (Constants.expoConfig?.extra?.API_URL) {
    return Constants.expoConfig.extra.API_URL;
  }
  if (__DEV__) {
    return 'http://localhost:4000';
  }
  return 'https://api.rezride.com';
};

const getWsUrl = (): string => {
  const apiUrl = getApiUrl();
  return apiUrl.replace('http', 'ws') + '/ride';
};

export const API_BASE_URL = getApiUrl();
export const WS_URL = getWsUrl();

// Vehicle Types for Driver
export const VEHICLE_TYPES = [
  {
    id: 'auto' as const,
    name: 'Auto',
    icon: '🛺',
    description: 'Affordable rides',
    capacity: 3,
  },
  {
    id: 'cab' as const,
    name: 'Cab',
    icon: '🚗',
    description: 'Comfortable rides',
    capacity: 4,
  },
  {
    id: 'suv' as const,
    name: 'SUV',
    icon: '🚙',
    description: 'Premium rides',
    capacity: 6,
  },
];

// Fare Configuration
export const FARE_CONFIG = {
  auto: { base: 25, perKm: 10, perMin: 1.5 },
  cab: { base: 40, perKm: 14, perMin: 2 },
  suv: { base: 60, perKm: 18, perMin: 2.5 },
};
