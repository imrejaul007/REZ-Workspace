import { v4 as uuidv4 } from 'uuid';
import { Contact, IContact } from '../models';
import { logger, contactOperationsTotal } from '../utils';
import { ContactDetails } from '../types';

export class ContactService {
  /**
   * Create a new contact for a client
   */
  async createContact(data: {
    clientId: string;
    name: string;
    email: string;
    phone?: string;
    role: string;
    department?: string;
    isPrimary?: boolean;
    metadata?: {
      birthday?: Date;
      linkedin?: string;
      timezone?: string;
      preferences?: Record<string, any>;
    };
  }): Promise<ContactDetails> {
    try {
      // Check if contact already exists for this client
      const existing = await Contact.findOne({ clientId: data.clientId, email: data.email });
      if (existing) {
        throw new Error('Contact with this email already exists for this client');
      }

      const contactId = `contact_${uuidv4()}`;

      // If this is set as primary, unset other primary contacts
      if (data.isPrimary) {
        await Contact.updateMany(
          { clientId: data.clientId, isPrimary: true },
          { isPrimary: false }
        );
      }

      const contact = new Contact({
        contactId,
        clientId: data.clientId,
        name: data.name,
        email: data.email,
        phone: data.phone,
        role: data.role,
        department: data.department,
        isPrimary: data.isPrimary || false,
        isActive: true,
        metadata: data.metadata || {},
      });

      await contact.save();

      contactOperationsTotal.inc({ operation: 'create', status: 'success' });
      logger.info('Contact created', { contactId, clientId: data.clientId, name: data.name });

      return this.formatContact(contact);
    } catch (error) {
      contactOperationsTotal.inc({ operation: 'create', status: 'error' });
      logger.error('Failed to create contact', { error, data });
      throw error;
    }
  }

  /**
   * Get contact by ID
   */
  async getContact(contactId: string): Promise<ContactDetails | null> {
    try {
      const contact = await Contact.findOne({ contactId });

      if (!contact) {
        logger.warn('Contact not found', { contactId });
        return null;
      }

      return this.formatContact(contact);
    } catch (error) {
      logger.error('Failed to get contact', { error, contactId });
      throw error;
    }
  }

  /**
   * Get all contacts for a client
   */
  async getClientContacts(
    clientId: string,
    options?: { includeInactive?: boolean; page?: number; limit?: number }
  ): Promise<{ contacts: ContactDetails[]; total: number }> {
    try {
      const filter: any = { clientId };

      if (!options?.includeInactive) {
        filter.isActive = true;
      }

      const page = options?.page || 1;
      const limit = options?.limit || 50;
      const skip = (page - 1) * limit;

      const [contacts, total] = await Promise.all([
        Contact.find(filter)
          .sort({ isPrimary: -1, createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Contact.countDocuments(filter),
      ]);

      return {
        contacts: contacts.map(c => this.formatContact(c as IContact)),
        total,
      };
    } catch (error) {
      logger.error('Failed to get client contacts', { error, clientId });
      throw error;
    }
  }

  /**
   * Update contact
   */
  async updateContact(
    contactId: string,
    data: {
      name?: string;
      email?: string;
      phone?: string;
      role?: string;
      department?: string;
      isPrimary?: boolean;
      isActive?: boolean;
      metadata?: {
        birthday?: Date;
        linkedin?: string;
        timezone?: string;
        preferences?: Record<string, any>;
      };
    }
  ): Promise<ContactDetails | null> {
    try {
      const contact = await Contact.findOne({ contactId });

      if (!contact) {
        logger.warn('Contact not found for update', { contactId });
        return null;
      }

      // If setting as primary, unset other primary contacts
      if (data.isPrimary && !contact.isPrimary) {
        await Contact.updateMany(
          { clientId: contact.clientId, isPrimary: true, contactId: { $ne: contactId } },
          { isPrimary: false }
        );
      }

      // Update fields
      if (data.name) contact.name = data.name;
      if (data.email) contact.email = data.email;
      if (data.phone !== undefined) contact.phone = data.phone;
      if (data.role) contact.role = data.role;
      if (data.department !== undefined) contact.department = data.department;
      if (data.isPrimary !== undefined) contact.isPrimary = data.isPrimary;
      if (data.isActive !== undefined) contact.isActive = data.isActive;
      if (data.metadata) {
        contact.metadata = {
          ...contact.metadata.toObject(),
          ...data.metadata,
        };
      }

      await contact.save();

      contactOperationsTotal.inc({ operation: 'update', status: 'success' });
      logger.info('Contact updated', { contactId, updates: Object.keys(data) });

      return this.formatContact(contact);
    } catch (error) {
      contactOperationsTotal.inc({ operation: 'update', status: 'error' });
      logger.error('Failed to update contact', { error, contactId });
      throw error;
    }
  }

  /**
   * Delete contact
   */
  async deleteContact(contactId: string): Promise<boolean> {
    try {
      const contact = await Contact.findOneAndDelete({ contactId });

      if (!contact) {
        return false;
      }

      contactOperationsTotal.inc({ operation: 'delete', status: 'success' });
      logger.info('Contact deleted', { contactId });

      return true;
    } catch (error) {
      contactOperationsTotal.inc({ operation: 'delete', status: 'error' });
      logger.error('Failed to delete contact', { error, contactId });
      throw error;
    }
  }

  /**
   * Get primary contact for a client
   */
  async getPrimaryContact(clientId: string): Promise<ContactDetails | null> {
    try {
      const contact = await Contact.findOne({ clientId, isPrimary: true });

      if (!contact) {
        return null;
      }

      return this.formatContact(contact);
    } catch (error) {
      logger.error('Failed to get primary contact', { error, clientId });
      throw error;
    }
  }

  /**
   * Search contacts
   */
  async searchContacts(query: string, options?: { limit?: number }): Promise<ContactDetails[]> {
    try {
      const contacts = await Contact.find({
        $or: [
          { name: { $regex: query, $options: 'i' } },
          { email: { $regex: query, $options: 'i' } },
          { role: { $regex: query, $options: 'i' } },
        ],
        isActive: true,
      })
        .limit(options?.limit || 20)
        .lean();

      return contacts.map(c => this.formatContact(c as IContact));
    } catch (error) {
      logger.error('Failed to search contacts', { error, query });
      throw error;
    }
  }

  /**
   * Format contact document
   */
  private formatContact(contact: any): ContactDetails {
    return {
      contactId: contact.contactId,
      clientId: contact.clientId,
      name: contact.name,
      email: contact.email,
      phone: contact.phone,
      role: contact.role,
      department: contact.department,
      isPrimary: contact.isPrimary,
      isActive: contact.isActive,
      metadata: contact.metadata?.toObject ? contact.metadata.toObject() : contact.metadata || {},
      createdAt: contact.createdAt,
      updatedAt: contact.updatedAt,
    };
  }
}

export const contactService = new ContactService();
export default contactService;