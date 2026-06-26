# Account & Privacy

Manage your Shree Shyam Dairy Farm account, security settings, and data rights.

## Account settings

- **Profile:** name, phone, email
- **Addresses:** delivery addresses
- **Payment methods:** saved Razorpay methods
- **Sessions:** view and revoke active devices (`/api/v1/auth/sessions`)

## Security

| Feature                | How to enable                            |
| ---------------------- | ---------------------------------------- |
| Two-factor auth (TOTP) | Account → Security → Enable 2FA          |
| Google sign-in         | Login page → Continue with Google        |
| Phone OTP login        | Login → OTP → enter phone number         |
| Biometric (mobile)     | [Mobile App](./mobile-app.md) → Settings |

## Your data rights (GDPR)

| Right               | How                                                                                     |
| ------------------- | --------------------------------------------------------------------------------------- |
| Export my data      | Account → Privacy → Download data (`GET /api/v1/account/export`)                        |
| Delete my account   | Account → Privacy → Delete (`DELETE /api/v1/account`, confirm with `DELETE MY ACCOUNT`) |
| Consent preferences | Account → Privacy → Marketing consent                                                   |

Data retention: 365 days after account deletion for audit compliance (`GDPR_RETENTION_DAYS`).

## Related

- [Security architecture](../architecture/security.md)
