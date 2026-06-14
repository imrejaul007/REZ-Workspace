// @ts-ignore
// ReZ Schedule - OpenAPI Documentation
// Access at /api/docs

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const openApiSpec: any = {
  openapi: '3.0.0',
  info: {
    title: 'ReZ Schedule API',
    description: 'Universal Scheduling Platform API',
    version: '2.0.0',
    contact: { name: 'REZ Technologies', url: 'https://rez.money' },
  },
  servers: [
    { url: 'http://localhost:4090', description: 'Development' },
    { url: 'https://api.rez.money/schedule', description: 'Production' },
  ],
  tags: [
    { name: 'Event Types', description: 'Event type management' },
    { name: 'Bookings', description: 'Booking operations' },
    { name: 'Availability', description: 'Slot availability' },
    { name: 'Users', description: 'User management' },
    { name: 'Webhooks', description: 'Webhook management' },
    { name: 'Payments', description: 'Payment operations' },
  ],
  paths: {
    '/event-types': {
      get: {
        tags: ['Event Types'],
        summary: 'List event types',
        responses: { '200': { description: 'Success' } },
      },
      post: {
        tags: ['Event Types'],
        summary: 'Create event type',
        requestBody: { content: { 'application/json': { schema: { type: 'object' } } } },
        responses: { '201': { description: 'Created' }, '400': { description: 'Validation error' } },
      },
    },
    '/event-types/{id}': {
      get: {
        tags: ['Event Types'],
        summary: 'Get event type',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Success' }, '404': { description: 'Not found' } },
      },
      put: {
        tags: ['Event Types'],
        summary: 'Update event type',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Updated' } },
      },
      delete: {
        tags: ['Event Types'],
        summary: 'Delete event type',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Deleted' } },
      },
    },
    '/event-types/public/{username}/{slug}': {
      get: {
        tags: ['Event Types'],
        summary: 'Get public event type',
        parameters: [
          { name: 'username', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'slug', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: { '200': { description: 'Success' }, '404': { description: 'Not found' } },
      },
    },
    '/availability/{username}/{slug}': {
      get: {
        tags: ['Availability'],
        summary: 'Get available slots',
        parameters: [
          { name: 'username', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'slug', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'startDate', in: 'query', required: true, schema: { type: 'string', format: 'date' } },
          { name: 'endDate', in: 'query', required: true, schema: { type: 'string', format: 'date' } },
        ],
        responses: { '200': { description: 'Success' } },
      },
    },
    '/bookings': {
      get: {
        tags: ['Bookings'],
        summary: 'List bookings',
        parameters: [
          { name: 'status', in: 'query', schema: { type: 'string' } },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
        ],
        responses: { '200': { description: 'Success' } },
      },
      post: {
        tags: ['Bookings'],
        summary: 'Create booking',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['eventTypeId', 'startTime', 'endTime', 'attendeeName', 'attendeeEmail'],
                properties: {
                  eventTypeId: { type: 'string' },
                  startTime: { type: 'string', format: 'date-time' },
                  endTime: { type: 'string', format: 'date-time' },
                  attendeeName: { type: 'string' },
                  attendeeEmail: { type: 'string', format: 'email' },
                  attendeePhone: { type: 'string' },
                  timezone: { type: 'string' },
                  idempotencyKey: { type: 'string' },
                },
              },
            },
          },
        },
        responses: { '201': { description: 'Created' }, '400': { description: 'Validation error' }, '409': { description: 'Slot unavailable' } },
      },
    },
    '/bookings/{uid}': {
      get: {
        tags: ['Bookings'],
        summary: 'Get booking',
        parameters: [{ name: 'uid', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Success' }, '404': { description: 'Not found' } },
      },
    },
    '/bookings/{uid}/cancel': {
      patch: {
        tags: ['Bookings'],
        summary: 'Cancel booking',
        parameters: [{ name: 'uid', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Cancelled' }, '400': { description: 'Cannot cancel' } },
      },
    },
    '/bookings/{uid}/confirm': {
      patch: {
        tags: ['Bookings'],
        summary: 'Confirm booking',
        parameters: [{ name: 'uid', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Confirmed' } },
      },
    },
    '/bookings/{uid}/reschedule': {
      patch: {
        tags: ['Bookings'],
        summary: 'Reschedule booking',
        parameters: [{ name: 'uid', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Rescheduled' } },
      },
    },
    '/webhooks': {
      get: {
        tags: ['Webhooks'],
        summary: 'List webhooks',
        responses: { '200': { description: 'Success' } },
      },
      post: {
        tags: ['Webhooks'],
        summary: 'Create webhook',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['url', 'triggers'],
                properties: {
                  url: { type: 'string', format: 'uri' },
                  triggers: { type: 'array', items: { type: 'string' } },
                },
              },
            },
          },
        },
        responses: { '201': { description: 'Created' } },
      },
    },
    '/webhooks/{id}': {
      delete: {
        tags: ['Webhooks'],
        summary: 'Delete webhook',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Deleted' } },
      },
    },
    '/users/me': {
      get: {
        tags: ['Users'],
        summary: 'Get current user',
        responses: { '200': { description: 'Success' } },
      },
      patch: {
        tags: ['Users'],
        summary: 'Update user',
        requestBody: { content: { 'application/json': { schema: { type: 'object' } } } },
        responses: { '200': { description: 'Updated' } },
      },
    },
    '/users/{username}': {
      get: {
        tags: ['Users'],
        summary: 'Get public user profile',
        parameters: [{ name: 'username', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Success' } },
      },
    },
    '/payments/checkout': {
      post: {
        tags: ['Payments'],
        summary: 'Create checkout session',
        requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { bookingId: { type: 'string' } } } } } },
        responses: { '200': { description: 'Success' } },
      },
    },
    '/api-keys': {
      get: {
        summary: 'List API keys',
        responses: { '200': { description: 'Success' } },
      },
      post: {
        summary: 'Create API key',
        requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { name: { type: 'string' }, permissions: { type: 'array', items: { type: 'string' } } } } } } },
        responses: { '201': { description: 'Created' } },
      },
    },
  },
  components: {
    schemas: {
      EventType: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          slug: { type: 'string' },
          title: { type: 'string' },
          description: { type: 'string' },
          duration: { type: 'integer' },
          locationType: { type: 'string', enum: ['IN_PERSON', 'PHONE_CALL', 'VIDEO_CALL', 'CUSTOM_LINK'] },
          price: { type: 'number' },
          currency: { type: 'string' },
          requiresConfirmation: { type: 'boolean' },
        },
      },
      Booking: {
        type: 'object',
        properties: {
          uid: { type: 'string' },
          status: { type: 'string', enum: ['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'NO_SHOW'] },
          startTime: { type: 'string', format: 'date-time' },
          endTime: { type: 'string', format: 'date-time' },
          attendee: { type: 'object', properties: { name: { type: 'string' }, email: { type: 'string' } } },
        },
      },
      TimeSlot: {
        type: 'object',
        properties: {
          startTime: { type: 'string', format: 'date-time' },
          endTime: { type: 'string', format: 'date-time' },
          available: { type: 'boolean' },
        },
      },
      ApiResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          data: { type: 'object' },
          error: { type: 'string' },
        },
      },
    },
    securitySchemes: {
      ApiKeyAuth: { type: 'apiKey', in: 'header', name: 'X-API-Key' },
      BearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'API Key' },
    },
  },
};

export default openApiSpec;
