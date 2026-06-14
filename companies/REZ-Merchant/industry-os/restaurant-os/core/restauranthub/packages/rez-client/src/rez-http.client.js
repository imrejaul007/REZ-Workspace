"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var RezHttpClient_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RezHttpClient = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const axios_1 = __importDefault(require("axios"));
const CIRCUIT_FAILURE_THRESHOLD = 5;
const CIRCUIT_RESET_MS = 30_000;
const REQUEST_TIMEOUT_MS = 10_000;
const MAX_RETRIES = 3;
const RETRY_BASE_MS = 300;
let RezHttpClient = RezHttpClient_1 = class RezHttpClient {
    config;
    logger = new common_1.Logger(RezHttpClient_1.name);
    circuits = new Map();
    constructor(config) {
        this.config = config;
    }
    getCircuit(serviceKey) {
        if (!this.circuits.has(serviceKey)) {
            this.circuits.set(serviceKey, {
                state: 'closed',
                consecutiveFailures: 0,
                lastFailureTime: null,
                nextAttemptTime: null,
            });
        }
        return this.circuits.get(serviceKey);
    }
    isOpen(serviceKey) {
        const circuit = this.getCircuit(serviceKey);
        if (circuit.state === 'open') {
            const now = Date.now();
            if (circuit.nextAttemptTime !== null && now >= circuit.nextAttemptTime) {
                circuit.state = 'half-open';
                return false;
            }
            return true;
        }
        return false;
    }
    recordSuccess(serviceKey) {
        const circuit = this.getCircuit(serviceKey);
        circuit.consecutiveFailures = 0;
        circuit.state = 'closed';
        circuit.lastFailureTime = null;
        circuit.nextAttemptTime = null;
    }
    recordFailure(serviceKey) {
        const circuit = this.getCircuit(serviceKey);
        circuit.consecutiveFailures += 1;
        circuit.lastFailureTime = Date.now();
        if (circuit.consecutiveFailures >= CIRCUIT_FAILURE_THRESHOLD) {
            circuit.state = 'open';
            circuit.nextAttemptTime = Date.now() + CIRCUIT_RESET_MS;
            this.logger.warn(`Circuit opened for ${serviceKey} after ${circuit.consecutiveFailures} failures`);
        }
    }
    getCircuitState(serviceKey) {
        return this.getCircuit(serviceKey).state;
    }
    buildInstance(baseURL) {
        const token = this.config.get('REZ_INTERNAL_TOKEN', '');
        return axios_1.default.create({
            baseURL,
            timeout: REQUEST_TIMEOUT_MS,
            headers: {
                'Content-Type': 'application/json',
                'X-Internal-Token': token,
            },
        });
    }
    async withRetry(fn, attempt = 0) {
        try {
            return await fn();
        }
        catch (err) {
            const isServer = axios_1.default.isAxiosError(err) &&
                err.response !== undefined &&
                err.response.status >= 500;
            const isNetwork = axios_1.default.isAxiosError(err) && err.response === undefined;
            if ((isServer || isNetwork) && attempt < MAX_RETRIES) {
                const delay = RETRY_BASE_MS * Math.pow(2, attempt);
                this.logger.debug(`Retry ${attempt + 1}/${MAX_RETRIES} after ${delay}ms`);
                await new Promise((r) => setTimeout(r, delay));
                return this.withRetry(fn, attempt + 1);
            }
            throw err;
        }
    }
    async request(serviceKey, instance, cfg, correlationId) {
        if (this.isOpen(serviceKey)) {
            this.logger.warn(`Circuit open for ${serviceKey}, returning null`);
            return null;
        }
        const headers = {
            ...cfg.headers,
        };
        if (correlationId) {
            headers['X-Correlation-ID'] = correlationId;
        }
        try {
            const response = await this.withRetry(() => instance.request({ ...cfg, headers }));
            this.recordSuccess(serviceKey);
            return response.data;
        }
        catch (err) {
            this.recordFailure(serviceKey);
            const msg = err instanceof Error ? err.message : String(err);
            this.logger.error(`Request failed [${serviceKey}] ${cfg.method?.toUpperCase()} ${cfg.url}: ${msg}`);
            return null;
        }
    }
    async get(serviceKey, instance, url, params, correlationId) {
        return this.request(serviceKey, instance, { method: 'GET', url, params }, correlationId);
    }
    async post(serviceKey, instance, url, data, correlationId) {
        return this.request(serviceKey, instance, { method: 'POST', url, data }, correlationId);
    }
    async put(serviceKey, instance, url, data, correlationId) {
        return this.request(serviceKey, instance, { method: 'PUT', url, data }, correlationId);
    }
    async delete(serviceKey, instance, url, correlationId) {
        return this.request(serviceKey, instance, { method: 'DELETE', url }, correlationId);
    }
};
exports.RezHttpClient = RezHttpClient;
exports.RezHttpClient = RezHttpClient = RezHttpClient_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], RezHttpClient);
