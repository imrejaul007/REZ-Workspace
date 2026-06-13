/**
 * RTMN Integration Test Script
 * Tests all cross-system connections
 */

import fetch from 'node-fetch';
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [new winston.transports.Console()]
});

const UNIFIED_FABRIC_URL = process.env.UNIFIED_FABRIC_URL || 'http://localhost:4500';

// ============================================
// TEST SERVICES
// ============================================
const services = {
  core: [
    { name: 'API Gateway', url: 'http://localhost:3000' },
    { name: 'TwinOS Hub', url: 'http://localhost:4000' },
    { name: 'AgentOS Hub', url: 'http://localhost:4001' },
    { name: 'Business Copilot', url: 'http://localhost:4002' }
  ],
  sutar: [
    { name: 'SUTAR Gateway', url: 'http://localhost:4140' },
    { name: 'SUTAR Trust Engine', url: 'http://localhost:4180' },
    { name: 'SUTAR Contract OS', url: 'http://localhost:4190' },
    { name: 'SUTAR Decision Engine', url: 'http://localhost:4240' },
    { name: 'SUTAR Marketplace', url: 'http://localhost:4250' }
  ],
  genie: [
    { name: 'Genie Gateway', url: 'http://localhost:5000' },
    { name: 'Genie Memory', url: 'http://localhost:5001' },
    { name: 'Genie Briefing', url: 'http://localhost:5002' }
  ],
  nexha: [
    { name: 'Nexha Gateway', url: 'http://localhost:5002' },
    { name: 'DistributionOS', url: 'http://localhost:4300' },
    { name: 'FranchiseOS', url: 'http://localhost:4310' },
    { name: 'ProcurementOS', url: 'http://localhost:4320' },
    { name: 'TradeFinance', url: 'http://localhost:4340' },
    { name: 'Intelligence', url: 'http://localhost:4350' }
  ],
  adbazaar: [
    { name: 'AdBazaar Backend', url: 'http://localhost:4085' },
    { name: 'REZ Ads', url: 'http://localhost:3005' },
    { name: 'DOOH Intelligence', url: 'http://localhost:4080' },
    { name: 'Intent Aggregator', url: 'http://localhost:4800' },
    { name: 'Audience Twin', url: 'http://localhost:4805' }
  ],
  ree: [
    { name: 'REE Ops Center', url: 'http://localhost:3000' },
    { name: 'REE Trust Platform', url: 'http://localhost:3001' },
    { name: 'REE Growth Engine', url: 'http://localhost:3002' },
    { name: 'REE Attribution', url: 'http://localhost:3004' }
  ]
};

// ============================================
// TEST FUNCTIONS
// ============================================
async function testHealthCheck(name, url) {
  try {
    const response = await fetch(`${url}/health`, { timeout: 5000 });
    const data = await response.json();
    return {
      name,
      url,
      status: response.ok ? 'healthy' : 'unhealthy',
      response: data
    };
  } catch (error) {
    return {
      name,
      url,
      status: 'unreachable',
      error: error.message
    };
  }
}

async function testUnifiedFabric() {
  logger.info('Testing Unified Fabric...');

  const results = {
    schemas: null,
    services: null,
    flows: null
  };

  try {
    // Test schemas endpoint
    const schemasRes = await fetch(`${UNIFIED_FABRIC_URL}/schemas`);
    results.schemas = schemasRes.ok ? await schemasRes.json() : null;

    // Test services endpoint
    const servicesRes = await fetch(`${UNIFIED_FABRIC_URL}/services`);
    results.services = servicesRes.ok ? await servicesRes.json() : null;

    // Test flows endpoint
    const flowsRes = await fetch(`${UNIFIED_FABRIC_URL}/flows`);
    results.flows = flowsRes.ok ? await flowsRes.json() : null;

    return results;
  } catch (error) {
    logger.error('Unified Fabric test failed:', error.message);
    return results;
  }
}

async function testCrossSystemFlow() {
  logger.info('Testing Cross-System Flow (Copilot Query)...');

  try {
    const response = await fetch(`${UNIFIED_FABRIC_URL}/flows/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        flowId: 'copilot-query',
        context: {
          query: 'What are my sales this week?',
          industry: 'retail',
          userId: 'test-user-001'
        }
      })
    });

    if (!response.ok) {
      return { status: 'failed', error: 'Flow execution failed' };
    }

    const result = await response.json();
    return { status: 'success', result };
  } catch (error) {
    return { status: 'error', error: error.message };
  }
}

async function testBOAQuery() {
  logger.info('Testing BOA Executive Intelligence...');

  try {
    const response = await fetch(`${UNIFIED_FABRIC_URL}/boa/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question: 'Why did revenue drop this week?',
        industry: 'retail',
        context: {
          userId: 'test-user-001'
        }
      })
    });

    if (!response.ok) {
      return { status: 'failed', error: 'BOA query failed' };
    }

    const result = await response.json();
    return { status: 'success', result };
  } catch (error) {
    return { status: 'error', error: error.message };
  }
}

// ============================================
// MAIN TEST RUNNER
// ============================================
async function runTests() {
  logger.info('='.repeat(60));
  logger.info('RTMN Integration Test Suite');
  logger.info('='.repeat(60));

  const results = {
    timestamp: new Date().toISOString(),
    services: {},
    unifiedFabric: null,
    crossSystemFlow: null,
    boaQuery: null
  };

  // Test all service categories
  for (const [category, serviceList] of Object.entries(services)) {
    logger.info(`\nTesting ${category.toUpperCase()} services...`);
    results.services[category] = [];

    for (const service of serviceList) {
      const result = await testHealthCheck(service.name, service.url);
      results.services[category].push(result);

      const icon = result.status === 'healthy' ? '✅' : result.status === 'unreachable' ? '❌' : '⚠️';
      logger.info(`${icon} ${service.name}: ${result.status}`);
    }
  }

  // Test Unified Fabric
  logger.info('\nTesting UNIFIED FABRIC...');
  results.unifiedFabric = await testUnifiedFabric();
  if (results.unifiedFabric.schemas) {
    logger.info(`✅ Unified Fabric: ${Object.keys(results.unifiedFabric.schemas).length} schemas, ${results.unifiedFabric.services?.length || 0} services`);
  } else {
    logger.info('❌ Unified Fabric unreachable');
  }

  // Test Cross-System Flow
  logger.info('\nTesting CROSS-SYSTEM FLOW...');
  results.crossSystemFlow = await testCrossSystemFlow();
  logger.info(`${results.crossSystemFlow.status === 'success' ? '✅' : '❌'} Flow: ${results.crossSystemFlow.status}`);

  // Test BOA Query
  logger.info('\nTesting BOA EXECUTIVE INTELLIGENCE...');
  results.boaQuery = await testBOAQuery();
  logger.info(`${results.boaQuery.status === 'success' ? '✅' : '❌'} BOA: ${results.boaQuery.status}`);

  // ============================================
  // SUMMARY
  // ============================================
  logger.info('\n' + '='.repeat(60));
  logger.info('TEST SUMMARY');
  logger.info('='.repeat(60));

  const totalServices = Object.values(results.services).flat().length;
  const healthyServices = Object.values(results.services).flat().filter(s => s.status === 'healthy').length;

  logger.info(`\nServices: ${healthyServices}/${totalServices} healthy`);

  // Count by category
  for (const [category, serviceList] of Object.entries(results.services)) {
    const healthy = serviceList.filter(s => s.status === 'healthy').length;
    const total = serviceList.length;
    logger.info(`  ${category}: ${healthy}/${total}`);
  }

  logger.info(`\nUnified Fabric: ${results.unifiedFabric?.schemas ? '✅' : '❌'}`);
  logger.info(`Cross-System Flow: ${results.crossSystemFlow?.status === 'success' ? '✅' : '❌'}`);
  logger.info(`BOA Query: ${results.boaQuery?.status === 'success' ? '✅' : '❌'}`);

  // Calculate overall score
  const healthScore = (healthyServices / totalServices) * 100;
  const fabricScore = results.unifiedFabric?.schemas ? 100 : 0;
  const flowScore = results.crossSystemFlow?.status === 'success' ? 100 : 0;
  const boaScore = results.boaQuery?.status === 'success' ? 100 : 0;

  const overallScore = (healthScore * 0.4) + (fabricScore * 0.2) + (flowScore * 0.2) + (boaScore * 0.2);

  logger.info(`\nOverall Integration Score: ${Math.round(overallScore)}%`);

  // Save results
  const fs = await import('fs');
  const reportPath = './test-results.json';
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  logger.info(`\nDetailed results saved to: ${reportPath}`);

  return results;
}

// Run tests
runTests().catch(console.error);
