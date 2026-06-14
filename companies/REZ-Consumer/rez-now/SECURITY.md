# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in REZ Now, please report it privately:

1. **Do not** open a public GitHub issue for security vulnerabilities
2. Email the security team at security@rez.money with:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Any suggested fixes (optional)

We aim to respond within 48 hours and will work with you on a fix timeline.

## Security Areas to Consider

- Payment data: never log Razorpay order IDs or payment details
- JWT tokens: stored in httpOnly cookies, validated server-side
- API calls: all payment/wallet operations go through the backend API
- WebSocket: authenticated connections only
- Offline queue: orders queued in IndexedDB, synced over HTTPS
