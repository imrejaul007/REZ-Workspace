// REZ Gift Card Service

const express = require('express');
const app = express();

app.use(express.json());

const giftCards = new Map();
const transactions = new Map();

// Create gift card
app.post('/api/gift-cards', (req, res) => {
  const { amount, recipientEmail, recipientPhone, message } = req.body;
  const cardId = 'GC' + Date.now().toString(36).toUpperCase();
  const code = generateCode();

  const card = {
    cardId,
    code,
    amount,
    balance: amount,
    recipientEmail,
    recipientPhone,
    message,
    status: 'active',
    createdAt: new Date()
  };

  giftCards.set(cardId, card);

  res.json({ success: true, cardId, code });
});

// Get gift card by code
app.get('/api/gift-cards/:code', (req, res) => {
  const { code } = req.params;

  let card = null;
  giftCards.forEach(c => {
    if (c.code === code) card = c;
  });

  if (!card) {
    return res.status(404).json({ error: 'Gift card not found' });
  }

  res.json(card);
});

// Redeem gift card
app.post('/api/gift-cards/:cardId/redeem', (req, res) => {
  const { cardId } = req.params;
  const { amount, orderId } = req.body;

  const card = giftCards.get(cardId);
  if (!card) {
    return res.status(404).json({ error: 'Gift card not found' });
  }

  if (card.balance < amount) {
    return res.status(400).json({ error: 'Insufficient balance' });
  }

  card.balance -= amount;

  if (card.balance === 0) {
    card.status = 'redeemed';
  }

  // Record transaction
  const txId = 'TX' + Date.now();
  transactions.set(txId, {
    txId,
    cardId,
    type: 'debit',
    amount,
    orderId,
    createdAt: new Date()
  });

  res.json({ success: true, newBalance: card.balance });
});

// Add balance to gift card
app.post('/api/gift-cards/:cardId/add', (req, res) => {
  const { cardId } = req.params;
  const { amount } = req.body;

  const card = giftCards.get(cardId);
  if (!card) {
    return res.status(404).json({ error: 'Gift card not found' });
  }

  card.amount += amount;
  card.balance += amount;

  res.json({ success: true, newBalance: card.balance });
});

// Get transactions
app.get('/api/gift-cards/:cardId/transactions', (req, res) => {
  const { cardId } = req.params;
  const txs = [];

  transactions.forEach(tx => {
    if (tx.cardId === cardId) txs.push(tx);
  });

  res.json({ transactions: txs });
});

// Check balance
app.get('/api/gift-cards/:cardId/balance', (req, res) => {
  const { cardId } = req.params;
  const card = giftCards.get(cardId);

  if (!card) {
    return res.status(404).json({ error: 'Gift card not found' });
  }

  res.json({ cardId, balance: card.balance, status: card.status });
});

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 16; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
    if ((i + 1) % 4 === 0 && i < 15) code += '-';
  }
  return code;
}

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'gift-card' }));

const PORT = process.env.PORT || 4005;
app.listen(PORT, () => console.log(`Gift Card Service on ${PORT}`));

module.exports = app;
