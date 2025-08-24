# SMA Maitreyawira Electronic Voting System - Production Ready

🚀 **This application is now ready for VPS deployment!**

## Quick Start

For Ubuntu VPS deployment, simply run:

```bash
./deploy.sh
```

For detailed instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md)

## What's Included

### ✅ Production Configurations
- **Docker**: Multi-stage builds for optimized production images
- **Environment Files**: Separate production configurations
- **Security**: HTTPS, security headers, rate limiting
- **Reverse Proxy**: Nginx with SSL termination
- **Database**: SQLite with automatic backups
- **Monitoring**: Health checks and logging

### 📁 Key Files

| File | Purpose |
|------|----------|
| `deploy.sh` | Automated deployment script |
| `docker-compose.production.yml` | Production Docker services |
| `backend/.env.production` | Backend production config |
| `frontend/.env.production` | Frontend production config |
| `nginx/nginx.conf` | Main Nginx configuration |
| `nginx/sites-available/election-system` | Site-specific Nginx config |
| `DEPLOYMENT.md` | Complete deployment guide |

### 🔒 Security Features

- **SSL/TLS**: Let's Encrypt integration
- **Firewall**: UFW configuration
- **Rate Limiting**: API and login protection
- **Security Headers**: HSTS, CSP, XSS protection
- **User Isolation**: Non-root containers
- **Database Security**: Encrypted connections

### 📊 Monitoring & Maintenance

- **Health Checks**: Built-in endpoint monitoring
- **Logging**: Centralized log management
- **Backups**: Automated daily database backups
- **Updates**: Easy application and system updates

## System Requirements

### Minimum VPS Specs
- **OS**: Ubuntu 20.04 LTS or newer
- **RAM**: 2GB (4GB recommended)
- **Storage**: 20GB SSD
- **CPU**: 2 cores
- **Network**: Public IP address

### Optional
- Domain name (for SSL certificates)
- Email address (for Let's Encrypt)

## Deployment Options

### 1. Automated Deployment (Recommended)
```bash
# Clone repository
git clone <your-repo-url>
cd sma-maitreyawira-voting-system

# Run deployment script
./deploy.sh
```

### 2. Manual Deployment
Follow the detailed steps in [DEPLOYMENT.md](./DEPLOYMENT.md)

## Post-Deployment

### 1. Set Admin Password
```bash
# Generate password hash
node -e "console.log(require('bcrypt').hashSync('your-password', 12))"

# Update environment file
nano /opt/election-system/app/backend/.env.production

# Restart backend
docker-compose -f docker-compose.production.yml restart backend
```

### 2. Access Application
- **Frontend**: `https://voting.yourdomain.com`
- **Admin Panel**: `https://voting.yourdomain.com/admin`
- **API**: `https://voting.yourdomain.com/api`
- **Health Check**: `https://voting.yourdomain.com/health`

### 3. Monitor System
```bash
# Check service status
docker-compose -f docker-compose.production.yml ps

# View logs
docker-compose -f docker-compose.production.yml logs -f

# Check resource usage
docker stats
```

## Maintenance Commands

```bash
# Update application
cd /opt/election-system/app
git pull origin main
docker-compose -f docker-compose.production.yml up -d --build

# Backup database
timestamp=$(date +"%Y%m%d_%H%M%S")
docker cp election-backend:/app/db/electronic_voting_system.sqlite /opt/election-system/backups/backup_$timestamp.sqlite

# View application logs
docker-compose -f docker-compose.production.yml logs -f backend

# Restart services
docker-compose -f docker-compose.production.yml restart
```

## Support

For deployment issues:
1. Check [DEPLOYMENT.md](./DEPLOYMENT.md) troubleshooting section
2. Review application logs
3. Verify system requirements
4. Contact development team

## Architecture Overview

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Nginx Proxy   │────│   Frontend       │    │   Backend API   │
│   (Port 80/443) │    │   (React/Vite)   │────│   (NestJS)      │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                        │                        │
         │                        │                        │
         └────────────────────────┼────────────────────────┘
                                  │
                         ┌─────────────────┐
                         │   SQLite DB     │
                         │   + Backups     │
                         └─────────────────┘
```

---

**Ready to deploy!** 🎉

Run `./deploy.sh` on your Ubuntu VPS to get started.