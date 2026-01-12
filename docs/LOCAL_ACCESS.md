# Local Development Access

## ✅ Everything is Running!

### Database
- ✅ PostgreSQL running on `localhost:5432`
- ✅ Redis running on `localhost:6379`
- ✅ pgAdmin running on `http://localhost:5050` (optional)
- ✅ Database schema synced with `user_type` column

### Backend API
- ✅ Running on `http://localhost:3000`
- ✅ Health check: http://localhost:3000/health

### Admin Panel
- ✅ Running on `http://localhost:5173`

## 🚀 Access Admin Panel

**Open in your browser:**
```
http://localhost:5173
```

## 🔐 Login Credentials

- **Email:** `admin@getanicecar.com`
- **Password:** `admin123456`

## 📋 What You Can Do

Once logged in, you'll see the sidebar with:

1. **📊 Dashboard** - View statistics
2. **👥 Clients** - Manage client accounts (approve/reject)
3. **👨‍💼 Employees** - Create and manage employees
4. **📅 Appointments** - Manage appointments
5. **🏢 Departments** - Manage departments
6. **❓ FAQs** - Manage FAQs
7. **🚗 Breakdown** - Manage breakdown requests
8. **🔔 Notifications** - Send notifications
9. **🔐 Roles** - Manage custom roles (Super Admin only)

## 🛠️ Useful Commands

### Stop Services
```bash
# Stop backend (Ctrl+C in terminal)
# Stop admin panel (Ctrl+C in terminal)

# Stop database
cd backend
docker-compose -f docker-compose.dev.yml down
```

### Restart Services
```bash
# Restart database
cd backend
docker-compose -f docker-compose.dev.yml restart

# Backend and admin panel will auto-reload on code changes
```

### View Logs
```bash
# Database logs
cd backend
docker-compose -f docker-compose.dev.yml logs -f postgres
```

## 🎉 You're All Set!

The admin panel should now work. Try logging in at:
**http://localhost:5173**
