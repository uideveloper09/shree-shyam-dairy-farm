# ER Diagram — Multi-Tenant

```mermaid
erDiagram
  Tenant ||--|| TenantBranding : has
  Tenant ||--|| TenantTheme : has
  Tenant ||--o{ TenantDomain : owns
  Tenant ||--|| TenantLocaleConfig : has
  Tenant ||--o| TenantBillingSubscription : subscribes
  Tenant ||--o{ TenantMember : has
  Tenant ||--o{ UsageRecord : meters
  Tenant ||--o{ TenantDailyAnalytics : tracks

  TenantMember }o--|| User : is

  Tenant {
    string id PK
    string slug UK
    string name
    string plan
    string status
  }

  TenantBranding {
    string tenantId PK_FK
    string companyName
    string logoUrl
    string faviconUrl
  }

  TenantDomain {
    string id PK
    string tenantId FK
    string domain UK
    boolean verified
  }

  TenantBillingSubscription {
    string tenantId PK_FK
    string provider
    string externalId
    string plan
    string status
  }

  UsageRecord {
    string id PK
    string tenantId FK
    string metric
    int quantity
    string period
  }
```

## Isolation model

```
tenant.slug ──maps-to──► farmId (IoT/farm tables)
tenant.id   ──scopes──► TenantMember, UsageRecord, analytics
```

See [ADR-002](../adr/002-tenant-farmid-isolation.md).

## Related

- [Admin: Tenant Management](../admin-guides/tenant-management.md)
- [Database architecture](../architecture/database.md)
