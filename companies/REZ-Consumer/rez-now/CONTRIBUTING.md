# Contributing to REZ Now

## Getting Started

```bash
git clone https://github.com/imrejaul007/rez-now.git
cd rez-now
npm install
npm run dev
```

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS v4
- **State**: Zustand
- **i18n**: next-intl (EN + HI)
- **Payments**: Razorpay SDK
- **Real-time**: Socket.IO

## Code Standards

- Run `npm run lint` before committing — zero errors required
- Run `npm run build` to verify the production build passes
- Run `npm test` to ensure unit tests pass
- Keep files under 500 lines; extract logic into hooks/utils
- Use typed interfaces for all public APIs
- Prefer `unknown` over `any` — use proper type narrowing

## Branch Strategy

- `main` — production-ready code
- `develop` — integration branch
- `feature/<domain>/<description>` — new features
- `fix/<domain>/<description>` — bug fixes

## Pull Requests

1. Create a feature branch from `main`
2. Make your changes
3. Ensure `npm run lint` and `npm run build` pass
4. Open a PR with a clear description
5. Request review from a team member

## Reporting Issues

Use the [issue templates](./.github/ISSUE_TEMPLATE/) for:
- Bug reports (`00-BUG.yml`)
- Deploy errors (`01-DEPLOY_ERROR.yml`)
- Feature requests (`02-FEATURE.yml`)

## Security

For security vulnerabilities, see [SECURITY.md](./SECURITY.md) (or report privately to the maintainers).
