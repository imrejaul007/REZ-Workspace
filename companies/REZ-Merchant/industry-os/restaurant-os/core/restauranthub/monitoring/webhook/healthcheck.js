import logger from './utils/logger';

const http = require('http');

const options = {
  hostname: 'localhost',
  port: process.env.WEBHOOK_PORT || 9999,
  path: '/health',
  method: 'GET',
  timeout: 5000
};

const req = http.request(options, (res) => {
  if (res.statusCode === 200) {
    logger.info('Health check passed');
    process.exit(0);
  } else {
    logger.info(`Health check failed with status: ${res.statusCode}`);
    process.exit(1);
  }
});

req.on('error', (err) => {
  logger.info(`Health check failed: ${err.message}`);
  process.exit(1);
});

req.on('timeout', () => {
  logger.info('Health check timed out');
  req.destroy();
  process.exit(1);
});

req.end();