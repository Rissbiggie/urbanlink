# 🐳 Docker Setup Guide - Inventory Management System

This guide covers how to build, deploy, and manage the IMS application using Docker.

## 📋 Prerequisites

- **Docker** 20.10+ ([Install Docker](https://docs.docker.com/get-docker/))
- **Docker Compose** 2.0+ ([Install Docker Compose](https://docs.docker.com/compose/install/))
- **Git** (to clone the repository)

Verify installations:
```bash
docker --version
docker-compose --version
```

## 🚀 Quick Start

### 1. Clone and Prepare the Repository

```bash
cd /home/biggie/Downloads/ims-laravel/inventory-management-system-new
```

### 2. Configure Environment

```bash
# Copy docker environment template
cp .env.docker .env.docker.local

# (Optional) Edit for custom configuration
# nano .env.docker.local
```

### 3. Build and Start Services

```bash
# Build the Docker image
docker-compose build

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f app
```

### 4. Access the Application

Once services are running:

- **Application**: http://localhost:8000
- **API**: http://localhost:8000/api
- **Redis**: localhost:6379

### 5. Login with Demo Credentials

```
Email: admin@example.com
Password: password
```

## 📦 Architecture

```
┌─────────────────────────────────────────┐
│         Docker Container                │
├─────────────────────────────────────────┤
│  Nginx (Port 8000)                      │
│  ├─ Static Assets (React Build)         │
│  ├─ PHP-FPM Backend (Laravel API)       │
│  └─ Request Routing                     │
├─────────────────────────────────────────┤
│  Services                               │
│  ├─ PHP 8.3 (Laravel)                   │
│  ├─ SQLite Database                     │
│  └─ Redis Cache (separate container)    │
└─────────────────────────────────────────┘
```

## 🔧 Common Commands

### Container Management

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# Stop with volume cleanup
docker-compose down -v

# View logs
docker-compose logs -f [service-name]

# View all services
docker-compose ps

# Restart a service
docker-compose restart app
```

### Database Management

```bash
# Run migrations
docker-compose exec app php artisan migrate

# Run seeders
docker-compose exec app php artisan db:seed

# Reset database
docker-compose exec app php artisan migrate:fresh --seed

# Access database shell
docker-compose exec app sqlite3 /app/database/database.sqlite
```

### Cache Management

```bash
# Clear all caches
docker-compose exec app php artisan cache:clear

# Clear config cache
docker-compose exec app php artisan config:clear

# Clear route cache
docker-compose exec app php artisan route:clear

# Clear view cache
docker-compose exec app php artisan view:clear
```

### Application Management

```bash
# Generate app key
docker-compose exec app php artisan key:generate

# Check application health
docker-compose exec app php artisan tinker

# View Laravel logs
docker-compose exec app tail -f storage/logs/laravel.log

# Run artisan commands
docker-compose exec app php artisan [command]
```

### Development/Debugging

```bash
# Shell into container
docker-compose exec app sh

# Run PHP directly
docker-compose exec app php -v

# Check permissions
docker-compose exec app ls -la storage

# Rebuild image (after code changes)
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

## 🗄️ Database Configuration

### SQLite (Default)

SQLite database is stored at `/app/database/database.sqlite` inside the container and mapped to `./database/database.sqlite` on your host.

### PostgreSQL (Optional)

To use PostgreSQL instead:

1. Uncomment the `postgres` section in `docker-compose.yml`
2. Update `.env`:
   ```env
   DB_CONNECTION=pgsql
   DB_HOST=postgres
   DB_PORT=5432
   DB_DATABASE=ims_db
   DB_USERNAME=ims_user
   DB_PASSWORD=secret123
   ```

3. Start services:
   ```bash
   docker-compose up -d
   ```

### With PgAdmin UI (Optional)

Uncomment `pgadmin` in `docker-compose.yml` and access at:
- **URL**: http://localhost:5050
- **Email**: admin@example.com
- **Password**: admin

## 📊 Services Documentation

### App Service (Main Application)

**Image**: `ims:latest` (built from Dockerfile)  
**Port**: 8000  
**Components**:
- PHP 8.3 with FPM
- Nginx web server
- Node.js build tools (used during build)
- Laravel framework
- React frontend (pre-built)

**Features**:
- Auto health checks
- Persistent storage volumes
- Automatic database setup on first run

### Redis Service

**Image**: `redis:7-alpine`  
**Port**: 6379  
**Purpose**: Cache and session management  
**Data**: Persistent (redis-data volume)

## 📁 Volume Mappings

```
Container Path                  Host Path
────────────────────────────────────────────────
/app/storage               →  ./storage
/app/database              →  ./database
/app/bootstrap/cache       →  ./bootstrap/cache
redis-data (named)         →  Docker-managed
```

## 🔒 Security Notes

### For Production

1. **Change APP_KEY**:
   ```bash
   docker-compose exec app php artisan key:generate
   ```

2. **Update APP_URL** in `.env`:
   ```env
   APP_URL=https://yourdomain.com
   ```

3. **Enable HTTPS**:
   - Use a reverse proxy (Nginx/Traefik)
   - Obtain SSL certificates (Let's Encrypt)
   - Configure in docker-compose.yml

4. **Disable Debug Mode**:
   ```env
   APP_DEBUG=false
   ```

5. **Set Strong Passwords**:
   - Database password
   - Redis password (if needed)
   - User passwords in application

6. **Restrict CORS**:
   Update `docker/default.conf`:
   ```nginx
   add_header 'Access-Control-Allow-Origin' 'https://yourdomain.com' always;
   ```

### Environment Variables

Never commit `.env` files with secrets. Use:
- `.env.docker` as template
- `.env.docker.local` for local overrides (git-ignored)

## 🐛 Troubleshooting

### Container won't start

```bash
# Check logs
docker-compose logs app

# Check if port 8000 is in use
lsof -i :8000
# Kill process if needed
kill -9 [PID]
```

### Database errors

```bash
# Check if database file exists
docker-compose exec app ls -la /app/database/

# Fix permissions
docker-compose exec app chown -R www-data:www-data /app/database

# Recreate database
docker-compose exec app rm /app/database/database.sqlite
docker-compose restart app
```

### PHP/Nginx errors

```bash
# Check PHP-FPM status
docker-compose exec app ps aux | grep php

# Check Nginx logs
docker-compose logs -f app | grep nginx
```

### Frontend not loading

```bash
# Check if frontend was built
docker-compose exec app ls -la /app/public/build/

# Rebuild frontend
docker-compose exec app npm run build

# Check file permissions
docker-compose exec app ls -la /app/public/
```

### API not responding

```bash
# Test API endpoint
curl http://localhost:8000/api/me

# Check Laravel logs
docker-compose exec app tail -f storage/logs/laravel.log

# Verify routes
docker-compose exec app php artisan route:list | grep api
```

## 📈 Performance Optimization

### Caching

The application uses database-backed caching. For better performance:

1. **Use Redis** (uncomment service):
   ```env
   CACHE_DRIVER=redis
   SESSION_DRIVER=redis
   ```

2. **Enable route caching**:
   ```bash
   docker-compose exec app php artisan route:cache
   ```

3. **Enable config caching**:
   ```bash
   docker-compose exec app php artisan config:cache
   ```

### Resource Limits

Add to `docker-compose.yml` service:
```yaml
resources:
  limits:
    cpus: '2'
    memory: 2G
  reservations:
    cpus: '1'
    memory: 1G
```

## 🚢 Deployment

### Production Checklist

- [ ] Update `.env` with production values
- [ ] Set `APP_DEBUG=false`
- [ ] Set `APP_ENV=production`
- [ ] Update `APP_URL` to production domain
- [ ] Generate new `APP_KEY`
- [ ] Configure reverse proxy/load balancer
- [ ] Set up SSL/TLS certificates
- [ ] Configure backups for databases
- [ ] Set up monitoring and logging
- [ ] Configure automated updates

### Docker Hub (Optional)

Push to registry:
```bash
# Tag image
docker tag ims:latest your-registry/ims:1.0

# Push to registry
docker push your-registry/ims:1.0
```

### Kubernetes Deployment (Advanced)

Create `k8s-deployment.yaml`:
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ims-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: ims
  template:
    metadata:
      labels:
        app: ims
    spec:
      containers:
      - name: ims
        image: your-registry/ims:1.0
        ports:
        - containerPort: 8000
        env:
        - name: APP_ENV
          value: "production"
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"
```

## 📚 Additional Resources

- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Laravel Docker Guide](https://laravel.com/docs/deployment)
- [Nginx Configuration](https://nginx.org/en/docs/)
- [React in Production](https://react.dev/learn/start-a-new-react-project)

## 🆘 Support

For issues:

1. Check logs: `docker-compose logs app`
2. Review this guide's troubleshooting section
3. Check Laravel logs: `docker-compose exec app tail -f storage/logs/laravel.log`
4. Verify all services running: `docker-compose ps`

## 📝 License

This Docker setup is part of the Inventory Management System project.
