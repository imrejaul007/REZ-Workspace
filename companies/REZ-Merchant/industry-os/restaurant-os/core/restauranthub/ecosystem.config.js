module.exports = {
  apps: [
    {
      name: 'restopapa-api',
      script: 'dist/apps/api/main.js',
      cwd: './restopapa',
      instances: process.env.PM2_INSTANCES || 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'development',
        API_PORT: 3000,
      },
      env_production: {
        NODE_ENV: 'production',
        API_PORT: 3000,
        API_HOST: '0.0.0.0',
        // Security settings
        ENABLE_CSRF: 'true',
        RATE_LIMIT_WINDOW_MS: 900000, // 15 minutes
        RATE_LIMIT_MAX: 1000,
        AUTH_RATE_LIMIT_MAX: 5,
        LOG_LEVEL: 'info',
        // Session settings
        SESSION_MAX_AGE: 86400000, // 24 hours
      },
      // Performance optimization
      node_args: [
        '--max-old-space-size=2048',
        '--optimize-for-size'
      ],
      // Monitoring
      max_memory_restart: '1G',
      min_uptime: '10s',
      max_restarts: 10,
      // Logging
      log_file: './logs/combined.log',
      out_file: './logs/out.log',
      error_file: './logs/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      // Health monitoring
      health_check_grace_period: 3000,
      health_check_fatal_exceptions: true,
      // Graceful shutdown
      kill_timeout: 5000,
      listen_timeout: 3000,
      // Advanced settings
      source_map_support: true,
      instance_var: 'INSTANCE_ID',
      // Environment specific settings
      watch: false,
      ignore_watch: [
        'node_modules',
        'logs',
        '*.log',
        '.git'
      ],
      // Auto restart on file changes (development only)
      watch_options: {
        usePolling: true,
        interval: 1000
      }
    },
    {
      name: 'restopapa-notification-service',
      script: 'dist/apps/notification-service/main.js',
      cwd: './restopapa',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'development',
        SERVICE_PORT: 3001,
      },
      env_production: {
        NODE_ENV: 'production',
        SERVICE_PORT: 3001,
        LOG_LEVEL: 'info',
      },
      max_memory_restart: '512M',
      min_uptime: '10s',
      max_restarts: 5,
      log_file: './logs/notification-service.log',
      kill_timeout: 5000,
    },
    {
      name: 'restopapa-order-service',
      script: 'dist/apps/order-service/main.js',
      cwd: './restopapa',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'development',
        SERVICE_PORT: 3002,
      },
      env_production: {
        NODE_ENV: 'production',
        SERVICE_PORT: 3002,
        LOG_LEVEL: 'info',
      },
      max_memory_restart: '1G',
      min_uptime: '10s',
      max_restarts: 10,
      log_file: './logs/order-service.log',
      kill_timeout: 5000,
    },
    {
      name: 'restopapa-restaurant-service',
      script: 'dist/apps/restaurant-service/main.js',
      cwd: './restopapa',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'development',
        SERVICE_PORT: 3003,
      },
      env_production: {
        NODE_ENV: 'production',
        SERVICE_PORT: 3003,
        LOG_LEVEL: 'info',
      },
      max_memory_restart: '1G',
      min_uptime: '10s',
      max_restarts: 10,
      log_file: './logs/restaurant-service.log',
      kill_timeout: 5000,
    }
  ],

  // Deployment configuration
  deploy: {
    production: {
      user: 'deploy',
      host: ['production-server-1', 'production-server-2'],
      ref: 'origin/main',
      repo: 'git@github.com:restopapa/restopapa.git',
      path: '/var/www/restopapa',
      'post-deploy': 'npm ci --production && npm run build && pm2 reload ecosystem.config.js --env production && pm2 save',
      'pre-setup': 'apt update && apt install git nodejs npm -y'
    },
    staging: {
      user: 'deploy',
      host: 'staging-server',
      ref: 'origin/develop',
      repo: 'git@github.com:restopapa/restopapa.git',
      path: '/var/www/restopapa-staging',
      'post-deploy': 'npm ci && npm run build && pm2 reload ecosystem.config.js --env staging && pm2 save'
    }
  }
};