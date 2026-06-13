const express = require('express');
const router = express.Router();

let projects = [
  { id: '1', clientId: '1', consultantId: '1', name: 'Digital Transformation Strategy', status: 'in_progress', budget: 50000 },
  { id: '2', clientId: '2', consultantId: '2', name: 'Marketing Campaign 2024', status: 'completed', budget: 30000 },
  { id: '3', clientId: '3', consultantId: '3', name: 'Security Audit', status: 'in_progress', budget: 45000 },
  { id: '4', clientId: '4', consultantId: '4', name: 'HR Policy Review', status: 'pending', budget: 25000 }
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
    clientId: req.body.clientId,
    consultantId: req.body.consultantId,
    name: req.body.name,
    status: req.body.status || 'pending',
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