/**
 * SUTAR OS - Auth Routes
 */

const express = require('express');
const router = express.Router();

let users = [
  { id: 'USR-001', email: 'admin@rtmn.com', role: 'admin', permissions: ['all'], status: 'active' }
];

router.get('/users', (req, res) => res.json({ users, count: users.length }));
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  res.json({ token: `token-${Date.now()}`, user: users[0] });
});
router.post('/users', (req, res) => {
  const { email, role } = req.body;
  if (!email) return res.status(400).json({ error: 'email required' });
  const newUser = { id: `USR-${Date.now()}`, email, role: role || 'user', permissions: [], status: 'active' };
  users.push(newUser);
  res.status(201).json(newUser);
});

module.exports = router;