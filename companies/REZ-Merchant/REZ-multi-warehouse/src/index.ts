import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [new winston.transports.Console()]
});

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));

// Warehouse Model
const warehouses = new Map();

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'REZ-multi-warehouse' }));

// Warehouse CRUD
app.post('/api/warehouses', (req, res) => {
  const warehouse = { id: Date.now().toString(), ...req.body, createdAt: new Date() };
  warehouses.set(warehouse.id, warehouse);
  res.json({ success: true, data: warehouse });
});

app.get('/api/warehouses', (req, res) => {
  res.json({ success: true, data: Array.from(warehouses.values()) });
});

app.get('/api/warehouses/:id', (req, res) => {
  const warehouse = warehouses.get(req.params.id);
  if (!warehouse) return res.status(404).json({ success: false, error: 'Not found' });
  res.json({ success: true, data: warehouse });
});

app.put('/api/warehouses/:id', (req, res) => {
  const existing = warehouses.get(req.params.id);
  if (!existing) return res.status(404).json({ success: false, error: 'Not found' });
  const updated = { ...existing, ...req.body, updatedAt: new Date() };
  warehouses.set(req.params.id, updated);
  res.json({ success: true, data: updated });
});

app.delete('/api/warehouses/:id', (req, res) => {
  warehouses.delete(req.params.id);
  res.json({ success: true, message: 'Warehouse deleted' });
});

// Inventory Transfer
app.post('/api/transfers', (req, res) => {
  const transfer = { id: Date.now().toString(), ...req.body, status: 'pending', createdAt: new Date() };
  res.json({ success: true, data: transfer });
});

app.get('/api/transfers', (req, res) => res.json({ success: true, data: [] }));
app.get('/api/transfers/:id', (req, res) => res.json({ success: true, data: { id: req.params.id } }));
app.put('/api/transfers/:id/approve', (req, res) => res.json({ success: true, message: 'Transfer approved' }));
app.put('/api/transfers/:id/reject', (req, res) => res.json({ success: true, message: 'Transfer rejected' }));

// Stock operations
app.post('/api/stock/adjust', (req, res) => res.json({ success: true, data: req.body }));
app.get('/api/stock/:warehouseId', (req, res) => res.json({ success: true, data: [] }));

const PORT = process.env.PORT || 4061;
app.listen(PORT, () => logger.info(`REZ-multi-warehouse running on port ${PORT}`));
export default app;
