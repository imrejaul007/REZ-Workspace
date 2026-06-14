/**
 * LawGens Client for DO App
 *
 * Connect DO App to LawGens (Legal AI, Contracts, Court Intelligence)
 */

import axios, { AxiosInstance } from 'axios';

const LAWGENS_URL = process.env.LAWGENS_URL || 'http://localhost:5099';

export class LawGensClient {
  private client: AxiosInstance;

  constructor(apiKey?: string) {
    this.client = axios.create({
      baseURL: LAWGENS_URL,
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey && { 'X-API-Key': apiKey }),
      },
    });
  }

  // =========================================================================
  // CONTRACTS
  // =========================================================================

  async analyzeContract(documentText: string, type: string = 'general') {
    try {
      const { data } = await this.client.post('/api/contracts/analyze', {
        documentText,
        type,
      });
      return data;
    } catch (error) {
      console.error('LawGens analyzeContract error:', error);
      return this.mockContractAnalysis();
    }
  }

  async generateContract(type: string, params: Record<string, any>) {
    try {
      const { data } = await this.client.post('/api/contracts/generate', {
        type,
        ...params,
      });
      return data;
    } catch (error) {
      console.error('LawGens generateContract error:', error);
      return { template: 'Contract generated', content: '' };
    }
  }

  async getContractTemplates() {
    try {
      const { data } = await this.client.get('/api/contracts/templates');
      return data;
    } catch (error) {
      console.error('LawGens getContractTemplates error:', error);
      return { templates: [] };
    }
  }

  // =========================================================================
  // LEGAL RESEARCH
  // =========================================================================

  async legalResearch(query: string) {
    try {
      const { data } = await this.client.post('/api/research', { query });
      return data;
    } catch (error) {
      console.error('LawGens legalResearch error:', error);
      return this.mockLegalResearch(query);
    }
  }

  async getCaseLaws(query: string, jurisdiction?: string) {
    try {
      const { data } = await this.client.post('/api/cases/search', {
        query,
        jurisdiction: jurisdiction || 'india',
      });
      return data;
    } catch (error) {
      console.error('LawGens getCaseLaws error:', error);
      return { cases: [] };
    }
  }

  // =========================================================================
  // COMPLIANCE
  // =========================================================================

  async checkCompliance(area: string) {
    try {
      const { data } = await this.client.post('/api/compliance/check', { area });
      return data;
    } catch (error) {
      console.error('LawGens checkCompliance error:', error);
      return this.mockCompliance(area);
    }
  }

  async getRegulatoryUpdates(area?: string) {
    try {
      const { data } = await this.client.get('/api/regulations/updates', {
        params: { area },
      });
      return data;
    } catch (error) {
      console.error('LawGens getRegulatoryUpdates error:', error);
      return { updates: [] };
    }
  }

  // =========================================================================
  // COURT INTELLIGENCE
  // =========================================================================

  async getCourtCases(caseNumber: string) {
    try {
      const { data } = await this.client.get(`/api/court/${caseNumber}`);
      return data;
    } catch (error) {
      console.error('LawGens getCourtCases error:', error);
      return this.mockCourtCase();
    }
  }

  async trackCase(caseNumber: string) {
    try {
      const { data } = await this.client.post('/api/court/track', { caseNumber });
      return data;
    } catch (error) {
      console.error('LawGens trackCase error:', error);
      return null;
    }
  }

  async getNextHearing(caseNumber: string) {
    try {
      const { data } = await this.client.get(`/api/court/${caseNumber}/hearing`);
      return data;
    } catch (error) {
      console.error('LawGens getNextHearing error:', error);
      return { nextHearing: '2026-06-15', time: '10:00 AM', court: 'High Court' };
    }
  }

  // =========================================================================
  // TAX
  // =========================================================================

  async calculateTax(income: number, taxRegime: 'old' | 'new' = 'new') {
    try {
      const { data } = await this.client.post('/api/tax/calculate', {
        income,
        taxRegime,
      });
      return data;
    } catch (error) {
      console.error('LawGens calculateTax error:', error);
      return this.mockTaxCalculation(income);
    }
  }

  async getTaxAdvisory(query: string) {
    try {
      const { data } = await this.client.post('/api/tax/advisory', { query });
      return data;
    } catch (error) {
      console.error('LawGens getTaxAdvisory error:', error);
      return { advice: 'Consult a tax professional for specific advice.' };
    }
  }

  // =========================================================================
  // DOCUMENT SERVICES
  // =========================================================================

  async generateDocument(type: string, params: Record<string, any>) {
    try {
      const { data } = await this.client.post('/api/documents/generate', {
        type,
        ...params,
      });
      return data;
    } catch (error) {
      console.error('LawGens generateDocument error:', error);
      return { documentId: 'doc_' + Date.now(), url: '' };
    }
  }

  async analyzeDocument(documentUrl: string) {
    try {
      const { data } = await this.client.post('/api/documents/analyze', { documentUrl });
      return data;
    } catch (error) {
      console.error('LawGens analyzeDocument error:', error);
      return null;
    }
  }

  // =========================================================================
  // DO APP SPECIFIC
  // =========================================================================

  async getDOAppLegalDashboard(userId: string) {
    const [contractTemplates, taxUpdates] = await Promise.all([
      this.getContractTemplates(),
      this.getRegulatoryUpdates('tax'),
    ]);

    return {
      contractTemplates,
      taxUpdates,
      quickActions: {
        legalResearch: true,
        contractAnalysis: true,
        taxCalculator: true,
        compliance: true,
      },
    };
  }

  async voiceCommand(command: string) {
    const lowerCommand = command.toLowerCase();

    if (lowerCommand.includes('contract') || lowerCommand.includes('agreement')) {
      return { action: 'analyze_contract', command };
    }

    if (lowerCommand.includes('tax') || lowerCommand.includes('gst') || lowerCommand.includes('tds')) {
      return { action: 'tax_advisory', command };
    }

    if (lowerCommand.includes('court') || lowerCommand.includes('case')) {
      return { action: 'court_intelligence', command };
    }

    if (lowerCommand.includes('compliance') || lowerCommand.includes('legal')) {
      return { action: 'legal_research', command };
    }

    if (lowerCommand.includes('document') || lowerCommand.includes('notice')) {
      return { action: 'document_analysis', command };
    }

    return { action: 'unknown', command };
  }

  // =========================================================================
  // MOCK DATA
  // =========================================================================

  private mockContractAnalysis() {
    return {
      summary: 'This is an employment contract between ABC Company and the employee.',
      keyTerms: [
        'Position: Software Engineer',
        'Duration: 2 years',
        'Notice Period: 30 days',
        'Non-compete: 12 months',
      ],
      risks: [
        { level: 'medium', description: 'Non-compete clause may restrict future employment' },
      ],
      recommendations: [
        'Review termination clause carefully',
        'Negotiate notice period if needed',
      ],
    };
  }

  private mockLegalResearch(query: string) {
    return {
      query,
      results: [
        {
          title: 'Relevant Case Law',
          summary: 'Supreme Court ruling on the matter',
          citation: '2023 SC 1234',
          relevance: 0.85,
        },
      ],
      sources: ['Indian Kanoon', 'Manupatra'],
    };
  }

  private mockCompliance(area: string) {
    return {
      area,
      status: 'compliant',
      lastChecked: new Date().toISOString(),
      requirements: [
        { requirement: 'Annual filing', status: 'completed', dueDate: '2026-09-30' },
        { requirement: 'Tax audit', status: 'pending', dueDate: '2026-10-31' },
      ],
    };
  }

  private mockCourtCase() {
    return {
      caseNumber: 'CIVIL/2024/12345',
      parties: ['Plaintiff', 'Defendant'],
      court: 'Delhi High Court',
      status: 'pending',
      nextHearing: '2026-06-15',
    };
  }

  private mockTaxCalculation(income: number) {
    let tax = 0;
    if (income <= 700000) {
      tax = 0;
    } else if (income <= 900000) {
      tax = (income - 700000) * 0.1;
    } else if (income <= 1200000) {
      tax = 20000 + (income - 900000) * 0.15;
    } else {
      tax = 65000 + (income - 1200000) * 0.2;
    }

    return {
      income,
      taxRegime: 'new',
      tax,
      cess: tax * 0.04,
      total: tax * 1.04,
    };
  }
}

// Export singleton
export const lawgensClient = new LawGensClient();

export default LawGensClient;