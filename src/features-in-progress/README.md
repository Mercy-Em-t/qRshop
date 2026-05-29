# 🛠️ Features In Progress / Deprecated

This folder contains features that have been temporarily pulled down from active merchant production to streamline operations and resolve consistency issues before being fully re-introduced.

## Stashed Features

### 1. 🎁 Bundles & Promos (Rank 9)
- **Pulled Down on:** May 29, 2026
- **Reason:** Items inside a bundle were appearing standalone in checkout, causing inconsistent cart price calculations (reducing the entire cart to the bundle's price).
- **Actions Taken:**
  - Removed "🎁 Bundles & Promos" card from `src/pages/Dashboard.jsx`.
  - Removed "🎁 Bundles" mobile dropdown link from `src/pages/Dashboard.jsx`.
  - Removed "🏷️ Promo Bundles" tab from `src/pages/MarketingStudio.jsx`.

### 2. 📖 Sales Magazine (Rank 1)
- **Pulled Down on:** May 29, 2026
- **Reason:** Merchant and public catalogs was not fully satisfactory; requested to be pulled down to features-in-progress.
- **Actions Taken:**
  - Removed "✨ Sales Magazine" card from `src/pages/Dashboard.jsx`.
  - Removed "✨ Premium Catalog" CTA button from the storefront Hero (`src/components/shop/ShopHero.jsx`).
