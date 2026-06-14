# rez-auth-service - Authentication Service

**Port:** 4002
**Status:** ✅ Production Ready

---

## FEATURES

### Authentication Methods

| Feature | Description | Status |
|---------|-------------|--------|
| **Phone OTP** | SMS-based verification | ✅ |
| **Email OTP** | Email verification codes | ✅ |
| **Magic Link** | Passwordless email login | ✅ |
| **Social Login** | Google, Facebook, Apple | ✅ |
| **OAuth 2.0** | Standard OAuth flows | ✅ |
| **JWT Tokens** | Access + Refresh tokens | ✅ |

### Security Features

| Feature | Description | Status |
|---------|-------------|--------|
| **TOTP** | Time-based one-time passwords | ✅ |
| **MFA** | Multi-factor authentication | ✅ |
| **Rate Limiting** | Brute force protection | ✅ |
| **Account Lockout** | After failed attempts | ✅ |
| **Password Policy** | Strength validation | ✅ |
| **Session Management** | Multi-device support | ✅ |

### User Management

| Feature | Description | Status |
|---------|-------------|--------|
| **User Registration** | Sign up flows | ✅ |
| **Profile Management** | Update user data | ✅ |
| **Password Reset** | Forgot password | ✅ |
| **Email Verification** | Confirm email | ✅ |
| **Phone Verification** | Confirm phone | ✅ |

---

## API ENDPOINTS

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/auth/register` | POST | User registration |
| `/auth/login` | POST | Login |
| `/auth/otp/send` | POST | Send OTP |
| `/auth/otp/verify` | POST | Verify OTP |
| `/auth/refresh` | POST | Refresh token |
| `/auth/logout` | POST | Logout |
| `/auth/mfa/setup` | POST | Setup MFA |
| `/auth/mfa/verify` | POST | Verify MFA |

---

## TECHNOLOGY

- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **Database:** MongoDB
- **Cache:** Redis
- **Security:** JWT, bcrypt, helmet

---

**Last Updated:** June 14, 2026
