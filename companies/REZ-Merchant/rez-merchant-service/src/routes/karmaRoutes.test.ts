jest.mock('../middleware/auth', () => ({
  merchantAuth: (_req: any, _res: any, next: any) => next(),
}));

const mockCampaignSave = jest.fn();
const mockCampaignFindOne = jest.fn();
const mockCampaignFind = jest.fn();
const mockCampaignCountDocuments = jest.fn();
const mockCampaignFindOneAndUpdate = jest.fn();

const mockKarmaEventSave = jest.fn();
const mockKarmaEventFindById = jest.fn();
const mockKarmaEventFind = jest.fn();
const mockKarmaEventCountDocuments = jest.fn();
const mockKarmaEventFindByIdAndUpdate = jest.fn();

const mockEventFindOne = jest.fn();

const mockBookingFindOneAndUpdate = jest.fn();
const mockBookingUpdateMany = jest.fn();
const mockBookingFind = jest.fn();
const mockBookingCountDocuments = jest.fn();
const mockBookingAggregate = jest.fn();

jest.mock('../models/KarmaCampaign', () => ({
  KarmaCampaign: function (data: any) {
    return { ...data, save: mockCampaignSave.mockResolvedValue(data) };
  },
  find: mockCampaignFind,
  findOne: mockCampaignFindOne,
  countDocuments: mockCampaignCountDocuments,
  findOneAndUpdate: mockCampaignFindOneAndUpdate,
}));

jest.mock('../models/KarmaEvent', () => ({
  KarmaEvent: function (data: any) {
    return { ...data, save: mockKarmaEventSave.mockResolvedValue(data) };
  },
  findById: mockKarmaEventFindById,
  find: mockKarmaEventFind,
  countDocuments: mockKarmaEventCountDocuments,
  findByIdAndUpdate: mockKarmaEventFindByIdAndUpdate,
}));

jest.mock('../models/Event', () => ({
  Event: { findOne: mockEventFindOne },
}));

jest.mock('../models/EventBooking', () => ({
  EventBooking: {
    findOneAndUpdate: mockBookingFindOneAndUpdate,
    updateMany: mockBookingUpdateMany,
    find: mockBookingFind,
    countDocuments: mockBookingCountDocuments,
    aggregate: mockBookingAggregate,
  },
}));

import karmaRouter from './karmaRoutes';

describe('karma router', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCampaignSave.mockClear();
    mockCampaignFindOne.mockClear();
    mockCampaignFind.mockClear();
    mockCampaignCountDocuments.mockClear();
    mockCampaignFindOneAndUpdate.mockClear();
    mockKarmaEventSave.mockClear();
    mockKarmaEventFindById.mockClear();
    mockKarmaEventFind.mockClear();
    mockKarmaEventCountDocuments.mockClear();
    mockKarmaEventFindByIdAndUpdate.mockClear();
    mockEventFindOne.mockClear();
    mockBookingFindOneAndUpdate.mockClear();
    mockBookingUpdateMany.mockClear();
    mockBookingFind.mockClear();
    mockBookingCountDocuments.mockClear();
    mockBookingAggregate.mockClear();
  });

  // ── POST /api/karma/campaign ────────────────────────────────────────────────

  it('POST /campaign creates a campaign', async () => {
    const mockReq = {
      body: {
        name: 'Green Bangalore CSR',
        description: 'Plant 1000 trees',
        corporateId: 'acme-corp',
        budget: 500000,
        coinPool: 10000,
        status: 'draft',
      },
      merchantId: 'merchant-123',
    } as any;
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as any;

    mockCampaignSave.mockResolvedValue({ ...mockReq.body, _id: 'campaign-new-id' });

    // Find the route handler by inspecting the router stack
    const handler = (karmaRouter as any).stack.find(
      (layer: any) => layer.route?.path === '/campaign' && layer.route?.methods?.post,
    );
    await handler.route.stack[0].handle(mockReq, mockRes);

    expect(mockCampaignSave).toHaveBeenCalled();
    expect(mockRes.status).toHaveBeenCalledWith(201);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, message: 'Karma campaign created' }),
    );
  });

  // ── POST /api/karma/event ───────────────────────────────────────────────────

  it('POST /event creates a karma event with QR codes', async () => {
    const mockEvent = {
      _id: 'event-123',
      merchantId: 'merchant-123',
      title: 'Beach Cleanup',
    };
    const mockReq = {
      body: {
        merchantEventId: 'event-123',
        category: 'environment',
        impactUnit: 'trees',
        difficulty: 'easy',
        baseKarmaPerHour: 50,
        maxKarmaPerEvent: 400,
        expectedDurationHours: 4,
        ngoId: 'ngo-001',
      },
      merchantId: 'merchant-123',
    } as any;
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as any;

    mockEventFindOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(mockEvent) });
    mockKarmaEventSave.mockResolvedValue({ ...mockReq.body, _id: 'karma-event-new' });

    const handler = (karmaRouter as any).stack.find(
      (layer: any) => layer.route?.path === '/event' && layer.route?.methods?.post,
    );
    await handler.route.stack[0].handle(mockReq, mockRes);

    expect(mockEventFindOne).toHaveBeenCalled();
    expect(mockKarmaEventSave).toHaveBeenCalled();
    expect(mockRes.status).toHaveBeenCalledWith(201);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, message: 'Karma event created' }),
    );
  });

  it('POST /event returns 404 when merchant event not found', async () => {
    const mockReq = {
      body: { merchantEventId: 'event-nonexistent' },
      merchantId: 'merchant-123',
    } as any;
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as any;

    mockEventFindOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });

    const handler = (karmaRouter as any).stack.find(
      (layer: any) => layer.route?.path === '/event' && layer.route?.methods?.post,
    );
    await handler.route.stack[0].handle(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(404);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, message: 'Merchant event not found' }),
    );
  });

  it('POST /event requires merchantEventId', async () => {
    const mockReq = { body: {}, merchantId: 'merchant-123' } as any;
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as any;

    const handler = (karmaRouter as any).stack.find(
      (layer: any) => layer.route?.path === '/event' && layer.route?.methods?.post,
    );
    await handler.route.stack[0].handle(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, message: 'merchantEventId is required' }),
    );
  });

  // ── POST /api/karma/event/:id/volunteers/:bookingId/approve ───────────────

  it('POST /event/:id/volunteers/:bookingId/approve approves a booking', async () => {
    const mockKarmaEvent = {
      _id: 'karma-event-1',
      merchantEventId: { toString: () => 'event-123' },
    };
    const mockUpdatedBooking = {
      _id: 'booking-abc',
      ngoApproved: true,
      ngoApprovedAt: new Date(),
      verificationStatus: 'verified',
    };

    mockKarmaEventFindById.mockReturnValue({ lean: jest.fn().mockResolvedValue(mockKarmaEvent) });
    mockBookingFindOneAndUpdate.mockResolvedValue(mockUpdatedBooking);

    const mockReq = {
      params: { id: 'karma-event-1', bookingId: 'booking-abc' },
      merchantId: 'merchant-123',
    } as any;
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as any;

    const handler = (karmaRouter as any).stack.find(
      (layer: any) =>
        layer.route?.path?.includes('/volunteers/') &&
        layer.route?.methods?.post,
    );
    await handler.route.stack[0].handle(mockReq, mockRes);

    expect(mockBookingFindOneAndUpdate).toHaveBeenCalled();
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, message: 'Volunteer approved by NGO' }),
    );
  });

  it('POST /approve returns 404 when booking not found', async () => {
    const mockKarmaEvent = {
      _id: 'karma-event-1',
      merchantEventId: { toString: () => 'event-123' },
    };
    mockKarmaEventFindById.mockReturnValue({ lean: jest.fn().mockResolvedValue(mockKarmaEvent) });
    mockBookingFindOneAndUpdate.mockResolvedValue(null);

    const mockReq = {
      params: { id: 'karma-event-1', bookingId: 'booking-nonexistent' },
      merchantId: 'merchant-123',
    } as any;
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as any;

    const handler = (karmaRouter as any).stack.find(
      (layer: any) =>
        layer.route?.path?.includes('/volunteers/') &&
        layer.route?.methods?.post,
    );
    await handler.route.stack[0].handle(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(404);
  });

  // ── POST /api/karma/event/:id/volunteers/bulk-approve ───────────────────────

  it('POST /event/:id/volunteers/bulk-approve approves multiple bookings', async () => {
    const mockKarmaEvent = {
      _id: 'karma-event-1',
      merchantEventId: { toString: () => 'event-123' },
    };
    mockKarmaEventFindById.mockReturnValue({ lean: jest.fn().mockResolvedValue(mockKarmaEvent) });
    mockBookingUpdateMany.mockResolvedValue({ modifiedCount: 3 });

    const mockReq = {
      params: { id: 'karma-event-1' },
      body: { bookingIds: ['b1', 'b2', 'b3'] },
      merchantId: 'merchant-123',
    } as any;
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as any;

    const handler = (karmaRouter as any).stack.find(
      (layer: any) =>
        layer.route?.path?.includes('/bulk-approve') &&
        layer.route?.methods?.post,
    );
    await handler.route.stack[0].handle(mockReq, mockRes);

    expect(mockBookingUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({ _id: { $in: expect.any(Array) } }),
      expect.objectContaining({ $set: expect.objectContaining({ ngoApproved: true }) }),
    );
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, message: '3 volunteer(s) approved' }),
    );
  });

  it('bulk-approve returns 400 when bookingIds is missing', async () => {
    const mockReq = {
      params: { id: 'karma-event-1' },
      body: {},
      merchantId: 'merchant-123',
    } as any;
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as any;

    const handler = (karmaRouter as any).stack.find(
      (layer: any) =>
        layer.route?.path?.includes('/bulk-approve') &&
        layer.route?.methods?.post,
    );
    await handler.route.stack[0].handle(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, message: 'bookingIds array is required' }),
    );
  });

  // ── GET /api/karma/campaign ─────────────────────────────────────────────────

  it('GET /campaign returns paginated campaigns', async () => {
    const mockCampaigns = [
      { _id: 'c1', name: 'Campaign A' },
      { _id: 'c2', name: 'Campaign B' },
    ];
    mockCampaignFind.mockReturnValue({
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue(mockCampaigns),
    });
    mockCampaignCountDocuments.mockResolvedValue(2);

    const mockReq = {
      query: { page: '1', limit: '20' },
      merchantId: 'merchant-123',
    } as any;
    const mockRes = {
      json: jest.fn(),
    } as any;

    const handler = (karmaRouter as any).stack.find(
      (layer: any) => layer.route?.path === '/campaign' && layer.route?.methods?.get,
    );
    await handler.route.stack[0].handle(mockReq, mockRes);

    expect(mockCampaignFind).toHaveBeenCalled();
    expect(mockCampaignCountDocuments).toHaveBeenCalled();
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({ campaigns: mockCampaigns }),
      }),
    );
  });

  // ── GET /api/karma/event/:id/analytics ──────────────────────────────────────

  it('GET /event/:id/analytics returns event karma stats', async () => {
    const mockKarmaEvent = {
      _id: 'karma-event-1',
      status: 'completed',
      maxVolunteers: 50,
      confirmedVolunteers: 30,
      merchantEventId: { toString: () => 'event-123' },
    };
    const mockStats = [
      {
        totalBookings: 30,
        confirmed: 25,
        ngoApproved: 20,
        checkedIn: 22,
        checkedOut: 20,
        verified: 18,
        totalKarmaEarned: 8000,
      },
    ];

    mockKarmaEventFindById.mockReturnValue({ lean: jest.fn().mockResolvedValue(mockKarmaEvent) });
    mockBookingAggregate.mockResolvedValue(mockStats);

    const mockReq = {
      params: { id: 'karma-event-1' },
      merchantId: 'merchant-123',
    } as any;
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as any;

    const handler = (karmaRouter as any).stack.find(
      (layer: any) => layer.route?.path?.includes('/analytics') && layer.route?.methods?.get,
    );
    await handler.route.stack[0].handle(mockReq, mockRes);

    expect(mockBookingAggregate).toHaveBeenCalled();
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          totalBookings: 30,
          verified: 18,
          totalKarmaEarned: 8000,
        }),
      }),
    );
  });
});
