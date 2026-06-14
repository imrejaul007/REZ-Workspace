// Distributed Tracer
import { v4 as uuidv4 } from 'uuid';
export interface Trace { id: string; timestamp: string; duration: number; status: number; }
const traces: Map<string, Trace[]> = new Map();
export function startTrace(serviceId: string): string {
  const id = uuidv4();
  if (!traces.has(serviceId)) traces.set(serviceId, []);
  traces.get(serviceId)!.push({ id, timestamp: new Date().toISOString(), duration: 0, status: 200 });
  return id;
}
export function endTrace(serviceId: string, traceId: string, duration: number, status: number): void {
  const serviceTraces = traces.get(serviceId);
  if (serviceTraces) {
    const trace = serviceTraces.find(t => t.id === traceId);
    if (trace) { trace.duration = duration; trace.status = status; }
  }
}
