# The World of the Product Entity

In The Modern Savannah platform, the "Product" is formally known as the **`menu_items`** entity in the database. It is the central piece of data that ties together the consumer experience, the shop owner's catalog, and the platform's analytical and marketing engines.

Below is an extensive breakdown of everything that entails a product.

---

## 1. Database Schema & Attributes

The `menu_items` table is highly denormalized and feature-rich. Over several migrations (most notably the `20260424000000_extend_product_attributes.sql` and `20260425000001_standardize_menu_columns.sql`), it has grown to support complex e-commerce, wholesale, and marketing needs.

### Core Identity & Pricing
- **`id`** *(UUID)*: Unique identifier.
- **`shop_id`** *(UUID)*: The shop this product belongs to.
- **`name`** *(TEXT)*: The product's display name.
- **`description`** *(TEXT)*: A standard summary of the product.
- **`price`** *(NUMERIC/DECIMAL)*: Base consumer price.
- **`bulk_pricing`** *(JSONB)*: Tiered pricing structures for B2B/wholesale customers.
- **`sku`** *(TEXT)*: Stock Keeping Unit identifier.
- **`product_link`** *(TEXT)*: External or direct slug for the product.

### Organization & Discovery
- **`category`** *(TEXT)*: Main categorization (e.g., "Main Course", "Handbags").
- **`subcategory`** *(TEXT)*: Granular categorization.
- **`brand`** *(TEXT)*: The manufacturer or brand.
- **`diet_tags`** *(TEXT[])*: Array of dietary classifications (e.g., `["Vegan", "Gluten-Free"]`).

### Physical Attributes & Specs
- **`size`** *(TEXT)*: Dimensions or apparel size.
- **`packaging`** *(TEXT)*: Type of packaging used.
- **`origin`** *(TEXT)*: Sourcing location (e.g., "Locally Sourced", "Imported").
- **`processing`** *(TEXT)*: How it was made (e.g., "Organic Process").
- **`nutrition_info`** *(TEXT)*: Nutritional breakdown.

### Inventory & Fulfillment
- **`is_active`** *(BOOLEAN)*: Determines if it is visible to customers.
- **`stock`** *(INTEGER)*: Current inventory count (`-1` typically implies infinite stock).
- **`reorder_level`** *(INTEGER)*: Threshold for low-stock alerts.
- **`expiry_date`** *(TIMESTAMPTZ)*: For perishables.
- **`delivery_info`** *(TEXT)*: Specific shipping or handling constraints.

### Marketing & Customer Experience
- **`image_url`** *(TEXT)*: Primary thumbnail.
- **`video_url`** *(TEXT)*: Demo or showcase video.
- **`benefits`** *(TEXT)*: Value proposition for the customer.
- **`usage_instructions`** *(TEXT)*: How to use or care for the item.
- **`recipe`** *(TEXT)*: Recipe suggestions (for food/ingredients).
- **`promo_info`** *(TEXT)*: Active promotional text.
- **`rating`** *(NUMERIC)*: Cached aggregate customer rating.

---

## 2. Relational Ecosystem

The product does not live in isolation. It acts as the hub for several other tables in the Supabase database.

> [!NOTE]
> **Product Images (`product_images`)**
> A one-to-many relationship allowing a product to have an image carousel. It stores `url` and `position` for sorting.

> [!TIP]
> **Sales Pages (`product_sales_pages`)**
> A one-to-one relationship. This stores auto-generated, high-converting copy (headlines, sales scripts, PDF brochures) used in the Sales Magazine and Product Detail pages.

> [!IMPORTANT]
> **Upsell Engine (`upsell_items`)**
> A many-to-many relationship. When a product (`item_id`) is added to the cart, the system fetches linked products (`upsell_id_fkey`) to prompt the user (e.g., "Would you like fries with that?").

> [!WARNING]
> **Order Items (`order_items`)**
> A one-to-many historical relationship. Products are linked to orders. Modifying a product's base details shouldn't break historical order receipts, as `order_items` usually snapshots the price and quantity at checkout time.

> [!CAUTION]
> **Promotions / Bundles (`promotion_items`)**
> Products are linked to campaigns. If a product is deleted, cascading rules or application logic must ensure bundles don't break.

---

## 3. Core Functional Objects (Services)

The `menu-service.js` and `analytics-service.js` provide the primary data retrieval functions for the frontend:

- **`getMenuItems(shopId)`**: Fetches all active products for a shop, intelligently fetching the `product_images` relationship simultaneously. Features a fallback mechanism if the complex join fails.
- **`getMenuItemsByCategory(shopId)`**: A wrapper that groups the flat product list into an object keyed by `category`. This powers the QR Menu scroller.
- **`getMenuItemById(itemId)`**: Retrieves a single product with full image galleries for the Product Details page.
- **`getRelatedItems(shopId, category, excludeId)`**: Recommends similar items from the same category.
- **`getUpsellItems(itemId)`**: Powers the cart's post-add modal.
- **`getPopularItems(shopId)`**: Analyzes `order_items` to rank the most frequently purchased products for the Dashboard.

---

## 4. Primary Use Cases & UI touchpoints

1. **The Consumer Menu (`Menu.jsx`)**
   - Products are mapped into `MenuItem.jsx` cards.
   - Categorized, filtered, and presented elegantly.
   - Clicking "Add" triggers the Upsell Modal based on relations.

2. **The Detail View (`ProductDetails.jsx`)**
   - Explodes the product into a full-screen immersive view.
   - Uses the extended attributes (`benefits`, `usage_instructions`, `diet_tags`, `video_url`).

3. **The Sales Magazine (`SalesMagazine.jsx`)**
   - Joins `menu_items` with `product_sales_pages`.
   - Creates a highly visual, swipeable catalog with professional sales copy intended for high-ticket or wholesale items.

4. **Product Management (`ProductManager.jsx`)**
   - The shop owner's interface to CRUD (Create, Read, Update, Delete) products.
   - Interfaces with the **Attribute Manager** to dynamically show/hide input fields based on the `custom_attributes_schema` stored on the shop.

5. **Wholesale & B2B (`BulkImageMapper.jsx` / `SupplierPortal.jsx`)**
   - Allows rapid creation of products via image uploads.
   - Utilizes the `bulk_pricing` JSONB field to offer tiered discounts to verified wholesale buyers.

6. **Order Fulfillment (`OrderManager.jsx` & `CartPage.jsx`)**
   - Transmutes a generic product into an `order_item` with a specific `quantity` and snapshot `price`.

---

### Summary of the "Product World"

The Product Entity acts as a chameleon. 
- To the **database**, it is a massive row holding 20+ columns ranging from stock logic to marketing copy. 
- To the **shop owner**, it is a flexible asset managed via the Dashboard and enhanced by AI Brains (which can write its sales copy). 
- To the **customer**, it is a visually appealing card on a QR menu or a full-page brochure in a Sales Magazine.
