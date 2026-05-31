"use strict";
/**
 * HR Recruiter Agent - Logger Utility
 * Structured logging with timestamps and levels
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = exports.LogLevel = void 0;
var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["DEBUG"] = 0] = "DEBUG";
    LogLevel[LogLevel["INFO"] = 1] = "INFO";
    LogLevel[LogLevel["WARN"] = 2] = "WARN";
    LogLevel[LogLevel["ERROR"] = 3] = "ERROR";
})(LogLevel || (exports.LogLevel = LogLevel = {}));
class Logger {
    level;
    service;
    constructor(service = 'hr-recruiter-agent', level = LogLevel.INFO) {
        this.service = service;
        this.level = level;
    }
    shouldLog(level) {
        return level >= this.level;
    }
    formatEntry(level, message, context) {
        const entry = {
            timestamp: new Date().toISOString(),
            level,
            service: this.service,
            message,
            context,
        };
        return JSON.stringify(entry);
    }
    debug(message, context) {
        if (this.shouldLog(LogLevel.DEBUG)) {
            console.debug(this.formatEntry('DEBUG', message, context));
        }
    }
    info(message, context) {
        if (this.shouldLog(LogLevel.INFO)) {
            console.info(this.formatEntry('INFO', message, context));
        }
    }
    warn(message, context) {
        if (this.shouldLog(LogLevel.WARN)) {
            console.warn(this.formatEntry('WARN', message, context));
        }
    }
    error(message, error, context) {
        if (this.shouldLog(LogLevel.ERROR)) {
            const errorContext = error ? {
                ...context,
                error: {
                    name: error.name,
                    message: error.message,
                    stack: error.stack,
                },
            } : context;
            console.error(this.formatEntry('ERROR', message, errorContext));
        }
    }
    // Specific logging methods for HR operations
    candidateCreated(candidateId, source) {
        this.info('Candidate created', { candidateId, source });
    }
    candidateStatusChanged(candidateId, from, to) {
        this.info('Candidate status changed', { candidateId, from, to });
    }
    interviewScheduled(interviewId, candidateId, scheduledAt) {
        this.info('Interview scheduled', { interviewId, candidateId, scheduledAt });
    }
    interviewCompleted(interviewId, candidateId, overallScore) {
        this.info('Interview completed', { interviewId, candidateId, overallScore });
    }
    onboardingStarted(onboardingId, candidateId, startDate) {
        this.info('Onboarding started', { onboardingId, candidateId, startDate });
    }
    onboardingCompleted(onboardingId, candidateId, duration) {
        this.info('Onboarding completed', { onboardingId, candidateId, duration });
    }
    screeningCompleted(candidateId, resumeId, score, recommendation) {
        this.info('Screening completed', { candidateId, resumeId, score, recommendation });
    }
    matchingCompleted(jobId, candidateCount, avgScore) {
        this.info('Matching completed', { jobId, candidateCount, avgScore });
    }
}
exports.logger = new Logger();
exports.default = Logger;
//# sourceMappingURL=logger.js.map