import express, { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = process.env.PORT || 3011;

app.use(express.json());

// In-memory stores
const guests: Map<string, any> = new Map();
const checkIns: Map<string, any> = new Map();
const checkOuts: Map<string, any> = new Map();

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'healthy', service: 'frontdesk-ai', timestamp: new Date().toISOString() });
});

// Get all guests
app.get('/api/guests', (req: Request, res: Response) => {
  const { status, roomNumber } = req.query;
  let filtered = Array.from(guests.values());

  if (status) {
    filtered = filtered.filter((g: any) => g.status === status);
  }
  if (roomNumber) {
    filtered = filtered.filter((g: any) => g.roomNumber === roomNumber);
  }

  res.json({ success: true, count: filtered.length, data: filtered });
});

// Register a guest
app.post('/api/guests', (req: Request, res: Response) => {
  const { name, email, phone, idType, idNumber, preferences } = req.body;

  if (!name || !email) {
    res.status(400).json({ success: false, error: 'name and email are required' });
    return;
  }

  const guest = {
    id: uuidv4(),
    name,
    email,
    phone: phone || '',
    idType: idType || 'passport',
    idNumber: idNumber || '',
    preferences: preferences || {},
    status: 'registered',
    createdAt: new Date().toISOString()
  };

  guests.set(guest.id, guest);
  res.status(201).json({ success: true, data: guest });
});

// Get guest by ID
app.get('/api/guests/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const guest = guests.get(id);

  if (!guest) {
    res.status(404).json({ success: false, error: 'Guest not found' });
    return;
  }

  res.json({ success: true, data: guest });
});

// Check in a guest
app.post('/api/checkins', (req: Request, res: Response) => {
  const { guestId, roomNumber, checkInDate, checkOutDate, paymentMethod } = req.body;

  if (!guestId || !roomNumber) {
    res.status(400).json({ success: false, error: 'guestId and roomNumber are required' });
    return;
  }

  const guest = guests.get(guestId);
  if (!guest) {
    res.status(404).json({ success: false, error: 'Guest not found' });
    return;
  }

  const checkIn = {
    id: uuidv4(),
    guestId,
    guestName: guest.name,
    roomNumber,
    checkInDate: checkInDate || new Date().toISOString(),
    checkOutDate: checkOutDate || null,
    paymentMethod: paymentMethod || 'credit_card',
    status: 'checked_in',
    createdAt: new Date().toISOString()
  };

  checkIns.set(checkIn.id, checkIn);

  guest.status = 'checked_in';
  guest.roomNumber = roomNumber;
  guest.checkInId = checkIn.id;
  guests.set(guestId, guest);

  res.status(201).json({ success: true, data: checkIn });
});

// Get active check-ins
app.get('/api/checkins/active', (_req: Request, res: Response) => {
  const active = Array.from(checkIns.values()).filter((c: any) => c.status === 'checked_in');
  res.json({ success: true, count: active.length, data: active });
});

// Check out a guest
app.post('/api/checkouts', (req: Request, res: Response) => {
  const { checkInId, paymentDetails, feedback } = req.body;

  if (!checkInId) {
    res.status(400).json({ success: false, error: 'checkInId is required' });
    return;
  }

  const checkIn = checkIns.get(checkInId);
  if (!checkIn) {
    res.status(404).json({ success: false, error: 'Check-in record not found' });
    return;
  }

  const guest = guests.get(checkIn.guestId);
  if (guest) {
    guest.status = 'checked_out';
    guest.roomNumber = null;
    guests.set(guest.id, guest);
  }

  const checkOut = {
    id: uuidv4(),
    checkInId,
    guestId: checkIn.guestId,
    guestName: checkIn.guestName,
    roomNumber: checkIn.roomNumber,
    checkInDate: checkIn.checkInDate,
    checkOutDate: new Date().toISOString(),
    paymentDetails: paymentDetails || {},
    feedback: feedback || '',
    createdAt: new Date().toISOString()
  };

  checkOuts.set(checkOut.id, checkOut);

  checkIn.status = 'checked_out';
  checkIn.checkOutId = checkOut.id;
  checkIns.set(checkInId, checkIn);

  res.status(201).json({ success: true, data: checkOut });
});

// Get frontdesk stats
app.get('/api/stats', (_req: Request, res: Response) => {
  const activeCheckIns = Array.from(checkIns.values()).filter((c: any) => c.status === 'checked_in');
  const totalGuests = guests.size;

  res.json({
    success: true,
    data: {
      totalGuests,
      currentlyCheckedIn: activeCheckIns.length,
      totalCheckIns: checkIns.size,
      totalCheckOuts: checkOuts.size
    }
  });
});

// Update guest
app.put('/api/guests/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const guest = guests.get(id);

  if (!guest) {
    res.status(404).json({ success: false, error: 'Guest not found' });
    return;
  }

  const { name, email, phone, preferences } = req.body;
  const updated = {
    ...guest,
    ...(name && { name }),
    ...(email && { email }),
    ...(phone !== undefined && { phone }),
    ...(preferences && { preferences }),
    updatedAt: new Date().toISOString()
  };

  guests.set(id, updated);
  res.json({ success: true, data: updated });
});

app.listen(PORT, () => {
  console.log(`Front Desk AI service running on port ${PORT}`);
});

export default app;