# safe-qr

**Safe QR App - Emergency & Security**

## Status

⚠️ PARTIAL - Needs SDK 53 upgrade verification

## Overview

QR code generation and scanning with 15 emergency modes for safety.

## Features

- QR code generation (15 modes)
- QR code scanning
- Karma system
- Lost mode
- Session management
- Emergency contacts

## Screens

- Home
- Scan
- My QRs
- Sessions
- Karma
- Profile
- Create QR
- QR Detail
- Scan Result
- Message

## Tech Stack

- Expo SDK 53
- React Native
- TypeScript

## Quick Start

```bash
npm install
npx expo start
```

## Backend

Connects to `safe-qr-service` on port `4001`

## API Integration

- Auth: RABTUL Auth
- QR: safe-qr-service
- Notifications: RABTUL Notification

## Documentation

See [SERVICE-CATALOG.md](./SERVICE-CATALOG.md) for full details.
