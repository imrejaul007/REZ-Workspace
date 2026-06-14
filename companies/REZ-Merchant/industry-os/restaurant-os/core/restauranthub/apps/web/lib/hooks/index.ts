// Core API hooks
export * from './useApi';

// Service-specific hooks
export * from './useRestaurants';
export * from './useJobs';
export * from './useEnhancedJobs';
export * from './useEnhancedMarketplace';

// Utility hooks
export * from './use-debounce';

// Re-export toast hook from parent hooks directory
export { useToast } from '../../hooks/use-toast';

// Re-export commonly used types
export type {
  ApiResponse,
  PaginatedResponse,
  Restaurant,
  CreateRestaurantRequest,
  RestaurantFilters,
  Job,
  CreateJobRequest,
  JobFilters,
  JobApplication,
} from '../api';