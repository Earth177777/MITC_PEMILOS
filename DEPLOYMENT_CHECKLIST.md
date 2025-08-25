# VPS Deployment Checklist

## Pre-Deployment Checklist

### ✅ VPS Requirements
- [ ] Ubuntu 20.04 LTS or newer installed
- [ ] Minimum 2GB RAM (4GB recommended)
- [ ] Minimum 20GB SSD storage
- [ ] 2+ CPU cores
- [ ] Public IP address assigned
- [ ] SSH access configured
- [ ] Non-root user created with sudo privileges

### ✅ Domain & SSL (Optional but Recommended)
- [ ] Domain name purchased and configured
- [ ] DNS A record pointing to VPS IP
- [ ] Email address for Let's Encrypt notifications
- [ ] Domain accessible via browser
- [ ] SSL certificate installed
- [ ] HTTPS redirect working
- [ ] SSL auto-renewal configured

### ✅ Local Preparation
- [ ] Repository cloned to VPS
- [ ] `deploy.sh` script is executable (`chmod +x deploy.sh`)
- [ ] All configuration files are present

## Deployment Process Checklist

### ✅ System Setup
- [ ] System packages updated (`sudo apt update && sudo apt upgrade -y`)
- [ ] Docker installed and configured
- [ ] Docker Compose installed
- [ ] UFW firewall configured (ports 22, 80, 443)
- [ ] Application directories created (`/opt/election-system/`)

### ✅ SSL Configuration (If using domain)
- [ ] Certbot installed
- [ ] SSL certificates generated via Let's Encrypt
- [ ] SSL certificates copied to `/opt/election-system/ssl/`
- [ ] DH parameters generated
- [ ] Nginx SSL configuration updated
- [ ] Environment files updated for HTTPS
- [ ] HTTPS redirect working
- [ ] SSL auto-renewal configured
- [ ] SSL certificate validity tested

### ✅ Application Configuration
- [ ] Environment files configured:
  - [ ] `backend/.env.production`
  - [ ] `frontend/.env.production`
- [ ] Domain names updated in configuration files
- [ ] JWT secret generated and set
- [ ] Admin password hash generated and set
- [ ] Database path configured
- [ ] CORS origins configured

### ✅ Docker Deployment
- [ ] Production Docker Compose file configured
- [ ] Images built successfully
- [ ] All containers started and running
- [ ] Health checks passing
- [ ] No error logs in container output

## Post-Deployment Verification

### ✅ Service Status
- [ ] All Docker containers running:
  ```bash
  docker-compose -f docker-compose.production.yml ps
  ```
- [ ] Nginx proxy responding
- [ ] Backend API responding
- [ ] Frontend application loading
- [ ] Database accessible

### ✅ Endpoint Testing
- [ ] Frontend accessible: `https://voting.yourdomain.com`
- [ ] API health check: `https://voting.yourdomain.com/api/health`
- [ ] Frontend health check: `https://voting.yourdomain.com/health`
- [ ] Admin panel accessible: `https://voting.yourdomain.com/admin`
- [ ] HTTP to HTTPS redirect working

### ✅ Security Verification
- [ ] SSL certificate valid and trusted
- [ ] Security headers present (check with browser dev tools)
- [ ] Rate limiting working (test with multiple requests)
- [ ] Firewall rules active (`sudo ufw status`)
- [ ] Non-root containers running
- [ ] Sensitive files not accessible via web

### ✅ Functionality Testing
- [ ] Admin login working
- [ ] Candidate management working
- [ ] Voting process functional
- [ ] Results display working
- [ ] Real-time updates working (WebSocket)
- [ ] Mobile responsiveness working

### ✅ Performance & Monitoring
- [ ] Application loading quickly
- [ ] Database queries performing well
- [ ] Memory usage within limits
- [ ] CPU usage reasonable
- [ ] Disk space sufficient
- [ ] Log files being created
- [ ] Backup system working

## Production Maintenance Setup

### ✅ Backup Configuration
- [ ] Automatic daily backups configured
- [ ] Backup retention policy set (30 days)
- [ ] Manual backup tested
- [ ] Backup restoration tested

### ✅ Monitoring Setup
- [ ] Log rotation configured
- [ ] Health check endpoints monitored
- [ ] Resource usage monitoring
- [ ] Error alerting configured (optional)

### ✅ Update Procedures
- [ ] Application update process documented
- [ ] System update schedule planned
- [ ] SSL certificate renewal tested
- [ ] Rollback procedure documented

## Security Hardening Checklist

### ✅ Server Security
- [ ] SSH key-based authentication enabled
- [ ] Root login disabled
- [ ] Fail2ban installed (optional)
- [ ] Regular security updates scheduled
- [ ] Unused services disabled

### ✅ Application Security
- [ ] Strong admin password set
- [ ] JWT secret is cryptographically secure
- [ ] Database file permissions correct
- [ ] Environment files not web-accessible
- [ ] CORS properly configured
- [ ] Rate limiting configured

### ✅ Network Security
- [ ] Only necessary ports open
- [ ] DDoS protection considered
- [ ] CDN configured (optional)
- [ ] Intrusion detection considered

## Go-Live Checklist

### ✅ Final Verification
- [ ] All above items completed
- [ ] Load testing performed (if high traffic expected)
- [ ] Backup and recovery tested
- [ ] Documentation updated
- [ ] Team trained on maintenance procedures

### ✅ Launch Preparation
- [ ] Maintenance window scheduled
- [ ] Rollback plan prepared
- [ ] Support team notified
- [ ] Users notified of new system

### ✅ Post-Launch Monitoring
- [ ] Monitor logs for first 24 hours
- [ ] Check performance metrics
- [ ] Verify backup completion
- [ ] User feedback collection

## Emergency Contacts & Resources

### Important Commands
```bash
# Check service status
docker-compose -f docker-compose.production.yml ps

# View logs
docker-compose -f docker-compose.production.yml logs -f

# Restart services
docker-compose -f docker-compose.production.yml restart

# Stop all services
docker-compose -f docker-compose.production.yml down

# Start all services
docker-compose -f docker-compose.production.yml up -d
```

### Key File Locations
- Application: `/opt/election-system/app/`
- Logs: `/opt/election-system/logs/`
- Backups: `/opt/election-system/backups/`
- SSL Certificates: `/opt/election-system/ssl/`
- Nginx Config: `/opt/election-system/app/nginx/`

---

**✅ Deployment Complete!**

Once all items are checked, your SMA Maitreyawira Electronic Voting System is ready for production use.