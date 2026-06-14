// Types
export * from './types';

// Components
export { default as BarcodeScanner } from './components/BarcodeScanner';
export { default as ProductLookup } from './components/ProductLookup';
export { default as QuickAdd } from './components/QuickAdd';
export { default as ScanHistory } from './components/ScanHistory';

// Pages
export { default as SelfCheckout } from './pages/SelfCheckout';
export { default as InventoryScan } from './pages/InventoryScan';
export { default as ProductLookupPage } from './pages/ProductLookup';

// Hooks
export { default as useBarcodeScanner } from './hooks/useBarcodeScanner';

// Services
export * from './services/api';

// Utils
export * from './utils/formats';


// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'rez-barcode-scanner-ui',
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
