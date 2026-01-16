# Quick Start Guide

## 🚀 Setup dalam 5 Menit

### 1. Install Dependencies

```bash
npm install
```

### 2. Setup Environment

```bash
# Copy template
cp .env.example .env

# Edit .env (optional, defaults sudah OK untuk development)
# VITE_API_URL=http://localhost:8089
# VITE_DASHBOARD_URL=https://dashboard.yourdomain.com
```

### 3. Start Development Server

```bash
npm run dev
```

Buka browser: `http://localhost:5173`

## ✅ Verify Integration

### Test Pricing Section

1. Scroll ke section "Pilih Paket yang Sesuai Kebutuhan"
2. Pastikan paket muncul (jika backend running)
3. Atau akan muncul loading/error state (jika backend tidak running)

### Test Register Page

1. Klik tombol "Coba Gratis 7 Hari" di salah satu paket
2. Akan redirect ke `/register`
3. Isi form registrasi
4. Submit (akan error jika backend tidak running)

## 🔧 Development dengan Backend

### Pastikan Backend Running

```bash
# Di terminal terpisah, jalankan backend
cd /path/to/backend
go run main.go
# Backend harus running di http://localhost:8089
```

### Test Full Flow

1. **Homepage** → Scroll ke pricing
2. **Pricing** → Klik "Coba Gratis 7 Hari"
3. **Register** → Isi form:
   - ISP Name: Test ISP
   - Subdomain: testisp
   - Owner Name: Test Owner
   - Email: test@test.com
   - Phone: 08123456789
   - Password: test1234
   - Confirm: test1234
4. **Submit** → Akan redirect ke dashboard

## 🐛 Troubleshooting

### Plans tidak muncul?

**Cek:**
1. Backend running? → `curl http://localhost:8089/api/v1/public/plans`
2. CORS error? → Cek console browser
3. Network error? → Cek network tab

**Fix:**
```bash
# Backend .env
CORS_ALLOWED_ORIGINS=http://localhost:5173
```

### Registrasi gagal?

**Cek:**
1. Form validation passed?
2. Backend running?
3. Network request sent?

**Debug:**
- Open browser console (F12)
- Check network tab
- Look for error messages

## 📦 Docker (Optional)

### Build & Run

```bash
# Build
docker build -t netmanage-landing .

# Run
docker run -p 3000:80 netmanage-landing

# Atau dengan docker-compose
docker-compose up -d
```

Buka: `http://localhost:3000`

## 📚 Documentation

- `API_USAGE.md` - Developer guide
- `FRONTEND_INTEGRATION.md` - API details
- `IMPLEMENTATION_SUMMARY.md` - What's implemented
- `README.md` - Full documentation

## 🎯 Quick Commands

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build production
npm run preview          # Preview production build
npm run lint             # Run linter

# Docker
docker-compose up        # Start
docker-compose down      # Stop
docker-compose logs -f   # View logs
```

## ✨ Features Implemented

- ✅ API integration (plans & signup)
- ✅ Form validation
- ✅ Loading states
- ✅ Error handling
- ✅ Auto redirect
- ✅ Responsive design
- ✅ Dark/Light mode
- ✅ Docker ready

## 🔗 Important URLs

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:8089`
- API Docs: `http://localhost:8089/swagger/index.html`

## 💡 Tips

1. **Development tanpa backend?**
   - Edit `src/lib/api.ts`
   - Uncomment mock data
   - Test UI/UX tanpa API

2. **Test error handling?**
   - Stop backend
   - Try submit form
   - Should show error toast

3. **Test loading state?**
   - Add delay di API call
   - See loading spinner

4. **Debug API calls?**
   - Open DevTools (F12)
   - Network tab
   - Filter: XHR/Fetch

## 🎉 Ready to Go!

Sekarang kamu bisa:
1. ✅ Develop landing page
2. ✅ Test API integration
3. ✅ Deploy to production

Happy coding! 🚀
