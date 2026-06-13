#!/usr/bin/env npx tsx
/**
 * REZ Ecosystem - Service Launcher
 * Starts all services in the correct order with dependency management
 *
 * Usage:
 *   npx tsx start-services.ts all         # Start everything
 *   npx tsx start-services.ts hojai       # HOJAI AI only
 *   npx tsx start-services.ts rabtul      # RABTUL only
 *   npx tsx start-services.ts dev         # Development mode (watch mode)
 */

import { spawn, ChildProcess } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';

interface Service {
  name: string;
  port: number;
  command: string;
  args: string[];
  cwd: string;
  dependsOn: string[];
  healthCheck?: string;
}

interface RunningService {
  name: string;
  process: ChildProcess;
  port: number;
}

// ============================================
// SERVICE DEFINITIONS
// ============================================

const SERVICES: Service[] = [
  // HOJAI AI Core (4500-4590)
  {
    name: 'hojai-gateway',
    port: 4500,
    command: 'npx',
    args: ['tsx', 'src/index.ts'],
    cwd: './hojai-ai/hojai-core/hojai-api-gateway',
    dependsOn: [],
    healthCheck: 'http://localhost:4500/health',
  },
  {
    name: 'hojai-memory',
    port: 4520,
    command: 'npx',
    args: ['tsx', 'src/index.ts'],
    cwd: './hojai-ai/hojai-core/hojai-memory',
    dependsOn: [],
    healthCheck: 'http://localhost:4520/health',
  },
  {
    name: 'hojai-intelligence',
    port: 4530,
    command: 'npx',
    args: ['tsx', 'src/index.ts'],
    cwd: './hojai-ai/hojai-core/hojai-intelligence',
    dependsOn: ['hojai-memory'],
    healthCheck: 'http://localhost:4530/health',
  },
  {
    name: 'hojai-agents',
    port: 4550,
    command: 'npx',
    args: ['tsx', 'src/index.ts'],
    cwd: './hojai-ai/hojai-core/hojai-agents',
    dependsOn: ['hojai-memory'],
    healthCheck: 'http://localhost:4550/health',
  },
  {
    name: 'hojai-workflows',
    port: 4560,
    command: 'npx',
    args: ['tsx', 'src/index.ts'],
    cwd: './hojai-ai/hojai-core/hojai-workflow',
    dependsOn: [],
    healthCheck: 'http://localhost:4560/health',
  },

  // HOJAI Genie (4703-4707)
  {
    name: 'genie-memory',
    port: 4703,
    command: 'npx',
    args: ['tsx', 'src/index.ts'],
    cwd: './hojai-ai/genie-memory-service',
    dependsOn: ['hojai-memory'],
    healthCheck: 'http://localhost:4703/health',
  },
  {
    name: 'genie-relation',
    port: 4704,
    command: 'npx',
    args: ['tsx', 'src/index.ts'],
    cwd: './hojai-ai/genie-relation-service',
    dependsOn: ['hojai-memory'],
    healthCheck: 'http://localhost:4704/health',
  },
  {
    name: 'genie-briefing',
    port: 4706,
    command: 'npx',
    args: ['tsx', 'src/index.ts'],
    cwd: './hojai-ai/genie-briefing-service',
    dependsOn: ['genie-memory'],
    healthCheck: 'http://localhost:4706/health',
  },

  // HOJAI Intelligence Suite (4750-4754)
  {
    name: 'commerce-ai',
    port: 4750,
    command: 'npx',
    args: ['tsx', 'src/index.ts'],
    cwd: './REZ-Intelligence/commerce-intelligence',
    dependsOn: ['hojai-intelligence'],
    healthCheck: 'http://localhost:4750/health',
  },
  {
    name: 'customer-ai',
    port: 4752,
    command: 'npx',
    args: ['tsx', 'src/index.ts'],
    cwd: './REZ-Intelligence/customer-intelligence',
    dependsOn: [],
    healthCheck: 'http://localhost:4752/health',
  },
  {
    name: 'marketing-ai',
    port: 4753,
    command: 'npx',
    args: ['tsx', 'src/index.ts'],
    cwd: './REZ-Intelligence/marketing-intelligence',
    dependsOn: [],
    healthCheck: 'http://localhost:4753/health',
  },

  // SUTAR OS (4140-4254)
  {
    name: 'sutar-gateway',
    port: 4140,
    command: 'npx',
    args: ['tsx', 'src/index.ts'],
    cwd: './hojai-ai/hojai-sutar-os/services/sutar-gateway',
    dependsOn: [],
    healthCheck: 'http://localhost:4140/health',
  },
  {
    name: 'sutar-twin-os',
    port: 4142,
    command: 'npx',
    args: ['tsx', 'src/index.ts'],
    cwd: './hojai-ai/hojai-sutar-os/services/sutar-twin-os',
    dependsOn: ['hojai-memory'],
    healthCheck: 'http://localhost:4142/health',
  },
  {
    name: 'sutar-intent',
    port: 4154,
    command: 'npx',
    args: ['tsx', 'src/index.ts'],
    cwd: './hojai-ai/hojai-sutar-os/services/sutar-intent-bus',
    dependsOn: [],
    healthCheck: 'http://localhost:4154/health',
  },
  {
    name: 'sutar-decision',
    port: 4240,
    command: 'npx',
    args: ['tsx', 'src/index.ts'],
    cwd: './hojai-ai/hojai-sutar-os/services/sutar-decision-engine',
    dependsOn: [],
    healthCheck: 'http://localhost:4240/health',
  },
  {
    name: 'sutar-simulation',
    port: 4241,
    command: 'npx',
    args: ['tsx', 'src/index.ts'],
    cwd: './hojai-ai/hojai-sutar-os/services/sutar-simulation-os',
    dependsOn: [],
    healthCheck: 'http://localhost:4241/health',
  },
  {
    name: 'sutar-goal',
    port: 4242,
    command: 'npx',
    args: ['tsx', 'src/index.ts'],
    cwd: './hojai-ai/hojai-sutar-os/services/sutar-goal-os',
    dependsOn: [],
    healthCheck: 'http://localhost:4242/health',
  },
  {
    name: 'sutar-marketplace',
    port: 4250,
    command: 'npx',
    args: ['tsx', 'src/index.ts'],
    cwd: './hojai-ai/hojai-sutar-os/services/sutar-marketplace',
    dependsOn: [],
    healthCheck: 'http://localhost:4250/health',
  },

  // RABTUL Event Bus Bridge
  {
    name: 'rez-event-bus-bridge',
    port: 4090,
    command: 'npx',
    args: ['tsx', 'src/index.ts'],
    cwd: './RABTUL-Technologies/REZ-event-bus-bridge',
    dependsOn: [],
    healthCheck: 'http://localhost:4090/health',
  },

  // RABTUL Services
  {
    name: 'rez-auth-service',
    port: 4002,
    command: 'npx',
    args: ['tsx', 'src/index.ts'],
    cwd: './RABTUL-Technologies/REZ-auth-service',
    dependsOn: [],
    healthCheck: 'http://localhost:4002/health',
  },
  {
    name: 'rez-wallet-service',
    port: 4004,
    command: 'npx',
    args: ['tsx', 'src/index.ts'],
    cwd: './RABTUL-Technologies/REZ-wallet-service',
    dependsOn: [],
    healthCheck: 'http://localhost:4004/health',
  },
  {
    name: 'rez-event-bus',
    port: 4025,
    command: 'npx',
    args: ['tsx', 'src/index.ts'],
    cwd: './RABTUL-Technologies/REZ-event-bus',
    dependsOn: [],
    healthCheck: 'http://localhost:4025/health',
  },

  // REZ Intelligence
  {
    name: 'rez-intent-predictor',
    port: 4018,
    command: 'npx',
    args: ['tsx', 'src/index.ts'],
    cwd: './REZ-Intelligence/REZ-intent-predictor',
    dependsOn: [],
    healthCheck: 'http://localhost:4018/health',
  },
  {
    name: 'rez-memory-layer',
    port: 4201,
    command: 'npx',
    args: ['tsx', 'src/index.ts'],
    cwd: './REZ-Intelligence/REZ-memory-layer',
    dependsOn: [],
    healthCheck: 'http://localhost:4201/health',
  },

  // Unified Hub
  {
    name: 'rez-unified-hub',
    port: 4600,
    command: 'npx',
    args: ['tsx', 'src/index.ts'],
    cwd: './RABTUL-Technologies/REZ-unified-hub',
    dependsOn: ['rez-auth-service', 'rez-wallet-service', 'hojai-gateway', 'genie-memory'],
    healthCheck: 'http://localhost:4600/health',
  },

  // Companies
  {
    name: 'stayown-api',
    port: 4801,
    command: 'npx',
    args: ['tsx', 'src/index.ts'],
    cwd: './StayOwn-Hospitality/src',
    dependsOn: ['rez-unified-hub', 'hojai-memory'],
    healthCheck: 'http://localhost:4801/health',
  },
  {
    name: 'risnaestate-api',
    port: 4901,
    command: 'npx',
    args: ['tsx', 'src/index.ts'],
    cwd: './RisnaEstate/src',
    dependsOn: ['rez-unified-hub', 'hojai-intelligence'],
    healthCheck: 'http://localhost:4901/health',
  },
  {
    name: 'nexha-api',
    port: 5001,
    command: 'npx',
    args: ['tsx', 'src/index.ts'],
    cwd: './Nexha/nexha-commerce-network/src',
    dependsOn: ['rez-unified-hub', 'hojai-gateway'],
    healthCheck: 'http://localhost:5001/health',
  },
  {
    name: 'rez-consumer-api',
    port: 4200,
    command: 'npx',
    args: ['tsx', 'src/index.ts'],
    cwd: './REZ-Consumer/services',
    dependsOn: ['rez-unified-hub', 'genie-memory'],
    healthCheck: 'http://localhost:4200/health',
  },

  // Transport OS Services
  {
    name: 'rider-twin',
    port: 9050,
    command: 'npx',
    args: ['tsx', 'src/index.ts'],
    cwd: './industries/transport-os/services/rider-twin',
    dependsOn: [],
    healthCheck: 'http://localhost:9050/health',
  },
];

// ============================================
// SERVICE MANAGER
// ============================================

class ServiceManager {
  private runningServices: Map<string, RunningService> = new Map();
  private mode: 'production' | 'development' = 'production';
  private filter: string | null = null;

  constructor() {
    // Handle process signals
    process.on('SIGINT', () => this.shutdown());
    process.on('SIGTERM', () => this.shutdown());
  }

  setMode(mode: 'production' | 'development') {
    this.mode = mode;
  }

  setFilter(filter: string) {
    this.filter = filter;
  }

  getServicesToStart(): Service[] {
    let services = SERVICES;

    if (this.filter) {
      services = services.filter(s => s.name.includes(this.filter!));
    }

    return services;
  }

  canStart(service: Service): boolean {
    return service.dependsOn.every(dep => {
      const running = this.runningServices.get(dep);
      return running && running.process.exitCode === null;
    });
  }

  async checkHealth(url: string, timeout = 5000): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        signal: controller.signal,
        method: 'GET',
      });

      clearTimeout(timeoutId);
      return response.ok;
    } catch {
      return false;
    }
  }

  async startService(service: Service): Promise<boolean> {
    const servicePath = join(process.cwd(), service.cwd);

    // Check if directory exists
    if (!existsSync(servicePath)) {
      console.log(`⏭️  ${service.name} - Directory not found: ${service.cwd}`);
      return false;
    }

    // Check if port is in use
    const portInUse = await this.checkPort(service.port);
    if (portInUse) {
      console.log(`⚠️  ${service.name} - Port ${service.port} already in use`);
      return false;
    }

    console.log(`🚀 Starting ${service.name} (port ${service.port})...`);

    const proc = spawn(service.command, service.args, {
      cwd: servicePath,
      stdio: this.mode === 'development' ? 'inherit' : ['ignore', 'pipe', 'pipe'],
      shell: true,
      env: {
        ...process.env,
        PORT: String(service.port),
        NODE_ENV: this.mode,
      },
    });

    this.runningServices.set(service.name, {
      name: service.name,
      process: proc,
      port: service.port,
    });

    // Handle output in production mode
    if (this.mode === 'production') {
      proc.stdout?.on('data', (data) => {
        process.stdout.write(`[${service.name}] ${data}`);
      });
      proc.stderr?.on('data', (data) => {
        process.stderr.write(`[${service.name}] ${data}`);
      });
    }

    proc.on('error', (error) => {
      console.error(`❌ ${service.name} error: ${error.message}`);
      this.runningServices.delete(service.name);
    });

    proc.on('exit', (code) => {
      if (code !== 0 && code !== null) {
        console.log(`⚠️  ${service.name} exited with code ${code}`);
      }
      this.runningServices.delete(service.name);
    });

    return true;
  }

  async checkPort(port: number): Promise<boolean> {
    return new Promise((resolve) => {
      const net = require('net');
      const server = net.createServer();

      server.once('error', () => {
        resolve(true); // Port in use
      });

      server.once('listening', () => {
        server.close();
        resolve(false); // Port free
      });

      server.listen(port, '127.0.0.1');
    });
  }

  async startAll() {
    console.log('========================================');
    console.log('  REZ ECOSYSTEM - SERVICE LAUNCHER');
    console.log('========================================\n');

    const services = this.getServicesToStart();

    console.log(`Starting ${services.length} services in ${this.mode} mode...\n`);

    for (const service of services) {
      if (this.canStart(service)) {
        await this.startService(service);
      } else {
        console.log(`⏳ ${service.name} - Waiting for dependencies: ${service.dependsOn.join(', ')}`);
      }
    }

    // Wait for dependencies and retry
    await this.waitForDependencies(services);

    console.log('\n========================================');
    console.log('  SERVICES STARTED');
    console.log('========================================\n');
    this.showStatus();
  }

  async waitForDependencies(services: Service[], maxWait = 60000) {
    const start = Date.now();

    while (Date.now() - start < maxWait) {
      let anyStarted = false;

      for (const service of services) {
        if (!this.runningServices.has(service.name) && this.canStart(service)) {
          await this.startService(service);
          anyStarted = true;
        }
      }

      if (!anyStarted) {
        // Check if all services are either running or can't be started
        const allDone = services.every(s =>
          this.runningServices.has(s.name) ||
          !s.dependsOn.every(dep => SERVICES.find(d => d.name === dep))
        );

        if (allDone) break;
      }

      await new Promise(r => setTimeout(r, 2000)); // Wait 2 seconds
    }
  }

  showStatus() {
    console.log('Service Status:');
    console.log('-'.repeat(50));

    for (const [name, running] of this.runningServices) {
      const status = running.process.exitCode === null ? '✅ Running' : '❌ Stopped';
      console.log(`  ${status}  ${name} (${running.port})`);
    }

    console.log('-'.repeat(50));
  }

  async shutdown() {
    console.log('\n🛑 Shutting down services...');

    for (const [name, running] of this.runningServices) {
      console.log(`  Stopping ${name}...`);
      running.process.kill('SIGTERM');
    }

    // Wait for graceful shutdown
    await new Promise(r => setTimeout(r, 3000));

    console.log('✅ All services stopped.');
    process.exit(0);
  }
}

// ============================================
// MAIN
// ============================================

async function main() {
  const manager = new ServiceManager();

  const args = process.argv.slice(2);
  const command = args[0] || 'all';

  switch (command) {
    case 'all':
      // Start everything
      break;

    case 'hojai':
      manager.setFilter('hojai');
      break;

    case 'genie':
      manager.setFilter('genie');
      break;

    case 'sutar':
      manager.setFilter('sutar');
      break;

    case 'rabtul':
      manager.setFilter('rez');
      break;

    case 'companies':
      manager.setFilter('api');
      break;

    case 'transport':
      manager.setFilter('twin');
      break;

    case 'dev':
    case 'development':
      manager.setMode('development');
      break;

    case 'status':
      // TODO: Check running services
      console.log('Status check not implemented yet.');
      return;

    case 'help':
      console.log(`
REZ Ecosystem Service Launcher

Usage:
  npx tsx start-services.ts [command]

Commands:
  all          - Start all services (default)
  hojai        - Start HOJAI AI services only
  genie        - Start Genie services only
  sutar        - Start SUTAR OS only
  rabtul       - Start RABTUL services only
  companies    - Start company services only
  dev          - Start in development mode (with logs)
  status       - Show service status
  help         - Show this help

Examples:
  npx tsx start-services.ts all
  npx tsx start-services.ts hojai
  npx tsx start-services.ts dev
      `);
      return;

    default:
      console.error(`Unknown command: ${command}`);
      console.error('Use "help" for usage information.');
      process.exit(1);
  }

  await manager.startAll();
}

main().catch(console.error);