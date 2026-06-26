# Milk Processing Admin Guide

Dairy production platform for Shree Shyam Dairy Farm — from raw milk to packaged products.

## Modules

| Module                                                             | Description                                  | API                                             |
| ------------------------------------------------------------------ | -------------------------------------------- | ----------------------------------------------- |
| **Milk Processing**                                                | Batch lifecycle from plan to completion      | `GET/POST /api/v1/processing/batches`           |
| **Paneer / Curd / Butter / Ghee / Khoya / Lassi / Flavoured Milk** | Product-type filtered batches & recipes      | `?productType=PANEER`                           |
| **Recipe**                                                         | Ingredients, yield, shelf life, instructions | `GET/POST /api/v1/processing/recipes`           |
| **Batch**                                                          | Production run with milk input & expiry      | `PATCH` status on batches                       |
| **Production Planning**                                            | Scheduled production orders                  | `GET/POST /api/v1/processing/schedule`          |
| **Quality Control**                                                | Parameter checks per batch                   | `GET/POST /api/v1/processing/quality`           |
| **Packaging**                                                      | Unit packaging with auto-label generation    | `GET/POST /api/v1/processing/packaging`         |
| **Expiry**                                                         | Labels expiring within N days                | `GET /api/v1/processing/labels?expiringDays=14` |
| **Barcode**                                                        | Unique EAN-style codes per unit              | Stored on `ProcLabel.barcode`                   |
| **QR Code**                                                        | Traceability payload + data URL              | `GET /api/v1/processing/labels?barcode=X&qr=1`  |

## Batch Workflow

```
PLANNED → IN_PROGRESS → QC_PENDING → APPROVED → PACKAGED → COMPLETED
                              ↓
                          REJECTED
```

QC checks are auto-created from product templates when a batch starts.

## Production Planning

Schedule a run, then start production:

```json
POST /api/v1/processing/schedule
{ "action": "start", "scheduleId": "..." }
```

Creates a linked batch and moves schedule to `IN_PRODUCTION`.

## Permissions

- `processing:read` / `processing:write` — production staff (IOT Operator, Farm Manager)
- `admin:processing:read` / `admin:processing:write` — recipes and planning

## Admin UI

Navigate to **`/admin/processing`** — tabs for all modules plus quick filters per dairy product.

## Seed

```bash
npm run db:seed-processing
```

Seeds 7 standard recipes (Paneer, Curd, Butter, Ghee, Khoya, Lassi, Flavoured Milk) plus demo batch.

## Integration Points

- **AI ProductionPlan** — existing `ProductionPlan` model for milk surplus forecasting (`/api/v1/predictions?type=production-plan`)
- **Inventory** — link completed batches to `Product.stockQty`
- **Fleet** — milk tanker trips feed `milkInputLiters`
- **Documents** — attach FSSAI certificates to QC records
