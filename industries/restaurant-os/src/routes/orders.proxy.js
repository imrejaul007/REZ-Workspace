/**
 * Orders Twin Proxy
 *
 * Proxies /api/orders/* to order-twin-service. The service is
 * scaffolded (port 4014 reserved) but the index.ts entry is missing
 * in this snapshot — we still wire the orchestrator side so the
 * route is ready when the service comes online.
 *
 * If the service is not running, the proxy returns 503 with
 * ORDER_TWIN_UNREACHABLE.
 */

import { createTwinProxy } from './twin.proxy.template.js';

export default createTwinProxy('order', {
  port: 4014,
  path: '/api/twins/order',
});