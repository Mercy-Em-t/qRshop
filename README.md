# qRshop

QR-based ordering platform for restaurants, cafés, sports venues, and kiosks. Customers scan a QR code at their table to browse the menu, add items to cart, and send orders via WhatsApp.

## Tech Stack

- **Frontend:** React + Vite + TailwindCSS
- **Backend:** Supabase (PostgreSQL)
- **Deployment:** Vercel
- **Communication:** WhatsApp Deep Links

## Getting Started

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
├── components/    # Reusable React components
├── pages/         # Page components (routes)
├── services/      # Supabase client and data services
├── utils/         # Utility functions
└── hooks/         # Custom React hooks
```

## Routes

### Customer
- `/enter?shop=SHOP_ID&table=TABLE_NUMBER` — QR entry point
- `/menu` — Browse menu (requires QR session)
- `/cart` — View and manage cart (requires QR session)
- `/order` — Order confirmation and WhatsApp send (requires QR session)

### Shop Owner
- `/login` — Shop owner login
- `/dashboard` — Shop management dashboard
- `/menu-manager` — Menu CRUD
- `/qr-generator` — QR code generator for tables

### Admin
- `/admin` — Admin panel
- `/admin/shops` — Shop management
- `/admin/plans` — Plan configuration
