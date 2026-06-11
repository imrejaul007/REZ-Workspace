import express, { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = process.env.PORT || 3020;

app.use(express.json());

// In-memory stores
const visitors: Map<string, any> = new Map();
const visitLogs: Map<string, any> = new Map();
const accessPasses: Map<string, any> = new Map();

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'healthy', service: 'visitor-ai', timestamp: new Date().toISOString() });
});

// Register visitor
app.post('/api/visitors', (req: Request, res: Response) => {
  const { name, email, phone, idType, idNumber, address } = req.body;

  if (!name) {
    res.status(400).json({ success: false, error: 'name is required' });
    return;
  }

  const visitor = {
    id: uuidv4(),
    name,
    email: email || '',
    phone: phone || '',
    idType: idType || 'national_id',
    idNumber: idNumber || '',
    address: address || '',
    status: 'registered',
    visitCount: 0,
    createdAt: new Date().toISOString()
  };

  visitors.set(visitor.id, visitor);
  res.status(201).json({ success: true, data: visitor });
});

// Get all visitors
app.get('/api/visitors', (req: Request, res: Response) => {
  const { status } = req.query;
  let filtered = Array.from(visitors.values());

  if (status) {
    filtered = filtered.filter((v: any) => v.status === status);
  }

  res.json({ success: true, count: filtered.length, data: filtered });
});

// Get visitor by ID
app.get('/api/visitors/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const visitor = visitors.get(id);

  if (!visitor) {
    res.status(404).json({ success: false, error: 'Visitor not found' });
    return;
  }

  // Get visit history
  const visits = Array.from(visitLogs.values()).filter((v: any) => v.visitorId === id);
  res.json({ success: true, data: { ...visitor, visits } });
});

// Check in visitor
app.post('/api/visits/checkin', (req: Request, res: Response) => {
  const { visitorId, hostResidentId, purpose, vehiclePlate } = req.body;

  if (!visitorId || !hostResidentId) {
    res.status(400).json({ success: false, error: 'visitorId and hostResidentId are required' });
    return;
  }

  const visitor = visitors.get(visitorId);
  if (!visitor) {
    res.status(404).json({ success: false, error: 'Visitor not found' });
    return;
  }

  const visit = {
    id: uuidv4(),
    visitorId,
    visitorName: visitor.name,
    hostResidentId,
    purpose: purpose || 'general',
    vehiclePlate: vehiclePlate || '',
    checkInTime: new Date().toISOString(),
    checkOutTime: null,
    status: 'checked_in',
    createdAt: new Date().toISOString()
  };

  visitLogs.set(visit.id, visit);

  // Update visitor stats
  visitor.visitCount += 1;
  visitor.lastVisit = new Date().toISOString();
  visitors.set(visitorId, visitor);

  // Generate access pass
  const accessPass = {
    id: uuidv4(),
    visitId: visit.id,
    visitorId,
    code: `PASS-${Date.now().toString(36).toUpperCase()}`,
    validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    status: 'active'
  };

  accessPasses.set(accessPass.id, accessPass);

  res.status(201).json({ success: true, data: { visit, accessPass } });
});

// Check out visitor
app.post('/api/visits/:id/checkout', (req: Request, res: Response) => {
  const { id } = req.params;
  const visit = visitLogs.get(id);

  if (!visit) {
    res.status(404).json({ success: false, error: 'Visit not found' });
    return;
  }

  if (visit.status === 'checked_out') {
    res.status(400).json({ success: false, error: 'Visitor already checked out' });
    return;
  }

  visit.checkOutTime = new Date().toISOString();
  visit.status = 'checked_out';
  visitLogs.set(id, visit);

  // Deactivate access pass
  const pass = Array.from(accessPasses.values()).find((p: any) => p.visitId === id);
  if (pass) {
    pass.status = 'used';
    accessPasses.set(pass.id, pass);
  }

  res.json({ success: true, data: visit });
});

// Get active visits
app.get('/api/visits/active', (_req: Request, res: Response) => {
  const active = Array.from(visitLogs.values()).filter((v: any) => v.status === 'checked_in');
  res.json({ success: true, count: active.length, data: active });
});

// Get visit history
app.get('/api/visits', (req: Request, res: Response) => {
  const { visitorId, hostResidentId, startDate, endDate } = req.query;
  let filtered = Array.from(visitLogs.values());

  if (visitorId) {
    filtered = filtered.filter((v: any) => v.visitorId === visitorId);
  }
  if (hostResidentId) {
    filtered = filtered.filter((v: any) => v.hostResidentId === hostResidentId);
  }
  if (startDate) {
    filtered = filtered.filter((v: any) => new Date(v.checkInTime) >= new Date(startDate as string));
  }
  if (endDate) {
    filtered = filtered.filter((v: any) => new Date(v.checkInTime) <= new Date(endDate as string));
  }

  res.json({ success: true, count: filtered.length, data: filtered });
});

// Validate access pass
app.get('/api/access-passes/validate/:code', (req: Request, res: Response) => {
  const { code } = req.params;
  const pass = Array.from(accessPasses.values()).find((p: any) => p.code === code);

  if (!pass) {
    res.status(404).json({ success: false, error: 'Access pass not found' });
    return;
  }

  const isValid = pass.status === 'active' && new Date(pass.validUntil) > new Date();

  res.json({
    success: true,
    data: {
      valid: isValid,
      passId: pass.id,
      visitorId: pass.visitorId,
      validUntil: pass.validUntil,
      status: pass.status
    }
  });
});

// Get visitor stats
app.get('/api/stats', (_req: Request, res: Response) => {
  const allVisits = Array.from(visitLogs.values());
  const activeVisits = allVisits.filter((v: any) => v.status === 'checked_in').length;
  const today = new Date().toISOString().split('T')[0];
  const todayVisits = allVisits.filter((v: any) => v.checkInTime.startsWith(today)).length;

  res.json({
    success: true,
    data: {
      totalVisitors: visitors.size,
      totalVisits: allVisits.length,
      activeVisits,
      todayVisits,
      byPurpose: allVisits.reduce((acc: any, v: any) => {
        acc[v.purpose] = (acc[v.purpose] || 0) + 1;
        return acc;
      }, {})
    }
  });
});

app.listen(PORT, () => {
  console.log(`Visitor AI service running on port ${PORT}`);
});

export default app;