/**
 * Customer Twin Proxy
 *
 * Proxies /api/customers/* to customer-twin-service (port 4017).
 * See routes/twin.proxy.template.js for the shared pattern.
 */

import { createTwinProxy } from './twin.proxy.template.js';

export default createTwinProxy('customer', {
  port: 4017,
  path: '/api/twins/customer',
});