# REZ Shared Library

**Type:** TypeScript Library  
**Status:** ✅ Production Ready  
**Company:** REZ-Consumer

---

## Overview

Shared TypeScript library providing common utilities, types, and infrastructure used across all REZ services.

```
@rez/shared/
├── types/          # Shared TypeScript types
├── utils/         # Helper functions
├── logging/       # Winston logger setup
├── enums/         # Common enums
└── constants/     # Shared constants
```

---

## What's Included

| Module | Description |
|--------|-------------|
| **types** | Common TypeScript interfaces |
| **utils** | Helper functions |
| **logging** | Winston logger setup |
| **enums** | Status codes, types |
| **constants** | Shared constants |
| **idempotency** | Idempotent operation helpers |

---

## Usage

```bash
npm install @rez/shared
```

```typescript
import { logger, types, enums } from '@rez/shared';

// Use shared logger
logger.info('Message');

// Use shared types
const user: types.User = { ... };

// Use shared enums
const status = enums.UserStatus.ACTIVE;
```

---

## License

Internal REZ Service - All Rights Reserved
