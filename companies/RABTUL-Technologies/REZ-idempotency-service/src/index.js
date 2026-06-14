const express = require('express');
const app = express();
app.use(express.json());

const store = new Map();

app.post('/check', (req, res) => {
  const { idempotencyKey } = req.body;
  if (store.has(idempotencyKey)) {
    return res.status(200).json(store.get(idempotencyKey));
  }
  return res.status(404).json({ exists: false });
});

app.post('/store', (req, res) => {
  const { idempotencyKey, response, statusCode } = req.body;
  store.set(idempotencyKey, { response, statusCode });
  return res.json({ stored: true });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', records: store.size });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Idempotency running on', PORT));
