"use strict";
// RisaCare Shared Utils - Common Utilities
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = exports.MAX_FILE_SIZE = exports.ALLOWED_FILE_TYPES = void 0;
exports.generateId = generateId;
exports.generateRecordId = generateRecordId;
exports.generateAppointmentId = generateAppointmentId;
exports.generateProfileId = generateProfileId;
exports.generateRiskId = generateRiskId;
exports.generateEventId = generateEventId;
exports.now = now;
exports.toDateString = toDateString;
exports.toTimeString = toTimeString;
exports.addDays = addDays;
exports.addHours = addHours;
exports.addMinutes = addMinutes;
exports.diffDays = diffDays;
exports.diffMonths = diffMonths;
exports.isAfter = isAfter;
exports.isBefore = isBefore;
exports.isSameDay = isSameDay;
exports.startOfDay = startOfDay;
exports.endOfDay = endOfDay;
exports.parseDate = parseDate;
exports.formatDate = formatDate;
exports.isValidEmail = isValidEmail;
exports.isValidPhone = isValidPhone;
exports.isValidUUID = isValidUUID;
exports.sanitizeString = sanitizeString;
exports.truncate = truncate;
exports.hashString = hashString;
exports.generateSecureToken = generateSecureToken;
exports.pick = pick;
exports.omit = omit;
exports.deepClone = deepClone;
exports.isEmpty = isEmpty;
exports.merge = merge;
exports.groupBy = groupBy;
exports.unique = unique;
exports.chunk = chunk;
exports.flatten = flatten;
exports.paginate = paginate;
exports.slugify = slugify;
exports.capitalize = capitalize;
exports.titleCase = titleCase;
exports.maskPhone = maskPhone;
exports.maskEmail = maskEmail;
exports.clamp = clamp;
exports.round = round;
exports.formatCurrency = formatCurrency;
exports.percentage = percentage;
exports.calculateBMI = calculateBMI;
exports.getBMICategory = getBMICategory;
exports.getAge = getAge;
exports.calculateCycleDay = calculateCycleDay;
exports.predictNextPeriod = predictNextPeriod;
exports.predictFertileWindow = predictFertileWindow;
exports.isValidFileType = isValidFileType;
exports.isValidFileSize = isValidFileSize;
exports.getFileExtension = getFileExtension;
exports.generateRequestId = generateRequestId;
exports.withRetry = withRetry;
exports.sleep = sleep;
exports.createLogger = createLogger;
const crypto_1 = require("crypto");
const crypto_2 = require("crypto");
// ============================================
// ID GENERATION
// ============================================
function generateId(prefix = '') {
    const uuid = (0, crypto_1.randomUUID)().replace(/-/g, '').substring(0, 16);
    return prefix ? `${prefix}_${uuid}` : uuid;
}
function generateRecordId() {
    return generateId('rec');
}
function generateAppointmentId() {
    return generateId('apt');
}
function generateProfileId() {
    return (0, crypto_1.randomUUID)();
}
function generateRiskId() {
    return generateId('risk');
}
function generateEventId() {
    return (0, crypto_1.randomUUID)();
}
// ============================================
// DATE UTILITIES
// ============================================
function now() {
    return new Date().toISOString();
}
function toDateString(date = new Date()) {
    return date.toISOString().split('T')[0];
}
function toTimeString(date = new Date()) {
    return date.toTimeString().substring(0, 5);
}
function addDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}
function addHours(date, hours) {
    const result = new Date(date);
    result.setHours(result.getHours() + hours);
    return result;
}
function addMinutes(date, minutes) {
    const result = new Date(date);
    result.setMinutes(result.getMinutes() + minutes);
    return result;
}
function diffDays(date1, date2) {
    const diffTime = Math.abs(date2.getTime() - date1.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}
function diffMonths(date1, date2) {
    const months = (date2.getFullYear() - date1.getFullYear()) * 12;
    return months + date2.getMonth() - date1.getMonth();
}
function isAfter(date1, date2) {
    return date1.getTime() > date2.getTime();
}
function isBefore(date1, date2) {
    return date1.getTime() < date2.getTime();
}
function isSameDay(date1, date2) {
    return (date1.getFullYear() === date2.getFullYear() &&
        date1.getMonth() === date2.getMonth() &&
        date1.getDate() === date2.getDate());
}
function startOfDay(date = new Date()) {
    const result = new Date(date);
    result.setHours(0, 0, 0, 0);
    return result;
}
function endOfDay(date = new Date()) {
    const result = new Date(date);
    result.setHours(23, 59, 59, 999);
    return result;
}
function parseDate(dateStr) {
    return new Date(dateStr);
}
function formatDate(date, format = 'short') {
    switch (format) {
        case 'short':
            return date.toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
            });
        case 'long':
            return date.toLocaleDateString('en-IN', {
                weekday: 'long',
                day: '2-digit',
                month: 'long',
                year: 'numeric'
            });
        case 'iso':
            return date.toISOString();
        default:
            return date.toDateString();
    }
}
// ============================================
// VALIDATION UTILITIES
// ============================================
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}
function isValidPhone(phone) {
    const phoneRegex = /^[+]?[\d\s-]{10,15}$/;
    return phoneRegex.test(phone);
}
function isValidUUID(id) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(id);
}
function sanitizeString(str) {
    return str.trim().replace(/[<>]/g, '');
}
function truncate(str, maxLength) {
    if (str.length <= maxLength)
        return str;
    return str.substring(0, maxLength - 3) + '...';
}
// ============================================
// CRYPTO UTILITIES
// ============================================
function hashString(str, secret) {
    return (0, crypto_2.createHmac)('sha256', secret).update(str).digest('hex');
}
function generateSecureToken(length = 32) {
    return (0, crypto_1.randomUUID)().replace(/-/g, '') + (0, crypto_1.randomUUID)().replace(/-/g, '').substring(0, length);
}
// ============================================
// OBJECT UTILITIES
// ============================================
function pick(obj, keys) {
    return keys.reduce((result, key) => {
        if (key in obj) {
            result[key] = obj[key];
        }
        return result;
    }, {});
}
function omit(obj, keys) {
    const result = { ...obj };
    keys.forEach(key => delete result[key]);
    return result;
}
function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
}
function isEmpty(value) {
    if (value === null || value === undefined)
        return true;
    if (typeof value === 'string')
        return value.trim().length === 0;
    if (Array.isArray(value))
        return value.length === 0;
    if (typeof value === 'object')
        return Object.keys(value).length === 0;
    return false;
}
function merge(target, source) {
    return { ...target, ...source };
}
// ============================================
// ARRAY UTILITIES
// ============================================
function groupBy(array, key) {
    return array.reduce((result, item) => {
        const groupKey = String(item[key]);
        if (!result[groupKey]) {
            result[groupKey] = [];
        }
        result[groupKey].push(item);
        return result;
    }, {});
}
function unique(array) {
    return [...new Set(array)];
}
function chunk(array, size) {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
        chunks.push(array.slice(i, i + size));
    }
    return chunks;
}
function flatten(array) {
    return array.reduce((result, item) => {
        if (Array.isArray(item)) {
            result.push(...item);
        }
        else {
            result.push(item);
        }
        return result;
    }, []);
}
// ============================================
// PAGINATION UTILITIES
// ============================================
function paginate(array, page, limit) {
    const total = array.length;
    const totalPages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;
    const items = array.slice(offset, offset + limit);
    return {
        items,
        total,
        page,
        limit,
        totalPages
    };
}
// ============================================
// STRING UTILITIES
// ============================================
function slugify(str) {
    return str
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
}
function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}
function titleCase(str) {
    return str
        .split(' ')
        .map(word => capitalize(word))
        .join(' ');
}
function maskPhone(phone) {
    if (phone.length < 10)
        return phone;
    const visible = phone.slice(-4);
    return `****${visible}`;
}
function maskEmail(email) {
    const [name, domain] = email.split('@');
    if (!domain)
        return email;
    const maskedName = name.substring(0, 2) + '***';
    return `${maskedName}@${domain}`;
}
// ============================================
// NUMBER UTILITIES
// ============================================
function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}
function round(value, decimals = 2) {
    const factor = Math.pow(10, decimals);
    return Math.round(value * factor) / factor;
}
function formatCurrency(amount, currency = 'INR') {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency
    }).format(amount);
}
function percentage(value, total) {
    if (total === 0)
        return 0;
    return round((value / total) * 100);
}
// ============================================
// HEALTH-SPECIFIC UTILITIES
// ============================================
function calculateBMI(weightKg, heightCm) {
    const heightM = heightCm / 100;
    return round(weightKg / (heightM * heightM));
}
function getBMICategory(bmi) {
    if (bmi < 18.5)
        return { category: 'Underweight', color: '#F59E0B' };
    if (bmi < 25)
        return { category: 'Normal', color: '#22C55E' };
    if (bmi < 30)
        return { category: 'Overweight', color: '#F59E0B' };
    return { category: 'Obese', color: '#EF4444' };
}
function getAge(dateOfBirth) {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
}
function calculateCycleDay(lastPeriodStart, cycleLength = 28) {
    const today = new Date();
    const lastPeriod = new Date(lastPeriodStart);
    const diffDays = Math.floor((today.getTime() - lastPeriod.getTime()) / (1000 * 60 * 60 * 24));
    const day = (diffDays % cycleLength) + 1;
    let phase;
    if (day <= 5)
        phase = 'menstruation';
    else if (day <= 14)
        phase = 'follicular';
    else if (day <= 16)
        phase = 'ovulation';
    else
        phase = 'luteal';
    return { day, phase };
}
function predictNextPeriod(lastPeriodStart, cycleLength = 28) {
    const lastPeriod = new Date(lastPeriodStart);
    lastPeriod.setDate(lastPeriod.getDate() + cycleLength);
    return lastPeriod.toISOString().split('T')[0];
}
function predictFertileWindow(lastPeriodStart, cycleLength = 28) {
    const ovulation = new Date(lastPeriodStart);
    ovulation.setDate(ovulation.getDate() + cycleLength - 14);
    const start = new Date(ovulation);
    start.setDate(start.getDate() - 5);
    const end = new Date(ovulation);
    end.setDate(end.getDate() + 1);
    return {
        start: start.toISOString().split('T')[0],
        end: end.toISOString().split('T')[0]
    };
}
// ============================================
// FILE UTILITIES
// ============================================
exports.ALLOWED_FILE_TYPES = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
];
exports.MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB
function isValidFileType(mimeType) {
    return exports.ALLOWED_FILE_TYPES.includes(mimeType);
}
function isValidFileSize(size) {
    return size <= exports.MAX_FILE_SIZE;
}
function getFileExtension(filename) {
    return filename.split('.').pop()?.toLowerCase() || '';
}
// ============================================
// REQUEST ID UTILITIES
// ============================================
function generateRequestId() {
    return `req_${(0, crypto_1.randomUUID)().replace(/-/g, '').substring(0, 16)}`;
}
// ============================================
// RETRY UTILITIES
// ============================================
async function withRetry(fn, options = {}) {
    const { maxRetries = 3, backoffMs = 1000, onRetry } = options;
    let lastError;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        }
        catch (error) {
            lastError = error;
            if (attempt < maxRetries) {
                if (onRetry)
                    onRetry(lastError, attempt);
                await new Promise(resolve => setTimeout(resolve, backoffMs * Math.pow(2, attempt - 1)));
            }
        }
    }
    throw lastError;
}
// ============================================
// SLEEP UTILITIES
// ============================================
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
function createLogger(service) {
    const formatContext = (context) => {
        if (!context)
            return '';
        const parts = [`[${service}]`];
        if (context.requestId)
            parts.push(`[${context.requestId}]`);
        if (context.userId)
            parts.push(`[${context.userId}]`);
        if (context.profileId)
            parts.push(`[${context.profileId}]`);
        return parts.join(' ');
    };
    return {
        debug: (message, context) => {
            console.debug(`${formatContext(context)} ${message}`);
        },
        info: (message, context) => {
            console.info(`${formatContext(context)} ${message}`);
        },
        warn: (message, context) => {
            console.warn(`${formatContext(context)} ${message}`);
        },
        error: (message, error, context) => {
            console.error(`${formatContext(context)} ${message}`, error?.stack || error?.message);
        }
    };
}
exports.logger = createLogger('risa-care');
//# sourceMappingURL=index.js.map