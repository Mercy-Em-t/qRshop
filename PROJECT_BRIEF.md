# Project Brief: Smart QR Platform

## 1. Project Vision

We are building a **Smart QR Infrastructure Platform**.

Instead of QR codes being **static links**, each QR becomes a **programmable node** that:

• performs dynamic actions
• collects telemetry data
• reports analytics
• can change behavior without reprinting

The system treats QRs like **distributed sensors in the physical world**.

Example use case:

A café prints QR codes on tables.

When scanned, the system can:

• open a digital menu
• track customer interactions
• measure conversions
• run promotions
• change behavior remotely

Over time, the platform collects **behavior analytics across physical environments**.

---

# 2. Core System Concept

Traditional QR:

```
QR → static URL
```

Our system:

```
QR → Scan Gateway → Behavior Engine → Experience
                 ↓
              Telemetry
                 ↓
             Event Stream
                 ↓
              Consumers
                 ↓
             Analytics
```

Each QR is treated as a **node object** with identity and metadata.

---

# 3. Technology Stack (Current)

Frontend:

```
React
Vite
```

Current frontend capabilities:

• menu display
• cart system
• offline caching
• offline order queue
• QR-based entry

Backend:

Currently conceptual but assumed stack:

```
Node.js / API server
Database (SQL or Supabase-style)
```

---

# 4. What Has Already Been Built

The frontend system already includes several features.

### Menu System

Digital menu interface that loads items.

Capabilities:

```
menu display
cart
checkout
```

---

### Offline Resilience

Menu caching:

```
OfflineMenuProvider
useOfflineMenu hook
```

If internet drops, cached menus still load.

---

### Offline Order Queue

Orders placed offline are queued in local storage.

When internet reconnects:

```
orders automatically send
```

---

### Reusable Components

Components created:

```
LoadingSpinner
OfflineAlert
```

These standardize UI feedback.

---

### Offline Context Integration

Menu page now uses:

```
OfflineMenuProvider
```

Instead of duplicate logic.

---

# 5. Current Application Flow

Current customer flow:

```
Scan QR
     ↓
Menu Page
     ↓
Browse Menu
     ↓
Add Items to Cart
     ↓
Checkout
     ↓
Send Order via WhatsApp
```

Offline fallback:

```
order queued
send later
```

---

# 6. Next Platform Layer Being Built

We are now building **QR Infrastructure** on top of the menu system.

Key components:

1. QR Factory
2. Scan Gateway
3. Event Telemetry
4. Analytics Engine
5. QR Manager Interface

---

# 7. QR Node Model

Every QR represents an object.

Example:

```
QR
 id: qr_21
 shop_id: cafe21
 location: entrance
 action: open_menu
 status: active
```

The QR code itself contains a **short URL**.

Example:

```
https://platform.com/q/AB12
```

---

# 8. Scan Gateway

Endpoint:

```
GET /q/:qrId
```

Responsibilities:

1. Log scan telemetry
2. Determine QR behavior
3. Redirect user

Example flow:

```
User scans QR
       ↓
Scan Gateway
       ↓
Event logged
       ↓
User redirected to menu
```

---

# 9. Event Telemetry System

Instead of directly writing analytics, we record **events**.

Event examples:

```
qr_scanned
menu_opened
menu_item_viewed
item_added_to_cart
order_started
order_completed
```

Events are stored in:

```
events table
```

Example row:

```
event_type: qr_scan
qr_id: qr_21
device: mobile
timestamp: x
```

---

# 10. Event Processing

Events are processed by a **worker**.

Worker tasks:

```
update scan counts
calculate conversions
update shop analytics
update QR metrics
```

Analytics stored in summary tables.

---

# 11. QR Manager Interface (Planned)

Dashboard for managing QR nodes.

Features:

### QR Dashboard

List all QRs.

```
QR ID
Location
Scans
Status
```

---

### QR Factory

Create new QR.

Fields:

```
name
location
action
campaign
```

---

### QR Detail Page

Shows metrics.

```
scans
orders
conversion rate
```

---

### QR Analytics

Graphs for performance.

---

# 12. Database Model (Planned)

Core tables:

```
shops
qrs
events
qr_metrics
shop_metrics
orders
```

---

# 13. QR Behavior Engine

QRs can change behavior dynamically.

Example rules:

```
if lunchtime
  show lunch menu

if promotion active
  show promotion first
```

Same QR can behave differently without reprinting.

---

# 14. System Architecture (Minimum Viable)

Current architecture target:

```
QR Factory
     ↓
QR Node Registry
     ↓
Scan Gateway
     ↓
Events Table
     ↓
Event Worker
     ↓
Metrics Tables
     ↓
Dashboard
```

This is a **minimum viable version** of a much larger streaming architecture.

---

# 15. Future Architecture (Scaling)

Eventually the system may evolve to:

```
QR Nodes
     ↓
Telemetry Gateway
     ↓
Event Streaming Platform
     ↓
Consumers
     ↓
Analytics Databases
     ↓
Dashboards
```

Similar to **IoT telemetry pipelines**.

---

# 16. Current Priorities

Immediate development tasks:

1. Build QR Factory API
2. Implement Scan Gateway
3. Create events table
4. Implement event processor
5. Build QR Manager UI
6. Generate QR images
7. Track scan analytics

---

# 17. Key System Principle

The most important design rule:

**QR codes are not links.**

They are **identifiers for programmable nodes**.

All behavior should be controlled by the platform.

---

# 18. Short Summary

We are building:

```
A programmable QR platform
that connects physical interactions
to digital analytics and services.
```

The system combines:

```
QR infrastructure
telemetry collection
event analytics
dynamic experiences
```
