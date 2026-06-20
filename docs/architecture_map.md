# System Architecture Map

Here is the visual mapping of the TMS/qRshop platform, starting from the root entry point down to the primitive branches, leaves (components/pages), and roots (data and services).

## Visual Tree

```mermaid
graph TD
    Root[index.html] --> Main[src/main.jsx]
    Main --> App[src/App.jsx]

    App --> Public[Public Branch]
    App --> Customer[Customer Branch]
    App --> Operator[Operator Branch]
    App --> Admin[Admin Branch]

    %% Public Branch
    Public --> Home[/Home.jsx]
    Public --> Login[/Login.jsx]
    Public --> Profile[/PublicShopProfile.jsx]

    %% Customer Branch
    Customer --> Guard1[QrAccessGuard]
    Guard1 --> Menu[/Menu.jsx]
    Guard1 --> Cart[/CartPage.jsx]
    Guard1 --> Order[/Order.jsx]
    Guard1 --> Track[/TrackOrder.jsx]

    %% Operator Branch
    Operator --> Guard2[AuthGate]
    Guard2 --> DashboardRoutes[DashboardRoutes.jsx]
    DashboardRoutes --> Dashboard[/Dashboard.jsx]
    DashboardRoutes --> Settings[/Settings.jsx]
    DashboardRoutes --> Agent[/AgentDashboard.jsx]

    %% Admin Branch
    Admin --> Guard3[AuthGate]
    Guard3 --> MasterAdmin[/MasterAdmin.jsx]

    %% Primitive Functions & State (The "Sap" of the tree)
    Menu -.-> CartHook((useCart))
    Cart -.-> CartHook
    Order -.-> OrderSvc((order-service.ts))
    Dashboard -.-> ShopHook((useShop))
    Settings -.-> BillingSvc((billing-service.js))

    %% Primitive Data (The "Soil" / Database)
    OrderSvc -.-> DB[(Supabase DB)]
    BillingSvc -.-> DB[(Supabase DB)]
    ShopHook -.-> DB[(Supabase DB)]
```

## Detailed Breakdown

### 1. The Root (Entry Point)
- **`index.html`**: The HTML file that the browser loads first. It contains the `<div id="root"></div>`.
- **`src/main.jsx`**: Bootstraps the React application, attaches it to the HTML root, and handles global chunk-loading error resilience.

### 2. The Trunk (Routing)
- **`src/App.jsx`**: The central nervous system. It decides which "branch" the user is sent down based on the URL (Routing) and global guards (Maintenance Mode, Auth Gates, QR Session Guards).

### 3. The Branches (Feature Areas)
- **Public Branch (`/`)**: Landing pages, pricing, signup, login, and public shop profiles. No authentication required.
- **Customer Branch (`/menu`, `/cart`, `/order`)**: Gated by `QrAccessGuard`. These are the ordering flows for customers who scanned a QR code.
- **Operator Branch (`/a/*`)**: Gated by `AuthGate`. This is the Shop Owner dashboard where they manage products, view AI stats, and top-up tokens.
- **Admin Branch (`/a/admin/*`)**: Hidden dashboards for you (the platform owner) to manage global systems, payout, and telemetry.

### 4. The Leaves (Components & Pages)
These are the UI elements the user actually interacts with.
- **Pages** (`src/pages/`): Full-screen views like `Menu.jsx`, `Settings.jsx`, or `AgentDashboard.jsx`.
- **Components** (`src/components/`): Reusable UI pieces like `AIAssistantCard.jsx`, `TokensBillingTab.jsx`, or `Cart.jsx`.

### 5. Primitive Functions (Hooks & Services)
These functions handle the logic, moving data between the UI leaves and the database soil.
- **Hooks (`src/hooks/`)**: Handle local React state. For example, `useCart.js` remembers what a customer added to their cart. `useShop.js` fetches and caches shop data.
- **Services (`src/services/`)**: Handle external communication.
  - `billing-service.js`: Talks to the database to request Okoa Jahazi.
  - `order-service.ts`: Pushes new orders to the database and pings the external delivery/gateway system.
  - `payment-service.js`: Handles M-Pesa STK Push API triggers.

### 6. Primitive Data (The Database & Edge)
At the very bottom of the system is the primitive source of truth.
- **Supabase PostgreSQL (`supabase/migrations/`)**: The physical tables holding the raw data (`shops`, `orders`, `token_transactions`, `menu_items`).
- **Edge Functions**: Cloud scripts like `sales-assistant` (AI logic) and `mpesa-stk-push` that run backend processes securely.
