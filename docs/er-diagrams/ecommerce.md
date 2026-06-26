# ER Diagram — E-commerce

```mermaid
erDiagram
  User ||--o{ Cart : owns
  User ||--o{ Order : places
  User ||--o{ Subscription : subscribes
  User ||--o{ Address : has
  User ||--o{ Review : writes

  Cart ||--o{ CartItem : contains
  CartItem }o--|| Product : references

  Order ||--o{ OrderItem : contains
  Order ||--o| Payment : has
  OrderItem }o--|| Product : references

  Subscription ||--o{ SubscriptionDelivery : schedules
  Product }o--|| Category : belongs_to

  Product {
    string id PK
    string name
    string slug UK
    decimal price
    string categoryId FK
    boolean active
  }

  Order {
    string id PK
    string orderNumber UK
    string userId FK
    string status
    decimal total
    datetime createdAt
  }

  Payment {
    string id PK
    string orderId FK
    string razorpayOrderId
    string status
    decimal amount
  }

  Subscription {
    string id PK
    string userId FK
    string productId FK
    string status
    string frequency
    datetime nextDelivery
  }
```

## Payment flow

```
Cart → Order → Payment (Razorpay) → Order.status = PAID
                                → SubscriptionDelivery scheduled
```

## Related

- [User guide: Ordering](../user-guides/ordering.md)
- [API: Internal](../api/internal-api.md)
