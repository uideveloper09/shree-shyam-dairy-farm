# Approval Workflow Platform

Multi-step approval workflows for expenses, purchases, leave, refunds, subscriptions, and custom processes — with visual builder, conditions, triggers, automation rules, and full audit trail.

## Modules

| Module                  | Type                          | Default workflow slug       |
| ----------------------- | ----------------------------- | --------------------------- |
| Expense Approval        | `EXPENSE`                     | `expense-standard`          |
| Purchase Approval       | `PURCHASE`                    | `purchase-standard`         |
| Leave Approval          | `LEAVE`                       | `leave-standard`            |
| Refund Approval         | `REFUND`                      | `refund-standard`           |
| Subscription Approval   | `SUBSCRIPTION`                | `subscription-standard`     |
| Custom Workflow Builder | `CUSTOM`                      | User-defined                |
| Visual Workflow         | JSON nodes/edges              | `WorkflowDefinition.visual` |
| Conditions              | Amount, role, field operators | `WorkflowCondition`         |
| Triggers                | Event / manual / schedule     | `WorkflowTrigger`           |
| Automation Rules        | Event → action                | `WorkflowAutomationRule`    |
| Audit Trail             | Every action logged           | `WorkflowAuditLog`          |

## Architecture

```
Submit Request → Match Workflow (type + conditions)
              → Create WorkflowInstance + Steps
              → Notify approver (notification rules)
              → Approve / Reject step
              → Next step or finalize
              → Sync resource status + audit log
```

## Admin

`/admin/workflows` — dashboard, workflow definitions (visual), pending approvals, audit trail.

## User

`/account/approvals` — submit refund/subscription requests, track status.

## API

| Endpoint                                       | Description                  |
| ---------------------------------------------- | ---------------------------- |
| `POST /api/v1/workflows/submit`                | Submit typed request         |
| `GET /api/v1/workflows/requests`               | My requests                  |
| `GET /api/v1/workflows/pending`                | Pending approvals (approver) |
| `GET /api/v1/workflows/[id]`                   | Instance + audit trail       |
| `POST /api/v1/workflows/[id]/approve`          | Approve/reject step          |
| `POST /api/v1/workflows/[id]/cancel`           | Cancel request               |
| `GET/POST /api/v1/workflows/admin/definitions` | Workflow builder             |
| `POST /api/v1/workflows/admin/trigger`         | Fire event trigger           |

### Submit example

```json
POST /api/v1/workflows/submit
{
  "type": "REFUND",
  "orderNumber": "SSD-1234",
  "amount": 299,
  "reason": "Damaged product"
}
```

### Visual workflow builder

```json
POST /api/v1/workflows/admin/definitions
{
  "slug": "custom-onboarding",
  "name": "Custom Onboarding",
  "type": "CUSTOM",
  "visual": {
    "nodes": [
      { "id": "trigger", "type": "trigger", "label": "Start" },
      { "id": "step_0", "type": "approval", "label": "HR", "role": "ADMIN" },
      { "id": "end", "type": "end", "label": "Done" }
    ],
    "edges": [
      { "id": "e1", "from": "trigger", "to": "step_0" },
      { "id": "e2", "from": "step_0", "to": "end", "on": "approved" }
    ]
  }
}
```

## Condition operators

`eq`, `neq`, `gt`, `gte`, `lt`, `lte`, `in`, `contains`

## Roles

| Role          | Capabilities                                      |
| ------------- | ------------------------------------------------- |
| CUSTOMER      | Submit refund, subscription requests              |
| ACCOUNTANT    | Approve expense, purchase, refund (finance steps) |
| FARM_MANAGER  | Approve leave, expense, purchase (manager steps)  |
| ADMIN / OWNER | All approvals + workflow builder                  |

## Seed

```bash
npm run db:seed-workflows
```

## Related

- [Notifications](./notifications.md) — approval notifications
- [Security architecture](../architecture/security.md) — RBAC permissions
