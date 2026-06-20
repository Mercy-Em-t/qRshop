# Data Dictionary

Based on the system schema, the following are the primary entities and their attributes.

## Shops Table
| Field | Type | Description |
|---|---|---|
| `id` | UUID | Primary key |
| `name` | String | Shop name |
| `phone` | String | WhatsApp number for orders |
| `plan` | String | 'free' or 'paid' subscription plan |

## Tables Table
| Field | Type | Description |
|---|---|---|
| `id` | UUID | Primary key |
| `shop_id` | UUID | Foreign key -> Shops(id) |
| `table_number` | String | Table identifier (e.g., A5) |
| `qr_code_url` | String | Generated QR code link |

## Menu_Items Table
| Field | Type | Description |
|---|---|---|
| `id` | UUID | Primary key |
| `shop_id` | UUID | Foreign key -> Shops(id) |
| `name` | String | Item name |
| `price` | Decimal | Item price |
| `category` | String | Menu category |

## Orders Table
| Field | Type | Description |
|---|---|---|
| `id` | UUID | Primary key |
| `shop_id` | UUID | Foreign key -> Shops(id) |
| `table_id` | UUID | Foreign key -> Tables(id) |
| `total_price` | Decimal | Total order value |
| `status` | String | Order status (e.g., pending) |

## QR_Sessions (V2)
| Field | Type | Description |
|---|---|---|
| `id` | UUID | Primary key |
| `shop_id` | UUID | Foreign key -> Shops(id) |
| `device_id` | String | Device identifier for session deduplication |
| `expires_at` | Timestamp | Session expiration (default: 30 mins) |\n