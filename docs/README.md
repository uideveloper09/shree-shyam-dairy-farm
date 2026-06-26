# Shree Shyam Dairy Farm — Documentation

Production-grade, multi-tenant dairy ERP: e-commerce, farm IoT/AI, mobile PWA, public API, and enterprise security.

**Live:** [shree-shyam-dairy-farm.vercel.app](https://shree-shyam-dairy-farm.vercel.app)

---

## Enterprise documentation

| Document                                    | Description                                          |
| ------------------------------------------- | ---------------------------------------------------- |
| [Setup](./setup.md)                         | Local development quick start                        |
| [Architecture](./architecture.md)           | System layers, stack, request flow                   |
| [Folder structure](./folder-structure.md)   | Repository layout and import conventions             |
| [Database](./database.md)                   | Prisma schema, migrations, tenancy                   |
| [API guidelines](./api-guidelines.md)       | REST design standards                                |
| [Coding guidelines](./coding-guidelines.md) | Engineering standards                                |
| [Deployment](./deployment.md)               | Vercel, Docker, CI/CD runbooks                       |
| [Foundation report](./foundation-report.md) | Final validation — TypeScript, build, lint, security |

---

## Architecture

| Document                                             | Description                      |
| ---------------------------------------------------- | -------------------------------- |
| [System Overview](./architecture/system-overview.md) | Full stack diagram and layer map |
| [Frontend](./architecture/frontend.md)               | Next.js, React, PWA, theming     |
| [Backend](./architecture/backend.md)                 | API routes, services, workers    |
| [Database](./architecture/database.md)               | PostgreSQL, Prisma, tenancy      |
| [AI](./architecture/ai.md)                           | LLMs, predictions, voice, agent  |
| [IoT](./architecture/iot.md)                         | MQTT, sensors, edge gateway      |
| [Security](./architecture/security.md)               | Auth, RBAC, GDPR, audit          |
| [Deployment](./architecture/deployment.md)           | Docker, K8s, CI/CD, monitoring   |
| [Scaling](./architecture/scaling.md)                 | HPA, cache, queue, read replicas |

---

## API

| Document                                                                          | Description                      |
| --------------------------------------------------------------------------------- | -------------------------------- |
| [API Index](./api/README.md)                                                      | All API surfaces                 |
| [Public REST API](./api/public-api.md)                                            | Developer platform v1            |
| [Internal REST API](./api/internal-api.md)                                        | `/api/v1/*` authenticated routes |
| [OpenAPI Spec](https://shree-shyam-dairy-farm.vercel.app/api/public/openapi.json) | Machine-readable spec            |
| [Swagger UI](https://shree-shyam-dairy-farm.vercel.app/developers/docs)           | Interactive docs                 |

---

## ER Diagrams

| Document                                 | Domain                     |
| ---------------------------------------- | -------------------------- |
| [Core & Auth](./er-diagrams/core.md)     | Users, sessions, audit     |
| [E-commerce](./er-diagrams/ecommerce.md) | Products, orders, payments |
| [Farm & IoT](./er-diagrams/farm-iot.md)  | Sensors, automation, AI    |
| [Multi-Tenant](./er-diagrams/tenant.md)  | Tenants, billing, usage    |

---

## Architecture Decision Records

| ADR                                             | Decision                   |
| ----------------------------------------------- | -------------------------- |
| [ADR-001](./adr/001-jwt-auth-over-authjs.md)    | Custom JWT auth vs Auth.js |
| [ADR-002](./adr/002-tenant-farmid-isolation.md) | `tenant.slug` → `farmId`   |
| [ADR-003](./adr/003-bullmq-async-workers.md)    | BullMQ for async jobs      |
| [ADR Index](./adr/README.md)                    | How to write ADRs          |

---

## Testing

| Document                                | Description              |
| --------------------------------------- | ------------------------ |
| [Testing Overview](./testing/README.md) | Vitest, CI pipeline      |
| [Unit Tests](./testing/unit-tests.md)   | Test suites and patterns |

---

## Guides

### User Guides

| Guide                                           | Audience                  |
| ----------------------------------------------- | ------------------------- |
| [Ordering Milk](./user-guides/ordering.md)      | Customers                 |
| [Subscriptions](./user-guides/subscriptions.md) | Customers                 |
| [Account & Privacy](./user-guides/account.md)   | Customers                 |
| [Mobile App](./user-guides/mobile-app.md)       | Customers, delivery staff |

### Admin Guides

| Guide                                                      | Audience                          |
| ---------------------------------------------------------- | --------------------------------- |
| [Security Dashboard](./admin-guides/security-dashboard.md) | ADMIN, OWNER                      |
| [Tenant Management](./admin-guides/tenant-management.md)   | ADMIN, OWNER                      |
| [E-commerce Admin](./admin-guides/ecommerce.md)            | ADMIN, OWNER                      |
| [Developer Portal](./admin-guides/developer-portal.md)     | ADMIN, developers                 |
| [Notifications](./admin-guides/notifications.md)           | ADMIN, FARM_MANAGER               |
| [Workflows](./admin-guides/workflows.md)                   | ADMIN, FARM_MANAGER               |
| [Documents](./admin-guides/documents.md)                   | ADMIN, FARM_MANAGER               |
| [Integrations](./admin-guides/integrations.md)             | ADMIN, OWNER                      |
| [CRM](./admin-guides/crm.md)                               | ADMIN, FARM_MANAGER, ACCOUNTANT   |
| [Fleet](./admin-guides/fleet.md)                           | ADMIN, FARM_MANAGER, DELIVERY     |
| [Processing](./admin-guides/processing.md)                 | ADMIN, FARM_MANAGER, IOT_OPERATOR |
| [Retail](./admin-guides/retail.md)                         | ADMIN, FARM_MANAGER, ACCOUNTANT   |
| [AI Platform](./admin-guides/ai-platform.md)               | ADMIN, FARM_MANAGER, OWNER        |
| [SaaS Platform](./admin-guides/saas.md)                    | ADMIN, FARM_MANAGER, OWNER        |

### Farm Guides

| Guide                                               | Audience     |
| --------------------------------------------------- | ------------ |
| [Farm Platform Setup](./farm-guides/setup.md)       | FARM_MANAGER |
| [IoT Device Onboarding](./farm-guides/iot-setup.md) | IOT_OPERATOR |
| [MQTT Configuration](./farm-guides/mqtt-setup.md)   | IOT_OPERATOR |
| [AI & Vision](./farm-guides/ai-platform.md)         | FARM_MANAGER |

---

## Release Notes

| Version                             | Date                                |
| ----------------------------------- | ----------------------------------- |
| [v0.1.0](./release-notes/v0.1.0.md) | Initial enterprise platform release |

---

## Legacy paths (redirected)

Older single-file docs now have dedicated enterprise guides:

- `architecture.md` — canonical architecture guide (was redirect to `architecture/system-overview.md`)
- `database.md` — canonical database guide (extends `architecture/database.md`)
- `deployment.md` — canonical deployment guide (was `devops.md` → `architecture/deployment.md`)
- `api.md` → [api/public-api.md](./api/public-api.md)
- `security.md` → [architecture/security.md](./architecture/security.md)
- `farm-platform.md` → [farm-guides/setup.md](./farm-guides/setup.md)
- `mobile.md` → [user-guides/mobile-app.md](./user-guides/mobile-app.md)
- `tenant.md` → [admin-guides/tenant-management.md](./admin-guides/tenant-management.md)
