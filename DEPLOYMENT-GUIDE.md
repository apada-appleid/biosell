# Docker Deployment Guide for Biosell

This guide outlines the steps to deploy your Next.js application using Docker, ensuring consistent deployment across environments.

## Prerequisites

- Docker and Docker Compose installed on your server
- Git installed on your server
- A domain name pointing to your server (for production)

## Deployment Steps

### 1. Clone the Repository

```bash
mkdir -p /root
cd /root
git clone <your-repository-url> biosell
cd biosell
```

### 2. Configure Environment Variables

Create or update your .env.production file with the correct environment variables:

```bash
# Database
DATABASE_URL="mysql://username:password@host:port/database"

# NextAuth
NEXTAUTH_URL="https://biosell.me"  # Your production domain
NEXTAUTH_SECRET="your-production-secret-key"

# Upload path
UPLOAD_BASE_PATH=/root/biosell/public
NEXT_PUBLIC_API_URL="https://biosell.me"  # Your production domain

# API settings
API_TIMEOUT=30000
RATE_LIMIT_REQUESTS=100
RATE_LIMIT_WINDOW_MS=60000
LOG_LEVEL="error"
```

### 3. Deploy with Docker Compose

```bash
# Build and start the containers
docker-compose up -d --build

# View logs
docker-compose logs -f
```

### 4. Configure Nginx Reverse Proxy (Optional)

If you're using Nginx as a reverse proxy in front of your Docker containers:

```nginx
server {
    listen 80;
    server_name biosell.me www.biosell.me;

    location / {
        proxy_pass http://localhost:3390;  # Match the port in docker-compose.yaml
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 5. Set Up SSL with Certbot (Optional)

```bash
# Install certbot
sudo apt-get update
sudo apt-get install certbot python3-certbot-nginx

# Obtain and configure SSL certificate
sudo certbot --nginx -d biosell.me -d www.biosell.me
```

## Container Management

```bash
# View running containers
docker-compose ps

# Restart containers
docker-compose restart

# Stop containers
docker-compose down

# Update the application
git pull
docker-compose up -d --build
```

## Troubleshooting

- **Container not starting**: Check logs with `docker-compose logs app`
- **Database connection issues**: Verify your DATABASE_URL and ensure the database is accessible
- **Permission issues**: Check the volume mappings in docker-compose.yaml

## Monitoring

```bash
# View container stats
docker stats

# Check container logs
docker-compose logs -f app
```

For more detailed metrics, consider setting up Docker monitoring tools like Prometheus and Grafana.

## Backup Strategy

```bash
# Backup the database (if using Docker for the database)
docker exec -t [database-container-name] mysqldump -u [user] -p[password] [database] > backup.sql

# Backup uploaded files
cp -r /root/biosell/public/uploads /path/to/backup/location
``` 