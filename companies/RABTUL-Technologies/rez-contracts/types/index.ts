// Shared types for the REZ ecosystem
// All services should import from @imrejaul007/rez-contracts/types
// Type conflicts with rez-shared have been resolved: align with canonical shapes.
// ── User ─────────────────────────────────────────────────────────────────────
// Canonical shape from rez-shared: src/types/user.types.ts
export type UserRole = | 'user' | 'admin' | 'merchant' | 'support' | 'operator' | 'super_admin';
