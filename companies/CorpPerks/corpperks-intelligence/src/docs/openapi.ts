// OpenAPI/Swagger Documentation
// API documentation for CorpPerks Intelligence

export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'CorpPerks Intelligence API',
    description: 'AI Workforce Decision Intelligence Platform - Provides decision cards, AI copilot, health scores, anomaly detection, and workforce forecasting.',
    version: '1.0.0',
    contact: {
      name: 'CorpPerks Support',
      email: 'support@corpperks.com',
    },
    license: {
      name: 'MIT',
    },
  },
  servers: [
    {
      url: 'http://localhost:4135',
      description: 'Development server',
    },
    {
      url: 'https://corpperks-intelligence.onrender.com',
      description: 'Production server',
    },
  ],
  tags: [
    { name: 'Insights', description: 'AI decision insights and health scores' },
    { name: 'Copilot', description: 'Natural language AI copilot' },
    { name: 'Forecasts', description: 'Predictive workforce analytics' },
    { name: 'Ecosystem', description: 'Ecosystem service integration' },
    { name: 'Health', description: 'Service health and metrics' },
  ],
  paths: {
    '/health': {
      get: {
        tags: ['Health'],
        summary: 'Basic health check',
        description: 'Returns service status and capabilities',
        responses: {
          '200': {
            description: 'Service is healthy',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'ok' },
                    service: { type: 'string', example: 'corpperks-intelligence' },
                    version: { type: 'string', example: '1.0.0' },
                    capabilities: {
                      type: 'array',
                      items: { type: 'string' },
                      example: ['Decision Cards', 'AI Copilot', 'Health Score'],
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/v1/insights/cards': {
      get: {
        tags: ['Insights'],
        summary: 'Get AI decision cards',
        description: 'Returns actionable AI-generated insights as decision cards',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'X-Tenant-ID',
            in: 'header',
            required: false,
            schema: { type: 'string', default: 'default' },
          },
        ],
        responses: {
          '200': {
            description: 'Decision cards retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'object',
                      properties: {
                        cards: {
                          type: 'array',
                          items: {
                            type: 'object',
                            properties: {
                              id: { type: 'string' },
                              type: { type: 'string' },
                              title: { type: 'string' },
                              description: { type: 'string' },
                              confidence: { type: 'number' },
                              severity: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
                              category: { type: 'string' },
                              actions: { type: 'array' },
                            },
                          },
                        },
                        summary: {
                          type: 'object',
                          properties: {
                            critical: { type: 'number' },
                            high: { type: 'number' },
                            medium: { type: 'number' },
                            low: { type: 'number' },
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
    },
    '/api/v1/insights/health': {
      get: {
        tags: ['Insights'],
        summary: 'Get workforce health score',
        description: 'Returns composite workforce health score (0-100) with component breakdowns',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Health score retrieved',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'object',
                      properties: {
                        overall: { type: 'number', minimum: 0, maximum: 100 },
                        components: {
                          type: 'object',
                          properties: {
                            engagement: { type: 'number' },
                            attendance: { type: 'number' },
                            productivity: { type: 'number' },
                            sentiment: { type: 'number' },
                          },
                        },
                        trends: {
                          type: 'object',
                          properties: {
                            weekly: { type: 'number' },
                            monthly: { type: 'number' },
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
    },
    '/api/v1/copilot/query': {
      post: {
        tags: ['Copilot'],
        summary: 'Process AI copilot query',
        description: 'Process natural language queries about workforce data',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['query'],
                properties: {
                  query: {
                    type: 'string',
                    maxLength: 500,
                    description: 'Natural language query',
                    example: 'Why is attrition increasing?',
                  },
                  context: { type: 'string' },
                  department: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Query processed successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'object',
                      properties: {
                        answer: { type: 'string' },
                        data: { type: 'object' },
                        confidence: { type: 'number' },
                        suggestions: { type: 'array', items: { type: 'string' } },
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
    '/api/v1/forecasts': {
      get: {
        tags: ['Forecasts'],
        summary: 'Get complete workforce forecast',
        description: 'Returns comprehensive workforce predictions including attrition, headcount, payroll, and productivity',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Forecast data retrieved',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'object',
                      properties: {
                        attritionForecast: { type: 'object' },
                        headcountForecast: { type: 'object' },
                        payrollForecast: { type: 'object' },
                        hiringBudget: { type: 'object' },
                        productivityTrend: { type: 'object' },
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
    '/api/v1/ecosystem/services': {
      get: {
        tags: ['Ecosystem'],
        summary: 'List connected ecosystem services',
        description: 'Returns all connected RABTUL, REZ Intelligence, REZ Media, and RTNM Group services',
        responses: {
          '200': {
            description: 'Services list retrieved',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          name: { type: 'string' },
                          services: {
                            type: 'array',
                            items: {
                              type: 'object',
                              properties: {
                                name: { type: 'string' },
                                url: { type: 'string' },
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
        },
      },
    },
    '/api/v1/ecosystem/health': {
      get: {
        tags: ['Ecosystem'],
        summary: 'Get ecosystem health status',
        description: 'Returns health status of all connected ecosystem services',
        responses: {
          '200': {
            description: 'Health status retrieved',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'object',
                      properties: {
                        rabtul: { type: 'object' },
                        rezIntelligence: { type: 'object' },
                        rezMedia: { type: 'object' },
                        rtnmGroup: { type: 'object' },
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
    '/metrics': {
      get: {
        tags: ['Health'],
        summary: 'Get Prometheus metrics',
        description: 'Returns metrics in Prometheus format for monitoring',
        responses: {
          '200': {
            description: 'Metrics data',
            content: {
              'text/plain': {
                schema: { type: 'string' },
              },
            },
          },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT token from RABTUL Auth Service',
      },
    },
    schemas: {
      ApiResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          data: { type: 'object' },
          error: { type: 'string' },
          errorId: { type: 'string' },
          timestamp: { type: 'string', format: 'date-time' },
        },
      },
      Error: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: { type: 'string' },
          errorId: { type: 'string' },
          details: { type: 'object' },
          timestamp: { type: 'string', format: 'date-time' },
        },
      },
    },
  },
};

export default openApiSpec;
