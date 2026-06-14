/**
 * ADBAZAR BPO - Voice BPO Service Types
 * RABTUL Technologies - axomi-bpo-voice-bpo
 */

export type CallStatus = 'pending' | 'ringing' | 'in_progress' | 'completed' | 'missed' | 'failed' | 'transferred' | 'voicemail';
export type CallDirection = 'inbound' | 'outbound';
export type CallPriority = 'low' | 'normal' | 'high' | 'urgent';
export type AgentStatus = 'available' | 'on_call' | 'after_call_work' | 'break' | 'offline';

export interface PhoneNumber {
  id: string;
  number: string;
  country: string;
  type: 'toll_free' | 'local' | 'did' | 'vanity';
  assignedTo?: string;
  campaignId?: string;
  isActive: boolean;
}

export interface Call {
  id: string;
  callSid: string;
  direction: CallDirection;
  from: string;
  to: string;
  status: CallStatus;
  priority: CallPriority;
  campaignId?: string;
  agentId?: string;
  queueId?: string;
  duration: number;
  waitTime: number;
  talkTime: number;
  holdTime: number;
  recordingUrl?: string;
  ivrPath?: string;
  ivrResponse?: Record<string, string>;
  transferHistory: TransferRecord[];
  notes: CallNote[];
  tags: string[];
  metadata: Record<string, unknown>;
  startedAt: Date;
  ringingAt?: Date;
  answeredAt?: Date;
  endedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface TransferRecord {
  fromAgentId: string;
  toAgentId: string;
  toQueue?: string;
  timestamp: Date;
  reason: string;
}

export interface CallNote {
  id: string;
  agentId: string;
  content: string;
  createdAt: Date;
}

export interface Agent {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  status: AgentStatus;
  skills: string[];
  campaigns: string[];
  currentCallId?: string;
  totalCalls: number;
  totalTalkTime: number;
  avgHandleTime: number;
  avgSatisfaction: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Queue {
  id: string;
  name: string;
  description: string;
  priority: number;
  maxWaitTime: number;
  agents: string[];
  strategies: QueueStrategy[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type QueueStrategy = 'round_robin' | 'least_talk_time' | 'least_calls' | 'skill_based' | 'priority';

export interface Campaign {
  id: string;
  name: string;
  description: string;
  type: 'inbound' | 'outbound' | 'blended';
  status: 'draft' | 'scheduled' | 'active' | 'paused' | 'completed' | 'cancelled';
  priority: CallPriority;
  startDate: Date;
  endDate?: Date;
  phoneNumbers: string[];
  targetContacts: number;
  contactedContacts: number;
  answeredCalls: number;
  missedCalls: number;
  avgDuration: number;
  conversionRate: number;
  scripts: CampaignScript[];
  ivrFlow?: string;
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CampaignScript {
  id: string;
  name: string;
  version: number;
  steps: ScriptStep[];
  isActive: boolean;
  createdAt: Date;
}

export interface ScriptStep {
  order: number;
  type: 'greeting' | 'question' | 'statement' | 'transfer' | 'voicemail' | 'closing';
  content: string;
  options?: string[];
  nextStep?: number;
  requiredFields?: string[];
}

export interface IvrFlow {
  id: string;
  name: string;
  steps: IvrStep[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IvrStep {
  id: string;
  prompt: string;
  actions: IvrAction[];
}

export interface IvrAction {
  dtmf: string;
  action: 'transfer' | 'voicemail' | 'queue' | 'menu' | 'hangup';
  destination?: string;
  menuId?: string;
}

export interface CallStatistics {
  totalCalls: number;
  answeredCalls: number;
  missedCalls: number;
  avgWaitTime: number;
  avgTalkTime: number;
  avgHandleTime: number;
  avgSatisfaction: number;
  conversionRate: number;
  peakHour: number;
  callsByStatus: Record<CallStatus, number>;
  callsByHour: Record<number, number>;
}

export interface CampaignReport {
  campaignId: string;
  campaignName: string;
  period: { start: Date; end: Date };
  statistics: {
    totalContacts: number;
    attempted: number;
    answered: number;
    completed: number;
    conversionRate: number;
  };
  agentPerformance: AgentPerformance[];
  hourlyBreakdown: Record<number, number>;
}

export interface AgentPerformance {
  agentId: string;
  agentName: string;
  totalCalls: number;
  talkTime: number;
  avgHandleTime: number;
  satisfaction: number;
}

export interface CreateCallDto {
  direction: CallDirection;
  from: string;
  to: string;
  priority?: CallPriority;
  campaignId?: string;
  agentId?: string;
  queueId?: string;
  metadata?: Record<string, unknown>;
}

export interface UpdateCallDto {
  status?: CallStatus;
  agentId?: string;
  notes?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

export interface CreateAgentDto {
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  skills?: string[];
  campaigns?: string[];
}

export interface CreateCampaignDto {
  name: string;
  description?: string;
  type: 'inbound' | 'outbound' | 'blended';
  priority?: CallPriority;
  startDate: Date;
  endDate?: Date;
  phoneNumbers?: string[];
  scripts?: CampaignScript[];
  ivrFlow?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: Date;
}
