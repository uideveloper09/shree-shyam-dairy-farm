# ER Diagram — Core & Auth

```mermaid
erDiagram
  User ||--o{ Session : has
  User ||--o{ RefreshToken : has
  User ||--o{ OtpCode : receives
  User ||--o{ AuditLog : generates
  User ||--o{ WebAuthnCredential : owns
  User ||--o{ DataExportRequest : requests
  User ||--o| TenantMember : belongs_to

  User {
    string id PK
    string email UK
    string role
    boolean twoFactorEnabled
    int failedLoginAttempts
    datetime lockedUntil
  }

  Session {
    string id PK
    string userId FK
    string userAgent
    string ipAddress
    datetime expiresAt
  }

  RefreshToken {
    string id PK
    string userId FK
    string tokenHash
    datetime expiresAt
    boolean revoked
  }

  AuditLog {
    string id PK
    string userId FK
    string action
    string resource
    json metadata
    datetime createdAt
  }
```

## Key relationships

- **User** is the central identity for storefront, admin, farm, and mobile apps
- **Session** + **RefreshToken** implement device-aware session management
- **AuditLog** records security-sensitive actions (login, permission changes, GDPR)
- **TenantMember** links users to multi-tenant organizations (see [tenant.md](./tenant.md))

Schema: `prisma/schema.prisma`
