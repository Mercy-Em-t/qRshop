# qRshop

QR-based onsite ordering platform for restaurants, cafés, sports venues, and kiosks. Customers scan a QR code at the venue to access a digital menu and place an order sent via WhatsApp.

## Tech Stack

- **Frontend:** React, Vite, TailwindCSS
- **Backend:** Supabase
QR-based ordering platform for restaurants, cafés, sports venues, and kiosks. Customers scan a QR code at their table to browse the menu, add items to cart, and send orders via WhatsApp.

## Tech Stack

- **Frontend:** React + Vite + TailwindCSS
- **Backend:** Supabase (PostgreSQL)
- **Deployment:** Vercel
- **Communication:** WhatsApp Deep Links

## Getting Started

```bash
npm install
cp .env.example .env
# Edit .env with your Supabase credentials
npm run dev
```

## Environment Variables

| Variable | Description |
|---|---|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key |
1. Install dependencies:

```bash
npm install
```

2. Copy the environment template and configure Supabase:

```bash
cp .env.example .env
```

Fill in your `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in the `.env` file.

3. Start the development server:

```bash
npm run dev
```

4. Build for production:

```bash
npm run build
```

## Project Structure

```
src/
├── components/   # Reusable UI components
├── pages/        # Route pages
├── services/     # Supabase API services
├── utils/        # Utility functions
└── hooks/        # Custom React hooks
```

See [ARCHITECTURE.md](./ARCHITECTURE.md) for full details.
├── components/    # Reusable React components
├── pages/         # Page components (routes)
├── services/      # Supabase client and data services
├── utils/         # Utility functions
└── hooks/         # Custom React hooks
```

## Routes

### Customer
- `/enter?shop=SHOP_ID&table=TABLE_NUMBER` — QR entry point (server-side validation)
- `/menu` — Browse menu (requires QR session, offline caching)
- `/cart` — View and manage cart (persisted across reloads)
- `/order` — Order confirmation and WhatsApp send (DB-tracked)

### Shop Owner
- `/login` — Shop owner login
- `/dashboard` — Shop management dashboard with analytics
- `/menu-manager` — Menu CRUD
- `/qr-generator` — QR code generator for tables
- `/plans` — Subscription plan management

### Admin
- `/admin` — Admin panel
- `/admin/shops` — Shop management
- `/admin/plans` — Plan configuration

## V2 Features

- **Server-side QR validation** with device tracking and session expiry
- **Optional geolocation check** to verify customer is at the venue
- **Analytics dashboard** with orders per day, popular items, and upsell conversion rates
- **Offline menu caching** using localStorage for resilience
- **Cart persistence** across page reloads and network drops
- **Subscription plans** with free and paid tiers
- **Payment integration** scaffold for M-Pesa and card payments
- **Order tracking** — all orders registered in DB before WhatsApp generation
