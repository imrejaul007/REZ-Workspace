/**
 * Business Copilot OS - Memory Routes
 */

const express = require('express');
const router = express.Router();

let memories = [
  { id: 'MEM-001', type: 'context', content: 'Q1 sales exceeded target by 15%', tags: ['sales', 'q1'], createdAt: '2024-01-15' },
  { id: 'MEM-002', type: 'insight', content: 'Customer satisfaction improved after new feature launch', tags: ['customer', 'product'], createdAt: '2024-01-14' }
];

router.get('/', (req, res) => {
  const { type, tag } = req.query;
  let filtered = [...memories];
  if (type) filtered = filtered.filter(m => m.type === type);
  if (tag) filtered = filtered.filter(m => m.tags.includes(tag));
  res.json({ memories: filtered, count: filtered.length });
});

router.post('/', (req, res) => {
  const { type, content, tags } = req.body;
  if (!type || !content) return res.status(400).json({ error: 'type and content required' });
  const newMemory = { id: `MEM-${Date.now()}`, type, content, tags: tags || [], createdAt: new Date().toISOString() };
  memories.push(newMemory);
  res.status(201).json(newMemory);
});

router.get('/search', (req, res) => {
  const { q } = req.query;
  if (!q) return res.status(400).json({ error: 'query required' });
  const results = memories.filter(m => m.content.toLowerCase().includes(q.toLowerCase()));
  res.json({ results, count: results.length });
});

module.exports = router;