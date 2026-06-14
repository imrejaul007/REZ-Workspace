# ReZ Agent Marketplace

A unified marketplace for discovering, comparing, and installing AI agents for businesses across multiple industries.

## Features

### Agent Catalog
- Grid and list view options
- Category filtering (Restaurant, Hotel, Healthcare, Retail, etc.)
- Search by name, capability, or description
- Sort by rating, installs, price, or name
- Price filter (All, Free, Paid)

### Agent Detail Pages
- Comprehensive agent information
- Feature comparison (included vs premium)
- Pricing plans with recommendations
- Customer reviews with ratings
- Integrations list
- Tasks and automations overview

### Agent Comparison
- Side-by-side comparison of up to 4 agents
- Feature matrix
- Capability comparison
- Integration comparison
- Pricing comparison

### Installation Wizard
- Step-by-step configuration
- Business details setup
- Location management
- Permission configuration
- Initial training and setup

## Categories

1. **Restaurant & Food** - Restaurant operations, delivery coordination, menu management
2. **Hotel & Hospitality** - Concierge, room management, booking
3. **Healthcare & Clinics** - Patient scheduling, records, telehealth
4. **Retail & Commerce** - Inventory, merchandising, checkout
5. **Beauty & Wellness** - Salon and spa management
6. **Real Estate** - Property matching, virtual tours
7. **HR & Recruitment** - Talent screening, onboarding
8. **Finance** - Invoicing, expenses, payroll
9. **Custom & Tailored** - Bespoke AI agents

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Icons**: Lucide React
- **Testing**: Vitest + React Testing Library

## Project Structure

```
rez-agent-marketplace/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── page.tsx           # Marketplace home
│   │   ├── [category]/        # Category listing
│   │   ├── agent/[id]/         # Agent detail
│   │   ├── install/           # Installation wizard
│   │   └── compare/           # Comparison view
│   ├── components/
│   │   ├── Catalog/           # Agent grid, cards, filters
│   │   ├── AgentDetail/       # Overview, features, pricing, reviews
│   │   ├── Installation/       # Config wizard, permissions
│   │   └── Comparison/        # Compare table
│   ├── data/
│   │   └── agents.ts          # Agent catalog data
│   ├── types/
│   │   └── agent.ts           # TypeScript interfaces
│   └── store/
│       └── marketplaceStore.ts # Zustand store
├── tests/
│   ├── setup.ts               # Test setup
│   ├── marketplace.test.ts     # Data tests
│   └── store.test.ts          # Store tests
├── package.json
├── tsconfig.json
├── vitest.config.ts
└── tailwind.config.js
```

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Run tests
npm test

# Build for production
npm run build

# Start production server
npm start
```

### Development

The development server runs at `http://localhost:3000`.

### Testing

```bash
# Run tests
npm test

# Run tests with UI
npm run test:ui
```

## Available Agents

The marketplace includes 15+ industry-specific AI agents:

| Agent | Category | Price | Rating |
|-------|----------|-------|--------|
| Restaurant Optimizer | Restaurant & Food | Free | 4.8 |
| Hotel Concierge | Hotel & Hospitality | Free | 4.9 |
| Patient Scheduler | Healthcare | Free | 4.9 |
| Retail Assistant | Retail | Free | 4.7 |
| Salon Manager | Beauty & Wellness | Free | 4.8 |
| Property Matchmaker | Real Estate | Free | 4.8 |
| Talent Screener | HR & Recruitment | Free | 4.9 |
| Invoice Agent | Finance | Free | 4.8 |
| And more... | | | |

## Key Interfaces

### Agent

```typescript
interface Agent {
  id: string;
  name: string;
  category: string;
  categorySlug: string;
  description: string;
  longDescription: string;
  icon: string;
  capabilities: string[];
  price: number;
  rating: number;
  installCount: number;
  features: Feature[];
  pricingPlans: PricingPlan[];
  integrations: string[];
  screenshots: string[];
  reviews: Review[];
  tasks: string[];
  automations: string[];
}
```

## License

Proprietary - AdBazaar Inc.
