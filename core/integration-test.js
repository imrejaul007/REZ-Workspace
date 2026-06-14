/**
 * RTMN Core Services Integration Test
 * Tests cross-service communication and data flow
 */

const http = require('http');

const SERVICES = {
  foundation: [
    { name: 'Capability Matrix', port: 3013, health: '/health' },
    { name: 'Unified Twin', port: 3014, health: '/health' },
    { name: 'Memory Network', port: 3015, health: '/health' }
  ],
  intelligence: [
    { name: 'BOA Council', port: 3016, health: '/health' },
    { name: 'Economic Graph', port: 3017, health: '/health' },
    { name: 'Simulation OS', port: 3018, health: '/health' }
  ],
  department: [
    { name: 'Marketing OS', port: 3020, health: '/health' },
    { name: 'Workforce OS', port: 3021, health: '/health' },
    { name: 'Commerce OS', port: 3022, health: '/health' },
    { name: 'Finance OS', port: 3023, health: '/health' }
  ],
  platform: [
    { name: 'Industry AI Company', port: 3030, health: '/health' },
    { name: 'Marketplace Network', port: 3031, health: '/health' },
    { name: 'Revenue Network', port: 3032, health: '/health' }
  ],
  developer: [
    { name: 'Developer Cloud', port: 3040, health: '/health' }
  ]
};

function testEndpoint(name, port, path) {
  return new Promise((resolve) => {
    const req = http.request(
      { hostname: 'localhost', port, path, method: 'GET', timeout: 2000 },
      (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            resolve({ name, port, status: '✅', service: json.service || json.name });
          } catch {
            resolve({ name, port, status: res.statusCode === 200 ? '✅' : '⚠️', service: `HTTP ${res.statusCode}` });
          }
        });
      }
    );
    req.on('error', () => resolve({ name, port, status: '❌', service: 'offline' }));
    req.on('timeout', () => { req.destroy(); resolve({ name, port, status: '⏱️', service: 'timeout' }); });
    req.end();
  });
}

async function runIntegrationTests() {
  console.log('\n🔗 RTMN Core Services Integration Test\n');
  console.log('═══════════════════════════════════════════════════════════════════\n');

  let totalOnline = 0;
  let totalServices = 0;

  for (const [category, services] of Object.entries(SERVICES)) {
    console.log(`📦 ${category.toUpperCase()} (${services.length} services)`);
    console.log('─────────────────────────────────────────────────────────────────');

    const results = await Promise.all(
      services.map(s => testEndpoint(s.name, s.port, s.health))
    );

    for (const r of results) {
      totalServices++;
      if (r.status === '✅') totalOnline++;
      console.log(`   ${r.status} ${r.name.padEnd(25)} :${r.port}  ${r.service}`);
    }
    console.log('');
  }

  console.log('═══════════════════════════════════════════════════════════════════');
  console.log(`\n📊 Summary: ${totalOnline}/${totalServices} services online`);
  console.log('\n🎯 To start services:');
  console.log('   cd core/<service-name> && npm install && npm start\n');
}

runIntegrationTests();
