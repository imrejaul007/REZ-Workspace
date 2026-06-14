// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'payment-service',
    timestamp: new Date().toISOString()
  });
});
