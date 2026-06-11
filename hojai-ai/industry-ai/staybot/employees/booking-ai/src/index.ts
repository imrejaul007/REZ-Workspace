import express, { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = process.env.PORT || 3012;

app.use(express.json());

// In-memory stores
const reservations: Map<string, any> = new Map();
const rooms: Map<string, any> = new Map();

// Initialize rooms
const roomTypes = [
  { id: 'standard', name: 'Standard Room', capacity: 2, rate: 100 },
  { id: 'deluxe', name: 'Deluxe Room', capacity: 2, rate: 150 },
  { id: 'suite', name: 'Suite', capacity: 4, rate: 250 },
  { id: 'penthouse', name: 'Penthouse', capacity: 6, rate: 500 }
];

for (let i = 1; i <= 50; i++) {
  const type = roomTypes[(i - 1) % 4];
  rooms.set(`room-${i}`, {
    id: `room-${i}`,
    number: i,
    type: type.id,
    typeName: type.name,
    rate: type.rate,
    floor: Math.ceil(i / 10),
    status: 'available',
    amenities: ['wifi', 'tv', 'ac']
  });
}

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'healthy', service: 'booking-ai', timestamp: new Date().toISOString() });
});

// Get all rooms
app.get('/api/rooms', (req: Request, res: Response) => {
  const { status, type, floor } = req.query;
  let filtered = Array.from(rooms.values());

  if (status) {
    filtered = filtered.filter((r: any) => r.status === status);
  }
  if (type) {
    filtered = filtered.filter((r: any) => r.type === type);
  }
  if (floor) {
    filtered = filtered.filter((r: any) => r.floor === parseInt(floor as string));
  }

  res.json({ success: true, count: filtered.length, data: filtered });
});

// Check room availability
app.get('/api/rooms/availability', (req: Request, res: Response) => {
  const { checkInDate, checkOutDate, roomType } = req.query;

  if (!checkInDate || !checkOutDate) {
    res.status(400).json({ success: false, error: 'checkInDate and checkOutDate are required' });
    return;
  }

  const checkIn = new Date(checkInDate as string);
  const checkOut = new Date(checkOutDate as string);

  if (checkOut <= checkIn) {
    res.status(400).json({ success: false, error: 'checkOutDate must be after checkInDate' });
    return;
  }

  // Simple availability check (would need more complex logic in production)
  const availableRooms = Array.from(rooms.values()).filter((r: any) => {
    if (roomType && r.type !== roomType) return false;
    if (r.status !== 'available') return false;
    // Check for conflicting reservations
    const conflicts = Array.from(reservations.values()).filter((res: any) => {
      if (res.roomId !== r.id || res.status === 'cancelled') return false;
      const resCheckIn = new Date(res.checkInDate);
      const resCheckOut = new Date(res.checkOutDate);
      return (checkIn < resCheckOut && checkOut > resCheckIn);
    });
    return conflicts.length === 0;
  });

  res.json({ success: true, count: availableRooms.length, rooms: availableRooms });
});

// Create reservation
app.post('/api/reservations', (req: Request, res: Response) => {
  const { guestName, guestEmail, guestPhone, roomId, checkInDate, checkOutDate, adults, children, specialRequests } = req.body;

  if (!guestName || !roomId || !checkInDate || !checkOutDate) {
    res.status(400).json({ success: false, error: 'guestName, roomId, checkInDate, and checkOutDate are required' });
    return;
  }

  const room = rooms.get(roomId);
  if (!room) {
    res.status(404).json({ success: false, error: 'Room not found' });
    return;
  }

  const checkIn = new Date(checkInDate);
  const checkOut = new Date(checkOutDate);
  const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));

  if (nights <= 0) {
    res.status(400).json({ success: false, error: 'Invalid date range' });
    return;
  }

  const reservation = {
    id: uuidv4(),
    guestName,
    guestEmail: guestEmail || '',
    guestPhone: guestPhone || '',
    roomId,
    roomNumber: room.number,
    roomType: room.type,
    checkInDate: checkIn.toISOString(),
    checkOutDate: checkOut.toISOString(),
    nights,
    adults: adults || 1,
    children: children || 0,
    totalAmount: room.rate * nights,
    status: 'confirmed',
    specialRequests: specialRequests || '',
    createdAt: new Date().toISOString()
  };

  reservations.set(reservation.id, reservation);

  // Mark room as booked
  room.status = 'booked';
  rooms.set(roomId, room);

  res.status(201).json({ success: true, data: reservation });
});

// Get all reservations
app.get('/api/reservations', (req: Request, res: Response) => {
  const { status, roomId, startDate, endDate } = req.query;
  let filtered = Array.from(reservations.values());

  if (status) {
    filtered = filtered.filter((r: any) => r.status === status);
  }
  if (roomId) {
    filtered = filtered.filter((r: any) => r.roomId === roomId);
  }
  if (startDate) {
    filtered = filtered.filter((r: any) => new Date(r.checkInDate) >= new Date(startDate as string));
  }
  if (endDate) {
    filtered = filtered.filter((r: any) => new Date(r.checkOutDate) <= new Date(endDate as string));
  }

  res.json({ success: true, count: filtered.length, data: filtered });
});

// Get reservation by ID
app.get('/api/reservations/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const reservation = reservations.get(id);

  if (!reservation) {
    res.status(404).json({ success: false, error: 'Reservation not found' });
    return;
  }

  res.json({ success: true, data: reservation });
});

// Cancel reservation
app.patch('/api/reservations/:id/cancel', (req: Request, res: Response) => {
  const { id } = req.params;
  const reservation = reservations.get(id);

  if (!reservation) {
    res.status(404).json({ success: false, error: 'Reservation not found' });
    return;
  }

  reservation.status = 'cancelled';
  reservation.cancelledAt = new Date().toISOString();
  reservations.set(id, reservation);

  // Release the room
  const room = rooms.get(reservation.roomId);
  if (room) {
    room.status = 'available';
    rooms.set(reservation.roomId, room);
  }

  res.json({ success: true, data: reservation });
});

// Modify reservation
app.patch('/api/reservations/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const reservation = reservations.get(id);

  if (!reservation) {
    res.status(404).json({ success: false, error: 'Reservation not found' });
    return;
  }

  const { checkInDate, checkOutDate, specialRequests } = req.body;

  if (checkInDate || checkOutDate) {
    const newCheckIn = checkInDate ? new Date(checkInDate) : new Date(reservation.checkInDate);
    const newCheckOut = checkOutDate ? new Date(checkOutDate) : new Date(reservation.checkOutDate);
    const nights = Math.ceil((newCheckOut.getTime() - newCheckIn.getTime()) / (1000 * 60 * 60 * 24));

    reservation.checkInDate = newCheckIn.toISOString();
    reservation.checkOutDate = newCheckOut.toISOString();
    reservation.nights = nights;

    const room = rooms.get(reservation.roomId);
    if (room) {
      reservation.totalAmount = room.rate * nights;
    }
  }

  if (specialRequests !== undefined) {
    reservation.specialRequests = specialRequests;
  }

  reservation.updatedAt = new Date().toISOString();
  reservations.set(id, reservation);

  res.json({ success: true, data: reservation });
});

app.listen(PORT, () => {
  console.log(`Booking AI service running on port ${PORT}`);
});

export default app;