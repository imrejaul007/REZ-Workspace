import { Router, Request, Response } from 'express';

const router = Router();

router.get('/', (_req: Request, res: Response) => {
  res.json({
    openapi: '3.0.0',
    info: {
      title: 'RisnaEstate API',
      version: '1.0.0',
      description: 'AI-Powered Real Estate Commerce Platform API'
    },
    servers: [
      { url: 'http://localhost:3000', description: 'Development' },
      { url: 'https://api.risnaestate.com', description: 'Production' }
    ],
    paths: {
      // Property endpoints
      '/api/v1/properties': {
        get: {
          tags: ['Properties'],
          summary: 'Search properties',
          parameters: [
            { name: 'country', in: 'query', schema: { type: 'string', enum: ['IN', 'AE'] } },
            { name: 'city', in: 'query', schema: { type: 'string' } },
            { name: 'propertyType', in: 'query', schema: { type: 'string' } },
            { name: 'listingType', in: 'query', schema: { type: 'string', enum: ['sale', 'rent'] } },
            { name: 'minPrice', in: 'query', schema: { type: 'number' } },
            { name: 'maxPrice', in: 'query', schema: { type: 'number' } },
            { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } }
          ],
          responses: { '200': { description: 'Success' } }
        },
        post: {
          tags: ['Properties'],
          summary: 'Create property',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['title', 'description', 'propertyType', 'listingType', 'country', 'city', 'locality', 'price'],
                  properties: {
                    title: { type: 'string' },
                    description: { type: 'string' },
                    propertyType: { type: 'string' },
                    listingType: { type: 'string' },
                    country: { type: 'string' },
                    city: { type: 'string' },
                    locality: { type: 'string' },
                    price: {
                      type: 'object',
                      properties: {
                        amount: { type: 'number' },
                        currency: { type: 'string' }
                      }
                    },
                    bedrooms: { type: 'integer' },
                    bathrooms: { type: 'integer' }
                  }
                }
              }
            }
          },
          responses: { '201': { description: 'Created' } }
        }
      },
      '/api/v1/properties/{id}': {
        get: {
          tags: ['Properties'],
          summary: 'Get property by ID',
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string' } }
          ],
          responses: { '200': { description: 'Success' }, '404': { description: 'Not found' } }
        }
      },

      // Lead endpoints
      '/api/v1/leads': {
        get: {
          tags: ['Leads'],
          summary: 'Search leads',
          parameters: [
            { name: 'segment', in: 'query', schema: { type: 'string' } },
            { name: 'status', in: 'query', schema: { type: 'string' } },
            { name: 'brokerId', in: 'query', schema: { type: 'string' } }
          ],
          responses: { '200': { description: 'Success' } }
        },
        post: {
          tags: ['Leads'],
          summary: 'Create lead',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['name', 'phone', 'source'],
                  properties: {
                    name: { type: 'string' },
                    phone: { type: 'string' },
                    email: { type: 'string' },
                    source: { type: 'string', enum: ['website', 'whatsapp', 'referral', 'social', 'ad', 'organic'] },
                    segment: { type: 'string' },
                    preferences: {
                      type: 'object',
                      properties: {
                        propertyTypes: { type: 'array', items: { type: 'string' } },
                        budget: {
                          type: 'object',
                          properties: {
                            min: { type: 'number' },
                            max: { type: 'number' },
                            currency: { type: 'string' }
                          }
                        },
                        timeline: { type: 'string' },
                        purpose: { type: 'string' }
                      }
                    }
                  }
                }
              }
            }
          },
          responses: { '201': { description: 'Created' } }
        }
      },
      '/api/v1/leads/hot': {
        get: {
          tags: ['Leads'],
          summary: 'Get hot leads (score > 80)',
          responses: { '200': { description: 'Success' } }
        }
      },
      '/api/v1/leads/{id}/score': {
        post: {
          tags: ['Leads'],
          summary: 'Score lead with AI',
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string' } }
          ],
          responses: { '200': { description: 'Success' } }
        }
      },

      // Visa endpoints
      '/api/v1/visa/programs': {
        get: {
          tags: ['Visa'],
          summary: 'Get visa programs',
          responses: { '200': { description: 'Success' } }
        }
      },
      '/api/v1/visa/eligibility': {
        post: {
          tags: ['Visa'],
          summary: 'Check visa eligibility',
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    country: { type: 'string' },
                    profile: {
                      type: 'object',
                      properties: {
                        age: { type: 'integer' },
                        annualIncome: { type: 'number' },
                        netWorth: { type: 'number' }
                      }
                    },
                    investments: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          propertyValue: { type: 'number' }
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          responses: { '200': { description: 'Success' } }
        }
      },

      // Referral endpoints
      '/api/v1/referrals': {
        post: {
          tags: ['Referrals'],
          summary: 'Create referral',
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['code', 'referrerId'],
                  properties: {
                    code: { type: 'string' },
                    referrerId: { type: 'string' },
                    refereePhone: { type: 'string' },
                    source: { type: 'string' },
                    propertyId: { type: 'string' }
                  }
                }
              }
            }
          },
          responses: { '201': { description: 'Created' } }
        }
      },
      '/api/v1/referrals/validate': {
        post: {
          tags: ['Referrals'],
          summary: 'Validate referral code',
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    code: { type: 'string' }
                  }
                }
              }
            }
          },
          responses: { '200': { description: 'Success' } }
        }
      },
      '/api/v1/referrals/leaderboard': {
        get: {
          tags: ['Referrals'],
          summary: 'Get referral leaderboard',
          responses: { '200': { description: 'Success' } }
        }
      },

      // Broker endpoints
      '/api/v1/brokers': {
        get: {
          tags: ['Brokers'],
          summary: 'Search brokers',
          parameters: [
            { name: 'country', in: 'query', schema: { type: 'string' } },
            { name: 'city', in: 'query', schema: { type: 'string' } },
            { name: 'minRating', in: 'query', schema: { type: 'number' } }
          ],
          responses: { '200': { description: 'Success' } }
        },
        post: {
          tags: ['Brokers'],
          summary: 'Register broker',
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['userId', 'name', 'phone'],
                  properties: {
                    userId: { type: 'string' },
                    name: { type: 'string' },
                    phone: { type: 'string' },
                    email: { type: 'string' },
                    companyName: { type: 'string' },
                    license: {
                      type: 'object',
                      properties: {
                        number: { type: 'string' },
                        type: { type: 'string' }
                      }
                    },
                    coverage: {
                      type: 'object',
                      properties: {
                        countries: { type: 'array', items: { type: 'string' } },
                        cities: { type: 'array', items: { type: 'string' } }
                      }
                    }
                  }
                }
              }
            }
          },
          responses: { '201': { description: 'Created' } }
        }
      },

      // CRM endpoints
      '/api/v1/crm/follow-ups': {
        get: {
          tags: ['CRM'],
          summary: 'Get follow-ups',
          parameters: [
            { name: 'brokerId', in: 'query', schema: { type: 'string' } },
            { name: 'status', in: 'query', schema: { type: 'string' } }
          ],
          responses: { '200': { description: 'Success' } }
        },
        post: {
          tags: ['CRM'],
          summary: 'Create follow-up',
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['leadId', 'brokerId', 'type', 'scheduledAt'],
                  properties: {
                    leadId: { type: 'string' },
                    brokerId: { type: 'string' },
                    type: { type: 'string', enum: ['call', 'whatsapp', 'site_visit', 'meeting', 'email'] },
                    priority: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'] },
                    scheduledAt: { type: 'string', format: 'date-time' },
                    notes: { type: 'string' }
                  }
                }
              }
            }
          },
          responses: { '201': { description: 'Created' } }
        }
      },
      '/api/v1/crm/site-visits': {
        post: {
          tags: ['CRM'],
          summary: 'Schedule site visit',
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['leadId', 'brokerId', 'propertyId', 'scheduledAt'],
                  properties: {
                    leadId: { type: 'string' },
                    brokerId: { type: 'string' },
                    propertyId: { type: 'string' },
                    scheduledAt: { type: 'string', format: 'date-time' },
                    address: { type: 'string' },
                    attendees: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          name: { type: 'string' },
                          phone: { type: 'string' }
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          responses: { '201': { description: 'Created' } }
        }
      },

      // Media endpoints
      '/api/v1/media/campaigns': {
        get: {
          tags: ['Media'],
          summary: 'Get campaigns',
          responses: { '200': { description: 'Success' } }
        },
        post: {
          tags: ['Media'],
          summary: 'Create campaign',
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['name', 'type', 'budget', 'startDate'],
                  properties: {
                    name: { type: 'string' },
                    type: { type: 'string' },
                    budget: { type: 'number' },
                    targeting: {
                      type: 'object',
                      properties: {
                        countries: { type: 'array', items: { type: 'string' } },
                        cities: { type: 'array', items: { type: 'string' } },
                        ageMin: { type: 'integer' },
                        ageMax: { type: 'integer' }
                      }
                    },
                    startDate: { type: 'string', format: 'date' },
                    endDate: { type: 'string', format: 'date' }
                  }
                }
              }
            }
          },
          responses: { '201': { description: 'Created' } }
        }
      }
    }
  });
});

export default router;
