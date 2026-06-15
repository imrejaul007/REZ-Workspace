export const serviceRegistry = { list: () => [], register: () => 'ok' };
export const circuitBreaker = { getState: () => 'closed' };
export const healthAggregator = { getHealth: () => ({ healthy: 0 }) };
