"use strict";
// ============================================
// HOJAI AI - SDR Agent CRM Connector Service
// ============================================
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.crmConnector = exports.CRMConnector = void 0;
const axios_1 = __importDefault(require("axios"));
const models_1 = require("../models");
const types_1 = require("../types");
const logger_1 = require("../utils/logger");
class CRMConnector {
    provider;
    client = null;
    config = null;
    syncEnabled = false;
    webhookSecret;
    constructor() {
        this.provider = 'custom';
    }
    /**
     * Initialize CRM connection
     */
    async initialize(config) {
        logger_1.logger.info('Initializing CRM connector', { provider: config.provider });
        this.provider = config.provider;
        this.config = config;
        this.webhookSecret = config.webhookSecret;
        try {
            switch (config.provider) {
                case 'hubspot':
                    this.client = axios_1.default.create({
                        baseURL: 'https://api.hubapi.com',
                        headers: {
                            'Authorization': `Bearer ${config.apiKey}`,
                            'Content-Type': 'application/json'
                        }
                    });
                    break;
                case 'salesforce':
                    this.client = axios_1.default.create({
                        baseURL: config.instanceUrl || 'https://login.salesforce.com',
                        headers: {
                            'Authorization': `Bearer ${config.apiKey}`,
                            'Content-Type': 'application/json'
                        }
                    });
                    break;
                case 'pipedrive':
                    this.client = axios_1.default.create({
                        baseURL: `https://${config.instanceUrl || 'api'}.pipedrive.com/api/v1`,
                        headers: {
                            'Authorization': `Bearer ${config.apiKey}`
                        }
                    });
                    break;
                case 'zoho':
                    this.client = axios_1.default.create({
                        baseURL: `https://www.zohoapis.com/crm/v2`,
                        headers: {
                            'Authorization': `Zoho-oauthtoken ${config.apiKey}`,
                            'Content-Type': 'application/json'
                        }
                    });
                    break;
                case 'custom':
                default:
                    this.client = config.instanceUrl ? axios_1.default.create({
                        baseURL: config.instanceUrl,
                        headers: {
                            'Authorization': `Bearer ${config.apiKey}`,
                            'Content-Type': 'application/json'
                        }
                    }) : null;
                    break;
            }
            this.syncEnabled = true;
            logger_1.logger.info('CRM connector initialized', { provider: config.provider });
            return true;
        }
        catch (error) {
            logger_1.logger.error('Failed to initialize CRM connector', { error });
            return false;
        }
    }
    /**
     * Sync a lead to CRM
     */
    async syncLeadToCRM(tenantId, leadId) {
        if (!this.syncEnabled || !this.client) {
            return { success: false, error: 'CRM not configured' };
        }
        try {
            const lead = await models_1.Lead.findOne({ _id: leadId, tenantId });
            if (!lead) {
                return { success: false, error: 'Lead not found' };
            }
            const contact = await models_1.Contact.findById(lead.contactId);
            const company = await models_1.Company.findById(lead.companyId);
            // Create contact in CRM
            const crmContact = await this.syncContact(tenantId, contact, company);
            // Create/update deal/opportunity in CRM
            const crmDeal = await this.syncDeal(tenantId, lead, crmContact?.id);
            logger_1.logger.info('Lead synced to CRM', { tenantId, leadId, crmContactId: crmContact?.id, crmDealId: crmDeal?.id });
            return {
                success: true,
                crmContactId: crmContact?.id,
                crmLeadId: crmDeal?.id,
                syncedAt: new Date()
            };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            logger_1.logger.error('Failed to sync lead to CRM', { tenantId, leadId, error: errorMessage });
            return { success: false, error: errorMessage };
        }
    }
    /**
     * Sync contact to CRM
     */
    async syncContact(tenantId, contact, company) {
        if (!contact || !this.client)
            return null;
        const crmContact = {
            id: '',
            firstName: contact.firstName,
            lastName: contact.lastName,
            email: contact.email,
            phone: contact.phone,
            title: contact.title,
            company: contact.company,
            companySize: contact.companySize,
            industry: contact.industry,
            city: contact.location?.city,
            state: contact.location?.state,
            country: contact.location?.country,
            linkedinUrl: contact.linkedinUrl
        };
        switch (this.provider) {
            case 'hubspot':
                const hubspotContact = await this.client.post('/crm/v3/objects/contacts', {
                    properties: {
                        firstname: crmContact.firstName,
                        lastname: crmContact.lastName || '',
                        email: crmContact.email,
                        phone: crmContact.phone,
                        jobtitle: crmContact.title,
                        company: crmContact.company,
                        linkedin_url: crmContact.linkedinUrl
                    }
                });
                crmContact.id = hubspotContact.data.id;
                break;
            case 'salesforce':
                const salesforceContact = await this.client.post('/services/data/v58.0/sobjects/Contact', {
                    FirstName: crmContact.firstName,
                    LastName: crmContact.lastName || 'Unknown',
                    Email: crmContact.email,
                    Phone: crmContact.phone,
                    Title: crmContact.title,
                    AccountId: crmContact.company // Would need to sync account first
                });
                crmContact.id = salesforceContact.data.id;
                break;
            case 'pipedrive':
                const pipedrivePerson = await this.client.post('/persons', {
                    name: `${crmContact.firstName} ${crmContact.lastName || ''}`.trim(),
                    email_id: crmContact.email,
                    phone: crmContact.phone
                });
                crmContact.id = pipedrivePerson.data.data.id.toString();
                break;
            case 'zoho':
                const zohoContact = await this.client.post('/contacts', {
                    data: [{
                            First_Name: crmContact.firstName,
                            Last_Name: crmContact.lastName,
                            Email: crmContact.email,
                            Phone: crmContact.phone,
                            Title: crmContact.title,
                            Account_Name: crmContact.company
                        }]
                });
                crmContact.id = zohoContact.data.details.inserted_ids?.[0] || '';
                break;
            default:
                // Custom API - store reference
                crmContact.id = `custom-${contact._id}`;
                break;
        }
        return crmContact;
    }
    /**
     * Sync deal/opportunity to CRM
     */
    async syncDeal(tenantId, lead, crmContactId) {
        if (!this.client)
            return null;
        const stage = lead.stage;
        const deal = {
            id: '',
            name: `Lead - ${new Date().toISOString().split('T')[0]}`,
            stage: this.mapLeadStageToCRM(stage),
            amount: lead.metadata?.dealValue,
            currency: 'USD',
            contactId: crmContactId,
            ownerId: lead.ownerId,
            customFields: {
                sdrLeadId: lead._id.toString(),
                sdrScore: lead.scoreValue,
                sdrScoreCategory: lead.score
            }
        };
        switch (this.provider) {
            case 'hubspot':
                const hubspotDeal = await this.client.post('/crm/v3/objects/deals', {
                    properties: {
                        dealname: deal.name,
                        dealstage: deal.stage,
                        amount: deal.amount,
                        closedate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
                    },
                    associations: crmContactId ? [{
                            to: { id: crmContactId },
                            types: [{ associationCategory: 'HUBSPOT_DEFINED', associationTypeId: 3 }]
                        }] : []
                });
                deal.id = hubspotDeal.data.id;
                break;
            case 'salesforce':
                const sfDeal = await this.client.post('/services/data/v58.0/sobjects/Opportunity', {
                    Name: deal.name,
                    StageName: deal.stage,
                    Amount: deal.amount,
                    CloseDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
                });
                deal.id = sfDeal.data.id;
                break;
            case 'pipedrive':
                const pdDeal = await this.client.post('/deals', {
                    title: deal.name,
                    status: deal.stage === 'won' ? 'won' : 'open',
                    value: deal.amount
                });
                deal.id = pdDeal.data.data.id.toString();
                break;
            case 'zoho':
                const zohoDeal = await this.client.post('/deals', {
                    data: [{
                            Deal_Name: deal.name,
                            Stage: deal.stage,
                            Amount: deal.amount,
                            Closing_Date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
                        }]
                });
                deal.id = zohoDeal.data.details.inserted_ids?.[0] || '';
                break;
            default:
                deal.id = `custom-deal-${lead._id}`;
                break;
        }
        return deal;
    }
    /**
     * Update lead stage in CRM
     */
    async updateDealStage(crmDealId, stage) {
        if (!this.client)
            return false;
        const crmStage = this.mapLeadStageToCRM(stage);
        try {
            switch (this.provider) {
                case 'hubspot':
                    await this.client.patch(`/crm/v3/objects/deals/${crmDealId}`, {
                        properties: { dealstage: crmStage }
                    });
                    break;
                case 'salesforce':
                    await this.client.patch(`/services/data/v58.0/sobjects/Opportunity/${crmDealId}`, {
                        StageName: crmStage
                    });
                    break;
                case 'pipedrive':
                    await this.client.put(`/deals/${crmDealId}`, {
                        status: crmStage === 'won' ? 'won' : crmStage === 'lost' ? 'lost' : 'open'
                    });
                    break;
                case 'zoho':
                    await this.client.put(`/deals/${crmDealId}`, {
                        data: [{ Stage: crmStage }]
                    });
                    break;
            }
            return true;
        }
        catch (error) {
            logger_1.logger.error('Failed to update deal stage in CRM', { crmDealId, stage, error });
            return false;
        }
    }
    /**
     * Sync activity to CRM
     */
    async syncActivity(tenantId, activityId) {
        if (!this.syncEnabled || !this.client)
            return false;
        const activity = await models_1.Activity.findOne({ _id: activityId, tenantId });
        if (!activity)
            return false;
        try {
            switch (this.provider) {
                case 'hubspot':
                    await this.client.post('/crm/v3/objects/notes', {
                        properties: {
                            hs_note_body: activity.description,
                            hs_timestamp: activity.createdAt.toISOString()
                        },
                        associations: [{
                                to: { id: activity.leadId.toString() },
                                types: [{ associationCategory: 'HUBSPOT_DEFINED', associationTypeId: 214 }]
                            }]
                    });
                    break;
                case 'salesforce':
                    await this.client.post('/services/data/v58.0/sobjects/Task', {
                        Subject: activity.description,
                        Status: 'Completed',
                        ActivityDate: activity.createdAt.toISOString().split('T')[0],
                        WhatId: activity.leadId
                    });
                    break;
                case 'pipedrive':
                    await this.client.post('/activities', {
                        subject: activity.description,
                        done: 1,
                        lead_id: activity.leadId,
                        due_date: activity.createdAt.toISOString().split('T')[0]
                    });
                    break;
                case 'zoho':
                    await this.client.post('/activities', {
                        data: [{
                                Subject: activity.description,
                                Status: 'completed',
                                Due_Date: activity.createdAt.toISOString().split('T')[0]
                            }]
                    });
                    break;
            }
            return true;
        }
        catch (error) {
            logger_1.logger.error('Failed to sync activity to CRM', { activityId, error });
            return false;
        }
    }
    /**
     * Import contacts from CRM
     */
    async importContacts(tenantId, options) {
        if (!this.syncEnabled || !this.client) {
            return { success: false, imported: 0, errors: ['CRM not configured'] };
        }
        const errors = [];
        let imported = 0;
        try {
            let crmContacts = [];
            switch (this.provider) {
                case 'hubspot':
                    const hubspotResponse = await this.client.get('/crm/v3/objects/contacts', {
                        params: {
                            limit: options?.limit || 100,
                            properties: 'firstname,lastname,email,phone,jobtitle,company,linkedin_url'
                        }
                    });
                    crmContacts = hubspotResponse.data.results.map((c) => ({
                        id: c.id,
                        firstName: c.properties.firstname,
                        lastName: c.properties.lastname,
                        email: c.properties.email,
                        phone: c.properties.phone,
                        title: c.properties.jobtitle,
                        company: c.properties.company,
                        linkedinUrl: c.properties.linkedin_url
                    }));
                    break;
                case 'salesforce':
                    const sfResponse = await this.client.get('/services/data/v58.0/query', {
                        params: {
                            q: `SELECT Id, FirstName, LastName, Email, Phone, Title, Account.Name FROM Contact LIMIT ${options?.limit || 100}`
                        }
                    });
                    crmContacts = sfResponse.data.records.map((c) => ({
                        id: c.Id,
                        firstName: c.FirstName,
                        lastName: c.LastName,
                        email: c.Email,
                        phone: c.Phone,
                        title: c.Title,
                        company: c.Account?.Name
                    }));
                    break;
                case 'pipedrive':
                    const pdResponse = await this.client.get('/persons', {
                        params: { limit: options?.limit || 100 }
                    });
                    crmContacts = pdResponse.data.data.map((p) => ({
                        id: p.id.toString(),
                        firstName: p.name.split(' ')[0],
                        lastName: p.name.split(' ').slice(1).join(' '),
                        email: p.email?.[0]?.value,
                        phone: p.phone?.[0]?.value
                    }));
                    break;
                case 'zoho':
                    const zohoResponse = await this.client.get('/contacts', {
                        params: { per_page: options?.limit || 100 }
                    });
                    crmContacts = zohoResponse.data.data.map((c) => ({
                        id: c.id,
                        firstName: c.First_Name,
                        lastName: c.Last_Name,
                        email: c.Email,
                        phone: c.Phone,
                        title: c.Title,
                        company: c.Account_Name?.name
                    }));
                    break;
            }
            // Import each contact
            for (const crmContact of crmContacts) {
                try {
                    await models_1.Contact.findOneAndUpdate({ tenantId, email: crmContact.email }, {
                        tenantId,
                        firstName: crmContact.firstName,
                        lastName: crmContact.lastName,
                        email: crmContact.email,
                        phone: crmContact.phone,
                        title: crmContact.title,
                        company: crmContact.company,
                        companySize: crmContact.companySize,
                        industry: crmContact.industry,
                        location: {
                            city: crmContact.city,
                            state: crmContact.state,
                            country: crmContact.country
                        },
                        linkedinUrl: crmContact.linkedinUrl,
                        metadata: {
                            crmId: crmContact.id,
                            crmProvider: this.provider,
                            importedAt: new Date()
                        }
                    }, { upsert: true, new: true });
                    imported++;
                }
                catch (err) {
                    errors.push(`Failed to import ${crmContact.email}: ${err instanceof Error ? err.message : 'Unknown error'}`);
                }
            }
            logger_1.logger.info('Imported contacts from CRM', { tenantId, imported, errors: errors.length });
            return { success: true, imported, errors };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            logger_1.logger.error('Failed to import from CRM', { error: errorMessage });
            return { success: false, imported, errors: [errorMessage] };
        }
    }
    /**
     * Handle incoming webhooks from CRM
     */
    async handleWebhook(payload) {
        // Verify webhook signature if secret is configured
        if (this.webhookSecret) {
            // In production, verify signature
            // const signature = req.headers['x-crm-signature'];
        }
        switch (this.provider) {
            case 'hubspot':
                return {
                    type: payload.objectType || 'contact',
                    data: payload
                };
            case 'salesforce':
                return {
                    type: payload.sObject || 'unknown',
                    data: payload
                };
            default:
                return payload || null;
        }
    }
    /**
     * Map lead stage to CRM stage name
     */
    mapLeadStageToCRM(stage) {
        const mapping = {
            [types_1.LeadStage.NEW]: 'appointmentscheduled',
            [types_1.LeadStage.CONTACTED]: 'qualifiedtobuy',
            [types_1.LeadStage.QUALIFIED]: 'presentationscheduled',
            [types_1.LeadStage.PROPOSAL]: 'decisionmakerboughtin',
            [types_1.LeadStage.NEGOTIATION]: 'contractsent',
            [types_1.LeadStage.CLOSED_WON]: 'closedwon',
            [types_1.LeadStage.CLOSED_LOST]: 'closedlost'
        };
        return mapping[stage] || 'appointmentscheduled';
    }
    /**
     * Get connection status
     */
    isConnected() {
        return this.syncEnabled && this.client !== null;
    }
    /**
     * Get current provider
     */
    getProvider() {
        return this.provider;
    }
}
exports.CRMConnector = CRMConnector;
exports.crmConnector = new CRMConnector();
//# sourceMappingURL=crmConnector.js.map