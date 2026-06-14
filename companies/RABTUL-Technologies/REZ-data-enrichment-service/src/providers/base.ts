/**
 * Data Enrichment Providers
 * Mock implementations for Clay parity
 */

import { EnrichmentProvider, ContactEnrichment, CompanyEnrichment, ProviderName } from '../types';

// Provider configurations
export const PROVIDERS: EnrichmentProvider[] = [
  { name: 'apollo', enabled: true, priority: 1, creditsPerRequest: 1, rateLimit: 50 },
  { name: 'hunter', enabled: true, priority: 2, creditsPerRequest: 1, rateLimit: 100 },
  { name: 'clearbit', enabled: true, priority: 3, creditsPerRequest: 1, rateLimit: 50 },
  { name: 'zoominfo', enabled: true, priority: 4, creditsPerRequest: 2, rateLimit: 30 },
  { name: 'linkedin', enabled: true, priority: 5, creditsPerRequest: 1, rateLimit: 60 },
  { name: 'crunchbase', enabled: true, priority: 6, creditsPerRequest: 1, rateLimit: 40 },
  { name: 'builtwith', enabled: true, priority: 7, creditsPerRequest: 1, rateLimit: 50 },
  { name: 'wappalyzer', enabled: true, priority: 8, creditsPerRequest: 1, rateLimit: 60 },
];

// Mock contact data
const mockContacts: Record<string, ContactEnrichment> = {
  'john.smith@techcorp.io': {
    email: 'john.smith@techcorp.io',
    firstName: 'John',
    lastName: 'Smith',
    fullName: 'John Smith',
    title: 'VP of Engineering',
    company: 'TechCorp',
    companyDomain: 'techcorp.io',
    phone: '+1-555-123-4567',
    linkedinUrl: 'https://linkedin.com/in/johnsmith',
    twitter: '@johnsmith',
    location: 'San Francisco, CA',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e',
  },
  'sarah.chen@startupxyz.com': {
    email: 'sarah.chen@startupxyz.com',
    firstName: 'Sarah',
    lastName: 'Chen',
    fullName: 'Sarah Chen',
    title: 'CEO & Founder',
    company: 'StartupXYZ',
    companyDomain: 'startupxyz.com',
    phone: '+1-555-987-6543',
    linkedinUrl: 'https://linkedin.com/in/sarahchen',
    location: 'New York, NY',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330',
  },
};

// Mock company data
const mockCompanies: Record<string, CompanyEnrichment> = {
  'techcorp.io': {
    companyName: 'TechCorp Inc',
    domain: 'techcorp.io',
    description: 'Enterprise software solutions for Fortune 500 companies',
    founded: 2010,
    employees: 5000,
    employeesRange: '1000-5000',
    industry: 'Technology',
    subIndustry: 'Enterprise Software',
    location: 'San Francisco, CA',
    city: 'San Francisco',
    state: 'California',
    country: 'USA',
    postalCode: '94105',
    logo: 'https://logo.clearbit.com/techcorp.io',
    linkedinUrl: 'https://linkedin.com/company/techcorp',
    twitter: '@techcorp',
    facebook: 'techcorpinc',
    crunchbaseUrl: 'https://crunchbase.com/org/techcorp',
    alexaRank: 12500,
    technologies: ['React', 'Node.js', 'AWS', 'PostgreSQL', 'Redis'],
  },
  'startupxyz.com': {
    companyName: 'StartupXYZ',
    domain: 'startupxyz.com',
    description: 'AI-powered marketing automation for SaaS companies',
    founded: 2022,
    employees: 50,
    employeesRange: '10-50',
    industry: 'Technology',
    subIndustry: 'Marketing Tech',
    location: 'New York, NY',
    city: 'New York',
    state: 'New York',
    country: 'USA',
    postalCode: '10001',
    logo: 'https://logo.clearbit.com/startupxyz.com',
    linkedinUrl: 'https://linkedin.com/company/startupxyz',
    technologies: ['Next.js', 'Python', 'OpenAI', 'Supabase'],
  },
};

export class ProviderBase {
  name: ProviderName;
  enabled: boolean;
  priority: number;
  creditsPerRequest: number;
  rateLimit: number;

  constructor(config: EnrichmentProvider) {
    this.name = config.name;
    this.enabled = config.enabled;
    this.priority = config.priority;
    this.creditsPerRequest = config.creditsPerRequest;
    this.rateLimit = config.rateLimit;
  }

  async enrichContact(email: string): Promise<ContactEnrichment | null> {
    // Mock implementation
    return mockContacts[email.toLowerCase()] || null;
  }

  async enrichCompany(domain: string): Promise<CompanyEnrichment | null> {
    // Mock implementation
    return mockCompanies[domain.toLowerCase()] || null;
  }

  async findEmail(params: {
    firstName: string;
    lastName: string;
    company: string;
    domain?: string;
  }): Promise<string | null> {
    const { firstName, lastName, company } = params;
    const domain = params.domain || company.toLowerCase().replace(/\s+/g, '') + '.com';
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${domain}`;
    return Math.random() > 0.3 ? email : null;
  }

  async findPhone(params: {
    company: string;
    title?: string;
  }): Promise<string | null> {
    // Mock phone finder
    return Math.random() > 0.4 ? `+1-555-${Math.floor(Math.random() * 900 + 100)}-${Math.floor(Math.random() * 9000 + 1000)}` : null;
  }

  async getTechnologies(domain: string): Promise<string[]> {
    const company = mockCompanies[domain.toLowerCase()];
    return company?.technologies || [];
  }
}

// Provider instances
export const providers = PROVIDERS.map(config => new ProviderBase(config));

// Export for easy access
export const getProvider = (name: ProviderName): ProviderBase | undefined => {
  return providers.find(p => p.name === name);
};

export const getEnabledProviders = (): ProviderBase[] => {
  return providers.filter(p => p.enabled).sort((a, b) => a.priority - b.priority);
};
