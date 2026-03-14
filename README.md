# qRshop

QR-based onsite ordering platform for restaurants, cafés, sports venues, and kiosks. Customers scan a QR code at the venue to access a digital menu and place an order sent via WhatsApp.

## Tech Stack

- **Frontend:** React, Vite, TailwindCSS
- **Backend:** Supabase
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
