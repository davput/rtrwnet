# NetManage - ISP Management Landing Page

Landing page untuk NetManage, platform manajemen ISP dengan fitur registrasi dan pemilihan paket.

## Features

- ✅ Modern landing page dengan animasi smooth
- ✅ Pricing section dengan data dari API
- ✅ Registrasi tenant dengan free trial 7 hari
- ✅ Integrasi dengan backend API
- ✅ Form validation lengkap
- ✅ Responsive design
- ✅ Dark/Light mode support
- ✅ Docker ready

## Tech Stack

- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **TailwindCSS** - Styling
- **Shadcn/ui** - UI components
- **React Router** - Routing
- **React Query** - Data fetching

## Getting Started

### Prerequisites

- Node.js 18+ atau Bun
- Backend API running di `http://localhost:8089`

### Installation

```bash
# Install dependencies
npm install
# atau
bun install

# Setup environment
cp .env.example .env
# Edit .env sesuai kebutuhan

# Run development server
npm run dev
# atau
bun dev
```

### Environment Variables

```env
VITE_API_URL=http://localhost:8089
VITE_DASHBOARD_URL=https://dashboard.yourdomain.com
```

## API Integration

Project ini terintegrasi dengan backend API. Lihat dokumentasi lengkap di:
- `FRONTEND_INTEGRATION.md` - Detail API endpoints
- `API_USAGE.md` - Quick guide penggunaan

### API Endpoints

- `GET /api/v1/public/plans` - Get available plans
- `POST /api/v1/public/signup` - Register new tenant

## Project Structure

```
src/
├── components/          # React components
│   ├── ui/             # Shadcn UI components
│   ├── Navbar.tsx
│   ├── HeroSection.tsx
│   ├── PricingSection.tsx  # ✅ API integrated
│   └── ...
├── pages/
│   ├── Index.tsx       # Landing page
│   ├── Register.tsx    # ✅ API integrated
│   ├── Login.tsx
│   └── Dashboard.tsx
├── lib/
│   ├── api.ts          # ✅ API service
│   ├── validation.ts   # ✅ Form validation
│   └── utils.ts
└── hooks/
    └── useScrollAnimation.tsx
```

## Docker

### Build & Run

```bash
# Build image
docker build -t netmanage-landing .

# Run container
docker run -p 3000:80 netmanage-landing

# Atau menggunakan docker-compose
docker-compose up -d
```

### Docker Configuration

- `Dockerfile` - Multi-stage build dengan Nginx
- `docker-compose.yml` - Compose configuration
- `nginx.conf` - Nginx configuration untuk SPA

## Development

### Available Scripts

```bash
# Development
npm run dev          # Start dev server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint

# Docker
docker-compose up    # Start with docker
docker-compose down  # Stop docker
```

### Code Style

- ESLint untuk linting
- Prettier untuk formatting (optional)
- TypeScript strict mode

## Testing

### Manual Testing

1. Start backend: `http://localhost:8089`
2. Start frontend: `npm run dev`
3. Open browser: `http://localhost:5173`
4. Test flow:
   - Scroll ke Pricing section
   - Klik "Coba Gratis 7 Hari"
   - Isi form registrasi
   - Submit dan cek response

### API Testing

Gunakan Postman collection di backend project:
- `postman/Free_Trial_Testing.postman_collection.json`

## Deployment

### Production Build

```bash
npm run build
# Output di folder: dist/
```

### Deploy Options

1. **Static Hosting** (Vercel, Netlify, etc.)
   - Connect repository
   - Set build command: `npm run build`
   - Set output directory: `dist`
   - Add environment variables

2. **Docker**
   - Build image: `docker build -t netmanage-landing .`
   - Push to registry
   - Deploy to server

3. **Traditional Server**
   - Build: `npm run build`
   - Copy `dist/` folder to server
   - Configure Nginx/Apache untuk SPA

### Environment Variables (Production)

```env
VITE_API_URL=https://api.yourdomain.com
VITE_DASHBOARD_URL=https://dashboard.yourdomain.com
```

## Troubleshooting

### Plans tidak muncul
- Cek backend running
- Cek CORS configuration
- Cek network tab di browser

### CORS Error
- Tambahkan frontend URL ke `CORS_ALLOWED_ORIGINS` di backend
- Restart backend

### Registrasi gagal
- Cek form validation
- Cek network request/response
- Cek backend logs

## Contributing

1. Fork repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

## License

MIT License

## Support

Untuk bantuan, lihat:
- Documentation: `FRONTEND_INTEGRATION.md`
- API Guide: `API_USAGE.md`
