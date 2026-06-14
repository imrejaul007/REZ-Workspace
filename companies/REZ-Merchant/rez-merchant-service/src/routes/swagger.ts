/**
 * Swagger UI Routes
 *
 * Serves OpenAPI documentation at /api-docs
 */

import { Router, Request, Response } from 'express';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from '../config/swagger';

const router = Router();

// Swagger JSON endpoint
router.get('/swagger.json', (_req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// Swagger UI
router.use('/', swaggerUi.setup(swaggerSpec, {
  customCss: `
    .swagger-ui .topbar { display: none }
    .swagger-ui .info .title { font-size: 2em }
    .swagger-ui .scheme-container { background: #f8fafc; padding: 1em }
  `,
  customSiteTitle: 'ReZ Merchant API Documentation',
  customfavIcon: '/favicon.ico',
}));

export default router;
