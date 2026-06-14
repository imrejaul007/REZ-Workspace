/**
 * SDK Gateway Service - Manages all AdBazaar SDKs
 *
 * Features:
 * - SDK registration
 * - API key management
 * - SDK usage tracking
 * - SDK marketplace
 * - Documentation
 *
 * Port: 4850
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';

interface SDK {
  id: string;
  name: string;
  platform: 'ios' | 'android' | 'web' | 'react-native' | 'node' | 'python' | 'java';
  version: string;
  description: string;
  features: string[];
  docs: string;
  npmPackage?: string;
  cocoapodsPod?: string;
  gradleDependency?: string;
  downloads: number;
  stars: number;
  status: 'stable' | 'beta' | 'deprecated';
}

interface SDKKey {
  id: string;
  key: string;
  sdkId: string;
  tenantId: string;
  permissions: string[];
  rateLimit: number;
  createdAt: Date;
  lastUsed?: Date;
}

interface SDKStats {
  totalIntegrations: number;
  apiCalls: number;
  errors: number;
  latency: number;
}

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());
const PORT = parseInt(process.env.PORT || '4850', 10);

const sdks: SDK[] = [
  {
    id: 'sdk_web',
    name: 'AdBazaar Web SDK',
    platform: 'web',
    version: '2.0.0',
    description: 'JavaScript SDK for web browsers',
    features: ['Banner Ads', 'Native Ads', 'Interstitial Ads', 'Rewarded Ads', 'Analytics', 'Event Tracking'],
    docs: 'https://docs.adbazaar.com/web-sdk',
    downloads: 15000,
    stars: 230,
    status: 'stable',
  },
  {
    id: 'sdk_react',
    name: 'AdBazaar React SDK',
    platform: 'react-native',
    version: '2.0.0',
    description: 'React Native SDK for iOS and Android',
    features: ['Banner Ads', 'Native Ads', 'Interstitial Ads', 'Rewarded Ads', 'Analytics', 'Event Tracking'],
    docs: 'https://docs.adbazaar.com/react-native-sdk',
    npmPackage: '@adbazaar/react-native-sdk',
    downloads: 8500,
    stars: 180,
    status: 'stable',
  },
  {
    id: 'sdk_ios',
    name: 'AdBazaar iOS SDK',
    platform: 'ios',
    version: '2.0.0',
    description: 'Swift SDK for iOS apps',
    features: ['Banner Ads', 'Native Ads', 'Interstitial Ads', 'Rewarded Ads', 'Analytics', 'Event Tracking'],
    docs: 'https://docs.adbazaar.com/ios-sdk',
    cocoapodsPod: 'AdBazaar',
    downloads: 6200,
    stars: 145,
    status: 'stable',
  },
  {
    id: 'sdk_android',
    name: 'AdBazaar Android SDK',
    platform: 'android',
    version: '2.0.0',
    description: 'Kotlin/Java SDK for Android apps',
    features: ['Banner Ads', 'Native Ads', 'Interstitial Ads', 'Rewarded Ads', 'Analytics', 'Event Tracking'],
    docs: 'https://docs.adbazaar.com/android-sdk',
    gradleDependency: 'com.adbazaar:sdk:2.0.0',
    downloads: 9800,
    stars: 210,
    status: 'stable',
  },
  {
    id: 'sdk_node',
    name: 'AdBazaar Node.js SDK',
    platform: 'node',
    version: '1.5.0',
    description: 'Server-side Node.js SDK',
    features: ['Campaign Management', 'Analytics', 'Reporting', 'Webhooks'],
    docs: 'https://docs.adbazaar.com/node-sdk',
    npmPackage: '@adbazaar/node-sdk',
    downloads: 4200,
    stars: 95,
    status: 'stable',
  },
  {
    id: 'sdk_python',
    name: 'AdBazaar Python SDK',
    platform: 'python',
    version: '1.5.0',
    description: 'Python SDK for data science',
    features: ['Analytics', 'Reporting', 'Data Export', 'ML Integration'],
    docs: 'https://docs.adbazaar.com/python-sdk',
    downloads: 3100,
    stars: 78,
    status: 'stable',
  },
  {
    id: 'sdk_qr',
    name: 'AdBazaar QR SDK',
    platform: 'react-native',
    version: '1.0.0',
    description: 'QR code generation and scanning SDK',
    features: ['QR Generation', 'QR Scanning', 'Deep Links', 'Analytics'],
    docs: 'https://docs.adbazaar.com/qr-sdk',
    npmPackage: '@adbazaar/qr-sdk',
    downloads: 2500,
    stars: 65,
    status: 'beta',
  },
  {
    id: 'sdk_pos',
    name: 'AdBazaar POS SDK',
    platform: 'node',
    version: '1.0.0',
    description: 'Point of Sale integration SDK',
    features: ['Ad Display', 'QR Scanning', 'Payment Integration', 'Analytics'],
    docs: 'https://docs.adbazaar.com/pos-sdk',
    npmPackage: '@adbazaar/pos-sdk',
    downloads: 1200,
    stars: 42,
    status: 'beta',
  },
];

const sdkKeys: SDKKey[] = [];
const sdkStats: SDKStats = {
  totalIntegrations: 145,
  apiCalls: 4500000,
  errors: 234,
  latency: 45,
};

// Health
app.get('/health', (_, res) => res.json({ status: 'ok', service: 'sdk-gateway', sdks: sdks.length }));

// List SDKs
app.get('/api/sdks', (req, res) => {
  const { platform, status } = req.query;
  let filtered = [...sdks];
  if (platform) filtered = filtered.filter(s => s.platform === platform);
  if (status) filtered = filtered.filter(s => s.status === status);
  filtered.sort((a, b) => b.downloads - a.downloads);
  res.json({ success: true, data: filtered });
});

// Get SDK
app.get('/api/sdks/:id', (req, res) => {
  const sdk = sdks.find(s => s.id === req.params.id);
  if (!sdk) return res.status(404).json({ success: false });
  res.json({ success: true, data: sdk });
});

// Get SDK code
app.get('/api/sdks/:id/code', (req, res) => {
  const sdk = sdks.find(s => s.id === req.params.id);
  if (!sdk) return res.status(404).json({ success: false });

  const codeExamples: Record<string, string> = {
    'sdk_web': `<!-- AdBazaar Web SDK -->
<script src="https://cdn.adbazaar.com/sdk/web/latest.js"></script>
<script>
  AdBazaar.init({ appId: 'YOUR_APP_ID' });
  AdBazaar.Banner.show({ slotId: 'banner-slot' });
</script>`,
    'sdk_react': `npm install @adbazaar/react-native-sdk

import { AdBazaar, Banner, Interstitial } from '@adbazaar/react-native-sdk';

<AdBazaar appId="YOUR_APP_ID">
  <Banner slotId="banner-slot" />
</AdBazaar>`,
    'sdk_ios': `// Podfile
pod 'AdBazaar', '~> 2.0'

// Swift
import AdBazaar
AdBazaar.initialize(appId: "YOUR_APP_ID")
AdBazaar.Banner.show(slotId: "banner-slot")`,
    'sdk_android': `// build.gradle
implementation 'com.adbazaar:sdk:2.0.0'

// Kotlin
AdBazaar.init(context, "YOUR_APP_ID")
AdBazaar.Banner.show("banner-slot")`,
    'sdk_node': `npm install @adbazaar/node-sdk

import { AdBazaar } from '@adbazaar/node-sdk';
const adbazaar = new AdBazaar({ appId: 'YOUR_APP_ID' });
await adbazaar.campaigns.list();`,
    'sdk_python': `pip install adbazaar-sdk

from adbazaar import AdBazaar
client = AdBazaar(app_id='YOUR_APP_ID')
campaigns = client.campaigns.list()`,
  };

  res.json({
    success: true,
    data: {
      sdk,
      code: codeExamples[sdk.id] || '# Code example not available',
      installation: sdk.npmPackage || sdk.cocoapodsPod || sdk.gradleDependency || 'See documentation',
    },
  });
});

// Generate API Key
app.post('/api/keys', (req, res) => {
  const { sdkId, tenantId, permissions } = req.body;
  const key: SDKKey = {
    id: `key_${Date.now()}`,
    key: `sk_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`,
    sdkId,
    tenantId,
    permissions: permissions || ['read', 'write'],
    rateLimit: 1000,
    createdAt: new Date(),
  };
  sdkKeys.push(key);
  res.json({ success: true, data: key });
});

// List API Keys
app.get('/api/keys', (req, res) => {
  const { tenantId } = req.query;
  let filtered = sdkKeys;
  if (tenantId) filtered = filtered.filter(k => k.tenantId === tenantId);
  res.json({ success: true, data: filtered });
});

// Revoke API Key
app.delete('/api/keys/:id', (req, res) => {
  const index = sdkKeys.findIndex(k => k.id === req.params.id);
  if (index === -1) return res.status(404).json({ success: false });
  sdkKeys.splice(index, 1);
  res.json({ success: true, message: 'Key revoked' });
});

// SDK Stats
app.get('/api/stats', (_, res) => {
  res.json({
    success: true,
    data: {
      ...sdkStats,
      byPlatform: {
        web: sdks.filter(s => s.platform === 'web').reduce((sum, s) => sum + s.downloads, 0),
        react_native: sdks.filter(s => s.platform === 'react-native').reduce((sum, s) => sum + s.downloads, 0),
        ios: sdks.filter(s => s.platform === 'ios').reduce((sum, s) => sum + s.downloads, 0),
        android: sdks.filter(s => s.platform === 'android').reduce((sum, s) => sum + s.downloads, 0),
      },
      topSDKs: sdks.sort((a, b) => b.downloads - a.downloads).slice(0, 3).map(s => ({ name: s.name, downloads: s.downloads })),
    },
  });
});

// SDK Marketplace
app.get('/api/marketplace', (_, res) => {
  res.json({
    success: true,
    data: {
      featured: sdks.filter(s => s.downloads > 5000),
      new: sdks.filter(s => s.status === 'beta'),
      categories: [
        { name: 'Mobile', platforms: ['ios', 'android', 'react-native'], count: sdks.filter(s => ['ios', 'android', 'react-native'].includes(s.platform)).length },
        { name: 'Web', platforms: ['web'], count: sdks.filter(s => s.platform === 'web').length },
        { name: 'Server', platforms: ['node', 'python'], count: sdks.filter(s => ['node', 'python'].includes(s.platform)).length },
        { name: 'Integrations', platforms: ['qr', 'pos'], count: sdks.filter(s => ['qr', 'pos'].includes(s.platform)).length },
      ],
    },
  });
});

app.listen(PORT, () => logger.info(`[SDK Gateway] Running on port ${PORT}`));
export default app;
