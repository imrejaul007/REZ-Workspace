/**
 * RealOffersApi - Backward Compatibility Re-export
 *
 * This file re-exports from the new modular structure in services/offers/
 * to maintain backward compatibility with existing imports.
 *
 * NEW SPLIT STRUCTURE:
 * services/offers/
 *   ├── index.ts          - Module entry point with combined RealOffersApi class
 *   ├── types.ts          - All TypeScript interfaces
 *   ├── offersApi.ts      - Main offers endpoints
 *   ├── categoriesApi.ts   - Category, hotspot, BOGO endpoints
 *   ├── bannersApi.ts     - Hero banner endpoints
 *   ├── redemptionsApi.ts - Favorites and redemption endpoints
 *   └── storeOffersApi.ts - Store-specific offers
 */

// Re-export types for backward compatibility
export type * from './offers/types';

// Re-export the combined API class (backward compatible singleton)
export { default as realOffersApi } from './offers/index';

// Also export individual API classes for granular imports
export { offersApi } from './offers/offersApi';
export { categoriesApi } from './offers/categoriesApi';
export { bannersApi } from './offers/bannersApi';
export { redemptionsApi } from './offers/redemptionsApi';
export { storeOffersApi } from './offers/storeOffersApi';

// Re-export singleton as default for imports like: import realOffersApi from '@/services/realOffersApi'
import realOffersApi from './offers/index';
export default realOffersApi;
