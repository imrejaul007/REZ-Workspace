// Health Aggregator
export interface ServiceHealth { healthy: number; degraded: number; unhealthy: number; unknown: number; starting: number; }
export function aggregateHealth(health: Record<string, string>): ServiceHealth {
  const result: ServiceHealth = { healthy: 0, degraded: 0, unhealthy: 0, unknown: 0, starting: 0 };
  Object.values(health).forEach(status => { result[status as keyof ServiceHealth]++; });
  return result;
}
