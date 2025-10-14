# Deployment Guide

This guide covers deploying the PayPal-like secure application to production.

## Prerequisites for Production

- Server with Docker and Docker Compose
- Domain name with SSL certificate
- PostgreSQL database (can be containerized or external)
- Minimum 2GB RAM, 20GB storage
- SMTP server for email notifications (optional)

## Production Checklist

### 1. Security Configuration

#### Update Environment Variables

**Backend (.env):**
\`\`\`env
APP_ENV=production
APP_DEBUG=false
APP_URL=https://yourdomain.com

# Generate new application key
# Run: php artisan key:generate

# Use strong database password
DB_PASSWORD=<strong-random-password>

# Configure mail for production
MAIL_MAILER=smtp
MAIL_HOST=smtp.mailtrap.io
MAIL_PORT=2525
MAIL_USERNAME=your-username
MAIL_PASSWORD=your-password
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=noreply@yourdomain.com
\`\`\`

**Frontend:**
\`\`\`env
VITE_API_URL=https://api.yourdomain.com
\`\`\`

#### Update CORS Configuration

**backend/config/cors.php:**
\`\`\`php
'allowed_origins' => ['https://yourdomain.com'],
\`\`\`

#### Update Sanctum Configuration

**backend/config/sanctum.php:**
\`\`\`php
'stateful' => explode(',', env('SANCTUM_STATEFUL_DOMAINS', 
    'yourdomain.com,api.yourdomain.com'
)),
\`\`\`

### 2. SSL/TLS Configuration

#### Using Nginx Reverse Proxy

**nginx.conf:**
\`\`\`nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/ssl/certs/yourdomain.com.crt;
    ssl_certificate_key /etc/ssl/private/yourdomain.com.key;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;

    ssl_certificate /etc/ssl/certs/yourdomain.com.crt;
    ssl_certificate_key /etc/ssl/private/yourdomain.com.key;

    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
\`\`\`

### 3. Docker Production Configuration

**docker-compose.prod.yml:**
\`\`\`yaml
version: '3.8'

services:
  db:
    image: postgres:15-alpine
    container_name: paypal_db_prod
    restart: always
    environment:
      POSTGRES_DB: ${DB_DATABASE}
      POSTGRES_USER: ${DB_USERNAME}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - paypal_network

  app:
    build:
      context: ./backend
      dockerfile: Dockerfile.prod
    container_name: paypal_backend_prod
    restart: always
    working_dir: /var/www
    volumes:
      - ./backend:/var/www
    environment:
      APP_ENV: production
      APP_DEBUG: false
    depends_on:
      - db
    networks:
      - paypal_network

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.prod
    container_name: paypal_frontend_prod
    restart: always
    networks:
      - paypal_network

networks:
  paypal_network:
    driver: bridge

volumes:
  postgres_data:
    driver: local
\`\`\`

### 4. Backend Production Dockerfile

**backend/Dockerfile.prod:**
\`\`\`dockerfile
FROM php:8.3-fpm

WORKDIR /var/www

RUN apt-get update && apt-get install -y \\
    git curl libpng-dev libonig-dev libxml2-dev libpq-dev \\
    zip unzip nginx

RUN docker-php-ext-configure pgsql -with-pgsql=/usr/local/pgsql \\
    && docker-php-ext-install pdo pdo_pgsql pgsql mbstring exif pcntl bcmath gd

COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

COPY . /var/www

RUN composer install --optimize-autoloader --no-dev \\
    && chown -R www-data:www-data /var/www \\
    && chmod -R 755 /var/www/storage \\
    && chmod -R 755 /var/www/bootstrap/cache

RUN php artisan config:cache \\
    && php artisan route:cache \\
    && php artisan view:cache

EXPOSE 8000

CMD ["php", "artisan", "serve", "--host=0.0.0.0", "--port=8000"]
\`\`\`

### 5. Frontend Production Dockerfile

**frontend/Dockerfile.prod:**
\`\`\`dockerfile
FROM node:20-alpine as build

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
\`\`\`

### 6. Deployment Steps

#### Initial Deployment

\`\`\`bash
# 1. Clone repository on server
git clone <repository-url> /var/www/paypal-app
cd /var/www/paypal-app

# 2. Configure environment
cp backend/.env.example backend/.env
# Edit backend/.env with production values

# 3. Build and start containers
docker compose -f docker-compose.prod.yml up -d --build

# 4. Generate application key
docker exec paypal_backend_prod php artisan key:generate

# 5. Run migrations
docker exec paypal_backend_prod php artisan migrate --force

# 6. Verify deployment
curl https://yourdomain.com
curl https://api.yourdomain.com/api
\`\`\`

#### Updating Deployment

\`\`\`bash
# 1. Pull latest changes
git pull origin main

# 2. Rebuild containers
docker compose -f docker-compose.prod.yml up -d --build

# 3. Run migrations if needed
docker exec paypal_backend_prod php artisan migrate --force

# 4. Clear caches
docker exec paypal_backend_prod php artisan config:cache
docker exec paypal_backend_prod php artisan route:cache
docker exec paypal_backend_prod php artisan view:cache
\`\`\`

### 7. Database Backup

\`\`\`bash
# Backup database
docker exec paypal_db_prod pg_dump -U ${DB_USERNAME} ${DB_DATABASE} > backup_$(date +%Y%m%d).sql

# Restore database
docker exec -i paypal_db_prod psql -U ${DB_USERNAME} ${DB_DATABASE} < backup_20251024.sql
\`\`\`

### 8. Monitoring

#### Application Logs

\`\`\`bash
# View all logs
docker compose -f docker-compose.prod.yml logs -f

# View specific service
docker compose -f docker-compose.prod.yml logs -f app

# Laravel logs
docker exec paypal_backend_prod tail -f storage/logs/laravel.log
\`\`\`

#### Health Checks

\`\`\`bash
# Check container status
docker ps

# Check Laravel health
curl https://api.yourdomain.com/up

# Check database connection
docker exec paypal_backend_prod php artisan db:show
\`\`\`

### 9. Security Hardening

#### File Permissions
\`\`\`bash
# Ensure proper permissions
docker exec paypal_backend_prod chown -R www-data:www-data /var/www
docker exec paypal_backend_prod chmod -R 755 /var/www/storage
docker exec paypal_backend_prod chmod -R 755 /var/www/bootstrap/cache
\`\`\`

#### Firewall Rules
\`\`\`bash
# Allow only necessary ports
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 22/tcp
ufw enable
\`\`\`

#### Rate Limiting
Already configured in `backend/app/Http/Kernel.php`:
- Login endpoint: 5 attempts per minute
- API routes: 60 requests per minute

### 10. Performance Optimization

#### Enable OPcache (Production PHP Configuration)

Add to `backend/Dockerfile.prod`:
\`\`\`dockerfile
RUN docker-php-ext-install opcache
COPY opcache.ini /usr/local/etc/php/conf.d/opcache.ini
\`\`\`

**opcache.ini:**
\`\`\`ini
opcache.enable=1
opcache.memory_consumption=128
opcache.max_accelerated_files=10000
opcache.revalidate_freq=2
\`\`\`

#### Database Indexing
Already configured in migrations with indexed columns.

#### CDN Integration
Consider serving static assets through a CDN for better performance.

### 11. Compliance Checklist

- [ ] HTTPS/SSL enabled on all endpoints
- [ ] Environment variables secured
- [ ] Database backups automated
- [ ] Application logs monitored
- [ ] Security headers configured
- [ ] CORS properly restricted
- [ ] Rate limiting active
- [ ] Password policies enforced
- [ ] 2FA available to all users
- [ ] Login activity tracked
- [ ] Error logging without sensitive data

### 12. Disaster Recovery

#### Backup Strategy
1. **Daily database backups** - Automated via cron
2. **Weekly full system snapshots** - Server/VM snapshots
3. **Off-site backup storage** - AWS S3, Google Cloud Storage
4. **Backup retention** - Keep 30 days of backups

#### Recovery Procedure
\`\`\`bash
# 1. Restore from backup
docker exec -i paypal_db_prod psql -U ${DB_USERNAME} ${DB_DATABASE} < backup.sql

# 2. Verify data integrity
docker exec paypal_backend_prod php artisan migrate:status

# 3. Test application
curl https://api.yourdomain.com/api
\`\`\`

## Troubleshooting Production Issues

### High Memory Usage
\`\`\`bash
# Check container resource usage
docker stats

# Restart containers
docker compose -f docker-compose.prod.yml restart
\`\`\`

### Database Connection Issues
\`\`\`bash
# Verify database is running
docker ps | grep paypal_db_prod

# Check database logs
docker logs paypal_db_prod

# Test connection
docker exec paypal_backend_prod php artisan db:show
\`\`\`

### SSL Certificate Renewal
\`\`\`bash
# Using Let's Encrypt
certbot renew --nginx

# Reload nginx
nginx -s reload
\`\`\`

## Support Contacts

For production support:
- DevOps Team: devops@yourdomain.com
- Security Team: security@yourdomain.com
- Database Admin: dba@yourdomain.com

---

**Last Updated:** October 2025
