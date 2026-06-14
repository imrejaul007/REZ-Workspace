/**
 * REZ Bills - Swagger/OpenAPI Documentation
 */

import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'REZ Bills API',
      version: '1.0.0',
      description: 'Smart Bill Payment & Receipt Management API',
      contact: {
        name: 'REZ Consumer',
        email: 'support@rez.app',
      },
    },
    servers: [
      {
        url: 'http://localhost:3012',
        description: 'Development server',
      },
      {
        url: 'https://rez-bills-api.onrender.com',
        description: 'Production server',
      },
    ],
    tags: [
      { name: 'Bills', description: 'Bill management endpoints' },
      { name: 'Cashback', description: 'Cashback operations' },
      { name: 'Tax', description: 'Tax record endpoints' },
    ],
    paths: {
      '/health': {
        get: {
          tags: ['Health'],
          summary: 'Health check',
          responses: {
            '200': {
              description: 'Service is healthy',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      status: { type: 'string', example: 'ok' },
                      service: { type: 'string', example: 'rez-bills' },
                      version: { type: 'string', example: '1.0.0' },
                      timestamp: { type: 'string', format: 'date-time' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/api/bills': {
        get: {
          tags: ['Bills'],
          summary: 'Get all bills for a user',
          parameters: [
            {
              name: 'userId',
              in: 'query',
              required: true,
              schema: { type: 'string' },
              description: 'User ID',
            },
          ],
          responses: {
            '200': {
              description: 'List of bills',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      data: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/Bill' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        post: {
          tags: ['Bills'],
          summary: 'Create a new bill',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['userId', 'merchantName', 'amount'],
                  properties: {
                    userId: { type: 'string', description: 'User ID' },
                    merchantName: { type: 'string', description: 'Merchant name' },
                    merchantCategory: {
                      type: 'string',
                      enum: ['restaurant', 'grocery', 'shopping', 'electronics'],
                      description: 'Merchant category',
                    },
                    amount: { type: 'number', description: 'Bill amount' },
                    imageData: { type: 'string', description: 'Receipt image data (base64)' },
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Bill created successfully',
            },
            '400': {
              description: 'Invalid request',
            },
          },
        },
      },
      '/api/bills/{id}': {
        get: {
          tags: ['Bills'],
          summary: 'Get a specific bill',
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string' },
              description: 'Bill ID',
            },
          ],
          responses: {
            '200': {
              description: 'Bill details',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      data: { $ref: '#/components/schemas/Bill' },
                    },
                  },
                },
              },
            },
            '404': {
              description: 'Bill not found',
            },
          },
        },
      },
      '/api/bills/{id}/claim-cashback': {
        post: {
          tags: ['Cashback'],
          summary: 'Claim cashback for a bill',
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string' },
              description: 'Bill ID',
            },
          ],
          responses: {
            '200': {
              description: 'Cashback claimed successfully',
            },
            '400': {
              description: 'Cashback already claimed or invalid bill',
            },
          },
        },
      },
      '/api/bills/tax-records/{year}': {
        get: {
          tags: ['Tax'],
          summary: 'Get tax records for a year',
          parameters: [
            {
              name: 'year',
              in: 'path',
              required: true,
              schema: { type: 'integer' },
              description: 'Tax year (e.g., 2024)',
            },
            {
              name: 'userId',
              in: 'query',
              required: true,
              schema: { type: 'string' },
            },
          ],
          responses: {
            '200': {
              description: 'Tax records for the year',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      data: {
                        type: 'object',
                        properties: {
                          year: { type: 'integer' },
                          totalAmount: { type: 'number' },
                          totalCashback: { type: 'number' },
                          billCount: { type: 'integer' },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    components: {
      schemas: {
        Bill: {
          type: 'object',
          properties: {
            bill_id: { type: 'string' },
            user_id: { type: 'string' },
            merchant_name: { type: 'string' },
            merchant_category: {
              type: 'string',
              enum: ['restaurant', 'grocery', 'shopping', 'electronics', 'default'],
            },
            amount: { type: 'number' },
            cashback_earned: { type: 'number' },
            cashback_claimed: { type: 'boolean' },
            created_at: { type: 'string', format: 'date-time' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: { type: 'string' },
          },
        },
      },
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: [],
};

export const openapiSpecification = swaggerJsdoc(options);
