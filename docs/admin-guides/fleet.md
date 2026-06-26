# Fleet Admin Guide

Transport and logistics platform for milk tankers, delivery vehicles, and drivers.

## Modules

| Module                 | Description                                      | API                                    |
| ---------------------- | ------------------------------------------------ | -------------------------------------- |
| **Vehicle**            | Fleet registry with odometer, status, GPS device | `GET/POST /api/v1/fleet/vehicles`      |
| **Fuel**               | Fuel fill logs with cost and odometer            | `GET/POST /api/v1/fleet/fuel`          |
| **Maintenance**        | Scheduled and emergency service records          | `GET/POST /api/v1/fleet/maintenance`   |
| **GPS**                | Live position + track history                    | `GET/POST /api/v1/fleet/gps`           |
| **Drivers**            | Links `User` (DELIVERY role) to license info     | `GET/POST /api/v1/fleet/drivers`       |
| **Insurance**          | Policy tracking with expiry alerts               | `GET/POST /api/v1/fleet/insurance`     |
| **Milk Tanker**        | `isTanker` vehicles with capacity & temperature  | `GET /api/v1/fleet/vehicles?tankers=1` |
| **Route Optimization** | Nearest-neighbor stop ordering                   | `GET/POST /api/v1/fleet/routes`        |
| **Service Reminder**   | Due-date and odometer-based reminders            | `GET/POST /api/v1/fleet/reminders`     |
| **Trip History**       | Completed runs with milk volume & distance       | `GET/POST /api/v1/fleet/trips`         |

## Permissions

- `fleet:read` / `fleet:write` — drivers log fuel, GPS, trips
- `admin:fleet:read` / `admin:fleet:write` — full fleet admin (Farm Manager+)

## Admin UI

Navigate to **`/admin/fleet`** for the tabbed dashboard.

## Seed

```bash
npm run db:seed-fleet
```

## Route Optimization

POST a route with stops array; optimization runs automatically:

```json
{
  "name": "Morning Route",
  "vehicleId": "...",
  "stops": [
    { "id": "farm", "name": "Farm", "lat": 26.91, "lng": 75.78 },
    { "id": "hub", "name": "Hub", "lat": 26.92, "lng": 75.79 }
  ],
  "optimize": true,
  "origin": { "lat": 26.9124, "lng": 75.7873 }
}
```

## Integration Points

- **Mobile GPS** — existing `/api/v1/mobile/gps` for drivers; fleet GPS at `/api/v1/fleet/gps` for vehicles
- **Notifications** — wire service reminders to notification rules
- **Delivery** — link `FleetTrip` to `DeliveryAssignment` orders
