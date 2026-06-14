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
var RezMerchantClient_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RezMerchantClient = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const rez_http_client_1 = require("../rez-http.client");
const SERVICE_KEY = 'rez-merchant';
let RezMerchantClient = RezMerchantClient_1 = class RezMerchantClient {
    client;
    config;
    logger = new common_1.Logger(RezMerchantClient_1.name);
    http;
    constructor(client, config) {
        this.client = client;
        this.config = config;
        const baseURL = this.config.get('REZ_MERCHANT_SERVICE_URL', 'https://rez-merchant-service.onrender.com');
        if (!baseURL) {
            this.logger.warn('REZ_MERCHANT_SERVICE_URL not set, using default');
        }
        this.http = this.client.buildInstance(baseURL);
    }
    async getMerchant(merchantId) {
        return this.client.get(SERVICE_KEY, this.http, `/merchants/${merchantId}`);
    }
    async getMerchantStats(merchantId) {
        return this.client.get(SERVICE_KEY, this.http, `/merchants/${merchantId}/stats`);
    }
    async getMerchantStores(merchantId) {
        const result = await this.client.get(SERVICE_KEY, this.http, `/merchants/${merchantId}/stores`);
        return result ?? [];
    }
    async getPurchaseOrders(merchantId, days = 30) {
        const result = await this.client.get(SERVICE_KEY, this.http, `/merchants/${merchantId}/purchase-orders`, { days });
        return result ?? [];
    }
    async getPurchaseOrderSummary(merchantId) {
        return this.client.get(SERVICE_KEY, this.http, `/merchants/${merchantId}/purchase-orders/summary`);
    }
    async getStaffShifts(merchantId) {
        const result = await this.client.get(SERVICE_KEY, this.http, `/merchants/${merchantId}/staff/shifts`);
        return result ?? [];
    }
    async getShiftGaps(merchantId) {
        const result = await this.client.get(SERVICE_KEY, this.http, `/merchants/${merchantId}/staff/shift-gaps`);
        return result ?? [];
    }
};
exports.RezMerchantClient = RezMerchantClient;
exports.RezMerchantClient = RezMerchantClient = RezMerchantClient_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [rez_http_client_1.RezHttpClient,
        config_1.ConfigService])
], RezMerchantClient);
