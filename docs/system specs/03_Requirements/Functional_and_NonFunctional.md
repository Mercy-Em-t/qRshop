# Requirements Specification

## 1. Functional Requirements (FR)

### Customer Module
- **FR-C01**: The system shall allow customers to scan a table-specific QR code to access the menu.
- **FR-C02**: The system shall create a temporary session upon successful QR scan.
- **FR-C03**: The system shall display menu items categorized logically.
- **FR-C04**: The system shall allow customers to add items to a cart, modify quantities, and remove items.
- **FR-C05**: The system shall prompt the customer with upsell suggestions when specific items are added to the cart.
- **FR-C06**: The system shall generate a formatted WhatsApp message containing the order details and redirect the customer to WhatsApp.

### Shop Owner Module
- **FR-S01**: The system shall provide a dashboard for shop owners to manage menu items (Create, Read, Update, Delete).
- **FR-S02**: The system shall allow shop owners to configure upsell relationships between items.
- **FR-S03**: The system shall allow shop owners to generate downloadable QR codes for their tables.
- **FR-S04**: The system shall allow shop owners to configure the WhatsApp number where orders will be received.

### Admin Module
- **FR-A01**: The system shall allow administrators to create and manage shop accounts.
- **FR-A02**: The system shall allow administrators to manage subscription plans (Free vs. Paid).

## 2. Non-Functional Requirements (NFR)

- **NFR-P01 (Performance)**: The menu page must load in under 2 seconds.
- **NFR-S01 (Security)**: Menu access must be restricted to users with a valid QR session (sessionStorage.qrAccess == true).
- **NFR-S02 (Security)**: QR sessions must expire after 30 minutes of inactivity.
- **NFR-R01 (Reliability)**: The system shall be hosted on a high-availability infrastructure (e.g., Vercel, Supabase) to ensure 99.9% uptime.
- **NFR-U01 (Usability)**: The customer interface must be fully responsive and optimized for mobile devices.\n