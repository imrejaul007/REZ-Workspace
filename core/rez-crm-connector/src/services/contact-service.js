/**
 * Contact Service - CRUD operations for contacts
 */

const winston = require('winston');

class ContactService {
  constructor(provider) {
    this.provider = provider;
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.json(),
      transports: [new winston.transports.Console()]
    });
  }

  async getContacts({ limit = 100, offset = 0 }) {
    try {
      const result = await this.provider.getContacts({ limit, offset });
      const contacts = result.records?.map(r =>
        this.provider.mapFromHubSpot
          ? this.provider.mapFromHubSpot(r)
          : r
      ) || [];

      return { contacts, total: result.total || contacts.length };
    } catch (error) {
      this.logger.error('Get contacts failed:', error);
      throw error;
    }
  }

  async getContactById(id) {
    try {
      const contact = await this.provider.getContactById(id);
      return this.provider.mapFromHubSpot
        ? this.provider.mapFromHubSpot(contact)
        : contact;
    } catch (error) {
      this.logger.error(`Get contact ${id} failed:`, error);
      throw error;
    }
  }

  async createContact(contactData) {
    try {
      const contact = await this.provider.createContact(contactData);
      this.logger.info(`Contact created: ${contact.id}`);
      return this.provider.mapFromHubSpot
        ? this.provider.mapFromHubSpot(contact)
        : contact;
    } catch (error) {
      this.logger.error('Create contact failed:', error);
      throw error;
    }
  }

  async updateContact(id, contactData) {
    try {
      const contact = await this.provider.updateContact(id, contactData);
      this.logger.info(`Contact updated: ${id}`);
      return this.provider.mapFromHubSpot
        ? this.provider.mapFromHubSpot(contact)
        : contact;
    } catch (error) {
      this.logger.error(`Update contact ${id} failed:`, error);
      throw error;
    }
  }

  async deleteContact(id) {
    try {
      await this.provider.deleteContact(id);
      this.logger.info(`Contact deleted: ${id}`);
      return { success: true };
    } catch (error) {
      this.logger.error(`Delete contact ${id} failed:`, error);
      throw error;
    }
  }

  async search(query, type = 'contacts') {
    try {
      const results = await this.provider.searchContacts(query);
      return results.records?.map(r =>
        this.provider.mapFromHubSpot
          ? this.provider.mapFromHubSpot(r)
          : r
      ) || [];
    } catch (error) {
      this.logger.error('Search failed:', error);
      throw error;
    }
  }

  async batchCreate(contacts) {
    try {
      const result = await this.provider.batchCreateContacts(contacts);
      this.logger.info(`Batch created ${result.ids?.length || 0} contacts`);
      return result;
    } catch (error) {
      this.logger.error('Batch create failed:', error);
      throw error;
    }
  }

  async batchUpdate(contacts) {
    try {
      const result = await this.provider.batchUpdateContacts(contacts);
      this.logger.info(`Batch updated ${contacts.length} contacts`);
      return result;
    } catch (error) {
      this.logger.error('Batch update failed:', error);
      throw error;
    }
  }
}

module.exports = ContactService;
