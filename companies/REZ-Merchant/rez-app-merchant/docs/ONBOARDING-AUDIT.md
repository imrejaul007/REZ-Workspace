# Onboarding V2 Audit Checklist

## Overview

This document tracks the audit checklist for the streamlined merchant onboarding flow designed to complete in under 5 minutes.

## Audit Criteria

### Time Metrics

| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| Total onboarding time | < 5 minutes | - | Pending |
| Step 1 (Business) | < 2 minutes | - | Pending |
| Step 2 (Services) | < 1 minute | - | Pending |
| Step 3 (Quick Setup) | < 1.5 minutes | - | Pending |
| Step 4 (Complete) | < 30 seconds | - | Pending |

### Flow Metrics

| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| Number of steps | 4 | 4 | Pass |
| Required fields | < 10 | 5 | Pass |
| Optional fields | Clearly marked | Yes | Pass |
| Skip options | All optional steps | Yes | Pass |

## Checklist

### Step 1: Business + Store Information

- [x] Business Name (required)
- [x] Owner Name (required)
- [x] Phone Number (required, auto-filled via OTP)
- [x] Email (optional)
- [x] Business Type (required, dropdown)
- [x] Business Category (required, quick select)
- [x] Store Name (optional, defaults to business name)
- [x] Address (optional, with auto-detect)
- [ ] **Total required fields: 5** - Target: < 10

### Step 2: Services Selection

- [x] Scan & Pay (recommended for most)
- [x] Online Ordering (recommended for restaurants)
- [x] Menu QR (recommended for restaurants)
- [x] Loyalty Stamps (recommended for retail)
- [x] Table Reservations (optional)
- [x] Delivery (optional)
- [x] Smart defaults based on category
- [x] Can change later from Settings

### Step 3: Quick Setup

- [x] Menu QR generation (if selected)
- [x] First product/menu item entry (if ordering)
- [x] Time slots for reservations (if selected)
- [x] Payment QR generation (if selected)
- [x] Skip all option
- [x] Configure later option

### Step 4: Completion

- [x] Success animation
- [x] Summary of enabled features
- [x] QR codes preview
- [x] Go to Dashboard button
- [x] Optional: Add Bank Details
- [x] Optional: Upload Documents

### Optional Steps

- [x] Bank Details (skippable)
- [x] Documents (skippable)
- [x] Can be completed from Settings later
- [x] Reminder after dashboard

## Feature Checklist

### Auto-fill & Smart Defaults

- [ ] GSTIN lookup auto-fills business details
- [ ] Location auto-detect fills address
- [ ] Store name defaults to business name
- [ ] Services auto-selected based on category
- [ ] Time slots suggested based on business type

### Validation

- [x] Real-time field validation
- [x] Required fields clearly marked
- [x] Optional fields visually distinct
- [x] Error messages helpful
- [x] Prevent next step if required missing

### Progress Indicator

- [x] Shows current step (1 of 4)
- [x] Completed steps highlighted
- [x] Future steps outlined
- [x] Progress bar
- [x] Can navigate back to completed steps

### Skip & Continue

- [x] All optional sections skippable
- [x] Skip with confirmation for important steps
- [x] "Add Later" option visible
- [x] Reminder system for skipped items

### QR Code Generation

- [x] Menu QR generated
- [x] Payment QR generated
- [x] Table reservation QR generated
- [x] QR preview shown
- [x] Regenerate option

### Error Handling

- [x] Network error retry
- [x] Validation error display
- [x] Progress auto-saved
- [x] Resume from last step

### Redirect

- [x] Go to Dashboard button
- [x] Dashboard shows onboarding complete
- [x] Quick access to skipped items

## Manual Testing Checklist

### Fresh Start

- [ ] Start onboarding from login
- [ ] Complete all steps without skip
- [ ] Verify activation
- [ ] Check dashboard shows correct features

### Skip Flow

- [ ] Skip address
- [ ] Skip menu items
- [ ] Skip bank details
- [ ] Skip documents
- [ ] Verify reminders appear

### Resume Flow

- [ ] Start onboarding
- [ ] Close app
- [ ] Reopen onboarding
- [ ] Verify progress restored

### Validation

- [ ] Empty required fields show errors
- [ ] Invalid phone format error
- [ ] Invalid IFSC error
- [ ] Account number mismatch error

### Edge Cases

- [ ] Very long business name
- [ ] Special characters in name
- [ ] Very slow network
- [ ] App killed mid-onboarding
- [ ] Multiple rapid taps

## Performance Checklist

- [ ] First paint < 500ms
- [ ] Step transition < 300ms
- [ ] Form submission < 2s
- [ ] QR generation < 1s
- [ ] Memory usage < 100MB

## Accessibility Checklist

- [ ] Screen reader compatible
- [ ] Color contrast AA compliant
- [ ] Touch targets 44px minimum
- [ ] Focus indicators visible
- [ ] No content-only color coding

## Security Checklist

- [ ] Sensitive data encrypted
- [ ] No PII in logs
- [ ] HTTPS only
- [ ] CSRF protection
- [ ] Rate limiting

## Browser/Device Testing

- [ ] iOS Safari
- [ ] iOS Chrome
- [ ] Android Chrome
- [ ] Samsung Internet
- [ ] iPhone SE (small screen)
- [ ] iPhone Pro Max (large screen)
- [ ] iPad

## Rollout Checklist

- [ ] Feature flag configured
- [ ] Analytics events added
- [ ] Error tracking configured
- [ ] Monitoring dashboard ready
- [ ] Rollback plan documented
- [ ] Support team briefed

## Post-Launch

- [ ] Time-to-complete metrics collected
- [ ] Drop-off points identified
- [ ] User feedback reviewed
- [ ] Optimization plan created
- [ ] Iteration 2 planned

## Sign-off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Product | | | |
| Engineering | | | |
| Design | | | |
| QA | | | |
| Security | | | |

---

**Last Updated:** 2026-05-03
**Version:** 1.0
**Status:** Implementation Complete
