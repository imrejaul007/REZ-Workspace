import express, { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = process.env.PORT || 3009;

app.use(express.json());

// In-memory stores
const residents: Map<string, any> = new Map();
const leases: Map<string, any> = new Map();
const units: Map<string, any> = new Map();

// Initialize sample units
for (let i = 1; i <= 20; i++) {
  const floor = Math.ceil(i / 4);
  const unitNumber = `${floor}0${(i % 4) || 4}`;
  units.set(`unit-${i}`, {
    id: `unit-${i}`,
    number: unitNumber,
    type: i % 3 === 0 ? 'studio' : i % 3 === 1 ? '1br' : '2br',
    floor,
    bedrooms: i % 3 === 0 ? 0 : i % 3 === 1 ? 1 : 2,
    rent: i % 3 === 0 ? 1200 : i % 3 === 1 ? 1800 : 2400,
    status: 'vacant',
    createdAt: new Date().toISOString()
  });
}

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'healthy', service: 'resident-service', timestamp: new Date().toISOString() });
});

// Get all residents
app.get('/api/residents', (req: Request, res: Response) => {
  const { status, unitId } = req.query;
  let filtered = Array.from(residents.values());

  if (status) {
    filtered = filtered.filter((r: any) => r.status === status);
  }
  if (unitId) {
    filtered = filtered.filter((r: any) => r.unitId === unitId);
  }

  res.json({ success: true, count: filtered.length, data: filtered });
});

// Create resident
app.post('/api/residents', (req: Request, res: Response) => {
  const { name, email, phone, unitId, emergencyContact } = req.body;

  if (!name || !email) {
    res.status(400).json({ success: false, error: 'name and email are required' });
    return;
  }

  const resident = {
    id: uuidv4(),
    name,
    email,
    phone: phone || '',
    unitId: unitId || null,
    emergencyContact: emergencyContact || {},
    status: 'active',
    moveInDate: null,
    createdAt: new Date().toISOString()
  };

  residents.set(resident.id, resident);
  res.status(201).json({ success: true, data: resident });
});

// Get resident by ID
app.get('/api/residents/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const resident = residents.get(id);

  if (!resident) {
    res.status(404).json({ success: false, error: 'Resident not found' });
    return;
  }

  // Include lease info if exists
  const residentLease = Array.from(leases.values()).find((l: any) => l.residentId === id);
  res.json({ success: true, data: { ...resident, lease: residentLease } });
});

// Update resident
app.put('/api/residents/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const resident = residents.get(id);

  if (!resident) {
    res.status(404).json({ success: false, error: 'Resident not found' });
    return;
  }

  const { name, email, phone, emergencyContact } = req.body;
  const updated = {
    ...resident,
    ...(name && { name }),
    ...(email && { email }),
    ...(phone !== undefined && { phone }),
    ...(emergencyContact && { emergencyContact }),
    updatedAt: new Date().toISOString()
  };

  residents.set(id, updated);
  res.json({ success: true, data: updated });
});

// Create lease
app.post('/api/leases', (req: Request, res: Response) => {
  const { residentId, unitId, startDate, endDate, rentAmount, deposit } = req.body;

  if (!residentId || !unitId || !startDate || !endDate) {
    res.status(400).json({ success: false, error: 'residentId, unitId, startDate, and endDate are required' });
    return;
  }

  const resident = residents.get(residentId);
  if (!resident) {
    res.status(404).json({ success: false, error: 'Resident not found' });
    return;
  }

  const unit = units.get(unitId);
  if (!unit) {
    res.status(404).json({ success: false, error: 'Unit not found' });
    return;
  }

  if (unit.status !== 'vacant') {
    res.status(400).json({ success: false, error: 'Unit is not available' });
    return;
  }

  const lease = {
    id: uuidv4(),
    residentId,
    residentName: resident.name,
    unitId,
    unitNumber: unit.number,
    startDate,
    endDate,
    rentAmount: rentAmount || unit.rent,
    deposit: deposit || unit.rent * 2,
    status: 'active',
    createdAt: new Date().toISOString()
  };

  leases.set(lease.id, lease);

  // Update resident
  resident.unitId = unitId;
  resident.moveInDate = startDate;
  resident.status = 'moved_in';
  residents.set(residentId, resident);

  // Update unit
  unit.status = 'occupied';
  units.set(unitId, unit);

  res.status(201).json({ success: true, data: lease });
});

// Get all leases
app.get('/api/leases', (req: Request, res: Response) => {
  const { residentId, unitId, status } = req.query;
  let filtered = Array.from(leases.values());

  if (residentId) {
    filtered = filtered.filter((l: any) => l.residentId === residentId);
  }
  if (unitId) {
    filtered = filtered.filter((l: any) => l.unitId === unitId);
  }
  if (status) {
    filtered = filtered.filter((l: any) => l.status === status);
  }

  res.json({ success: true, count: filtered.length, data: filtered });
});

// End lease
app.patch('/api/leases/:id/end', (req: Request, res: Response) => {
  const { id } = req.params;
  const lease = leases.get(id);

  if (!lease) {
    res.status(404).json({ success: false, error: 'Lease not found' });
    return;
  }

  lease.status = 'ended';
  lease.endDate = new Date().toISOString();
  leases.set(id, lease);

  // Update resident
  const resident = residents.get(lease.residentId);
  if (resident) {
    resident.status = 'moved_out';
    resident.unitId = null;
    residents.set(resident.id, resident);
  }

  // Update unit
  const unit = units.get(lease.unitId);
  if (unit) {
    unit.status = 'vacant';
    units.set(lease.unitId, unit);
  }

  res.json({ success: true, data: lease });
});

// Get units
app.get('/api/units', (req: Request, res: Response) => {
  const { status, type, floor } = req.query;
  let filtered = Array.from(units.values());

  if (status) {
    filtered = filtered.filter((u: any) => u.status === status);
  }
  if (type) {
    filtered = filtered.filter((u: any) => u.type === type);
  }
  if (floor) {
    filtered = filtered.filter((u: any) => u.floor === parseInt(floor as string));
  }

  res.json({ success: true, count: filtered.length, data: filtered });
});

// Get stats
app.get('/api/stats', (_req: Request, res: Response) => {
  const allUnits = Array.from(units.values());
  const activeResident = Array.from(residents.values()).filter((r: any) => r.status === 'moved_in').length;

  res.json({
    success: true,
    data: {
      totalUnits: allUnits.length,
      occupiedUnits: allUnits.filter((u: any) => u.status === 'occupied').length,
      vacantUnits: allUnits.filter((u: any) => u.status === 'vacant').length,
      totalResidents: residents.size,
      activeResidents: activeResident,
      totalLeases: leases.size
    }
  });
});

app.listen(PORT, () => {
  console.log(`Resident Service running on port ${PORT}`);
});

export default app;