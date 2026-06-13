/**
 * Legal OS - Legal Research Routes
 */

const express = require('express');
const router = express.Router();

// In-memory research storage
let searches = [
  {
    id: 'search-001',
    query: 'contract breach remedies',
    category: 'case_law',
    results: 156,
    filters: { jurisdiction: 'federal', dateRange: '5years' },
    performedBy: 'attorney-001',
    createdAt: new Date().toISOString()
  }
];

// GET /api/research - List all searches
router.get('/', (req, res) => {
  const { category } = req.query;
  let filtered = [...searches];

  if (category) filtered = filtered.filter(s => s.category === category);

  res.json({ searches: filtered, count: filtered.length });
});

// GET /api/research/:id - Get search by ID
router.get('/:id', (req, res) => {
  const search = searches.find(s => s.id === req.params.id);
  if (!search) return res.status(404).json({ error: 'Search not found' });
  res.json(search);
});

// POST /api/research - Perform new search
router.post('/', (req, res) => {
  const { query, category, filters } = req.body;

  if (!query) {
    return res.status(400).json({ error: 'query is required' });
  }

  const newSearch = {
    id: `search-${Date.now()}`,
    query,
    category: category || 'general',
    results: Math.floor(Math.random() * 500) + 10, // Simulated results count
    filters: filters || {},
    performedBy: req.body.performedBy || 'system',
    createdAt: new Date().toISOString()
  };

  searches.push(newSearch);
  res.status(201).json(newSearch);
});

// DELETE /api/research/:id - Delete search
router.delete('/:id', (req, res) => {
  const index = searches.findIndex(s => s.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Search not found' });

  searches.splice(index, 1);
  res.json({ message: 'Search deleted successfully' });
});

// GET /api/research/precedents - Get relevant precedents
router.get('/precedents/list', (req, res) => {
  const { topic } = req.query;

  res.json({
    precedents: [
      {
        id: 'prec-001',
        case: 'Smith v. Jones (2019)',
        topic: topic || 'contract disputes',
        citation: '123 F.3d 456',
        outcome: 'favorable',
        relevance: 'high'
      },
      {
        id: 'prec-002',
        case: 'Doe v. Corporation (2020)',
        topic: topic || 'corporate liability',
        citation: '456 F.4th 789',
        outcome: 'mixed',
        relevance: 'medium'
      }
    ]
  });
});

module.exports = router;