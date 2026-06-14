/**
 * AssetMind TypeScript SDK - Client
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import {
  Asset,
  AssetTwin,
  Prediction,
  ResearchReport,
  Briefing,
  Opportunity,
  Risk,
  HealthCheck,
} from './types';
import {
  AssetsResource,
  TwinResource,
  PredictionResource,
  ResearchResource,
  BriefingResource,
  OpportunitiesResource,
  RisksResource,
} from './resources';

export class AssetMindClient {
  private client: AxiosInstance;

  // Resource groups
  public assets: AssetsResource;
  public twin: TwinResource;
  public prediction: PredictionResource;
  public research: ResearchResource;
  public briefing: BriefingResource;
  public opportunities: OpportunitiesResource;
  public risks: RisksResource;

  constructor(config: AssetMindConfig) {
    const baseURL = config.baseUrl || os.getenv('ASSETMIND_API_URL', 'http://localhost:5260');
    const timeout = config.timeout || 30000;

    this.client = axios.create({
      baseURL,
      timeout,
      headers: {
        'Content-Type': 'application/json',
        ...(config.apiKey && { Authorization: `Bearer ${config.apiKey}` }),
      },
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        const message = (error.response?.data as any)?.message || error.message;
        throw new AssetMindError(message, error.response?.status);
      }
    );

    // Initialize resources
    this.assets = new AssetsResource(this.client);
    this.twin = new TwinResource(this.client);
    this.prediction = new PredictionResource(this.client);
    this.research = new ResearchResource(this.client);
    this.briefing = new BriefingResource(this.client);
    this.opportunities = new OpportunitiesResource(this.client);
    this.risks = new RisksResource(this.client);
  }

  async health(): Promise<HealthCheck> {
    const response = await this.client.get('/health');
    return response.data;
  }

  async close(): Promise<void> {
    // axios doesn't require explicit close
  }
}

export interface AssetMindConfig {
  apiKey?: string;
  baseUrl?: string;
  timeout?: number;
}

export class AssetMindError extends Error {
  constructor(
    message: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = 'AssetMindError';
  }
}

// Factory function
export function createClient(config: AssetMindConfig): AssetMindClient {
  return new AssetMindClient(config);
}

// Default export
export default AssetMindClient;
