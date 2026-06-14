// Conference Types
export interface IConference {
  _id?: string;
  name: string;
  description: string;
  date: {
    start: Date;
    end: Date;
  };
  venue: {
    name: string;
    address: string;
    city: string;
    country: string;
    capacity: number;
  };
  industry: string;
  expectedAttendance: number;
  actualAttendance?: number;
  topics: string[];
  tags: string[];
  organizer: {
    name: string;
    email: string;
    company: string;
  };
  sponsors?: Array<{
    name: string;
    tier: 'platinum' | 'gold' | 'silver' | 'bronze';
    logo?: string;
  }>;
  status: 'draft' | 'published' | 'ongoing' | 'completed' | 'cancelled';
  registrationUrl?: string;
  website?: string;
  socialMedia?: {
    twitter?: string;
    linkedin?: string;
    facebook?: string;
  };
  targetAudience: string[];
  priceRange?: {
    min: number;
    max: number;
    currency: string;
  };
  metadata?: Record<string, unknown>;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ISpeaker {
  _id?: string;
  conferenceId: string;
  name: string;
  title: string;
  company: string;
  bio: string;
  topic: string;
  expertise: string[];
  followers?: {
    twitter?: number;
    linkedin?: number;
    instagram?: number;
  };
  photo?: string;
  socialLinks?: {
    twitter?: string;
    linkedin?: string;
    website?: string;
  };
  rating?: number;
  sessions?: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ISession {
  _id?: string;
  conferenceId: string;
  title: string;
  description: string;
  type: 'keynote' | 'panel' | 'workshop' | 'networking' | 'breakout' | 'other';
  speakerIds: string[];
  speakers?: ISpeaker[];
  room: string;
  date: Date;
  startTime: string;
  endTime: string;
  capacity?: number;
  registeredCount?: number;
  tags: string[];
  level: 'beginner' | 'intermediate' | 'advanced';
  materials?: Array<{
    name: string;
    url: string;
    type: 'slides' | 'video' | 'document';
  }>;
  feedback?: {
    rating: number;
    count: number;
  };
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IConferenceAnalytics {
  _id?: string;
  conferenceId: string;
  impressions: number;
  registrations: number;
  attendance: number;
  checkIns: number;
  sessions: Array<{
    sessionId: string;
    impressions: number;
    attendance: number;
    feedback: {
      rating: number;
      count: number;
    };
  }>;
  engagement: {
    websiteVisits: number;
    socialShares: number;
    hashtagMentions: number;
    pressMentions: number;
  };
  conversions: {
    registrations: number;
    ticketSales: number;
    sponsorMeetings: number;
    leadCaptures: number;
  };
  demographics: {
    industries: Record<string, number>;
    jobTitles: Record<string, number>;
    companySizes: Record<string, number>;
    countries: Record<string, number>;
  };
  date: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

// API Request/Response Types
export interface CreateConferenceRequest {
  name: string;
  description: string;
  date: {
    start: string;
    end: string;
  };
  venue: {
    name: string;
    address: string;
    city: string;
    country: string;
    capacity: number;
  };
  industry: string;
  expectedAttendance: number;
  topics: string[];
  tags: string[];
  organizer: {
    name: string;
    email: string;
    company: string;
  };
  sponsors?: Array<{
    name: string;
    tier: 'platinum' | 'gold' | 'silver' | 'bronze';
    logo?: string;
  }>;
  registrationUrl?: string;
  website?: string;
  socialMedia?: {
    twitter?: string;
    linkedin?: string;
    facebook?: string;
  };
  targetAudience?: string[];
  priceRange?: {
    min: number;
    max: number;
    currency: string;
  };
}

export interface AddSpeakerRequest {
  name: string;
  title: string;
  company: string;
  bio: string;
  topic: string;
  expertise: string[];
  followers?: {
    twitter?: number;
    linkedin?: number;
    instagram?: number;
  };
  photo?: string;
  socialLinks?: {
    twitter?: string;
    linkedin?: string;
    website?: string;
  };
}

export interface AddSessionRequest {
  title: string;
  description: string;
  type: 'keynote' | 'panel' | 'workshop' | 'networking' | 'breakout' | 'other';
  speakerIds: string[];
  room: string;
  date: string;
  startTime: string;
  endTime: string;
  capacity?: number;
  tags: string[];
  level: 'beginner' | 'intermediate' | 'advanced';
  materials?: Array<{
    name: string;
    url: string;
    type: 'slides' | 'video' | 'document';
  }>;
}

export interface UpdateConferenceRequest {
  name?: string;
  description?: string;
  date?: {
    start: string;
    end: string;
  };
  venue?: {
    name: string;
    address: string;
    city: string;
    country: string;
    capacity: number;
  };
  industry?: string;
  expectedAttendance?: number;
  actualAttendance?: number;
  topics?: string[];
  tags?: string[];
  organizer?: {
    name: string;
    email: string;
    company: string;
  };
  sponsors?: Array<{
    name: string;
    tier: 'platinum' | 'gold' | 'silver' | 'bronze';
    logo?: string;
  }>;
  status?: 'draft' | 'published' | 'ongoing' | 'completed' | 'cancelled';
  registrationUrl?: string;
  website?: string;
  socialMedia?: {
    twitter?: string;
    linkedin?: string;
    facebook?: string;
  };
  targetAudience?: string[];
  priceRange?: {
    min: number;
    max: number;
    currency: string;
  };
}

export interface AdTargetingCriteria {
  industry?: string;
  topics?: string[];
  audience?: string[];
  location?: string;
  dateRange?: {
    start: string;
    end: string;
  };
  speakerInfluence?: {
    minFollowers?: number;
    minRating?: number;
  };
}

export interface ConferenceFilters {
  industry?: string;
  status?: string;
  city?: string;
  country?: string;
  startDate?: string;
  endDate?: string;
  minAttendance?: number;
  maxAttendance?: number;
  tags?: string[];
  page?: number;
  limit?: number;
}