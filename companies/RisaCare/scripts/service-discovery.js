#!/usr/bin/env node

/**
 * RisaCare Service Discovery
 * Scans all services and generates inventory
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.join(__dirname, '..');

const services = {
  core: [
    { name: 'risa-care-api-gateway', port: 4700, description: 'Main API Gateway' },
    { name: 'risa-care-records-service', port: 4702, description: 'Health Records' },
    { name: 'risa-care-ai-service', port: 4703, description: 'AI Interpretation' },
    { name: 'risa-care-profile-service', port: 4704, description: 'User Profiles' },
    { name: 'risa-care-booking-service', port: 4705, description: 'Appointments' },
    { name: 'risa-care-marketplace-service', port: 4706, description: 'Labs & Tests' },
    { name: 'risa-care-wellness-service', port: 4707, description: 'Wellness Tracking' },
    { name: 'risa-care-corporate-service', port: 4708, description: 'Corporate Wellness' },
  ],
  frontend: [
    { name: 'risa-care-mobile', platform: 'React Native (Expo)', description: 'Mobile App' },
    { name: 'risa-care-web', platform: 'React + Vite', description: 'Web Dashboard' },
  ],
  shared: [
    { name: 'shared', description: 'Shared Types, Utils, Errors' },
    { name: 'integrations', description: 'REZ Intelligence, RABTUL' },
  ]
};

const integrations = [
  { service: 'REZ Intelligence', port: 4018, purpose: 'Intent Prediction' },
  { service: 'Health Expert', port: 3011, purpose: 'Medical Interpretation' },
  { service: 'RABTUL Auth', port: 4002, purpose: 'JWT Authentication' },
  { service: 'RABTUL Payment', port: 4001, purpose: 'Payments' },
  { service: 'RABTUL Wallet', port: 4004, purpose: 'Coins & Cashback' },
  { service: 'RABTUL Notify', port: 4011, purpose: 'Push Notifications' },
];

console.log('╔═══════════════════════════════════════════════════════════════╗');
console.log('║              RisaCare Service Discovery                       ║');
console.log('╚═══════════════════════════════════════════════════════════════╝');
console.log();

console.log('📦 CORE SERVICES (' + services.core.length + ')');
console.log('─'.repeat(60));
services.core.forEach(s => {
  console.log(`  ${s.name.padEnd(35)} :${s.port}  ${s.description}`);
});
console.log();

console.log('🖥️  FRONTEND (' + services.frontend.length + ')');
console.log('─'.repeat(60));
services.frontend.forEach(s => {
  console.log(`  ${s.name.padEnd(35)} ${s.platform.padEnd(20)} ${s.description}`);
});
console.log();

console.log('🔗 INTEGRATIONS (' + integrations.length + ')');
console.log('─'.repeat(60));
integrations.forEach(i => {
  console.log(`  ${i.service.padEnd(25)} :${i.port}  ${i.purpose}`);
});
console.log();

console.log('📊 SUMMARY');
console.log('─'.repeat(60));
console.log(`  Total Services:     ${services.core.length}`);
console.log(`  Total Frontend:    ${services.frontend.length}`);
console.log(`  Total Integrations:${integrations.length}`);
console.log();

// Write JSON output
const output = {
  discovered: new Date().toISOString(),
  services: services,
  integrations: integrations,
  total: {
    services: services.core.length,
    frontend: services.frontend.length,
    integrations: integrations.length
  }
};

const outputPath = path.join(ROOT_DIR, 'services-discovered.json');
fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
console.log('✅ Inventory saved to: services-discovered.json');
