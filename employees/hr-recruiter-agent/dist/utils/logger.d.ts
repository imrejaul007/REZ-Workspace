/**
 * HR Recruiter Agent - Logger Utility
 * Structured logging with timestamps and levels
 */
export declare enum LogLevel {
    DEBUG = 0,
    INFO = 1,
    WARN = 2,
    ERROR = 3
}
declare class Logger {
    private level;
    private service;
    constructor(service?: string, level?: LogLevel);
    private shouldLog;
    private formatEntry;
    debug(message: string, context?: Record<string, unknown>): void;
    info(message: string, context?: Record<string, unknown>): void;
    warn(message: string, context?: Record<string, unknown>): void;
    error(message: string, error?: Error, context?: Record<string, unknown>): void;
    candidateCreated(candidateId: string, source: string): void;
    candidateStatusChanged(candidateId: string, from: string, to: string): void;
    interviewScheduled(interviewId: string, candidateId: string, scheduledAt: string): void;
    interviewCompleted(interviewId: string, candidateId: string, overallScore: number): void;
    onboardingStarted(onboardingId: string, candidateId: string, startDate: string): void;
    onboardingCompleted(onboardingId: string, candidateId: string, duration: number): void;
    screeningCompleted(candidateId: string, resumeId: string, score: number, recommendation: string): void;
    matchingCompleted(jobId: string, candidateCount: number, avgScore: number): void;
}
export declare const logger: Logger;
export default Logger;
//# sourceMappingURL=logger.d.ts.map