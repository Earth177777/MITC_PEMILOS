# SSL Troubleshooting Guide

This guide helps troubleshoot common SSL issues with the SMA Maitreyawira Electronic Voting System.

## Quick SSL Status Check

```bash
# Check if SSL certificates exist
ls -la /opt/election-system/ssl/

# Check certificate validity
sudo certbot certificates

# Test SSL connection
curl -I https://voting.yourdomain.com

# Check nginx configuration
sudo nginx -t

# Check container status
cd /opt/election-system/app && docker-compose ps
```

## Common Issues and Solutions

### 1. Certificate Generation Failed

**Symptoms:**
- `certbot` command fails
- "Challenge failed" errors
- Port 80 connection refused

**Solutions:**
```bash
# Ensure port 80 is available
sudo netstat -tlnp | grep :80

# Stop containers temporarily
cd /opt/election-system/app && docker-compose down

# Try certificate generation again
sudo certbot certonly --standalone -d voting.yourdomain.com

# Restart containers
docker-compose up -d
```

### 2. Domain Not Resolving

**Symptoms:**
- DNS resolution fails
- "Name or service not known" errors

**Solutions:**
```bash
# Check DNS resolution
nslookup voting.yourdomain.com
dig voting.yourdomain.com

# Verify A record points to your VPS IP
curl ifconfig.me  # Get your VPS IP

# Wait for DNS propagation (up to 48 hours)
```

### 3. SSL Certificate Not Loading

**Symptoms:**
- Browser shows "Not Secure"
- Certificate errors in browser
- Mixed content warnings

**Solutions:**
```bash
# Check certificate files exist and have correct permissions
ls -la /opt/election-system/ssl/
sudo chown -R $USER:$USER /opt/election-system/ssl/
sudo chmod 600 /opt/election-system/ssl/*

# Verify nginx is using SSL configuration
cd /opt/election-system/app
cat nginx/sites-available/election-system | grep ssl

# Restart nginx container
docker-compose restart nginx
```

### 4. Mixed Content Issues

**Symptoms:**
- Some resources load over HTTP instead of HTTPS
- Console errors about mixed content

**Solutions:**
```bash
# Update environment files
cd /opt/election-system/app

# Backend environment
sed -i 's|http://|https://|g' backend/.env.production

# Frontend environment  
sed -i 's|http://|https://|g' frontend/.env.production

# Rebuild and restart containers
docker-compose down
docker-compose build
docker-compose up -d
```

### 5. Auto-Renewal Not Working

**Symptoms:**
- Certificate expires
- Renewal cron job fails

**Solutions:**
```bash
# Test renewal manually
sudo certbot renew --dry-run

# Check cron jobs
crontab -l

# Check renewal script
cat /usr/local/bin/renew-ssl.sh

# Re-setup auto-renewal
./setup-ssl.sh
```

### 6. WebSocket Connection Issues with SSL

**Symptoms:**
- Real-time features not working
- WebSocket connection errors in browser console

**Solutions:**
```bash
# Check WebSocket proxy configuration
cd /opt/election-system/app
grep -A 10 "location /socket.io/" nginx/sites-available/election-system

# Ensure WSS (WebSocket Secure) is used
# Update frontend to use wss:// instead of ws://
```

## SSL Configuration Files

### Nginx SSL Configuration
Location: `/opt/election-system/app/nginx/sites-available/election-system`

Key sections:
```nginx
# SSL Configuration
ssl_certificate /etc/nginx/ssl/your-cert.pem;
ssl_certificate_key /etc/nginx/ssl/your-key.pem;
ssl_dhparam /etc/nginx/ssl/dhparam.pem;

# Security headers
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
```

### Environment Files

**Backend** (`backend/.env.production`):
```env
ALLOWED_ORIGINS=https://voting.yourdomain.com
SSL_ENABLED=true
```

**Frontend** (`frontend/.env.production`):
```env
VITE_API_URL=https://voting.yourdomain.com/api
```

## Manual SSL Setup

If the automated setup fails, you can set up SSL manually:

```bash
# 1. Generate certificate
sudo certbot certonly --standalone -d voting.yourdomain.com

# 2. Copy certificates
sudo mkdir -p /opt/election-system/ssl
sudo cp /etc/letsencrypt/live/voting.yourdomain.com/fullchain.pem /opt/election-system/ssl/your-cert.pem
sudo cp /etc/letsencrypt/live/voting.yourdomain.com/privkey.pem /opt/election-system/ssl/your-key.pem

# 3. Generate DH parameters
sudo openssl dhparam -out /opt/election-system/ssl/dhparam.pem 2048

# 4. Set permissions
sudo chown -R $USER:$USER /opt/election-system/ssl
sudo chmod 600 /opt/election-system/ssl/*

# 5. Update nginx configuration
cd /opt/election-system/app
cp nginx/sites-available/election-system-ssl nginx/sites-available/election-system

# 6. Update environment files
sed -i 's|http://voting.yourdomain.com|https://voting.yourdomain.com|g' backend/.env.production
sed -i 's|http://voting.yourdomain.com|https://voting.yourdomain.com|g' frontend/.env.production

# 7. Restart containers
docker-compose down && docker-compose up -d
```

## Testing SSL Configuration

```bash
# Test HTTPS connection
curl -I https://voting.yourdomain.com

# Test SSL certificate
echo | openssl s_client -connect voting.yourdomain.com:443 -servername voting.yourdomain.com 2>/dev/null | openssl x509 -noout -dates

# Test SSL rating (external)
# Visit: https://www.ssllabs.com/ssltest/

# Check for mixed content
curl -s https://voting.yourdomain.com | grep -i "http://"
```

## Monitoring SSL Health

```bash
# Check certificate expiration
sudo certbot certificates

# Monitor renewal logs
sudo journalctl -u cron | grep certbot

# Check nginx error logs
docker-compose logs nginx | grep -i ssl

# Monitor application logs
docker-compose logs -f
```

## Emergency SSL Disable

If SSL is causing issues and you need to quickly disable it:

```bash
cd /opt/election-system/app

# Use HTTP-only configuration
cp nginx/sites-available/election-system-http nginx/sites-available/election-system

# Update environment files
sed -i 's|https://|http://|g' backend/.env.production
sed -i 's|https://|http://|g' frontend/.env.production

# Restart containers
docker-compose restart
```

## Getting Help

If you continue to experience SSL issues:

1. Check the application logs: `docker-compose logs`
2. Verify DNS configuration with your domain provider
3. Ensure firewall allows ports 80 and 443
4. Test from multiple locations/devices
5. Consider using a different SSL provider if Let's Encrypt fails

## Useful Commands Reference

```bash
# SSL Certificate Management
sudo certbot certificates                    # List certificates
sudo certbot renew --dry-run                # Test renewal
sudo certbot delete --cert-name voting.yourdomain.com  # Delete certificate

# Nginx Management
sudo nginx -t                               # Test configuration
sudo nginx -s reload                        # Reload configuration
docker-compose restart nginx               # Restart nginx container

# SSL Testing
openssl s_client -connect voting.yourdomain.com:443  # Test SSL connection
curl -vI https://voting.yourdomain.com      # Verbose HTTPS test

# Container Management
docker-compose ps                          # Check container status
docker-compose logs nginx                  # Check nginx logs
docker-compose restart                     # Restart all containers
```