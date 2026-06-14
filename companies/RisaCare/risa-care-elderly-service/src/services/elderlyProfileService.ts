import { v4 as uuidv4 } from 'uuid';
import {
  ElderlyProfile,
  CreateProfileDTO,
  UpdateProfileDTO,
  EmergencyContact,
  ElderlyProfileSchema,
} from '../models/elderlyCare';
import {
  ElderlyProfileModel,
  IElderlyProfile,
} from '../models/mongodb';
import logger from '../utils/logger';

export class ElderlyProfileService {
  /**
   * Create a new elderly patient profile
   */
  async createProfile(dto: CreateProfileDTO): Promise<ElderlyProfile> {
    logger.info('Creating elderly profile', { userId: dto.userId });

    const existingProfile = await ElderlyProfileModel.findOne({ userId: dto.userId });
    if (existingProfile) {
      logger.warn('Profile already exists', { userId: dto.userId });
      throw new Error(`Profile already exists for user ${dto.userId}`);
    }

    const profileData = {
      ...dto,
      fallHistory: [],
      emergencyContacts: dto.emergencyContacts || [],
      medicalConditions: dto.medicalConditions || [],
      medications: dto.medications || [],
    };

    const profile = new ElderlyProfileModel(profileData);
    await profile.save();

    logger.info('Elderly profile created successfully', { userId: dto.userId, profileId: profile._id });

    return profile.toObject() as ElderlyProfile;
  }

  /**
   * Get elderly profile by user ID
   */
  async getProfile(userId: string): Promise<ElderlyProfile | null> {
    logger.info('Fetching elderly profile', { userId });

    const profile = await ElderlyProfileModel.findOne({ userId }).lean();
    if (!profile) {
      logger.warn('Profile not found', { userId });
      return null;
    }

    return profile as unknown as ElderlyProfile;
  }

  /**
   * Update elderly profile
   */
  async updateProfile(userId: string, dto: UpdateProfileDTO): Promise<ElderlyProfile> {
    logger.info('Updating elderly profile', { userId });

    const existingProfile = await ElderlyProfileModel.findOne({ userId });
    if (!existingProfile) {
      logger.warn('Profile not found for update', { userId });
      throw new Error(`Profile not found for user ${userId}`);
    }

    // Ensure emergency contacts have proper structure
    if (dto.emergencyContacts) {
      dto.emergencyContacts = dto.emergencyContacts.map(contact => ({
        ...contact,
        id: contact.id || uuidv4(),
      }));
    }

    // Update the profile
    Object.assign(existingProfile, dto);
    existingProfile.updatedAt = new Date();
    await existingProfile.save();

    logger.info('Elderly profile updated successfully', { userId });

    return existingProfile.toObject() as ElderlyProfile;
  }

  /**
   * Add emergency contact to profile
   */
  async addEmergencyContact(userId: string, contact: Omit<EmergencyContact, 'id'>): Promise<EmergencyContact> {
    logger.info('Adding emergency contact', { userId });

    const profile = await ElderlyProfileModel.findOne({ userId });
    if (!profile) {
      logger.warn('Profile not found for adding emergency contact', { userId });
      throw new Error(`Profile not found for user ${userId}`);
    }

    const newContact: EmergencyContact = {
      ...contact,
      id: uuidv4(),
    };

    // If this is the first contact or marked as primary, ensure it's primary
    if (newContact.isPrimary || profile.emergencyContacts.length === 0) {
      // Remove primary from other contacts
      profile.emergencyContacts = profile.emergencyContacts.map(c => ({
        ...c,
        isPrimary: false,
      }));
      newContact.isPrimary = true;
    }

    profile.emergencyContacts.push(newContact);
    profile.updatedAt = new Date();
    await profile.save();

    logger.info('Emergency contact added successfully', { userId, contactId: newContact.id });

    return newContact;
  }

  /**
   * Remove emergency contact from profile
   */
  async removeEmergencyContact(userId: string, contactId: string): Promise<boolean> {
    logger.info('Removing emergency contact', { userId, contactId });

    const profile = await ElderlyProfileModel.findOne({ userId });
    if (!profile) {
      logger.warn('Profile not found for removing emergency contact', { userId });
      throw new Error(`Profile not found for user ${userId}`);
    }

    const index = profile.emergencyContacts.findIndex(c => c.id === contactId);
    if (index === -1) {
      logger.warn('Emergency contact not found', { userId, contactId });
      return false;
    }

    const removedContact = profile.emergencyContacts[index];
    profile.emergencyContacts.splice(index, 1);
    profile.updatedAt = new Date();

    // If removed contact was primary, make the first remaining contact primary
    if (removedContact.isPrimary && profile.emergencyContacts.length > 0) {
      profile.emergencyContacts[0].isPrimary = true;
    }

    await profile.save();
    logger.info('Emergency contact removed successfully', { userId, contactId });

    return true;
  }

  /**
   * Get all profiles (for admin/caregiver view)
   */
  async getAllProfiles(careGiverId?: string): Promise<ElderlyProfile[]> {
    logger.info('Fetching all profiles', { careGiverId });

    const query = careGiverId ? { careGiverId } : {};
    const profiles = await ElderlyProfileModel.find(query).lean();

    return profiles as unknown as ElderlyProfile[];
  }

  /**
   * Delete profile
   */
  async deleteProfile(userId: string): Promise<boolean> {
    logger.info('Deleting elderly profile', { userId });

    const result = await ElderlyProfileModel.deleteOne({ userId });
    if (result.deletedCount > 0) {
      logger.info('Profile deleted successfully', { userId });
      return true;
    }

    logger.warn('Profile not found for deletion', { userId });
    return false;
  }

  /**
   * Add fall incident to history
   */
  async addFallToHistory(userId: string, fall: { date: Date; severity: string; location: string; cause?: string }): Promise<void> {
    logger.info('Adding fall to history', { userId });

    const profile = await ElderlyProfileModel.findOne({ userId });
    if (!profile) {
      throw new Error(`Profile not found for user ${userId}`);
    }

    profile.fallHistory.push({
      date: fall.date,
      severity: fall.severity as 'minor' | 'moderate' | 'severe' | 'injury',
      location: fall.location,
      cause: fall.cause,
    });
    profile.updatedAt = new Date();

    await profile.save();
    logger.info('Fall added to history', { userId });
  }
}

export const elderlyProfileService = new ElderlyProfileService();
export default elderlyProfileService;