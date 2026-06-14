"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RisnaEstate = exports.MediaClient = exports.CRMClient = exports.BrokerClient = exports.ReferralClient = exports.VisaClient = exports.LeadClient = exports.PropertyClient = void 0;
const logger_1 = require("../../shared/logger");
/**
 * RisnaEstate API Client
 *
 * TypeScript client for all RisnaEstate services.
 *
 * Usage:
 * ```typescript
 * import { RisnaEstate } from '@risna/client';
 *
 * const risna = new RisnaEstate({
 *   baseUrl: 'http://localhost:4100',
 *   apiKey: 'your-internal-token'
 * });
 *
 * const properties = await risna.property.search({ city: 'Dubai' });
 * const lead = await risna.lead.create({ name: 'John', phone: '+91...', source: 'website' });
 * ```
 */
const axios_1 = __importDefault(require("axios"));
// ===== BASE CLIENT =====
class BaseClient {
    constructor(config) {
        const baseURL = config.baseUrl || 'http://localhost:4100';
        const timeout = config.timeout || 30000;
        this.client = axios_1.default.create({
            baseURL,
            timeout,
            headers: {
                'Content-Type': 'application/json',
                ...(config.apiKey && { 'X-Internal-Token': config.apiKey }),
            },
        });
        if (config.debug) {
            this.client.interceptors.request.use((req) => {
                logger_1.logger.info(`[RisnaEstate] ${req.method?.toUpperCase()} ${req.url}`);
                return req;
            });
        }
        this.client.interceptors.response.use((response) => response, (error) => {
            logger_1.logger.error('[RisnaEstate] Error:', error.message);
            throw error;
        });
    }
    async get(path, params) {
        const response = await this.client.get(path, { params });
        return response.data.data;
    }
    async post(path, data) {
        const response = await this.client.post(path, data);
        return response.data.data;
    }
    async put(path, data) {
        const response = await this.client.put(path, data);
        return response.data.data;
    }
    async delete(path) {
        const response = await this.client.delete(path);
        return response.data.data;
    }
}
// ===== PROPERTY CLIENT =====
class PropertyClient extends BaseClient {
    constructor(config) {
        super({ ...config, baseUrl: config.baseUrl || 'http://localhost:4100' });
    }
    async search(filters = {}) {
        return this.get('/api/v1/properties', filters);
    }
    async getById(id) {
        return this.get(`/api/v1/properties/${id}`);
    }
    async create(data) {
        return this.post('/api/v1/properties', data);
    }
    async update(id, data) {
        return this.put(`/api/v1/properties/${id}`, data);
    }
    async delete(id) {
        return this.delete(`/api/v1/properties/${id}`);
    }
    async publish(id) {
        return this.post(`/api/v1/properties/${id}/publish`);
    }
    async trackView(id, userId) {
        return this.post(`/api/v1/properties/${id}/view`, { userId });
    }
    async trackInquiry(id, userId) {
        return this.post(`/api/v1/properties/${id}/inquire`, { userId });
    }
    async getFeatured(limit = 10) {
        return this.get('/api/v1/properties/featured', { limit });
    }
    async getNewLaunches(limit = 10) {
        return this.get('/api/v1/properties/new-launches', { limit });
    }
    async getAnalytics(id) {
        return this.get(`/api/v1/properties/${id}/analytics`);
    }
    async getSimilar(id, limit = 5) {
        return this.get(`/api/v1/properties/${id}/similar`, { limit });
    }
}
exports.PropertyClient = PropertyClient;
// ===== LEAD CLIENT =====
class LeadClient extends BaseClient {
    constructor(config) {
        super({ ...config, baseUrl: config.baseUrl || 'http://localhost:4101' });
    }
    async search(filters = {}) {
        return this.get('/api/v1/leads', filters);
    }
    async getById(id) {
        return this.get(`/api/v1/leads/${id}`);
    }
    async getByPhone(phone) {
        return this.get(`/api/v1/leads/phone/${phone}`);
    }
    async create(data) {
        return this.post('/api/v1/leads', data);
    }
    async update(id, data) {
        return this.put(`/api/v1/leads/${id}`, data);
    }
    async delete(id) {
        return this.delete(`/api/v1/leads/${id}`);
    }
    async score(id) {
        return this.post(`/api/v1/leads/${id}/score`);
    }
    async qualify(id, status, reason) {
        return this.post(`/api/v1/leads/${id}/qualify`, { status, reason });
    }
    async assign(id, brokerId) {
        return this.post(`/api/v1/leads/${id}/assign`, { brokerId });
    }
    async addInteraction(id, interaction) {
        return this.post(`/api/v1/leads/${id}/interaction`, interaction);
    }
    async getHotLeads(limit = 50) {
        return this.get('/api/v1/leads/hot', { limit });
    }
    async getBySegment(segment, limit = 50) {
        return this.get(`/api/v1/leads/segments/${segment}`, { limit });
    }
    async getDashboard(brokerId) {
        return this.get('/api/v1/leads/dashboard', { brokerId });
    }
    async getTimeline(id) {
        return this.get(`/api/v1/leads/${id}/timeline`);
    }
}
exports.LeadClient = LeadClient;
// ===== VISA CLIENT =====
class VisaClient extends BaseClient {
    constructor(config) {
        super({ ...config, baseUrl: config.baseUrl || 'http://localhost:4102' });
    }
    async checkEligibility(input) {
        return this.post('/api/v1/visa/eligibility', input);
    }
    async createAssessment(input) {
        return this.post('/api/v1/visa/assessment', input);
    }
    async getAssessment(id) {
        return this.get(`/api/v1/visa/assessment/${id}`);
    }
    async getByUser(userId) {
        return this.get(`/api/v1/visa/user/${userId}`);
    }
    async getPrograms() {
        return this.get('/api/v1/visa/programs');
    }
    async getRequirements(programType) {
        return this.get('/api/v1/visa/requirements', { programType });
    }
    async getStats() {
        return this.get('/api/v1/visa/stats');
    }
}
exports.VisaClient = VisaClient;
// ===== REFERRAL CLIENT =====
class ReferralClient extends BaseClient {
    constructor(config) {
        super({ ...config, baseUrl: config.baseUrl || 'http://localhost:4103' });
    }
    async create(data) {
        return this.post('/api/v1/referrals', data);
    }
    async validate(code) {
        return this.post('/api/v1/referrals/validate', { code });
    }
    async getMyReferrals(userId, page = 1, limit = 20) {
        return this.get('/api/v1/referrals/my', { userId, page, limit });
    }
    async getEarnings(userId, page = 1, limit = 20) {
        return this.get('/api/v1/referrals/earnings', { userId, page, limit });
    }
    async getLeaderboard(limit = 10) {
        return this.get('/api/v1/referrals/leaderboard', { limit });
    }
    async getPrograms() {
        return this.get('/api/v1/referrals/programs');
    }
    async getStats(userId) {
        return this.get('/api/v1/referrals/stats', { userId });
    }
    async register(id, refereeId, refereeName) {
        return this.post(`/api/v1/referrals/${id}/register`, { refereeId, refereeName });
    }
    async markInterested(id) {
        return this.post(`/api/v1/referrals/${id}/interested`);
    }
    async markVisited(id) {
        return this.post(`/api/v1/referrals/${id}/visited`);
    }
    async markConverted(id, dealValue, propertyId) {
        return this.post(`/api/v1/referrals/${id}/converted`, { dealValue, propertyId });
    }
}
exports.ReferralClient = ReferralClient;
// ===== BROKER CLIENT =====
class BrokerClient extends BaseClient {
    constructor(config) {
        super({ ...config, baseUrl: config.baseUrl || 'http://localhost:4104' });
    }
    async register(data) {
        return this.post('/api/v1/brokers', data);
    }
    async search(filters = {}) {
        return this.get('/api/v1/brokers/search', filters);
    }
    async getById(id) {
        return this.get(`/api/v1/brokers/${id}`);
    }
    async getByUserId(userId) {
        return this.get(`/api/v1/brokers/user/${userId}`);
    }
    async update(id, data) {
        return this.put(`/api/v1/brokers/${id}`, data);
    }
    async verify(id, verifiedBy) {
        return this.post(`/api/v1/brokers/${id}/verify`, { verifiedBy });
    }
    async suspend(id, reason) {
        return this.post(`/api/v1/brokers/${id}/suspend`, { reason });
    }
    async getStats(id) {
        return this.get(`/api/v1/brokers/${id}/stats`);
    }
    async calculateCommission(id, dealValue, propertyType, listingType) {
        return this.post(`/api/v1/brokers/${id}/commission/calculate`, { dealValue, propertyType, listingType });
    }
    async getDashboard() {
        return this.get('/api/v1/brokers/dashboard');
    }
    async createTeam(name, managerId) {
        return this.post('/api/v1/brokers/teams', { name, managerId });
    }
    async getTeam(teamId) {
        return this.get(`/api/v1/brokers/teams/${teamId}`);
    }
    async getTeamMembers(teamId) {
        return this.get(`/api/v1/brokers/teams/${teamId}/members`);
    }
}
exports.BrokerClient = BrokerClient;
// ===== CRM CLIENT =====
class CRMClient extends BaseClient {
    constructor(config) {
        super({ ...config, baseUrl: config.baseUrl || 'http://localhost:4105' });
    }
    // Follow-ups
    async createFollowUp(data) {
        return this.post('/api/v1/crm/follow-ups', data);
    }
    async getFollowUps(filters = {}) {
        return this.get('/api/v1/crm/follow-ups', filters);
    }
    async getDueFollowUps(brokerId) {
        return this.get('/api/v1/crm/follow-ups/due', { brokerId });
    }
    async completeFollowUp(id, outcome, notes) {
        return this.post(`/api/v1/crm/follow-ups/${id}/complete`, { outcome, notes });
    }
    async rescheduleFollowUp(id, newScheduledAt) {
        return this.post(`/api/v1/crm/follow-ups/${id}/reschedule`, { newScheduledAt });
    }
    // Site Visits
    async createSiteVisit(data) {
        return this.post('/api/v1/crm/site-visits', data);
    }
    async getSiteVisits(filters = {}) {
        return this.get('/api/v1/crm/site-visits', filters);
    }
    async confirmSiteVisit(id) {
        return this.post(`/api/v1/crm/site-visits/${id}/confirm`);
    }
    async startSiteVisit(id) {
        return this.post(`/api/v1/crm/site-visits/${id}/start`);
    }
    async completeSiteVisit(id, feedback) {
        return this.post(`/api/v1/crm/site-visits/${id}/complete`, feedback);
    }
    async cancelSiteVisit(id, reason) {
        return this.post(`/api/v1/crm/site-visits/${id}/cancel`, { reason });
    }
    // Dashboard
    async getDashboard(brokerId) {
        return this.get('/api/v1/crm/dashboard', { brokerId });
    }
}
exports.CRMClient = CRMClient;
// ===== MEDIA CLIENT =====
class MediaClient extends BaseClient {
    constructor(config) {
        super({ ...config, baseUrl: config.baseUrl || 'http://localhost:4106' });
    }
    // Campaigns
    async createCampaign(data) {
        return this.post('/api/v1/media/campaigns', data);
    }
    async getCampaigns(filters = {}) {
        return this.get('/api/v1/media/campaigns', filters);
    }
    async getCampaign(id) {
        return this.get(`/api/v1/media/campaigns/${id}`);
    }
    async activateCampaign(id) {
        return this.post(`/api/v1/media/campaigns/${id}/activate`);
    }
    async pauseCampaign(id) {
        return this.post(`/api/v1/media/campaigns/${id}/pause`);
    }
    // Influencers
    async registerInfluencer(data) {
        return this.post('/api/v1/media/influencers', data);
    }
    async getInfluencers(filters = {}) {
        return this.get('/api/v1/media/influencers', filters);
    }
    // Property Ads
    async createPropertyAd(data) {
        return this.post('/api/v1/media/ads', data);
    }
    async getPropertyAds(filters = {}) {
        return this.get('/api/v1/media/ads', filters);
    }
    async pausePropertyAd(id) {
        return this.post(`/api/v1/media/ads/${id}/pause`);
    }
    // Analytics
    async getPropertyAnalytics(propertyId) {
        return this.get(`/api/v1/media/analytics/property/${propertyId}`);
    }
    async getROIAnalytics(brokerId) {
        return this.get('/api/v1/media/analytics/roi', { brokerId });
    }
}
exports.MediaClient = MediaClient;
// ===== UNIFIED CLIENT =====
class RisnaEstate {
    constructor(config = {}) {
        this.property = new PropertyClient(config);
        this.lead = new LeadClient(config);
        this.visa = new VisaClient(config);
        this.referral = new ReferralClient(config);
        this.broker = new BrokerClient(config);
        this.crm = new CRMClient(config);
        this.media = new MediaClient(config);
    }
}
exports.RisnaEstate = RisnaEstate;
// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'risna-client',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});
// Liveness probe
app.get('/health/live', (req, res) => {
    res.json({ status: 'alive' });
});
// Readiness probe
app.get('/health/ready', (req, res) => {
    res.json({ status: 'ready' });
});
//# sourceMappingURL=index.js.map