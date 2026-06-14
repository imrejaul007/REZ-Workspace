module.exports = {
  apps: [
    {
      name: 'restopapa-api',
      script: './dist/main.js',
      instances: process.env.PM2_INSTANCES || 'max',
      exec_mode: 'cluster',
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      env_staging: {
        NODE_ENV: 'staging',
        PORT: 3000,
      },
      log_file: './logs/combined.log',
      out_file: './logs/out.log',
      error_file: './logs/error.log',
      merge_logs: true,
      time: true,
      max_restarts: 10,
      min_uptime: '10s',
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000,
      shutdown_with_message: true,
      source_map_support: false,
      instance_var: 'INSTANCE_ID',
    },
  ],

  deploy: {
    production: {
      user: 'deploy',
      host: ['production-server.com'],
      ref: 'origin/main',
      repo: 'git@github.com:username/restopapa.git',
      path: '/var/www/restopapa-api',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env production',
      'pre-setup': 'apt update && apt install git -y',
    },
    staging: {
      user: 'deploy',
      host: ['staging-server.com'],
      ref: 'origin/develop',
      repo: 'git@github.com:username/restopapa.git',
      path: '/var/www/restopapa-api-staging',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env staging',
    },
  },
};