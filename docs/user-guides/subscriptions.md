# Milk Subscriptions

Recurring daily or alternate-day milk delivery subscriptions.

## Creating a subscription

1. Log in to your account
2. Select a milk product with subscription option
3. Choose frequency (daily, alternate days, custom)
4. Set delivery address and start date
5. Complete payment setup via Razorpay

## Managing your subscription

From **Account → Subscriptions**:

| Action        | Description                  |
| ------------- | ---------------------------- |
| Pause         | Temporarily stop deliveries  |
| Resume        | Restart after pause          |
| Skip tomorrow | Skip next scheduled delivery |
| Vacation mode | Pause for a date range       |
| Cancel        | End subscription             |

API: `PATCH /api/v1/subscriptions/[id]/pause`, `/resume`, `/vacation`, `/cancel`

## Billing

Subscription billing is handled via Razorpay. View billing history under the subscription detail page.

## Notifications

Enable push notifications in the [Mobile App](./mobile-app.md) to receive delivery reminders.
