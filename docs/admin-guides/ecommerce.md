# E-commerce Admin

Managing products, orders, and subscriptions from the admin interface.

## Product catalog

Products are managed via Prisma seed and database. Admin UI routes under the main storefront admin (future dedicated product admin).

Seed products:

```bash
npm run db:seed
```

Product model fields: name, slug, price, category, images, subscription eligibility.

## Orders

- View orders in database via Prisma Studio: `npm run db:studio`
- Order statuses: PENDING, PAID, PROCESSING, OUT_FOR_DELIVERY, DELIVERED, CANCELLED
- Payments linked via Razorpay order ID

## Subscriptions

Monitor active subscriptions and delivery schedules. Customer self-service via account page; admin can intervene via database or future admin UI.

## Coupons

`Coupon` and `UserCoupon` models support promotional codes. Apply at checkout.

## Payments (Razorpay)

| Env var                       | Purpose         |
| ----------------------------- | --------------- |
| `RAZORPAY_KEY_ID`             | Public key      |
| `RAZORPAY_KEY_SECRET`         | Server secret   |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Client checkout |

Webhook verification on payment confirm routes.

## Developer integrations

Orders trigger webhook events for external systems. See [Developer Portal](./developer-portal.md).

## Related

- [User guide: Ordering](../user-guides/ordering.md)
- [ER diagram: E-commerce](../er-diagrams/ecommerce.md)
