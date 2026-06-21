/**
 * Kitchen Twin Proxy
 *
 * Proxies /api/kitchen/* to kitchen-twin-service (port 4015).
 * See routes/twin.proxy.template.js for the shared pattern.
 */

import { createTwinProxy } from './twin.proxy.template.js';

export default createTwinProxy('kitchen', {
  port: 4015,
  path: '/api/twins/kitchen',
});