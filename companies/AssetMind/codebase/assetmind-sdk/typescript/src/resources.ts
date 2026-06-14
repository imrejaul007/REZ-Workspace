/**
 * AssetMind TypeScript SDK - Resources
 */

import { AxiosInstance } from 'axios';
import {
  Asset,
  AssetTwin,
  Prediction,
  ResearchReport,
  Briefing,
  Opportunity,
  Risk,
} from './types';

export class AssetsResource {
  constructor(private client: AxiosInstance) {}

  async list(params?: { limit?: number; assetClass?: string }): Promise<Asset[]> {
    const response = await this.client.get('/api/v1/assets', { params });
    return response.data.assets;
  }

  async get(symbol: string): Promise<Asset> {
    const response = await this.client.get(`/api/v1/assets/${symbol}`);
    return response.data;
  }

  async search(query: string, limit = 10): Promise<Asset[]> {
    const response = await this.client.get('/search', {
      params: { query, limit },
    });
    return response.data;
  }
}

export class TwinResource {
  constructor(private client: AxiosInstance) {}

  async get(symbol: string): Promise<AssetTwin> {
    const response = await this.client.get(`/api/v1/twin/${symbol}`);
    return response.data;
  }

  async scores(symbol: string): Promise<Record<string, number>> {
    const response = await this.client.get(`/twins/${symbol}/scores`);
    return response.data;
  }

  async health(symbol: string): Promise<Record<string, number>> {
    const response = await this.client.get(`/twins/${symbol}/health`);
    return response.data;
  }

  async topOpportunities(limit = 10): Promise<Opportunity[]> {
    const response = await this.client.get('/twins/top/opportunities', {
      params: { limit },
    });
    return response.data;
  }

  async topRisks(limit = 10): Promise<Risk[]> {
    const response = await this.client.get('/twins/top/risks', {
      params: { limit },
    });
    return response.data;
  }
}

export class PredictionResource {
  constructor(private client: AxiosInstance) {}

  async get(symbol: string, timeHorizon = '30D'): Promise<Prediction> {
    const response = await this.client.get(`/api/v1/prediction/${symbol}`, {
      params: { timeHorizon },
    });
    return response.data;
  }

  async top(limit = 10): Promise<Prediction[]> {
    const response = await this.client.get('/predictions/top', {
      params: { limit },
    });
    return response.data.predictions;
  }
}

export class ResearchResource {
  constructor(private client: AxiosInstance) {}

  async generate(
    symbol: string,
    reportType = 'COMPANY'
  ): Promise<ResearchReport> {
    const response = await this.client.post('/report/generate', null, {
      params: { subject: symbol, reportType },
    });
    return response.data;
  }

  async quick(symbol: string): Promise<ResearchReport> {
    const response = await this.client.post('/report/quick', null, {
      params: { symbol },
    });
    return response.data;
  }

  async compare(symbols: string[]): Promise<ResearchReport[]> {
    const response = await this.client.post('/compare/report', null, {
      params: { symbols: symbols.join(',') },
    });
    return response.data.comparisons;
  }
}

export class BriefingResource {
  constructor(private client: AxiosInstance) {}

  async get(): Promise<Briefing> {
    const response = await this.client.get('/api/v1/briefing');
    return response.data;
  }

  async market(): Promise<Briefing> {
    const response = await this.client.get('/briefing/market');
    return response.data;
  }

  async opportunities(): Promise<Briefing> {
    const response = await this.client.get('/briefing/opportunities');
    return response.data;
  }
}

export class OpportunitiesResource {
  constructor(private client: AxiosInstance) {}

  async list(limit = 10): Promise<Opportunity[]> {
    const response = await this.client.get('/api/v1/opportunities', {
      params: { limit },
    });
    return response.data.opportunities;
  }

  async themes(): Promise<Record<string, any>> {
    const response = await this.client.get('/themes');
    return response.data;
  }

  async hiddenFor(symbol: string): Promise<{ suggested: Opportunity[] }> {
    const response = await this.client.get(`/hidden/${symbol}`);
    return response.data;
  }
}

export class RisksResource {
  constructor(private client: AxiosInstance) {}

  async list(limit = 10): Promise<Risk[]> {
    const response = await this.client.get('/api/v1/risks', {
      params: { limit },
    });
    return response.data.risks;
  }

  async scenarios(): Promise<Risk[]> {
    const response = await this.client.get('/scenarios');
    return response.data.scenarios;
  }
}
