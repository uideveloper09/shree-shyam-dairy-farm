# ADR-002: Tenant Slug Maps to farmId

**Status:** Accepted  
**Date:** 2025

## Context

The platform added multi-tenant SaaS (branding, billing, custom domains) on top of an existing farm IoT layer that already scoped data by `farmId` (default `"default"`). We needed tenant isolation without rewriting all farm models.

## Decision

Map **`tenant.slug` → `farmId`** for all farm and IoT data. Tenant resolution happens in middleware; services receive `farmId` from the resolved tenant.

```
Request → middleware → tenant slug → farmId = slug → Prisma queries
```

E-commerce data uses `TenantMember` and user-scoped queries separately.

## Consequences

**Positive:**

- Zero migration of existing farm models
- Single farm per tenant — matches dairy ERP use case
- Subdomain `{slug}.domain.com` naturally maps to farm

**Negative:**

- One tenant cannot own multiple farms without schema change
- Slug renames would require `farmId` migration

## Follow-up

- If multi-farm per tenant is needed, introduce `Farm` entity with `tenantId` FK
