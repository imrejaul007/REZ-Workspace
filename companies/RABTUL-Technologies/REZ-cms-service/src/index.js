/**
 * REZ CMS Service - Notion Competitor
 * Content management with database power
 */

import express from 'express';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = process.env.PORT || 4105;

app.use(express.json());

// In-memory storage
const pages = new Map();
const databases = new Map();
const blocks = new Map();

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'REZ CMS', version: '1.0.0' });
});

// === PAGES ===

// Create page
app.post('/api/pages', (req, res) => {
  const { userId, parentId, title, icon, cover, properties } = req.body;

  const page = {
    id: uuidv4(),
    userId,
    parentId: parentId || null,
    title: title || 'Untitled',
    icon: icon || null,
    cover: cover || null,
    properties: properties || {},
    blocks: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  pages.set(page.id, page);
  res.status(201).json(page);
});

// List pages
app.get('/api/pages', (req, res) => {
  const { parentId } = req.query;
  const userId = req.headers['x-user-id'];

  let pageList = Array.from(pages.values())
    .filter(p => !userId || p.userId === userId);

  if (parentId) {
    pageList = pageList.filter(p => p.parentId === parentId);
  }

  res.json({ pages: pageList });
});

// Get page with blocks
app.get('/api/pages/:id', (req, res) => {
  const page = pages.get(req.params.id);
  if (!page) {
    return res.status(404).json({ error: 'Page not found' });
  }

  const pageBlocks = Array.from(blocks.values())
    .filter(b => b.pageId === req.params.id)
    .sort((a, b) => a.order - b.order);

  res.json({ ...page, blocks: pageBlocks });
});

// Update page
app.patch('/api/pages/:id', (req, res) => {
  const page = pages.get(req.params.id);
  if (!page) {
    return res.status(404).json({ error: 'Page not found' });
  }

  const updated = {
    ...page,
    ...req.body,
    id: page.id,
    updatedAt: new Date(),
  };

  pages.set(page.id, updated);
  res.json(updated);
});

// Delete page
app.delete('/api/pages/:id', (req, res) => {
  if (!pages.has(req.params.id)) {
    return res.status(404).json({ error: 'Page not found' });
  }
  pages.delete(req.params.id);
  res.status(204).send();
});

// === BLOCKS ===

// Add block to page
app.post('/api/pages/:id/blocks', (req, res) => {
  const page = pages.get(req.params.id);
  if (!page) {
    return res.status(404).json({ error: 'Page not found' });
  }

  const { type, content, properties } = req.body;

  const block = {
    id: uuidv4(),
    pageId: req.params.id,
    type: type || 'paragraph', // paragraph, heading, image, etc.
    content: content || '',
    properties: properties || {},
    order: page.blocks.length,
    createdAt: new Date(),
  };

  blocks.set(block.id, block);
  res.status(201).json(block);
});

// Update block
app.patch('/api/blocks/:id', (req, res) => {
  const block = blocks.get(req.params.id);
  if (!block) {
    return res.status(404).json({ error: 'Block not found' });
  }

  const updated = {
    ...block,
    ...req.body,
    id: block.id,
  };

  blocks.set(block.id, updated);
  res.json(updated);
});

// Delete block
app.delete('/api/blocks/:id', (req, res) => {
  if (!blocks.has(req.params.id)) {
    return res.status(404).json({ error: 'Block not found' });
  }
  blocks.delete(req.params.id);
  res.status(204).send();
});

// === DATABASES ===

// Create database
app.post('/api/databases', (req, res) => {
  const { userId, name, properties, views } = req.body;

  const database = {
    id: uuidv4(),
    userId,
    name: name || 'Untitled Database',
    properties: properties || [
      { name: 'Name', type: 'title' },
      { name: 'Tags', type: 'multi_select', options: [] },
      { name: 'Status', type: 'select', options: ['To Do', 'In Progress', 'Done'] },
    ],
    views: views || [
      { name: 'Table', type: 'table' },
      { name: 'Board', type: 'kanban' },
    ],
    records: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  databases.set(database.id, database);
  res.status(201).json(database);
});

// List databases
app.get('/api/databases', (req, res) => {
  const userId = req.headers['x-user-id'];
  const userDbs = Array.from(databases.values())
    .filter(db => !userId || db.userId === userId);

  res.json({ databases: userDbs });
});

// Get database
app.get('/api/databases/:id', (req, res) => {
  const database = databases.get(req.params.id);
  if (!database) {
    return res.status(404).json({ error: 'Database not found' });
  }
  res.json(database);
});

// Query database
app.post('/api/databases/:id/query', (req, res) => {
  const database = databases.get(req.params.id);
  if (!database) {
    return res.status(404).json({ error: 'Database not found' });
  }

  let records = [...database.records];

  // Filter by properties
  if (req.body.filter) {
    const { property, operator, value } = req.body.filter;
    records = records.filter(r => {
      const propValue = r.properties?.[property];
      switch (operator) {
        case 'equals': return propValue === value;
        case 'contains': return propValue?.includes(value);
        case 'is_empty': return !propValue;
        case 'is_not_empty': return !!propValue;
        default: return true;
      }
    });
  }

  // Sort
  if (req.body.sort) {
    const { property, direction } = req.body.sort;
    records.sort((a, b) => {
      const aVal = a.properties?.[property] || '';
      const bVal = b.properties?.[property] || '';
      return direction === 'ascending' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    });
  }

  res.json({ records });
});

// Add record to database
app.post('/api/databases/:id/records', (req, res) => {
  const database = databases.get(req.params.id);
  if (!database) {
    return res.status(404).json({ error: 'Database not found' });
  }

  const record = {
    id: uuidv4(),
    properties: req.body.properties || {},
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  database.records.push(record);
  database.updatedAt = new Date();
  databases.set(database.id, database);

  res.status(201).json(record);
});

app.listen(PORT, () => {
  console.log(`✅ REZ CMS running on port ${PORT}`);
});

export default app;