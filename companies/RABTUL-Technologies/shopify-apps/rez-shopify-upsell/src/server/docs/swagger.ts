/**
 * ReZ Upsell - API Documentation (OpenAPI/Swagger)
 */

export const apiSpec = {
  openapi: '3.0.0',
  info: {
    title: 'ReZ Upsell API',
    description: 'AI-powered checkout upsell API for Shopify stores',
    version: '1.0.0',
    contact: {
      name: 'ReZ Commerce',
      email: 'support@rezapp.com',
      url: 'https://rezapp.com',
    },
    license: {
      name: 'Proprietary',
    },
  },
  servers: [
    { url: 'https://api.rezapp.com', description: 'Production' },
    { url: 'https://staging-api.rezapp.com', description: 'Staging' },
    { url: 'http://localhost:4102', description: 'Local' },
  ],
  tags: [
    { name: 'upsell', description: 'Upsell configuration and offers' },
    { name: 'analytics', description: 'Analytics and reporting' },
    { name: 'billing', description: 'Subscription management' },
    { name: 'health', description: 'Health checks' },
  ],
  paths: {
    '/health': {
      get: {
        tags: ['health'],
        summary: 'Health check',
        responses: {
          '200': {
            description: 'Service is healthy',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/HealthResponse' },
              },
            },
          },
        },
      },
    },
    '/api/upsell/configure': {
      post: {
        tags: ['upsell'],
        summary: 'Configure upsell settings',
        security: [{ ApiKeyAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ConfigureRequest' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Configuration saved',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ConfigureResponse' },
              },
            },
          },
          '400': {
            description: 'Validation error',
          },
        },
      },
    },
    '/api/upsell/config': {
      get: {
        tags: ['upsell'],
        summary: 'Get current configuration',
        security: [{ ApiKeyAuth: [] }],
        responses: {
          '200': {
            description: 'Current configuration',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ConfigResponse' },
              },
            },
          },
        },
      },
    },
    '/api/upsell/offer': {
      post: {
        tags: ['upsell'],
        summary: 'Get upsell offer for cart',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/OfferRequest' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Upsell offer (or null)',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/OfferResponse' },
              },
            },
          },
        },
      },
    },
    '/api/upsell/track': {
      post: {
        tags: ['upsell'],
        summary: 'Track upsell event',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/TrackRequest' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Event tracked',
          },
        },
      },
    },
    '/api/upsell/stats': {
      get: {
        tags: ['analytics'],
        summary: 'Get upsell statistics',
        security: [{ ApiKeyAuth: [] }],
        responses: {
          '200': {
            description: 'Statistics',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/StatsResponse' },
              },
            },
          },
        },
      },
    },
    '/api/billing/plans': {
      get: {
        tags: ['billing'],
        summary: 'Get available plans',
        responses: {
          '200': {
            description: 'List of plans',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    plans: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Plan' },
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
    securitySchemes: {
      ApiKeyAuth: {
        type: 'apiKey',
        in: 'header',
        name: 'X-API-Key',
      },
    },
    schemas: {
      HealthResponse: {
        type: 'object',
        properties: {
          status: { type: 'string', example: 'ok' },
          service: { type: 'string', example: 'rez-upsell' },
          timestamp: { type: 'string', format: 'date-time' },
        },
      },
      ConfigureRequest: {
        type: 'object',
        required: ['shop'],
        properties: {
          shop: { type: 'string', example: 'store.myshopify.com' },
          products: {
            type: 'array',
            items: { $ref: '#/components/schemas/Product' },
          },
          discountPercentage: { type: 'number', minimum: 1, maximum: 100 },
          discountCode: { type: 'string' },
          position: {
            type: 'string',
            enum: ['checkout', 'cart', 'thank_you'],
          },
        },
      },
      ConfigureResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          config: { $ref: '#/components/schemas/UpsellConfig' },
        },
      },
      ConfigResponse: {
        type: 'object',
        properties: {
          enabled: { type: 'boolean' },
          position: { type: 'string' },
          discountPercentage: { type: 'number' },
          products: { type: 'array', items: { $ref: '#/components/schemas/Product' } },
          settings: { $ref: '#/components/schemas/Settings' },
        },
      },
      OfferRequest: {
        type: 'object',
        required: ['shop', 'cartItems'],
        properties: {
          shop: { type: 'string' },
          cartItems: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                productId: { type: 'string' },
                variantId: { type: 'string' },
                title: { type: 'string' },
                price: { type: 'number' },
                quantity: { type: 'integer' },
              },
            },
          },
          sessionId: { type: 'string' },
        },
      },
      OfferResponse: {
        type: 'object',
        properties: {
          offer: {
            oneOf: [
              { $ref: '#/components/schemas/Offer' },
              { type: 'null' },
            ],
          },
        },
      },
      Offer: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          product: { $ref: '#/components/schemas/Product' },
          originalPrice: { type: 'number' },
          offerPrice: { type: 'number' },
          discountPercentage: { type: 'number' },
          discountCode: { type: 'string' },
          message: { type: 'string' },
        },
      },
      TrackRequest: {
        type: 'object',
        required: ['shop', 'sessionId', 'offerId', 'productId', 'event'],
        properties: {
          shop: { type: 'string' },
          sessionId: { type: 'string' },
          offerId: { type: 'string' },
          productId: { type: 'string' },
          variantId: { type: 'string' },
          event: {
            type: 'string',
            enum: ['offer_shown', 'offer_clicked', 'offer_accepted', 'offer_declined'],
          },
          revenue: { type: 'number' },
        },
      },
      StatsResponse: {
        type: 'object',
        properties: {
          totalOffers: { type: 'integer' },
          totalClicks: { type: 'integer' },
          totalAccepted: { type: 'integer' },
          totalDeclined: { type: 'integer' },
          clickRate: { type: 'number' },
          conversionRate: { type: 'number' },
          totalRevenue: { type: 'number' },
        },
      },
      Product: {
        type: 'object',
        properties: {
          productId: { type: 'string' },
          variantId: { type: 'string' },
          title: { type: 'string' },
          price: { type: 'number' },
          image: { type: 'string' },
          compareAtPrice: { type: 'number' },
        },
      },
      UpsellConfig: {
        type: 'object',
        properties: {
          shop: { type: 'string' },
          enabled: { type: 'boolean' },
          position: { type: 'string' },
          discountPercentage: { type: 'number' },
          products: { type: 'array', items: { $ref: '#/components/schemas/Product' } },
          settings: { $ref: '#/components/schemas/Settings' },
          stats: { $ref: '#/components/schemas/Stats' },
        },
      },
      Settings: {
        type: 'object',
        properties: {
          showOnMobile: { type: 'boolean' },
          autoTrigger: { type: 'boolean' },
          delaySeconds: { type: 'integer' },
          maxUpsellsPerSession: { type: 'integer' },
          primaryColor: { type: 'string' },
          backgroundColor: { type: 'string' },
        },
      },
      Stats: {
        type: 'object',
        properties: {
          totalOffers: { type: 'integer' },
          totalClicks: { type: 'integer' },
          totalAccepted: { type: 'integer' },
          totalDeclined: { type: 'integer' },
          totalRevenue: { type: 'number' },
        },
      },
      Plan: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          price: { type: 'number' },
          currency: { type: 'string' },
          interval: { type: 'string' },
          trialDays: { type: 'integer' },
          features: { type: 'array', items: { type: 'string' } },
        },
      },
    },
  },
};
