/**
 * REZ CRM Integration
 *
 * Bidirectional sync between Atlas GTM and REZ CRM
 * CRM Service: Port 4210
 */

const { v4: uuidv4 } = require('uuid');
const axios = require('axios');

// REZ CRM Configuration
const crmConfig = {
  baseUrl: process.env.REZ_CRM_URL || 'http://localhost:4210',
  apiKey: process.env.REZ_CRM_API_KEY || null,
  webhookSecret: process.env.REZ_CRM_WEBHOOK_SECRET || null
};

// Sync state
const syncState = {
  lastSyncAt: null,
  contactsSynced: 0,
  dealsSynced: 0,
  activitiesSynced: 0,
  errors: []
};

// ============================================
// CRM CLIENT
// ============================================

class REZCRMClient {
  constructor(config = {}) {
    this.baseUrl = config.baseUrl || crmConfig.baseUrl;
    this.apiKey = config.apiKey || crmConfig.apiKey;
  }

  get headers() {
    return {
      'Content-Type': 'application/json',
      ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` })
    };
  }

  async request(method, endpoint, data = null) {
    try {
      const response = await axios({
        method,
        url: `${this.baseUrl}${endpoint}`,
        headers: this.headers,
        data
      });
      return response.data;
    } catch (error) {
      console.error(`CRM API Error: ${method} ${endpoint}`, error.message);
      throw error;
    }
  }

  // ============================================
  // CONTACTS
  // ============================================

  async getContacts(params = {}) {
    return this.request('GET', '/api/contacts', null);
  }

  async getContact(id) {
    return this.request('GET', `/api/contacts/${id}`);
  }

  async createContact(data) {
    return this.request('POST', '/api/contacts', data);
  }

  async updateContact(id, data) {
    return this.request('PUT', `/api/contacts/${id}`, data);
  }

  async deleteContact(id) {
    return this.request('DELETE', `/api/contacts/${id}`);
  }

  async searchContacts(query) {
    return this.request('GET', `/api/contacts/search?q=${encodeURIComponent(query)}`);
  }

  // ============================================
  // COMPANIES
  // ============================================

  async getCompanies(params = {}) {
    return this.request('GET', '/api/companies');
  }

  async getCompany(id) {
    return this.request('GET', `/api/companies/${id}`);
  }

  async createCompany(data) {
    return this.request('POST', '/api/companies', data);
  }

  async updateCompany(id, data) {
    return this.request('PUT', `/api/companies/${id}`, data);
  }

  // ============================================
  // DEALS / OPPORTUNITIES
  // ============================================

  async getDeals(params = {}) {
    return this.request('GET', '/api/deals');
  }

  async getDeal(id) {
    return this.request('GET', `/api/deals/${id}`);
  }

  async createDeal(data) {
    return this.request('POST', '/api/deals', data);
  }

  async updateDeal(id, data) {
    return this.request('PUT', `/api/deals/${id}`, data);
  }

  async addDealNote(dealId, note) {
    return this.request('POST', `/api/deals/${dealId}/notes`, { content: note });
  }

  // ============================================
  // ACTIVITIES
  // ============================================

  async getActivities(contactId) {
    return this.request('GET', `/api/activities?contactId=${contactId}`);
  }

  async createActivity(data) {
    return this.request('POST', '/api/activities', data);
  }

  async logEmail(to, subject, body, contactId) {
    return this.createActivity({
      type: 'email',
      contactId,
      subject,
      body,
      direction: 'outbound',
      status: 'sent'
    });
  }

  async logCall(contactId, duration, outcome, notes) {
    return this.createActivity({
      type: 'call',
      contactId,
      duration,
      outcome,
      notes,
      direction: 'outbound'
    });
  }

  async logMeeting(contactId, title, startTime, endTime) {
    return this.createActivity({
      type: 'meeting',
      contactId,
      title,
      startTime,
      endTime,
      direction: 'outbound'
    });
  }

  // ============================================
  // PIPELINES
  // ============================================

  async getPipelines() {
    return this.request('GET', '/api/pipelines');
  }

  async getPipelineStages(pipelineId) {
    return this.request('GET', `/api/pipelines/${pipelineId}/stages`);
  }

  async moveDealToStage(dealId, stageId) {
    return this.updateDeal(dealId, { stageId });
  }

  // ============================================
  // TASKS
  // ============================================

  async createTask(data) {
    return this.request('POST', '/api/tasks', data);
  }

  async getTasks(contactId) {
    return this.request('GET', `/api/tasks?contactId=${contactId}`);
  }

  async completeTask(taskId) {
    return this.request('PUT', `/api/tasks/${taskId}`, { status: 'completed' });
  }
}

// Singleton client
const crmClient = new REZCRMClient();

// ============================================
// SYNC ENGINE
// ============================================

/**
 * Sync GTM prospect to CRM contact
 */
async function syncProspectToCRM(prospect) {
  try {
    // Check if contact already exists
    let crmContact;
    if (prospect.email) {
      const existing = await findCRMContactByEmail(prospect.email);
      if (existing) {
        crmContact = existing;
      }
    }

    const contactData = {
      firstName: prospect.firstName,
      lastName: prospect.lastName,
      email: prospect.email,
      phone: prospect.phone,
      title: prospect.title,
      company: prospect.company,
      website: prospect.companyDomain,
      linkedinUrl: prospect.linkedinUrl,
      location: prospect.location,
      tags: prospect.tags,
      source: prospect.source,
      // Custom fields for GTM data
      customFields: {
        gtmProspectId: prospect.id,
        gtmScores: prospect.scores,
        gtmStatus: prospect.status,
        gtmStage: prospect.stage,
        gtmLastContacted: prospect.lastContactedAt,
        gtmEnriched: prospect.enriched,
        gtmEngagement: prospect.engagement
      }
    };

    if (crmContact?.id) {
      // Update existing
      crmContact = await crmClient.updateContact(crmContact.id, contactData);
    } else {
      // Create new
      crmContact = await crmClient.createContact(contactData);
    }

    syncState.contactsSynced++;
    return crmContact;
  } catch (error) {
    syncState.errors.push({
      type: 'sync_prospect_to_crm',
      prospectId: prospect.id,
      error: error.message
    });
    return null;
  }
}

/**
 * Find CRM contact by email
 */
async function findCRMContactByEmail(email) {
  try {
    const results = await crmClient.searchContacts(email);
    return results.data?.find(c => c.email?.toLowerCase() === email.toLowerCase());
  } catch (error) {
    return null;
  }
}

/**
 * Sync CRM contact to GTM prospect
 */
async function syncContactToGTM(crmContact) {
  // This would use the prospect database
  const db = require('./prospect-database');

  const prospectData = {
    firstName: crmContact.firstName,
    lastName: crmContact.lastName,
    email: crmContact.email,
    phone: crmContact.phone,
    title: crmContact.title,
    company: crmContact.company,
    companyDomain: crmContact.website,
    linkedinUrl: crmContact.linkedinUrl,
    location: crmContact.location,
    tags: crmContact.tags || [],
    source: 'crm',
    enriched: true,
    status: mapCRMStatusToGTM(crmContact.status),
    stage: mapCRMStageToGTM(crmContact.stage),
    scores: crmContact.customFields?.gtmScores || { overall: 50 },
    customFields: {
      crmContactId: crmContact.id,
      originalData: crmContact
    }
  };

  // Check if prospect exists
  const existing = crmContact.customFields?.gtmProspectId ?
    db.get(crmContact.customFields.gtmProspectId) :
    db.getByEmail(crmContact.email);

  if (existing) {
    return db.update(existing.id, prospectData);
  } else {
    return db.create(prospectData);
  }
}

/**
 * Create deal in CRM from GTM prospect
 */
async function createCRMDeal(prospect, dealData = {}) {
  try {
    // First ensure contact exists in CRM
    const crmContact = await syncProspectToCRM(prospect);

    const deal = await crmClient.createDeal({
      title: dealData.title || `${prospect.company} - ${prospect.title}`,
      contactId: crmContact.id,
      value: dealData.value || prospect.scores?.revenue * 100 || 5000,
      stage: dealData.stage || 'qualification',
      source: 'gtm',
      notes: `
GTM Prospect Data:
- Score: ${prospect.scores?.overall || 'N/A'}
- Pain Points: ${(prospect.painPoints || []).join(', ')}
- Intent: ${prospect.scores?.intent || 'N/A'}
- Urgency: ${prospect.scores?.urgency || 'N/A'}

Generated Messages:
${(prospect.generatedMessages || []).map(m => `- ${m.channel}: ${m.subject || m.opener}`).join('\n')}
      `.trim()
    });

    syncState.dealsSynced++;
    return deal;
  } catch (error) {
    syncState.errors.push({
      type: 'create_crm_deal',
      prospectId: prospect.id,
      error: error.message
    });
    return null;
  }
}

/**
 * Log engagement to CRM
 */
async function logEngagementToCRM(prospectId, engagementType, data) {
  try {
    const db = require('./prospect-database');
    const prospect = db.get(prospectId);

    if (!prospect) return null;

    const crmContact = await findCRMContactByEmail(prospect.email);
    if (!crmContact) return null;

    switch (engagementType) {
      case 'email_sent':
        await crmClient.logEmail(
          prospect.email,
          data.subject,
          data.body,
          crmContact.id
        );
        break;

      case 'email_opened':
      case 'email_clicked':
      case 'email_replied':
        // Update activity status
        // In a real implementation, you'd find and update the activity
        break;

      case 'call':
        await crmClient.logCall(
          crmContact.id,
          data.duration || 0,
          data.outcome || 'completed',
          data.notes || ''
        );
        break;

      case 'meeting':
        await crmClient.logMeeting(
          crmContact.id,
          data.title || 'Discovery Call',
          data.startTime,
          data.endTime
        );
        break;
    }

    syncState.activitiesSynced++;
    return true;
  } catch (error) {
    syncState.errors.push({
      type: 'log_engagement_to_crm',
      prospectId,
      error: error.message
    });
    return null;
  }
}

/**
 * Full bidirectional sync
 */
async function fullSync(options = {}) {
  const { direction = 'both', batchSize = 50 } = options;
  const db = require('./prospect-database');

  syncState.lastSyncAt = new Date().toISOString();
  const startTime = Date.now();

  try {
    if (direction === 'gtm_to_crm' || direction === 'both') {
      // Sync GTM prospects to CRM
      const result = db.search({ limit: batchSize });
      for (const prospect of result.data) {
        await syncProspectToCRM(prospect);
      }
    }

    if (direction === 'crm_to_gtm' || direction === 'both') {
      // Sync CRM contacts to GTM
      try {
        const crmContacts = await crmClient.getContacts({ limit: batchSize });
        for (const contact of crmContacts.data || []) {
          await syncContactToGTM(contact);
        }
      } catch (error) {
        console.log('CRM not available, skipping CRM to GTM sync');
      }
    }

    syncState.syncDuration = Date.now() - startTime;
    return {
      success: true,
      state: syncState
    };
  } catch (error) {
    syncState.errors.push({
      type: 'full_sync',
      error: error.message
    });
    return {
      success: false,
      state: syncState,
      error: error.message
    };
  }
}

/**
 * Handle webhook from CRM
 */
async function handleCRMWebhook(payload) {
  const { event, data } = payload;

  switch (event) {
    case 'contact.created':
    case 'contact.updated':
      await syncContactToGTM(data);
      break;

    case 'contact.deleted':
      // Remove from GTM if linked
      if (data.customFields?.gtmProspectId) {
        const db = require('./prospect-database');
        db.delete(data.customFields.gtmProspectId);
      }
      break;

    case 'deal.created':
    case 'deal.stage_changed':
      // Update GTM prospect with deal info
      if (data.contactId) {
        const crmContact = await crmClient.getContact(data.contactId);
        if (crmContact?.customFields?.gtmProspectId) {
          const db = require('./prospect-database');
          db.update(crmContact.customFields.gtmProspectId, {
            stage: mapCRMStageToGTM(data.stage),
            customFields: { crmDealId: data.id }
          });
        }
      }
      break;

    case 'activity.created':
      // Sync engagement back to GTM
      if (data.contactId) {
        const crmContact = await crmClient.getContact(data.contactId);
        if (crmContact?.customFields?.gtmProspectId) {
          const db = require('./prospect-database');
          db.recordEngagement(crmContact.customFields.gtmProspectId, data.type, {
            crmActivityId: data.id,
            ...data
          });
        }
      }
      break;
  }

  return { received: true, event };
}

// ============================================
// MAPPINGS
// ============================================

function mapCRMStatusToGTM(crmStatus) {
  const mapping = {
    'new': 'new',
    'contacted': 'contacted',
    'qualified': 'qualified',
    'unqualified': 'churned'
  };
  return mapping[crmStatus] || 'new';
}

function mapCRMStageToGTM(crmStage) {
  const mapping = {
    'lead': 'lead',
    'qualified': 'mql',
    'proposal': 'sql',
    'negotiation': 'opportunity',
    'closed_won': 'customer',
    'closed_lost': 'churned'
  };
  return mapping[crmStage] || 'lead';
}

// ============================================
// UTILITIES
// ============================================

function getSyncState() {
  return {
    ...syncState,
    lastSyncAt: syncState.lastSyncAt,
    crmConnected: crmConfig.apiKey ? true : false
  };
}

function resetSyncState() {
  syncState.lastSyncAt = null;
  syncState.contactsSynced = 0;
  syncState.dealsSynced = 0;
  syncState.activitiesSynced = 0;
  syncState.errors = [];
  return syncState;
}

module.exports = {
  // Client
  client: crmClient,
  CRMClient: REZCRMClient,

  // Sync
  syncProspectToCRM,
  syncContactToGTM,
  createCRMDeal,
  logEngagementToCRM,
  fullSync,

  // Webhook
  handleCRMWebhook,

  // State
  getSyncState,
  resetSyncState
};