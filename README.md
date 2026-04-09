# qRshop (V3 Commerce OS)

qRshop is a multi-tenant, lightweight digital commerce operating system designed for restaurants, cafés, sports venues, and kiosks. By combining dynamic QR codes, automated M-Pesa payments, and WhatsApp Cloud APIs, it bridges the gap between physical storefronts and digital fulfillment without requiring customers to download an app.

## 🚀 The V3 Architecture Showcase
The platform has evolved from a basic static menu viewer into a secure, tiered, Multi-Tenant SaaS.

### Core Capabilities
*   **Dynamic QR Engine:** Physical codes that execute time-based routing (`opens_at`/`closes_at`), conditionally locking access during off-hours or defaulting to specific promotional filtering.
*   **Smart Links & Auto-Cart:** Generate single-click "Ad Links" and "Bundle Deals" that automatically load the frontend, populate the user's cart, and jump straight to the checkout gate.
*   **Secure Atomic Checkout (RPC):** A Postgres-backed server-side pricing engine. Cart totals are verified against the truth table, and inventory is mathematically deducted in a single unbreakable transaction, blocking client-side tampering.
*   **M-Pesa Daraja Integration:** Built-in STK Push pipeline. Automatically deducts the platform commission and standard delivery fees before channeling the remaining balance functionally to the shop owner.
*   **WhatsApp Cloud API:** Edge Functions deliver Interactive Checkout Cards directly to the shop operator’s WhatsApp, fully bypassing manual `wa.me` links for premium tiers.
*   **Multi-Tier SaaS Gating:** A 4-tier model (Free, Basic, Pro, Business) enforced at both the React Router layer and the Database RLS layer.
*   **God-Mode System Administration:** A master dashboard offering total visibility into platform economics, 3rd-party API costs, global product graphs, and an automated threat-model scanner.
*   **Last-Mile Logistics Hub:** Integrated regional distribution nodes and rider fleet management with multi-order batching logic.
*   **Global Search Engine:** Postgres GIN-indexed Full-Text Search (FTS) for O(log n) product discovery across all shop tenants.

## 🛠 Tech Stack

*   **Frontend Ecosystem:** React 19, Vite 8, Tailwind CSS v4, React Router DOM v7, HTML2Canvas (for Smart Receipts).
*   **Backend & Database:** Supabase (PostgreSQL 15), Supabase Native Auth, Row Level Security (RLS).
*   **Serverless Execution:** Deno-based Supabase Edge Functions (`whatsapp-dispatch`, `whatsapp-webhook`, `mpesa-stk-push`, `mpesa-webhook`).
*   **Cloud Hosting:** Vercel (Edge Network).

## 🗄️ Database & Security Constraints

This platform relies heavily on **Supabase Row Level Security (RLS)** to enforce tenant boundaries (`shop_id`). Furthermore, critical operations execute via Postgres constraints and RPCs:
*   `checkout_cart` RPC guarantees untampered pricing.
*   `CHECK (quantity > 0)` and `CHECK (price >= 0)` guarantee data integrity.

To deploy or update schemas, use the `.sql` scripts located in the project's tracking artifacts or the Supabase SQL Editor.

## ⚙️ Developer Quickstart

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Environment Variables:**
   Copy the template and fill in your Supabase credentials.
   ```bash
   cp .env.example .env.local
   ```
   **Required variables:**
   *   `VITE_SUPABASE_URL`
   *   `VITE_SUPABASE_ANON_KEY`
   *   `VITE_GATEWAY_URL` (For generating formatted QR payloads, e.g. `http://localhost:5173`)

3. **Run quality checks and start the app:**
   ```bash
   npm run lint
   npm run test
   npm run build
   npm run dev
   ```

## 🔐 Server Runtime Environment (Required)

For serverless handlers in `api/` and Supabase functions, configure these secure server variables (not client `VITE_*` values):

* `SUPABASE_URL`
* `SUPABASE_SERVICE_ROLE_KEY`
* `DARAJA_CONSUMER_KEY`
* `DARAJA_CONSUMER_SECRET`
* `DARAJA_PASSKEY`
* `DARAJA_SHORTCODE`
* `WA_VERIFY_TOKEN`

Optional:
* `GATEWAY_URL`
* `SYSTEM_B_URL`
* `SYSTEM_B_API_KEY`

## 🧭 Runtime Architecture Boundaries

* `src/`: Client UX, routing, offline behavior, and shop/admin screens.
* `api/`: Vercel serverless APIs for secure admin operations and integration routing.
* `supabase/functions/`: Edge functions for payment and WhatsApp webhooks/dispatch.
* `supabase/*.sql`: Schema and operational SQL artifacts (recommended to run through an ordered migration process).

## 🚨 Incident Playbooks

* **Failed M-Pesa Callback:** verify webhook secret, inspect `payment_audit_log`, confirm `SUPABASE_SERVICE_ROLE_KEY`.
* **Failed Gateway Sync:** inspect `gateway_logs` and verify `SYSTEM_B_URL`/`SYSTEM_B_API_KEY`.
* **WhatsApp Webhook Rejects:** confirm `WA_VERIFY_TOKEN`, `WA_PHONE_NUMBER_ID`, and `WA_ACCESS_TOKEN`.

## 🌩️ Deploying Edge Functions

The platform relies on Supabase Edge functions for critical 3rd-party APIs. You must install the [Supabase CLI](https://supabase.com/docs/guides/cli) to deploy these.

```bash
# Login to your Supabase account
supabase login

# Deploy the WhatsApp routing function
supabase functions deploy whatsapp-dispatch --project-ref YOUR_PROJECT_REF

# Deploy the M-Pesa STK push trigger
supabase functions deploy mpesa-stk-push --project-ref YOUR_PROJECT_REF

# Note: You must bind secret environment variables (like API keys) via the Supabase Dashboard.
```

## 🔒 Security Operations
If you are taking over the repository, check the `AdminReport.jsx` file. The "Threat Model & Anti-Sabotage" tab explicitly documents the platform's defense vectors against cart-tampering, negative quantity injections, and Denial of Service spam. 

## 📜 License
Private & Proprietary. All rights reserved.
