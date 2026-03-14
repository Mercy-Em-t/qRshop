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
