import express from 'express';
import cors from 'cors';
import { ChainAnalyticsService } from './services/chain-analytics.service';
import { CrossPropertyService } from './services/cross-property.service';
import { GroupBookingService } from './services/group-booking.service';

const app = express();
const PORT = 4046;

app.use(cors());
app.use(express.json());

const analyticsService = new ChainAnalyticsService();
const crossPropertyService = new CrossPropertyService();
const groupBookingService = new GroupBookingService();

// ============ CHAIN ANALYTICS ============
app.post('/api/chain/performance', async (req, res) => {
  try {
    const { chainId, properties, startDate, endDate } = req.body;

    const performance = await analyticsService.getChainPerformance(
      chainId,
      properties,
      new Date(startDate),
      new Date(endDate)
    );

    res.json({ success: true, performance });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get chain performance' });
  }
});

app.get('/api/property/:propertyId/metrics', async (req, res) => {
  try {
    const { propertyId } = req.params;
    const { name, date } = req.query;

    const metrics = await analyticsService.getPropertyMetrics(
      propertyId,
      name as string || 'Property',
      date ? new Date(date as string) : new Date()
    );

    res.json({ success: true, metrics });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get property metrics' });
  }
});

app.post('/api/compare', async (req, res) => {
  try {
    const { propertyIds, properties, metric, period } = req.body;

    const propertiesMap = new Map(properties.map((p: any) => [p.propertyId, p]));

    const comparison = await analyticsService.compareProperties(
      propertyIds,
      propertiesMap,
      metric,
      { start: new Date(period.start), end: new Date(period.end) }
    );

    res.json({ success: true, comparison });
  } catch (error) {
    res.status(500).json({ error: 'Failed to compare properties' });
  }
});

app.get('/api/property/:propertyId/forecast', async (req, res) => {
  try {
    const { propertyId } = req.params;
    const { days } = req.query;

    const forecast = await analyticsService.getRevenueForecast(propertyId, parseInt(days as string) || 30);
    res.json({ success: true, forecast });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get forecast' });
  }
});

// ============ CROSS-PROPERTY BOOKING ============
app.post('/api/booking/inquiry', async (req, res) => {
  try {
    const { guestName, email, phone, preferences } = req.body;

    const inquiry = await crossPropertyService.createBookingInquiry(guestName, email, phone, preferences);
    res.json({ success: true, inquiry });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create inquiry' });
  }
});

app.post('/api/booking/availability', async (req, res) => {
  try {
    const { propertyIds, checkIn, checkOut, guests, roomType } = req.body;

    const availability = await crossPropertyService.checkMultiPropertyAvailability(
      propertyIds,
      new Date(checkIn),
      new Date(checkOut),
      guests,
      roomType
    );

    res.json({ success: true, availability });
  } catch (error) {
    res.status(500).json({ error: 'Failed to check availability' });
  }
});

app.post('/api/booking/quote', async (req, res) => {
  try {
    const { propertyIds, checkIn, checkOut, roomCount, guests } = req.body;

    const quotes = await crossPropertyService.getMultiPropertyQuote(
      propertyIds,
      new Date(checkIn),
      new Date(checkOut),
      roomCount,
      guests
    );

    res.json({ success: true, quotes });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get quotes' });
  }
});

app.post('/api/booking/reserve', async (req, res) => {
  try {
    const { inquiryId, propertyId, roomTypeId, paymentMethod } = req.body;

    const reservation = await crossPropertyService.reserveRoom(
      inquiryId,
      propertyId,
      roomTypeId,
      paymentMethod
    );

    res.json({ success: true, reservation });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ============ GROUP BOOKING ============
app.post('/api/group/booking', async (req, res) => {
  try {
    const { groupName, organizerName, email, phone, properties, checkIn, checkOut, roomCount, notes } = req.body;

    const booking = await groupBookingService.createGroupBooking(
      groupName,
      organizerName,
      email,
      phone,
      properties,
      new Date(checkIn),
      new Date(checkOut),
      roomCount,
      notes
    );

    res.json({ success: true, booking });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create group booking' });
  }
});

app.get('/api/group/:groupId', async (req, res) => {
  try {
    const { groupId } = req.params;
    const booking = await groupBookingService.getGroupBooking(groupId);

    if (!booking) {
      return res.status(404).json({ error: 'Group booking not found' });
    }

    res.json({ success: true, booking });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get group booking' });
  }
});

app.get('/api/group/:groupId/quote', async (req, res) => {
  try {
    const { groupId } = req.params;
    const quote = await groupBookingService.getGroupQuote(groupId);
    res.json({ success: true, quote });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get quote' });
  }
});

app.post('/api/group/:groupId/confirm', async (req, res) => {
  try {
    const { groupId } = req.params;
    const { paymentDetails } = req.body;

    const confirmation = await groupBookingService.confirmGroupBooking(groupId, paymentDetails);
    res.json({ success: true, confirmation });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/group/:groupId/amendments', async (req, res) => {
  try {
    const { groupId } = req.params;
    const { type, details } = req.body;

    const amendment = await groupBookingService.requestAmendment(groupId, type, details);
    res.json({ success: true, amendment });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/group/:groupId/attendees', async (req, res) => {
  try {
    const { groupId } = req.params;
    const attendees = await groupBookingService.getAttendees(groupId);
    res.json({ success: true, attendees });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get attendees' });
  }
});

app.post('/api/group/:groupId/attendees', async (req, res) => {
  try {
    const { groupId } = req.params;
    const attendee = await groupBookingService.addAttendee(groupId, req.body);
    res.json({ success: true, attendee });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add attendee' });
  }
});

// ============ DASHBOARD DATA ============
app.get('/api/dashboard/:chainId/summary', async (req, res) => {
  try {
    const { chainId } = req.params;

    const summary = {
      totalProperties: 12,
      totalRooms: 1250,
      occupancyRate: 72.5,
      revPAR: 3850,
      totalRevenue: 4850000,
      avgRating: 4.3,
      pendingBookings: 45,
      activeComplaints: 8,
    };

    res.json({ success: true, summary });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get dashboard summary' });
  }
});

app.get('/api/dashboard/:chainId/realtime', async (req, res) => {
  try {
    const { chainId } = req.params;

    // Mock real-time data
    const properties = ['Hotel Alpha', 'Hotel Beta', 'Hotel Gamma', 'Hotel Delta', 'Hotel Epsilon'];
    const realTime = properties.map((name, i) => ({
      propertyId: `prop-${i + 1}`,
      propertyName: name,
      currentOccupancy: 60 + Math.floor(Math.random() * 30),
      arrivals: Math.floor(Math.random() * 15),
      departures: Math.floor(Math.random() * 12),
      inHouse: Math.floor(Math.random() * 50),
      dueOut: Math.floor(Math.random() * 10),
      availableToday: Math.floor(Math.random() * 20),
      pendingTasks: Math.floor(Math.random() * 8),
    }));

    res.json({ success: true, properties: realTime });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get real-time data' });
  }
});

// ============ HEALTH CHECK ============
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'rez-multi-property-dashboard',
    port: PORT,
    version: '1.0.0',
  });
});

app.listen(PORT, () => {
  console.log(`📊 Multi-Property Dashboard service running on port ${PORT}`);
});

export default app;
