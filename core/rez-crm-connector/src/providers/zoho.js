/**
 * Zoho CRM Provider
 * Supports: Small businesses, startups, retail
 */

const axios = require('axios');
const winston = require('winston');

class ZohoProvider {
  constructor(config) {
    this.apiKey = config.apiKey;
    this.refreshToken = config.refreshToken;
    this.clientId = config.clientId;
    this.clientSecret = config.clientSecret;
    this.baseUrl = 'https://www.zohoapis.com/crm/v3';
    this.accessToken = null;
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.json(),
      transports: [new winston.transports.Console()]
    });
  }

  async initialize() {
    try {
      // Get access token using refresh token
      const tokenResponse = await axios.post(
        'https://accounts.zoho.com/oauth/v2/token',
        null,
        {
          params: {
            grant_type: 'refresh_token',
            client_id: this.clientId,
            client_secret: this.clientSecret,
            refresh_token: this.refreshToken
          }
        }
      );
      this.accessToken = tokenResponse.data.access_token;
      this.logger.info('Zoho provider initialized');
    } catch (error) {
      this.logger.error('Zoho initialization failed:', error.message);
      throw error;
    }
  }

  getHeaders() {
    return {
      'Authorization': `Zoho-oauthtoken ${this.accessToken}`,
      'Content-Type': 'application/json'
    };
  }

  // Contact Operations
  async getContacts({ page = 1, perPage = 200 }) {
    const response = await axios.get(`${this.baseUrl}/Contacts`, {
      headers: this.getHeaders(),
      params: { page, per_page: perPage }
    });
    return response.data;
  }

  async getContactById(id) {
    const response = await axios.get(`${this.baseUrl}/Contacts/${id}`, {
      headers: this.getHeaders()
    });
    return response.data;
  }

  async createContact(contact) {
    const data = {
      data: [{
        ...this.mapToZoho(contact)
      }]
    };
    const response = await axios.post(`${this.baseUrl}/Contacts`, data, {
      headers: this.getHeaders()
    });
    return response.data;
  }

  async updateContact(id, contact) {
    const data = {
      data: [{
        id,
        ...this.mapToZoho(contact)
      }]
    };
    const response = await axios.put(`${this.baseUrl}/Contacts/${id}`, data, {
      headers: this.getHeaders()
    });
    return response.data;
  }

  async deleteContact(id) {
    await axios.delete(`${this.baseUrl}/Contacts/${id}`, {
      headers: this.getHeaders()
    });
    return { success: true };
  }

  async searchContacts(query) {
    const response = await axios.get(`${this.baseUrl}/Contacts/search`, {
      headers: this.getHeaders(),
      params: { word: query }
    });
    return response.data;
  }

  // Property Mapping
  mapToZoho(contact) {
    return {
      Email: contact.email,
      First_Name: contact.firstName || contact.name?.split(' ')[0],
      Last_Name: contact.lastName || contact.name?.split(' ').slice(1).join(' '),
      Phone: contact.phone,
      Mobile: contact.mobile,
      Company: contact.company,
      Designation: contact.jobTitle,
      Mailing_Street: contact.address?.street,
      Mailing_City: contact.address?.city,
      Mailing_State: contact.address?.state,
      Mailing_Zip: contact.address?.zip,
      Mailing_Country: contact.address?.country,
      ...contact.customFields
    };
  }

  mapFromZoho(zohoContact) {
    const { id, ...data } = zohoContact;
    return {
      crmId: id,
      crmType: 'zoho',
      email: data.Email,
      firstName: data.First_Name,
      lastName: data.Last_Name,
      name: `${data.First_Name || ''} ${data.Last_Name || ''}`.trim(),
      phone: data.Phone,
      mobile: data.Mobile,
      company: data.Company,
      jobTitle: data.Designation,
      address: {
        street: data.Mailing_Street,
        city: data.Mailing_City,
        state: data.Mailing_State,
        zip: data.Mailing_Zip,
        country: data.Mailing_Country
      }
    };
  }
}

module.exports = ZohoProvider;
