/**
 * Salesforce Provider
 * Supports: Enterprise businesses, government, non-profits
 */

const axios = require('axios');
const winston = require('winston');

class SalesforceProvider {
  constructor(config) {
    this.clientId = config.clientId;
    this.clientSecret = config.clientSecret;
    this.username = config.username;
    this.password = config.password;
    this.securityToken = config.securityToken;
    this.baseUrl = null;
    this.accessToken = null;
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.json(),
      transports: [new winston.transports.Console()]
    });
  }

  async initialize() {
    try {
      // Authenticate using OAuth 2.0 Password Flow
      const response = await axios.post(
        `${process.env.SALESFORCE_LOGIN_URL}/services/oauth2/token`,
        new URLSearchParams({
          grant_type: 'password',
          client_id: this.clientId,
          client_secret: this.clientSecret,
          username: this.username,
          password: `${this.password}${this.securityToken}`
        }),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
      );

      this.accessToken = response.data.access_token;
      this.instanceUrl = response.data.instance_url;
      this.baseUrl = `${this.instanceUrl}/services/data/v58.0`;

      this.logger.info('Salesforce provider initialized');
    } catch (error) {
      this.logger.error('Salesforce initialization failed:', error.message);
      throw error;
    }
  }

  getHeaders() {
    return {
      'Authorization': `Bearer ${this.accessToken}`,
      'Content-Type': 'application/json'
    };
  }

  // Contact Operations
  async getContacts({ limit = 100, offset = 0 }) {
    const response = await axios.get(`${this.baseUrl}/query`, {
      headers: this.getHeaders(),
      params: {
        q: `SELECT Id, Name, Email, Phone, AccountId FROM Contact LIMIT ${limit} OFFSET ${offset}`
      }
    });
    return { records: response.data.records, totalSize: response.data.totalSize };
  }

  async getContactById(id) {
    const response = await axios.get(`${this.baseUrl}/sobjects/Contact/${id}`, {
      headers: this.getHeaders()
    });
    return response.data;
  }

  async createContact(contact) {
    const response = await axios.post(`${this.baseUrl}/sobjects/Contact`, {
      ...this.mapToSalesforce(contact)
    }, {
      headers: this.getHeaders()
    });
    return response.data;
  }

  async updateContact(id, contact) {
    await axios.patch(`${this.baseUrl}/sobjects/Contact/${id}`, {
      ...this.mapToSalesforce(contact)
    }, {
      headers: this.getHeaders()
    });
    return { success: true, id };
  }

  async deleteContact(id) {
    await axios.delete(`${this.baseUrl}/sobjects/Contact/${id}`, {
      headers: this.getHeaders()
    });
    return { success: true };
  }

  // SOQL Query
  async query(soql) {
    const response = await axios.get(`${this.baseUrl}/query`, {
      headers: this.getHeaders(),
      params: { q: soql }
    });
    return response.data;
  }

  // Account Operations
  async getAccounts({ limit = 100 }) {
    const response = await axios.get(`${this.baseUrl}/query`, {
      headers: this.getHeaders(),
      params: {
        q: `SELECT Id, Name, Type, Industry, Website FROM Account LIMIT ${limit}`
      }
    });
    return response.data;
  }

  // Property Mapping
  mapToSalesforce(contact) {
    return {
      FirstName: contact.firstName || contact.name?.split(' ')[0],
      LastName: contact.lastName || contact.name?.split(' ').slice(1).join(' ') || 'Unknown',
      Email: contact.email,
      Phone: contact.phone,
      AccountId: contact.accountId,
      Title: contact.jobTitle
    };
  }

  mapFromSalesforce(sfContact) {
    return {
      crmId: sfContact.Id,
      crmType: 'salesforce',
      firstName: sfContact.FirstName,
      lastName: sfContact.LastName,
      name: `${sfContact.FirstName || ''} ${sfContact.LastName || ''}`.trim(),
      email: sfContact.Email,
      phone: sfContact.Phone,
      accountId: sfContact.AccountId,
      jobTitle: sfContact.Title
    };
  }
}

module.exports = SalesforceProvider;
