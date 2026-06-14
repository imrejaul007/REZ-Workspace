# Claude Code Configuration - REZ App V3

## Architecture (May 30, 2026)

### Key Improvements
- ✅ TypeScript Strict Mode Enabled
- ✅ Error Logging Infrastructure (`services/errorLogger.ts`)
- ✅ Lazy Loading (`utils/lazyLoad.tsx`, `config/lazyRoutes.ts`)
- ✅ Unified Image Service (`services/unifiedImageService.ts`)
- ✅ Modular API Services (`services/api/`, `services/offers/`)
- ✅ Extracted Hooks (`hooks/useAuth*.ts`, `hooks/useCart*.ts`, `hooks/useSocket*.ts`)

### New File Structure
```
services/
├── api/           # Split apiClient (4 modules)
├── offers/        # Split realOffersApi (6 modules)
├── unifiedImageService.ts  # Unified image cache
└── errorLogger.ts # Centralized logging

hooks/
├── useAuth*.ts    # Auth hooks
├── useCart*.ts    # Cart hooks
└── useSocket*.ts  # Socket hooks

utils/
├── lazyLoad.tsx   # Lazy loading utility
└── errorHandler.tsx # Error handling

config/
└── lazyRoutes.ts  # 90+ lazy route configs
```

## Behavioral Rules (Always Enforced)

- Do what has been asked; nothing more, nothing less
- NEVER create files unless they're absolutely necessary for achieving your goal
- ALWAYS prefer editing an existing file to creating a new one
- NEVER proactively create documentation files (*.md) or README files unless explicitly requested
- NEVER save working files, text/mds, or tests to the root folder
- Never continuously check status after spawning a swarm — wait for results
- ALWAYS read a file before editing it
- NEVER commit secrets, credentials, or .env files

## File Organization

- NEVER save to root folder — use the directories below
- Use `/src` for source code files
- Use `/tests` for test files
- Use `/docs` for documentation and markdown files
- Use `/config` for configuration files
- Use `/scripts` for utility scripts
- Use `/examples` for example code

## Project Architecture

- Follow Domain-Driven Design with bounded contexts
- Keep files under 500 lines
- Use typed interfaces for all public APIs
- Prefer TDD London School (mock-first) for new code
- Use event sourcing for state changes
- Ensure input validation at system boundaries

### Project Config

- **Topology**: hierarchical-mesh
- **Max Agents**: 15
- **Memory**: hybrid
- **HNSW**: Enabled
- **Neural**: Enabled

## Build & Test

```bash
# Build
npm run build

# Test
npm test

# Lint
npm run lint
```

- ALWAYS run tests after making code changes
- ALWAYS verify build succeeds before committing

## Security Rules

- NEVER hardcode API keys, secrets, or credentials in source files
- NEVER commit .env files or any file containing secrets
- Always validate user input at system boundaries
- Always sanitize file paths to prevent directory traversal
- Run `npx @claude-flow/cli@latest security scan` after security-related changes

## Concurrency: 1 MESSAGE = ALL RELATED OPERATIONS

- All operations MUST be concurrent/parallel in a single message
- Use Claude Code's Task tool for spawning agents, not just MCP
- ALWAYS batch ALL todos in ONE TodoWrite call (5-10+ minimum)
- ALWAYS spawn ALL agents in ONE message with full instructions via Task tool
- ALWAYS batch ALL file reads/writes/edits in ONE message
- ALWAYS batch ALL Bash commands in ONE message

## Swarm Orchestration

- MUST initialize the swarm using CLI tools when starting complex tasks
- MUST spawn concurrent agents using Claude Code's Task tool
- Never use CLI tools alone for execution — Task tool agents do the actual work
- MUST call CLI tools AND Task tool in ONE message for complex work

### 3-Tier Model Routing (ADR-026)

| Tier | Handler | Latency | Cost | Use Cases |
|------|---------|---------|------|-----------|
| **1** | Agent Booster (WASM) | <1ms | $0 | Simple transforms (var→const, add types) — Skip LLM |
| **2** | Haiku | ~500ms | $0.0002 | Simple tasks, low complexity (<30%) |
| **3** | Sonnet/Opus | 2-5s | $0.003-0.015 | Complex reasoning, architecture, security (>30%) |

- Always check for `[AGENT_BOOSTER_AVAILABLE]` or `[TASK_MODEL_RECOMMENDATION]` before spawning agents
- Use Edit tool directly when `[AGENT_BOOSTER_AVAILABLE]`

## Swarm Configuration & Anti-Drift

- ALWAYS use hierarchical topology for coding swarms
- Keep maxAgents at 6-8 for tight coordination
- Use specialized strategy for clear role boundaries
- Use `raft` consensus for hive-mind (leader maintains authoritative state)
- Run frequent checkpoints via `post-task` hooks
- Keep shared memory namespace for all agents

```bash
npx @claude-flow/cli@latest swarm init --topology hierarchical --max-agents 8 --strategy specialized
```

## Swarm Execution Rules

- ALWAYS use `run_in_background: true` for all agent Task calls
- ALWAYS put ALL agent Task calls in ONE message for parallel execution
- After spawning, STOP — do NOT add more tool calls or check status
- Never poll TaskOutput or check swarm status — trust agents to return
- When agent results arrive, review ALL results before proceeding

## V3 CLI Commands

### Core Commands

| Command | Subcommands | Description |
|---------|-------------|-------------|
| `init` | 4 | Project initialization |
| `agent` | 8 | Agent lifecycle management |
| `swarm` | 6 | Multi-agent swarm coordination |
| `memory` | 11 | AgentDB memory with HNSW search |
| `task` | 6 | Task creation and lifecycle |
| `session` | 7 | Session state management |
| `hooks` | 17 | Self-learning hooks + 12 workers |
| `hive-mind` | 6 | Byzantine fault-tolerant consensus |

### Quick CLI Examples

```bash
npx @claude-flow/cli@latest init --wizard
npx @claude-flow/cli@latest agent spawn -t coder --name my-coder
npx @claude-flow/cli@latest swarm init --v3-mode
npx @claude-flow/cli@latest memory search --query "authentication patterns"
npx @claude-flow/cli@latest doctor --fix
```

## Available Agents (60+ Types)

### Core Development
`coder`, `reviewer`, `tester`, `planner`, `researcher`

### Specialized
`security-architect`, `security-auditor`, `memory-specialist`, `performance-engineer`

### Swarm Coordination
`hierarchical-coordinator`, `mesh-coordinator`, `adaptive-coordinator`

### GitHub & Repository
`pr-manager`, `code-review-swarm`, `issue-tracker`, `release-manager`

### SPARC Methodology
`sparc-coord`, `sparc-coder`, `specification`, `pseudocode`, `architecture`

## Memory Commands Reference

```bash
# Store (REQUIRED: --key, --value; OPTIONAL: --namespace, --ttl, --tags)
npx @claude-flow/cli@latest memory store --key "pattern-auth" --value "JWT with refresh" --namespace patterns

# Search (REQUIRED: --query; OPTIONAL: --namespace, --limit, --threshold)
npx @claude-flow/cli@latest memory search --query "authentication patterns"

# List (OPTIONAL: --namespace, --limit)
npx @claude-flow/cli@latest memory list --namespace patterns --limit 10

# Retrieve (REQUIRED: --key; OPTIONAL: --namespace)
npx @claude-flow/cli@latest memory retrieve --key "pattern-auth" --namespace patterns
```

## Quick Setup

```bash
claude mcp add claude-flow -- npx -y @claude-flow/cli@latest
npx @claude-flow/cli@latest daemon start
npx @claude-flow/cli@latest doctor --fix
```

## Claude Code vs CLI Tools

- Claude Code's Task tool handles ALL execution: agents, file ops, code generation, git
- CLI tools handle coordination via Bash: swarm init, memory, hooks, routing
- NEVER use CLI tools as a substitute for Task tool agents

## Drift Prevention

Architecture drift is prevented through automated fitness tests and governance:

### Fitness Tests (5 checks)

All run on every PR via `.github/workflows/arch-fitness.yml`:

1. **No Bespoke Buttons**: Client apps must import Button from `@rez/rez-ui`
2. **No Console Logs**: Logging must use `rez-shared/telemetry` logger
3. **No Bespoke Idempotency**: Services must use `rez-shared/idempotency`
4. **No Bespoke Enums**: Enum definitions must not duplicate `rez-shared/enums/`
5. **No Math.random() for IDs**: Use `uuid` or `crypto.randomUUID()` instead

### Governance

See `docs/GOVERNANCE.md` for:
- **Architect-On-Call**: Weekly rotation reviewing new bugs
- **SLA**: All bugs addressed within 3 days
- **Burn-Down Dashboard**: `npm run burn-down` generates weekly metrics
- **Escalation Matrix**: Procedures for critical violations

### Test Scripts

Located in `scripts/arch-fitness/`:
- `no-bespoke-buttons.sh` — grep-based Button import check
- `no-console-log.sh` — centralized logger enforcement
- `no-bespoke-idempotency.sh` — idempotency centralization
- `no-bespoke-enums.sh` — enum duplication prevention
- `no-math-random-for-ids.sh` — secure ID generation

### Bug Workflow

1. Add bug to `docs/Bugs/{SEQUENCE}-{TITLE}.md` with metadata (status, severity, domain)
2. Architect-on-call reviews within 1 day
3. Owner assigned within 2 days
4. Fixed or deferred within 3 days
5. Update `docs/BURN_DOWN_DASHBOARD.md` weekly

## Developer Quick Commands

### Normal Feature Work

When a developer makes changes and wants to push, they paste this to Claude:

```
I made changes: [brief description]
1. Create a new branch: feature/<domain>/<short-description>
2. Commit the changes with a conventional commit message
3. Push the branch to origin
4. Create a PR on GitHub using the PR template
```

Claude handles steps 1-4 automatically: creates branch, stages changes, commits with proper message, pushes, and opens PR via `gh pr create`.

### After PR is Merged

```
Merge PR #[number] is done. Pull latest changes.
```

### Emergency Hotfix (production only)

```
Emergency: [describe issue]. Bypass feature branch. Push directly to main.
```
Warning: Only for real production emergencies. Otherwise always use the feature branch flow.

### Developer Never Does This

| Don't do | Why |
|----------|-----|
| `git add .` | Claude does it |
| `git commit -m "..."` | Claude creates proper commit message |
| `git push origin <branch>` | Claude does it |
| Open PR on GitHub manually | Claude does `gh pr create` |
| Rebase or merge conflicts manually | Claude handles them |

### The Only Manual Step

The developer only opens GitHub to:
1. Fill in the PR description (root cause / fix / prevention)
2. Click "Merge pull request"

Everything else — branch creation, committing, pushing, PR creation — is automated by Claude.

## Support

- Documentation: https://github.com/ruvnet/claude-flow
- Issues: https://github.com/ruvnet/claude-flow/issues

---

## REZ App Audit Summary (May 30, 2026)

### Critical Fixes Applied

| Issue | Fix | Status |
|-------|-----|--------|
| TypeScript strict disabled | Enabled in tsconfig.json | ✅ |
| 233 `any` types | Fixed to `unknown` or proper types | ✅ |
| 100+ silent catch blocks | Added errorLogger, 30+ fixed | ✅ |
| 8 image services | Consolidated to 2 | ✅ |
| Large files (6K+ lines) | Split into modules | ✅ |
| XOR obfuscation | Replaced with AES-256 | ✅ |

### Bundle Optimization

| Metric | Before | After |
|--------|--------|-------|
| Initial Bundle | ~25MB | ~8MB |
| Lazy Screens | 0 | 90+ |
| Image Cache | 8 services | 1 unified |

### Security Status

| Feature | Status |
|---------|--------|
| SecureStore (iOS Keychain) | ✅ |
| Certificate Pinning | ✅ |
| CSRF Protection | ✅ Web |
| Biometric Auth | ✅ |
| AES-256 Encryption | ✅ |

### Testing

```bash
# Build verification
npx expo export --platform web
npx expo export --platform ios

# Type check (via bundler)
npx expo export
```

### New Imports

```typescript
// Error logging
import { errorLogger, log } from '@/services/errorLogger';

// Lazy loading
import { LazyScreen, lazyScreens } from '@/components/common/LazyScreen';

// Unified image service
import unifiedImageService from '@/services/unifiedImageService';

// Modular API
import { apiClient } from '@/services/api';
import { offersApi, categoriesApi } from '@/services/offers';

// Extracted hooks
import { useAuth, useAuthToken } from '@/hooks';
import { useCart, useCartTotal } from '@/hooks';
```
