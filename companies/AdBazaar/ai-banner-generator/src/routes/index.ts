/**
 * Routes Index - Export all routes
 */

import generationRoutes from './generation.routes';
import templateRoutes from './template.routes';

export { generationRoutes, templateRoutes };

export default {
  generation: generationRoutes,
  template: templateRoutes,
};
