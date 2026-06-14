# security-middleware

**Shared Security Middleware Package**

## Overview

Reusable security middleware for REZ services.

## Features

- Account lockout
- Password policy validation
- Rate limiting
- JWT verification

## Usage

```bash
npm install @rez/security-middleware
```

```typescript
import { accountLockout } from '@rez/security-middleware';

app.use(accountLockout());
```
