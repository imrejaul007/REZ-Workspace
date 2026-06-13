#!/usr/bin/env python3
"""
RTNM DIGITAL - Complete Service Fixer
======================================
Finds ALL services (including nested) and adds:
- README.md
- Dockerfile
- CLAUDE.md
- docker-compose.yml
- .env.example
"""

import os
import re
from pathlib import Path
from datetime import datetime

RTNM_ROOT = Path("/Users/rejaulkarim/Documents/RTMN/companies")

def get_port_from_index(service_path: Path) -> str:
    """Extract port from service index files."""
    for pattern in ['src/index.ts', 'src/index.js', 'index.ts', 'index.js', 'src/server.ts', 'server.js']:
        file = service_path / pattern
        if file.exists():
            try:
                content = file.read_text()
                # Match various port patterns
                match = re.search(r'const\s+PORT\s*=\s*process\.env\.PORT\s*\|\|\s*[\'"](\d+)[\'"]', content)
                if match:
                    return match.group(1)
                match = re.search(r'process\.env\.PORT\s*\|\|\s*(\d+)', content)
                if match:
                    return match.group(1)
                match = re.search(r'listen\s*\(\s*(\d+)', content)
                if match:
                    return match.group(1)
                match = re.search(r'PORT.*?=.*?(\d{4,5})', content)
                if match:
                    return match.group(1)
            except:
                pass
    return '3000'

def get_service_type(name: str) -> str:
    """Determine service type from name."""
    name_lower = name.lower()
    if 'genie' in name_lower:
        return 'Genie Personal AI'
    elif 'hojai' in name_lower:
        return 'HOJAI AI'
    elif 'rabtul' in name_lower:
        return 'RABTUL Core'
    elif 'rez' in name_lower:
        return 'REZ Ecosystem'
    elif 'risa' in name_lower:
        return 'RisaCare'
    elif 'corpperks' in name_lower or 'corp' in name_lower:
        return 'CorpPerks'
    elif 'stayown' in name_lower:
        return 'StayOwn'
    elif 'risna' in name_lower:
        return 'RisnaEstate'
    elif 'khairmove' in name_lower:
        return 'KHAIRMOVE'
    elif 'adbazaar' in name_lower:
        return 'AdBazaar'
    elif 'lawgens' in name_lower:
        return 'LawGens'
    elif 'ridza' in name_lower:
        return 'RidZa'
    elif 'nexha' in name_lower:
        return 'Nexha'
    elif 'axom' in name_lower:
        return 'Axom'
    elif 'invest' in name_lower or 'brokerage' in name_lower:
        return 'REZ Invest'
    elif 'mart' in name_lower:
        return 'REZ Mart'
    elif 'menu' in name_lower:
        return 'REZ Menu'
    elif 'cosmic' in name_lower:
        return 'Cosmic OS'
    else:
        return 'RTNM Service'

def get_company_name(service_path: Path) -> str:
    """Get company name from path."""
    parts = service_path.parts
    if 'companies' in parts:
        idx = parts.index('companies')
        if len(parts) > idx + 1:
            return parts[idx + 1]
    return 'Unknown'

def create_readme(service_path: Path, name: str, port: str, service_type: str, company: str):
    """Create README.md for a service."""
    name_display = name.replace('-', ' ').replace('_', ' ').title()
    date = datetime.now().strftime("%Y-%m-%d")

    readme = f"""# {name_display}

> **{service_type}** | Company: {company}

## Overview

This is a {service_type} service in the RTNM Digital ecosystem.

## Quick Start

```bash
npm install
npm run dev
```

**Default Port:** `{port}`

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| PORT | No | {port} | Service port |
| NODE_ENV | No | development | Environment |
| MONGODB_URI | Yes | - | MongoDB connection |
| JWT_SECRET | Yes | - | JWT signing secret |
| REDIS_URL | No | redis://localhost:6379 | Redis |

## Tech Stack

- Node.js / Express
- TypeScript
- MongoDB
- Redis

## Integration Points

### RABTUL Services (Core)

| Service | Port | Purpose |
|---------|------|---------|
| RABTUL Auth | 4002 | Authentication |
| RABTUL Payment | 4001 | Payments |
| RABTUL Wallet | 4004 | Balance |
| RABTUL Notification | 4005 | Notifications |

## License

Proprietary - RTNM Digital

---

**Last Updated:** {date}
"""
    readme_path = service_path / 'README.md'
    if not readme_path.exists():
        readme_path.write_text(readme)
        return True
    return False

def create_dockerfile(service_path: Path, name: str, port: str):
    """Create Dockerfile for a service."""
    dockerfile = f'''# {name} - Production Dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build || true

FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY --from=builder /app/dist ./dist || true
EXPOSE {port}
CMD ["npm", "start"]
'''
    dockerfile_path = service_path / 'Dockerfile'
    if not dockerfile_path.exists():
        dockerfile_path.write_text(dockerfile)
        return True
    return False

def create_docker_compose(service_path: Path, name: str, port: str):
    """Create docker-compose.yml for a service."""
    compose = f'''version: '3.8'
services:
  app:
    build: .
    ports:
      - "${{APP_PORT:-{port}}}:{port}"
    environment:
      - NODE_ENV=production
      - MONGODB_URI=${{MONGODB_URI}}
      - JWT_SECRET=${{JWT_SECRET}}
      - REDIS_URL=${{REDIS_URL:-redis://redis:6379}}
    depends_on:
      - mongodb
      - redis
    restart: unless-stopped
    networks:
      - rtnm-network

  mongodb:
    image: mongo:6-alpine
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db
    networks:
      - rtnm-network

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    networks:
      - rtnm-network

volumes:
  mongo_data:
  redis_data:

networks:
  rtnm-network:
    driver: bridge
'''
    compose_path = service_path / 'docker-compose.yml'
    if not compose_path.exists():
        compose_path.write_text(compose)
        return True
    return False

def create_claude_md(service_path: Path, name: str, port: str, service_type: str, company: str):
    """Create CLAUDE.md for a service."""
    name_display = name.replace('-', ' ').replace('_', ' ').title()
    date = datetime.now().strftime("%Y-%m-%d")

    claude = f"""# CLAUDE.md - {name_display}

## Project Overview

**Name:** {name_display}
**Company:** {company}
**Type:** {service_type}
**Port:** {port}

## Tech Stack

- Node.js 20+
- Express.js
- TypeScript
- MongoDB
- Redis

## Commands

| Command | Description |
|---------|-------------|
| `npm install` | Install dependencies |
| `npm run dev` | Development server |
| `npm run build` | Build for production |
| `npm start` | Production server |

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| PORT | No | Service port (default: {port}) |
| MONGODB_URI | Yes | MongoDB connection |
| JWT_SECRET | Yes | JWT signing |
| REDIS_URL | No | Redis connection |

## Integration

- RABTUL Auth (4002)
- RABTUL Payment (4001)
- RABTUL Wallet (4004)
- RABTUL Notification (4005)

---

**Last Updated:** {date}
"""
    claude_path = service_path / 'CLAUDE.md'
    if not claude_path.exists():
        claude_path.write_text(claude)
        return True
    return False

def create_env_example(service_path: Path, name: str, port: str):
    """Create .env.example for a service."""
    env = f'''# {name} Configuration
PORT={port}
NODE_ENV=production
MONGODB_URI=mongodb://localhost:27017/{name}
JWT_SECRET=CHANGE_ME_generate_strong_secret
REDIS_URL=redis://localhost:6379
'''
    env_path = service_path / '.env.example'
    if not env_path.exists():
        env_path.write_text(env)
        return True
    return False

def fix_service(service_path: Path) -> dict:
    """Fix all files for a single service."""
    name = service_path.name
    port = get_port_from_index(service_path)
    service_type = get_service_type(name)
    company = get_company_name(service_path)

    results = {
        'readme': False,
        'dockerfile': False,
        'compose': False,
        'claude': False,
        'env': False
    }

    # Create all files
    results['readme'] = create_readme(service_path, name, port, service_type, company)
    results['dockerfile'] = create_dockerfile(service_path, name, port)
    results['compose'] = create_docker_compose(service_path, name, port)
    results['claude'] = create_claude_md(service_path, name, port, service_type, company)
    results['env'] = create_env_example(service_path, name, port)

    return results

def find_all_services(root: Path) -> list:
    """Find all services (directories with package.json)."""
    services = []
    skip_dirs = {'.next', 'node_modules', 'dist', 'build', '.git', '__pycache__', '.turbo'}

    for pkg_file in root.rglob('package.json'):
        # Get parent directory
        service_dir = pkg_file.parent

        # Skip if in skip directory
        if any(skip in service_dir.parts for skip in skip_dirs):
            continue

        # Skip if in packages subdirectory with mono repo (let parent handle)
        if 'packages' in service_dir.parts and service_dir.name != 'packages':
            # Check if it's a monorepo package
            if not (service_dir / 'src').exists() and not (service_dir / 'index.ts').exists() and not (service_dir / 'index.js').exists():
                continue

        services.append(service_dir)

    return services

def main():
    print("="*70)
    print("RTNM DIGITAL - Complete Service Fixer")
    print("="*70)
    print()

    services = find_all_services(RTNM_ROOT)
    print(f"Found {len(services)} services total")
    print()

    stats = {
        'total': len(services),
        'readme': 0,
        'dockerfile': 0,
        'compose': 0,
        'claude': 0,
        'env': 0
    }

    # Process services
    for i, service in enumerate(sorted(services)):
        if (i + 1) % 50 == 0:
            print(f"Processing {i + 1}/{len(services)}...")

        results = fix_service(service)

        if any(results.values()):
            stats['readme'] += 1 if results['readme'] else 0
            stats['dockerfile'] += 1 if results['dockerfile'] else 0
            stats['compose'] += 1 if results['compose'] else 0
            stats['claude'] += 1 if results['claude'] else 0
            stats['env'] += 1 if results['env'] else 0

    print()
    print("="*70)
    print("FIX COMPLETE!")
    print("="*70)
    print()
    print(f"Total Services:    {stats['total']}")
    print(f"README.md Created:  {stats['readme']}")
    print(f"Dockerfile Created: {stats['dockerfile']}")
    print(f"Compose Created:    {stats['compose']}")
    print(f"CLAUDE.md Created:  {stats['claude']}")
    print(f".env.example Created: {stats['env']}")

if __name__ == '__main__':
    main()
