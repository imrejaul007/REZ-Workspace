/**
 * REZ Verify QR Service - Swagger/OpenAPI Documentation
 */

import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'REZ Verify QR API',
      version: '2.0.0',
      description: 'Product authentication, warranty management, and ownership verification API',
      contact: {
        name: 'REZ Consumer',
        email: 'support@rez.app',
      },
    },
    servers: [
      {
        url: 'http://localhost:4003',
        description: 'Development server',
      },
      {
        url: 'https://rez-verify-qr.onrender.com',
        description: 'Production server',
      },
    ],
    tags: [
      { name: 'Product', description: 'Product registration and verification' },
      { name: 'Warranty', description: 'Warranty management' },
      { name: 'Ownership', description: 'Ownership passport and transfer' },
      { name: 'Merchant', description: 'Merchant endpoints' },
      { name: 'OEM', description: 'OEM dashboard endpoints' },
    ],
    paths: {
      '/health': {
        get: {
          tags: ['Health'],
          summary: 'Health check',
          security: [],
          responses: {
            '200': {
              description: 'Service is healthy',
            },
          },
        },
      },
      '/api/register': {
        post: {
          tags: ['Product'],
          summary: 'Register a new product with QR code',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['serialNumber', 'productId'],
                  properties: {
                    serialNumber: { type: 'string', description: 'Product serial number' },
                    productId: { type: 'string', description: 'Product ID' },
                    manufacturerId: { type: 'string', description: 'Manufacturer ID' },
                    metadata: { type: 'object', description: 'Additional product metadata' },
                  },
                },
              },
            },
          },
          responses: {
            '200': { description: 'Product registered successfully' },
            '400': { description: 'Invalid request' },
            '401': { description: 'Unauthorized' },
          },
        },
      },
      '/api/verify': {
        post: {
          tags: ['Product'],
          summary: 'Verify a product by QR code or serial number',
          security: [],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['qrCode'],
                  properties: {
                    qrCode: { type: 'string', description: 'QR code value' },
                    serialNumber: { type: 'string', description: 'Serial number (optional)' },
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Verification result',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/VerifyResult' },
                },
              },
            },
          },
        },
      },
      '/api/warranty/check': {
        post: {
          tags: ['Warranty'],
          summary: 'Check warranty status',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['serialNumber'],
                  properties: {
                    serialNumber: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Warranty status',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/WarrantyStatus' },
                },
              },
            },
          },
        },
      },
      '/api/warranty/claim': {
        post: {
          tags: ['Warranty'],
          summary: 'File a warranty claim',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['serialNumber', 'claimReason'],
                  properties: {
                    serialNumber: { type: 'string' },
                    claimReason: { type: 'string' },
                    description: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            '200': { description: 'Claim filed' },
            '400': { description: 'Warranty expired or invalid' },
          },
        },
      },
      '/api/ownership/passport': {
        post: {
          tags: ['Ownership'],
          summary: 'Generate ownership passport',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['serialNumber'],
                  properties: {
                    serialNumber: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            '200': { description: 'Passport generated' },
          },
        },
      },
      '/api/ownership/transfer': {
        post: {
          tags: ['Ownership'],
          summary: 'Transfer ownership',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['serialNumber', 'newOwnerId'],
                  properties: {
                    serialNumber: { type: 'string' },
                    newOwnerId: { type: 'string' },
                    transferReason: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            '200': { description: 'Ownership transferred' },
            '400': { description: 'Transfer failed' },
          },
        },
      },
      '/api/merchant/register': {
        post: {
          tags: ['Merchant'],
          summary: 'Register a merchant',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['merchantName', 'merchantType'],
                  properties: {
                    merchantName: { type: 'string' },
                    merchantType: { type: 'string', enum: ['manufacturer', 'service_center', 'retailer'] },
                    contactEmail: { type: 'string' },
                    address: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            '200': { description: 'Merchant registered' },
          },
        },
      },
      '/oem/analytics/counterfeit': {
        get: {
          tags: ['OEM'],
          summary: 'Get counterfeit analytics',
          security: [{ bearerAuth: [] }],
          responses: {
            '200': {
              description: 'Counterfeit analytics data',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      totalScans: { type: 'number' },
                      suspiciousCount: { type: 'number' },
                      verifiedCount: { type: 'number' },
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
        VerifyResult: {
          type: 'object',
          properties: {
            verified: { type: 'boolean' },
            serialNumber: { type: 'string' },
            productName: { type: 'string' },
            manufacturer: { type: 'string' },
            warrantyStatus: { type: 'string' },
            warrantyExpiry: { type: 'string', format: 'date-time' },
            isGenuine: { type: 'boolean' },
          },
        },
        WarrantyStatus: {
          type: 'object',
          properties: {
            isValid: { type: 'boolean' },
            startDate: { type: 'string', format: 'date-time' },
            expiryDate: { type: 'string', format: 'date-time' },
            remainingDays: { type: 'number' },
            status: { type: 'string', enum: ['active', 'expired', 'void'] },
          },
        },
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            code: { type: 'string' },
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
