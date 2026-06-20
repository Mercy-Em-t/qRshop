# qRshop Customer Storyboard

## Full Journey Map

```mermaid
flowchart TD
    A["📱 Customer\nScans QR / Clicks Bio Link"] --> B{First time?}
    B -- Yes --> C["🔒 Privacy Consent\n(KDPA notice)"]
    B -- No --> D["⚡ Skip — straight to menu"]
    C -- Accept --> D
    C -- Decline --> Z1["🚫 Exit"]

    D --> MENU["🛍️ Menu Page\n─────────────────\n✓ Shop header + open/closed status\n✓ Category tab bar\n✓ 🔍 Search bar\n✓ Deals & bundles section\n✓ Items (card / list / icon view)\n✓ AI assistant widget"]

    MENU --> BROWSE["Browse & Add Items"]
    BROWSE --> UPSELL["💡 Upsell Suggestion Pop-up"]
    UPSELL --> BROWSE
    BROWSE --> CART["🛒 Cart\n─────────────────\n✓ Item list + qty controls\n✓ Running total\n✓ Shop closed guard"]

    CART --> CHECKOUT["📋 Checkout / Order Page\n─────────────────\n✓ Promo code input\n✓ Fulfillment: Dine-in / Pickup / Delivery\n✓ Name + Phone + Address\n✓ Final total + discount"]

    CHECKOUT --> PAY{Payment Route}
    PAY -- "Free tier" --> WA["💬 WhatsApp Redirect\n(pre-filled order message)"]
    PAY -- "Basic+ tier" --> DIRECT["🛒 Direct Checkout\n(order logged in DB)"]
    PAY -- "M-Pesa (when live)" --> MPESA["📲 STK Push\n(PIN prompt on phone)"]
    PAY -- "Offline" --> QUEUE["📥 Order Queued\n(syncs when back online)"]

    WA --> TRACKER
    DIRECT --> TRACKER
    MPESA --> TRACKER
    QUEUE --> TRACKER

    TRACKER["📡 Live Tracker\n─────────────────\n✓ Status: Pending → Accepted → Preparing → Ready/Delivered\n✓ Digital receipt\n✓ Auto-polls every 10s"]

    TRACKER -- "Shop requests edit" --> EDIT["✏️ Edit Order\n(revise & resubmit)"]
    EDIT --> TRACKER

    TRACKER -- "Completed / Delivered" --> RATING["⭐ Rating Modal\n─────────────────\n✓ 1–5 stars\n✓ Optional comment\n✓ One-time only (localStorage flag)"]
    RATING --> HISTORY

    TRACKER --> HISTORY["📋 My Orders\n─────────────────\n✓ All past orders\n✓ Status badges\n✓ 🔄 Reorder button\n✓ View Details link"]

    HISTORY -- "Reorder" --> CART

    %% Alternative Paths
    MENU --> ALT["── Alternative Paths (Menu Footer) ──"]
    ALT --> SUP["💬 Support\nWhatsApp Agent"]
    ALT --> GET["🏪 Get a Shop\n/request-access\n(name, phone, email form → waitlist)"]
    ALT --> ABT["🌐 About Us\n/about\n(brand mission + merchant CTA)"]
```

---

## Alternative Paths Detail

| Path | Entry Point | Page | What It Does |
|---|---|---|---|
| **Support** | Menu footer | WhatsApp deep link | Opens pre-filled WhatsApp chat with platform support number |
| **Get a Shop** | Menu footer | `/request-access` | Waitlist form → name, phone, email → saves to `onboarding_requests` → team reaches out on WhatsApp |
| **About Us** | Menu footer | `/about` | Brand story + "Apply for Merchant Access" CTA |
| **Contact** | Platform nav | `/contact` | WhatsApp support link + email + physical node locations |

> [!NOTE]
> All 3 alternative paths are accessible from the **Menu footer** — visible to every customer at the bottom of the shop menu page. They are passive paths — the customer must scroll to the footer to find them.

---

## State Transitions (Order Lifecycle)

```
pending → pending_payment → paid → preparing → ready → completed
                                                      ↘ delivered
       ↘ requires_edit (customer edits) ──────────────↗
       ↘ rejected → edit flow
       ↘ archived / cancelled
```

---

## Customer Data Captured

| Data | When | Where Stored |
|---|---|---|
| Name | Checkout modal | `orders.customer_name` + localStorage |
| Phone | Checkout modal (Basic+ only) | `orders.customer_phone` + localStorage |
| Email | Checkout modal | `orders.customer_email` |
| Order history | After first checkout | localStorage + `orders` table |
| Rating | Post-completion | `order_ratings` table |
| Privacy consent | First scan | localStorage |
