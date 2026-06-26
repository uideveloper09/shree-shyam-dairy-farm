# Mobile App (PWA)

Progressive Web App with role-based experiences — install on Android/iOS like a native app.

## Install

1. Open [shree-shyam-dairy-farm.vercel.app/m](https://shree-shyam-dairy-farm.vercel.app/m) on your phone
2. **Android:** Chrome menu → "Add to Home screen"
3. **iOS:** Safari Share → "Add to Home Screen"

## Apps by role

| App             | Route         | Who             |
| --------------- | ------------- | --------------- |
| Customer        | `/m/customer` | Customers       |
| Delivery Boy    | `/m/delivery` | Delivery staff  |
| Farm Manager    | `/m/farm`     | Farm managers   |
| Veterinarian    | `/m/vet`      | Vets            |
| Owner Dashboard | `/m/owner`    | Business owners |

`/m` redirects to the correct app for your role.

## Features

| Feature            | Description                                        |
| ------------------ | -------------------------------------------------- |
| Offline sync       | Actions queued when offline, synced on reconnect   |
| Push notifications | Delivery updates, farm alerts (enable in Settings) |
| GPS tracking       | Delivery route pings (delivery role)               |
| Camera             | Proof-of-delivery photos                           |
| Barcode / QR scan  | Product and order scanning                         |
| Biometric login    | WebAuthn passkeys (fingerprint / Face ID)          |

## Settings

`/m/settings` — push preferences, biometric setup, app info.

## Deep links

Custom scheme `ssd://` maps to `/m/*` routes for future native wrapper (Capacitor).

## Related

- [Mobile architecture](../architecture/frontend.md)
- [Internal API: Mobile](../api/internal-api.md)
