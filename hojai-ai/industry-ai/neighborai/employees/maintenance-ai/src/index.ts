import express, { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = process.env.PORT || 3022;

app.use(express.json());

// In-memory stores
const requests: Map<string, any> = new Map();
const technicians: Map<string, any> = new Map();
const categories: Map<string, any> = new Map();

// Initialize maintenance categories
const defaultCategories = [
  { id: 'plumbing', name: 'Plumbing', color: '#2196F3' },
  { id: 'electrical', name: 'Electrical', color: '#FF9800' },
  { id: 'hvac', name: 'HVAC', color: '#9C27B0' },
  { id: 'appliance', name: 'Appliance', color: '#4CAF50' },
  { id: 'structural', name: 'Structural', color: '#795548' },
  { id: 'general', name: 'General', color: '#9E9E9E' }
];

defaultCategories.forEach(c => categories.set(c.id, c));

// Initialize sample technicians
const sampleTechnicians = [
  { id: 'tech-1', name: 'John Smith', specialties: ['plumbing', 'general'], phone: '555-0101', available: true },
  { id: 'tech-2', name: 'Jane Doe', specialties: ['electrical', 'hvac'], phone: '555-0102', available: true },
  { id: 'tech-3', name: 'Mike Johnson', specialties: ['appliance', 'general'], phone: '555-0103', available: false }
];

sampleTechnicians.forEach(t => technicians.set(t.id, t));

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'healthy', service: 'maintenance-ai', timestamp: new Date().toISOString() });
});

// Get all categories
app.get('/api/categories', (_req: Request, res: Response) => {
  const categoryList = Array.from(categories.values());
  res.json({ success: true, count: categoryList.length, data: categoryList });
});

// Get all technicians
app.get('/api/technicians', (req: Request, res: Response) => {
  const { available, specialty } = req.query;
  let filtered = Array.from(technicians.values());

  if (available === 'true') {
    filtered = filtered.filter((t: any) => t.available);
  }
  if (specialty) {
    filtered = filtered.filter((t: any) => t.specialties.includes(specialty));
  }

  res.json({ success: true, count: filtered.length, data: filtered });
});

// Create maintenance request
app.post('/api/requests', (req: Request, res: Response) => {
  const { residentId, unitId, category, priority, title, description, preferredDate, photos } = req.body;

  if (!residentId || !title || !category) {
    res.status(400).json({ success: false, error: 'residentId, title, and category are required' });
    return;
  }

  const request = {
    id: uuidv4(),
    residentId,
    unitId: unitId || null,
    category,
    categoryName: categories.get(category)?.name || category,
    priority: priority || 'normal',
    title,
    description: description || '',
    preferredDate: preferredDate || null,
    photos: photos || [],
    status: 'submitted',
    assignedTo: null,
    scheduledDate: null,
    completedDate: null,
    rating: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  requests.set(request.id, request);
  res.status(201).json({ success: true, data: request });
});

// Get all requests
app.get('/api/requests', (req: Request, res: Response) => {
  const { status, category, priority, residentId } = req.query;
  let filtered = Array.from(requests.values());

  if (status) {
    filtered = filtered.filter((r: any) => r.status === status);
  }
  if (category) {
    filtered = filtered.filter((r: any) => r.category === category);
  }
  if (priority) {
    filtered = filtered.filter((r: any) => r.priority === priority);
  }
  if (residentId) {
    filtered = filtered.filter((r: any) => r.residentId === residentId);
  }

  // Sort by priority and createdAt
  const priorityOrder = { urgent: 0, high: 1, normal: 2, low: 3 };
  filtered.sort((a: any, b: any) => {
    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (priorityDiff !== 0) return priorityDiff;
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });

  res.json({ success: true, count: filtered.length, data: filtered });
});

// Get request by ID
app.get('/api/requests/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const request = requests.get(id);

  if (!request) {
    res.status(404).json({ success: false, error: 'Request not found' });
    return;
  }

  res.json({ success: true, data: request });
});

// Assign technician to request
app.patch('/api/requests/:id/assign', (req: Request, res: Response) => {
  const { id } = req.params;
  const { technicianId, scheduledDate } = req.body;

  if (!technicianId) {
    res.status(400).json({ success: false, error: 'technicianId is required' });
    return;
  }

  const request = requests.get(id);
  if (!request) {
    res.status(404).json({ success: false, error: 'Request not found' });
    return;
  }

  const technician = technicians.get(technicianId);
  if (!technician) {
    res.status(404).json({ success: false, error: 'Technician not found' });
    return;
  }

  request.assignedTo = technicianId;
  request.assignedTechName = technician.name;
  request.scheduledDate = scheduledDate || null;
  request.status = 'assigned';
  request.updatedAt = new Date().toISOString();
  requests.set(id, request);

  // Mark technician as unavailable
  technician.available = false;
  technicians.set(technicianId, technician);

  res.json({ success: true, data: request });
});

// Update request status
app.patch('/api/requests/:id/status', (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, notes } = req.body;

  if (!status) {
    res.status(400).json({ success: false, error: 'status is required' });
    return;
  }

  const request = requests.get(id);
  if (!request) {
    res.status(404).json({ success: false, error: 'Request not found' });
    return;
  }

  request.status = status;
  if (notes) {
    request.notes = request.notes || [];
    request.notes.push({ text: notes, timestamp: new Date().toISOString() });
  }

  if (status === 'completed') {
    request.completedDate = new Date().toISOString();
    // Free up technician
    if (request.assignedTo) {
      const tech = technicians.get(request.assignedTo);
      if (tech) {
        tech.available = true;
        technicians.set(request.assignedTo, tech);
      }
    }
  }

  request.updatedAt = new Date().toISOString();
  requests.set(id, request);

  res.json({ success: true, data: request });
});

// Rate completed request
app.patch('/api/requests/:id/rate', (req: Request, res: Response) => {
  const { id } = req.params;
  const { rating, feedback } = req.body;

  if (rating === undefined || rating < 1 || rating > 5) {
    res.status(400).json({ success: false, error: 'rating must be between 1 and 5' });
    return;
  }

  const request = requests.get(id);
  if (!request) {
    res.status(404).json({ success: false, error: 'Request not found' });
    return;
  }

  if (request.status !== 'completed') {
    res.status(400).json({ success: false, error: 'Can only rate completed requests' });
    return;
  }

  request.rating = rating;
  request.feedback = feedback || '';
  request.updatedAt = new Date().toISOString();
  requests.set(id, request);

  res.json({ success: true, data: request });
});

// Get maintenance stats
app.get('/api/stats', (_req: Request, res: Response) => {
  const allRequests = Array.from(requests.values());
  const completed = allRequests.filter((r: any) => r.status === 'completed');

  res.json({
    success: true,
    data: {
      totalRequests: allRequests.length,
      byStatus: allRequests.reduce((acc: any, r: any) => {
        acc[r.status] = (acc[r.status] || 0) + 1;
        return acc;
      }, {}),
      byCategory: allRequests.reduce((acc: any, r: any) => {
        acc[r.categoryName] = (acc[r.categoryName] || 0) + 1;
        return acc;
      }, {}),
      avgRating: completed.length > 0
        ? completed.reduce((sum: number, r: any) => sum + (r.rating || 0), 0) / completed.filter((r: any) => r.rating).length || 0
        : 0,
      totalTechnicians: technicians.size,
      availableTechnicians: Array.from(technicians.values()).filter((t: any) => t.available).length
    }
  });
});

app.listen(PORT, () => {
  console.log(`Maintenance AI service running on port ${PORT}`);
});

export default app;