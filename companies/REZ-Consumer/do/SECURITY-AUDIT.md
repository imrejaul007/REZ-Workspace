# Do App - Security Audit Report

**Date:** May 13, 2026
**Auditor:** Claude Code
**Version:** 2.0.0

---

## Executive Summary

| Component | Status | Vulnerabilities |
|-----------|--------|-----------------|
| do-backend | ✅ PASS | 0 |
| do-app (frontend) | ⚠️ REVIEW | 18 (Expo SDK) |

---

## Backend Security Audit (do-backend)

### ✅ Status: PASS

```
$ npm audit
found 0 vulnerabilities
```

### Security Features Implemented

| Feature | Status | Implementation |
|---------|--------|----------------|
| OTP Bypass Prevention | ✅ | No fallback for auth failures |
| Secret Enforcement | ✅ | Fails if JWT_SECRET < 32 chars |
| CORS Protection | ✅ | Blocks `*` in production |
| WebSocket Auth | ✅ | Token validation required |
| Idempotency | ✅ | 24-hour TTL store |
| Input Validation | ✅ | Zod schemas |
| Rate Limiting | ✅ | Per-endpoint limits |
| Error Logging | ✅ | Structured logging |

---

## Frontend Security Audit (do-app)

### ⚠️ Status: REVIEW REQUIRED

```
$ npm audit
18 vulnerabilities (1 moderate, 17 high)
```

### Vulnerabilities Found

| Package | Severity | Count | Fix Required |
|---------|----------|-------|-------------|
| `@xmldom/xmldom` | HIGH | 5 | Expo SDK upgrade |
| `tar` | HIGH | 7 | Expo SDK upgrade |
| `postcss` | MODERATE | 1 | Expo SDK upgrade |
| `fast-uri` | HIGH | 2 | `npm audit fix` |
| `@babel/plugin-transform-modules-systemjs` | HIGH | 1 | `npm audit fix` |

### Expo SDK Dependencies

Most vulnerabilities are **transitive dependencies** of Expo SDK 52:
- `expo` → `@expo/cli` → `@expo/config` → `@xmldom/xmldom`
- `expo` → `tar` (via `@expo/cli` → `cacache`)

**These cannot be fixed without upgrading Expo SDK.**

---

## Recommended Actions

### Immediate (Can Do Now)

1. **Fix non-Expo vulnerabilities:**
```bash
cd REZ-Consumer/do-app
npm audit fix
```

2. **Document known Expo vulnerabilities** for awareness

### Short-term (Next Sprint)

3. **Plan Expo SDK upgrade:**
```bash
# Check current version
expo --version  # Currently ~12.x

# Upgrade plan:
# Expo 52 → Expo 53 (Q3 2026 target)
```

### Long-term (Roadmap)

4. **Monitor Expo SDK 53 release** for security patches
5. **Consider React Native upgrade** if required

---

## Vulnerability Details

### @xmldom/xmldom (5 vulnerabilities)

**Severity:** HIGH
**Description:** XML injection and DoS vulnerabilities
**Impact:** If app parses untrusted XML, could lead to:
- Arbitrary code execution
- Denial of service
- XML injection attacks

**Mitigation:** App does not parse XML from untrusted sources.

---

### tar (7 vulnerabilities)

**Severity:** HIGH
**Description:** Path traversal vulnerabilities
**Impact:** Could allow:
- Arbitrary file creation/overwrite
- Arbitrary file read
- Symlink poisoning

**Mitigation:** Only used during development/build. Not a runtime risk.

---

### postcss (1 vulnerability)

**Severity:** MODERATE
**Description:** XSS via CSS stringify
**Impact:** If user-provided CSS is rendered, could lead to XSS

**Mitigation:** App does not render user-provided CSS.

---

### fast-uri (2 vulnerabilities)

**Severity:** HIGH
**Description:** Path traversal and host confusion
**Impact:** If parsing untrusted URIs, could bypass security checks

**Mitigation:** Used internally by validation libraries. Low risk.

---

## Risk Assessment

| Risk | Likelihood | Impact | Risk Level |
|------|------------|--------|------------|
| Expo SDK XML parsing | Low | High | MEDIUM |
| Build-time path traversal | Low | High | LOW (build only) |
| Runtime URI parsing | Low | Medium | LOW |
| CSS XSS | Very Low | High | LOW |

---

## Conclusion

The backend is **production-ready** from a security perspective.

The frontend has **known vulnerabilities** in Expo SDK dependencies that require a major SDK upgrade to fix. These vulnerabilities have **low exploitation risk** for this app because:

1. The app doesn't parse untrusted XML
2. The app doesn't render user-provided CSS
3. Path traversal issues are build-time only

**Recommendation:** Proceed with deployment while planning Expo SDK upgrade.

---

## Next Review

Schedule next security audit after:
- Expo SDK upgrade OR
- 90 days (whichever comes first)
