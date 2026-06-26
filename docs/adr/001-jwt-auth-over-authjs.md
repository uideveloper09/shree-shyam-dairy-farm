# ADR-001: Custom JWT Auth over Auth.js

**Status:** Accepted  
**Date:** 2025

## Context

The platform needs session-based authentication with:

- HTTP-only cookies for web clients
- Role-based access (CUSTOMER through OWNER)
- 2FA, OTP, OAuth Google, WebAuthn
- Farm device API keys and developer API keys (separate auth paths)

Auth.js (NextAuth) is the de-facto Next.js auth library and is listed in the target architecture diagram. However, the project already had a working custom JWT implementation with opaque DB refresh tokens, ABAC policies, and tight integration with the security gate.

## Decision

Continue using **custom JWT auth** (`jose` library, `ssd_access` / `ssd_refresh` cookies) as the production auth system. Keep `next-auth` in `package.json` for a future Auth.js v5 migration if needed.

Auth modules live in `lib/auth/` and `lib/security/`.

## Consequences

**Positive:**

- Full control over token TTL, refresh rotation, and session revocation
- RBAC/ABAC integrated without Auth.js adapter constraints
- Device API keys and public API keys remain separate clean paths

**Negative:**

- No Auth.js ecosystem plugins (e.g. built-in Prisma adapter UI)
- Manual maintenance of OAuth providers
- Architecture diagram says "Auth.js" — document as "Auth.js-ready" in [system-overview.md](../architecture/system-overview.md)

## Follow-up

- Evaluate Auth.js v5 when Next.js 16 peer support stabilizes
- If migrating, preserve opaque refresh token rotation and audit log hooks
