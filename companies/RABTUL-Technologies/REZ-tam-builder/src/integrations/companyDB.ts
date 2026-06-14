/**
 * REZ TAM Builder - Company Database Integration
 *
 * Mock company database (replace with Apollo, ZoomInfo, or internal data)
 */

import { ICompany } from '../models/AccountUniverse.js';

// ============================================================================
// Mock Company Database
// ============================================================================

const COMPANY_DATABASE: ICompany[] = [
  // Tech Companies
  { id: 'c1', name: 'TechCorp Solutions', domain: 'techcorp.io', industry: 'Technology', size: '201-500', country: 'USA', city: 'San Francisco', score: 0, fitBreakdown: { industry: 0, size: 0, location: 0, technology: 0, behavior: 0 }, technologies: ['Salesforce', 'HubSpot', 'Slack'], enrichmentStatus: 'pending' },
  { id: 'c2', name: 'CloudFirst Inc', domain: 'cloudfirst.com', industry: 'Technology', size: '51-200', country: 'USA', city: 'Austin', score: 0, fitBreakdown: { industry: 0, size: 0, location: 0, technology: 0, behavior: 0 }, technologies: ['AWS', 'Azure', 'Salesforce'], enrichmentStatus: 'pending' },
  { id: 'c3', name: 'DataDriven Analytics', domain: 'datadriven.ai', industry: 'Technology', size: '11-50', country: 'USA', city: 'New York', score: 0, fitBreakdown: { industry: 0, size: 0, location: 0, technology: 0, behavior: 0 }, technologies: ['Snowflake', 'Tableau', 'HubSpot'], enrichmentStatus: 'pending' },

  // Healthcare
  { id: 'c4', name: 'MedTech Health', domain: 'medtech.health', industry: 'Healthcare', size: '501-1000', country: 'USA', city: 'Boston', score: 0, fitBreakdown: { industry: 0, size: 0, location: 0, technology: 0, behavior: 0 }, technologies: ['Salesforce Health Cloud'], enrichmentStatus: 'pending' },
  { id: 'c5', name: 'CareFirst Medical', domain: 'carefirst.med', industry: 'Healthcare', size: '1001-5000', country: 'USA', city: 'Chicago', score: 0, fitBreakdown: { industry: 0, size: 0, location: 0, technology: 0, behavior: 0 }, technologies: ['Epic', 'Salesforce'], enrichmentStatus: 'pending' },

  // Finance
  { id: 'c6', name: 'FinServ Partners', domain: 'finserv.com', industry: 'Financial Services', size: '201-500', country: 'USA', city: 'New York', score: 0, fitBreakdown: { industry: 0, size: 0, location: 0, technology: 0, behavior: 0 }, technologies: ['Salesforce', 'FinancialForce'], enrichmentStatus: 'pending' },
  { id: 'c7', name: 'WealthTech Solutions', domain: 'wealthtech.io', industry: 'Financial Services', size: '51-200', country: 'USA', city: 'Charlotte', score: 0, fitBreakdown: { industry: 0, size: 0, location: 0, technology: 0, behavior: 0 }, technologies: ['HubSpot', 'WealthEngine'], enrichmentStatus: 'pending' },

  // Manufacturing
  { id: 'c8', name: 'Industrial Dynamics', domain: 'industrialdynamics.com', industry: 'Manufacturing', size: '501-1000', country: 'USA', city: 'Detroit', score: 0, fitBreakdown: { industry: 0, size: 0, location: 0, technology: 0, behavior: 0 }, technologies: ['SAP', 'Dynamics'], enrichmentStatus: 'pending' },
  { id: 'c9', name: 'Precision Parts Co', domain: 'precisionparts.com', industry: 'Manufacturing', size: '201-500', country: 'USA', city: 'Cleveland', score: 0, fitBreakdown: { industry: 0, size: 0, location: 0, technology: 0, behavior: 0 }, technologies: ['Salesforce', 'NetSuite'], enrichmentStatus: 'pending' },

  // Retail
  { id: 'c10', name: 'RetailMax Group', domain: 'retailmax.com', industry: 'Retail', size: '1001-5000', country: 'USA', city: 'Seattle', score: 0, fitBreakdown: { industry: 0, size: 0, location: 0, technology: 0, behavior: 0 }, technologies: ['Salesforce Commerce', 'Shopify'], enrichmentStatus: 'pending' },
  { id: 'c11', name: 'Omnichannel Retail', domain: 'omnichannel.retail', industry: 'Retail', size: '501-1000', country: 'USA', city: 'Los Angeles', score: 0, fitBreakdown: { industry: 0, size: 0, location: 0, technology: 0, behavior: 0 }, technologies: ['Salesforce', 'Magento'], enrichmentStatus: 'pending' },

  // India - Tech
  { id: 'c12', name: 'Bangalore Tech Hub', domain: 'blrtech.in', industry: 'Technology', size: '201-500', country: 'India', city: 'Bangalore', score: 0, fitBreakdown: { industry: 0, size: 0, location: 0, technology: 0, behavior: 0 }, technologies: ['Salesforce', 'Jira', 'Slack'], enrichmentStatus: 'pending' },
  { id: 'c13', name: 'Mumbai Software Labs', domain: 'mumsoft.in', industry: 'Technology', size: '51-200', country: 'India', city: 'Mumbai', score: 0, fitBreakdown: { industry: 0, size: 0, location: 0, technology: 0, behavior: 0 }, technologies: ['HubSpot', 'Zoho'], enrichmentStatus: 'pending' },

  // India - Finance
  { id: 'c14', name: 'FinEdge India', domain: 'finedge.in', industry: 'Financial Services', size: '201-500', country: 'India', city: 'Mumbai', score: 0, fitBreakdown: { industry: 0, size: 0, location: 0, technology: 0, behavior: 0 }, technologies: ['Salesforce', 'FinTech Core'], enrichmentStatus: 'pending' },

  // UK
  { id: 'c15', name: 'London Tech Ventures', domain: 'londontech.co.uk', industry: 'Technology', size: '51-200', country: 'UK', city: 'London', score: 0, fitBreakdown: { industry: 0, size: 0, location: 0, technology: 0, behavior: 0 }, technologies: ['Salesforce', 'HubSpot', 'Slack'], enrichmentStatus: 'pending' },
  { id: 'c16', name: 'FinTech UK', domain: 'fintechuk.co.uk', industry: 'Financial Services', size: '201-500', country: 'UK', city: 'London', score: 0, fitBreakdown: { industry: 0, size: 0, location: 0, technology: 0, behavior: 0 }, technologies: ['Salesforce Financial Services Cloud'], enrichmentStatus: 'pending' },
];

// ============================================================================
// Company Database Interface
// ============================================================================

export interface CompanySearchFilters {
  industries?: string[];
  sizes?: string[];
  countries?: string[];
  cities?: string[];
  technologies?: string[];
  limit?: number;
  offset?: number;
}

class CompanyDatabase {
  /**
   * Search companies by filters
   */
  async findCompanies(filters: CompanySearchFilters): Promise<ICompany[]> {
    let results = [...COMPANY_DATABASE];

    // Filter by industry
    if (filters.industries?.length) {
      results = results.filter(c =>
        c.industry && filters.industries!.some(i =>
          c.industry.toLowerCase().includes(i.toLowerCase())
        )
      );
    }

    // Filter by size
    if (filters.sizes?.length) {
      results = results.filter(c =>
        c.size && filters.sizes!.includes(c.size)
      );
    }

    // Filter by country
    if (filters.countries?.length) {
      results = results.filter(c =>
        c.country && filters.countries!.some(cn =>
          c.country!.toLowerCase().includes(cn.toLowerCase())
        )
      );
    }

    // Filter by city
    if (filters.cities?.length) {
      results = results.filter(c =>
        c.city && filters.cities!.some(ct =>
          c.city!.toLowerCase().includes(ct.toLowerCase())
        )
      );
    }

    // Filter by technology
    if (filters.technologies?.length) {
      results = results.filter(c =>
        c.technologies && filters.technologies!.some(t =>
          c.technologies!.some(ct =>
            ct.toLowerCase().includes(t.toLowerCase())
          )
        )
      );
    }

    // Pagination
    const offset = filters.offset || 0;
    const limit = filters.limit || results.length;

    return results.slice(offset, offset + limit);
  }

  /**
   * Get company by ID
   */
  async getCompany(id: string): Promise<ICompany | undefined> {
    return COMPANY_DATABASE.find(c => c.id === id);
  }

  /**
   * Enrich company with additional data
   */
  async enrichCompany(company: ICompany): Promise<ICompany> {
    // Mock enrichment - in production, call Apollo/ZoomInfo/Clearbit API
    return {
      ...company,
      enrichmentStatus: 'enriched',
      enrichedAt: new Date(),
      // Add mock signals
      signals: {
        hiring: Math.floor(Math.random() * 50),
        funding: Math.random() > 0.7,
        growth: Math.random() > 0.5 ? 'fast' : 'steady',
        news: ['Recent product launch', 'Hiring spree'],
      },
    };
  }

  /**
   * Get total company count
   */
  async getTotalCount(filters?: CompanySearchFilters): Promise<number> {
    if (!filters) return COMPANY_DATABASE.length;

    const results = await this.findCompanies(filters);
    return results.length;
  }
}

export const companyDatabase = new CompanyDatabase();
export default companyDatabase;
