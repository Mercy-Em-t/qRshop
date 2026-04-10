# ARCHITECTURE.md

## System Architecture

This document describes the architecture of the QR Onsite Ordering Platform.

---

## High-Level Architecture

```
Customer Device
     │
     ▼
React Frontend (Vite)
     │
     ▼
Supabase Backend
     │
     ▼
Database
     │
     ▼
WhatsApp Deep Link
```

The system uses a **frontend-heavy architecture** to keep infrastructure simple and scalable.

### Runtime Boundary Model

1. **Client (`src/`)**
   - Public, customer, dashboard, and admin route surfaces.
   - Offline queueing and QR access/session UX enforcement.

2. **Serverless API (`api/`)**
   - Secure admin actions and gateway routing.
   - Webhook receivers for M-Pesa and cross-system status sync.
   - Uses server-side env vars (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, integration secrets).

3. **Supabase Edge Functions (`supabase/functions/`)**
   - Payment push + callback orchestration.
   - WhatsApp dispatch + webhook interaction loop.

4. **Data Layer (`supabase/*.sql`)**
   - Schema artifacts, hardening patches, and operational SQL.
   - Should be applied through ordered migrations to reduce drift.

---

## Technology Stack

Frontend

* React
* Vite
* TailwindCSS

Backend

* Supabase

Deployment

* Vercel

Communication

* WhatsApp Deep Links

---

## Application Structure

```
src
 ├── components
 │    ├── MenuItem
 │    ├── Cart
 │    ├── UpsellModal
 │    └── QRAccessGuard
 │
 ├── pages
 │    ├── Enter
 │    ├── Menu
 │    ├── Cart
 │    ├── Order
 │    ├── Dashboard
 │    └── Admin
 │
 ├── services
 │    ├── supabaseClient
 │    ├── menuService
 │    └── shopService
 │
 ├── utils
 │    ├── locationCheck
 │    ├── qrSession
 │    └── whatsappBuilder
 │
 └── hooks
      ├── useCart
      └── useShop
```

---

## Module Overview

### Customer Ordering Module

Responsibilities

* QR access verification
* menu browsing
* cart management
* upsell suggestions
* order generation

---

### Shop Dashboard Module

Responsibilities

* menu management
* QR generation
* shop configuration

---

### Admin Module

Responsibilities

* analytics
* platform-wide oversight

---

## Logistics Hub Module (NEW)

Responsibilities:

* **Regional Hubs**: Management of physical distribution nodes for multi-city pickups.
* **Rider Dashboard**: Task-focused interface for last-mile delivery agents.
* **Order Batching**: Grouping multiple orders into single routes to maximize efficiency.
* **Dispatch System**: One-click shop-to-courier handoff protocol.

---

## Global Search & Discovery (NEW)

Responsibilities:

* **Full-Text Search (FTS)**: O(log n) product discovery using Postgres GIN indexes.
* **Cross-Tenant Cataloging**: Scalable searching across multiple shop instances.
* **Weighted Matching**: Prioritizing product titles over descriptions for high-relevancy results.

---

## Security Model

Menu access requires:

1. Valid QR entry
2. Active session
3. Optional location verification

Session expiration:

```
30 minutes
```

Additional controls:

* No fallback hardcoded credentials in payment/webhook handlers.
* Webhook token/secret checks for inbound integration traffic.
* Input validation on order IDs, amount, phone format, and timestamps.

---

## Operations & Incident Response

* **Payment incidents:** Trace `payment_audit_log` and webhook secret configuration.
* **Gateway incidents:** Trace `gateway_logs` for sent/received payloads and latency.
* **Admin API incidents:** Validate service-role envs and admin token role mapping in `shop_users`.

---

## Scalability Strategy

Initial deployment supports:

```
100–500 shops
```

* **GIN Indexing**: Real-time Full-Text Search for thousands of items.
* **Hierarchical Routing**: Distributed pickup nodes to reduce bottlenecking.
* **Domain Trust Boundary**: Hardened QR redirection to prevent open-relay attacks.
