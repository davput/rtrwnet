# Admin Dashboard - RT/RW Net SaaS

Dashboard admin untuk mengelola platform SaaS RT/RW Net.

## Fitur

- **Dashboard** - Overview statistik platform (total tenant, revenue, growth)
- **Tenants** - Kelola semua tenant (CRUD, suspend, activate)
- **Paket Langganan** - Kelola paket subscription (Starter, Professional, Enterprise)
- **Admin Users** - Kelola pengguna admin sistem
- **Audit Logs** - Riwayat aktivitas admin
- **Support Tickets** - Kelola tiket support dari tenant
- **Settings** - Konfigurasi sistem

## Tech Stack

- React 18 + TypeScript
- Vite
- TailwindCSS
- shadcn/ui
- React Query
- React Router
- Recharts

## Getting Started

### Install dependencies

```bash
npm install
```

### Run development server

```bash
npm run dev
```

Server akan berjalan di http://localhost:5175

### Build for production

```bash
npm run build
```

## Demo Login

- Email: `admin@rtwnet.com`
- Password: `admin123`

## Struktur Folder

```
src/
├── api/          # API calls
├── components/   # Reusable components
│   ├── layout/   # Layout components
│   └── ui/       # shadcn/ui components
├── hooks/        # Custom hooks
├── lib/          # Utilities
├── pages/        # Page components
└── types/        # TypeScript types
```

## Environment Variables

```env
VITE_API_URL=http://localhost:8080/api/v1
```
