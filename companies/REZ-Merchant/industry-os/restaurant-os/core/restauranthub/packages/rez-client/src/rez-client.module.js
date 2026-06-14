"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RezClientModule = void 0;
const common_1 = require("@nestjs/common");
const rez_http_client_1 = require("./rez-http.client");
const merchant_client_1 = require("./clients/merchant.client");
const analytics_client_1 = require("./clients/analytics.client");
const catalog_client_1 = require("./clients/catalog.client");
const wallet_client_1 = require("./clients/wallet.client");
let RezClientModule = class RezClientModule {
};
exports.RezClientModule = RezClientModule;
exports.RezClientModule = RezClientModule = __decorate([
    (0, common_1.Module)({
        providers: [
            rez_http_client_1.RezHttpClient,
            merchant_client_1.RezMerchantClient,
            analytics_client_1.RezAnalyticsClient,
            catalog_client_1.RezCatalogClient,
            wallet_client_1.RezWalletClient,
        ],
        exports: [
            merchant_client_1.RezMerchantClient,
            analytics_client_1.RezAnalyticsClient,
            catalog_client_1.RezCatalogClient,
            wallet_client_1.RezWalletClient,
        ],
    })
], RezClientModule);
