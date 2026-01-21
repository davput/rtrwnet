# Quick Reference Card

## 🏠 Development (Laptop)

### Start Services
```powershell
# PostgreSQL (auto-start biasanya)
# Redis
redis-server

# Backend
cd Backend
go run cmd/api/main.go

# Frontend
cd Frontend/UserDashboard
npm run dev
```

### URLs
- Backend API: `http://localhost:8089`
- Swagger: `http://localhost:8089/swagger/index.html`
- User Dashboard: `http://localhost:5175`
- Admin Dashboard: `http://localhost:5174`
- Homepage: `http://localhost:3000`

---

## 🚀 Production (VPS)

### Deploy
```bash
cd /opt/rtrwnet-saas
git pull
docker-compose up -d --build
```

### Check Status
```bash
docker-compose ps
docker-compose logs -f
```

### Restart
```bash
docker-compose restart
```

---

## 🔧 Common Commands

### Database
```bash
# Development
psql -U postgres -d rtrwnet_saas

# Production
docker exec -it rtrwnet-postgres psql -U postgres -d rtrwnet_saas
```

### Logs
```bash
# Development
# Check terminal output

# Production
docker-compose logs -f backend
docker-compose logs -f freeradius
```

### Backup
```bash
# Development
pg_dump -U postgres rtrwnet_saas > backup.sql

# Production
docker exec rtrwnet-postgres pg_dump -U postgres rtrwnet_saas > backup.sql
```

---

## 📝 Environment Files

### Development
- `Backend/.env` - Backend config
- `Frontend/UserDashboard/.env` - User dashboard
- `Frontend/AdminDashboard/.env` - Admin dashboard
- `Frontend/HomePage/.env` - Homepage

### Production
- `.env` - Root (untuk docker-compose)
- Semua config di docker-compose.yml

---

## 🐛 Quick Troubleshooting

### Backend Error
```bash
# Check database
psql -U postgres -c "SELECT version();"

# Check Redis
redis-cli ping

# Check logs
tail -f backend.log
```

### Frontend Error
```bash
# Check .env
cat .env

# Clear cache
rm -rf node_modules
npm install
```

### Docker Error
```bash
# Restart
docker-compose restart

# Rebuild
docker-compose up -d --build

# Clean
docker system prune -a
```

---

## 🎯 Deployment Checklist

### Before Deploy
- [ ] Test di development
- [ ] Commit & push code
- [ ] Update version number
- [ ] Check migrations

### Deploy
- [ ] SSH ke VPS
- [ ] Pull latest code
- [ ] Run migrations (jika ada)
- [ ] Build & restart containers
- [ ] Check logs
- [ ] Test endpoints

### After Deploy
- [ ] Verify all services running
- [ ] Test critical features
- [ ] Monitor logs for errors
- [ ] Update documentation

---

## 📞 Support

- Documentation: `/docs` folder
- Issues: GitHub Issues
- Email: support@yourdomain.com
