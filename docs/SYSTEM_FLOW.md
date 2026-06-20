# SYSTEM_FLOW.md

## System Flow Documentation

This document describes the **complete operational flow** of the QR Onsite Ordering Platform, from QR scan to order delivery via WhatsApp.

The goal is to ensure every contributor understands **how data moves through the system**.

---

## 1. High-Level System Flow

```
Customer
   │
   ▼
Scan QR Code
   │
   ▼
Enter Page (/enter)
   │
   ▼
QR Validation + Session Creation
   │
   ▼
Menu Page (/menu)
   │
   ▼
Cart System
   │
   ▼
Upsell Suggestions
   │
   ▼
Order Confirmation
   │
   ▼
WhatsApp Message Generation
   │
   ▼
Order Sent to Shop
```

---

## 2. QR Scan Flow

Customer scans QR code placed at a table or counter.

Example QR URL:

```
https://platform.com/enter?shop=12&table=5
```

The parameters contain:

* `shop` → shop identifier
* `table` → table identifier

---

## 3. Enter Page Logic

The `/enter` page handles **QR verification**.

Steps:

1. Parse URL parameters
2. Validate shop ID
3. Create QR session
4. Store session in browser storage
5. Redirect user to menu

Example session structure:

```json
{
  "shop_id": 12,
  "table": 5,
  "created_at": "timestamp"
}
```

Session stored in:

```
sessionStorage
```

---

## 4. Session Validation

The `/menu` page must verify that a valid QR session exists.

Conditions:

```
session exists
AND
session not expired
```

Session expiration:

```
30 minutes
```

If session is invalid:

User is redirected to:

```
/invalid-access
```

---

## 5. Optional Location Verification

The system may optionally verify that the user is **physically near the shop**.

Process:

1. Request geolocation permission
2. Get device coordinates
3. Compare with shop coordinates
4. Calculate distance
5. Allow access if within allowed radius

Example radius:

```
50 meters
```

---

## 6. Menu Display Flow

Menu is retrieved from the database using the shop ID.

Data includes:

```
menu items
categories
prices
upsell relationships
```

Menu UI displays:

* item image
* item name
* price
* add-to-cart button

---

## 7. Cart Flow

User actions:

```
Add item
Remove item
Change quantity
View total price
```

Cart state is managed using a **React hook**.

Example:

```
useCart()
```

Cart stored locally until order submission.

---

## 8. Upsell Flow

When an item is added to the cart:

System checks for related upsell items.

Example:

```
Burger → Fries, Soda
Pizza → Garlic Bread
```

If upsell items exist:

Display modal suggesting additional items.

User may:

```
Accept upsell
Decline upsell
```

---

## 9. Order Confirmation Flow

User proceeds to checkout.

System generates order summary:

```
Shop Name
Table Number
Items Ordered
Total Price
```

Example:

```
Table: 5

1 Burger
1 Fries
1 Soda

Total: KSh 850
```

---

## 10. WhatsApp Order Generation

System builds an encoded WhatsApp message.

Message example:

```
New Order

Shop: Example Cafe
Table: 5

Items:
1 Burger
1 Fries
1 Soda

Total: KSh 850
```

WhatsApp link format:

```
https://wa.me/SHOP_PHONE?text=ENCODED_MESSAGE
```

User is redirected to WhatsApp with message prefilled.

---

## 11. Order Delivery

Customer presses **Send** in WhatsApp.

Order arrives on the shop's WhatsApp number.

Shop staff:

```
Receive order
Prepare items
Serve customer
```

---

## 12. Shop Dashboard Flow

Shop owners access the dashboard to manage their shop.

Features:

```
Create menu items
Edit prices
Generate QR codes
Configure WhatsApp number
```

QR codes generated for:

```
tables
counters
pickup stations
```

---

## 13. Admin Flow

Platform administrator manages the system.

Admin capabilities:

```
Create shop accounts
Manage subscription plans
Enable online ordering
View platform analytics
```

---

## 14. Error Handling Flow

Possible errors include:

### Invalid QR

```
Missing shop ID
Invalid parameters
```

System response:

Redirect to:

```
/invalid-qr
```

---

### Session Expired

```
Session older than 30 minutes
```

System response:

Prompt user to **scan QR again**.

---

### Location Denied

If location permission is denied:

System may:

```
Allow access
OR
Display warning
```

---

## 15. Future Flow Extensions

Future system capabilities may include:

```
Online ordering
Payment processing
Delivery services
Kitchen display systems
Analytics dashboards
```


---

## 17. Interconnected Systems (Handshake Flow)

The platform supports a bidirectional **Order Handshake** with external processing systems (System B).

### 17.1 The Standard Handshake Sequence
1. **Sync**: System A sends the order to System B's Gateway via `pingExternalOrderGateway`.
2. **Accept**: System B generates a unique **Master Order Number** (e.g., `ORD-260404`).
3. **Feedback**: System B triggers a webhook to System A (`/api/order/status`).
4. **Link**: System A stores the Master ID in `system_b_tracking_id`, creating a permanent link.

### 17.2 Status Mappings
- **System B: `inception`** -> **System A: `paid`** (Order unlocked).
- **System B: `accepted`** -> **System A: `processing`**.
- **System B: `ready`** -> **System A: `shipped`**.
- **System B: `completed`** -> **System A: `completed`**.

---

## 18. Flow Summary

Full customer journey (Interconnected):

```
Scan QR
↓
Menu Selection
↓
Order Sync (System A -> B)
↓
Master ID Handshake (System B -> A)
↓
Live Tracking Updated (with Master Order Number)
↓
Shop Preparation
↓
Fulfillment Complete
```
