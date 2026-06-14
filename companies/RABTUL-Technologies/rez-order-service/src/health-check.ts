// Add to src/index.ts or src/server.ts:

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'order-service', timestamp: new Date().toISOString() });
});
