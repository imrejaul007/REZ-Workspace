/**
 * Staff Twin Proxy
 *
 * Proxies /api/staff/* to staff-twin-service (port 4018).
 * See routes/twin.proxy.template.js for the shared pattern.
 */

import { createTwinProxy } from './twin.proxy.template.js';

export default createTwinProxy('staff', {
  port: 4018,
  path: '/api/twins/staff',
});