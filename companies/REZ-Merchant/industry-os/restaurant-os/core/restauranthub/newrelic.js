'use strict'

/**
 * New Relic agent configuration.
 */
exports.config = {
  app_name: ['RestoPapa'],
  license_key: process.env.NEW_RELIC_LICENSE_KEY || 'your-license-key-here',
  allow_all_headers: true,
  attributes: {
    exclude: [
      'request.headers.cookie',
      'request.headers.authorization',
      'request.headers.proxyAuthorization',
      'request.headers.setCookie*',
      'request.headers.x*',
      'response.headers.cookie',
      'response.headers.authorization',
      'response.headers.proxyAuthorization',
      'response.headers.setCookie*',
      'response.headers.x*'
    ]
  },
  logging: {
    level: 'info',
    filepath: 'stdout'
  },
  error_collector: {
    enabled: true,
    capture_events: true
  },
  transaction_tracer: {
    enabled: true,
    transaction_threshold: 'apdex_f',
    record_sql: 'obfuscated'
  },
  distributed_tracing: {
    enabled: true
  },
  slow_sql: {
    enabled: true
  },
  browser_monitoring: {
    enable: true
  }
}