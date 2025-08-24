# VPS Deployment Guide

This guide provides comprehensive instructions for deploying the SMA Maitreyawira Electronic Voting System on an Ubuntu VPS.

## Prerequisites

### VPS Requirements
- **OS**: Ubuntu 20.04 LTS or newer
- **RAM**: Minimum 2GB (4GB recommended)
- **Storage**: Minimum 20GB SSD
- **CPU**: 2 cores minimum
- **Network**: Public IP address
- **Domain**: Optional but recommended for SSL

### Local Requirements
- Git installed
- SSH access to your VPS
- Domain name (optional, for SSL setup)

## Quick Deployment (Automated)

### Step 1: Prepare Your VPS

1. **Connect to your VPS**:
   ```bash
   ssh root@your-vps-ip
   ```

2. **Create a non-root user**:
   ```bash
   adduser deploy
   usermod -aG sudo deploy
   su - deploy
   ```

3. **Update the system**:
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

### Step 2: Clone and Deploy

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-repo/sma-maitreyawira-voting-system.git
   cd sma-maitreyawira-voting-system
   ```

2. **Run the deployment script**:
   ```bash
   ./deploy.sh
   ```

3. **Follow the prompts**:
   - Enter your domain name (if using SSL)
   - Enter your email for Let's Encrypt
   - Wait for the deployment to complete

### Step 3: Configure Admin Password

1. **Generate admin password hash**:
   ```bash
   node -e "console.log(require('bcrypt').hashSync('your-secure-password', 12))"
   ```

2. **Update the backend environment**:
   ```bash
   nano /opt/election-system/app/backend/.env.production
   ```
   Replace `CHANGE_THIS_TO_YOUR_BCRYPT_HASHED_PASSWORD` with the generated hash.

3. **Restart the application**:
   ```bash
   cd /opt/election-system/app
   docker-compose -f docker-compose.production.yml restart backend
   ```

## Manual Deployment

If you prefer manual deployment or need to customize the setup:

### Step 1: Install Dependencies

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Logout and login again to apply docker group changes
```

### Step 2: Setup Application Directory

```bash
sudo mkdir -p /opt/election-system/{data,logs,backups,ssl}
sudo chown -R $USER:$USER /opt/election-system
```

### Step 3: Configure Environment Files

1. **Backend Environment** (`backend/.env.production`):
   ```env
   NODE_ENV=production
   PORT=3001
   DATABASE_PATH=/app/db/electronic_voting_system.sqlite
   JWT_SECRET=your-generated-secret
   ADMIN_PASSWORD_HASH=your-bcrypt-hash
   ALLOWED_ORIGINS=https://yourdomain.com
   ```

2. **Frontend Environment** (`frontend/.env.production`):
   ```env
   VITE_API_URL=https://yourdomain.com/api
   VITE_WS_URL=wss://yourdomain.com
   ```

### Step 4: SSL Certificate (Optional)

```bash
# Install Certbot
sudo apt install certbot

# Generate certificate
sudo certbot certonly --standalone -d voting.yourdomain.com

# Copy certificates
sudo cp /etc/letsencrypt/live/voting.yourdomain.com/fullchain.pem /opt/election-system/ssl/your-cert.pem
sudo cp /etc/letsencrypt/live/voting.yourdomain.com/privkey.pem /opt/election-system/ssl/your-key.pem

# Generate DH parameters
sudo openssl dhparam -out /opt/election-system/ssl/dhparam.pem 2048
```

### Step 5: Deploy Application

```bash
# Copy application files
cp -r . /opt/election-system/app/
cd /opt/election-system/app/

# Update configuration files with your domain
sed -i 's/yourdomain.com/voting.your-actual-domain.com/g' nginx/sites-available/election-system
sed -i 's/yourdomain.com/voting.your-actual-domain.com/g' frontend/.env.production

# Start services
docker-compose -f docker-compose.production.yml up -d --build
```

## Security Configuration

### Firewall Setup

```bash
# Configure UFW
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
```

### SSL Security Headers

The Nginx configuration includes security headers:
- HSTS (HTTP Strict Transport Security)
- CSP (Content Security Policy)
- X-Frame-Options
- X-Content-Type-Options
- X-XSS-Protection

### Rate Limiting

- API endpoints: 10 requests/second
- Login endpoint: 1 request/second
- Burst allowance configured

## Monitoring and Maintenance

### Health Checks

The system includes built-in health checks:
- **Frontend**: `https://voting.yourdomain.com/health`
- **Backend**: `https://voting.yourdomain.com/api/health`

### Log Management

```bash
# View application logs
docker-compose -f docker-compose.production.yml logs -f

# View specific service logs
docker-compose -f docker-compose.production.yml logs -f backend
docker-compose -f docker-compose.production.yml logs -f frontend

# View Nginx logs
sudo tail -f /opt/election-system/logs/nginx/access.log
sudo tail -f /opt/election-system/logs/nginx/error.log
```

### Database Backups

Automatic backups are configured:
- **Frequency**: Daily
- **Retention**: 30 days
- **Location**: `/opt/election-system/backups/`

### Manual Backup

```bash
# Create manual backup
timestamp=$(date +"%Y%m%d_%H%M%S")
docker cp election-backend:/app/db/electronic_voting_system.sqlite /opt/election-system/backups/manual_backup_$timestamp.sqlite
```

### Updates and Maintenance

```bash
# Update application
cd /opt/election-system/app/
git pull origin main
docker-compose -f docker-compose.production.yml up -d --build

# Update system packages
sudo apt update && sudo apt upgrade -y

# Renew SSL certificates (automatic via cron)
sudo certbot renew --dry-run
```

## Troubleshooting

### Common Issues

1. **Containers not starting**:
   ```bash
   docker-compose -f docker-compose.production.yml ps
   docker-compose -f docker-compose.production.yml logs
   ```

2. **SSL certificate issues**:
   ```bash
   sudo certbot certificates
   sudo nginx -t
   ```

3. **Database connection issues**:
   ```bash
   docker exec -it election-backend ls -la /app/db/
   docker exec -it election-backend sqlite3 /app/db/electronic_voting_system.sqlite ".tables"
   ```

4. **Permission issues**:
   ```bash
   sudo chown -R $USER:$USER /opt/election-system
   ```

### Performance Monitoring

```bash
# Check resource usage
docker stats

# Check disk space
df -h

# Check memory usage
free -h

# Check system load
top
```

## Security Best Practices

1. **Regular Updates**: Keep system and Docker images updated
2. **Strong Passwords**: Use complex admin passwords
3. **SSH Security**: Disable root login, use key-based authentication
4. **Firewall**: Only open necessary ports
5. **SSL/TLS**: Always use HTTPS in production
6. **Monitoring**: Set up log monitoring and alerts
7. **Backups**: Regular database backups
8. **Access Control**: Limit admin access

## Environment Variables Reference

### Backend (.env.production)

| Variable | Description | Example |
|----------|-------------|----------|
| `NODE_ENV` | Environment mode | `production` |
| `PORT` | Backend port | `3001` |
| `DATABASE_PATH` | SQLite database path | `/app/db/electronic_voting_system.sqlite` |
| `JWT_SECRET` | JWT signing secret | `your-secret-key` |
| `ADMIN_PASSWORD_HASH` | Bcrypt hashed admin password | `$2b$12$...` |
| `ALLOWED_ORIGINS` | CORS allowed origins | `https://voting.yourdomain.com` |

### Frontend (.env.production)

| Variable | Description | Example |
|----------|-------------|----------|
| `VITE_API_URL` | Backend API URL | `https://voting.yourdomain.com/api` |
| `VITE_WS_URL` | WebSocket URL | `wss://voting.yourdomain.com` |

---

**Note**: Replace `yourdomain.com` with your actual domain name throughout the configuration files. The system is configured to use a subdomain `voting.yourdomain.com`.

---

### Prerequisites

- An Ubuntu VPS (22.04 LTS recommended).
- SSH access to your server.
- A domain name pointing to your server's IP address (optional, but recommended for production). You can replace all instances of `<your_domain_or_ip>` with your server's IP if you don't have a domain.

---

### Step 1: Install Server Prerequisites

First, we need to install the necessary software on the server: **Node.js** (to run the app), **MongoDB** (the database), **Nginx** (a web server to manage traffic), and **PM2** (a process manager to keep the backend running).

1.  **Update Your Server:**
    ```bash
    sudo apt update
    sudo apt upgrade -y
    ```

2.  **Install Node.js (v18 is recommended):**
    ```bash
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt install -y nodejs
    ```

3.  **Install MongoDB:**
    ```bash
    sudo apt install -y mongodb
    sudo systemctl start mongodb
    sudo systemctl enable mongodb
    ```

4.  **Install Nginx Web Server:**
    ```bash
    sudo apt install -y nginx
    ```

5.  **Install PM2 Process Manager:**
    ```bash
    sudo npm install pm2 -g
    ```

---

### Step 2: Configure the Firewall

For security, we'll only allow traffic for SSH, HTTP, and HTTPS through the firewall.

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```
When prompted, enter `y` to proceed.

---

### Step 3: Deploy the Application Code

Clone your repository onto the server.

```bash
# Replace with your actual repository URL
git clone <your_repository_url>

# Navigate into the project directory
cd <your_project_folder> # e.g., electronic-voting-system-monorepo
```

---

### Step 4: Configure and Run the Backend

1.  **Install Backend Dependencies:**
    ```bash
    npm install --workspace=backend
    ```

2.  **Configure Environment Variables:**
    ```bash
    cd backend
    cp .env.example .env
    ```
    The default `.env` values are suitable for a local MongoDB instance. No changes are needed if you installed MongoDB on the same server.

3.  **Return to the Root Directory:**
    ```bash
    cd ..
    ```

4.  **Seed the Database (First Time Only):**
    This populates the database with the initial candidate data.
    ```bash
    npm run seed --workspace=backend
    ```

5.  **Build the Backend for Production:**
    ```bash
    npm run build --workspace=backend
    ```

6.  **Start the Backend with PM2:**
    PM2 will run the backend service in the background and automatically restart it if it crashes.
    ```bash
    pm2 start backend/dist/main.js --name "election-api"
    ```
    You can check the status of your running application with `pm2 list`.

---

### Step 5: Configure and Build the Frontend

1.  **Install Frontend Dependencies:**
    ```bash
    npm install --workspace=frontend
    ```

2.  **Configure Production Environment:**
    Create a production environment file for the frontend.
    ```bash
    cd frontend
    touch .env.production
    ```
    Open this new file (`nano .env.production`) and add the public URL for your API. **Replace `<your_domain_or_ip>` with your server's domain or IP address.** This is crucial for the frontend to know where to send API requests.

    ```
    VITE_API_URL=http://<your_domain_or_ip>/api
    ```

3.  **Build the Frontend for Production:**
    ```bash
    npm run build
    ```
    This command creates an optimized static `dist` folder inside the `frontend` directory.

4.  **Return to the Root Directory:**
    ```bash
    cd ..
    ```

---

### Step 6: Configure Nginx as a Reverse Proxy

Nginx will serve your built React frontend and route all API traffic (`/api/...`) to your Nest.js backend service, which is running on port 3001.

1.  **Create a new Nginx configuration file:**
    ```bash
    sudo nano /etc/nginx/sites-available/election
    ```

2.  **Paste the following configuration.** Remember to:
    -   Replace `<your_domain_or_ip>` with your server's domain or IP address.
    -   Update the `root` path to the absolute path of your project's `frontend/dist` directory.

    ```nginx
    server {
        listen 80;
        server_name <your_domain_or_ip>;

        # Path to your frontend's build output
        # Example: /home/ubuntu/electronic-voting-system-monorepo/frontend/dist
        root /path/to/your/project/frontend/dist;
        index index.html;

        location / {
            # This is a standard rule for single-page applications like React
            try_files $uri $uri/ /index.html;
        }

        # Route API and WebSocket requests to the backend (running on port 3001)
        location /api/ {
            proxy_pass http://localhost:3001/;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
        }
    }
    ```

3.  **Enable the new configuration by creating a symbolic link:**
    ```bash
    sudo ln -s /etc/nginx/sites-available/election /etc/nginx/sites-enabled/
    ```

4.  **Test the Nginx configuration for syntax errors:**
    ```bash
    sudo nginx -t
    ```
    If you see `syntax is ok` and `test is successful`, you can proceed.

5.  **Restart Nginx to apply the changes:**
    ```bash
    sudo systemctl restart nginx
    ```

---

### Step 7: Access Your Application

Your deployment is now complete! You can access the electronic voting system by navigating to your server's domain or IP address in your web browser.

`http://<your_domain_or_ip>`

Nginx will serve the React application, and any API or WebSocket requests will be securely proxied to the Nest.js backend managed by PM2.
