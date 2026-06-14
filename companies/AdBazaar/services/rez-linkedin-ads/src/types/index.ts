// LinkedIn Marketing API Types

export interface LinkedInConfig {
  clientId: string;
  clientSecret: string;
  accessToken: string;
  callbackUrl: string;
}

export interface LinkedInOAuthToken {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  refresh_token_expires_in?: number;
  scope: string;
  token_type?: string;
}

export interface LinkedInUser {
  sub: string;
  name?: string;
  given_name?: string;
  family_name?: string;
  email?: string;
  picture?: string;
  locale?: string;
  headline?: string;
  id?: string;
}

export interface LinkedInOrganization {
  id: string;
  name: string;
  displayName?: string;
  website?: string;
  tagline?: string;
  description?: string;
  foundedOn?: string;
  employeeCountRange?: string;
  headquarter?: {
    country: string;
    city: string;
    postalCode?: string;
    line1?: string;
  };
  primaryCompanyType?: string;
  companyStatus?: string[];
  universalName?: string;
  organizationalTargetingIndustries?: Array<{ name: string; id: string }>;
  organizationalTargetingFunction?: Array<{ name: string; id: string }>;
  organizationalTargetingSeniority?: Array<{ name: string; id: string }>;
  role?: string;
  roleStatus?: string;
}

export interface LinkedInOrganizationRole {
  organization: string;
  role: 'ADMIN' | 'DIRECT_SPONSOR_CONTENT_POSTER' | 'DIRECT_SPONSOR_CONTENT_REVIEWER' | 'LEAD_GEN_RESPONSE_MANAGER' | 'MANAGER' | 'RECRUITER' | 'PAGES_ADMIN' | 'TALENT_LOCKBOX_ADMIN';
  roleStatus: 'ACTIVE' | 'INACTIVE';
  invitedUser?: {
    person?: string;
    email?: string;
  };
}

export interface CallToAction {
  type: 'CUSTOM' | 'SITE_WIDE_CUSTOM_EVENT' | 'APPLY' | 'LEARN_MORE' | 'REGISTER' | 'SIGN_UP' | 'DOWNLOAD' | 'GET_QUOTE' | 'REQUEST_TIME' | 'ADD_TO_CART' | 'START_FREE_TRIAL' | 'CONTACT' | 'DOWNTIME';
  customizedCallToActionButton?: string;
  customizedCallToActionUrl?: string;
}

export interface PostRequest {
  author?: string;
  lifecycleState?: 'DRAFT' | 'PUBLISHED';
  visibility: {
    memberNetworkVisibility: 'PUBLIC' | 'CONNECTIONS';
  };
  commentary?: string;
  distribution?: {
    feedDistribution?: 'MAIN_FEED' | 'ALL' | 'SPOTLIGHT';
    targetEntities?: {
      seeders?: string[];
      topics?: Array<{ topic: string; name: string }>;
    };
    thirdPartyDistributionChannels?: string[];
  };
  image?: {
    title?: string;
    altText?: string;
  };
  content?: {
    contentEntities?: Array<{
      entity?: string;
      entityLocalIdentifier?: string;
      title?: string;
      description?: string;
    }>;
    description?: string;
    title?: string;
    clickTrackingUrl?: string;
    thumbnail?: string;
  };
  articles?: Array<{
    source?: string;
    title?: string;
    description?: string;
  }>;
  callToAction?: CallToAction;
}

export interface LinkedInPost {
  id: string;
  author: string;
  lifecycleState: string;
  visibility: {
    memberNetworkVisibility: string;
  };
  created: {
    time: number;
  };
  lastModified: {
    time: number;
  };
  commentary?: string;
  content?: {
    contentEntities?: Array<{
      entity?: string;
      entityLocalIdentifier?: string;
      title?: string;
      description?: string;
    }>;
    description?: string;
    title?: string;
  };
  image?: {
    displayUrl?: string;
    id?: string;
  };
  article?: {
    id?: string;
    source?: string;
    title?: string;
  };
}

export interface SponsoredCampaign {
  id: string;
  account: string;
  name: string;
  status: 'ACTIVE' | 'PAUSED' | 'ARCHIVED' | 'DRAFT';
  runSchedule?: {
    start: number;
    end?: number;
  };
  targeting?: {
    locations?: Array<{ name: string; id: string }>;
    industries?: Array<{ name: string; id: string }>;
    jobTitles?: Array<{ name: string; id: string }>;
    companySizes?: string[];
    ageRanges?: Array<{ name: string; id: string }>;
    memberSeniority?: Array<{ name: string; id: string }>;
    fieldOfStudy?: Array<{ name: string; id: string }>;
    fieldsOfStudy?: Array<{ name: string; id: string }>;
    schools?: Array<{ name: string; id: string }>;
    yearsOfExperience?: Array<{ name: string; id: string }>;
    structuredSnippet?: {
      header: string;
      values: string[];
    };
    skills?: Array<{ name: string; id: string }>;
    companyName?: string[];
    excludedCompanies?: Array<{ name: string; id: string }>;
    excludedJobTitles?: Array<{ name: string; id: string }>;
    excludedTitles?: Array<{ name: string; id: string }>;
  };
  dailyBudget?: {
    amount: string;
    currencyCode: string;
  };
  totalBudget?: {
    amount: string;
    currencyCode: string;
  };
  format: 'SPONSORED_STATUS_UPDATES' | 'SPONSORED_INMAILS' | 'SPONSORED_VIDEO' | 'TEXT_AD' | 'SPONSORED_CONVERSATIONS' | 'DYNAMIC_AD' | 'CAROUSEL_IMAGE_AD';
  unitCost?: {
    amount: string;
    currencyCode: string;
  };
  costType?: 'CPC' | 'CPM' | 'oCPM' | 'CPE';
  optimizationTargetType?: string;
}

export interface SponsoredCampaignCreate {
  account?: string;
  name: string;
  status?: 'ACTIVE' | 'PAUSED' | 'ARCHIVED' | 'DRAFT';
  runSchedule?: {
    start: number;
    end?: number;
  };
  targeting?: SponsoredCampaign['targeting'];
  dailyBudget?: {
    amount: string;
    currencyCode: string;
  };
  totalBudget?: {
    amount: string;
    currencyCode: string;
  };
  format: SponsoredCampaign['format'];
  unitCost?: {
    amount: string;
    currencyCode: string;
  };
  costType?: SponsoredCampaign['costType'];
  optimizationTargetType?: string;
  creativeIds?: string[];
  imageIds?: string[];
}

export interface SponsoredCreative {
  id: string;
  name?: string;
  campaign: string;
  status?: string;
  type: string;
  leadGenForm?: string;
  content?: {
    title?: string;
    description?: string;
    callToAction?: {
      type: string;
      customizedCallToActionButton?: string;
      customizedCallToActionUrl?: string;
    };
    previewUrl?: string;
    thumbnail?: {
      id: string;
      displayUrl: string;
    };
    additionalContextBanner?: {
      id: string;
      displayUrl: string;
    };
  };
  variables?: Record<string, unknown>;
}

export interface LeadGenForm {
  id: string;
  name: string;
  status: 'ACTIVE' | 'CLOSED';
  leadFormType: 'DEFAULT' | 'ENHANCED';
  author: string;
  created: {
    time: number;
  };
  updated: {
    time: number;
  };
  configuration: {
    headline: string;
    description: string;
    backgroundImage?: {
      id: string;
      displayUrl: string;
    };
    customGreeting?: string;
    customGreetingFields?: string[];
    privacyPolicyUrl?: string;
    includeCompanyBranding?: boolean;
    fields: Array<{
      name: string;
      type: string;
      isRequired: boolean;
      label?: string;
    }>;
    assets: Array<{
      id: string;
      type: string;
    }>;
  };
  questions?: Array<{
    id: string;
    type: string;
    text: string;
    options?: Array<{
      text: string;
      value: string;
    }>;
  }>;
}

export interface LeadGenFormCreate {
  name: string;
  title?: string;
  description?: string;
  customGreeting?: string;
  customGreetingFields?: string[];
  privacyPolicyUrl?: string;
  includeCompanyBranding?: boolean;
  fields: Array<{
    name: string;
    type: string;
    isRequired: boolean;
    label?: string;
  }>;
}

export interface Lead {
  id: string;
  campaign: string;
  form: string;
  created: {
    time: number;
  };
  leadGenerationInformation: {
    generatedDate: number;
    userInfo?: {
      name?: string;
      email?: string;
      phoneNumber?: string;
      company?: string;
      jobTitle?: string;
    };
  };
}

export interface CampaignAnalytics {
  campaign: string;
  impressions: number;
  clicks: number;
  ctr: number;
  cpc: number;
  cpm: number;
  spend: number;
  conversions: number;
  conversionRate: number;
  leads: number;
  leadgenFormOpens: number;
  leadgenFormCompletions: number;
  costPerLeads: number;
  videoViews?: number;
  videoCompletions?: number;
  engagementRate?: number;
  startDate?: number;
  endDate?: number;
  dateRange?: {
    start: {
      day: number;
      month: number;
      year: number;
    };
    end: {
      day: number;
      month: number;
      year: number;
    };
  };
}

export interface AnalyticsRequest {
  campaigns: string[];
  dateRange: {
    start: { day: number; month: number; year: number };
    end: { day: number; month: number; year: number };
  };
  timeGranularity?: 'DAY' | 'MONTH' | 'SUMMARY';
  fields?: string[];
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: {
    timestamp: string;
    requestId: string;
  };
}

// Utility type for URN parsing
export function parseLinkedInUrn(urn: string): { type: string; id: string } | null {
  const match = urn.match(/^urn:li:(\w+):(.+)$/);
  if (!match) return null;
  return { type: match[1], id: match[2] };
}

// Convert ID to URN format
export function toOrganizationUrn(id: string): string {
  return `urn:li:organization:${id}`;
}

export function toCampaignUrn(id: string): string {
  return `urn:li:sponsoredCampaign:${id}`;
}

export function toPersonUrn(id: string): string {
  return `urn:li:person:${id}`;
}

export function toLeadGenFormUrn(id: string): string {
  return `urn:li:leadGenForm:${id}`;
}
