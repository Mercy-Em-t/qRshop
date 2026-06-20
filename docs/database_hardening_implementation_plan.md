# Implementation Plan - Database Performance, Security Hardening & Costs Optimization

This document outlines the systematic engineering steps to implement database indexes, optimized cached RLS helper functions, decoupled serverless payment handlers, and robust client-side storage feedback mechanisms.

---

## 1. Database Performance & Indexing Layer
Improve query times for menu loads and member access checks by adding targeted indexes.

### [NEW] [20260523000002_add_performance_indexes.sql](file:///c:/Users/LIZBETH/Desktop/TMSREPO%20CLONE/supabase/migrations/20260523000002_add_performance_indexes.sql)
- Implement `b-tree` indexes on high-frequency reference columns to prevent full-table sequential scans:
  ```sql
  CREATE INDEX IF NOT EXISTS idx_shop_members_user_id ON public.shop_members(user_id);
  CREATE INDEX IF NOT EXISTS idx_menu_items_shop_id ON public.menu_items(shop_id);
  ```

---

## 2. RLS Performance Hardening (Cached Functions)
Replace expensive subqueries inside storage and table policies with session-cached Postgres functions.

### [NEW] [20260523000003_harden_rls_caching.sql](file:///c:/Users/LIZBETH/Desktop/TMSREPO%20CLONE/supabase/migrations/20260523000003_harden_rls_caching.sql)
- Deploy security definer functions to look up memberships once per Postgres transaction:
  ```sql
  CREATE OR REPLACE FUNCTION public.check_user_is_shop_member(target_shop_id uuid)
  RETURNS boolean SECURITY DEFINER AS $$
    SELECT EXISTS (
      SELECT 1 FROM public.shop_members 
      WHERE user_id = auth.uid() AND shop_id = target_shop_id AND is_active = true
    );
  $$ LANGUAGE sql STABLE;
  ```
- Re-bind `storage.objects` and `public.shops` policies to utilize the new optimized checking logic.

---

## 3. Client-Side Upload Error Feedback
Provide clear, actionable notifications to merchants when files are blocked due to storage policies, size, or network issues.

### [MODIFY] [Settings.jsx](file:///c:/Users/LIZBETH/Desktop/TMSREPO%20CLONE/src/pages/Settings.jsx)
- Update the silent `catch` block on logo uploads to display descriptive alert logs on settings screens.
  ```javascript
  try {
     // Upload logic
  } catch (err) {
     alert("Logo upload failed: " + err.message + ". Please ensure your image is under 2MB.");
  }
  ```

---

## 4. Webhook Decoupling & Storage Limits
Migrate Edge Functions to asynchronous executions and enforce free-tier storage boundaries.

### [MODIFY] [supabase/functions/mpesa-stk-push](file:///c:/Users/LIZBETH/Desktop/TMSREPO%20CLONE/supabase/functions/mpesa-stk-push)
- Update the edge function to immediately return HTTP `202 Accepted` back to the browser.
- Transition callback states asynchronously, updating the corresponding order payment status directly upon receiving verified callbacks from Safaricom's gateway.

---

## 5. Verification Plan

### Automated Tests
- Run `npm run build` locally using CMD wrapper to ensure zero client compile regressions.
- Execute SQL verification queries directly against a test Postgres instance to verify that RLS caching functions authorize authenticated shop users accurately.

### Manual Verification
- Upload large images to verify that size blocks are flagged visually.
- Verify that removing a logo sets the column to `null` and clears the asset cleanly on save.
