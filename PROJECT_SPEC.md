# QR Onsite Ordering Platform

**Project Specification Document**

## 1. Project Overview

This system is a **QR-based onsite ordering platform** designed for restaurants, cafés, sports venues, kiosks, and similar environments.

Customers scan a QR code at the venue to access a digital menu and place an order. Orders are then sent to the shop via **WhatsApp**, allowing businesses to receive orders without needing a POS system.

The system prioritizes **onsite orders** and restricts access to the menu unless the customer scans a valid QR code.

Future paid plans may enable **online ordering outside the venue**.

---

## 2. Core Objectives

The system must:

1. Allow customers to **scan a QR code and access a menu**
2. Restrict menu access to **QR-based entry**
3. Optionally verify **device location near the venue**
4. Allow customers to **select items and create an order**
5. Suggest **upsell items**
6. Generate a **WhatsApp order message**
7. Support **multiple shops**
8. Allow shops to **manage menus and QR codes**

---

## 3. Target Users

### Customer

* Scans QR code
* Views menu
* Adds items to cart
* Sends order via WhatsApp

### Shop Owner

* Manages menu items
* Generates QR codes for tables
* Receives orders via WhatsApp

### Platform Admin

* Manages shops
* Manages subscription plans
* Enables/disables online ordering

---

## 4. System Architecture

### Frontend

* React
* Vite
* TailwindCSS

### Backend

* Supabase (database + API)

### Hosting

* Vercel

### Communication

* WhatsApp deep links

---

## 5. Core System Modules

### 5.1 Customer Ordering Module

Pages:

```
/enter
/menu
/cart
/order
```

Functions:

* QR session verification
* location check
* menu browsing
* add items to cart
* upsell suggestions
* WhatsApp order generation

---

### 5.2 Shop Dashboard

Pages:

```
/login
/dashboard
/menu-manager
/qr-generator
```

Functions:

* add menu items
* edit menu items
* generate QR codes for tables
* configure WhatsApp number

---

### 5.3 Admin Panel

Pages:

```
/admin
/admin/shops
/admin/plans
```

Functions:

* create shop accounts
* enable paid plans
* view shop usage

---

## 6. QR Access Control

QR codes contain a URL in this format:

```
/enter?shop=SHOP_ID&table=TABLE_NUMBER
```

Example:

```
https://platform.com/enter?shop=12&table=5
```

When scanned:

1. System validates parameters
2. Session is created
3. User redirected to menu

Session stored in:

```
sessionStorage
```

Session expires after:

```
30 minutes
```

---

## 7. Location Verification (Optional)

System may request device location.

Steps:

1. Request geolocation permission
2. Compare device coordinates to shop coordinates
3. Allow access if within allowed radius

Radius example:

```
50 meters
```

---

## 8. Menu Data Model

### Shops

Fields:

```
id
name
whatsapp_number
latitude
longitude
plan
```

---

### Menu Items

Fields:

```
id
shop_id
name
price
category
upsell_items
```

Example upsell:

```
Burger → Fries, Soda
```

---

### Tables

Fields:

```
id
shop_id
table_number
qr_code_url
```

---

## 9. Ordering Flow

Customer workflow:

```
Scan QR
↓
Enter page verifies QR
↓
Menu loads
↓
Customer adds items
↓
Upsell suggestions shown
↓
Customer confirms order
↓
WhatsApp message generated
↓
Order sent to shop
```

---

## 10. WhatsApp Order Format

Example generated message:

```
New Order

Shop: Example Cafe
Table: 4

Items:
1 Burger
1 Fries
1 Soda

Total: KSh 850
```

WhatsApp link format:

```
https://wa.me/PHONE_NUMBER?text=ENCODED_MESSAGE
```

---

## 11. Security Rules

Menu must **not open without a QR session**.

Menu access requires:

```
sessionStorage.qrAccess == true
```

Session expires after:

```
30 minutes
```

Optional controls:

* location verification
* shop plan restrictions

---

## 12. Subscription Plans

### Free Plan

Features:

* QR ordering
* WhatsApp checkout
* onsite orders only

Restrictions:

* no online ordering

---

### Paid Plan

Features:

* online ordering
* analytics
* advanced QR options

---

## 13. Performance Requirements

Menu load time:

```
< 2 seconds
```

Order generation time:

```
< 1 second
```

---

## 14. Future Features (Not MVP)

These features are **out of scope for the first version**:

* online payments
* delivery integration
* kitchen display screens
* push notifications
* AI upsell recommendations

---

## 15. Development Guidelines

Project structure should support:

* modular components
* multi-shop architecture
* scalable database structure

Follow React best practices:

* reusable components
* clean routing
* separation of UI and logic

---

## 16. Expected Deliverables

The system must deliver:

1. Functional QR ordering flow
2. Shop dashboard
3. Menu management
4. WhatsApp order generation
5. QR code generation for tables

---

## 17. Success Criteria

The system is considered successful if:

* A restaurant can create a menu
* Generate QR codes
* Customers can scan and place orders
* Orders arrive on WhatsApp
