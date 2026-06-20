# Test Plan Outline

## 1. Test Strategy
Testing will focus on core user flows (QR scanning -> Menu -> Cart -> WhatsApp) and Dashboard functionality. Testing phases include:
- **Unit Testing**: Component level logic (Cart state management).
- **Integration Testing**: Database queries, RLS policies.
- **End-to-End (E2E) Testing**: Full browser automation using Playwright.
- **User Acceptance Testing (UAT)**: Manual testing by stakeholders.

## 2. Test Environments
- **Local/Development**: Local Vite server connected to local Supabase instance.
- **Staging**: Vercel preview deployments connected to a staging database schema.
- **Production**: Live Vercel deployment and live Supabase database.

## 3. Scope
- **In Scope**: Session creation, menu rendering, cart calculations, upsell triggers, WhatsApp link formatting, shop dashboard CRUD operations.
- **Out of Scope**: WhatsApp message delivery guarantees (handled by WhatsApp itself), device hardware capabilities (camera QR scanning).\n