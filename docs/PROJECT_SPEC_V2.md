# PROJECT_SPEC_V2.md

## 1. Project Overview

This document defines **V2 of the QR Onsite Ordering Platform**, building on the stable MVP.

Goals:

* Strengthen **security** and QR session validation
* Provide **analytics and reporting** for shops
* Improve **UX and offline resilience**
* Introduce **paid plans and online ordering**
* Prepare for **scaling and future extensions**

---

## 2. Core Objectives

1. Implement **dynamic QR codes** with server-side session validation and optional location enforcement
2. Track **orders, upsell conversions, and popular items** for analytics
3. Improve **customer UX**, offline menu access, and cart persistence
4. Support **paid features**, online orders, and payment integrations
5. Ensure **system scalability and modular architecture** for future microservices

---

## 3. Development Phases & Tasks

### **Phase 1 – QR Security & Location 🍒**

* Backend:

  * Supabase Function for server-side **QR validation**
  * Store **session with expiration timestamp + device ID**
  * Optional **geolocation check**
* Frontend:

  * Update `/enter` page to call backend for session validation
  * Display **warning or block** if location is outside radius
* Tables:

  * `qr_sessions` → `id`, `shop_id`, `table_id`, `device_id`, `created_at`, `expires_at`, `status`

---

### **Phase 2 – Analytics & Reporting 🍒**

* Backend:

  * Track **order attempts, items, upsell conversions, timestamps**
  * Create endpoints for **analytics queries**
* Frontend:

  * Dashboard widgets:

    * Orders per day/table
    * Popular menu items
    * Upsell conversion rate
  * Export CSV option
* Tables:

  * `analytics_orders` → `order_id`, `shop_id`, `table_id`, `items`, `total_price`, `timestamp`
  * `analytics_upsells` → `item_id`, `upsell_id`, `accepted`

---

### **Phase 3 – UX & Offline Resilience 🍒**

* Frontend:

  * Implement **menu caching** using localStorage
  * Persist **cart state** across reloads/network drops
  * Smooth **upsell modal animations**
  * Loading indicators for **network-dependent actions**
* Optional enhancement:

  * Background sync: orders prepared offline automatically trigger WhatsApp link when back online

---

### **Phase 4 – Paid Plans + Payments + Scale ♟️**

* Features:

  * Online ordering beyond onsite QR scan
  * Payment integration (M-Pesa / Stripe)
  * Advanced analytics dashboards
  * Priority support for paid shops
* Backend:

  * New table: `subscriptions` → `shop_id`, `plan_type`, `start_date`, `end_date`, `status`
  * Payment endpoints: `/create-payment`, `/verify-payment`
* Frontend:

  * Shop dashboard displays **plan status**
  * Enable/disable online ordering based on plan
* Scalability:

  * Add **indexes** to `orders`, `menu_items`, `qr_sessions`
  * Use **caching for menus**
  * Prepare architecture for **hundreds of shops**

---

## 4. Component & Page Updates

### Frontend Pages

* `/enter` → Server-side QR validation, optional location check
* `/menu` → Offline caching, loading indicators
* `/cart` → Persisted state across sessions
* `/order` → Payment flow if online ordering enabled
* `/dashboard` → Analytics widgets
* `/plans` → Shop subscription management

### New Components

* `<OfflineMenuProvider />` → caches menu data
* `<AnalyticsChart />` → displays orders, upsells, popular items
* `<SubscriptionStatus />` → shows current plan and features
* `<PaymentModal />` → handles online payment process

---

## 5. API Endpoints

| Endpoint                   | Method | Description                                |
| -------------------------- | ------ | ------------------------------------------ |
| `/api/validate-qr`         | POST   | Validate QR session, optional location     |
| `/api/create-order`        | POST   | Store order in DB before WhatsApp          |
| `/api/get-analytics`       | GET    | Return orders, popular items, upsell stats |
| `/api/create-subscription` | POST   | Create paid plan for shop                  |
| `/api/verify-payment`      | POST   | Verify completed payment                   |
| `/api/menu-cache`          | GET    | Fetch menu for offline caching             |

---

## 6. Database Updates for V2

* **qr_sessions** → manage dynamic QR codes
* **analytics_orders** → track all order attempts
* **analytics_upsells** → track upsell performance
* **subscriptions** → manage paid plans and feature access

Existing tables (`shops`, `tables`, `menu_items`, `orders`, `order_items`) remain unchanged but may get **new indexes** for performance.

---

## 7. Security & Session Rules

* QR session must always be **validated server-side**
* Expiry: default **30 minutes**, adjustable per shop
* Location check optional, enabled per shop
* Online ordering allowed **only for paid shops**
* WhatsApp link generated **after backend order registration** to prevent spam

---

## 8. Testing & QA

* Unit tests for **QR validation**, session handling, cart persistence
* Integration tests: full **QR → Menu → Cart → WhatsApp / Payment** flow
* Stress tests: simulate **multiple customers scanning the same QR simultaneously**
* Analytics test: verify **orders and upsells** are tracked correctly

---

## 9. Deliverables

1. **Dynamic QR & server-side validation**
2. **Analytics dashboard**
3. **Offline menu & cart persistence**
4. **Paid plan + payment integration**
5. **Scalable architecture ready for hundreds of shops**
6. **Updated API documentation for backend integration**
