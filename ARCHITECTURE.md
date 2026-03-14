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

* shop management
* subscription management
* analytics

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

---

## Scalability Strategy

Initial deployment supports:

```
100–500 shops
```

Future scaling options include:

* API layer
* caching
* microservices
