# V2 Identity Migration — Current State Audit

> Assessed on `main` @ `ff02de0` — 2026-04-29

---

## ✅ What's DONE (V2 is in control here)

| Area | Status | Detail |
|---|---|---|
| **Database schema** | ✅ Done | `profiles` + `shop_members` tables exist, RLS policies set, trigger auto-creates profile on signup |
| **`auth-service.js`** | ✅ Done | `authenticateUser()` reads from `profiles` + `shop_members` — zero touch to `shop_users` |
| **`profile-service.js`** | ✅ Done | `getProfile()` → `profiles`, `getShopMemberships()` → `shop_members` |
| **`Login.jsx`** | ✅ Done | Routes on `system_role` (V2 field), handles `requiresSelection` for multi-shop |
| **`ShopSelection.jsx`** | ✅ Done | Uses `system_role` from V2 profile |
| **`Dashboard.jsx`** | ✅ Done | Gates on `system_role` and `user.role` (both V2 fields in session) |
| **`MaintenanceGate.jsx`** | ✅ Done | Uses `system_role` |
| **`OnboardingGate.jsx`** | ✅ Done | Uses `system_role` |
| **`usePlanAccess.js`** | ✅ Done | Uses `system_role` |
| **Session token shape** | ✅ Done | `{ id, email, display_name, role, system_role, shop_id, shop_name }` — all V2 fields |

---

## ⚠️ What's HALF-DONE (V1 still bleeding through)

| File | Problem |
|---|---|
| **`MultiShopNoticeboard.jsx`** | Fetches shop list from `shop_users` (L17). Should use `shop_members` via `getShopMemberships()` |
| **`AdminShops.jsx`** | Queries `shop_users(email, role)` in two places (L66, L102) for displaying shop owners. Not breaking but is reading V1 data |

---

## ❌ What's MISSING (not yet wired to V2)

| Area | Gap |
|---|---|
| **`Signup.jsx` / `signUpUser()`** | Calls `auth.signUp()` but the `profiles` row is created by a DB trigger. This should work — **but is the trigger verified live in production?** If it fails silently, new signups won't get a profile and login will break with "User profile missing." |
| **`SeedWholesaleUser.jsx`** | Inserts directly into `shop_users` (L46). Any wholesale user created this way won't have a `profiles` or `shop_members` row — they will fail login under V2. |
| **New operator provisioning flow** | There's no UI or service to create a new shop owner the V2 way (create `profiles` row + `shop_members` row). Right now, new merchants must be created manually in the DB or via the legacy seed scripts. |
| **`authenticateUser()` fallback** | If a user exists in `auth.users` + `shop_users` but NOT in `profiles`, they get blocked with "User profile missing". There's no automatic V1→V2 backfill on login. |

---

## 🎯 Concrete Next Steps (Priority Order)

### 1. 🔴 CRITICAL — Fix `SeedWholesaleUser.jsx`
Any wholesale user created today bypasses V2 entirely.  
Fix: After inserting into `shop_users`, also insert into `profiles` and `shop_members`.

### 2. 🔴 CRITICAL — Verify the `handle_new_user` trigger is live in production
If the auto-profile trigger is not deployed, every new signup via `Signup.jsx` will 
silently create an `auth.users` record with no `profiles` row, causing a login failure.

### 3. 🟠 HIGH — Fix `MultiShopNoticeboard.jsx`
Replace `shop_users` query with `getShopMemberships(userId)` from `profile-service.js`.
This is a simple swap — no schema changes needed.

### 4. 🟡 MEDIUM — Add a V1→V2 backfill guard in `authenticateUser()`
On login, if `profile` is null but user exists in `shop_users`, auto-create the 
`profiles` + `shop_members` rows from the V1 data instead of hard-blocking them.
This prevents legacy users from being locked out.

### 5. 🟡 MEDIUM — Clean up `AdminShops.jsx`
Switch from reading `shop_users(email, role)` to joining through `shop_members` 
for consistency. Low urgency — it's read-only display code, not auth logic.

### 6. 🟢 LOW — Build operator provisioning UI
A proper "Create New Shop Owner" form that writes to `auth.users` → `profiles` → 
`shop_members` → `shops`. Removes need for manual SQL provisioning scripts.

---

## Architecture Diagram (Current Reality)

```
LOGIN FLOW (✅ V2)
────────────────
auth.signInWithPassword()
  └─→ getProfile() [profiles table]
  └─→ getShopMemberships() [shop_members table]
  └─→ builds session { id, role, system_role, shop_id }

MULTI-SHOP DISPLAY (⚠️ V1)
───────────────────────────
MultiShopNoticeboard
  └─→ shop_users table ← STILL V1

WHOLESALE USER CREATE (❌ V1 only)
────────────────────────────────────
SeedWholesaleUser
  └─→ shop_users table (only)
  └─→ NO profiles row created
  └─→ NO shop_members row created
  └─→ RESULT: User will fail login
```
