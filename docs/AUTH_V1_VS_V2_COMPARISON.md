# Side-by-Side Comparison: Auth V1 vs. Auth V2

This document contrasts the legacy authentication architecture (V1) with the new scalable rebuild (V2) currently on the `v2/scalable-rebuild` branch.

---

## 📊 1. Database Schema

| Feature | Legacy (V1) | Scalable Rebuild (V2) | Why V2 is Better |
| :--- | :--- | :--- | :--- |
| **Logic Model** | "God Table" (Fragmented) | **3-Layer Identity** | Deep separation of concerns. |
| **User Data** | Stored in `shop_users` | Stored in **`profiles`** | One profile per human, regardless of how many shops they own. |
| **Membership** | 1:1 Relationship | **Many-to-Many** (`shop_members`) | Allows one person to be an owner of Shop A and staff at Shop B. |
| **Auth Source** | Supabase Auth + Manual Insert | **Direct Trigger Sync** | No more "missing profile" bugs; profiles are created automatically by the database. |
| **Redundancy** | Email stored in 3+ places | Email stored only in `auth.users` | Eliminates data synchronization errors. |

---

## ⚙️ 2. Core Authentication Logic

### **Legacy (V1) Logic**
```javascript
// Fragile JOIN that fails if the profile is missing
const { data } = await supabase
  .from("shop_users")
  .select("*, shops(*)")
  .eq("id", user.id);
```
*   **Risk:** If a merchant deletes a row from `shop_users`, the user is "locked out" even if their password is correct.

### **Scalable Rebuild (V2) Logic**
```javascript
// Resilient & Modular
const [profile, memberships] = await Promise.all([
  getProfile(user.id),
  getShopMemberships(user.id)
]);
```
*   **Benefit:** Even if they don't belong to a shop yet, they can still log in and see a "Create/Join Shop" screen. No more "Access Denied" loops.

---

## 🚀 3. Features & Scalability

| Capability | Legacy (V1) | Scalable Rebuild (V2) |
| :--- | :--- | :--- |
| **Multi-Shop Owners** | ❌ Hard (Requires separate emails) | ✅ Easy (One login, pick your shop) |
| **Staff Accounts** | ⚠️ Fragile (Shared logic) | ✅ Robust (Granular roles per shop) |
| **Platform Admins** | Mixed with Shop Owners | Dedicated `system_role` field |
| **Scale Limit** | High friction at 100+ shops | Built to handle 10,000+ shops |

---

## 🏆 Verdict
The **V2 Rebuild** converts the platform from a "Single-Shop Manager" into a true **SaaS Platform** like Shopify or Square. It is the necessary foundation for the 13-week SAD roadmap.
