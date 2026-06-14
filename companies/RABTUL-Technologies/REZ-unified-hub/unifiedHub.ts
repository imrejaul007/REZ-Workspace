/**
 * REZ Unified Hub - Entry Point
 *
 * This service has been converted to a proper Express application.
 *
 * Run with: npm run dev
 * Port: 4600
 *
 * Features:
 * - Unified customer profile across all ecosystem services
 * - Cross-company loyalty and karma points
 * - Cross-company commerce operations
 * - Hospitality and hotel booking integration
 * - QR code experiences with intelligence
 * - Ad tracking and campaign management
 * - Employee onboarding and benefits
 *
 * For full implementation, see src/index.ts
 */

export { default } from './src/index';
export * from './src/types';
export { apiClient } from './src/services/apiClient';
