/**
 * @rez/shared - Stub package
 * Real implementation would contain shared utilities
 */

// Common types and utilities would go here
export const APP_VERSION = '1.0.0';

export function formatCurrency(amount: number): string {
  return `₹${(amount / 100).toFixed(2)}`;
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-IN');
}


// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'rez-shared',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Liveness probe
app.get('/health/live', (req, res) => {
  res.json({ status: 'alive' });
});

// Readiness probe
app.get('/health/ready', (req, res) => {
  res.json({ status: 'ready' });
});
