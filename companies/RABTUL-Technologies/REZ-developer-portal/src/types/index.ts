/**
 * REZ Developer Portal - Types
 */

export interface APIKey {
  id: string;
  name: string;
  key: string;
  prefix: string; // First 8 chars visible
  secret: string; // Hashed
  ownerId: string;
  ownerType: 'merchant' | 'developer' | 'partner';
  scopes: string[]; // Permissions
  rateLimit: number; // requests/min
  status: 'active' | 'paused' | 'revoked';
  createdAt: Date;
  lastUsedAt?: Date;
}

export interface APIEndpoint {
  id: string;
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  description: string;
  category: string;
  version: string;
  scopes: string[];
  rateLimit: number;
  requestSchema?: object;
  responseSchema?: object;
  examples?: {
    request: object;
    response: object;
  };
}

export interface APISdk {
  id: string;
  name: string;
  language: 'javascript' | 'typescript' | 'python' | 'java' | 'go' | 'ruby' | 'php';
  version: string;
  downloadUrl: string;
  docsUrl: string;
}

export interface WebhookSubscription {
  id: string;
  url: string;
  events: string[];
  secret: string;
  active: boolean;
  apiKeyId: string;
  createdAt: Date;
}

export interface UsageMetrics {
  apiKeyId: string;
  period: 'day' | 'week' | 'month';
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  avgLatency: number;
  p99Latency: number;
  quotas: {
    limit: number;
    used: number;
    remaining: number;
    resetAt: Date;
  }[];
}

export interface DeveloperApp {
  id: string;
  name: string;
  description: string;
  website: string;
  ownerId: string;
  apiKeys: APIKey[];
  webhooks: WebhookSubscription[];
  createdAt: Date;
}

export interface APIPlan {
  id: string;
  name: string;
  rateLimit: number;
  monthlyQuota: number;
  price: number;
  features: string[];
}
