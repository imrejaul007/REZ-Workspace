/**
 * HubSpot CRM Provider
 * Supports: Hotels, Real Estate, Professional Services, Non-Profits
 */

const axios = require('axios');
const winston = require('winston');

class HubSpotProvider {
  constructor(config) {
    this.apiKey = config.apiKey;
    this.baseUrl = 'https://api.hubapi.com';
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.json(),
      transports: [new winston.transports.Console()]
    });
  }

  async initialize() {
    try {
      // Verify API connection
      await axios.get(`${this.baseUrl}/crm/v3/pipelines/contacts`, {
        headers: { Authorization: `Bearer ${this.apiKey}` }
      });
      this.logger.info('HubSpot provider initialized');
    } catch (error) {
      this.logger.error('HubSpot initialization failed:', error.message);
      throw error;
    }
  }

  // Contact Operations
  async getContacts({ limit = 100, after = 0 }) {
    const response = await axios.get(`${this.baseUrl}/crm/v3/objects/contacts`, {
      headers: { Authorization: `Bearer ${this.apiKey}` },
      params: { limit, after }
    });
    return response.data;
  }

  async getContactById(id) {
    const response = await axios.get(`${this.baseUrl}/crm/v3/objects/contacts/${id}`, {
      headers: { Authorization: `Bearer ${this.apiKey}` }
    });
    return response.data;
  }

  async createContact(contact) {
    const properties = this.mapToHubSpot(contact);
    const response = await axios.post(`${this.baseUrl}/crm/v3/objects/contacts`, {
      properties
    }, {
      headers: { Authorization: `Bearer ${this.apiKey}`, 'Content-Type': 'application/json' }
    });
    return response.data;
  }

  async updateContact(id, contact) {
    const properties = this.mapToHubSpot(contact);
    const response = await axios.patch(`${this.baseUrl}/crm/v3/objects/contacts/${id}`, {
      properties
    }, {
      headers: { Authorization: `Bearer ${this.apiKey}`, 'Content-Type': 'application/json' }
    });
    return response.data;
  }

  async deleteContact(id) {
    await axios.delete(`${this.baseUrl}/crm/v3/objects/contacts/${id}`, {
      headers: { Authorization: `Bearer ${this.apiKey}` }
    });
    return { success: true };
  }

  async searchContacts(query) {
    const response = await axios.post(`${this.baseUrl}/crm/v3/objects/contacts/search`, {
      query,
      limit: 20
    }, {
      headers: { Authorization: `Bearer ${this.apiKey}`, 'Content-Type': 'application/json' }
    });
    return response.data;
  }

  // Property Mapping
  mapToHubSpot(contact) {
    return {
      email: contact.email,
      firstname: contact.firstName || contact.name?.split(' ')[0],
      lastname: contact.lastName || contact.name?.split(' ').slice(1).join(' '),
      phone: contact.phone,
      company: contact.company,
      jobtitle: contact.jobTitle,
      address: contact.address?.street,
      city: contact.address?.city,
      state: contact.address?.state,
      zip: contact.address?.zip,
      country: contact.address?.country,
      ...contact.customFields
    };
  }

  mapFromHubSpot(hubspotContact) {
    const { id, properties } = hubspotContact;
    return {
      crmId: id,
      crmType: 'hubspot',
      email: properties.email,
      firstName: properties.firstname,
      lastName: properties.lastname,
      name: `${properties.firstname || ''} ${properties.lastname || ''}`.trim(),
      phone: properties.phone,
      company: properties.company,
      jobTitle: properties.jobtitle,
      address: {
        street: properties.address,
        city: properties.city,
        state: properties.state,
        zip: properties.zip,
        country: properties.country
      },
      createdAt: properties.createdate,
      updatedAt: properties.lastmodifieddate
    };
  }

  // Batch Operations
  async batchCreateContacts(contacts) {
    const inputs = contacts.map(c => ({ properties: this.mapToHubSpot(c) }));
    const response = await axios.post(`${this.baseUrl}/crm/v3/objects/contacts/batch/create`, {
      inputs
    }, {
      headers: { Authorization: `Bearer ${this.apiKey}`, 'Content-Type': 'application/json' }
    });
    return response.data;
  }

  async batchUpdateContacts(contacts) {
    const inputs = contacts.map(c => ({
      id: c.id,
      properties: this.mapToHubSpot(c)
    }));
    const response = await axios.post(`${this.baseUrl}/crm/v3/objects/contacts/batch/update`, {
      inputs
    }, {
      headers: { Authorization: `Bearer ${this.apiKey}`, 'Content-Type': 'application/json' }
    });
    return response.data;
  }

  // Deals (for Real Estate, Hospitality)
  async getDeals({ limit = 100, after = 0 }) {
    const response = await axios.get(`${this.baseUrl}/crm/v3/objects/deals`, {
      headers: { Authorization: `Bearer ${this.apiKey}` },
      params: { limit, after }
    });
    return response.data;
  }

  async createDeal(deal) {
    const response = await axios.post(`${this.baseUrl}/crm/v3/objects/deals`, {
      properties: {
        dealname: deal.name,
        amount: deal.amount,
        dealstage: deal.stage,
        closedate: deal.closeDate,
        pipeline: deal.pipeline
      }
    }, {
      headers: { Authorization: `Bearer ${this.apiKey}`, 'Content-Type': 'application/json' }
    });
    return response.data;
  }
}

module.exports = HubSpotProvider;
