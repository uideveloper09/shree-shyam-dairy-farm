# CRM Admin Guide

Sales and customer support platform for Shree Shyam Dairy Farm ERP.

## Modules

| Module               | Description                                        | API                                    |
| -------------------- | -------------------------------------------------- | -------------------------------------- |
| **Lead**             | Capture and score inbound prospects                | `GET/POST /api/v1/crm/leads`           |
| **Customer**         | CRM customer records (linked to `User` optionally) | `GET/POST /api/v1/crm/customers`       |
| **Sales**            | Opportunity/deal tracking                          | `GET/POST /api/v1/crm/opportunities`   |
| **Pipeline**         | Kanban stages with probability                     | `GET /api/v1/crm/pipeline`             |
| **Opportunity**      | Deal amount, stage, expected close                 | `PATCH /api/v1/crm/opportunities/{id}` |
| **Follow Up**        | Scheduled calls, visits, reminders                 | `GET/POST /api/v1/crm/follow-ups`      |
| **Quotation**        | Line-item quotes with GST                          | `GET/POST /api/v1/crm/quotations`      |
| **Marketing**        | Campaign management                                | `GET/POST /api/v1/crm/campaigns`       |
| **Campaign**         | Members, send/open/click tracking                  | `POST` with `members` array            |
| **Referral**         | Tracks `User.referralCode` conversions             | `GET/POST /api/v1/crm/referrals`       |
| **Customer Support** | Ticket creation for customers                      | `crm:support` permission               |
| **Ticketing**        | Status, priority, threaded messages                | `GET/POST /api/v1/crm/tickets`         |

## Permissions

- `crm:read` / `crm:write` — sales staff (Accountant, Farm Manager)
- `crm:support` — customers can open/view own tickets
- `admin:crm:read` / `admin:crm:write` — full CRM admin (Farm Manager+)

## Admin UI

Navigate to **`/admin/crm`** for the dashboard with tabs for all modules.

## Seed

```bash
npm run db:seed-crm
```

Creates default sales pipeline stages and optional demo records.

## Lead Conversion

```
POST /api/v1/crm/leads/{id}/convert
```

Converts a qualified lead into a `CrmCustomer` and marks the lead `CONVERTED`.

## Referral Sync

```
GET /api/v1/crm/referrals?sync=1
```

Imports existing `User.referredById` relationships into `CrmReferral` records.

## Integration Points

- **Notifications** — schedule follow-up reminders via notification rules
- **Workflows** — quotation approval before `SENT` status
- **Integrations** — WhatsApp campaigns via `WHATSAPP` provider
