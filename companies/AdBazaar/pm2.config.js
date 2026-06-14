/**
 * AdBazaar PM2 Configuration
 * Usage: pm2 start pm2.config.js --env production
 */

module.exports = {
  apps: [
    // Core Services
    {
      name: 'rez-ads-service',
      script: 'dist/index.js',
      cwd: './REZ-ads-service',
      instances: 2,
      exec_mode: 'cluster',
      env_production: { NODE_ENV: 'production', PORT: 4007 },
      max_memory_restart: '500M',
      autorestart: true,
      watch: false,
    },
    {
      name: 'adbazaar-backend',
      script: 'dist/index.js',
      cwd: './adBazaar-backend',
      instances: 2,
      exec_mode: 'cluster',
      env_production: { NODE_ENV: 'production', PORT: 4085 },
      max_memory_restart: '500M',
      autorestart: true,
    },
    {
      name: 'rez-marketing',
      script: 'dist/index.js',
      cwd: './REZ-marketing',
      env_production: { NODE_ENV: 'production', PORT: 4000 },
      max_memory_restart: '500M',
    },
    {
      name: 'rez-dooh-service',
      script: 'dist/index.js',
      cwd: './REZ-dooh-service',
      env_production: { NODE_ENV: 'production', PORT: 4018 },
      max_memory_restart: '500M',
    },

    // Intent Exchange
    {
      name: 'intent-signal',
      script: 'dist/index.js',
      cwd: './intent-signal-aggregator',
      env_production: { NODE_ENV: 'production', PORT: 4800 },
    },
    {
      name: 'intent-prediction',
      script: 'dist/index.js',
      cwd: './intent-prediction-engine',
      env_production: { NODE_ENV: 'production', PORT: 4801 },
    },
    {
      name: 'intent-marketplace',
      script: 'dist/index.js',
      cwd: './intent-marketplace',
      env_production: { NODE_ENV: 'production', PORT: 4802 },
    },
    {
      name: 'intent-attribution',
      script: 'dist/index.js',
      cwd: './intent-attribution',
      env_production: { NODE_ENV: 'production', PORT: 4803 },
    },

    // AI Services
    {
      name: 'adbazaar-hojai-gateway',
      script: 'dist/index.js',
      cwd: './adbazaar-hojai-gateway',
      env_production: { NODE_ENV: 'production', PORT: 4870 },
      max_memory_restart: '1G',
    },
    {
      name: 'adbazaar-marketing-agent',
      script: 'dist/index.js',
      cwd: './adbazaar-marketing-agent',
      env_production: { NODE_ENV: 'production', PORT: 4965 },
      max_memory_restart: '1G',
    },
  ],
};
