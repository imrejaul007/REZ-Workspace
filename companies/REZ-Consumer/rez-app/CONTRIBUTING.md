# Contributing to ReZ Consumer App

Thank you for your interest in contributing to the ReZ consumer mobile application.

## Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/imrejaul007/rez-app-consumer.git
   cd rez-app-consumer
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment variables**
   - Copy `.env.example` to `.env` and fill in required values
   - Never commit `.env` files — they contain secrets

4. **Run the app**
   ```bash
   npx expo start
   ```

## Code Standards

- **TypeScript**: All new code must be TypeScript with strict typing
- **No `as any`**: Avoid type assertions; prefer proper discriminated unions or type guards
- **Design system**: Use components from `@rez/rez-ui`; do not create bespoke buttons or UI elements
- **Logging**: Use `rez-shared/telemetry` logger; never use `console.log` in production code
- **Idempotency**: Use `rez-shared/idempotency` for payment and critical operations
- **Enums**: Use canonical enums from `rez-shared/enums/`; do not duplicate
- **IDs**: Use `uuid` or `crypto.randomUUID()` for secure ID generation; never `Math.random()`

## Pull Request Process

1. Create a feature branch: `feature/<domain>/<short-description>`
2. Make your changes with passing tests
3. Run lint and type checks: `npm run lint && npx tsc --noEmit`
4. Open a PR against `main`
5. Fill in the PR template (root cause, fix, prevention)
6. Wait for review — do not merge your own PRs

## Reporting Security Issues

Please report security vulnerabilities to **security@rez.money**. Do not open public issues for security bugs.

## Code of Conduct

Be respectful, constructive, and inclusive. We follow a collaborative development model where all contributors are welcome.
