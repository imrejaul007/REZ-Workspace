/**
 * TalentOS API - Port 4000
 * Main Express server with all routes
 */

import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

// In-memory data store
const employees: Map<string, any> = new Map();
const departments: Map<string, any> = new Map();

// Sample data
departments.set('eng', { id: 'eng', name: 'Engineering', headcount: 27 });
departments.set('sales', { id: 'sales', name: 'Sales', headcount: 8 });

employees.set('emp_1', {
  id: 'emp_1',
  name: 'Priya Sharma',
  email: 'priya@acme.com',
  department: 'Engineering',
  designation: 'Senior Engineer',
  joinDate: '2024-03-15',
  status: 'active',
});

// Health check
app.get('/health', (_, res) => {
  res.json({
    status: 'ok',
    service: 'TalentOS',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// Employees
app.get('/api/employees', (_, res) => {
  res.json({ employees: Array.from(employees.values()) });
});

app.get('/api/employees/:id', (req, res) => {
  const emp = employees.get(req.params.id);
  if (!emp) return res.status(404).json({ error: 'Employee not found' });
  res.json({ employee: emp });
});

app.post('/api/employees', (req, res) => {
  const { name, email, department, designation } = req.body;
  const id = `emp_${Date.now()}`;
  const employee = { id, name, email, department, designation, status: 'active' };
  employees.set(id, employee);
  res.json({ employee });
});

// Departments
app.get('/api/departments', (_, res) => {
  res.json({ departments: Array.from(departments.values()) });
});

// Dashboard
app.get('/api/dashboard', (_, res) => {
  res.json({
    headcount: employees.size,
    departments: departments.size,
    openPositions: 5,
    pendingLeave: 3,
  });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => logger.info(`TalentOS running on port ${PORT}`));
