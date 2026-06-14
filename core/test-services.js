/**
 * RTMN Core Services Test Script
 * Tests all newly built services
 */

const http = require('http');

const services = [
  { name: 'Capability Matrix', port: 3013, path: '/health' },
  { name: 'Unified Twin', port: 3014, path: '/health' },
  { name: 'Memory Network', port: 3015, path: '/health' },
  { name: 'BOA Council', port: 3016, path: '/health' },
  { name: 'Economic Graph', port: 3017, path: '/health' },
  { name: 'Simulation OS', port: 3018, path: '/health' },
  { name: 'Marketing OS', port: 3020, path: '/health' },
  { name: 'Workforce OS', port: 3021, path: '/health' },
  { name: 'Commerce OS', port: 3022, path: '/health' },
  { name: 'Finance OS', port: 3023, path: '/health' },
  { name: 'Industry AI Company', port: 3030, path: '/health' },
  { name: 'Marketplace Network', port: 3031, path: '/health' },
  { name: 'Revenue Network', port: 3032, path: '/health' },
  { name: 'Developer Cloud', port: 3040, path: '/health' }
];

function testService(service) {
  return new Promise((resolve) => {
    const req = http.request(
      {
        hostname: 'localhost',
        port: service.port,
        path: service.path,
        method: 'GET',
        timeout: 3000
      },
      (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            resolve({
              name: service.name,
              port: service.port,
              status: '✅ OK',
              response: json.status || json.service || 'running'
            });
          } catch {
            resolve({
              name: service.name,
              port: service.port,
              status: res.statusCode === 200 ? '✅ OK' : '⚠️ WARNING',
              response: `HTTP ${res.statusCode}`
            });
          }
        });
      }
    );

    req.on('error', () => {
      resolve({
        name: service.name,
        port: service.port,
        status: '❌ OFFLINE',
        response: 'Not running'
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({
        name: service.name,
        port: service.port,
        status: '❌ TIMEOUT',
        response: 'Connection timeout'
      });
    });

    req.end();
  });
}

async function runTests() {
  console.log('🧪 RTMN Core Services Test\n');
  console.log('Testing services...\n');

  const results = await Promise.all(services.map(testService));

  console.log('┌─────────────────────────────────────────────────────────┐');
  console.log('│ Service                 │ Port │ Status │ Response      │');
  console.log('├─────────────────────────────────────────────────────────┤');

  for (const result of results) {
    const name = result.name.padEnd(22);
    const port = String(result.port).padStart(4);
    const status = result.status.padEnd(8);
    const response = String(result.response).substring(0, 13).padEnd(13);
    console.log(`│ ${name} │ ${port} │ ${status} │ ${response} │`);
  }

  console.log('└─────────────────────────────────────────────────────────┘');

  const online = results.filter(r => r.status === '✅ OK').length;
  const offline = results.filter(r => r.status.startsWith('❌')).length;

  console.log(`\n📊 Results: ${online} online, ${offline} offline\n`);

  if (offline > 0) {
    console.log('To start offline services, run:');
    console.log('  npm start  (in each service directory)');
  }
}

runTests();
