# Deployment Guide - Namecheap VPS KVM 2

This guide covers deploying the Nice Car Backend to a Namecheap VPS running Ubuntu 22.04.

## Prerequisites

- Namecheap VPS KVM 2 (or similar) with Ubuntu 22.04
- Domain name pointed to your VPS IP
- SSH access to the server

## 1. Initial Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install essential packages
sudo apt install -y curl git ufw fail2ban

# Configure firewall
sudo ufw allow OpenSSH
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

## 2. Install Docker

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add user to docker group
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify installation
docker --version
docker-compose --version
```

## 3. Install Nginx

```bash
sudo apt install -y nginx
sudo systemctl enable nginx
sudo systemctl start nginx
```

## 4. Install Certbot (SSL)

```bash
sudo apt install -y certbot python3-certbot-nginx
```

## 5. Clone Repository

```bash
# Create app directory
sudo mkdir -p /var/www/nicecar
cd /var/www/nicecar

# Clone your repository
git clone https://github.com/your-repo/nicecarmobile-working.git .

cd backend
```

## 6. Configure Environment

```bash
# Copy example environment file
cp .env.example .env.production

# Edit production environment
nano .env.production
```

**Required environment variables:**

```env
NODE_ENV=production
PORT=3000

# Database
DB_USER=nicecar_user
DB_PASSWORD=your_secure_password_here
DB_NAME=nicecar_db
DATABASE_URL=postgresql://nicecar_user:your_secure_password_here@postgres:5432/nicecar_db?schema=public

# Redis
REDIS_URL=redis://redis:6379

# JWT (generate secure secrets)
JWT_SECRET=your_jwt_secret_at_least_32_chars
JWT_REFRESH_SECRET=your_refresh_secret_at_least_32_chars

# CORS
CORS_ORIGIN=https://admin.getanicecar.com,https://getanicecar.com

# Firebase (optional - for push notifications)
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY=your_private_key
FIREBASE_CLIENT_EMAIL=your_client_email
```

## 7. Build and Deploy

```bash
# Build the admin panel
cd admin
npm install
npm run build
cd ..

# Start with Docker Compose
docker-compose --env-file .env.production up -d

# Check status
docker-compose ps
docker-compose logs -f
```

## 8. Configure Nginx

```bash
# Copy nginx config
sudo cp nginx/api.conf /etc/nginx/sites-available/nicecar

# Enable site
sudo ln -s /etc/nginx/sites-available/nicecar /etc/nginx/sites-enabled/

# Test config
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx
```

## 9. Setup SSL

```bash
# Get SSL certificates
sudo certbot --nginx -d api.getanicecar.com -d admin.getanicecar.com

# Auto-renewal is automatic, but verify
sudo certbot renew --dry-run
```

## 10. Database Migration

```bash
# Run migrations inside container
docker-compose exec api npx prisma migrate deploy

# Seed initial data
docker-compose exec api npx prisma db seed
```

## 11. Setup PM2 (Optional - for non-Docker deployment)

If you prefer running without Docker:

```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2
sudo npm install -g pm2

# Start application
cd /var/www/nicecar/backend
npm install --production
npx prisma generate
npm run build
pm2 start dist/app.js --name nicecar-api

# Save PM2 config
pm2 save
pm2 startup
```

## Maintenance Commands

```bash
# View logs
docker-compose logs -f api

# Restart services
docker-compose restart

# Update application
cd /var/www/nicecar
git pull origin main
cd backend
docker-compose down
docker-compose --env-file .env.production up -d --build

# Database backup
docker-compose exec postgres pg_dump -U nicecar_user nicecar_db > backup.sql

# Database restore
docker-compose exec -T postgres psql -U nicecar_user nicecar_db < backup.sql
```

## Monitoring

```bash
# Check service status
docker-compose ps

# Monitor resources
docker stats

# Check disk space
df -h
```

## Security Checklist

- [ ] Change default SSH port
- [ ] Disable root login
- [ ] Enable fail2ban
- [ ] Configure UFW firewall
- [ ] Use strong database passwords
- [ ] Use strong JWT secrets
- [ ] Enable HTTPS only
- [ ] Regular security updates

## Troubleshooting

### API not responding
```bash
# Check logs
docker-compose logs api

# Check if port is in use
sudo lsof -i :3000

# Restart containers
docker-compose restart
```

### Database connection issues
```bash
# Check postgres logs
docker-compose logs postgres

# Verify connection string
docker-compose exec api env | grep DATABASE_URL
```

### SSL certificate issues
```bash
# Renew certificates
sudo certbot renew

# Check certificate status
sudo certbot certificates
```



