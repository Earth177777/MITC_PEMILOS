#!/bin/bash

# SMA Maitreyawira Electronic Voting System - VPS Deployment Script
# This script automates the deployment process on Ubuntu VPS

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="election-system"
APP_DIR="/opt/election-system"
DOMAIN=""  # Will be set during deployment
EMAIL=""   # Will be set during deployment
USE_SSL=false  # Will be set during deployment

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
check_root() {
    if [[ $EUID -eq 0 ]]; then
        print_error "This script should not be run as root for security reasons."
        print_status "Please run as a regular user with sudo privileges."
        exit 1
    fi
}

# Update system packages
update_system() {
    print_status "Updating system packages..."
    sudo apt update && sudo apt upgrade -y
    print_success "System packages updated"
}

# Install Docker and Docker Compose
install_docker() {
    print_status "Installing Docker and Docker Compose..."
    
    # Remove old versions
    sudo apt remove -y docker docker-engine docker.io containerd runc 2>/dev/null || true
    
    # Install dependencies
    sudo apt install -y apt-transport-https ca-certificates curl gnupg lsb-release
    
    # Add Docker GPG key
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
    
    # Add Docker repository
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    
    # Install Docker
    sudo apt update
    sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
    
    # Add user to docker group
    sudo usermod -aG docker $USER
    
    # Install Docker Compose (standalone)
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    
    print_success "Docker and Docker Compose installed"
}

# Install and configure firewall
setup_firewall() {
    print_status "Setting up UFW firewall..."
    
    sudo ufw --force reset
    sudo ufw default deny incoming
    sudo ufw default allow outgoing
    
    # Allow SSH (adjust port if needed)
    sudo ufw allow 22/tcp
    
    # Allow HTTP and HTTPS
    sudo ufw allow 80/tcp
    sudo ufw allow 443/tcp
    
    # Enable firewall
    sudo ufw --force enable
    
    print_success "Firewall configured"
}

# Create application directory structure
setup_directories() {
    print_status "Creating application directories..."
    
    sudo mkdir -p $APP_DIR
    sudo mkdir -p $APP_DIR/data
    sudo mkdir -p $APP_DIR/logs
    sudo mkdir -p $APP_DIR/backups
    sudo mkdir -p $APP_DIR/ssl
    
    # Set ownership
    sudo chown -R $USER:$USER $APP_DIR
    
    print_success "Application directories created"
}

# Install SSL certificate using Let's Encrypt
install_ssl() {
    print_status "Installing SSL certificate..."
    
    # Stop any running containers that might use port 80
    print_status "Stopping containers temporarily for certificate generation..."
    cd $APP_DIR/app && docker-compose down || true
    
    # Install Certbot
    sudo apt install -y certbot
    
    # Generate certificate
    print_status "Generating SSL certificate for voting.$DOMAIN..."
    sudo certbot certonly --standalone --agree-tos --no-eff-email --email $EMAIL -d voting.$DOMAIN
    
    if [ $? -eq 0 ]; then
        # Copy certificates to app directory
        sudo cp /etc/letsencrypt/live/voting.$DOMAIN/fullchain.pem $APP_DIR/ssl/your-cert.pem
        sudo cp /etc/letsencrypt/live/voting.$DOMAIN/privkey.pem $APP_DIR/ssl/your-key.pem
        
        # Generate DH parameters
        print_status "Generating DH parameters (this may take a while)..."
        sudo openssl dhparam -out $APP_DIR/ssl/dhparam.pem 2048
        
        # Set permissions
        sudo chown -R $USER:$USER $APP_DIR/ssl
        sudo chmod 600 $APP_DIR/ssl/*
        
        # Setup auto-renewal
        echo "0 12 * * * /usr/bin/certbot renew --quiet --deploy-hook 'cd $APP_DIR/app && docker-compose restart nginx'" | sudo crontab -
        
        # Use SSL-enabled nginx configuration
        cp nginx/sites-available/election-system-ssl nginx/sites-available/election-system
        
        print_success "SSL certificate installed successfully"
        USE_SSL=true
    else
        print_error "Failed to generate SSL certificate. Continuing with HTTP only."
        USE_SSL=false
    fi
}

# Deploy application
deploy_app() {
    print_status "Deploying application..."
    
    # Copy application files
    cp -r . $APP_DIR/app/
    cd $APP_DIR/app/
    
    # Update environment files with actual domain
    sed -i "s/yourdomain.com/voting.$DOMAIN/g" frontend/.env.production
    sed -i "s/yourdomain.com/voting.$DOMAIN/g" backend/.env.production
    sed -i "s/yourdomain.com/voting.$DOMAIN/g" nginx/sites-available/election-system
    
    # Generate secure secrets
    JWT_SECRET=$(openssl rand -base64 32)
    SESSION_SECRET=$(openssl rand -base64 32)
    ENCRYPTION_KEY=$(openssl rand -hex 16)
    
    # Update backend environment with generated secrets
    sed -i "s/CHANGE_THIS_TO_A_STRONG_SECRET_KEY_32_CHARS_MIN/$JWT_SECRET/g" backend/.env.production
    sed -i "s/CHANGE_THIS_TO_A_STRONG_SESSION_SECRET/$SESSION_SECRET/g" backend/.env.production
    sed -i "s/CHANGE_THIS_TO_32_CHARACTER_ENCRYPTION_KEY/$ENCRYPTION_KEY/g" backend/.env.production
    
    print_warning "Please update the ADMIN_PASSWORD_HASH in backend/.env.production"
    print_warning "Generate it using: node -e \"console.log(require('bcrypt').hashSync('your-password', 12))\""
    
    # Build and start services
    docker-compose -f docker-compose.production.yml up -d --build
    
    print_success "Application deployed"
}

# Setup monitoring
setup_monitoring() {
    print_status "Setting up monitoring..."
    
    # Create monitoring script
    cat > $APP_DIR/monitor.sh << 'EOF'
#!/bin/bash
# Simple monitoring script

APP_DIR="/opt/election-system/app"
LOG_FILE="/opt/election-system/logs/monitor.log"

cd $APP_DIR

# Check if containers are running
if ! docker-compose -f docker-compose.production.yml ps | grep -q "Up"; then
    echo "$(date): Containers not running, attempting restart" >> $LOG_FILE
    docker-compose -f docker-compose.production.yml up -d
fi

# Check disk space
DISK_USAGE=$(df /opt | tail -1 | awk '{print $5}' | sed 's/%//')
if [ $DISK_USAGE -gt 80 ]; then
    echo "$(date): Disk usage is ${DISK_USAGE}%" >> $LOG_FILE
fi

# Clean old backups (keep last 30 days)
find /opt/election-system/backups -name "backup_*.sqlite" -mtime +30 -delete
EOF

    chmod +x $APP_DIR/monitor.sh
    
    # Add to crontab
    (crontab -l 2>/dev/null; echo "*/5 * * * * $APP_DIR/monitor.sh") | crontab -
    
    print_success "Monitoring setup complete"
}

# Main deployment function
main() {
    print_status "Starting deployment of $APP_NAME..."
    
    check_root
    update_system
    install_docker
    setup_firewall
    setup_directories
    
    # Get domain and SSL configuration
    echo
    print_status "=== Domain and SSL Configuration ==="
    read -p "Do you have a domain name for this deployment? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        read -p "Enter your domain name (without 'voting.' prefix): " DOMAIN
        read -p "Enter your email for Let's Encrypt: " EMAIL
        
        echo
        print_status "Domain will be: voting.$DOMAIN"
        read -p "Do you want to install SSL certificate? (y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            install_ssl
        else
            print_warning "Continuing without SSL. Application will use HTTP only."
            USE_SSL=false
        fi
    else
        print_warning "No domain configured. Application will be accessible via IP address only."
        DOMAIN="localhost"
        USE_SSL=false
    fi
    
    deploy_app
    setup_monitoring
    
    print_success "Deployment completed successfully!"
    
    # Display access information
    echo
    print_status "=== Access Information ==="
    if [ "$USE_SSL" = true ]; then
        print_success "Application is available at: https://voting.$DOMAIN"
        print_success "Admin panel: https://voting.$DOMAIN/admin"
        print_success "API health check: https://voting.$DOMAIN/api/health"
    else
        if [ "$DOMAIN" = "localhost" ]; then
            print_success "Application is available at: http://$(curl -s ifconfig.me):80"
            print_success "Admin panel: http://$(curl -s ifconfig.me):80/admin"
            print_success "API health check: http://$(curl -s ifconfig.me):80/api/health"
        else
            print_success "Application is available at: http://voting.$DOMAIN"
            print_success "Admin panel: http://voting.$DOMAIN/admin"
            print_success "API health check: http://voting.$DOMAIN/api/health"
        fi
    fi
    
    echo
    print_warning "Please reboot the system to ensure all changes take effect."
    print_warning "After reboot, you may need to run: newgrp docker"
    
    if [ "$USE_SSL" = true ]; then
        print_status "SSL certificate will auto-renew. Check renewal with: sudo certbot renew --dry-run"
    fi
}

# Run main function
main "$@"