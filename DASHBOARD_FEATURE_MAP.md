# 🗺️ qRshop Dashboard Feature Map & Streamlining Ledger

This document serves as the interactive ledger for all features and cards accessible on the **Shop Owner's Dashboard** (`src/pages/Dashboard.jsx`). It is ordered **from least complex (Rank 1) to most complex (Rank 19)**.

Under each feature, we have provided a dedicated **💬 Comments & Streamlining Notes** section. You can type your feedback, issues, or instructions directly into this file as we pair-program to clean up the workspace!

---

## 🛠️ Feature Ledger & Commentary Space

### Rank 1: ✨ Sales Magazine [DEPRECATED / IN PROGRESS]
*   **Path/Route:** Link out to `/s/:slug/magazine` (Pulled down)
*   **DB Tables:** None (pure client-side view)
*   **Capabilities:** Full-bleed, scrollable dark-mode catalog of published inventory.
*   **Complexity Drivers:** Zero state dependency.
*   **💬 Comments & Streamlining Notes:** 
    *   *DEPRECATED & PULLED DOWN INTO `src/features-in-progress/` on May 29, 2026.* 
    *   THE sales magazine is not showing any items desoite having tried to create the magazine pages. additionally it breaks the whole system by completely exiting out of the whole system. it forces users to restart using the system through login. bug here. initially i wanted to have it expose a readable content for user and could be accessible from teh shops webpage as the shops special catalog with better product description uses and all things a product that couldnt be captured in the usual menu cards. currently, it forces a user to either completely exit the dashboard. and its card is not on the shops webpage. id like to have it there. at first let it have the shops general details that the public can view. shop name, logo, phone number, social media handles, and operating hours. that's it. simple. no complex configurations.* 

---

### Rank 2: ⚙️ Settings
*   **Path/Route:** `/a/settings`
*   **DB Tables:** `shops` (read/write)
*   **Capabilities:** Update storefront logo, name, phone, password, and operation hours.
*   **Complexity Drivers:** Basic form validations and standard single-row updates.
*   **💬 Comments & Streamlining Notes:** 
    *   *take shops contact details and display them on the footer at the webpage. currently ithe phone number at the bottom of the webpage in some shops isnt showing the correct phone number. its showing the generic 12345678 phone number which is incorrect.
    ther is no showing a shops payment details for the customer to pay. it also picks a number from the db, it should explicitly ask how to be paid, a till, phone number, a paybill,for c2b, and for b2b it should also take the payment details. * 

---

### Rank 3: 💳 Subscription
*   **Path/Route:** `/plans`
*   **DB Tables:** `subscriptions`
*   **Capabilities:** View current plan limits, billing dates, and payment options.
*   **Complexity Drivers:** Simple status reads; offloads actual checkout to stripe/external providers.
*   **💬 Comments & Streamlining Notes:** 
    *   *subscription should check and validate subscriptoion if expired show user the platforms payment details to renew their subscription. a payment that should come directly from the shhop owner to the platform using the shops registered payment details. it should also take into account the shops plan when showig the options for renewal.should also ask to renew prior to expiry* 

---

### Rank 4: 🏷️ Attribute Manager
*   **Path/Route:** `/a/attributes`
*   **DB Tables:** `product_attributes`
*   **Capabilities:** Create category-wide options like sizes, materials, weights, or dimensions.
*   **Complexity Drivers:** Basic CRUD list. Pure relational records that apply down to single items.
*   **💬 Comments & Streamlining Notes:** 
    *   this was meant to enable configuration of products attributes into the json b column to prevent bloating the products database. however, none of the shops defined attributes appear anywhere. the attributes should also be locked to a shops instance. there are no instances of them being used. this should be found a way to use them in the product manager, i need to see its applicability. * 

---

### Rank 5: 🎨 Store Appearance
*   **Path/Route:** `/a/appearance`
*   **DB Tables:** `shop_appearances`
*   **Capabilities:** Dynamic hex colors, font loader (Outfit, Inter, Playfair), layout builder.
*   **Complexity Drivers:** Saves client JSON structures. Needs smooth theme application on public frontends.
*   **💬 Comments & Streamlining Notes:** 
    *   *good and works well* 

---

### Rank 6: 📸 Bulk Image Mapper
*   **Path/Route:** `/a/bulk-image-mapper`
*   **DB Tables:** `menu_items`
*   **Capabilities:** Batch upload product images and auto-map them to SKU matching filenames.
*   **Complexity Drivers:** Files reader, memory handling during multi-image parsing.
*   **💬 Comments & Streamlining Notes:** 
    *   good and works well. however id like to see or explore a way that allows user to map same imaeg to several products. for example when uploading a photo of almonds, we have 3 almond categories, how do i ensure that all these three products have the same almond product image? currently, it only picks one product. * 

---

### Rank 7: 📱 QR Manager
*   **Path/Route:** `/a/qrs`
*   **DB Tables:** `qrs`, `tables`
*   **Capabilities:** Generate, download, and toggle scannable codes for physical tables/zones.
*   **Complexity Drivers:** Relies on a client QR generator lib. Maps location context and redirect paths.
*   **💬 Comments & Streamlining Notes:** 
    *   works well , except the scan count is still stuck to zero, it should increment when scanned. this is a bug i think. also the settings here is white screening, there is no visible settings to show, i have no idea what could be the issue. * 

---

### Rank 8: 📋 Product Manager
*   **Path/Route:** `/a/products`
*   **DB Tables:** `menu_items`, `categories`
*   **Capabilities:** Main stock CRUD: prices, titles, images, search tags, availability flags.
*   **Complexity Drivers:** Intersects with custom attributes, category trees, and upload assets.
*   **💬 Comments & Streamlining Notes:** 
    *   good works mostly well however, the marketing ai copy says it will autogenerate but it still stays blanks and wehn i type in i dont see where the data goes. the ai search and metadata should also populate the products features that should also go to the catalog, sales magazine. i dont know where they go to.
    the product structure blue print that should take what the attribute manager created is only having one option for selecting template blue print, the generic one. other attributes created arent visible.
    the custom shop attrinbutes is not picking the other predefined attributes. so how do they get filled?
    when adding a product i should be able to create variations of the product withing the same product add menu, then the different ariations can then be created and mapped withtheir own unique product ids* 

---

### Rank 9: 🎁 Bundles & Promos [DEPRECATED / IN PROGRESS]
*   **Path/Route:** `/a/marketing?tab=promos` (Pulled down)
*   **DB Tables:** `promo_codes`, `bundles`
*   **Capabilities:** Combo meal discounts, flat/percent promo codes, date expirations.
*   **Complexity Drivers:** Requires price calculations, coupon validity checks, and checkout guards.
*   **💬 Comments & Streamlining Notes:** 
    *   *DEPRECATED & PULLED DOWN INTO `src/features-in-progress/` on May 29, 2026.* 
    *   i noticed a big bug witht htis one. the items inside a bundle still appear standalone inthe check out. which is incorrect. the bundle should bundle the items and check them out as a single item (with an array of items in it)using the bundle price as the single item's price.however its messing up the whole cart checkout. it reduced a 10000 bob cart to the bundles price. which is very incorrect and inconsistent. while we work on it can we pull it down for the shops? maybe after we figure this out?* 

---

### Rank 10: 📈 Analytics / Charts
*   **Path/Route:** `#analytics` (in Dashboard)
*   **DB Tables:** `analytics_orders`, `visits`
*   **Capabilities:** Charts showing orders per day, popular items, and historical trends.
*   **Complexity Drivers:** Pro-tier locked. Requires date filters (BST) and aggregated DB statistics.
*   **💬 Comments & Streamlining Notes:** 
    *   they are not updating anything its all stuck at zero* 

---

### Rank 11: 🎨 Marketing Studio
*   **Path/Route:** `/a/marketing`
*   **DB Tables:** `promo_codes`
*   **Capabilities:** Auto-generate beautiful ads and promo graphics with custom QR overlays.
*   **Complexity Drivers:** Heavy client-side HTML-to-Canvas rendering and graphic downloads.
*   **💬 Comments & Streamlining Notes:** 
    *   all good but since we have a standalone store appearance card can we remove store appearance from under here? let store appearnce be handled by its card * 

---

### Rank 12: 🎯 Campaigns
*   **Path/Route:** `/a/campaigns`
*   **DB Tables:** `campaigns`, `visits`
*   **Capabilities:** Design physical scan-and-win events and time-limited merchant rewards.
*   **Complexity Drivers:** State expiration checks, conversion maps, and live visit count checks.
*   **💬 Comments & Streamlining Notes:** 
    *   *can stay here for now* 

---

### Rank 13: 💰 Accounting Hub
*   **Path/Route:** `/a/finances`
*   **DB Tables:** `orders`, `shop_finances`
*   **Capabilities:** View gross profits, operational cost breakdowns, and payouts records.
*   **Complexity Drivers:** Heavy sum aggregation queries, fee deduction logic, and payout status maps.
*   **💬 Comments & Streamlining Notes:** 
    *   *the rest of the app is in lightmode however this operates in dark mode. why? * 

---

### Rank 14: 📦 Distribution Connect
*   **Path/Route:** `/a/connect-distribution`
*   **DB Tables:** `wholesalers`, `stock_orders`
*   **Capabilities:** Discover vetted distributors and purchase ingredients or stock in bulk.
*   **Complexity Drivers:** B2B catalog queries, separate purchase order creation.
*   **💬 Comments & Streamlining Notes:** 
    *   *Add your notes or click-to-hide instructions here:* 

---

### Rank 15: 🤝 Partnership Gateway
*   **Path/Route:** `/join/distribution`
*   **DB Tables:** `onboarding_requests`
*   **Capabilities:** Wholesaler sign-up, verification, onboarding form submission.
*   **Complexity Drivers:** Requires multi-state review and approval logic by Regional Agents.
*   **💬 Comments & Streamlining Notes:** 
    *   *Add your notes or click-to-hide instructions here:* 

---

### Rank 16: 🚚 Supply Management
*   **Path/Route:** `/a/supply-mgmt`
*   **DB Tables:** `wholesale_products`
*   **Capabilities:** List bulk wholesale goods for other shops to purchase.
*   **Complexity Drivers:** B2B stock tracking, wholesale tiered price levels mapping.
*   **💬 Comments & Streamlining Notes:** 
    *   *Add your notes or click-to-hide instructions here:* 

---

### Rank 17: 🧠 Shop Brain
*   **Path/Route:** `/a/ai-brain`
*   **DB Tables:** `ai_configs`, `telemetry`
*   **Capabilities:** Personality trainers, playbooks, context boundaries, chat credits pool.
*   **Complexity Drivers:** Fuses neural AI endpoints, context-injection, and real-time chat billing.
*   **💬 Comments & Streamlining Notes:** 
    *   *this one shoiuld connect all ai uses for the shop owner. allowing them to query, analyze and generate content for their shops based on available analytics and product data. it should be the central hub for all ai related activities. right now its not clear how it connects to other ai features. and this should be the very place the shop owner interacts with the ai. not the product manager or store appearance etc. they should just provide raw data to this hub and the hub should use it to generate the content for the other features.
    its top up credit buttons is going to shop profile section instead of the top up modal. also the prompt and context management should allow selection of which context to use for each generation.. i should be able to select which one to use or a custom one. so i should be able to pull from the database, the store's profile, the products in the store, sales pages, marketing and the rest. it should all be pulled from the database using the shop id. and the context for the ai should include things like brand voice, tones, but the sales agent isnt aware of the sales playbook, shop background, ai personality and tones, it should be able to pull from the database and use the information available* the credit ledger also doent show the interactions that the sales agent has. so it is blind to sales agents activities. there should a be a sysnc, communication between them. *

---

### Rank 18: 🚚 Delivery Hub
*   **Path/Route:** `/a/delivery`
*   **DB Tables:** `deliveries`, `riders`
*   **Capabilities:** Route optimizations, rider mapping, dispatch controls, escrow release triggers.
*   **Complexity Drivers:** Relies on multi-user roles (riders, hub managers) and live delivery coordination.
*   **💬 Comments & Streamlining Notes:** 
    *   we can add this to the shops dashboard. where if they have an item that requests delivery they come here and put a request for item to be picked from their shop for delivery, or for drop off at a ceratin specified point. as well as what it costs them the charges to use this service:* 

---

### Rank 19: 🛎️ Live Orders Manager
*   **Path/Route:** `/a/orders`
*   **DB Tables:** `orders`, `order_items`
*   **Capabilities:** Kitchen command: accept order, billing, confirmations, revisions, RLS controls.
*   **Complexity Drivers:** Multi-stage transactions, real-time channels, auto-expiration, BST indices.
*   **💬 Comments & Streamlining Notes:** 
    *   *Add your notes or click-to-hide instructions here:* 
