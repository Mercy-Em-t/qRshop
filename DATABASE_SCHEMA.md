# DATABASE_SCHEMA.md

## 1. Overview

This document defines the **database structure** for the QR Onsite Ordering Platform.
It is designed to support **multi-shop environments**, QR-based access, menu management, upsell relationships, and order tracking via WhatsApp.

---

## 2. Tables

### 2.1 Shops

Stores information about each shop using the platform.

| Field      | Type      | Description                        |
| ---------- | --------- | ---------------------------------- |
| id         | UUID      | Primary key                        |
| name       | String    | Shop name                          |
| phone      | String    | WhatsApp number for orders         |
| latitude   | Decimal   | Shop location latitude             |
| longitude  | Decimal   | Shop location longitude            |
| plan       | String    | `free` or `paid` subscription plan |
| created_at | Timestamp | Auto timestamp                     |
| updated_at | Timestamp | Auto timestamp                     |

---

### 2.2 Tables

Represents physical tables or counters within a shop.

| Field        | Type      | Description                    |
| ------------ | --------- | ------------------------------ |
| id           | UUID      | Primary key                    |
| shop_id      | UUID      | Foreign key → Shops(id)        |
| table_number | String    | Table identifier (e.g., 1, A5) |
| qr_code_url  | String    | Generated QR code link         |
| created_at   | Timestamp | Auto timestamp                 |
| updated_at   | Timestamp | Auto timestamp                 |

---

### 2.3 Menu_Items

Stores each item available in a shop's menu.

| Field       | Type      | Description                            |
| ----------- | --------- | -------------------------------------- |
| id          | UUID      | Primary key                            |
| shop_id     | UUID      | Foreign key → Shops(id)                |
| name        | String    | Item name                              |
| description | Text      | Item description (optional)            |
| price       | Decimal   | Item price                             |
| category    | String    | Category (e.g., Main, Drinks, Dessert) |
| created_at  | Timestamp | Auto timestamp                         |
| updated_at  | Timestamp | Auto timestamp                         |

---

### 2.4 Upsell_Items

Defines **upsell relationships** between menu items.

| Field     | Type | Description                                   |
| --------- | ---- | --------------------------------------------- |
| id        | UUID | Primary key                                   |
| item_id   | UUID | Foreign key → Menu_Items(id)                  |
| upsell_id | UUID | Foreign key → Menu_Items(id) (suggested item) |

*Example:*
`Burger (item_id)` → `Fries (upsell_id)`
`Pizza` → `Garlic Bread`

---

### 2.5 Orders

Tracks orders initiated by customers.

| Field       | Type      | Description                  |
| ----------- | --------- | ---------------------------- |
| id          | UUID      | Primary key                  |
| shop_id     | UUID      | Foreign key → Shops(id)      |
| table_id    | UUID      | Foreign key → Tables(id)     |
| total_price | Decimal   | Total order value            |
| status      | String    | e.g., `pending`, `completed` |
| created_at  | Timestamp | Auto timestamp               |
| updated_at  | Timestamp | Auto timestamp               |

---

### 2.6 Order_Items

Stores **menu items included in an order**.

| Field        | Type    | Description                     |
| ------------ | ------- | ------------------------------- |
| id           | UUID    | Primary key                     |
| order_id     | UUID    | Foreign key → Orders(id)        |
| menu_item_id | UUID    | Foreign key → Menu_Items(id)    |
| quantity     | Integer | Number of items                 |
| price        | Decimal | Price per item at time of order |

---

### 2.7 Users (Optional)

If shops or admin need authentication.

| Field      | Type      | Description                             |
| ---------- | --------- | --------------------------------------- |
| id         | UUID      | Primary key                             |
| email      | String    | Login email                             |
| password   | String    | Hashed password                         |
| role       | String    | `admin`, `shop_owner`                   |
| shop_id    | UUID      | Foreign key → Shops(id) (if shop owner) |
| created_at | Timestamp | Auto timestamp                          |
| updated_at | Timestamp | Auto timestamp                          |

---

## 3. Relationships

1. **Shops → Tables** → One-to-Many
2. **Shops → Menu_Items** → One-to-Many
3. **Menu_Items → Upsell_Items** → One-to-Many
4. **Shops → Orders** → One-to-Many
5. **Orders → Order_Items** → One-to-Many
6. **Tables → Orders** → One-to-Many

---

## 4. Indexing Recommendations

* Index `shop_id` on Tables, Menu_Items, Orders for faster queries.
* Index `order_id` on Order_Items.
* Consider geospatial indexing for location verification (`latitude` + `longitude`).

---

## 5. Notes

* All timestamps should be **UTC**.
* Prices stored as decimal for **currency precision**.
* Upsell relationships can support **multiple suggestions per item**.
* This schema is compatible with **Supabase/PostgreSQL** but can be adapted to Firebase collections if needed.

---

## 6. V2 Tables

### 6.1 QR_Sessions

Manages server-side QR code session validation with device tracking.

| Field      | Type      | Description                                  |
| ---------- | --------- | -------------------------------------------- |
| id         | UUID      | Primary key                                  |
| shop_id    | UUID      | Foreign key → Shops(id)                      |
| table_id   | String    | Table identifier                             |
| device_id  | String    | Device identifier for session deduplication  |
| created_at | Timestamp | Auto timestamp                               |
| expires_at | Timestamp | Session expiration (default: 30 minutes)     |
| status     | String    | `active`, `expired`                          |

---

### 6.2 Analytics_Orders

Tracks all order attempts for analytics and reporting.

| Field       | Type      | Description                     |
| ----------- | --------- | ------------------------------- |
| id          | UUID      | Primary key                     |
| shop_id     | UUID      | Foreign key → Shops(id)         |
| table_id    | String    | Table identifier                |
| items       | JSONB     | Ordered items with quantities   |
| total_price | Decimal   | Total order value               |
| timestamp   | Timestamp | Auto timestamp (default: now()) |

---

### 6.3 Analytics_Upsells

Tracks upsell suggestion performance (accepted/declined).

| Field     | Type      | Description                                         |
| --------- | --------- | --------------------------------------------------- |
| id        | UUID      | Primary key                                         |
| item_id   | UUID      | Foreign key → Menu_Items(id) (original item)        |
| upsell_id | UUID      | Foreign key → Menu_Items(id) (suggested item)       |
| accepted  | Boolean   | Whether the upsell was accepted                     |
| timestamp | Timestamp | Auto timestamp                                      |

---

### 6.4 Subscriptions

Manages shop subscription plans and feature access.

| Field      | Type      | Description                         |
| ---------- | --------- | ----------------------------------- |
| id         | UUID      | Primary key                         |
| shop_id    | UUID      | Foreign key → Shops(id)             |
| plan_type  | String    | `free`, `paid`                      |
| start_date | Timestamp | Plan start date                     |
| end_date   | Timestamp | Plan end date                       |
| status     | String    | `active`, `expired`, `cancelled`    |

---

### 6.5 Payments (Optional)

Tracks payment transactions for online ordering.

| Field      | Type      | Description                         |
| ---------- | --------- | ----------------------------------- |
| id         | UUID      | Primary key                         |
| order_id   | UUID      | Foreign key → Orders(id)            |
| amount     | Decimal   | Payment amount                      |
| method     | String    | `mpesa`, `card`                     |
| status     | String    | `pending`, `completed`, `failed`    |
| created_at | Timestamp | Auto timestamp                      |

---

## 7. V2 Indexing Recommendations

* Index `shop_id` + `status` on `qr_sessions` for fast active session lookup.
* Index `shop_id` + `timestamp` on `analytics_orders` for date-range queries.
* Index `item_id` on `analytics_upsells` for conversion rate calculations.
* Index `shop_id` + `status` on `subscriptions` for plan lookup.
* Add indexes to existing `orders`, `menu_items`, `qr_sessions` for scale.

---

## 8. V3 Tables (Full-Stack Telemetry Schema)

The V3 schema introduces server-side device tracking, session management, visit logging, and enriched event telemetry. See [`supabase/schema.sql`](./supabase/schema.sql) for the full executable SQL.

### 8.1 Deployments

Tracks where QR codes are physically installed.

| Field         | Type      | Description                                  |
| ------------- | --------- | -------------------------------------------- |
| deployment_id | UUID      | Primary key                                  |
| qr_id         | UUID      | Foreign key → qrs(qr_id)                    |
| location_name | Text      | Human-readable location name                 |
| zone          | Text      | Zone or area within the location             |
| environment   | Text      | Environment type (e.g., indoor, outdoor)     |
| installed_at  | Timestamp | When the QR was deployed                     |

---

### 8.2 Devices

Stores information about devices that scan QR codes.

| Field       | Type      | Description                  |
| ----------- | --------- | ---------------------------- |
| device_id   | UUID      | Primary key                  |
| device_type | Text      | Device type (mobile, tablet) |
| os          | Text      | Operating system             |
| browser     | Text      | Browser name                 |
| created_at  | Timestamp | Auto timestamp               |

---

### 8.3 Sessions

Tracks browsing sessions tied to devices.

| Field      | Type      | Description                      |
| ---------- | --------- | -------------------------------- |
| session_id | UUID      | Primary key                      |
| device_id  | UUID      | Foreign key → devices(device_id) |
| started_at | Timestamp | Session start time               |
| ended_at   | Timestamp | Session end time (nullable)      |

---

### 8.4 Visits

Tracks individual QR scan visits with full context.

| Field         | Type      | Description                            |
| ------------- | --------- | -------------------------------------- |
| visit_id      | UUID      | Primary key                            |
| qr_id         | UUID      | Foreign key → qrs(qr_id)              |
| deployment_id | UUID      | Foreign key → deployments(deployment_id) |
| shop_id       | UUID      | Foreign key → shops(shop_id)           |
| session_id    | UUID      | Foreign key → sessions(session_id)     |
| device_id     | UUID      | Foreign key → devices(device_id)       |
| visit_start   | Timestamp | When the visit started                 |
| visit_end     | Timestamp | When the visit ended (nullable)        |

---

### 8.5 Users

End-user accounts identified by phone number.

| Field            | Type      | Description           |
| ---------------- | --------- | --------------------- |
| user_id          | UUID      | Primary key           |
| phone            | Text      | Unique phone number   |
| signup_timestamp | Timestamp | When the user signed up |

---

### 8.6 Events (V3)

Enriched event telemetry with full relationship chain.

| Field      | Type      | Description                            |
| ---------- | --------- | -------------------------------------- |
| event_id   | UUID      | Primary key                            |
| event_type | Text      | Event type (e.g., qr_scanned)         |
| qr_id      | UUID      | Foreign key → qrs(qr_id)              |
| shop_id    | UUID      | Foreign key → shops(shop_id)           |
| session_id | UUID      | Foreign key → sessions(session_id)     |
| device_id  | UUID      | Foreign key → devices(device_id)       |
| user_id    | UUID      | Foreign key → users(user_id)           |
| visit_id   | UUID      | Foreign key → visits(visit_id)         |
| metadata   | JSONB     | Arbitrary event metadata               |
| timestamp  | Timestamp | When the event occurred                |

---

### 8.7 Trigger: increment_scan_count

Automatically increments `scan_count` on the `qrs` table whenever a `qr_scanned` event is inserted into the `events` table.

---

## 9. V3 Indexing Recommendations

* Index `qr_id` on `deployments` for deployment lookups by QR.
* Index `device_id` on `sessions` for session-by-device queries.
* Index `qr_id` + `visit_start` on `visits` for time-range visit analysis.
* Index `event_type` + `timestamp` on `events` for event filtering and dashboards.
* Index `shop_id` on `visits` for shop-level visit aggregations.
