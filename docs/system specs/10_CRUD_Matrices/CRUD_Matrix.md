# CRUD Matrix

This matrix maps System Actors to data entities, identifying Create (C), Read (R), Update (U), and Delete (D) permissions.

| Entity | Customer | Shop Owner | System Admin |
|---|---|---|---|
| **Shops** | R | R, U | C, R, U, D |
| **Tables / QRs** | R | C, R, U, D | R |
| **Menu Items** | R | C, R, U, D | R |
| **Upsell Links** | R | C, R, U, D | R |
| **Orders** | C, R | R, U | R |
| **Subscriptions**| - | R | C, R, U, D |

*Note*: Customer order creation is handled locally in the cart and finalized via WhatsApp. Server-side tracking (Analytics_Orders) is automatically inserted (C) by the system on behalf of the customer.\n