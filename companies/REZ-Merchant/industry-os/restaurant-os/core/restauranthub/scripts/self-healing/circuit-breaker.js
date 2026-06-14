/**
 * RestoPapa Circuit Breaker Implementation
 * AI Sentry - Intelligent Failure Detection and Prevention
 */

const EventEmitter = require('events');
const winston = require('winston');

class CircuitBreaker extends EventEmitter {
    constructor(options = {}) {
        super();

        // Configuration
        this.name = options.name || 'unnamed';
        this.failureThreshold = options.failureThreshold || 5;
        this.recoveryTimeout = options.recoveryTimeout || 60000; // 1 minute
        this.monitoringTimeout = options.monitoringTimeout || 30000; // 30 seconds
        this.halfOpenMaxCalls = options.halfOpenMaxCalls || 3;
        this.volumeThreshold = options.volumeThreshold || 10;
        this.errorPercentageThreshold = options.errorPercentageThreshold || 50;
        this.timeWindow = options.timeWindow || 60000; // 1 minute

        // State
        this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
        this.failureCount = 0;
        this.successCount = 0;
        this.nextAttempt = Date.now();
        this.halfOpenCallCount = 0;

        // Metrics tracking
        this.metrics = {
            totalCalls: 0,
            successfulCalls: 0,
            failedCalls: 0,
            timeouts: 0,
            shortCircuits: 0,
            lastFailureTime: null,
            lastSuccessTime: null,
            stateTransitions: {},
            callsInTimeWindow: []
        };

        // Initialize state transition counters
        this.metrics.stateTransitions = {
            'CLOSED_TO_OPEN': 0,
            'OPEN_TO_HALF_OPEN': 0,
            'HALF_OPEN_TO_CLOSED': 0,
            'HALF_OPEN_TO_OPEN': 0
        };

        // Logger
        this.logger = winston.createLogger({
            level: 'info',
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.errors({ stack: true }),
                winston.format.json()
            ),
            defaultMeta: {
                service: 'circuit-breaker',
                name: this.name
            },
            transports: [
                new winston.transports.File({ filename: 'circuit-breaker.log' }),
                new winston.transports.Console()
            ]
        });

        // Cleanup old metrics periodically
        setInterval(() => this.cleanupOldMetrics(), 10000);

        this.logger.info('Circuit breaker initialized', {
            name: this.name,
            config: {
                failureThreshold: this.failureThreshold,
                recoveryTimeout: this.recoveryTimeout,
                volumeThreshold: this.volumeThreshold,
                errorPercentageThreshold: this.errorPercentageThreshold
            }
        });
    }

    /**
     * Execute a function with circuit breaker protection
     */
    async execute(fn, fallback = null) {
        const callStart = Date.now();
        this.metrics.totalCalls++;

        // Add call to time window tracking
        this.metrics.callsInTimeWindow.push({
            timestamp: callStart,
            success: null // Will be updated later
        });

        // Check circuit state
        if (this.state === 'OPEN') {
            if (Date.now() < this.nextAttempt) {
                this.metrics.shortCircuits++;
                this.logger.warn('Circuit breaker is OPEN, call short-circuited', {
                    nextAttempt: new Date(this.nextAttempt).toISOString()
                });

                if (fallback) {
                    this.emit('fallback', { name: this.name, reason: 'circuit_open' });
                    return await this.executeFallback(fallback);
                }

                const error = new Error(`Circuit breaker ${this.name} is OPEN`);
                error.code = 'CIRCUIT_BREAKER_OPEN';
                throw error;
            } else {
                // Transition to half-open
                this.transitionTo('HALF_OPEN');
                this.halfOpenCallCount = 0;
            }
        }

        if (this.state === 'HALF_OPEN') {
            if (this.halfOpenCallCount >= this.halfOpenMaxCalls) {
                this.metrics.shortCircuits++;
                this.logger.warn('Circuit breaker is HALF_OPEN with max calls reached', {
                    halfOpenCallCount: this.halfOpenCallCount
                });

                if (fallback) {
                    this.emit('fallback', { name: this.name, reason: 'half_open_limit' });
                    return await this.executeFallback(fallback);
                }

                const error = new Error(`Circuit breaker ${this.name} is HALF_OPEN with max calls reached`);
                error.code = 'CIRCUIT_BREAKER_HALF_OPEN_LIMIT';
                throw error;
            }
            this.halfOpenCallCount++;
        }

        try {
            // Execute the function
            const result = await fn();

            // Record success
            this.onSuccess(callStart);

            return result;

        } catch (error) {
            // Record failure
            this.onFailure(error, callStart);

            // Use fallback if available
            if (fallback) {
                this.emit('fallback', { name: this.name, reason: 'execution_failure', error: error.message });
                return await this.executeFallback(fallback);
            }

            throw error;
        }
    }

    /**
     * Handle successful execution
     */
    onSuccess(callStart) {
        const duration = Date.now() - callStart;
        this.metrics.successfulCalls++;
        this.metrics.lastSuccessTime = Date.now();

        // Update call tracking
        const recentCall = this.metrics.callsInTimeWindow
            .find(call => call.timestamp === callStart);
        if (recentCall) {
            recentCall.success = true;
            recentCall.duration = duration;
        }

        this.logger.debug('Circuit breaker call succeeded', {
            duration,
            state: this.state
        });

        if (this.state === 'HALF_OPEN') {
            this.successCount++;

            // If we've had enough successful calls, close the circuit
            if (this.successCount >= this.halfOpenMaxCalls) {
                this.transitionTo('CLOSED');
            }
        } else if (this.state === 'CLOSED') {
            // Reset failure count on success
            this.failureCount = 0;
        }

        this.emit('success', {
            name: this.name,
            duration,
            state: this.state
        });
    }

    /**
     * Handle failed execution
     */
    onFailure(error, callStart) {
        const duration = Date.now() - callStart;
        this.metrics.failedCalls++;
        this.metrics.lastFailureTime = Date.now();
        this.failureCount++;

        // Update call tracking
        const recentCall = this.metrics.callsInTimeWindow
            .find(call => call.timestamp === callStart);
        if (recentCall) {
            recentCall.success = false;
            recentCall.duration = duration;
            recentCall.error = error.message;
        }

        this.logger.warn('Circuit breaker call failed', {
            error: error.message,
            duration,
            state: this.state,
            failureCount: this.failureCount
        });

        if (this.state === 'HALF_OPEN') {
            // Any failure in half-open state opens the circuit
            this.transitionTo('OPEN');
        } else if (this.state === 'CLOSED') {
            // Check if we should open the circuit
            if (this.shouldOpenCircuit()) {
                this.transitionTo('OPEN');
            }
        }

        this.emit('failure', {
            name: this.name,
            error: error.message,
            duration,
            state: this.state,
            failureCount: this.failureCount
        });
    }

    /**
     * Execute fallback function
     */
    async executeFallback(fallback) {
        try {
            this.logger.info('Executing fallback', { name: this.name });

            if (typeof fallback === 'function') {
                return await fallback();
            } else {
                return fallback;
            }
        } catch (fallbackError) {
            this.logger.error('Fallback execution failed', {
                name: this.name,
                error: fallbackError.message
            });
            throw fallbackError;
        }
    }

    /**
     * Determine if circuit should be opened
     */
    shouldOpenCircuit() {
        // Check failure threshold
        if (this.failureCount >= this.failureThreshold) {
            return true;
        }

        // Check error percentage in time window
        const recentCalls = this.getRecentCalls();

        if (recentCalls.length >= this.volumeThreshold) {
            const failedCalls = recentCalls.filter(call => call.success === false).length;
            const errorPercentage = (failedCalls / recentCalls.length) * 100;

            if (errorPercentage >= this.errorPercentageThreshold) {
                this.logger.warn('Error percentage threshold exceeded', {
                    errorPercentage,
                    threshold: this.errorPercentageThreshold,
                    recentCalls: recentCalls.length
                });
                return true;
            }
        }

        return false;
    }

    /**
     * Get recent calls within time window
     */
    getRecentCalls() {
        const now = Date.now();
        return this.metrics.callsInTimeWindow.filter(
            call => call.success !== null && (now - call.timestamp) <= this.timeWindow
        );
    }

    /**
     * Clean up old metrics
     */
    cleanupOldMetrics() {
        const now = Date.now();
        this.metrics.callsInTimeWindow = this.metrics.callsInTimeWindow.filter(
            call => (now - call.timestamp) <= this.timeWindow * 2 // Keep twice the window for safety
        );
    }

    /**
     * Transition to new state
     */
    transitionTo(newState) {
        const oldState = this.state;
        this.state = newState;

        const transition = `${oldState}_TO_${newState}`;
        this.metrics.stateTransitions[transition] =
            (this.metrics.stateTransitions[transition] || 0) + 1;

        this.logger.info('Circuit breaker state transition', {
            from: oldState,
            to: newState,
            transition
        });

        switch (newState) {
            case 'OPEN':
                this.nextAttempt = Date.now() + this.recoveryTimeout;
                this.logger.warn('Circuit breaker OPENED', {
                    failureCount: this.failureCount,
                    nextAttempt: new Date(this.nextAttempt).toISOString()
                });
                break;

            case 'HALF_OPEN':
                this.halfOpenCallCount = 0;
                this.successCount = 0;
                this.logger.info('Circuit breaker transitioning to HALF_OPEN');
                break;

            case 'CLOSED':
                this.failureCount = 0;
                this.successCount = 0;
                this.halfOpenCallCount = 0;
                this.logger.info('Circuit breaker CLOSED - normal operation resumed');
                break;
        }

        this.emit('stateChange', {
            name: this.name,
            from: oldState,
            to: newState,
            timestamp: Date.now()
        });
    }

    /**
     * Get current metrics
     */
    getMetrics() {
        const recentCalls = this.getRecentCalls();
        const recentFailures = recentCalls.filter(call => call.success === false).length;
        const errorRate = recentCalls.length > 0 ? (recentFailures / recentCalls.length) * 100 : 0;

        return {
            name: this.name,
            state: this.state,
            failureCount: this.failureCount,
            successCount: this.successCount,
            halfOpenCallCount: this.halfOpenCallCount,
            nextAttempt: this.nextAttempt,
            errorRate,
            recentCallsCount: recentCalls.length,
            ...this.metrics,
            healthMetrics: {
                uptime: this.state === 'CLOSED' ? 1 : 0,
                errorRate,
                averageResponseTime: this.calculateAverageResponseTime(recentCalls),
                throughput: this.calculateThroughput(recentCalls)
            }
        };
    }

    /**
     * Calculate average response time for recent calls
     */
    calculateAverageResponseTime(recentCalls) {
        const callsWithDuration = recentCalls.filter(call => call.duration !== undefined);
        if (callsWithDuration.length === 0) return 0;

        const totalDuration = callsWithDuration.reduce((sum, call) => sum + call.duration, 0);
        return totalDuration / callsWithDuration.length;
    }

    /**
     * Calculate throughput (calls per second)
     */
    calculateThroughput(recentCalls) {
        if (recentCalls.length === 0) return 0;

        const timeSpan = this.timeWindow / 1000; // Convert to seconds
        return recentCalls.length / timeSpan;
    }

    /**
     * Reset circuit breaker to initial state
     */
    reset() {
        this.logger.info('Resetting circuit breaker', { name: this.name });

        this.state = 'CLOSED';
        this.failureCount = 0;
        this.successCount = 0;
        this.halfOpenCallCount = 0;
        this.nextAttempt = Date.now();

        // Reset metrics
        this.metrics.totalCalls = 0;
        this.metrics.successfulCalls = 0;
        this.metrics.failedCalls = 0;
        this.metrics.timeouts = 0;
        this.metrics.shortCircuits = 0;
        this.metrics.callsInTimeWindow = [];

        this.emit('reset', { name: this.name });
    }

    /**
     * Force circuit to specific state (for testing/admin purposes)
     */
    forceState(state) {
        this.logger.warn('Force setting circuit breaker state', {
            name: this.name,
            oldState: this.state,
            newState: state
        });

        this.transitionTo(state);
    }
}

/**
 * Circuit Breaker Registry for managing multiple circuit breakers
 */
class CircuitBreakerRegistry {
    constructor() {
        this.breakers = new Map();
        this.logger = winston.createLogger({
            level: 'info',
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.json()
            ),
            defaultMeta: { service: 'circuit-breaker-registry' },
            transports: [
                new winston.transports.File({ filename: 'circuit-breaker-registry.log' }),
                new winston.transports.Console()
            ]
        });
    }

    /**
     * Get or create a circuit breaker
     */
    getBreaker(name, options = {}) {
        if (!this.breakers.has(name)) {
            const breaker = new CircuitBreaker({ ...options, name });
            this.breakers.set(name, breaker);

            // Set up event listeners for monitoring
            breaker.on('stateChange', (event) => {
                this.logger.info('Circuit breaker state changed', event);
            });

            breaker.on('failure', (event) => {
                this.logger.warn('Circuit breaker failure', event);
            });

            this.logger.info('Created new circuit breaker', { name, options });
        }

        return this.breakers.get(name);
    }

    /**
     * Get all circuit breakers
     */
    getAllBreakers() {
        return Array.from(this.breakers.values());
    }

    /**
     * Get metrics for all circuit breakers
     */
    getAllMetrics() {
        const metrics = {};
        for (const [name, breaker] of this.breakers) {
            metrics[name] = breaker.getMetrics();
        }
        return metrics;
    }

    /**
     * Get Prometheus metrics format
     */
    getPrometheusMetrics() {
        let metrics = '';

        // Circuit breaker state
        metrics += '# HELP circuit_breaker_state Circuit breaker current state (0=closed, 1=half_open, 2=open)\n';
        metrics += '# TYPE circuit_breaker_state gauge\n';

        // Total calls
        metrics += '# HELP circuit_breaker_calls_total Total number of calls made through circuit breaker\n';
        metrics += '# TYPE circuit_breaker_calls_total counter\n';

        // Successful calls
        metrics += '# HELP circuit_breaker_successful_calls_total Total number of successful calls\n';
        metrics += '# TYPE circuit_breaker_successful_calls_total counter\n';

        // Failed calls
        metrics += '# HELP circuit_breaker_failed_calls_total Total number of failed calls\n';
        metrics += '# TYPE circuit_breaker_failed_calls_total counter\n';

        // Short circuits
        metrics += '# HELP circuit_breaker_short_circuits_total Total number of short-circuited calls\n';
        metrics += '# TYPE circuit_breaker_short_circuits_total counter\n';

        // Error rate
        metrics += '# HELP circuit_breaker_error_rate Current error rate percentage\n';
        metrics += '# TYPE circuit_breaker_error_rate gauge\n';

        for (const [name, breaker] of this.breakers) {
            const breakerMetrics = breaker.getMetrics();
            const stateValue = breakerMetrics.state === 'CLOSED' ? 0 :
                              breakerMetrics.state === 'HALF_OPEN' ? 1 : 2;

            metrics += `circuit_breaker_state{name="${name}"} ${stateValue}\n`;
            metrics += `circuit_breaker_calls_total{name="${name}"} ${breakerMetrics.totalCalls}\n`;
            metrics += `circuit_breaker_successful_calls_total{name="${name}"} ${breakerMetrics.successfulCalls}\n`;
            metrics += `circuit_breaker_failed_calls_total{name="${name}"} ${breakerMetrics.failedCalls}\n`;
            metrics += `circuit_breaker_short_circuits_total{name="${name}"} ${breakerMetrics.shortCircuits}\n`;
            metrics += `circuit_breaker_error_rate{name="${name}"} ${breakerMetrics.errorRate}\n`;
        }

        return metrics;
    }

    /**
     * Reset all circuit breakers
     */
    resetAll() {
        this.logger.info('Resetting all circuit breakers');
        for (const breaker of this.breakers.values()) {
            breaker.reset();
        }
    }
}

// Global registry instance
const registry = new CircuitBreakerRegistry();

module.exports = {
    CircuitBreaker,
    CircuitBreakerRegistry,
    registry
};