# qRshop — Entity Map (Database Schema)

> Sourced from all 45 migration files on `main` as of 2026-04-29.

---

## 🏪 Core Commerce

### `shops` (core entity)
| Column | Type | Notes |
|---|---|---|
| `shop_id` | UUID PK | |
| `name` | TEXT | |
| `subdomain` | TEXT | Unique slug (e.g. `mamarosy`) |
| `slug` | TEXT | URL-friendly identifier |
| `industry_type` | TEXT | `food`, `retail`, `service`, `digital`, `grocery`, etc. |
| `plan` | TEXT | e.g. `free`, `pro` |
| `subscription_expires_at` | TIMESTAMPTZ | |
| `is_online` | BOOLEAN | |
| `agent_id` | UUID → `agents` | |
| `verification_level` | TEXT | `unverified`, `bronze`, `silver`, `gold` |
| `trust_score` | NUMERIC(3,2) | Default 5.00 |
| `payment_mode` | TEXT | `escrow`, `direct` |
| `max_delivery_km` | NUMERIC | Default 10 |
| `latitude` / `longitude` | NUMERIC | Shop GPS location |
| `operational_region` | TEXT | Default `Nairobi` |
| `mask_customer_data` | BOOLEAN | |
| `fulfillment_settings` | JSONB | accepts_delivery, pickup, dine_in, etc. |
| `is_marketplace_enabled` | BOOLEAN | |
| `marketplace_terms_accepted_at` | TIMESTAMPTZ | |
| `marketplace_commission_rate` | DECIMAL(5,2) | Default 5% |
| `logistics_provider` | TEXT | `self`, `marketplace_standard`, `partner_express` |
| `distributor_network_active` | BOOLEAN | |
| `sales_brain` | JSONB | AI assistant config (personality, tone, playbook) |
| `ai_credits` | INTEGER | Default 500 |
| `created_at` | TIMESTAMP | |

---

### `menu_items` (products)
| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `shop_id` | UUID → `shops` | |
| `name` | TEXT | |
| `description` | TEXT | |
| `price` | NUMERIC | |
| `category` | TEXT | |
| `subcategory` | TEXT | |
| `sku` | TEXT | |
| `stock` | INTEGER | |
| `is_active` | BOOLEAN | |
| `brand` | TEXT | |
| `size` | TEXT | |
| `bulk_pricing` | JSONB | Array of tiered pricing |
| `reorder_level` | INTEGER | |
| `expiry_date` | TIMESTAMPTZ | |
| `benefits` | TEXT | |
| `usage_instructions` | TEXT | |
| `diet_tags` | TEXT[] | e.g. `['Organic', 'Gluten Free']` |
| `origin` | TEXT | |
| `processing` | TEXT | |
| `nutrition_info` | TEXT | |
| `rating` | NUMERIC(2,1) | |
| `promo_info` | TEXT | |
| `packaging` | TEXT | |
| `delivery_info` | TEXT | |
| `recipe` | TEXT | |
| `video_url` | TEXT | |
| `tags` | TEXT[] | For full-text search |
| `search_vector` | tsvector | Auto-generated GIN index |
| `attributes` | JSONB | Flexible per-shop extended attributes |

---

### `categories`
| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `shop_id` | UUID → `shops` | |
| `name` | TEXT | |
| `slug` | TEXT | |
| `created_at` | TIMESTAMPTZ | |

---

### `orders`
| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `shop_id` | UUID → `shops` | |
| `table_id` | TEXT | For dine-in |
| `table_number` | TEXT | |
| `order_type` | TEXT | `delivery`, `dine_in`, `takeaway`, `instore` |
| `fulfillment_type` | TEXT | |
| `status` | TEXT | `pending`, `accepted`, `completed`, etc. |
| `total_price` | NUMERIC | |
| `client_name` | TEXT | |
| `client_phone` | TEXT | |
| `customer_email` | TEXT | |
| `delivery_address` | TEXT | |
| `delivery_fee_charged` | NUMERIC | |
| `discount_amount` | NUMERIC | |
| `coupon_code` | TEXT | |
| `parent_order_id` | UUID (self-ref) | For split/child orders |
| `user_id` | UUID → `auth.users` | Linked registered customer |
| `latitude` / `longitude` | DECIMAL | Customer GPS for delivery |
| `delivery_status` | TEXT | `none`, `pending_pickup`, `picked_up`, `dispatched`, `delivered` |
| `delivery_agent_id` | UUID → `auth.users` | |
| `delivery_payout_amount` | DECIMAL | |
| `delivery_lat` / `delivery_lng` | DECIMAL | Real-time agent coordinates |
| `notes` | TEXT | Order-level notes |
| `client_mutation_id` | TEXT UNIQUE | Idempotency key |
| `expires_at` | TIMESTAMPTZ | Default 2 hours from creation |
| `fulfillment_deadline` | TIMESTAMPTZ | Default 45 mins from creation |
| `ai_agent_status` | TEXT | `idle`, etc. |
| `auto_accepted` | BOOLEAN | |
| `created_at` | TIMESTAMPTZ | |

---

### `order_items`
| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `order_id` | UUID → `orders` | |
| `menu_item_id` | UUID → `menu_items` | |
| `quantity` | INTEGER | |
| `price` | NUMERIC | Price at time of order |

---

### `order_ratings`
| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `order_id` | UUID → `orders` UNIQUE | One rating per order |
| `shop_id` | UUID → `shops` | |
| `rating` | SMALLINT | 1–5 |
| `comment` | TEXT | |
| `created_at` | TIMESTAMPTZ | |

---

## 👤 Identity & Access

### `auth.users` *(Supabase managed)*
The root identity record. All user tables reference this.

### `profiles` *(V2 layer)*
| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK → `auth.users` | 1:1 |
| `display_name` | TEXT | |
| `avatar_url` | TEXT | |
| `phone` | TEXT | |
| `system_role` | TEXT | `user`, `system_admin`, `agent`, `supplier` |
| `created_at` / `updated_at` | TIMESTAMPTZ | |

### `shop_users` *(V1 — still active)*
| Column | Type | Notes |
|---|---|---|
| `id` | UUID → `auth.users` | |
| `shop_id` | UUID → `shops` | |
| `email` | TEXT | |
| `role` | TEXT | `owner`, `manager`, `staff`, `system_admin` |
| PK | `(id, shop_id)` | Composite — supports multi-shop |

### `shop_members` *(V2 layer)*
| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `user_id` | UUID → `profiles` | |
| `shop_id` | UUID → `shops` | |
| `role` | TEXT | `owner`, `manager`, `staff`, `viewer` |
| `is_active` | BOOLEAN | |
| `invited_by` | UUID → `profiles` | |
| `joined_at` | TIMESTAMPTZ | |

> ⚠️ **NOTE:** Both `shop_users` (V1) and `shop_members` (V2) currently coexist. The V2 rebuild aims to deprecate `shop_users` in favour of `shop_members` + `profiles`.

### `customer_profiles`
| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK → `auth.users` | |
| `full_name` | TEXT | |
| `phone` | TEXT | |
| `default_address` | TEXT | |
| `latitude` / `longitude` | DECIMAL | |
| `created_at` / `updated_at` | TIMESTAMPTZ | |

---

## 🚴 Delivery & Logistics

### `delivery_agents`
| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK → `auth.users` | |
| `full_name` | TEXT | |
| `phone` | TEXT | |
| `vehicle_type` | TEXT | |
| `is_active` | BOOLEAN | |
| `current_status` | TEXT | `available`, `busy`, `offline` |
| `created_at` | TIMESTAMPTZ | |

### `delivery_logs`
| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `order_id` | UUID → `orders` | |
| `agent_id` | UUID → `auth.users` | |
| `status` | TEXT | |
| `notes` | TEXT | |
| `created_at` | TIMESTAMPTZ | |

### `system_logistics_config`
| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `region_name` | TEXT UNIQUE | e.g. `Nairobi`, `Mombasa` |
| `flat_delivery_fee` | NUMERIC | |
| `is_active` | BOOLEAN | |

### `communication_receipts`
| Column | Type | Notes |
|---|---|---|
| `receipt_id` | UUID PK | |
| `order_id` | UUID → `orders` | |
| `gateway_id` | TEXT | e.g. `whatsapp` |
| `status` | TEXT | `sent`, `acknowledged` |
| `acknowledged_at` | TIMESTAMPTZ | |
| `payload_snapshot` | JSONB | |
| `created_at` | TIMESTAMPTZ | |

---

## 📣 Agency & Marketplace

### `agents`
| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `user_id` | UUID → `auth.users` | |
| `jurisdiction_name` | TEXT | |
| `commission_rate` | NUMERIC(5,2) | |
| `is_active` | BOOLEAN | |

### `industry_types`
| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `slug` | TEXT UNIQUE | e.g. `food`, `grocery` |
| `name` | TEXT | |
| `description` | TEXT | |

### `marketplace_terms`
| Column | Type | Notes |
|---|---|---|
| `id` | SERIAL PK | |
| `version_label` | TEXT | |
| `terms_content` | TEXT | |
| `is_active` | BOOLEAN | |
| `effective_date` | DATE | |

---

## 🛡️ Trust & Moderation

### `shop_reviews`
| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `shop_id` | UUID → `shops` | |
| `rating` | INTEGER | 1–5 |
| `comment` | TEXT | |
| `created_at` | TIMESTAMPTZ | |

### `shop_reports`
| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `shop_id` | UUID → `shops` | |
| `agent_id` | UUID → `agents` | |
| `category` | TEXT | |
| `description` | TEXT | |
| `status` | TEXT | `pending`, `investigating`, `resolved`, `dismissed` |

### `system_audit_logs` *(immutable)*
| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `actor_id` | UUID → `auth.users` | Who performed action |
| `action` | TEXT | e.g. `PROMOTED_MERCHANT` |
| `target_type` | TEXT | e.g. `shops`, `orders` |
| `target_id` | UUID | |
| `before_state` | JSONB | |
| `after_state` | JSONB | |
| `created_at` | TIMESTAMPTZ | |

> 🔒 A database trigger prevents any UPDATE or DELETE on this table — it is permanently append-only.

---

## 📡 QR & Telemetry

### `qrs` (QR Nodes)
| Column | Type | Notes |
|---|---|---|
| `qr_id` | TEXT PK | Was UUID, migrated to TEXT (6-char alphanumeric short ID) |
| `shop_id` | UUID → `shops` | |
| `action_type` | TEXT | Legacy |
| `action` | TEXT | Current — e.g. `open_menu` |
| `location` | TEXT | Physical placement description |
| `campaign_id` | UUID | |
| `status` | TEXT | `active` |
| `scan_count` | INTEGER | Auto-incremented by trigger on `events` |
| `created_at` | TIMESTAMP | |

### `deployments`
| Column | Type | Notes |
|---|---|---|
| `deployment_id` | UUID PK | |
| `qr_id` | → `qrs` | |
| `location_name` | TEXT | |
| `zone` | TEXT | |
| `environment` | TEXT | |
| `installed_at` | TIMESTAMP | |

### `visits`
| Column | Type | Notes |
|---|---|---|
| `visit_id` | UUID PK | |
| `qr_id` | → `qrs` | |
| `deployment_id` | → `deployments` | |
| `shop_id` | → `shops` | |
| `session_id` | → `sessions` | |
| `device_id` | → `devices` | |
| `visit_start` / `visit_end` | TIMESTAMP | |

### `events`
| Column | Type | Notes |
|---|---|---|
| `event_id` | UUID PK | |
| `event_type` | TEXT | e.g. `qr_scanned` |
| `qr_id`, `shop_id`, `session_id`, `device_id`, `user_id`, `visit_id` | FKs | |
| `metadata` | JSONB | |
| `timestamp` | TIMESTAMP | |

### `sessions`
| Column | Type | Notes |
|---|---|---|
| `session_id` | UUID PK | |
| `device_id` | → `devices` | |
| `started_at` / `ended_at` | TIMESTAMP | |

### `devices`
| Column | Type | Notes |
|---|---|---|
| `device_id` | UUID PK | |
| `device_type` | TEXT | |
| `os` | TEXT | |
| `browser` | TEXT | |

---

## 🤖 AI & Content

### `product_sales_pages`
| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `product_id` | UUID → `menu_items` UNIQUE | |
| `headline` | TEXT | |
| `sales_script` | TEXT | AI-generated copy |
| `benefits_summary` | TEXT | |
| `recipe_suggestions` | TEXT | |
| `pdf_url` | TEXT | |
| `is_published` | BOOLEAN | |
| `created_at` / `updated_at` | TIMESTAMPTZ | |

### `order_notifications`
| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `order_id` | UUID → `orders` | |
| `order_customer_name` | TEXT | |
| `shop_id` | UUID → `shops` | |
| `notification_type` | TEXT | |
| `channel` | TEXT | Default `whatsapp` |
| `status` | TEXT | Default `sent` |
| `payload` | JSONB | |

---

## 🏭 B2B / Supplier Portal

### `suppliers`
| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `owner_id` | UUID → `auth.users` | |
| `name` | TEXT | |
| `description` | TEXT | |
| `contact_email` / `contact_phone` | TEXT | |
| `logo_url` / `website` | TEXT | |
| `mpesa_shortcode` / `mpesa_passkey` | TEXT | |
| `is_verified` | BOOLEAN | |

### `supplier_items`
| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `supplier_id` | → `suppliers` | |
| `name` / `description` | TEXT | |
| `price` | NUMERIC | |
| `moq` | INT | Minimum order quantity |
| `category` | TEXT | |
| `image_url` | TEXT | |
| `is_available` | BOOLEAN | |

### `supplier_orders`
| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `supplier_id` | → `suppliers` | |
| `shop_id` | → `shops` | |
| `status` | TEXT | `pending` |
| `total_amount` | NUMERIC | |
| `notes` | TEXT | |

### `supplier_order_items`
| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `order_id` | → `supplier_orders` | |
| `supplier_item_id` | → `supplier_items` | |
| `quantity` | INT | |
| `price_at_order` | NUMERIC | |

---

## 💬 Community / Social Layer

### `community_profiles`
| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK → `auth.users` | |
| `username` | TEXT UNIQUE | |
| `full_name` | TEXT | |
| `avatar_url` | TEXT | |
| `bio` | TEXT | |

### `communities`
| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `name` | TEXT UNIQUE | |
| `slug` | TEXT UNIQUE | |
| `description` | TEXT | |
| `banner_url` | TEXT | |

### `community_posts`
| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `author_id` | → `community_profiles` | |
| `community_id` | → `communities` | |
| `content` | TEXT | |
| `image_url` | TEXT | |
| `tagged_product_id` | UUID → `menu_items` | Product tagging |

---

## 📢 Advertising

### `adverts`
| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `image_url` | TEXT | |
| `target_url` | TEXT | |
| `placement` | TEXT | `header`, `infeed`, `sidebar` |
| `is_active` | BOOLEAN | |
| `shop_id` | UUID → `shops` | Optional brand sponsor |

---

## Entity Relationship Summary

```
auth.users
  ├── profiles (1:1, V2)
  │     └── shop_members (M:M to shops, V2)
  ├── shop_users (M:M to shops, V1 - active)
  ├── customer_profiles (1:1)
  ├── delivery_agents (1:1)
  ├── agents (1:1)
  └── suppliers (1:M)

shops
  ├── menu_items (1:M)
  │     ├── order_items (1:M)
  │     ├── product_sales_pages (1:1)
  │     └── community_posts (M:1 tag)
  ├── orders (1:M)
  │     ├── order_items (1:M)
  │     ├── order_ratings (1:1)
  │     ├── order_notifications (1:M)
  │     ├── delivery_logs (1:M)
  │     └── communication_receipts (1:M)
  ├── qrs (1:M)
  │     ├── deployments (1:M)
  │     └── visits (1:M)
  ├── shop_reviews (1:M)
  ├── shop_reports (1:M)
  ├── categories (1:M)
  └── supplier_orders (M:1 from suppliers)

Telemetry: devices → sessions → visits → events
```
