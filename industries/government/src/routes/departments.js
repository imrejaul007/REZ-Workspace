const express = require('express');
const router = express.Router();

let departments = [
  { id: '1', name: 'Vital Records', minister: 'Dr. A. Gupta', staff: 45, services: ['birth certificate', 'death certificate', 'marriage certificate'] },
  { id: '2', name: 'External Affairs', minister: 'S. Verma', staff: 120, services: ['passport', 'visa', 'consular'] },
  { id: '3', name: 'Revenue', minister: 'P. Patel', staff: 250, services: ['tax filing', 'GST', 'customs'] },
  { id: '4', name: 'Transport', minister: 'M. Reddy', staff: 80, services: ['driving license', 'vehicle registration', 'road permits'] }
];

// GET all departments
router.get('/', (req, res) => {
  res.json(departments);
});

// GET single department
router.get('/:id', (req, res) => {
  const department = departments.find(d => d.id === req.params.id);
  if (!department) return res.status(404).json({ error: 'Department not found' });
  res.json(department);
});

// POST new department
router.post('/', (req, res) => {
  const newDepartment = {
    id: String(departments.length + 1),
    name: req.body.name,
    minister: req.body.minister,
    staff: req.body.staff || 0,
    services: req.body.services || []
  };
  departments.push(newDepartment);
  res.status(201).json(newDepartment);
});

// PUT update department
router.put('/:id', (req, res) => {
  const index = departments.findIndex(d => d.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Department not found' });
  departments[index] = { ...departments[index], ...req.body };
  res.json(departments[index]);
});

// DELETE department
router.delete('/:id', (req, res) => {
  const index = departments.findIndex(d => d.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Department not found' });
  departments.splice(index, 1);
  res.json({ message: 'Department deleted successfully' });
});

module.exports = router;