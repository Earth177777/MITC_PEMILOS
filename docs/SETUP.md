# Setup Guide

This guide provides detailed instructions for setting up the Electronic Voting System in different environments.

## Table of Contents

1. [System Requirements](#system-requirements)
2. [Local Development Setup](#local-development-setup)
3. [Docker Setup](#docker-setup)
4. [Production Deployment](#production-deployment)
5. [Environment Configuration](#environment-configuration)
6. [Database Setup](#database-setup)
7. [Troubleshooting](#troubleshooting)

## System Requirements

### Minimum Requirements

- **Operating System**: Windows 10+, macOS 10.15+, or Linux (Ubuntu 18.04+)
- **Node.js**: Version 18.0 or higher
- **npm**: Version 9.0 or higher
- **Memory**: 4GB RAM minimum, 8GB recommended
- **Storage**: 2GB free disk space
- **Network**: Internet connection for package downloads

### For Docker Deployment

- **Docker**: Version 20.10 or higher
- **Docker Compose**: Version 2.0 or higher
- **Memory**: 6GB RAM minimum for containers
- **Storage**: 4GB free disk space

## Local Development Setup

### Step 1: Clone the Repository

```bash
git clone <repository-url>
cd electronic-voting-system
```

### Step 2: Install Dependencies

#### Backend Setup

```bash
cd backend
npm install
```

#### Frontend Setup

```bash
cd ../frontend
npm install
```

### Step 3: Environment Configuration

#### Backend Environment

Create a `.env` file in the `backend` directory:

```bash
cd backend
cp .env.example .env
```

Edit the `.env` file:

```env
# Database Configuration
DATABASE_PATH=./db/electronic_voting_system.sqlite
DATABASE_LOGGING=true

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=24h

# Server Configuration
PORT=3001
NODE_ENV=development

# CORS Configuration
CORS_ORIGIN=http://localhost:5173
```

#### Frontend Environment

Create a `.env` file in the `frontend` directory:

```bash
cd ../frontend
cp .env.example .env
```

Edit the `.env` file:

```env
# API Configuration
VITE_API_BASE_URL=http://localhost:3001

# App Configuration
VITE_APP_NAME=Electronic Voting System
VITE_APP_VERSION=1.0.0
```

### Step 4: Database Setup

#### Run Migrations

```bash
cd backend
npm run migrate
```

This will:
- Create the SQLite database file
- Run initial migrations to create tables
- Seed the database with initial data (3 candidates and admin user)

#### Verify Database Setup

```bash
npm run test
```

All tests should pass, confirming the database is properly configured.

### Step 5: Start Development Servers

#### Option A: Start Both Services Simultaneously

From the root directory:

```bash
npm run dev
```

#### Option B: Start Services Separately

**Terminal 1 - Backend:**
```bash
cd backend
npm run start:dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### Step 6: Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001
- **API Documentation**: http://localhost:3001/api (if Swagger is enabled)

## Docker Setup

### Prerequisites

Ensure Docker and Docker Compose are installed:

```bash
docker --version
docker-compose --version
```

### Development with Docker

#### Start Development Environment

```bash
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d
```

#### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
```

#### Stop Services

```bash
docker-compose down
```

### Production with Docker

#### Build and Start Production Environment

```bash
docker-compose up -d --build
```

#### Health Check

```bash
docker-compose ps
```

All services should show "healthy" status.

## Production Deployment

### Server Requirements

- **CPU**: 2+ cores
- **Memory**: 4GB+ RAM
- **Storage**: 20GB+ SSD
- **Network**: Static IP with domain name
- **SSL**: Valid SSL certificate

### Deployment Steps

#### 1. Server Preparation

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Add user to docker group
sudo usermod -aG docker $USER
```

#### 2. Application Deployment

```bash
# Clone repository
git clone <repository-url>
cd electronic-voting-system

# Create production environment files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Edit environment files for production
nano backend/.env
nano frontend/.env
```

#### 3. Production Environment Configuration

**Backend (.env):**
```env
NODE_ENV=production
DATABASE_PATH=./db/electronic_voting_system.sqlite
DATABASE_LOGGING=false
JWT_SECRET=your-very-secure-production-jwt-secret
JWT_EXPIRES_IN=8h
PORT=3001
CORS_ORIGIN=https://yourdomain.com
```

**Frontend (.env):**
```env
VITE_API_BASE_URL=https://api.yourdomain.com
VITE_APP_NAME=Electronic Voting System
VITE_APP_VERSION=1.0.0
```

#### 4. SSL Configuration

Update `frontend/nginx.conf` for SSL:

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;
    
    ssl_certificate /etc/ssl/certs/yourdomain.crt;
    ssl_certificate_key /etc/ssl/private/yourdomain.key;
    
    # ... rest of configuration
}
```

#### 5. Start Production Services

```bash
docker-compose up -d --build
```

#### 6. Setup Reverse Proxy (Optional)

For additional security, use Nginx as a reverse proxy:

```nginx
upstream backend {
    server localhost:3001;
}

upstream frontend {
    server localhost:80;
}

server {
    listen 443 ssl;
    server_name yourdomain.com;
    
    location /api {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    location / {
        proxy_pass http://frontend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## Environment Configuration

### Backend Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `NODE_ENV` | Environment mode | `development` | No |
| `PORT` | Server port | `3001` | No |
| `DATABASE_PATH` | SQLite database path | `./db/electronic_voting_system.sqlite` | No |
| `DATABASE_LOGGING` | Enable database logging | `true` | No |
| `JWT_SECRET` | JWT signing secret | - | Yes |
| `JWT_EXPIRES_IN` | JWT expiration time | `24h` | No |
| `CORS_ORIGIN` | Allowed CORS origins | `*` | No |

### Frontend Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `VITE_API_BASE_URL` | Backend API URL | `http://localhost:3001` | No |
| `VITE_APP_NAME` | Application name | `Electronic Voting System` | No |
| `VITE_APP_VERSION` | Application version | `1.0.0` | No |

## Database Setup

### Initial Setup

The application uses SQLite with TypeORM for database management.

#### Migration Commands

```bash
# Run all pending migrations
npm run migrate

# Create a new migration
npm run migration:create -- --name MigrationName

# Revert last migration
npm run migration:revert
```

### Database Schema

The database includes the following tables:

- **users**: User accounts and authentication
- **candidates**: Election candidates
- **votes**: Cast votes
- **audit_logs**: System audit trail

### Backup and Restore

#### Backup

```bash
# Copy SQLite database file
cp backend/db/electronic_voting_system.sqlite backup_$(date +%Y%m%d_%H%M%S).sqlite
```

#### Restore

```bash
# Stop application
docker-compose down

# Restore database
cp backup_20240115_103000.sqlite backend/db/electronic_voting_system.sqlite

# Start application
docker-compose up -d
```

## Troubleshooting

### Common Issues

#### 1. Port Already in Use

**Error**: `EADDRINUSE: address already in use :::3001`

**Solution**:
```bash
# Find process using port
lsof -i :3001

# Kill process
kill -9 <PID>

# Or use different port in .env
PORT=3002
```

#### 2. Database Connection Error

**Error**: `SQLITE_CANTOPEN: unable to open database file`

**Solution**:
```bash
# Check database directory exists
mkdir -p backend/db

# Check permissions
chmod 755 backend/db

# Run migrations
cd backend && npm run migrate
```

#### 3. JWT Secret Missing

**Error**: `JWT_SECRET is not defined`

**Solution**:
```bash
# Add JWT_SECRET to backend/.env
echo "JWT_SECRET=$(openssl rand -base64 32)" >> backend/.env
```

#### 4. CORS Error

**Error**: `Access to fetch at 'http://localhost:3001' from origin 'http://localhost:5173' has been blocked by CORS policy`

**Solution**:
```bash
# Update backend/.env
CORS_ORIGIN=http://localhost:5173
```

#### 5. Docker Build Fails

**Error**: `failed to solve: process "/bin/sh -c npm ci" didn't complete successfully`

**Solution**:
```bash
# Clear Docker cache
docker system prune -a

# Rebuild without cache
docker-compose build --no-cache
```

### Performance Optimization

#### 1. Database Optimization

```bash
# Enable WAL mode for better concurrency
echo "PRAGMA journal_mode=WAL;" | sqlite3 backend/db/electronic_voting_system.sqlite
```

#### 2. Node.js Optimization

```bash
# Increase Node.js memory limit
export NODE_OPTIONS="--max-old-space-size=4096"
```

#### 3. Docker Optimization

```yaml
# Add to docker-compose.yml
services:
  backend:
    deploy:
      resources:
        limits:
          memory: 512M
        reservations:
          memory: 256M
```

### Logging and Monitoring

#### Application Logs

```bash
# View backend logs
docker-compose logs -f backend

# View frontend logs
docker-compose logs -f frontend

# View all logs
docker-compose logs -f
```

#### Health Checks

```bash
# Check service health
curl http://localhost:3001/health

# Check frontend health
curl http://localhost/health
```

### Getting Help

If you encounter issues not covered in this guide:

1. Check the [API Documentation](./API.md)
2. Review the [Architecture Overview](./ARCHITECTURE.md)
3. Search existing issues in the repository
4. Create a new issue with:
   - Error messages
   - System information
   - Steps to reproduce
   - Expected vs actual behavior

### Support Contacts

- **Technical Support**: tech-support@election-system.com
- **Documentation**: docs@election-system.com
- **Security Issues**: security@election-system.com