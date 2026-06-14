const express = require('express');
const router = express.Router();

let qualityRecords = [
  { id: '1', productId: '1', batchId: 'B001', inspected: 100, passed: 98, failed: 2, defects: ['surface scratch', 'dimension error'], date: '2024-06-10' },
  { id: '2', productId: '2', batchId: 'B002', inspected: 500, passed: 495, failed: 5, defects: ['material flaw'], date: '2024-06-11' },
  { id: '3', productId: '3', batchId: 'B003', inspected: 50, passed: 50, failed: 0, defects: [], date: '2024-06-12' }
];

// GET all quality records
router.get('/', (req, res) => {
  res.json(qualityRecords);
});

// GET single quality record
router.get('/:id', (req, res) => {
  const record = qualityRecords.find(q => q.id === req.params.id);
  if (!record) return res.status(404).json({ error: 'Quality record not found' });
  res.json(record);
});

// POST new quality record
router.post('/', (req, res) => {
  const newRecord = {
    id: String(qualityRecords.length + 1),
    productId: req.body.productId,
    batchId: req.body.batchId,
    inspected: req.body.inspected,
    passed: req.body.passed,
    failed: req.body.failed,
    defects: req.body.defects || [],
    date: new Date().toISOString().split('T')[0]
  };
  qualityRecords.push(newRecord);
  res.status(201).json(newRecord);
});

// PUT update quality record
router.put('/:id', (req, res) => {
  const index = qualityRecords.findIndex(q => q.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Quality record not found' });
  qualityRecords[index] = { ...qualityRecords[index], ...req.body };
  res.json(qualityRecords[index]);
});

// DELETE quality record
router.delete('/:id', (req, res) => {
  const index = qualityRecords.findIndex(q => q.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Quality record not found' });
  qualityRecords.splice(index, 1);
  res.json({ message: 'Quality record deleted successfully' });
});

module.exports = router;