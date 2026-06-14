const express = require('express');
const router = express.Router();

let projects = [
  { id: '1', name: 'Skyline Tower', client: 'ABC Corp', status: 'in_progress', startDate: '2024-01-01', endDate: '2024-12-31', budget: 5000000 },
  { id: '2', name: 'Residential Complex A', client: 'XYZ Developers', status: 'planning', startDate: '2024-06-01', endDate: '2025-06-30', budget: 8000000 },
  { id: '3', name: 'Shopping Mall', client: 'Retail Group', status: 'completed', startDate: '2023-01-01', endDate: '2024-03-31', budget: 12000000 },
  { id: '4', name: 'Office Building', client: 'Tech Inc', status: 'in_progress', startDate: '2024-03-01', endDate: '2024-09-30', budget: 3500000 }
];

// GET all projects
router.get('/', (req, res) => {
  res.json(projects);
});

// GET single project
router.get('/:id', (req, res) => {
  const project = projects.find(p => p.id === req.params.id);
  if (!project) return res.status(404).json({ error: 'Project not found' });
  res.json(project);
});

// POST new project
router.post('/', (req, res) => {
  const newProject = {
    id: String(projects.length + 1),
    name: req.body.name,
    client: req.body.client,
    status: req.body.status || 'planning',
    startDate: req.body.startDate,
    endDate: req.body.endDate,
    budget: req.body.budget || 0
  };
  projects.push(newProject);
  res.status(201).json(newProject);
});

// PUT update project
router.put('/:id', (req, res) => {
  const index = projects.findIndex(p => p.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Project not found' });
  projects[index] = { ...projects[index], ...req.body };
  res.json(projects[index]);
});

// DELETE project
router.delete('/:id', (req, res) => {
  const index = projects.findIndex(p => p.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Project not found' });
  projects.splice(index, 1);
  res.json({ message: 'Project deleted successfully' });
});

module.exports = router;