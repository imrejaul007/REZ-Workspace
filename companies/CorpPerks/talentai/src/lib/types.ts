// Types for TalentAI Platform

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'candidate' | 'employer';
  avatar?: string;
  createdAt: string;
}

export interface Candidate extends User {
  role: 'candidate';
  title: string;
  summary?: string;
  skills: string[];
  experience: Experience[];
  education: Education[];
  resume?: string;
  linkedin?: string;
  github?: string;
  portfolio?: string;
  matchScore?: number;
}

export interface Employer extends User {
  role: 'employer';
  company: string;
  jobTitle: string;
  companyLogo?: string;
  companySize?: string;
  industry?: string;
  website?: string;
}

export interface Experience {
  title: string;
  company: string;
  period: string;
  description?: string;
  current?: boolean;
}

export interface Education {
  degree: string;
  school: string;
  year: string;
  grade?: string;
}

export interface Job {
  id: string;
  title: string;
  description: string;
  skills: string[];
  type: 'full_time' | 'part_time' | 'contract' | 'internship' | 'freelance';
  location: {
    city: string;
    remote: boolean;
    hybrid: boolean;
  };
  salary?: {
    min: number;
    max: number;
    period: 'year' | 'month';
  };
  employer: {
    id: string;
    name: string;
    logo?: string;
    type: string;
    verified: boolean;
  };
  postedAt: string;
  applications: number;
  matchScore?: number;
  status: 'active' | 'paused' | 'closed';
}

export interface Application {
  id: string;
  jobId: string;
  candidateId: string;
  status: 'applied' | 'screening' | 'interview' | 'offer' | 'hired' | 'rejected';
  appliedAt: string;
  coverLetter?: string;
  overallScore?: number;
  notes?: string;
}

export interface Interview {
  id: string;
  applicationId: string;
  candidateId: string;
  employerId: string;
  scheduledAt: string;
  duration: number; // minutes
  type: 'video' | 'phone' | 'onsite';
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled';
  meetingLink?: string;
  notes?: string;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: string;
  read: boolean;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'application' | 'interview' | 'message' | 'system';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
}

export type JobType = 'full_time' | 'part_time' | 'contract' | 'internship' | 'freelance';
export type ApplicationStatus = 'applied' | 'screening' | 'interview' | 'offer' | 'hired' | 'rejected';
export type InterviewType = 'video' | 'phone' | 'onsite';
export type InterviewStatus = 'scheduled' | 'confirmed' | 'completed' | 'cancelled';
