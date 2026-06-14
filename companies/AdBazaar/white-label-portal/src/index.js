const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const brandRoutes = require('./routes/brandRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const reportRoutes = require('./routes/reportRoutes');
const clientRoutes = require('./routes/clientRoutes');

const app = express();
const PORT = process.env.PORT || 5012;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'white-label-portal',
    port: PORT,
    timestamp: new Date().toISOString()
  });
});

// Routes
app.use('/api/brands', brandRoutes);
app.use('/api/dashboards', dashboardRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/clients', clientRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'White Label Portal',
    version: '1.0.0',
    description: 'Branded dashboards for agency clients',
    endpoints: {
      health: 'GET /health',
      brands: 'GET /api/brands',
      dashboards: 'GET /api/dashboards',
      reports: 'GET /api/reports',
      clients: 'GET /api/clients'
    }
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    service: 'white-label-portal'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    service: 'white-label-portal'
  });
});

app.listen(PORT, () => {
  console.log(`White Label Portal Service running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});

module.exports = app;
