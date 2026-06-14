/**
 * OpenAPI/Swagger Documentation for REZ Referral OS
 */

export const apiDocs = {
  openapi: '3.0.0',
  info: {
    title: 'REZ Referral OS API',
    version: '1.0.0',
    description: 'Unified referral infrastructure for the REZ ecosystem',
    contact: { name: 'RTNM Group', email: 'api@rez.money' },
  },
  servers: [
    { url: 'http://localhost:4019', description: 'Development' },
    { url: 'https://api.rez.money/referral', description: 'Production' },
  ],
  paths: {
    '/health': {
      get: {
        summary: 'Health check',
        responses: {
          '200': { description: 'OK' },
        },
      },
    },
    '/api/campaigns': {
      get: {
        summary: 'List campaigns',
        responses: {
          '200': { description: 'Campaigns list' },
        },
      },
    },
    '/api/fraud/score': {
      post: {
        summary: 'Calculate fraud risk',
        security: [{ InternalToken: [] }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['referrerId', 'refereeId', 'referralCode'],
                properties: {
                  referrerId: { type: 'string' },
                  refereeId: { type: 'string' },
                  referralCode: { type: 'string' },
                  ip: { type: 'string' },
                  deviceId: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Fraud score' },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      BearerAuth: { type: 'http', scheme: 'bearer' },
      InternalToken: { type: 'apiKey', in: 'header', name: 'X-Internal-Token' },
    },
  },
};

export default apiDocs;
