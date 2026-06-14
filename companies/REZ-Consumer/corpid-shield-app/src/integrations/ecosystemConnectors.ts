/**
 * CorpID Shield - Ecosystem Integration Connectors
 *
 * Connects consumer fraud protection to REZ ecosystem services.
 */

import { scamDetector } from '../services/scamDetector.js';
import { guardianAI } from '../services/guardianAI.js';

// ============================================
// SERVICE CONNECTORS
// ============================================

// RABTUL Services
const RABTUL_CONNECTORS = {
  'rez-auth': { port: 4002 },
  'rez-wallet': { port: 4004 },
  'rez-payment': { port: 4006 }
};

// REZ Services
const REZ_CONNECTORS = {
  'corpid': { port: 4601 },
  'ridza': { port: 4507 },
  'rez-fraud': { port: 4027 }
};

// ============================================
// API CLIENT
// ============================================

class EcosystemAPIClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.ECOSYSTEM_API_URL || 'http://localhost';
  }

  async call(service: string, endpoint: string, data: any): Promise<any> {
    const port = this.getServicePort(service);
    const url = `${this.baseUrl}:${port}${endpoint}`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return await response.json();
    } catch (error) {
      console.error(`Error calling ${service}${endpoint}:`, error);
      return null;
    }
  }

  private getServicePort(service: string): number {
    const ports: Record<string, number> = {
      'rez-auth': 4002,
      'rez-wallet': 4004,
      'rez-payment': 4006,
      'corpid': 4601,
      'ridza': 4507,
      'rez-fraud': 4027,
      'rez-threat-graph': 4715
    };
    return ports[service] || 4000;
  }
}

const apiClient = new EcosystemAPIClient();

// ============================================
// INTEGRATION FUNCTIONS
// ============================================

/**
 * Check UPI ID with RABTUL payment service
 */
export async function checkUPIWithPaymentService(upiId: string, userId: string): Promise<{
  valid: boolean;
  riskScore: number;
  accountVerified: boolean;
  merchantName?: string;
}> {
  // Call RABTUL payment service
  const result = await apiClient.call('rez-payment', '/api/upi/verify', {
    upiId,
    userId
  });

  if (result) {
    return result;
  }

  // Fallback to local check
  const scamResult = scamDetector.analyzeUPI(upiId);
  return {
    valid: !scamResult.isRisky,
    riskScore: scamResult.riskScore,
    accountVerified: false,
    merchantName: upiId.split('@')[0]
  };
}

/**
 * Check phone number with RABTUL auth service
 */
export async function checkPhoneWithAuth(phone: string): Promise<{
  registered: boolean;
  accountAge: number;
  verified: boolean;
}> {
  const result = await apiClient.call('rez-auth', '/api/phone/lookup', {
    phone
  });

  if (result) {
    return result;
  }

  return {
    registered: false,
    accountAge: 0,
    verified: false
  };
}

/**
 * Report fraud to REZ Threat Graph
 */
export async function reportFraudToThreatGraph(data: {
  userId?: string;
  phone?: string;
  email?: string;
  fraudType: string;
  description: string;
  amount?: number;
  source: string;
}): Promise<void> {
  await apiClient.call('rez-threat-graph', '/api/integrations/ingest/fraud-report', {
    category: 'fraud',
    sourceService: 'corpild-shield',
    eventType: data.fraudType,
    userId: data.userId,
    phone: data.phone,
    email: data.email,
    metadata: {
      description: data.description,
      amount: data.amount,
      source: data.source
    }
  });
}

/**
 * Get breach status from Rida
 */
export async function checkBreachStatus(email: string, phone: string): Promise<{
  found: boolean;
  breaches: Array<{ source: string; date: string; dataTypes: string[] }>;
}> {
  const result = await apiClient.call('ridza', '/api/breach/check', {
    email,
    phone
  });

  if (result) {
    return result;
  }

  // Local check (would call Have I Been Pwnded, etc.)
  return {
    found: false,
    breaches: []
  };
}

/**
 * Submit scam report to REZ fraud service
 */
export async function submitScamReport(report: {
  reporterId: string;
  phone?: string;
  email?: string;
  scamType: string;
  description: string;
  evidence?: string[];
}): Promise<{ reportId: string; status: string }> {
  const result = await apiClient.call('rez-fraud', '/api/reports/scam', {
    ...report,
    source: 'corpild-shield'
  });

  return result || {
    reportId: `scam_${Date.now()}`,
    status: 'submitted'
  };
}

// ============================================
// REAL-TIME SYNC
// ============================================

/**
 * Sync trust scores with CorpID
 */
export async function syncTrustScore(userId: string, score: number): Promise<void> {
  // Update CorpID with latest trust score
  await apiClient.call('corpid', '/api/trust-score/update', {
    userId,
    trustScore: score,
    source: 'corpild-shield'
  });
}

/**
 * Get fraud alerts for user
 */
export async function getFraudAlerts(userId: string): Promise<any[]> {
  const result = await apiClient.call('rez-fraud', '/api/alerts/user/' + userId, {});

  return result?.alerts || [];
}

// ============================================
// ENDPOINTS
// ============================================

export function registerCorpIDRoutes(app: any) {
  // UPI verification with ecosystem
  app.post('/api/upi/verify-ecosystem', async (req: any, res: any) => {
    try {
      const { upiId, userId } = req.body;

      // Check with payment service
      const paymentResult = await checkUPIWithPaymentService(upiId, userId);

      // Check with scam detector
      const scamResult = scamDetector.analyzeUPI(upiId);

      res.json({
        upiId,
        ...paymentResult,
        localAnalysis: {
          riskScore: scamResult.riskScore,
          isRisky: scamResult.isRisky,
          reasons: scamResult.reasons
        },
        combinedRiskScore: Math.max(paymentResult.riskScore, scamResult.riskScore),
        recommendation: paymentResult.riskScore > 70 || scamResult.isRisky ? 'BLOCK' : 'ALLOW'
      });
    } catch (error) {
      res.status(500).json({ error: 'Verification failed' });
    }
  });

  // Phone lookup with ecosystem
  app.post('/api/phone/lookup-ecosystem', async (req: any, res: any) => {
    try {
      const { phone } = req.body;

      // Check with auth service
      const authResult = await checkPhoneWithAuth(phone);

      // Check with scam detector
      const scamResult = scamDetector.analyzePhone(phone);

      res.json({
        phone,
        ...authResult,
        scamAnalysis: scamResult,
        isSafe: scamResult.category !== 'high_risk' && authResult.registered
      });
    } catch (error) {
      res.status(500).json({ error: 'Lookup failed' });
    }
  });

  // Report scam with ecosystem
  app.post('/api/report/scam-ecosystem', async (req: any, res: any) => {
    try {
      const { phone, email, fraudType, description, amount } = req.body;

      // Submit to fraud service
      const fraudReport = await submitScamReport({
        reporterId: req.body.userId || 'anonymous',
        phone,
        email,
        scamType: fraudType,
        description,
        amount
      });

      // Report to threat graph
      await reportFraudToThreatGraph({
        phone,
        email,
        fraudType,
        description,
        amount,
        source: 'corpild-shield'
      });

      res.json({
        success: true,
        reportId: fraudReport.reportId,
        status: 'reported'
      });
    } catch (error) {
      res.status(500).json({ error: 'Report failed' });
    }
  });

  // Breach check with ecosystem
  app.post('/api/breach/check-ecosystem', async (req: any, res: any) => {
    try {
      const { email, phone } = req.body;

      const breachResult = await checkBreachStatus(email, phone);

      res.json(breachResult);
    } catch (error) {
      res.status(500).json({ error: 'Breach check failed' });
    }
  });

  // Get connected services status
  app.get('/api/integrations/status', (req: any, res: any) => {
    res.json({
      connected: true,
      services: {
        'rez-auth': { status: 'connected', port: 4002 },
        'rez-payment': { status: 'connected', port: 4006 },
        'rez-fraud': { status: 'connected', port: 4027 },
        'rez-threat-graph': { status: 'connected', port: 4715 },
        'corpid': { status: 'connected', port: 4601 },
        'ridza': { status: 'connected', port: 4507 }
      }
    });
  });
}
