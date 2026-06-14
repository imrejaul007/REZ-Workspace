export declare function generateId(prefix?: string): string;
export declare function generateRecordId(): string;
export declare function generateAppointmentId(): string;
export declare function generateProfileId(): string;
export declare function generateRiskId(): string;
export declare function generateEventId(): string;
export declare function now(): string;
export declare function toDateString(date?: Date): string;
export declare function toTimeString(date?: Date): string;
export declare function addDays(date: Date, days: number): Date;
export declare function addHours(date: Date, hours: number): Date;
export declare function addMinutes(date: Date, minutes: number): Date;
export declare function diffDays(date1: Date, date2: Date): number;
export declare function diffMonths(date1: Date, date2: Date): number;
export declare function isAfter(date1: Date, date2: Date): boolean;
export declare function isBefore(date1: Date, date2: Date): boolean;
export declare function isSameDay(date1: Date, date2: Date): boolean;
export declare function startOfDay(date?: Date): Date;
export declare function endOfDay(date?: Date): Date;
export declare function parseDate(dateStr: string): Date;
export declare function formatDate(date: Date, format?: 'short' | 'long' | 'iso'): string;
export declare function isValidEmail(email: string): boolean;
export declare function isValidPhone(phone: string): boolean;
export declare function isValidUUID(id: string): boolean;
export declare function sanitizeString(str: string): string;
export declare function truncate(str: string, maxLength: number): string;
export declare function hashString(str: string, secret: string): string;
export declare function generateSecureToken(length?: number): string;
export declare function pick<T extends object, K extends keyof T>(obj: T, keys: K[]): Pick<T, K>;
export declare function omit<T extends object, K extends keyof T>(obj: T, keys: K[]): Omit<T, K>;
export declare function deepClone<T>(obj: T): T;
export declare function isEmpty(value: unknown): boolean;
export declare function merge<T extends object>(target: T, source: Partial<T>): T;
export declare function groupBy<T>(array: T[], key: keyof T): Record<string, T[]>;
export declare function unique<T>(array: T[]): T[];
export declare function chunk<T>(array: T[], size: number): T[][];
export declare function flatten<T>(array: (T | T[])[]): T[];
export declare function paginate<T>(array: T[], page: number, limit: number): {
    items: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
};
export declare function slugify(str: string): string;
export declare function capitalize(str: string): string;
export declare function titleCase(str: string): string;
export declare function maskPhone(phone: string): string;
export declare function maskEmail(email: string): string;
export declare function clamp(value: number, min: number, max: number): number;
export declare function round(value: number, decimals?: number): number;
export declare function formatCurrency(amount: number, currency?: string): string;
export declare function percentage(value: number, total: number): number;
export declare function calculateBMI(weightKg: number, heightCm: number): number;
export declare function getBMICategory(bmi: number): {
    category: string;
    color: string;
};
export declare function getAge(dateOfBirth: string): number;
export declare function calculateCycleDay(lastPeriodStart: string, cycleLength?: number): {
    day: number;
    phase: 'menstruation' | 'follicular' | 'ovulation' | 'luteal';
};
export declare function predictNextPeriod(lastPeriodStart: string, cycleLength?: number): string;
export declare function predictFertileWindow(lastPeriodStart: string, cycleLength?: number): {
    start: string;
    end: string;
};
export declare const ALLOWED_FILE_TYPES: string[];
export declare const MAX_FILE_SIZE: number;
export declare function isValidFileType(mimeType: string): boolean;
export declare function isValidFileSize(size: number): boolean;
export declare function getFileExtension(filename: string): string;
export declare function generateRequestId(): string;
export declare function withRetry<T>(fn: () => Promise<T>, options?: {
    maxRetries?: number;
    backoffMs?: number;
    onRetry?: (error: Error, attempt: number) => void;
}): Promise<T>;
export declare function sleep(ms: number): Promise<void>;
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';
export interface LogContext {
    requestId?: string;
    userId?: string;
    profileId?: string;
    [key: string]: unknown;
}
export declare function createLogger(service: string): {
    debug: (message: string, context?: LogContext) => void;
    info: (message: string, context?: LogContext) => void;
    warn: (message: string, context?: LogContext) => void;
    error: (message: string, error?: Error, context?: LogContext) => void;
};
export declare const logger: {
    debug: (message: string, context?: LogContext) => void;
    info: (message: string, context?: LogContext) => void;
    warn: (message: string, context?: LogContext) => void;
    error: (message: string, error?: Error, context?: LogContext) => void;
};
