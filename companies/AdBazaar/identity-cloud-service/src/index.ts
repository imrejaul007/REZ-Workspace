/**
 * Identity Cloud Service
 * User identity and authentication service
 */
import express from 'express';

const app = express();
const PORT = process.env.PORT || 4100;

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'identity-cloud-service' });
});

app.get('/healthz', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Identity endpoints
app.post('/api/identity/resolve', (req, res) => {
  res.json({ success: true, identities: [] });
});

app.listen(PORT, () => {
  console.log(`Identity Cloud Service running on port ${PORT}`);
});

export default app;
