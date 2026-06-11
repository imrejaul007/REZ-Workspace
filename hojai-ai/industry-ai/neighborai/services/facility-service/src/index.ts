import express, { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = process.env.PORT || 3008;

app.use(express.json());

// In-memory stores
const facilities: Map<string, any> = new Map();
const amenities: Map<string, any> = new Map();
const bookings: Map<string, any> = new Map();

// Initialize amenities
const defaultAmenities = [
  { id: 'pool', name: 'Swimming Pool', category: 'recreation', capacity: 20 },
  { id: 'gym', name: 'Fitness Center', category: 'fitness', capacity: 30 },
  { id: 'clubhouse', name: 'Club House', category: 'social', capacity: 50 },
  { id: 'tennis', name: 'Tennis Court', category: 'sports', capacity: 4 },
  { id: 'parking', name: 'Parking Lot', category: 'utilities', capacity: 100 }
];

defaultAmenities.forEach(a => amenities.set(a.id, a));

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'healthy', service: 'facility-service', timestamp: new Date().toISOString() });
});

// Get all amenities
app.get('/api/amenities', (_req: Request, res: Response) => {
  const amenityList = Array.from(amenities.values());
  res.json({ success: true, count: amenityList.length, data: amenityList });
});

// Add amenity
app.post('/api/amenities', (req: Request, res: Response) => {
  const { name, category, capacity, description } = req.body;

  if (!name) {
    res.status(400).json({ success: false, error: 'name is required' });
    return;
  }

  const amenity = {
    id: uuidv4(),
    name,
    category: category || 'general',
    capacity: capacity || 10,
    description: description || '',
    createdAt: new Date().toISOString()
  };

  amenities.set(amenity.id, amenity);
  res.status(201).json({ success: true, data: amenity });
});

// Get facility by ID
app.get('/api/facilities/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const facility = facilities.get(id);

  if (!facility) {
    res.status(404).json({ success: false, error: 'Facility not found' });
    return;
  }

  res.json({ success: true, data: facility });
});

// Create facility
app.post('/api/facilities', (req: Request, res: Response) => {
  const { name, type, location, capacity, amenities: facilityAmenities } = req.body;

  if (!name || !type) {
    res.status(400).json({ success: false, error: 'name and type are required' });
    return;
  }

  const facility = {
    id: uuidv4(),
    name,
    type,
    location: location || '',
    capacity: capacity || 0,
    amenities: facilityAmenities || [],
    status: 'operational',
    createdAt: new Date().toISOString()
  };

  facilities.set(facility.id, facility);
  res.status(201).json({ success: true, data: facility });
});

// Book amenity
app.post('/api/bookings', (req: Request, res: Response) => {
  const { amenityId, residentId, date, startTime, endTime, purpose } = req.body;

  if (!amenityId || !residentId || !date || !startTime) {
    res.status(400).json({ success: false, error: 'amenityId, residentId, date, and startTime are required' });
    return;
  }

  const amenity = amenities.get(amenityId);
  if (!amenity) {
    res.status(404).json({ success: false, error: 'Amenity not found' });
    return;
  }

  // Check capacity
  const existingBookings = Array.from(bookings.values()).filter((b: any) =>
    b.amenityId === amenityId && b.date === date && b.status === 'confirmed'
  );

  if (existingBookings.length >= amenity.capacity) {
    res.status(400).json({ success: false, error: 'Amenity is fully booked for this date' });
    return;
  }

  const booking = {
    id: uuidv4(),
    amenityId,
    amenityName: amenity.name,
    residentId,
    date,
    startTime,
    endTime: endTime || startTime,
    purpose: purpose || '',
    status: 'confirmed',
    createdAt: new Date().toISOString()
  };

  bookings.set(booking.id, booking);
  res.status(201).json({ success: true, data: booking });
});

// Get bookings
app.get('/api/bookings', (req: Request, res: Response) => {
  const { amenityId, residentId, date, status } = req.query;
  let filtered = Array.from(bookings.values());

  if (amenityId) {
    filtered = filtered.filter((b: any) => b.amenityId === amenityId);
  }
  if (residentId) {
    filtered = filtered.filter((b: any) => b.residentId === residentId);
  }
  if (date) {
    filtered = filtered.filter((b: any) => b.date === date);
  }
  if (status) {
    filtered = filtered.filter((b: any) => b.status === status);
  }

  res.json({ success: true, count: filtered.length, data: filtered });
});

// Cancel booking
app.patch('/api/bookings/:id/cancel', (req: Request, res: Response) => {
  const { id } = req.params;
  const booking = bookings.get(id);

  if (!booking) {
    res.status(404).json({ success: false, error: 'Booking not found' });
    return;
  }

  booking.status = 'cancelled';
  booking.cancelledAt = new Date().toISOString();
  bookings.set(id, booking);

  res.json({ success: true, data: booking });
});

// Get facility usage stats
app.get('/api/stats', (_req: Request, res: Response) => {
  const allBookings = Array.from(bookings.values());

  res.json({
    success: true,
    data: {
      totalBookings: allBookings.length,
      confirmedBookings: allBookings.filter((b: any) => b.status === 'confirmed').length,
      cancelledBookings: allBookings.filter((b: any) => b.status === 'cancelled').length,
      totalAmenities: amenities.size,
      totalFacilities: facilities.size,
      byAmenity: allBookings.reduce((acc: any, b: any) => {
        acc[b.amenityName] = (acc[b.amenityName] || 0) + 1;
        return acc;
      }, {})
    }
  });
});

app.listen(PORT, () => {
  console.log(`Facility Service running on port ${PORT}`);
});

export default app;