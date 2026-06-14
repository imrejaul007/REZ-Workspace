export type CircuitState = 'closed' | 'open' | 'halfOpen';
export class CircuitBreaker { private state: CircuitState = 'closed'; isOpen() { return this.state === 'open'; } }
