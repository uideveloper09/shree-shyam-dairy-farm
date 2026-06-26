# Security Dashboard

Admin guide for monitoring security events and audit logs.

**Access:** `/admin/security` — requires ADMIN or OWNER role (FARM_MANAGER has read access).

## Dashboard

`GET /api/v1/security/dashboard` provides:

- Failed login attempts (24h)
- Active sessions count
- Locked accounts
- Recent audit events
- Geo-blocked requests (if enabled)

## Audit log

`GET /api/v1/security/audit` — paginated audit trail:

- User logins and logouts
- Permission changes
- GDPR export/delete requests
- API key creation/revocation
- Admin actions

Filter by user, action, date range in the UI.

## Configuration

Security controls are configured via environment variables. See [Security Architecture](../architecture/security.md).

| Control         | Env var                                         |
| --------------- | ----------------------------------------------- |
| Account lockout | `ACCOUNT_LOCK_ATTEMPTS`, `ACCOUNT_LOCK_MINUTES` |
| Bot detection   | `BOT_DETECTION_ENABLED`                         |
| Geo blocking    | `GEO_BLOCKING_ENABLED`, `GEO_ALLOW_COUNTRIES`   |
| IP whitelist    | `ADMIN_IP_WHITELIST`                            |

## Incident response

1. Check audit log for suspicious `action` values
2. Revoke compromised sessions via user's session list
3. Add attacker IP to `IP_BLACKLIST`
4. Enable geo blocking if attack is region-specific

## Related

- [Security architecture](../architecture/security.md)
- [ADR-001: JWT Auth](../adr/001-jwt-auth-over-authjs.md)
