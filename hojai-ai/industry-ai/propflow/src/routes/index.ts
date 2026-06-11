/**
 * PROPFLOW - Real Estate AI Operating System
 * Routes Index
 */

export { default as authRoutes } from './auth.routes';
export { default as propertyRoutes } from './property.routes';
export { default as leadRoutes } from './lead.routes';
export { default as visitRoutes } from './visit.routes';
export { default as dealRoutes } from './deal.routes';
export { default as aiRoutes } from './ai.routes';
export { default as analyticsRoutes } from './analytics.routes';

import authRoutes from './auth.routes';
import propertyRoutes from './property.routes';
import leadRoutes from './lead.routes';
import visitRoutes from './visit.routes';
import dealRoutes from './deal.routes';
import aiRoutes from './ai.routes';
import analyticsRoutes from './analytics.routes';

export default {
  authRoutes,
  propertyRoutes,
  leadRoutes,
  visitRoutes,
  dealRoutes,
  aiRoutes,
  analyticsRoutes
};