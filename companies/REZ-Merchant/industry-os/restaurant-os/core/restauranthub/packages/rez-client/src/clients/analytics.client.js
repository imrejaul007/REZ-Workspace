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
var RezAnalyticsClient_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RezAnalyticsClient = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const rez_http_client_1 = require("../rez-http.client");
const SERVICE_KEY = 'rez-analytics';
let RezAnalyticsClient = RezAnalyticsClient_1 = class RezAnalyticsClient {
    client;
    config;
    logger = new common_1.Logger(RezAnalyticsClient_1.name);
    http;
    constructor(client, config) {
        this.client = client;
        this.config = config;
        const baseURL = this.config.get('REZ_ANALYTICS_URL', 'https://analytics-events.onrender.com');
        if (!baseURL) {
            this.logger.warn('REZ_ANALYTICS_URL not set, using default');
        }
        this.http = this.client.buildInstance(baseURL);
    }
    async getMerchantAnalytics(merchantId, period) {
        return this.client.get(SERVICE_KEY, this.http, `/analytics/merchants/${merchantId}`, { period });
    }
    async getRevenueMetrics(merchantId) {
        return this.client.get(SERVICE_KEY, this.http, `/analytics/merchants/${merchantId}/revenue`);
    }
    async getFoodCostMetrics(merchantId) {
        return this.client.get(SERVICE_KEY, this.http, `/analytics/merchants/${merchantId}/food-cost`);
    }
};
exports.RezAnalyticsClient = RezAnalyticsClient;
exports.RezAnalyticsClient = RezAnalyticsClient = RezAnalyticsClient_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [rez_http_client_1.RezHttpClient,
        config_1.ConfigService])
], RezAnalyticsClient);
