/**
 * Swagger / OpenAPI Configuration
 *
 * API documentation for ReZ Merchant Service B2B features:
 * - Suppliers, Purchase Orders, Credit Lines
 * - Authentication, Webhooks
 */

import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'ReZ Merchant Service API',
      version: '2.0.0',
      description: `
## B2B Merchant Platform API

Complete purchase order, supplier, and credit management for Indian SMBs.

### Authentication
All endpoints (except /auth/* and /health) require:
- \`Authorization: Bearer <token>\` header
- \`X-Internal-Token\` for service-to-service calls

### Rate Limits
- AUTH endpoints: 5/min
- WRITE operations: 30/min
- READ operations: 200/min
- Bulk operations: 10/hour

### Response Format
\`\`\`json
{
  "success": true,
  "data": { ... }
}
\`\`\`

### Error Format
\`\`\`json
{
  "success": false,
  "message": "Error description",
  "error": "ERROR_CODE"
}
\`\`\`
      `,
      contact: {
        name: 'ReZ Platform',
        email: 'api-support@rezapp.com',
      },
      license: {
        name: 'Proprietary',
        url: 'https://rezapp.com/license',
      },
    },
    servers: [
      {
        url: '/api/v1',
        description: 'Current version',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token from /auth/login',
        },
        internalToken: {
          type: 'apiKey',
          in: 'header',
          name: 'X-Internal-Token',
          description: 'Service-to-service authentication token',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string' },
            error: { type: 'string' },
          },
        },
        Pagination: {
          type: 'object',
          properties: {
            page: { type: 'integer', example: 1 },
            limit: { type: 'integer', example: 20 },
            total: { type: 'integer', example: 100 },
            totalPages: { type: 'integer', example: 5 },
            hasMore: { type: 'boolean', example: true },
          },
        },
        Supplier: {
          type: 'object',
          properties: {
            _id: { type: 'string', format: 'ObjectId' },
            merchantId: { type: 'string', format: 'ObjectId' },
            name: { type: 'string', example: 'ABC Supplies Pvt Ltd' },
            contactPerson: { type: 'string', example: 'Rajesh Kumar' },
            email: { type: 'string', format: 'email', example: 'rajesh@abcsupplies.com' },
            phone: { type: 'string', pattern: '^[0-9]{10}$', example: '9876543210' },
            gstNumber: { type: 'string', pattern: '^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$' },
            pan: { type: 'string', pattern: '^[A-Z]{5}[0-9]{4}[A-Z]{1}$' },
            creditLimit: { type: 'number', example: 500000 },
            creditUsed: { type: 'number', example: 125000 },
            creditPeriodDays: { type: 'integer', example: 30 },
            dueDatePreference: { type: 'string', enum: ['end_of_month', 'immediate', 'specific_day'] },
            status: { type: 'string', enum: ['pending', 'approved', 'rejected', 'blocked'] },
            isActive: { type: 'boolean', example: true },
            tags: { type: 'array', items: { type: 'string' } },
            notes: { type: 'string' },
          },
        },
        PurchaseOrder: {
          type: 'object',
          properties: {
            _id: { type: 'string', format: 'ObjectId' },
            poNumber: { type: 'string', example: 'PO-20260513-0001' },
            merchantId: { type: 'string', format: 'ObjectId' },
            supplierId: { type: 'string', format: 'ObjectId', description: 'Reference to Supplier' },
            supplierName: { type: 'string' },
            status: { type: 'string', enum: ['draft', 'pending_approval', 'approved', 'rejected', 'confirmed', 'partial_received', 'received', 'closed', 'cancelled'] },
            paymentStatus: { type: 'string', enum: ['unpaid', 'partial', 'paid', 'overdue'] },
            items: {
              type: 'array',
              items: { $ref: '#/components/schemas/POItem' },
            },
            subtotal: { type: 'number' },
            totalDiscount: { type: 'number' },
            taxAmount: { type: 'number' },
            totalAmount: { type: 'number' },
            paidAmount: { type: 'number' },
            orderDate: { type: 'string', format: 'date-time' },
            dueDate: { type: 'string', format: 'date-time' },
            expectedDeliveryDate: { type: 'string', format: 'date-time' },
          },
        },
        POItem: {
          type: 'object',
          properties: {
            productName: { type: 'string' },
            sku: { type: 'string' },
            description: { type: 'string' },
            quantity: { type: 'number' },
            unitPrice: { type: 'number' },
            discount: { type: 'number' },
            taxRate: { type: 'number' },
            taxAmount: { type: 'number' },
            total: { type: 'number' },
            receivedQty: { type: 'number' },
            pendingQty: { type: 'number' },
          },
        },
        CreditLine: {
          type: 'object',
          properties: {
            _id: { type: 'string', format: 'ObjectId' },
            merchantId: { type: 'string', format: 'ObjectId' },
            supplierId: { type: 'string', format: 'ObjectId' },
            creditLimit: { type: 'number' },
            currentBalance: { type: 'number' },
            availableCredit: { type: 'number' },
            status: { type: 'string', enum: ['active', 'suspended', 'closed'] },
            interestRate: { type: 'number' },
            billingCycle: { type: 'string', enum: ['monthly', 'weekly', 'custom'] },
          },
        },
        AgingReport: {
          type: 'object',
          properties: {
            supplierId: { type: 'string' },
            supplierName: { type: 'string' },
            totalOutstanding: { type: 'number' },
            current: { type: 'number', description: '0-30 days overdue' },
            days30to60: { type: 'number', description: '30-60 days overdue' },
            days60to90: { type: 'number', description: '60-90 days overdue' },
            days90Plus: { type: 'number', description: '90+ days overdue' },
            oldestInvoiceDate: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
    security: [
      { bearerAuth: [] },
      { internalToken: [] },
    ],
    tags: [
      { name: 'Suppliers', description: 'Vendor/supplier management' },
      { name: 'Purchase Orders', description: 'PO creation, approval, and tracking' },
      { name: 'Credit Lines', description: 'BNPL and credit management' },
      { name: 'Authentication', description: 'Login, register, password reset' },
      { name: 'Health', description: 'Service health and readiness' },
    ],
  },
  apis: ['./src/routes/*.ts', './src/routes/**/*.ts', './src/config/swagger.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
