import { v4 as uuidv4 } from 'uuid';
import {
  Counselor,
  CounselorSchema,
  TherapySession,
  TherapySessionSchema,
  MentalHealthProfile,
  MentalHealthProfileSchema,
  MentalHealthCondition,
  TherapyType,
  ApiResponse,
  PaginatedResponse
} from '../models/mentalHealth.js';

// In-memory storage
const counselors: Map<string, Counselor> = new Map();
const sessions: Map<string, TherapySession[]> = new Map();
const profiles: Map<string, MentalHealthProfile> = new Map();

// Seed some sample counselors
const seedCounselors = () => {
  const sampleCounselors: Omit<Counselor, 'counselorId'>[] = [
    {
      name: 'Dr. Priya Sharma',
      title: 'Clinical Psychologist',
      specialization: ['anxiety', 'depression', 'trauma', 'ptsd'],
      therapyTypes: ['cognitive_behavioral', 'emdr', 'trauma_informed'],
      languages: ['en', 'hi'],
      pricePerSession: 2000,
      rating: 4.9,
      reviewCount: 127,
      yearsOfExperience: 12,
      sessionsCompleted: 2150,
      bio: 'Specializing in trauma recovery and anxiety management with 12+ years of experience.',
      credentials: [
        { degree: 'Ph.D. Clinical Psychology', institution: 'AIIMS Delhi', year: 2012, license: 'RCI-12345' }
      ],
      availability: {
        monday: [{ start: '09:00', end: '17:00' }],
        tuesday: [{ start: '09:00', end: '17:00' }],
        wednesday: [{ start: '09:00', end: '13:00' }],
        thursday: [{ start: '09:00', end: '17:00' }],
        friday: [{ start: '09:00', end: '15:00' }]
      }
    },
    {
      name: 'Dr. Rajesh Kumar',
      title: 'Psychiatrist',
      specialization: ['depression', 'bipolar', 'anxiety', 'insomnia'],
      therapyTypes: ['cognitive_behavioral', 'psychodynamic', 'mindfulness'],
      languages: ['en', 'hi', 'ta'],
      pricePerSession: 2500,
      rating: 4.8,
      reviewCount: 98,
      yearsOfExperience: 15,
      sessionsCompleted: 3200,
      bio: 'Expert in mood disorders and psychiatric care with dual specialization.',
      credentials: [
        { degree: 'MD Psychiatry', institution: 'PGIMER Chandigarh', year: 2009, license: 'MC-45678' }
      ],
      availability: {
        monday: [{ start: '10:00', end: '18:00' }],
        tuesday: [{ start: '10:00', end: '18:00' }],
        wednesday: [{ start: '10:00', end: '18:00' }],
        thursday: [{ start: '10:00', end: '18:00' }],
        friday: [{ start: '10:00', end: '16:00' }]
      }
    },
    {
      name: 'Ms. Ananya Patel',
      title: 'Counseling Psychologist',
      specialization: ['general', 'stress', 'relationship', 'grief'],
      therapyTypes: ['humanistic', 'solution_focused', 'mindfulness'],
      languages: ['en', 'gu', 'hi'],
      pricePerSession: 1500,
      rating: 4.7,
      reviewCount: 156,
      yearsOfExperience: 8,
      sessionsCompleted: 1800,
      bio: 'Warm and empathetic approach to personal growth and emotional well-being.',
      credentials: [
        { degree: 'M.Phil Clinical Psychology', institution: 'MGM University', year: 2016, license: 'RCI-78901' }
      ],
      availability: {
        monday: [{ start: '11:00', end: '19:00' }],
        tuesday: [{ start: '11:00', end: '19:00' }],
        wednesday: [{ start: '11:00', end: '19:00' }],
        thursday: [{ start: '11:00', end: '19:00' }],
        saturday: [{ start: '10:00', end: '14:00' }]
      }
    },
    {
      name: 'Dr. Vikram Singh',
      title: 'Clinical Psychologist',
      specialization: ['anxiety', 'panic_disorder', 'social_anxiety', 'ocd'],
      therapyTypes: ['cognitive_behavioral', 'exposure_therapy', 'dialectical_behavioral'],
      languages: ['en', 'hi', 'pa'],
      pricePerSession: 1800,
      rating: 4.85,
      reviewCount: 89,
      yearsOfExperience: 10,
      sessionsCompleted: 1500,
      bio: 'Specialized in anxiety disorders with evidence-based CBT techniques.',
      credentials: [
        { degree: 'Psy.D. Clinical Psychology', institution: 'IIT Delhi', year: 2014, license: 'RCI-34567' }
      ],
      availability: {
        monday: [{ start: '08:00', end: '16:00' }],
        tuesday: [{ start: '08:00', end: '16:00' }],
        wednesday: [{ start: '08:00', end: '16:00' }],
        thursday: [{ start: '08:00', end: '16:00' }],
        friday: [{ start: '08:00', end: '14:00' }]
      }
    },
    {
      name: 'Dr. Meera Nair',
      title: 'Child Psychologist',
      specialization: ['adhd', 'anxiety', 'trauma', 'general'],
      therapyTypes: ['play_therapy', 'cognitive_behavioral', 'family_systems'],
      languages: ['en', 'ml', 'ta'],
      pricePerSession: 2200,
      rating: 4.95,
      reviewCount: 73,
      yearsOfExperience: 14,
      sessionsCompleted: 2800,
      bio: 'Dedicated to helping children and families navigate emotional challenges.',
      credentials: [
        { degree: 'Ph.D. Child Psychology', institution: 'NIMHANS', year: 2010, license: 'RCI-89012' }
      ],
      availability: {
        monday: [{ start: '10:00', end: '18:00' }],
        tuesday: [{ start: '10:00', end: '18:00' }],
        wednesday: [{ start: '14:00', end: '18:00' }],
        thursday: [{ start: '10:00', end: '18:00' }],
        friday: [{ start: '10:00', end: '16:00' }],
        saturday: [{ start: '10:00', end: '14:00' }]
      }
    }
  ];

  sampleCounselors.forEach((counselor, index) => {
    const id = `counselor-${index + 1}`;
    counselors.set(id, { ...counselor, counselorId: id });
  });
};

seedCounselors();

/**
 * Therapy Service
 * Handles counselor management, session booking, and therapy tracking
 */
export class TherapyService {
  /**
   * Find counselors based on criteria
   */
  async findCounselors(filters: {
    specialization?: MentalHealthCondition[];
    language?: string;
    minRating?: number;
    maxPrice?: number;
    therapyType?: TherapyType;
    page?: number;
    limit?: number;
  } = {}): Promise<PaginatedResponse<Counselor>> {
    try {
      let results = Array.from(counselors.values());

      if (filters.specialization && filters.specialization.length > 0) {
        results = results.filter(c =>
          filters.specialization!.some(s => c.specialization.includes(s))
        );
      }

      if (filters.language) {
        results = results.filter(c => c.languages.includes(filters.language!));
      }

      if (filters.minRating !== undefined) {
        results = results.filter(c => c.rating >= filters.minRating!);
      }

      if (filters.maxPrice !== undefined) {
        results = results.filter(c => c.pricePerSession <= filters.maxPrice!);
      }

      if (filters.therapyType) {
        results = results.filter(c => c.therapyTypes.includes(filters.therapyType!));
      }

      // Sort by rating (highest first)
      results.sort((a, b) => b.rating - a.rating);

      const page = filters.page || 1;
      const limit = filters.limit || 10;
      const total = results.length;
      const start = (page - 1) * limit;
      const paginated = results.slice(start, start + limit);

      return {
        success: true,
        data: paginated,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      return {
        success: false,
        data: [],
        pagination: { page: 1, limit: 10, total: 0, totalPages: 0 }
      } as unknown as PaginatedResponse<Counselor>;
    }
  }

  /**
   * Get counselor details by ID
   */
  async getCounselor(counselorId: string): Promise<ApiResponse<Counselor>> {
    try {
      const counselor = counselors.get(counselorId);

      if (!counselor) {
        return {
          success: false,
          error: 'Counselor not found'
        };
      }

      return {
        success: true,
        data: counselor
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get counselor'
      };
    }
  }

  /**
   * Book a therapy session
   */
  async bookSession(data: {
    userId: string;
    providerId: string;
    type: 'individual' | 'group' | 'couples' | 'family';
    therapyType?: TherapyType;
    date: Date;
    duration?: number;
    counselorId?: string;
    therapistId?: string;
  }): Promise<ApiResponse<TherapySession>> {
    try {
      const counselor = counselors.get(data.providerId);

      if (!counselor) {
        return {
          success: false,
          error: 'Provider not found'
        };
      }

      const session: TherapySession = {
        id: uuidv4(),
        userId: data.userId,
        providerId: data.providerId,
        type: data.type,
        therapyType: data.therapyType,
        date: new Date(data.date),
        duration: data.duration || counselor.duration,
        status: 'scheduled',
        counselorId: data.counselorId || data.providerId,
        therapistId: data.therapistId,
        cost: counselor.pricePerSession,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const validationResult = TherapySessionSchema.safeParse(session);
      if (!validationResult.success) {
        return {
          success: false,
          error: validationResult.error.errors[0]?.message || 'Validation failed'
        };
      }

      const userSessions = sessions.get(data.userId) || [];
      userSessions.push(validationResult.data);
      sessions.set(data.userId, userSessions);

      // Update user profile with counselor
      let profile = profiles.get(data.userId);
      if (!profile) {
        profile = {
          userId: data.userId,
          conditions: [],
          therapies: [],
          supportGroupIds: [],
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        };
      }

      if (data.type === 'individual' && data.counselorId) {
        profile.counselorId = data.counselorId;
      }

      profile.updatedAt = new Date();
      profiles.set(data.userId, profile);

      return {
        success: true,
        data: validationResult.data,
        message: 'Session booked successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to book session'
      };
    }
  }

  /**
   * Get sessions for a user
   */
  async getSessions(
    userId: string,
    filters: {
      status?: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
      startDate?: Date;
      endDate?: Date;
      limit?: number;
      page?: number;
    } = {}
  ): Promise<ApiResponse<TherapySession[]>> {
    try {
      let userSessions = sessions.get(userId) || [];

      if (filters.status) {
        userSessions = userSessions.filter(s => s.status === filters.status);
      }

      if (filters.startDate) {
        userSessions = userSessions.filter(s => s.date >= filters.startDate!);
      }

      if (filters.endDate) {
        userSessions = userSessions.filter(s => s.date <= filters.endDate!);
      }

      // Sort by date descending
      userSessions.sort((a, b) => b.date.getTime() - a.date.getTime());

      const page = filters.page || 1;
      const limit = filters.limit || 20;
      const start = (page - 1) * limit;
      const paginated = userSessions.slice(start, start + limit);

      return {
        success: true,
        data: paginated,
        message: `Retrieved ${paginated.length} sessions`
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get sessions'
      };
    }
  }

  /**
   * Get upcoming sessions for a user
   */
  async getUpcomingSessions(userId: string): Promise<ApiResponse<TherapySession[]>> {
    try {
      const now = new Date();
      const userSessions = sessions.get(userId) || [];

      const upcoming = userSessions
        .filter(s => s.date > now && s.status === 'scheduled')
        .sort((a, b) => a.date.getTime() - b.date.getTime());

      return {
        success: true,
        data: upcoming
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get upcoming sessions'
      };
    }
  }

  /**
   * Get homework for a user
   */
  async getHomework(userId: string): Promise<ApiResponse<{ session: TherapySession; homework: NonNullable<TherapySession['homework']> }[]>> {
    try {
      const userSessions = sessions.get(userId) || [];

      const homework = userSessions
        .filter(s => s.homework && !s.homework.completed)
        .map(s => ({
          session: s,
          homework: s.homework!
        }));

      return {
        success: true,
        data: homework
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get homework'
      };
    }
  }

  /**
   * Complete a therapy session
   */
  async completeSession(
    sessionId: string,
    userId: string,
    data: {
      sessionNotes?: string;
      homework?: { description: string; dueDate?: Date };
      nextSession?: Date;
      rating?: number;
      feedback?: string;
    }
  ): Promise<ApiResponse<TherapySession>> {
    try {
      const userSessions = sessions.get(userId);
      if (!userSessions) {
        return {
          success: false,
          error: 'No sessions found for user'
        };
      }

      const sessionIndex = userSessions.findIndex(s => s.id === sessionId);
      if (sessionIndex === -1) {
        return {
          success: false,
          error: 'Session not found'
        };
      }

      const session = userSessions[sessionIndex];

      if (session.status === 'completed') {
        return {
          success: false,
          error: 'Session is already completed'
        };
      }

      // Update session
      session.status = 'completed';
      session.sessionNotes = data.sessionNotes || session.sessionNotes;
      session.homework = data.homework ? { ...data.homework, completed: false } : session.homework;
      session.nextSession = data.nextSession;
      if (data.rating !== undefined) session.rating = data.rating;
      if (data.feedback) session.feedback = data.feedback;
      session.updatedAt = new Date();

      userSessions[sessionIndex] = session;
      sessions.set(userId, userSessions);

      // Update counselor rating
      const counselor = counselors.get(session.providerId);
      if (counselor && data.rating) {
        const newReviewCount = counselor.reviewCount + 1;
        const newRating = ((counselor.rating * counselor.reviewCount) + data.rating) / newReviewCount;
        counselor.rating = Math.round(newRating * 10) / 10;
        counselor.reviewCount = newReviewCount;
        counselor.sessionsCompleted++;
        counselors.set(session.providerId, counselor);
      }

      return {
        success: true,
        data: session,
        message: 'Session completed successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to complete session'
      };
    }
  }

  /**
   * Cancel a session
   */
  async cancelSession(sessionId: string, userId: string, reason?: string): Promise<ApiResponse<TherapySession>> {
    try {
      const userSessions = sessions.get(userId);
      if (!userSessions) {
        return {
          success: false,
          error: 'No sessions found for user'
        };
      }

      const sessionIndex = userSessions.findIndex(s => s.id === sessionId);
      if (sessionIndex === -1) {
        return {
          success: false,
          error: 'Session not found'
        };
      }

      const session = userSessions[sessionIndex];
      session.status = 'cancelled';
      session.notes = reason || 'Cancelled by user';
      session.updatedAt = new Date();

      userSessions[sessionIndex] = session;
      sessions.set(userId, userSessions);

      return {
        success: true,
        data: session,
        message: 'Session cancelled successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to cancel session'
      };
    }
  }

  /**
   * Mark homework as complete
   */
  async completeHomework(userId: string, sessionId: string): Promise<ApiResponse<TherapySession>> {
    try {
      const userSessions = sessions.get(userId);
      if (!userSessions) {
        return {
          success: false,
          error: 'No sessions found for user'
        };
      }

      const sessionIndex = userSessions.findIndex(s => s.id === sessionId);
      if (sessionIndex === -1) {
        return {
          success: false,
          error: 'Session not found'
        };
      }

      const session = userSessions[sessionIndex];
      if (!session.homework) {
        return {
          success: false,
          error: 'No homework assigned for this session'
        };
      }

      session.homework.completed = true;
      session.updatedAt = new Date();

      userSessions[sessionIndex] = session;
      sessions.set(userId, userSessions);

      return {
        success: true,
        data: session,
        message: 'Homework marked as completed'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to complete homework'
      };
    }
  }

  /**
   * Get user's mental health profile
   */
  async getProfile(userId: string): Promise<ApiResponse<MentalHealthProfile>> {
    try {
      const profile = profiles.get(userId);

      if (!profile) {
        // Return default profile
        return {
          success: true,
          data: {
            userId,
            conditions: [],
            therapies: [],
            supportGroupIds: [],
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        };
      }

      return {
        success: true,
        data: profile
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get profile'
      };
    }
  }

  /**
   * Update user's mental health profile
   */
  async updateProfile(userId: string, data: Partial<MentalHealthProfile>): Promise<ApiResponse<MentalHealthProfile>> {
    try {
      let profile = profiles.get(userId);

      if (!profile) {
        profile = {
          userId,
          conditions: [],
          therapies: [],
          supportGroupIds: [],
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        };
      }

      const updated = {
        ...profile,
        ...data,
        updatedAt: new Date()
      };

      const validationResult = MentalHealthProfileSchema.safeParse(updated);
      if (!validationResult.success) {
        return {
          success: false,
          error: validationResult.error.errors[0]?.message || 'Validation failed'
        };
      }

      profiles.set(userId, validationResult.data);

      return {
        success: true,
        data: validationResult.data,
        message: 'Profile updated successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update profile'
      };
    }
  }

  /**
   * Get session by ID
   */
  async getSession(sessionId: string, userId: string): Promise<ApiResponse<TherapySession>> {
    try {
      const userSessions = sessions.get(userId);
      if (!userSessions) {
        return {
          success: false,
          error: 'Session not found'
        };
      }

      const session = userSessions.find(s => s.id === sessionId);
      if (!session) {
        return {
          success: false,
          error: 'Session not found'
        };
      }

      return {
        success: true,
        data: session
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get session'
      };
    }
  }

  /**
   * Get all counselors
   */
  async getAllCounselors(): Promise<ApiResponse<Counselor[]>> {
    try {
      return {
        success: true,
        data: Array.from(counselors.values())
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get counselors'
      };
    }
  }
}

export const therapyService = new TherapyService();
