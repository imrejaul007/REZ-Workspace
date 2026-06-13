/**
 * Menu Routes
 */

import { Router } from 'express';

export const menuRoutes = Router();

const menuItems = new Map([
  ['MENU-001', {
    id: 'MENU-001',
    name: 'Butter Chicken',
    category: 'Main Course',
    price: 320,
    cost: 120,
    prepTime: 15,
    calories: 450,
    dietary: 'non-veg',
    ingredients: ['chicken', 'tomato', 'cream', 'spices'],
    allergens: ['dairy'],
    available: true,
    popularity: 95
  }],
  ['MENU-002', {
    id: 'MENU-002',
    name: 'Chicken Biryani',
    category: 'Rice',
    price: 280,
    cost: 90,
    prepTime: 20,
    calories: 520,
    dietary: 'non-veg',
    ingredients: ['chicken', 'basmati rice', 'spices', 'saffron'],
    allergens: [],
    available: true,
    popularity: 92
  }],
  ['MENU-003', {
    id: 'MENU-003',
    name: 'Garlic Naan',
    category: 'Bread',
    price: 60,
    cost: 15,
    prepTime: 8,
    calories: 180,
    dietary: 'veg',
    ingredients: ['flour', 'garlic', 'butter'],
    allergens: ['gluten', 'dairy'],
    available: true,
    popularity: 98
  }],
  ['MENU-004', {
    id: 'MENU-004',
    name: 'Paneer Tikka',
    category: 'Starter',
    price: 250,
    cost: 85,
    prepTime: 12,
    calories: 320,
    dietary: 'veg',
    ingredients: ['paneer', 'yogurt', 'spices', 'bell pepper'],
    allergens: ['dairy'],
    available: true,
    popularity: 88
  }],
  ['MENU-005', {
    id: 'MENU-005',
    name: 'Dal Tadka',
    category: 'Main Course',
    price: 180,
    cost: 45,
    prepTime: 10,
    calories: 220,
    dietary: 'veg',
    ingredients: ['dal', 'onion', 'tomato', 'spices'],
    allergens: [],
    available: true,
    popularity: 75
  }]
]);

// Get all menu items
menuRoutes.get('/', (req, res) => {
  const { category, dietary, available } = req.query;
  let items = Array.from(menuItems.values());

  if (category) items = items.filter(i => i.category === category);
  if (dietary) items = items.filter(i => i.dietary === dietary);
  if (available !== undefined) items = items.filter(i => i.available === (available === 'true'));

  res.json({ items, total: items.length });
});

// Get single item
menuRoutes.get('/:id', (req, res) => {
  const item = menuItems.get(req.params.id);
  if (!item) return res.status(404).json({ error: 'Menu item not found' });
  res.json(item);
});

// Create menu item
menuRoutes.post('/', (req, res) => {
  const id = `MENU-${String(menuItems.size + 1).padStart(3, '0')}`;
  const item = { id, ...req.body, createdAt: new Date().toISOString() };
  menuItems.set(id, item);
  res.status(201).json(item);
});

// Update menu item
menuRoutes.patch('/:id', (req, res) => {
  const item = menuItems.get(req.params.id);
  if (!item) return res.status(404).json({ error: 'Menu item not found' });
  const updated = { ...item, ...req.body, updatedAt: new Date().toISOString() };
  menuItems.set(req.params.id, updated);
  res.json(updated);
});

// Toggle availability
menuRoutes.patch('/:id/availability', (req, res) => {
  const item = menuItems.get(req.params.id);
  if (!item) return res.status(404).json({ error: 'Menu item not found' });
  item.available = !item.available;
  item.updatedAt = new Date().toISOString();
  res.json(item);
});

// Get categories
menuRoutes.get('/meta/categories', (req, res) => {
  const categories = [...new Set(Array.from(menuItems.values()).map(i => i.category))];
  res.json({ categories });
});

// Search menu
menuRoutes.post('/search', (req, res) => {
  const { query, dietary, maxPrice } = req.body;
  let items = Array.from(menuItems.values());

  if (query) {
    const q = query.toLowerCase();
    items = items.filter(i =>
      i.name.toLowerCase().includes(q) ||
      i.category.toLowerCase().includes(q)
    );
  }
  if (dietary) items = items.filter(i => i.dietary === dietary);
  if (maxPrice) items = items.filter(i => i.price <= maxPrice);

  res.json({ items, total: items.length });
});
