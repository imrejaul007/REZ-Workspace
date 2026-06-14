/**
 * OpenAPI/Swagger Documentation Generator
 * Auto-generates API documentation from route definitions
 */

import { Request, Response } from 'express';
import { API_VERSIONS } from '../middleware/apiVersioning';

// ── OpenAPI Schema Types ────────────────────────────────────────────────────────

interface OpenAPISchema {
  type?: string;
  format?: string;
  properties?: Record<string, OpenAPISchema>;
  items?: OpenAPISchema;
  enum?: string[];
  required?: string[];
  description?: string;
  example?: any;
  $ref?: string;
}

interface OpenAPIOperation {
  tags: string[];
  summary: string;
  description?: string;
  operationId?: string;
  parameters?: OpenAPIParameter[];
  requestBody?: {
    required?: boolean;
    content: Record<string, { schema: OpenAPISchema; example?: any }>;
  };
  responses: Record<string, {
    description: string;
    content?: Record<string, { schema: OpenAPISchema }>;
  }>;
  security?: Array<Record<string, string[]>>;
  deprecated?: boolean;
}

interface OpenAPIParameter {
  name: string;
  in: 'query' | 'path' | 'header' | 'cookie';
  required?: boolean;
  description?: string;
  schema?: OpenAPISchema;
  example?: any;
}

// ── Route Registry ─────────────────────────────────────────────────────────────

interface RegisteredRoute {
  method: string;
  path: string;
  tags: string[];
  summary: string;
  description?: string;
  operationId?: string;
  parameters?: OpenAPIParameter[];
  requestBody?: {
    required?: boolean;
    schema: OpenAPISchema;
    example?: any;
  };
  responses?: Record<string, { description: string; schema?: OpenAPISchema }>;
  deprecated?: boolean;
  security?: string[];
}

class OpenAPIRegistry {
  private routes: RegisteredRoute[] = [];
  private schemas: Record<string, OpenAPISchema> = {};

  /**
   * Register a route
   */
  register(route: RegisteredRoute): void {
    // Normalize path to use {param} instead of :param
    route.path = route.path.replace(/:(\w+)/g, '{$1}');
    this.routes.push(route);
  }

  /**
   * Register multiple routes
   */
  registerMany(routes: RegisteredRoute[]): void {
    routes.forEach((route) => this.register(route));
  }

  /**
   * Add a schema
   */
  addSchema(name: string, schema: OpenAPISchema): void {
    this.schemas[name] = schema;
  }

  /**
   * Generate OpenAPI document
   */
  generate(spec: {
    title: string;
    description?: string;
    version: string;
    servers?: string[];
  }): object {
    const paths: Record<string, Record<string, OpenAPIOperation>> = {};

    // Group routes by path
    this.routes.forEach((route) => {
      if (!paths[route.path]) {
        paths[route.path] = {};
      }

      const operation: OpenAPIOperation = {
        tags: route.tags,
        summary: route.summary,
        description: route.description,
        operationId: route.operationId,
        parameters: route.parameters,
        responses: route.responses || {
          '200': { description: 'Success' },
          '400': { description: 'Bad Request' },
          '401': { description: 'Unauthorized' },
          '500': { description: 'Internal Server Error' },
        },
      };

      if (route.requestBody) {
        operation.requestBody = {
          required: route.requestBody.required,
          content: {
            'application/json': {
              schema: route.requestBody.schema,
              example: route.requestBody.example,
            },
          },
        };
      }

      if (route.deprecated) {
        operation.deprecated = true;
      }

      if (route.security || route.security?.length === 0) {
        operation.security = route.security.length > 0
          ? route.security.map((s) => ({ bearerAuth: [s] }))
          : [];
      }

      paths[route.path][route.method.toLowerCase()] = operation;
    });

    return {
      openapi: '3.0.3',
      info: {
        title: spec.title,
        description: spec.description,
        version: spec.version,
        contact: {
          name: 'REZ Merchant API Support',
          email: 'api-support@rez.in',
        },
        license: {
          name: 'Proprietary',
        },
      },
      servers: spec.servers || [{ url: '/api' }],
      paths,
      components: {
        schemas: this.schemas,
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
          apiKeyAuth: {
            type: 'apiKey',
            in: 'header',
            name: 'X-API-Key',
          },
        },
      },
      tags: this.getUniqueTags().map((tag) => ({
        name: tag,
        description: this.getTagDescription(tag),
      })),
    };
  }

  private getUniqueTags(): string[] {
    const tags = new Set<string>();
    this.routes.forEach((r) => r.tags.forEach((t) => tags.add(t)));
    return Array.from(tags);
  }

  private getTagDescription(tag: string): string {
    const descriptions: Record<string, string> = {
      orders: 'Order management and processing',
      customers: 'Customer profiles and management',
      menu: 'Menu items, categories, and modifiers',
      inventory: 'Inventory and stock management',
      payments: 'Payment processing and settlements',
      staff: 'Staff management and schedules',
      analytics: 'Reports and analytics',
      webhooks: 'Webhook management',
      health: 'Health check endpoints',
    };
    return descriptions[tag] || '';
  }
}

export const openAPIRegistry = new OpenAPIRegistry();

// ── Common Schemas ─────────────────────────────────────────────────────────────

export const schemas = {
  Error: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: false },
      error: {
        type: 'object',
        properties: {
          code: { type: 'string', example: 'ERROR_CODE' },
          message: { type: 'string', example: 'Error message' },
          details: { type: 'object' },
        },
      },
    },
  } as OpenAPISchema,

  Pagination: {
    type: 'object',
    properties: {
      page: { type: 'integer', example: 1 },
      limit: { type: 'integer', example: 20 },
      total: { type: 'integer', example: 100 },
      totalPages: { type: 'integer', example: 5 },
    },
  } as OpenAPISchema,

  Merchant: {
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid' },
      name: { type: 'string', example: 'My Restaurant' },
      phone: { type: 'string', example: '+919876543210' },
      email: { type: 'string', format: 'email' },
      address: { type: 'string' },
      city: { type: 'string' },
      state: { type: 'string' },
      pincode: { type: 'string' },
      gstin: { type: 'string' },
      logo: { type: 'string', format: 'uri' },
      status: { type: 'string', enum: ['active', 'inactive', 'suspended'] },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' },
    },
  } as OpenAPISchema,

  Order: {
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid' },
      merchantId: { type: 'string' },
      storeId: { type: 'string' },
      customerId: { type: 'string' },
      orderNumber: { type: 'string' },
      items: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            itemId: { type: 'string' },
            name: { type: 'string' },
            quantity: { type: 'integer' },
            price: { type: 'number' },
            total: { type: 'number' },
          },
        },
      },
      subtotal: { type: 'number' },
      tax: { type: 'number' },
      discount: { type: 'number' },
      total: { type: 'number' },
      status: {
        type: 'string',
        enum: ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'],
      },
      paymentStatus: { type: 'string', enum: ['pending', 'paid', 'refunded', 'failed'] },
      paymentMethod: { type: 'string', enum: ['cash', 'card', 'upi', 'wallet'] },
      createdAt: { type: 'string', format: 'date-time' },
    },
  } as OpenAPISchema,

  Customer: {
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid' },
      merchantId: { type: 'string' },
      name: { type: 'string' },
      phone: { type: 'string' },
      email: { type: 'string', format: 'email' },
      totalOrders: { type: 'integer' },
      totalSpent: { type: 'number' },
      lastOrderAt: { type: 'string', format: 'date-time' },
      tags: { type: 'array', items: { type: 'string' } },
      createdAt: { type: 'string', format: 'date-time' },
    },
  } as OpenAPISchema,

  MenuItem: {
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid' },
      merchantId: { type: 'string' },
      storeId: { type: 'string' },
      categoryId: { type: 'string' },
      name: { type: 'string' },
      description: { type: 'string' },
      price: { type: 'number' },
      image: { type: 'string', format: 'uri' },
      available: { type: 'boolean' },
      dietaryInfo: {
        type: 'array',
        items: { type: 'string', enum: ['veg', 'non-veg', 'vegan', 'gluten-free'] },
      },
      preparationTime: { type: 'integer', description: 'Minutes' },
      createdAt: { type: 'string', format: 'date-time' },
    },
  } as OpenAPISchema,

  Payment: {
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid' },
      orderId: { type: 'string' },
      amount: { type: 'number' },
      method: { type: 'string', enum: ['cash', 'card', 'upi', 'wallet', 'netbanking'] },
      status: { type: 'string', enum: ['pending', 'completed', 'failed', 'refunded'] },
      transactionId: { type: 'string' },
      gatewayResponse: { type: 'object' },
      createdAt: { type: 'string', format: 'date-time' },
    },
  } as OpenAPISchema,

  Staff: {
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid' },
      merchantId: { type: 'string' },
      name: { type: 'string' },
      phone: { type: 'string' },
      email: { type: 'string', format: 'email' },
      role: { type: 'string', enum: ['admin', 'manager', 'cashier', 'server', 'kitchen'] },
      status: { type: 'string', enum: ['active', 'inactive', 'on_leave'] },
      hireDate: { type: 'string', format: 'date' },
      createdAt: { type: 'string', format: 'date-time' },
    },
  } as OpenAPISchema,
};

// Add schemas to registry
Object.entries(schemas).forEach(([name, schema]) => {
  openAPIRegistry.addSchema(name, schema);
});

// ── Register Core Routes ───────────────────────────────────────────────────────

// Register your routes here - examples:
/*
openAPIRegistry.registerMany([
  {
    method: 'GET',
    path: '/v1/orders',
    tags: ['orders'],
    summary: 'List orders',
    description: 'Get a paginated list of orders',
    operationId: 'listOrders',
    parameters: [
      { name: 'page', in: 'query', schema: { type: 'integer' } },
      { name: 'limit', in: 'query', schema: { type: 'integer' } },
      { name: 'status', in: 'query', schema: { type: 'string' } },
      { name: 'fromDate', in: 'query', schema: { type: 'string', format: 'date' } },
      { name: 'toDate', in: 'query', schema: { type: 'string', format: 'date' } },
    ],
    responses: {
      '200': { description: 'List of orders', schema: { type: 'array', items: { $ref: '#/components/schemas/Order' } } },
    },
    security: ['bearerAuth'],
  },
  {
    method: 'POST',
    path: '/v1/orders',
    tags: ['orders'],
    summary: 'Create order',
    description: 'Create a new order',
    operationId: 'createOrder',
    requestBody: {
      required: true,
      schema: {
        type: 'object',
        properties: {
          storeId: { type: 'string' },
          customerId: { type: 'string' },
          items: { type: 'array' },
          paymentMethod: { type: 'string' },
        },
        required: ['storeId', 'items'],
      },
    },
    responses: {
      '201': { description: 'Order created', schema: { $ref: '#/components/schemas/Order' } },
    },
    security: ['bearerAuth'],
  },
]);
*/

// ── OpenAPI Routes ─────────────────────────────────────────────────────────────

export function setupOpenAPIRoutes(app: any): void {
  // OpenAPI JSON endpoint
  app.get('/api/docs/openapi.json', (req: Request, res: Response) => {
    const version = (req.query.version as string) || 'v1';
    const doc = openAPIRegistry.generate({
      title: `REZ Merchant API ${version.toUpperCase()}`,
      description: 'Complete API documentation for REZ Merchant Platform',
      version: `${version}.0.0`,
      servers: [
        { url: '/api', description: 'Current environment' },
        ...(process.env.API_BASE_URL ? [{ url: process.env.API_BASE_URL }] : []),
      ],
    });
    res.json(doc);
  });

  // Swagger UI endpoint
  app.get('/api/docs', (req: Request, res: Response) => {
    const version = (req.query.version as string) || 'v1';
    res.send(`<!DOCTYPE html>
<html>
<head>
  <title>REZ Merchant API Documentation</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css">
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script>
    SwaggerUIBundle({
      url: '/api/docs/openapi.json?version=${version}',
      dom_id: '#swagger-ui',
      presets: [SwaggerUIBundle.presets.apis, SwaggerUIBundle.SwaggerUIStandalonePreset],
      layout: 'StandaloneLayout'
    });
  </script>
</body>
</html>`);
  });

  // API version info endpoint
  app.get('/api/versions', (req: Request, res: Response) => {
    res.json({
      current: API_VERSIONS.V2,
      supported: Object.values(API_VERSIONS),
      versions: {
        v1: {
          status: 'deprecated',
          sunsetDate: '2027-06-01',
          removalDate: '2027-12-01',
        },
        v2: {
          status: 'current',
        },
      },
    });
  });
}

export default openAPIRegistry;
