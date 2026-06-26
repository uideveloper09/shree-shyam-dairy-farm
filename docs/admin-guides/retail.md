# Retail Billing Admin Guide

Point-of-sale and retail billing for the farm shop and outlets.

## Modules

| Module              | Description                       | API                                       |
| ------------------- | --------------------------------- | ----------------------------------------- |
| **Retail Billing**  | Complete POS sale with line items | `POST /api/v1/retail/bills`               |
| **Barcode**         | Scan product or processing labels | `GET /api/v1/retail/scan?code=`           |
| **QR**              | Bill verification QR + data URL   | `GET /api/v1/retail/bills/{id}?qr=1`      |
| **Discount**        | Flat discount + percent on bill   | `discountAmount` in bill payload          |
| **Loyalty**         | Earn 1pt/₹1, redeem @ ₹0.50/pt    | `GET /api/v1/retail/loyalty?phone=`       |
| **Cash Drawer**     | ESC/POS open command on cash pay  | `cashDrawerOpened` + `CASH_DRAWER_OPEN`   |
| **Thermal Printer** | 58/80mm receipt text              | `GET /api/v1/retail/bills/{id}?print=1`   |
| **Offline Billing** | Queue bills, sync when online     | `POST /api/v1/retail/offline`             |
| **GST Invoice**     | B2B/B2C with CGST/SGST/HSN        | `GET /api/v1/retail/bills/{id}?invoice=1` |
| **Returns**         | Refund against original bill      | `POST /api/v1/retail/returns`             |
| **Exchange**        | Return + new bill in one flow     | `type: "EXCHANGE"` + `exchangeLines`      |

## Create Bill

```json
POST /api/v1/retail/bills
{
  "terminalId": "...",
  "customerPhone": "+919876543210",
  "customerName": "Raj",
  "customerGstin": "08XXXXX1234X1ZX",
  "lines": [
    { "productId": "...", "name": "Paneer 500g", "quantity": 2, "unitPrice": 180, "hsnCode": "0406" }
  ],
  "discountAmount": 20,
  "loyaltyPointsRedeem": 50,
  "payments": [
    { "method": "CASH", "amount": 350 },
    { "method": "UPI", "amount": 28.60, "reference": "UPI123" }
  ]
}
```

## Offline Sync

```json
POST /api/v1/retail/offline
{ "clientId": "uuid-from-device", "payload": { ...bill } }

POST /api/v1/retail/offline
{ "action": "sync" }
```

## Permissions

- `retail:read` / `retail:write` — cashiers (Accountant, IOT Operator, Farm Manager)
- `admin:retail:read` / `admin:retail:write` — terminals and config

## Admin UI

Navigate to **`/admin/retail`**.

## Seed

```bash
npm run db:seed-retail
```

## Integration Points

- **Products** — `PosProductBarcode` links ecommerce `Product`
- **Processing** — scan `ProcLabel` barcodes from milk processing
- **GST integration** — `verifyGstin` via `/api/v1/integrations`
- **Tally** — `invoice.created` webhook on bill complete
